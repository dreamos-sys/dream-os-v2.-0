/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  Dream OS - Command Hub v2.1 (Integration Edition)      ║
 * ║  🤲 Bi idznillah - Central Module Orchestrator          ║
 * ╚══════════════════════════════════════════════════════════╝
 */

import { eventBus } from './eventBus.js';
import { store } from './store.js';
import { showToast } from './components.js';
import { errorCollector } from './error-collector.js';

class CommandHub {
    constructor() {
        this.loadedModules = new Map();      // Track loaded modules
        this.activeModule = null;             // Currently visible module
        this.moduleBasePath = './modules/';   // Base path for dynamic imports
        this.init();
    }

    init() {
        console.log('🧠 [CommandHub] Initializing...');
        
        // Global error handler for module loading
        window.addEventListener('unhandledrejection', (e) => {
            errorCollector.capture(e.reason, 'unhandled_promise', {
                module: this.activeModule
            });
        });

        // Listen for module navigation requests
        eventBus.on('module:navigate', async ({ moduleId, params }) => {
            await this.loadModule(moduleId, params);
        });

        // Listen for module close requests
        eventBus.on('module:close', () => {
            this.closeModule();
        });

        // Broadcast system heartbeat every 30s
        setInterval(() => this.broadcastHeartbeat(), 30000);
        
        console.log('✅ [CommandHub] Ready');
    }

    /**
     * 📦 LOAD MODULE - Dynamic import + init + track
     */
    async loadModule(moduleId, params = {}) {        console.log(`📦 [CommandHub] Loading: ${moduleId}`, params);
        
        try {
            // Close current module first (cleanup)
            if (this.activeModule) {
                await this.closeModule();
            }

            // Show loading state
            this.showModuleLoading(moduleId);

            // Dynamic import - path relatif dari index.html
            const modulePath = `${this.moduleBasePath}${moduleId}/module.js`;
            const mod = await import(modulePath);

            // Validate module exports
            if (!mod.init || typeof mod.init !== 'function') {
                throw new Error(`Module "${moduleId}" missing export: async function init()`);
            }

            // Initialize module
            await mod.init(params);

            // Track loaded module
            this.loadedModules.set(moduleId, {
                instance: mod,
                loadedAt: new Date().toISOString(),
                params
            });

            this.activeModule = moduleId;

            // Broadcast success
            eventBus.emit('module:loaded', { moduleId, params });
            
            console.log(`✅ [CommandHub] Loaded: ${moduleId}`);
            return { success: true, moduleId };

        } catch (err) {
            console.error(`❌ [CommandHub] Failed to load ${moduleId}:`, err);
            
            errorCollector.capture(err, 'module_load', { moduleId, params });
            showToast(`❌ Gagal load modul: ${moduleId}`, 'error');
            
            // Show error UI
            this.showModuleError(moduleId, err.message);
            
            eventBus.emit('module:error', { moduleId, error: err.message });
            return { success: false, error: err.message };
        }    }

    /**
     * 🚪 CLOSE MODULE - Cleanup + hide UI
     */
    async closeModule() {
        if (!this.activeModule) return;
        
        console.log(`🚪 [CommandHub] Closing: ${this.activeModule}`);
        
        const mod = this.loadedModules.get(this.activeModule);
        
        // Call module cleanup if exists
        if (mod?.instance?.cleanup && typeof mod.instance.cleanup === 'function') {
            try {
                await mod.instance.cleanup();
            } catch (err) {
                console.warn(`⚠️ [CommandHub] Cleanup error for ${this.activeModule}:`, err);
            }
        }

        // Hide module UI
        this.hideModuleContent();

        // Clear active module
        this.activeModule = null;

        // Broadcast closed
        eventBus.emit('module:closed', { moduleId: this.activeModule });
        
        console.log(`✅ [CommandHub] Closed: ${this.activeModule}`);
    }

    /**
     * 🔁 RELOAD MODULE - Fresh load (for refresh)
     */
    async reloadModule(moduleId) {
        // Remove from cache to force re-import
        const modulePath = `${this.moduleBasePath}${moduleId}/module.js`;
        
        // Note: Dynamic import caching is browser-dependent
        // For true reload, you may need to add cache-busting query param
        
        return await this.loadModule(moduleId);
        // Browser will use cached version unless you do:
        // await import(`${modulePath}?v=${Date.now()}`);
    }

    /**
     * 🔄 NAVIGATE BETWEEN MODULES - With params     */
    async navigate(toModule, params = {}, closeCurrent = true) {
        if (closeCurrent && this.activeModule) {
            await this.closeModule();
        }
        return await this.loadModule(toModule, params);
    }

    /**
     * 📊 GET STATUS - For debugging/monitoring
     */
    getStatus() {
        return {
            activeModule: this.activeModule,
            loadedModules: Array.from(this.loadedModules.keys()),
            moduleCount: this.loadedModules.size,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 💓 BROADCAST HEARTBEAT - System health check
     */
    broadcastHeartbeat() {
        eventBus.emit('system:heartbeat', {
            timestamp: new Date().toISOString(),
            activeModule: this.activeModule,
            loadedModules: Array.from(this.loadedModules.keys()),
            memory: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
            } : null
        });
    }

    // ─────────────────────────────────────────────────────
    // UI HELPERS (override these in your main app if needed)
    // ─────────────────────────────────────────────────────
    
    showModuleLoading(moduleId) {
        const content = document.getElementById('module-content');
        if (content) {
            content.innerHTML = `
                <div class="text-center py-20">
                    <div class="loading-spinner mx-auto mb-4"></div>
                    <p class="crystal-text">Memuat ${moduleId}...</p>
                    <p class="text-xs text-slate-400 mt-2">🕌 اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ</p>
                </div>
            `;
            // Show module window if hidden            const win = document.getElementById('module-window');
            if (win) win.classList.remove('hidden');
        }
    }

    showModuleError(moduleId, message) {
        const content = document.getElementById('module-content');
        if (content) {
            content.innerHTML = `
                <div class="text-center py-20">
                    <div class="text-5xl mb-4">❌</div>
                    <h3 class="text-xl font-bold mb-2">Gagal Memuat Modul</h3>
                    <p class="text-slate-400 mb-4">${message}</p>
                    <button onclick="window.doCloseModule()" class="btn-crystal">
                        <i class="fas fa-arrow-left mr-2"></i>Kembali
                    </button>
                </div>
            `;
        }
    }

    hideModuleContent() {
        const content = document.getElementById('module-content');
        if (content) content.innerHTML = '';
        
        // Optional: hide module window
        // const win = document.getElementById('module-window');
        // if (win) win.classList.add('hidden');
    }
}

// 🚀 Export singleton
export const commandHub = new CommandHub();
window.commandHub = commandHub; // Global access

console.log('🧠 [CommandHub] Singleton exported');
