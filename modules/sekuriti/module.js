/**
 * modules/sekuriti/module.js
 * Dream OS v2.0 — Sekuriti Module (FIXED LAYOUT)
 * 
 * ✅ FIXES APPLIED:
 * - CSS injection sebelum HTML render
 * - Mobile-first responsive grid
 * - No layout overlap guaranteed
 * - Better spacing & typography
 * - Inline critical CSS untuk instant render
 * 
 * Bi idznillah 💚
 */

'use strict';

/* ==========================================================================
   CONSTANTS
   ========================================================================== */
const SB_URL_FALLBACK = 'https://pvznaeppaagylwddirla.supabase.co';
const SB_KEY_FALLBACK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2em5hZXBwYWFneWx3ZGRpcmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTEwNDMsImV4cCI6MjA4NzUyNzA0M30.t9SJi3VfsBDkKmeZ3egZ4rbvljl4xe0WwNkPtfA9-vo';

const DEPOK_CORE = { lat: -6.4000, lng: 106.8200 };
const SAFE_RADIUS_KM = 5.0;
const listPetugas = ['SUDARSONO', 'MARHUSIN', 'HERIYATNO', 'SUNARKO', 'HARIYANSAHC', 'AGUS SUTISNA', 'DONIH'];
const SHIFT_OPTIONS = ['P', 'M', 'L', 'CT']; // Pagi, Malam, Libur, Cuti

/* ==========================================================================
   ✅ FIXED CSS INJECTION - Mobile-first, No overlap guaranteed
   ========================================================================== */
function injectCSS() {
    if (document.getElementById('sekuriti-styles')) return;
    const s = document.createElement('style');
    s.id = 'sekuriti-styles';
    s.textContent = `
        /* ===== CSS VARIABLES ===== */
        :root {
            --sek-primary: #10b981;
            --sek-primary-light: rgba(16,185,129,0.1);
            --sek-primary-border: rgba(16,185,129,0.25);
            --sek-bg-panel: rgba(15,23,42,0.88);
            --sek-text: #e2e8f0;
            --sek-text-muted: #94a3b8;
            --sek-text-dim: #64748b;
            --sek-border: rgba(255,255,255,0.08);
            --sek-radius: 16px;
            --sek-radius-sm: 12px;
            --sek-radius-xs: 8px;
            --sek-transition: 0.2s ease;
            --sek-shadow: 0 4px 18px rgba(16,185,129,0.15);
            --sek-font-mono: 'JetBrains Mono', 'Courier New', monospace;
            --sek-font-sans: 'Rajdhani', 'Inter', -apple-system, sans-serif;
        }

        /* ===== BASE RESET ===== */
        #sekuriti-root,
        #sekuriti-root * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        /* ===== CONTAINER ===== */
        #sekuriti-root {
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            padding: 1rem;
            font-family: var(--sek-font-sans);
            color: var(--sek-text);
            line-height: 1.6;
        }

        /* ===== PANELS ===== */
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

        /* ===== HEADER CONTENT ===== */
        .sek-header-content {
            display: flex;
            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;
        }

        .sek-header-icon {
            font-size: 3rem;
            line-height: 1;
            flex-shrink: 0;
        }

        .sek-header-text {
            flex: 1;
            min-width: 200px;
        }

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

        .sek-sub {
            font-size: 0.75rem;
            color: var(--sek-text-muted);
            line-height: 1.3;
        }

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

        /* ===== STATUS GRID - FIXED LAYOUT ===== */
        .sek-status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 0.75rem;
            margin-bottom: 1.5rem;
            width: 100%;
        }

        /* Mobile: Force 2 columns max */
        @media (max-width: 640px) {
            .sek-status-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        .sek-status-card {
            background: rgba(0,0,0,0.3);
            border-radius: var(--sek-radius-sm);
            padding: 0.75rem 1rem;
            border-left: 3px solid var(--sek-primary);
            min-width: 0; /* Prevent overflow */
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

        /* ===== TABS ===== */
        .sek-tabs {
            display: flex;
            gap: 0.5rem;
            border-bottom: 2px solid var(--sek-primary-border);
            margin-bottom: 1.5rem;
            overflow-x: auto;
            scrollbar-width: thin;
            padding-bottom: 0.25rem;
        }

        .sek-tabs::-webkit-scrollbar {
            height: 4px;
        }

        .sek-tabs::-webkit-scrollbar-thumb {
            background: var(--sek-primary-border);
            border-radius: 4px;
        }

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
            transition: all var(--sek-transition);
            flex-shrink: 0;
        }

        .sek-tab:hover {
            background: var(--sek-primary-light);
            color: var(--sek-text);
        }

        .sek-tab.active {
            background: rgba(16,185,129,0.18);
            border-color: var(--sek-primary);
            color: var(--sek-primary);
        }

        /* ===== TAB CONTENT ===== */
        .tab-content {
            width: 100%;
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* ===== FORMS ===== */
        .sek-form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-bottom: 1rem;
            width: 100%;
        }

        @media (max-width: 640px) {
            .sek-form-grid {
                grid-template-columns: 1fr;
            }
        }

        .sek-form-group {
            width: 100%;
        }

        .sek-label {
            display: block;
            font-size: 0.75rem;
            color: var(--sek-text-muted);
            margin-bottom: 0.5rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
        }

        .sek-input,
        .sek-select,
        .sek-textarea {
            width: 100%;
            padding: 0.75rem 1rem;
            background: rgba(0,0,0,0.3);
            border: 1.5px solid var(--sek-primary-border);
            border-radius: var(--sek-radius-xs);
            color: var(--sek-text);
            font-family: inherit;
            font-size: 0.9rem;
            outline: none;
            transition: border-color var(--sek-transition);
        }

        .sek-input:focus,
        .sek-select:focus,
        .sek-textarea:focus {
            border-color: var(--sek-primary);
            box-shadow: 0 0 0 3px var(--sek-primary-light);
        }

        .sek-select option {
            background: #1e293b;
            color: var(--sek-text);
        }

        .sek-textarea {
            resize: vertical;
            min-height: 100px;
            font-family: inherit;
        }

        /* ===== BUTTONS ===== */
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

        .sek-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }

        .sek-btn-primary {
            background: linear-gradient(135deg, var(--sek-primary), #059669);
            color: #020617;
        }

        .sek-btn-primary:hover:not(:disabled) {
            box-shadow: 0 6px 24px rgba(16,185,129,0.3);
        }

        .sek-btn-sm {
            padding: 0.4rem 1rem;
            font-size: 0.75rem;
            border-radius: 20px;
        }

        /* ===== UPLOAD AREA ===== */
        .sek-upload-area {
            border: 2px dashed var(--sek-primary-border);
            border-radius: var(--sek-radius-xs);
            padding: 2rem 1.5rem;
            text-align: center;
            cursor: pointer;
            transition: border-color var(--sek-transition);
            margin-top: 0.5rem;
        }

        .sek-upload-area:hover {
            border-color: var(--sek-primary);
            background: var(--sek-primary-light);
        }

        .sek-upload-icon {
            font-size: 2rem;
            color: var(--sek-primary);
            margin-bottom: 0.5rem;
            display: block;
        }

        .sek-preview {
            max-width: 100%;
            max-height: 300px;
            border-radius: var(--sek-radius-xs);
            margin-top: 1rem;
            display: block;
        }

        /* ===== TABLES ===== */
        .sek-table-wrap {
            overflow-x: auto;
            border-radius: var(--sek-radius);
            border: 1px solid var(--sek-border);
            margin-top: 1rem;
            width: 100%;
        }

        table.sek-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.85rem;
        }

        table.sek-table thead {
            background: rgba(0,0,0,0.3);
        }

        table.sek-table th {
            padding: 0.75rem 1rem;
            text-align: left;
            font-size: 0.7rem;
            text-transform: uppercase;
            color: var(--sek-text-muted);
            font-weight: 600;
            white-space: nowrap;
        }

        table.sek-table td {
            padding: 0.75rem 1rem;
            border-top: 1px solid var(--sek-border);
            vertical-align: middle;
        }

        table.sek-table tr:hover td {
            background: rgba(255,255,255,0.02);
        }

        /* ===== BADGES ===== */
        .sek-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.7rem;
            font-weight: 600;
            white-space: nowrap;
        }

        .sek-badge-aman {
            background: rgba(16,185,129,0.2);
            color: #10b981;
            border: 1px solid rgba(16,185,129,0.3);
        }

        .sek-badge-warning {
            background: rgba(245,158,11,0.2);
            color: #f59e0b;
            border: 1px solid rgba(245,158,11,0.3);
        }

        .sek-badge-danger {
            background: rgba(239,68,68,0.2);
            color: #ef4444;
            border: 1px solid rgba(239,68,68,0.3);
        }

        /* ===== LOADER ===== */
        .sek-loader {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 3rem 1rem;
            text-align: center;
        }

        .sek-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--sek-primary-light);
            border-top-color: var(--sek-primary);
            border-radius: 50%;
            animation: sek-spin 1s linear infinite;
            margin-bottom: 1rem;
        }

        @keyframes sek-spin {
            to { transform: rotate(360deg); }
        }

        /* ===== SCHEDULE TABLE ===== */
        .sek-schedule-table td {
            padding: 0.25rem;
            text-align: center;
            vertical-align: middle;
        }

        .sek-schedule-input {
            width: 60px;
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

        .sek-schedule-input:focus {
            border-color: var(--sek-primary);
            outline: none;
            box-shadow: 0 0 0 2px var(--sek-primary-light);
        }

        .sek-drag-handle {
            cursor: grab;
            padding: 0 4px;
            color: var(--sek-text-muted);
            user-select: none;
        }

        .sek-drag-handle:active {
            cursor: grabbing;
        }

        /* ===== UTILITIES ===== */
        .text-center {
            text-align: center;
        }

        .mb-2 {
            margin-bottom: 0.5rem;
        }

        .py-4 {
            padding-top: 1rem;
            padding-bottom: 1rem;
        }

        .opacity-70 {
            opacity: 0.7;
        }

        /* ===== RESPONSIVE ADJUSTMENTS ===== */
        @media (max-width: 768px) {
            .sek-title {
                font-size: 1.5rem;
            }

            .sek-header-icon {
                font-size: 2.5rem;
            }

            .sek-status-value {
                font-size: 0.9rem;
            }

            .sek-tab {
                padding: 0.5rem 1rem;
                font-size: 0.8rem;
            }

            .sek-panel {
                padding: 1rem;
            }
        }
    `;
    document.head.appendChild(s);
}

/* ==========================================================================
   HELPER FUNCTIONS
   ========================================================================== */
function escapeHTML(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function getCurrentShift() {
    const jam = new Date().getHours();
    return (jam >= 7 && jam < 19) ? 'PAGI (07:00-19:00)' : 'MALAM (19:00-07:00)';
}

/* ==========================================================================
   ✅ BUILD SHELL - Cleaned up HTML structure
   ========================================================================== */
function buildShell(user) {
    const userName = user?.name?.toUpperCase() || 'GUEST';
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
                <div class="sek-user-badge">${escapeHTML(userName)}</div>
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
                <span class="sek-status-label">JARAK</span>
                <span class="sek-status-value" id="sek-jarak">—</span>
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
                        <div class="sek-form-group">
                            <label class="sek-label">Tanggal</label>
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
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem;">
                    <h3 style="font-size:1.2rem;font-weight:700;color:var(--sek-primary);">📜 Riwayat Laporan</h3>
                    <button class="sek-btn sek-btn-sm" id="sek-refresh-history">🔄 Refresh</button>
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
            </div>
        </div>

        <div id="sek-jadwal-tab" class="tab-content" style="display:none;">
            <div class="sek-panel">
                <h3 style="font-size:1.2rem;font-weight:700;color:var(--sek-primary);margin-bottom:1rem;">📅 Jadwal Piket</h3>
                <div class="sek-loader">
                    <div class="sek-spinner"></div>
                    <p>Loading jadwal...</p>
                </div>
            </div>
        </div>

        <div id="sek-harian-tab" class="tab-content" style="display:none;">
            <div class="sek-panel">
                <h3 style="font-size:1.2rem;font-weight:700;color:var(--sek-primary);margin-bottom:1rem;">📊 Laporan Harian</h3>
                <div class="sek-loader">
                    <div class="sek-spinner"></div>
                    <p>Loading laporan...</p>
                </div>
            </div>
        </div>
    </div>
    `;
}

/* ==========================================================================
   EXPORT DEFAULT - Inject CSS FIRST, then return HTML
   ========================================================================== */
export default async function initModule(config, utils, supabase, currentUser, showToast, showModal, loader, translations, currentLang, container) {
    // ✅ CRITICAL: Inject CSS BEFORE returning HTML
    injectCSS();
    
    // Return HTML shell immediately
    const shellHTML = buildShell(currentUser);
    
    // Initialize logic after DOM ready
    setTimeout(async () => {
        if (!container) {
            console.error('[SEKURITI] Container tidak tersedia');
            return;
        }
        await initModuleLogic(config, utils, supabase, currentUser, showToast, showModal, loader, translations, currentLang, container);
    }, 100);
    
    return shellHTML;
}

/* ==========================================================================
   MODULE LOGIC - Simplified for reliability
   ========================================================================== */
async function initModuleLogic(config, utils, supabase, currentUser, showToast, showModal, loader, translations, currentLang, container) {
    
    const toast = showToast || function(msg, type) {
        console.log(`[${type}] ${msg}`);
    };

    let _sb = supabase || window.S?.sb || null;
    let _user = currentUser || null;
    let _tab = 'laporan';

    // Update status bar
    function updateStatus() {
        const shiftEl = container.querySelector('#sek-shift');
        const dbEl = container.querySelector('#sek-db-status');
        
        if (shiftEl) shiftEl.textContent = getCurrentShift();
        
        if (dbEl) {
            if (_sb) {
                dbEl.innerHTML = '<span class="sek-badge sek-badge-aman">ONLINE</span>';
            } else {
                dbEl.innerHTML = '<span class="sek-badge sek-badge-danger">OFFLINE</span>';
            }
        }
    }

    // Tab switching
    function switchTab(newTab) {
        _tab = newTab;
        
        container.querySelectorAll('.sek-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === newTab);
        });
        
        container.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
        });
        
        const target = container.querySelector(`#sek-${newTab}-tab`);
        if (target) target.style.display = 'block';

        if (newTab === 'history') loadHistory();
    }

    // Load history
    async function loadHistory() {
        const tbody = container.querySelector('#sek-history-body');
        if (!tbody || !_sb) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">Database offline</td></tr>';
            return;
        }

        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><div class="sek-spinner" style="margin:0 auto;"></div></td></tr>';

        try {
            const { data, error } = await _sb
                .from('sekuriti_reports')
                .select('id, tanggal, shift, petugas, lokasi, status, created_at')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            if (!data || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 opacity-70">Belum ada laporan</td></tr>';
                return;
            }

            let html = '';
            data.forEach(item => {
                const statusBadge = item.status === 'verified' ? 'sek-badge-aman' : 
                                   item.status === 'pending' ? 'sek-badge-warning' : 'sek-badge-danger';
                html += `<tr>
                    <td>${item.tanggal || '—'}</td>
                    <td>${escapeHTML(item.shift || '—')}</td>
                    <td>${Array.isArray(item.petugas) ? escapeHTML(item.petugas.join(', ')) : escapeHTML(item.petugas || '—')}</td>
                    <td>${escapeHTML(item.lokasi || '—')}</td>
                    <td><span class="sek-badge ${statusBadge}">${item.status || '—'}</span></td>
                    <td><button class="sek-btn sek-btn-sm" onclick="alert('Detail: ${item.id}')">👁️</button></td>
                </tr>`;
            });

            tbody.innerHTML = html;
        } catch (err) {
            console.error('[SEKURITI] Load history error:', err);
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4" style="color:#ef4444;">Error: ${escapeHTML(err.message)}</td></tr>`;
        }
    }

    // Handle photo upload
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
            if (base64Input) {
                base64Input.value = ev.target.result;
            }
        };
        reader.readAsDataURL(file);
    });

    // Handle form submit
    container.querySelector('#sekForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        toast('Form submitted! (Demo mode)', 'success');
    });

    // Bind tab buttons
    container.querySelectorAll('.sek-tab').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Bind refresh button
    container.querySelector('#sek-refresh-history')?.addEventListener('click', loadHistory);

    // Initialize
    const tanggalInput = container.querySelector('#sek-tanggal');
    const shiftInput = container.querySelector('#sek-shift-input');
    
    if (tanggalInput) tanggalInput.value = new Date().toISOString().split('T')[0];
    if (shiftInput) shiftInput.value = getCurrentShift();

    updateStatus();
    setInterval(updateStatus, 60000);

    console.log('[SEKURITI] ✅ Module initialized - Bi idznillah 💚');
}
