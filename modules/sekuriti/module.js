/**
 * modules/sekuriti/module.js
 * Dream OS v2.0 — Sekuriti Module (ENTERPRISE EDITION)
 * ✅ RBAC • Smart Cache • Observability • Offline-First
 * 
 * Signature: (config, utils, supabase, currentUser, showToast, showModal, loader, translations, currentLang, container)
 * 
 * Bi idznillah 💚
 */

'use strict';

/* ══════════════════════════════════════════════════════════
   IMPORT CORE MODULES — P0 & P1 FEATURES
══════════════════════════════════════════════════════════ */
import { Security } from './core/security.js';
import { SmartCache } from './core/cache.js';
import { Observability } from './core/observability.js';

/* ══════════════════════════════════════════════════════════
   CONSTANTS & CONFIG
══════════════════════════════════════════════════════════ */
const SB_URL = 'https://pvznaeppaagylwddirla.supabase.co';
const DEPOK_CORE = { lat: -6.4000, lng: 106.8200 };
const SAFE_RADIUS_KM = 5.0;
const listPetugas = ['SUDARSONO', 'MARHUSIN', 'HERIYATNO', 'SUNARKO', 'HARIYANSAHC', 'AGUS SUTISNA', 'DONIH'];
const SHIFT_OPTIONS = ['P', 'M', 'L', 'CT'];

/* ══════════════════════════════════════════════════════════
   INITIALIZE OBSERVABILITY
══════════════════════════════════════════════════════════ */
const logger = Observability.Logger;
const tracer = Observability.Tracer;
const errors = Observability.Errors;
const metrics = Observability.Metrics;

/* ══════════════════════════════════════════════════════════
   INITIALIZE CACHE
══════════════════════════════════════════════════════════ */
const sekCache = new SmartCache({
    l1MaxItems: 50
});

/* ══════════════════════════════════════════════════════════
   CSS INJECTION
══════════════════════════════════════════════════════════ */
function injectCSS() {
    if (document.getElementById('sekuriti-styles')) return;
    
    const s = document.createElement('style');    s.id = 'sekuriti-styles';
    s.textContent = `
        :root {
            --sek-primary: #10b981;
            --sek-primary-light: rgba(16,185,129,0.1);
            --sek-primary-border: rgba(16,185,129,0.25);
            --sek-bg-panel: rgba(15,23,42,0.88);
            --sek-text: #e2e8f0;
            --sek-text-muted: #94a3b8;
            --sek-text-dim: #64748b;
            --sek-radius: 16px;
            --sek-radius-sm: 12px;
            --sek-radius-xs: 8px;
            --sek-transition: 0.2s ease;
            --sek-shadow: 0 4px 18px rgba(16,185,129,0.15);
            --sek-font-mono: 'JetBrains Mono', monospace;
            --sek-font-sans: 'Rajdhani', 'Inter', -apple-system, sans-serif;
            --sek-border: rgba(255,255,255,0.08);
        }

        #sekuriti-root, #sekuriti-root * { box-sizing: border-box; margin: 0; padding: 0; }

        #sekuriti-root {
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            padding: 1rem;
            font-family: var(--sek-font-sans);
            color: var(--sek-text);
            line-height: 1.6;
        }

        .sek-panel {
            background: var(--sek-bg-panel);
            backdrop-filter: blur(18px);
            border: 1px solid var(--sek-primary-border);
            border-radius: var(--sek-radius);
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            width: 100%;
            overflow: hidden;
        }

        .sek-header {
            background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05));
            border-left: 4px solid var(--sek-primary);
        }

        .sek-header-content {
            display: flex;            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;
        }

        .sek-header-icon { font-size: 3rem; line-height: 1; flex-shrink: 0; }

        .sek-header-text { flex: 1; min-width: 200px; }

        .sek-title {
            font-size: 1.8rem;
            font-weight: 800;
            background: linear-gradient(135deg, var(--sek-primary), #059669);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 0.25rem;
            line-height: 1.2;
        }

        .sek-sub { font-size: 0.75rem; color: var(--sek-text-muted); line-height: 1.3; }

        .sek-user-badge {
            background: rgba(139,92,246,0.15);
            border: 1px solid rgba(139,92,246,0.3);
            color: #a855f7;
            padding: 0.4rem 1rem;
            border-radius: 30px;
            font-size: 0.8rem;
            font-weight: 600;
            white-space: nowrap;
        }

        .sek-status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 0.75rem;
            margin-bottom: 1.5rem;
            width: 100%;
        }

        @media (max-width: 640px) {
            .sek-status-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .sek-status-card {
            background: rgba(0,0,0,0.3);
            border-radius: var(--sek-radius-sm);
            padding: 0.75rem 1rem;
            border-left: 3px solid var(--sek-primary);            min-width: 0;
            overflow: hidden;
        }

        .sek-status-label {
            font-size: 0.65rem;
            text-transform: uppercase;
            color: var(--sek-text-muted);
            letter-spacing: 0.5px;
            margin-bottom: 0.25rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: block;
        }

        .sek-status-value {
            font-size: 1rem;
            font-weight: 700;
            color: var(--sek-text);
            word-break: break-word;
            overflow-wrap: break-word;
            line-height: 1.3;
            display: block;
        }

        .sek-tabs {
            display: flex;
            gap: 0.5rem;
            border-bottom: 2px solid var(--sek-primary-border);
            margin-bottom: 1.5rem;
            overflow-x: auto;
            scrollbar-width: thin;
            padding-bottom: 0.25rem;
        }

        .sek-tabs::-webkit-scrollbar { height: 4px; }
        .sek-tabs::-webkit-scrollbar-thumb { background: var(--sek-primary-border); border-radius: 4px; }

        .sek-tab {
            padding: 0.65rem 1.5rem;
            background: rgba(255,255,255,0.04);
            border: 1px solid transparent;
            border-radius: 8px 8px 0 0;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.9rem;
            color: var(--sek-text-dim);
            white-space: nowrap;
            transition: all var(--sek-transition);            flex-shrink: 0;
        }

        .sek-tab:hover { background: var(--sek-primary-light); color: var(--sek-text); }

        .sek-tab.active {
            background: rgba(16,185,129,0.18);
            border-color: var(--sek-primary);
            color: var(--sek-primary);
        }

        .tab-content { width: 100%; animation: fadeIn 0.3s ease; }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .sek-form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-bottom: 1rem;
            width: 100%;
        }

        @media (max-width: 640px) { .sek-form-grid { grid-template-columns: 1fr; } }

        .sek-form-group { width: 100%; }

        .sek-label {
            display: block;
            font-size: 0.75rem;
            color: var(--sek-text-muted);
            margin-bottom: 0.5rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
        }

        .sek-input, .sek-select, .sek-textarea {
            width: 100%;
            padding: 0.75rem 1rem;
            background: rgba(0,0,0,0.3);
            border: 1.5px solid var(--sek-primary-border);
            border-radius: var(--sek-radius-xs);
            color: var(--sek-text);
            font-family: inherit;
            font-size: 0.9rem;
            outline: none;            transition: border-color var(--sek-transition);
        }

        .sek-input:focus, .sek-select:focus, .sek-textarea:focus {
            border-color: var(--sek-primary);
            box-shadow: 0 0 0 3px var(--sek-primary-light);
        }

        .sek-select option { background: #1e293b; color: var(--sek-text); }
        .sek-textarea { resize: vertical; min-height: 100px; font-family: inherit; }

        .sek-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            border-radius: var(--sek-radius-xs);
            font-weight: 700;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all var(--sek-transition);
            border: none;
            background: rgba(255,255,255,0.08);
            color: var(--sek-text);
            white-space: nowrap;
        }

        .sek-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            background: rgba(255,255,255,0.15);
            box-shadow: var(--sek-shadow);
        }

        .sek-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .sek-btn-primary {
            background: linear-gradient(135deg, var(--sek-primary), #059669);
            color: #020617;
        }

        .sek-btn-primary:hover:not(:disabled) { box-shadow: 0 6px 24px rgba(16,185,129,0.3); }
        .sek-btn-sm { padding: 0.4rem 1rem; font-size: 0.75rem; border-radius: 20px; }

        .sek-upload-area {
            border: 2px dashed var(--sek-primary-border);
            border-radius: var(--sek-radius-xs);
            padding: 2rem 1.5rem;
            text-align: center;
            cursor: pointer;            transition: border-color var(--sek-transition);
            margin-top: 0.5rem;
        }

        .sek-upload-area:hover {
            border-color: var(--sek-primary);
            background: var(--sek-primary-light);
        }

        .sek-upload-icon { font-size: 2rem; color: var(--sek-primary); margin-bottom: 0.5rem; display: block; }
        .sek-preview { max-width: 100%; max-height: 300px; border-radius: var(--sek-radius-xs); margin-top: 1rem; display: block; }

        .sek-table-wrap { overflow-x: auto; border-radius: var(--sek-radius); border: 1px solid var(--sek-border); margin-top: 1rem; width: 100%; }

        table.sek-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        table.sek-table thead { background: rgba(0,0,0,0.3); }
        table.sek-table th { padding: 0.75rem 1rem; text-align: left; font-size: 0.7rem; text-transform: uppercase; color: var(--sek-text-muted); font-weight: 600; white-space: nowrap; }
        table.sek-table td { padding: 0.75rem 1rem; border-top: 1px solid var(--sek-border); vertical-align: middle; }
        table.sek-table tr:hover td { background: rgba(255,255,255,0.02); }

        .sek-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.7rem;
            font-weight: 600;
            white-space: nowrap;
        }

        .sek-badge-aman { background: rgba(16,185,129,0.2); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
        .sek-badge-warning { background: rgba(245,158,11,0.2); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
        .sek-badge-danger { background: rgba(239,68,68,0.2); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }

        .sek-loader { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 1rem; text-align: center; }

        .sek-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--sek-primary-light);
            border-top-color: var(--sek-primary);
            border-radius: 50%;
            animation: sek-spin 1s linear infinite;
            margin-bottom: 1rem;
        }

        @keyframes sek-spin { to { transform: rotate(360deg); } }

        .sek-schedule-table td { padding: 0.25rem; text-align: center; vertical-align: middle; }

        .sek-schedule-input {            width: 60px;
            padding: 0.4rem;
            background: rgba(0,0,0,0.4);
            border: 1px solid var(--sek-primary-border);
            border-radius: 6px;
            color: white;
            text-align: center;
            font-weight: bold;
            cursor: pointer;
            font-family: var(--sek-font-mono);
        }

        .sek-schedule-input:focus { border-color: var(--sek-primary); outline: none; box-shadow: 0 0 0 2px var(--sek-primary-light); }
        .sek-drag-handle { cursor: grab; padding: 0 4px; color: var(--sek-text-muted); user-select: none; }
        .sek-drag-handle:active { cursor: grabbing; }

        .text-center { text-align: center; }
        .mb-2 { margin-bottom: 0.5rem; }
        .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
        .opacity-70 { opacity: 0.7; }

        @media (max-width: 768px) {
            .sek-title { font-size: 1.5rem; }
            .sek-header-icon { font-size: 2.5rem; }
            .sek-status-value { font-size: 0.9rem; }
            .sek-tab { padding: 0.5rem 1rem; font-size: 0.8rem; }
            .sek-panel { padding: 1rem; }
        }
    `;
    document.head.appendChild(s);
}

/* ══════════════════════════════════════════════════════════
   HELPER FUNCTIONS
══════════════════════════════════════════════════════════ */
function escapeHTML(s) {
    return Security.sanitize.escape(s);
}

function getCurrentShift() {
    const jam = new Date().getHours();
    return (jam >= 7 && jam < 19) ? 'PAGI (07:00-19:00)' : 'MALAM (19:00-07:00)';
}

/* ══════════════════════════════════════════════════════════
   BUILD SHELL HTML
══════════════════════════════════════════════════════════ */
function buildShell(user) {
    const userName = user?.name?.toUpperCase() || 'GUEST';
    const userTitle = Security.rbac.getTitle(user?.role);    
    return `
    <div id="sekuriti-root">
        <!-- HEADER -->
        <div class="sek-panel sek-header">
            <div class="sek-header-content">
                <div class="sek-header-icon">🛡️</div>
                <div class="sek-header-text">
                    <div class="sek-title">SEKURITI</div>
                    <div class="sek-sub">Sistem Monitoring & Laporan Patroli 24/7</div>
                </div>
                <div class="sek-user-badge">${userTitle} ${escapeHTML(userName)}</div>
            </div>
        </div>

        <!-- STATUS GRID -->
        <div class="sek-status-grid">
            <div class="sek-status-card">
                <span class="sek-status-label">SHIFT</span>
                <span class="sek-status-value" id="sek-shift">—</span>
            </div>
            <div class="sek-status-card">
                <span class="sek-status-label">DATABASE</span>
                <span class="sek-status-value" id="sek-db-status">—</span>
            </div>
            <div class="sek-status-card">
                <span class="sek-status-label">LOKASI</span>
                <span class="sek-status-value" id="sek-lokasi">—</span>
            </div>
            <div class="sek-status-card">
                <span class="sek-status-label">CACHE</span>
                <span class="sek-status-value" id="sek-cache-status">—</span>
            </div>
        </div>

        <!-- TABS -->
        <div class="sek-tabs">
            <button class="sek-tab active" data-tab="laporan">📋 Laporan Patroli</button>
            <button class="sek-tab" data-tab="history">📜 Riwayat</button>
            <button class="sek-tab" data-tab="jadwal">📅 Jadwal Piket</button>
            <button class="sek-tab" data-tab="harian">📊 Laporan Harian</button>
        </div>

        <!-- TAB CONTENTS -->
        <div id="sek-laporan-tab" class="tab-content">
            <div class="sek-panel">
                <h3 style="font-size:1.2rem;font-weight:700;margin-bottom:1.5rem;color:var(--sek-primary);">📝 Laporan Patroli Baru</h3>
                <form id="sekForm">
                    <div class="sek-form-grid">
                        <div class="sek-form-group">                            <label class="sek-label">Tanggal</label>
                            <input type="text" id="sek-tanggal" class="sek-input" readonly>
                        </div>
                        <div class="sek-form-group">
                            <label class="sek-label">Shift</label>
                            <input type="text" id="sek-shift-input" class="sek-input" readonly>
                        </div>
                    </div>
                    <div class="sek-form-grid">
                        <div class="sek-form-group">
                            <label class="sek-label">Petugas Jaga *</label>
                            <select id="sek-petugas" class="sek-select" required>
                                <option value="">-- Pilih Petugas --</option>
                                ${listPetugas.map(n => `<option value="${n}">${n}</option>`).join('')}
                            </select>
                        </div>
                        <div class="sek-form-group">
                            <label class="sek-label">Lokasi Patroli *</label>
                            <input type="text" id="sek-lokasi-input" class="sek-input" placeholder="Contoh: Pos Utama" required>
                        </div>
                    </div>
                    <div class="sek-form-group">
                        <label class="sek-label">Deskripsi Situasi *</label>
                        <textarea id="sek-deskripsi" class="sek-textarea" placeholder="Jelaskan situasi / kejadian..." required></textarea>
                    </div>
                    <div class="sek-form-group">
                        <label class="sek-label">Foto Bukti (wajib)</label>
                        <div class="sek-upload-area" onclick="document.getElementById('sek-foto').click()">
                            <span class="sek-upload-icon">📷</span>
                            <p style="font-size:0.9rem;color:var(--sek-text-muted);">Klik untuk ambil foto (geotag otomatis)</p>
                            <input type="file" id="sek-foto" accept="image/*" capture="environment" style="display:none;" required>
                        </div>
                        <img id="sek-preview" class="sek-preview" style="display:none;">
                        <input type="hidden" id="sek-foto-base64">
                    </div>
                    <div style="margin-top:1.5rem;">
                        <button type="submit" class="sek-btn sek-btn-primary" id="sek-submit">
                            🔒 Enkripsi & Kirim
                        </button>
                    </div>
                    <div id="sek-form-result" style="margin-top:1rem;"></div>
                </form>
            </div>
        </div>

        <div id="sek-history-tab" class="tab-content" style="display:none;">
            <div class="sek-panel">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:1rem;">
                    <h3 style="font-size:1.2rem;font-weight:700;color:var(--sek-primary);">📜 Riwayat Laporan</h3>
                    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">                        <input type="date" id="filter-tanggal" class="sek-input" style="width:auto;max-width:150px;">
                        <select id="filter-shift" class="sek-select" style="width:auto;">
                            <option value="">Semua Shift</option>
                            <option value="PAGI">PAGI</option>
                            <option value="MALAM">MALAM</option>
                        </select>
                        <button class="sek-btn sek-btn-sm" id="btn-filter">🔍 Filter</button>
                        <button class="sek-btn sek-btn-sm" id="btn-reset-filter">🔄 Reset</button>
                    </div>
                </div>
                <div class="sek-table-wrap">
                    <table class="sek-table">
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Shift</th>
                                <th>Petugas</th>
                                <th>Lokasi</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="sek-history-body">
                            <tr><td colspan="6" class="text-center py-4">Memuat...</td></tr>
                        </tbody>
                    </table>
                </div>
                <div style="margin-top:1rem;display:flex;justify-content:space-between;align-items:center;">
                    <span class="sek-text-muted" id="history-count">—</span>
                    <button class="sek-btn sek-btn-sm" id="btn-load-more">📥 Muat Lebih Banyak</button>
                </div>
            </div>
        </div>

        <div id="sek-jadwal-tab" class="tab-content" style="display:none;">
            <div class="sek-panel">
                <h3 style="font-size:1.2rem;font-weight:700;color:var(--sek-primary);margin-bottom:1rem;">📅 Jadwal Piket</h3>
                <div class="sek-loader">
                    <div class="sek-spinner"></div>
                    <p>Memuat jadwal...</p>
                </div>
            </div>
        </div>

        <div id="sek-harian-tab" class="tab-content" style="display:none;">
            <div class="sek-panel">
                <h3 style="font-size:1.2rem;font-weight:700;color:var(--sek-primary);margin-bottom:1rem;">📊 Laporan Harian</h3>
                <div class="sek-loader">
                    <div class="sek-spinner"></div>
                    <p>Memuat laporan...</p>                </div>
            </div>
        </div>
    </div>
    `;
}

/* ══════════════════════════════════════════════════════════
   EXPORT DEFAULT — Main Module Entry Point
══════════════════════════════════════════════════════════ */
export default async function initModule(config, utils, supabase, currentUser, showToast, showModal, loader, translations, currentLang, container) {
    // ✅ CRITICAL: Inject CSS BEFORE returning HTML
    injectCSS();
    
    // ✅ Start initialization trace
    const traceId = tracer.start('module_init', {
        user: currentUser,
        force: true
    });
    const stopTimer = metrics.startTimer('module.init.duration');
    
    try {
        // Return HTML shell immediately
        const shellHTML = buildShell(currentUser);
        
        // Initialize logic after DOM ready
        setTimeout(async () => {
            if (!container) {
                logger.error('Container tidak tersedia');
                errors.capture(new Error('Container not provided'), { module: 'sekuriti' });
                return;
            }
            
            await initModuleLogic(config, utils, supabase, currentUser, showToast, showModal, loader, translations, currentLang, container);
            
            // End trace
            stopTimer();
            tracer.end(traceId, { success: true });
            
        }, 100);
        
        return shellHTML;
        
    } catch (error) {
        logger.error('Module initialization failed', { error: error.message });
        errors.capture(error, { function: 'initModule' });
        stopTimer();
        tracer.end(traceId, { success: false, error });
        throw error;
    }}

/* ══════════════════════════════════════════════════════════
   MODULE LOGIC — Core Functionality
══════════════════════════════════════════════════════════ */
async function initModuleLogic(config, utils, supabase, currentUser, showToast, showModal, loader, translations, currentLang, container) {
    
    // ✅ CRITICAL: Validate Supabase connection
    if (!supabase && !window.S?.sb) {
        logger.error('Supabase client not provided');
        showToast('Sistem tidak dapat terhubung. Hubungi admin.', 'error');
        container.innerHTML = `<div class="sek-panel text-center"><p>⚠️ Sistem tidak dapat terhubung</p></div>`;
        return;
    }
    
    const _sb = supabase || window.S.sb;
    const _user = currentUser || null;
    let _tab = 'laporan';
    
    // ✅ RBAC: Check if user can access this module
    try {
        Security.rbac.enforce('report:read', _user);
        logger.info('Module access granted', { user: _user?.name, role: _user?.role });
    } catch (e) {
        logger.warn('Module access denied', { user: _user?.name, error: e.message });
        showToast(e.message, 'error');
        container.innerHTML = `<div class="sek-panel text-center"><p>⚠️ ${escapeHTML(e.message)}</p></div>`;
        return;
    }
    
    // ✅ Toast wrapper
    const toast = showToast || function(msg, type) {
        console.log(`[${type}] ${msg}`);
        const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
        const el = document.createElement('div');
        el.className = `toast toast-${type}`;
        el.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
        const tc = document.getElementById('toast-container');
        if (tc) {
            tc.appendChild(el);
            setTimeout(() => { el.style.opacity='0'; setTimeout(() => el.remove(), 350); }, 3000);
        }
    };
    
    // ✅ Update status bar
    function updateStatus() {
        const shiftEl = container.querySelector('#sek-shift');
        const dbEl = container.querySelector('#sek-db-status');
        const cacheEl = container.querySelector('#sek-cache-status');
                if (shiftEl) shiftEl.textContent = getCurrentShift();
        
        if (dbEl) {
            dbEl.innerHTML = _sb ? '<span class="sek-badge sek-badge-aman">ONLINE</span>' : '<span class="sek-badge sek-badge-danger">OFFLINE</span>';
        }
        
        if (cacheEl) {
            const stats = sekCache.stats();
            cacheEl.innerHTML = `<span class="sek-badge sek-badge-warning">L1:${stats.L1.size} L2:OK</span>`;
        }
    }
    
    // ✅ Tab switching
    function switchTab(newTab) {
        const traceId = tracer.start('tab_switch', { tab: newTab });
        
        _tab = newTab;
        
        container.querySelectorAll('.sek-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === newTab);
        });
        
        container.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
        });
        
        const target = container.querySelector(`#sek-${newTab}-tab`);
        if (target) target.style.display = 'block';
        
        // Load tab content
        if (newTab === 'history') loadHistory();
        if (newTab === 'jadwal') loadJadwal();
        if (newTab === 'harian') loadHarian();
        
        tracer.end(traceId, { success: true });
        logger.action('TAB_SWITCHED', _user, { tab: newTab });
    }
    
    // ✅ Load history with cache & filters
    async function loadHistory(filters = {}) {
        const traceId = tracer.start('load_history', { filters });
        const stopTimer = metrics.startTimer('history.load.duration');
        
        const tbody = container.querySelector('#sek-history-body');
        if (!tbody || !_sb) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">Database offline</td></tr>';
            tracer.end(traceId, { success: false, error: 'No database' });
            return;
        }
                tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><div class="sek-spinner" style="margin:0 auto;"></div></td></tr>';
        
        try {
            // Build cache key
            const filterKey = Object.entries(filters)
                .filter(([,v]) => v)
                .map(([k,v]) => `${k}=${v}`)
                .join(':');
            const cacheKey = `reports:history:${filterKey || 'all'}`;
            
            const result = await sekCache.get(cacheKey, {
                type: 'reports',
                fetcher: async () => {
                    let query = _sb
                        .from('sekuriti_reports')
                        .select('id, tanggal, shift, petugas, lokasi, status, created_at')
                        .order('created_at', { ascending: false })
                        .limit(50);
                    
                    // Apply filters
                    if (filters.tanggal) query = query.eq('tanggal', filters.tanggal);
                    if (filters.shift) query = query.ilike('shift', `%${filters.shift}%`);
                    if (filters.petugas) query = query.contains('petugas', [filters.petugas]);
                    if (filters.status) query = query.eq('status', filters.status);
                    
                    const { data, error } = await query;
                    if (error) throw error;
                    return data || [];
                }
            });
            
            const reports = result.data || [];
            
            if (!reports.length) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 opacity-70">Tidak ada laporan</td></tr>';
                tracer.end(traceId, { success: true, count: 0 });
                stopTimer();
                return;
            }
            
            let html = '';
            reports.forEach(item => {
                const statusBadge = item.status === 'verified' ? 'sek-badge-aman' : 
                                   item.status === 'pending' ? 'sek-badge-warning' : 'sek-badge-danger';
                
                html += `<tr>
                    <td>${escapeHTML(item.tanggal || '—')}</td>
                    <td>${escapeHTML(item.shift || '—')}</td>
                    <td>${escapeHTML(Array.isArray(item.petugas) ? item.petugas.join(', ') : item.petugas || '—')}</td>
                    <td>${escapeHTML(item.lokasi || '—')}</td>                    <td><span class="sek-badge ${statusBadge}">${escapeHTML(item.status || '—')}</span></td>
                    <td>
                        <button class="sek-btn sek-btn-sm" onclick="viewReportDetail('${item.id}')">👁️</button>
                    </td>
                </tr>`;
            });
            
            tbody.innerHTML = html;
            
            // Update count
            const countEl = container.querySelector('#history-count');
            if (countEl) countEl.textContent = `${reports.length} laporan`;
            
            tracer.end(traceId, { success: true, count: reports.length, fromCache: result.fromCache });
            stopTimer();
            
            logger.info('History loaded', { count: reports.length, fromCache: result.fromCache });
            
        } catch (error) {
            logger.error('Load history failed', { error: error.message });
            errors.capture(error, { function: 'loadHistory', filters });
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4" style="color:#ef4444;">Error: ${escapeHTML(error.message)}</td></tr>`;
            tracer.end(traceId, { success: false, error });
            stopTimer();
        }
    }
    
    // ✅ Load jadwal with cache
    async function loadJadwal() {
        const traceId = tracer.start('load_jadwal');
        const stopTimer = metrics.startTimer('jadwal.load.duration');
        
        const tbody = container.querySelector('#sek-schedule-body');
        const thead = container.querySelector('#sek-schedule-header tr');
        if (!tbody || !thead) {
            tracer.end(traceId, { success: false });
            return;
        }
        
        const now = new Date();
        const bulan = now.getMonth() + 1;
        const tahun = now.getFullYear();
        const cacheKey = `jadwal:${bulan}:${tahun}`;
        
        tbody.innerHTML = '<tr><td colspan="32" class="text-center py-4"><div class="sek-spinner" style="margin:0 auto;"></div><p>Memuat jadwal...</p></td></tr>';
        
        try {
            const result = await sekCache.get(cacheKey, {
                type: 'schedule',
                fetcher: async () => {                    if (!_sb) throw new Error('Database tidak tersedia');
                    
                    const { data, error } = await _sb
                        .from('sekuriti_jadwal_master')
                        .select('petugas_name, jadwal_array, version, updated_at')
                        .eq('bulan', bulan)
                        .eq('tahun', tahun);
                    
                    if (error) throw error;
                    return data || [];
                }
            });
            
            const jadwalData = result.data || [];
            const jmlHari = new Date(tahun, bulan, 0).getDate();
            
            // Render header
            let headerHtml = '<th>Petugas</th>';
            for (let i = 1; i <= jmlHari; i++) {
                headerHtml += `<th>${i}</th>`;
            }
            thead.innerHTML = headerHtml;
            
            // Render rows
            let html = '';
            listPetugas.forEach((nama) => {
                const existing = jadwalData.find(d => d.petugas_name === nama);
                const arr = existing?.jadwal_array || Array(jmlHari).fill('L');
                const version = existing?.version || 1;
                
                html += `<tr data-nama="${nama}" data-version="${version}">`;
                html += `<td style="display:flex;align-items:center;gap:0.5rem;"><span class="sek-drag-handle">☰</span>${escapeHTML(nama)}</td>`;
                
                for (let tgl = 1; tgl <= jmlHari; tgl++) {
                    const shift = arr[tgl-1] || 'L';
                    const canEdit = Security.rbac.can('schedule:update', _user);
                    html += `<td>
                        <select class="sek-schedule-input" data-nama="${nama}" data-tgl="${tgl}" ${!canEdit ? 'disabled' : ''}>
                            ${SHIFT_OPTIONS.map(opt => `<option value="${opt}" ${opt===shift?'selected':''}>${opt}</option>`).join('')}
                        </select>
                    </td>`;
                }
                html += `</tr>`;
            });
            tbody.innerHTML = html;
            
            // Bind events if user can edit
            if (Security.rbac.can('schedule:update', _user)) {
                bindJadwalEvents();
            }            
            tracer.end(traceId, { success: true, fromCache: result.fromCache });
            stopTimer();
            
        } catch (error) {
            logger.error('Load jadwal failed', { error: error.message });
            errors.capture(error, { function: 'loadJadwal' });
            tbody.innerHTML = `<tr><td colspan="32" class="text-center py-4" style="color:#ef4444;">Gagal memuat: ${escapeHTML(error.message)}</td></tr>`;
            tracer.end(traceId, { success: false, error });
            stopTimer();
        }
    }
    
    // ✅ Bind jadwal events
    function bindJadwalEvents() {
        const tbody = container.querySelector('#sek-schedule-body');
        if (!tbody) return;
        
        let draggedRow = null;
        
        tbody.querySelectorAll('.sek-drag-handle').forEach(handle => {
            handle.draggable = true;
            handle.addEventListener('dragstart', (e) => {
                draggedRow = handle.closest('tr');
                setTimeout(() => draggedRow.style.opacity = '0.5', 0);
                e.dataTransfer.effectAllowed = 'move';
            });
            
            handle.addEventListener('dragend', () => {
                if (draggedRow) draggedRow.style.opacity = '1';
                draggedRow = null;
            });
        });
        
        tbody.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const afterElement = getDragAfterElement(tbody, e.clientY);
            if (draggedRow) {
                if (afterElement == null) {
                    tbody.appendChild(draggedRow);
                } else {
                    tbody.insertBefore(draggedRow, afterElement);
                }
            }
        });
        
        function getDragAfterElement(container, y) {
            const draggableElements = [...container.querySelectorAll('tr:not(.dragging)')];            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                if (offset < 0 && offset > closest.offset) {
                    return { offset, element: child };
                }
                return closest;
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }
        
        // Auto-save on change
        let saveTimeout;
        tbody.querySelectorAll('.sek-schedule-input').forEach(sel => {
            sel.addEventListener('change', function() {
                const nama = this.dataset.nama;
                const tgl = this.dataset.tgl;
                const val = this.value;
                
                this.style.borderColor = '#f59e0b';
                setTimeout(() => this.style.borderColor = '', 1000);
                
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    autoSaveJadwal(nama, tgl, val);
                }, 1000);
            });
        });
    }
    
    // ✅ Auto-save jadwal
    async function autoSaveJadwal(nama, tgl, newValue) {
        const traceId = tracer.start('jadwal_auto_save', { nama, tgl });
        
        const row = container.querySelector(`tr[data-nama="${nama}"]`);
        if (!row) {
            tracer.end(traceId, { success: false, error: 'Row not found' });
            return;
        }
        
        const localVersion = parseInt(row.dataset.version) || 1;
        const bulan = new Date().getMonth() + 1;
        const tahun = new Date().getFullYear();
        
        const selects = row.querySelectorAll('.sek-schedule-input');
        const jadwalArray = Array.from(selects).map(s => s.value);
        
        try {
            // Check concurrency
            const {  current } = await _sb
                .from('sekuriti_jadwal_master')                .select('version')
                .eq('petugas_name', nama)
                .eq('bulan', bulan)
                .eq('tahun', tahun)
                .single();
            
            if (current && current.version !== localVersion) {
                toast(`⚠️ Jadwal ${nama} sudah diubah orang lain. Refresh halaman.`, 'warning');
                row.style.border = '2px solid #ef4444';
                setTimeout(() => row.style.border = '', 2000);
                tracer.end(traceId, { success: false, error: 'Concurrency conflict' });
                return;
            }
            
            // Save with version increment
            const newVersion = (current?.version || 0) + 1;
            const { error } = await _sb
                .from('sekuriti_jadwal_master')
                .upsert({
                    petugas_name: nama,
                    bulan,
                    tahun,
                    jadwal_array: jadwalArray,
                    version: newVersion,
                    updated_at: new Date().toISOString(),
                    updated_by: _user?.name
                }, { onConflict: 'petugas_name, bulan, tahun' });
            
            if (error) throw error;
            
            row.dataset.version = newVersion;
            await sekCache.invalidate(`jadwal:${bulan}:${tahun}`);
            
            await Security.audit.log('JADWAL_AUTO_SAVED', {
                petugas_name: nama,
                tanggal_changed: tgl,
                new_value: newValue,
                version: newVersion
            }, _user, _sb);
            
            tracer.end(traceId, { success: true, version: newVersion });
            console.log(`[Jadwal] Auto-saved: ${nama} tgl ${tgl} → ${newValue}`);
            
        } catch (err) {
            logger.error('Auto-save jadwal failed', { error: err.message });
            errors.capture(err, { function: 'autoSaveJadwal', nama, tgl });
            toast('Gagal menyimpan perubahan', 'error');
            tracer.end(traceId, { success: false, error: err });
        }
    }    
    // ✅ Load harian
    async function loadHarian() {
        const contentDiv = container.querySelector('#sek-harian-content');
        if (!contentDiv) return;
        
        const today = new Date().toISOString().split('T')[0];
        
        try {
            if (!_sb) {
                contentDiv.innerHTML = `<p class="text-center py-4">Database offline</p>`;
                return;
            }
            
            const { data, error } = await _sb
                .from('sekuriti_reports')
                .select('*')
                .eq('tanggal', today)
                .order('created_at', { ascending: true });
            
            if (error) throw error;
            
            let html = `<p class="text-sm text-slate-400 mb-2">Tanggal: ${today}</p>`;
            
            if (!data || data.length === 0) {
                html += '<p class="text-center py-4 opacity-70">Belum ada laporan hari ini.</p>';
            } else {
                html += '<div class="sek-table-wrap"><table class="sek-table"><thead><tr><th>Waktu</th><th>Petugas</th><th>Lokasi</th><th>Deskripsi</th><th>Foto</th></tr></thead><tbody>';
                data.forEach(item => {
                    const waktu = new Date(item.created_at).toLocaleString('id-ID');
                    html += `<tr>
                        <td>${waktu}</td>
                        <td>${escapeHTML(Array.isArray(item.petugas) ? item.petugas.join(', ') : item.petugas)}</td>
                        <td>${escapeHTML(item.lokasi)}</td>
                        <td>${escapeHTML(item.deskripsi || '-')}</td>
                        <td>${item.foto_url?.length ? `<a href="${item.foto_url[0]}" target="_blank" class="text-emerald-400">Lihat</a>` : '-'}</td>
                    </tr>`;
                });
                html += '</tbody></table></div>';
            }
            
            contentDiv.innerHTML = html;
            
        } catch (err) {
            logger.error('Load harian failed', { error: err.message });
            contentDiv.innerHTML = `<p class="text-center py-4" style="color:#ef4444;">Error: ${escapeHTML(err.message)}</p>`;
        }
    }
    
    // ✅ Handle form submit    async function handleSubmit(e) {
        e.preventDefault();
        
        const traceId = tracer.start('report_submit', { user: _user });
        const stopTimer = metrics.startTimer('report.submit.duration');
        
        try {
            // Gather form data
            const rawData = {
                petugas: container.querySelector('#sek-petugas')?.value,
                lokasi: container.querySelector('#sek-lokasi-input')?.value,
                deskripsi: container.querySelector('#sek-deskripsi')?.value,
                foto_base64: container.querySelector('#sek-foto-base64')?.value
            };
            
            // ✅ Validate
            const validation = Security.validate.validateReport(rawData);
            if (!validation.valid) {
                toast(validation.errors.join('\n'), 'error');
                tracer.end(traceId, { success: false, error: 'Validation failed' });
                stopTimer();
                return;
            }
            
            // ✅ Sanitize
            const cleanData = {
                petugas: [Security.sanitize.sanitize(rawData.petugas)],
                lokasi: Security.sanitize.sanitize(rawData.lokasi, { maxLength: 100 }),
                deskripsi: Security.sanitize.sanitize(rawData.deskripsi, { maxLength: 2000 }),
                foto_base64: rawData.foto_base64
            };
            
            // ✅ Get GPS
            let coords = null;
            try {
                const position = await new Promise((resolve, reject) => {
                    if (!navigator.geolocation) {
                        reject(new Error('GPS tidak didukung'));
                        return;
                    }
                    navigator.geolocation.getCurrentPosition(
                        pos => resolve(pos.coords),
                        err => reject(new Error(`GPS error: ${err.message}`)),
                        { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
                    );
                });
                
                const coordValidation = Security.sanitize.validateCoords(`${position.latitude},${position.longitude}`);
                if (coordValidation.valid) {
                    const distance = Security.sanitize.getDistance(                        coordValidation.lat, coordValidation.lng,
                        DEPOK_CORE.lat, DEPOK_CORE.lng
                    );
                    if (distance > SAFE_RADIUS_KM && !confirm(`Anda berada ${distance.toFixed(1)}km dari area aman. Tetap kirim?`)) {
                        tracer.end(traceId, { success: false, error: 'Outside safe radius' });
                        stopTimer();
                        return;
                    }
                    coords = `${coordValidation.lat}, ${coordValidation.lng}`;
                }
            } catch (gpsErr) {
                console.warn('[SEKURITI] GPS failed:', gpsErr.message);
                if (!confirm('Gagal mendapatkan GPS. Lanjutkan tanpa koordinat?')) {
                    tracer.end(traceId, { success: false, error: 'GPS failed' });
                    stopTimer();
                    return;
                }
            }
            
            // ✅ RBAC check
            Security.rbac.enforce('report:create', _user);
            
            // ✅ Prepare data
            const reportData = {
                ...cleanData,
                tanggal: new Date().toISOString().split('T')[0],
                shift: getCurrentShift(),
                koordinat: coords,
                status: 'pending',
                created_at: new Date().toISOString()
            };
            
            // ✅ Show loading
            const btn = container.querySelector('#sek-submit');
            const originalBtn = btn?.innerHTML;
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="sek-spinner" style="width:20px;height:20px;margin:0;"></span> Mengirim...';
            }
            
            // ✅ Upload photo
            let fotoUrl = null;
            if (cleanData.foto_base64 && _sb?.storage) {
                try {
                    const response = await fetch(cleanData.foto_base64);
                    const blob = await response.blob();
                    const filename = `sekuriti/${Date.now()}-${Math.random().toString(36).substring(8)}.jpg`;
                    
                    const { error: uploadError } = await _sb.storage
                        .from('sekuriti-foto')                        .upload(filename, blob, { cacheControl: '3600', upsert: false });
                    
                    if (!uploadError) {
                        const {  urlData } = _sb.storage.from('sekuriti-foto').getPublicUrl(filename);
                        fotoUrl = urlData.publicUrl;
                    }
                } catch (uploadErr) {
                    console.warn('[SEKURITI] Photo upload failed:', uploadErr.message);
                }
            }
            
            // ✅ Insert report
            const { error: insertError } = await _sb
                .from('sekuriti_reports')
                .insert([{ ...reportData, foto_url: fotoUrl ? [fotoUrl] : null }]);
            
            if (insertError) throw insertError;
            
            // ✅ Audit log
            await Security.audit.log('REPORT_CREATED', {
                report_lokasi: reportData.lokasi,
                report_shift: reportData.shift,
                gps_used: !!reportData.koordinat
            }, _user, _sb);
            
            // ✅ Success
            toast('✅ Laporan berhasil dikirim! Terima kasih, Om ' + (_user?.name || 'Security') + ' 🛡️', 'success');
            metrics.increment('reports.submitted.success');
            
            // ✅ Reset form
            const form = container.querySelector('#sekForm');
            if (form) form.reset();
            const preview = container.querySelector('#sek-preview');
            if (preview) preview.style.display = 'none';
            const base64Input = container.querySelector('#sek-foto-base64');
            if (base64Input) base64Input.value = '';
            const tanggalInput = container.querySelector('#sek-tanggal');
            if (tanggalInput) tanggalInput.value = new Date().toISOString().split('T')[0];
            const shiftInput = container.querySelector('#sek-shift-input');
            if (shiftInput) shiftInput.value = getCurrentShift();
            
            // ✅ Invalidate cache
            await sekCache.invalidate('reports:history');
            
            tracer.end(traceId, { success: true });
            stopTimer();
            
        } catch (err) {
            logger.error('Submit report failed', { error: err.message });
            errors.capture(err, { function: 'handleSubmit' });            metrics.increment('reports.submitted.error');
            toast('❌ Gagal: ' + err.message, 'error');
            tracer.end(traceId, { success: false, error: err });
            stopTimer();
            
        } finally {
            const btn = container.querySelector('#sek-submit');
            if (btn && originalBtn) {
                btn.disabled = false;
                btn.innerHTML = originalBtn;
            }
        }
    }
    
    // ✅ Bind events
    function bindEvents() {
        // Tab buttons
        container.querySelectorAll('.sek-tab').forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });
        
        // Form submit
        container.querySelector('#sekForm')?.addEventListener('submit', handleSubmit);
        
        // Photo upload
        container.querySelector('#sek-foto')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            if (file.size > 5 * 1024 * 1024) {
                toast('File terlalu besar, max 5MB', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (ev) => {
                const preview = container.querySelector('#sek-preview');
                const base64Input = container.querySelector('#sek-foto-base64');
                if (preview) {
                    preview.src = ev.target.result;
                    preview.style.display = 'block';
                }
                if (base64Input) base64Input.value = ev.target.result;
            };
            reader.readAsDataURL(file);
        });
        
        // History refresh
        container.querySelector('#sek-refresh-history')?.addEventListener('click', () => {
            sekCache.invalidate('reports:history');            loadHistory();
        });
        
        // History filter
        const applyFilter = () => {
            const filters = {
                tanggal: container.querySelector('#filter-tanggal')?.value || null,
                shift: container.querySelector('#filter-shift')?.value || null,
                petugas: container.querySelector('#filter-petugas')?.value || null
            };
            loadHistory(filters);
        };
        
        container.querySelector('#btn-filter')?.addEventListener('click', applyFilter);
        container.querySelector('#btn-reset-filter')?.addEventListener('click', () => {
            container.querySelector('#filter-tanggal').value = '';
            container.querySelector('#filter-shift').value = '';
            container.querySelector('#filter-petugas').value = '';
            sekCache.invalidate('reports:history');
            loadHistory();
        });
        container.querySelector('#filter-tanggal')?.addEventListener('change', applyFilter);
    }
    
    // ✅ Initialize
    await Security.audit.log('MODULE_ACCESSED', { module: 'sekuriti' }, _user, _sb);
    
    bindEvents();
    updateStatus();
    setInterval(updateStatus, 60000);
    
    // Update location periodically
    async function updateLocation() {
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    pos => resolve(pos.coords),
                    err => reject(err),
                    { enableHighAccuracy: true, timeout: 10000 }
                );
            });
            
            const lokasiEl = container.querySelector('#sek-lokasi');
            if (lokasiEl) {
                lokasiEl.textContent = `${position.latitude.toFixed(4)}, ${position.longitude.toFixed(4)}`;
            }
        } catch (err) {
            console.warn('[SEKURITI] Location update failed:', err.message);
        }
    }    
    updateLocation();
    setInterval(updateLocation, 30000);
    
    logger.info('Module initialized', { user: _user?.name });
    console.log('[SEKURITI] ✅ Module ready — Bi idznillah 💚');
    
    // Expose health check
    if (typeof window !== 'undefined') {
        window.SekuritiHealth = () => ({
            module: 'sekuriti',
            observability: Observability.health(),
            cache: sekCache.stats(),
            user: _user?.name,
            database: _sb ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString()
        });
    }
    
    // Return cleanup function
    return function cleanup() {
        document.getElementById('sekuriti-styles')?.remove();
        logger.info('Module cleanup');
    };
}

// Console log for debugging
if (typeof window !== 'undefined') {
    console.log('🛡️ Sekuriti module loaded — Enterprise Edition — Bi idznillah 💚');
}