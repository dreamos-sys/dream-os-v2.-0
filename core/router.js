/**
 * core/router.js
 * Dream OS v2.0 — Module Router
 * ✅ FIXED: Passing semua parameter ke modul
 * ✅ FIXED: Support export default DAN export { init }
 * ✅ Supabase, currentUser, showToast, dll dikirim dengan benar
 * Bi idznillah 💚
 */

import { store }     from './store.js';
import { showToast } from './components.js';
import { supabase }  from './supabase.js';

/* ══════════════════════════════════════════════════════════
   MODULE REGISTRY — daftarkan semua modul di sini
══════════════════════════════════════════════════════════ */
const MODULE_REGISTRY = {
    commandcenter: () => import('../modules/commandcenter/module.js'),
    booking:       () => import('../modules/booking/module.js'),
    // tambah modul lain di sini:
    // inventory:  () => import('../modules/inventory/module.js'),
    // k3:         () => import('../modules/k3/module.js'),
    // spj:        () => import('../modules/spj/module.js'),
};

/* ══════════════════════════════════════════════════════════
   CLEANUP TRACKER
══════════════════════════════════════════════════════════ */
let _activeCleanup = null;
let _activeModuleId = null;

/* ══════════════════════════════════════════════════════════
   LOAD MODULE — core function
══════════════════════════════════════════════════════════ */
export async function loadModule(moduleId, extraParams = {}) {

    // ── Permission check ──────────────────────────────
    const currentUser = store.get('currentUser');
    const userModules = store.get('modules') || [];
    const hasAccess   = userModules.includes('all') ||
                        userModules.includes(moduleId) ||
                        (currentUser?.perms || []).includes('all');

    if (!hasAccess) {
        showToast('❌ Anda tidak memiliki akses ke modul ini', 'error');
        return { success: false, reason: 'no_access' };
    }

    // ── Module exists? ────────────────────────────────
    if (!MODULE_REGISTRY[moduleId]) {
        showToast(`❌ Modul "${moduleId}" tidak ditemukan`, 'error');
        return { success: false, reason: 'not_found' };
    }

    // ── Cleanup modul sebelumnya ──────────────────────
    await _cleanup();

    // ── Show UI ───────────────────────────────────────
    const win     = document.getElementById('module-window');
    const content = document.getElementById('module-content');
    if (!win || !content) {
        console.error('[Router] #module-window atau #module-content tidak ditemukan!');
        return { success: false, reason: 'no_container' };
    }

    win.classList.remove('hidden');
    content.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:3rem;color:#94a3b8">
            <div style="width:36px;height:36px;border:3px solid rgba(16,185,129,.2);border-top-color:#10b981;border-radius:50%;animation:router-spin 1s linear infinite;margin-bottom:1rem"></div>
            <p style="font-size:.85rem">Memuat ${moduleId}...</p>
            <p style="font-size:.72rem;margin-top:.35rem;color:#475569">اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ</p>
        </div>
        <style>@keyframes router-spin{to{transform:rotate(360deg)}}</style>
    `;

    try {
        // ── Dynamic import ────────────────────────────
        const mod = await MODULE_REGISTRY[moduleId]();

        // ── Resolve init function ─────────────────────
        // Support export default DAN export { init }
        const initFn = mod.default || mod.init;

        if (typeof initFn !== 'function') {
            throw new Error(`Modul "${moduleId}" tidak punya export default function atau export { init }`);
        }

        // ── Build parameter bundle ────────────────────
        // Semua yang dibutuhkan modul tersedia di sini
        const params = _buildParams(currentUser, extraParams);

        // ── Call init ────────────────────────────────
        // Support dua signature:
        // 1. export default async function(config, utils, supabase, currentUser, ...)
        // 2. export async function init(params)
        let cleanupFn;

        if (mod.default) {
            // Signature lama: positional params
            cleanupFn = await mod.default(
                params.config,
                params.utils,
                params.supabase,
                params.currentUser,
                params.showToast,
                params.showModal,
                params.loader,
                params.translations,
                params.currentLang
            );
        } else {
            // Signature baru: single object
            cleanupFn = await mod.init(params);
        }

        // Track cleanup
        if (typeof cleanupFn === 'function') {
            _activeCleanup = cleanupFn;
        }
        _activeModuleId = moduleId;

        // Global close handler untuk tombol Kembali di dalam modul
        window.closeModule    = closeModule;
        window.doCloseModule  = closeModule;

        console.log(`✅ [Router] Modul "${moduleId}" loaded`);
        return { success: true, moduleId };

    } catch (err) {
        console.error(`❌ [Router] Gagal load "${moduleId}":`, err);
        showToast(`❌ Gagal memuat modul: ${err.message}`, 'error');

        content.innerHTML = `
            <div style="text-align:center;padding:3rem;color:#94a3b8">
                <div style="font-size:2.5rem;margin-bottom:1rem">❌</div>
                <h3 style="color:#e2e8f0;font-size:1rem;font-weight:700;margin-bottom:.5rem">Gagal Memuat Modul</h3>
                <p style="font-size:.82rem;margin-bottom:1.5rem;color:#64748b">${err.message}</p>
                <button onclick="window.doCloseModule()" style="background:#10b981;color:#020617;border:none;border-radius:10px;padding:.6rem 1.4rem;font-weight:700;cursor:pointer;font-family:inherit">
                    ← Kembali
                </button>
            </div>
        `;
        return { success: false, error: err.message };
    }
}

/* ══════════════════════════════════════════════════════════
   CLOSE MODULE
══════════════════════════════════════════════════════════ */
export async function closeModule() {
    await _cleanup();

    const win     = document.getElementById('module-window');
    const content = document.getElementById('module-content');
    if (win)     win.classList.add('hidden');
    if (content) content.innerHTML = '';

    _activeModuleId = null;
    console.log('[Router] Module closed');
}

/* ══════════════════════════════════════════════════════════
   BUILD PARAMS — semua yang dibutuhkan modul
══════════════════════════════════════════════════════════ */
function _buildParams(currentUser, extra = {}) {

    // Config dari store atau fallback
    const config = store.get('config') || {
        appName:  'Dream OS',
        version:  '2.0',
        location: 'Depok'
    };

    // Utils bundle
    const utils = {
        showToast,
        formatRp:   (n) => 'Rp ' + Number(n||0).toLocaleString('id-ID'),
        formatDate: (d) => d ? new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '—',
        formatDT:   (d) => d ? new Date(d).toLocaleString('id-ID',   { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—',
        esc:        (s) => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'),
    };

    // showModal — gunakan yang ada di window atau fallback sederhana
    const showModal = window.showModal || function(content, opts = {}) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem';
        overlay.innerHTML = `<div style="background:#1e293b;border-radius:16px;padding:1.5rem;max-width:500px;width:100%;border:1px solid rgba(16,185,129,.3)">${content}</div>`;
        overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });
        document.body.appendChild(overlay);
        return { close: () => overlay.remove() };
    };

    // Loader
    const loader = window.loader || {
        show: (msg) => console.log('[loader]', msg),
        hide: () => {}
    };

    return {
        config,
        utils,
        supabase,       // ← Supabase client dari core/supabase.js
        currentUser,    // ← User yang sedang login dari store
        showToast,
        showModal,
        loader,
        translations: window.translations || {},
        currentLang:  store.get('lang') || 'id',
        ...extra        // extra params dari caller
    };
}

/* ══════════════════════════════════════════════════════════
   CLEANUP HELPER
══════════════════════════════════════════════════════════ */
async function _cleanup() {
    if (typeof _activeCleanup === 'function') {
        try { await _activeCleanup(); }
        catch(e) { console.warn('[Router] cleanup error:', e.message); }
        _activeCleanup = null;
    }
}

/* ══════════════════════════════════════════════════════════
   GLOBAL HELPERS — untuk tombol di dalam modul
══════════════════════════════════════════════════════════ */
window.closeModule   = closeModule;
window.doCloseModule = closeModule;
window.loadModule    = loadModule;
