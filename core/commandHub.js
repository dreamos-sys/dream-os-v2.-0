/**
 * core/commandHub.js
 * Dream OS v2.1 — Central Module Orchestrator FIXED
 * ✅ Support export default function (bukan hanya export { init })
 * ✅ Passing supabase, currentUser, showToast, dll ke semua modul
 * ✅ Cleanup yang benar — tidak render raw JS
 * 🤲 Bi idznillah
 */

import { eventBus }  from './eventBus.js';
import { store }     from './store.js';
import { showToast } from './components.js';
import { errorCollector } from './error-collector.js';

class CommandHub {
    constructor() {
        this.loadedModules = new Map();
        this.activeModule  = null;
        this.moduleBasePath = './modules/';
        this._activeCleanup = null;
        this.init();
    }

    init() {
        console.log('🧠 [CommandHub] Initializing...');

        window.addEventListener('unhandledrejection', (e) => {
            errorCollector.capture(e.reason, 'unhandled_promise', {
                module: this.activeModule
            });
        });

        eventBus.on('module:navigate', async ({ moduleId, params }) => {
            await this.loadModule(moduleId, params);
        });

        eventBus.on('module:close', () => {
            this.closeModule();
        });

        setInterval(() => this.broadcastHeartbeat(), 30000);

        // Global helpers untuk tombol Kembali di dalam modul
        window.closeModule   = () => this.closeModule();
        window.doCloseModule = () => this.closeModule();

        console.log('✅ [CommandHub] Ready');
    }

    /* ════════════════════════════════════════════════════
       📦 LOAD MODULE
    ════════════════════════════════════════════════════ */
    async loadModule(moduleId, params = {}) {
        console.log(`📦 [CommandHub] Loading: ${moduleId}`, params);

        try {
            // Cleanup modul sebelumnya
            if (this.activeModule) {
                await this.closeModule();
            }

            // Show loading
            this.showModuleLoading(moduleId);

            // Dynamic import
            const modulePath = `${this.moduleBasePath}${moduleId}/module.js`;
            const mod = await import(modulePath);

            // ✅ Support export default DAN export { init }
            const initFn = mod.default || mod.init;

            if (!initFn || typeof initFn !== 'function') {
                throw new Error(`Module "${moduleId}" tidak punya export default function atau export { init }`);
            }

            // ✅ Build params lengkap
            const fullParams = this._buildParams(params);

            // ✅ Panggil init dengan semua params
            // Support 2 signature:
            // 1. export default function(config, utils, supabase, currentUser, ...)
            // 2. export function init(paramsObject)
            let cleanupFn;

            if (mod.default) {
                // Positional params — signature Dream OS
                cleanupFn = await mod.default(
                    fullParams.config,
                    fullParams.utils,
                    fullParams.supabase,
                    fullParams.currentUser,
                    fullParams.showToast,
                    fullParams.showModal,
                    fullParams.loader,
                    fullParams.translations,
                    fullParams.currentLang
                );
            } else {
                // Single object params
                cleanupFn = await mod.init(fullParams);
            }

            // ✅ Track cleanup — jangan render return value!
            if (typeof cleanupFn === 'function') {
                this._activeCleanup = cleanupFn;
            }

            // Track loaded module
            this.loadedModules.set(moduleId, {
                instance: mod,
                loadedAt: new Date().toISOString(),
                params
            });

            this.activeModule = moduleId;

            eventBus.emit('module:loaded', { moduleId, params });
            console.log(`✅ [CommandHub] Loaded: ${moduleId}`);
            return { success: true, moduleId };

        } catch (err) {
            console.error(`❌ [CommandHub] Failed to load ${moduleId}:`, err);
            errorCollector.capture(err, 'module_load', { moduleId, params });
            showToast(`❌ Gagal load modul: ${moduleId} — ${err.message}`, 'error');
            this.showModuleError(moduleId, err.message);
            eventBus.emit('module:error', { moduleId, error: err.message });
            return { success: false, error: err.message };
        }
    }

    /* ════════════════════════════════════════════════════
       🚪 CLOSE MODULE
    ════════════════════════════════════════════════════ */
    async closeModule() {
        if (!this.activeModule) return;
        console.log(`🚪 [CommandHub] Closing: ${this.activeModule}`);

        // ✅ Panggil cleanup function (bukan render ke DOM!)
        if (typeof this._activeCleanup === 'function') {
            try {
                await this._activeCleanup();
            } catch (err) {
                console.warn(`⚠️ [CommandHub] Cleanup error:`, err.message);
            }
            this._activeCleanup = null;
        }

        // Fallback: cek cleanup di instance lama
        const mod = this.loadedModules.get(this.activeModule);
        if (mod?.instance?.cleanup && typeof mod.instance.cleanup === 'function') {
            try { await mod.instance.cleanup(); } catch(e) {}
        }

        this.hideModuleContent();
        const closedId = this.activeModule;
        this.activeModule = null;
        eventBus.emit('module:closed', { moduleId: closedId });
        console.log(`✅ [CommandHub] Closed: ${closedId}`);
    }

    /* ════════════════════════════════════════════════════
       🔧 BUILD PARAMS — semua yang dibutuhkan modul
    ════════════════════════════════════════════════════ */
    _buildParams(extra = {}) {
        const currentUser = store.get('currentUser');
        const config = store.get('config') || {
            appName: 'Dream OS', version: '2.0', location: 'Depok'
        };

        // ✅ Supabase dari window (diinit inline di index.html)
        const supabase = window.supabase || null;
        if (!supabase) {
            console.warn('[CommandHub] window.supabase belum ready!');
        }

        const utils = {
            showToast,
            formatRp:   n => 'Rp ' + Number(n||0).toLocaleString('id-ID'),
            formatDate: d => d ? new Date(d).toLocaleDateString('id-ID',
                             { day:'2-digit', month:'short', year:'numeric' }) : '—',
            formatDT:   d => d ? new Date(d).toLocaleString('id-ID',
                             { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—',
            esc:        s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'),
        };

        const showModal = window.showModal || function(html) {
            const o = document.createElement('div');
            o.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem';
            o.innerHTML = `<div style="background:#1e293b;border-radius:16px;padding:1.5rem;max-width:500px;width:100%;border:1px solid rgba(16,185,129,.3)">${html}</div>`;
            o.addEventListener('click', e => { if(e.target===o) o.remove(); });
            document.body.appendChild(o);
            return { close: () => o.remove() };
        };

        return {
            config,
            utils,
            supabase,
            currentUser,
            showToast,
            showModal,
            loader: window.loader || { show: m => console.log('[loader]', m), hide: () => {} },
            translations: window.translations || {},
            currentLang: store.get('lang') || 'id',
            ...extra
        };
    }

    /* ════════════════════════════════════════════════════
       🔄 RELOAD / NAVIGATE
    ════════════════════════════════════════════════════ */
    async reloadModule(moduleId) {
        return await this.loadModule(moduleId);
    }

    async navigate(toModule, params = {}, closeCurrent = true) {
        if (closeCurrent && this.activeModule) {
            await this.closeModule();
        }
        return await this.loadModule(toModule, params);
    }

    /* ════════════════════════════════════════════════════
       📊 STATUS / HEARTBEAT
    ════════════════════════════════════════════════════ */
    getStatus() {
        return {
            activeModule:  this.activeModule,
            loadedModules: Array.from(this.loadedModules.keys()),
            moduleCount:   this.loadedModules.size,
            timestamp:     new Date().toISOString()
        };
    }

    broadcastHeartbeat() {
        eventBus.emit('system:heartbeat', {
            timestamp:     new Date().toISOString(),
            activeModule:  this.activeModule,
            loadedModules: Array.from(this.loadedModules.keys()),
            memory: performance.memory ? {
                used:  Math.round(performance.memory.usedJSHeapSize  / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
            } : null
        });
    }

    /* ════════════════════════════════════════════════════
       🖼️ UI HELPERS
    ════════════════════════════════════════════════════ */
    showModuleLoading(moduleId) {
        const content = document.getElementById('module-content');
        if (content) {
            content.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;
                            justify-content:center;padding:3rem;color:#94a3b8;min-height:200px">
                    <div style="width:36px;height:36px;border:3px solid rgba(16,185,129,.2);
                                border-top-color:#10b981;border-radius:50%;
                                animation:_ch-spin 1s linear infinite;margin-bottom:1rem"></div>
                    <p style="font-size:.85rem">Memuat ${moduleId}...</p>
                    <p style="font-size:.7rem;margin-top:.3rem;color:#475569">
                        اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ
                    </p>
                </div>
                <style>@keyframes _ch-spin{to{transform:rotate(360deg)}}</style>
            `;
            const win = document.getElementById('module-window');
            if (win) win.classList.remove('hidden');
        }
    }

    showModuleError(moduleId, message) {
        const content = document.getElementById('module-content');
        if (content) {
            content.innerHTML = `
                <div style="text-align:center;padding:3rem;color:#94a3b8">
                    <div style="font-size:2.5rem;margin-bottom:1rem">❌</div>
                    <h3 style="color:#e2e8f0;font-size:1rem;font-weight:700;margin-bottom:.5rem">
                        Gagal Memuat Modul</h3>
                    <p style="font-size:.8rem;margin-bottom:1.5rem;color:#64748b;
                               word-break:break-all">${message}</p>
                    <button onclick="window.doCloseModule()"
                        style="background:#10b981;color:#020617;border:none;border-radius:10px;
                               padding:.6rem 1.4rem;font-weight:700;cursor:pointer;font-family:inherit">
                        ← Kembali
                    </button>
                </div>
            `;
        }
    }

    hideModuleContent() {
        const content = document.getElementById('module-content');
        if (content) content.innerHTML = '';
        // Optional: sembunyikan window
        // const win = document.getElementById('module-window');
        // if (win) win.classList.add('hidden');
    }
}

/* ════════════════════════════════════════════════════════
   🚀 Export singleton
════════════════════════════════════════════════════════ */
export const commandHub = new CommandHub();
window.commandHub = commandHub;

console.log('🧠 [CommandHub] Singleton exported ✅');
