/**
 * modules/sekuriti/module.js
 * Dream OS v2.0 — Sekuriti Module (FIXED VERSION)
 * ✅ Bug Fixed: Black Screen + Container Mismatch
 */

'use strict';

const SB_URL_FALLBACK = 'https://pvznaeppaagylwddirla.supabase.co';
const SB_KEY_FALLBACK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2em5hZXBwYWFneWx3ZGRpcmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTEwNDMsImV4cCI6MjA4NzUyNzA0M30.t9SJi3VfsBDkKmeZ3egZ4rbvljl4xe0WwNkPtfA9-vo';

const DEPOK_CORE = { lat: -6.4000, lng: 106.8200 };
const SAFE_RADIUS_KM = 5.0;
const listPetugas = ['SUDARSONO', 'MARHUSIN', 'HERIYATNO', 'SUNARKO', 'HARIYANSAHC', 'AGUS SUTISNA', 'DONIH'];
const SHIFT_OPTIONS = ['P', 'M', 'L', 'CT'];

/* ══════════════════════════════════════════════════════════
   CSS INJECTION — FIXED: Added missing --sek-border
══════════════════════════════════════════════════════════ */
function injectCSS() {
    if (document.getElementById('sekuriti-styles')) return;
    const s = document.createElement('style');
    s.id = 'sekuriti-styles';
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
            --sek-font-sans: 'Rajdhani', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            --sek-border: rgba(255,255,255,0.08); /* ✅ ADDED: Missing variable */
        }
        #sekuriti-root * { box-sizing: border-box; }
        #sekuriti-root {
            max-width: 1200px;
            margin: 0 auto;
            padding: 1rem;
            font-family: var(--sek-font-sans);
            color: var(--sek-text);
        }
        .sek-panel { background: var(--sek-bg-panel); backdrop-filter: blur(18px); border: 1px solid var(--sek-primary-border); border-radius: var(--sek-radius); padding: 1.5rem; margin-bottom: 1.5rem; }        .sek-header { background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05)); border-left: 4px solid var(--sek-primary); }
        .sek-title { font-size: 1.8rem; font-weight: 800; background: linear-gradient(135deg, var(--sek-primary), #059669); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .sek-tabs { display: flex; gap: 0.5rem; border-bottom: 2px solid var(--sek-primary-border); margin-bottom: 1.5rem; overflow-x: auto; }
        .sek-tab { padding: 0.65rem 1.5rem; background: rgba(255,255,255,0.04); border: 1px solid transparent; border-radius: 8px 8px 0 0; cursor: pointer; font-weight: 600; font-size: 0.9rem; color: var(--sek-text-dim); white-space: nowrap; transition: background var(--sek-transition), color var(--sek-transition); }
        .sek-tab:hover { background: var(--sek-primary-light); color: var(--sek-text); }
        .sek-tab.active { background: rgba(16,185,129,0.18); border-color: var(--sek-primary); color: var(--sek-primary); }
        .sek-status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem; }
        .sek-status-card { background: rgba(0,0,0,0.2); border-radius: var(--sek-radius-sm); padding: 1rem; border-left: 3px solid var(--sek-primary); }
        .sek-status-label { font-size: 0.65rem; text-transform: uppercase; color: var(--sek-text-muted); letter-spacing: 0.5px; }
        .sek-status-value { font-size: 1.1rem; font-weight: 700; margin-top: 0.25rem; color: var(--sek-text); }
        .sek-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
        .sek-label { display: block; font-size: 0.75rem; color: var(--sek-text-muted); margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.5px; }
        .sek-input, .sek-select, .sek-textarea { width: 100%; padding: 0.75rem 1rem; background: rgba(0,0,0,0.3); border: 1.5px solid var(--sek-primary-border); border-radius: var(--sek-radius-xs); color: var(--sek-text); font-family: inherit; font-size: 0.9rem; outline: none; }
        .sek-input:focus, .sek-select:focus, .sek-textarea:focus { border-color: var(--sek-primary); box-shadow: 0 0 0 3px var(--sek-primary-light); }
        .sek-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.6rem 1.2rem; border-radius: var(--sek-radius-xs); font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: transform var(--sek-transition), background var(--sek-transition), border-color var(--sek-transition); border: none; background: rgba(255,255,255,0.08); color: var(--sek-text); }
        .sek-btn:hover:not(:disabled) { transform: translateY(-1px); background: rgba(255,255,255,0.15); }
        .sek-btn-primary { background: linear-gradient(135deg, var(--sek-primary), #059669); color: #020617; }
        .sek-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: var(--sek-shadow); }
        .sek-btn-sm { padding: 0.3rem 1rem; font-size: 0.75rem; border-radius: 20px; }
        .sek-table-wrap { overflow-x: auto; border-radius: var(--sek-radius); border: 1px solid var(--sek-border); }
        table.sek-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        table.sek-table thead { background: rgba(0,0,0,0.3); }
        table.sek-table th { padding: 0.75rem 1rem; text-align: left; font-size: 0.7rem; text-transform: uppercase; color: var(--sek-text-muted); }
        table.sek-table td { padding: 0.75rem 1rem; border-top: 1px solid var(--sek-border); }
        table.sek-table tr:hover td { background: rgba(255,255,255,0.02); }
        .sek-badge { display: inline-block; padding: 0.2rem 0.75rem; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
        .sek-badge-aman { background: rgba(16,185,129,0.2); color: #10b981; }
        .sek-badge-warning { background: rgba(245,158,11,0.2); color: #f59e0b; }
        .sek-badge-danger { background: rgba(239,68,68,0.2); color: #ef4444; }
        .sek-loader { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; }
        .sek-spinner { width: 40px; height: 40px; border: 3px solid var(--sek-primary-light); border-top-color: var(--sek-primary); border-radius: 50%; animation: sek-spin 1s linear infinite; }
        @keyframes sek-spin { to { transform: rotate(360deg); } }
        .sek-schedule-table td { padding: 0.25rem; text-align: center; vertical-align: middle; }
        .sek-schedule-input { width: 60px; padding: 0.4rem; background: rgba(0,0,0,0.4); border: 1px solid var(--sek-primary-border); border-radius: 6px; color: white; text-align: center; font-weight: bold; cursor: pointer; }
        .sek-schedule-input:focus { border-color: var(--sek-primary); outline: none; box-shadow: 0 0 0 2px var(--sek-primary-light); }
        .sek-schedule-input option { background: #1e293b; }
        .sek-drag-handle { cursor: grab; padding: 0 4px; color: var(--sek-text-muted); }
        .sek-drag-handle:active { cursor: grabbing; }
        .sek-template-btn { background: rgba(59,130,246,0.2); border: 1px solid #3b82f6; color: #3b82f6; }
        .sek-template-btn:hover { background: rgba(59,130,246,0.3); }
        .sek-upload-area { border: 2px dashed var(--sek-primary-border); border-radius: var(--sek-radius-xs); padding: 1.5rem; text-align: center; cursor: pointer; transition: border-color var(--sek-transition); }
        .sek-upload-area:hover { border-color: var(--sek-primary); }
        .sek-preview { max-width: 100%; border-radius: var(--sek-radius-xs); margin-top: 0.75rem; }
    `;
    document.head.appendChild(s);
}

/* ══════════════════════════════════════════════════════════
   MAIN EXPORT — FIXED: Return HTML shell FIRST
══════════════════════════════════════════════════════════ */export default async function initModule(config, utils, supabase, currentUser, showToast, showModal, loader, translations, currentLang, container) {
    
    // ✅ FIXED: Return shell HTML immediately (parent expects this)
    const shellHTML = buildShell(currentUser);
    
    // ✅ Then do async rendering AFTER parent injects HTML
    setTimeout(async () => {
        if (!container) {
            console.error('[SEKURITI] Container not provided');
            return;
        }
        
        injectCSS();
        await initModuleLogic(config, utils, supabase, currentUser, showToast, showModal, loader, translations, currentLang, container);
    }, 50); // Small delay to ensure parent has injected HTML
    
    return shellHTML; // ✅ Return HTML string for parent
}

/* ══════════════════════════════════════════════════════════
   SHELL BUILDER — Returns HTML string for parent
══════════════════════════════════════════════════════════ */
function buildShell(user) {
    const userName = user?.name?.toUpperCase() || 'GUEST';
    return `
    <div id="sekuriti-root">
        <div class="sek-panel sek-header">
            <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
                <div style="font-size:3rem;">🛡️</div>
                <div>
                    <div class="sek-title">SEKURITI</div>
                    <div class="sek-sub" style="font-size:0.75rem;color:#94a3b8;">Sistem Monitoring & Laporan Patroli 24/7</div>
                </div>
                <div style="margin-left:auto; display:flex; gap:0.5rem;">
                    <span style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);color:#a855f7;padding:0.4rem 1rem;border-radius:30px;font-size:0.8rem;">${esc(userName)}</span>
                </div>
            </div>
        </div>

        <div class="sek-status-grid">
            <div class="sek-status-card"><div class="sek-status-label">SHIFT</div><div class="sek-status-value" id="sek-shift">${getCurrentShift()}</div></div>
            <div class="sek-status-card"><div class="sek-status-label">LOKASI</div><div class="sek-status-value" id="sek-lokasi">—</div></div>
            <div class="sek-status-card"><div class="sek-status-label">JARAK DARI CORE</div><div class="sek-status-value" id="sek-jarak">—</div></div>
            <div class="sek-status-card"><div class="sek-status-label">STATUS</div><div class="sek-status-value" id="sek-status">—</div></div>
        </div>

        <div class="sek-tabs">
            <button class="sek-tab active" data-tab="laporan">📋 Laporan Patroli</button>
            <button class="sek-tab" data-tab="history">📜 Riwayat</button>
            <button class="sek-tab" data-tab="jadwal">📅 Jadwal Piket</button>            <button class="sek-tab" data-tab="harian">📊 Laporan Harian</button>
        </div>

        <div id="sek-laporan-tab" class="tab-content">
            ${renderLaporanForm()}
        </div>
        <div id="sek-history-tab" class="tab-content" style="display:none;">
            ${renderHistory()}
        </div>
        <div id="sek-jadwal-tab" class="tab-content" style="display:none;">
            ${renderJadwal()}
        </div>
        <div id="sek-harian-tab" class="tab-content" style="display:none;">
            ${renderHarian()}
        </div>
    </div>
    `;
}

/* ══════════════════════════════════════════════════════════
   MODULE LOGIC — Async initialization AFTER shell is injected
══════════════════════════════════════════════════════════ */
async function initModuleLogic(config, utils, supabase, currentUser, showToast, showModal, loader, translations, currentLang, container) {
    
    const toast = showToast || function(msg, type) {
        const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
        const el = document.createElement('div');
        el.className = 'toast toast-' + type;
        el.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
        const tc = document.getElementById('toast-container');
        if (tc) {
            tc.appendChild(el);
            setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 350); }, 3000);
        } else {
            el.style.cssText = `position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(16,185,129,.9);color:white;padding:9px 18px;border-radius:10px;z-index:99999;font-weight:700;font-size:.85rem;`;
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 2800);
        }
    };

    const esc = utils?.esc || function(s) {
        return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    };

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', {day:'2-digit',month:'short',year:'numeric'}) : '—';
    const fmtDateTime = (d) => d ? new Date(d).toLocaleString('id-ID', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '';

    let _sb = supabase || null;
    let _user = currentUser || null;
    let _lang = currentLang || 'id';    let _tab = 'laporan';

    // === Helper Supabase ===
    async function ensureSB() {
        if (_sb) return true;
        if (window.supabase?.createClient) {
            _sb = window.supabase.createClient(SB_URL_FALLBACK, SB_KEY_FALLBACK);
            return true;
        }
        return new Promise((resolve) => {
            const sc = document.createElement('script');
            sc.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            sc.onload = () => {
                if (window.supabase) { _sb = window.supabase.createClient(SB_URL_FALLBACK, SB_KEY_FALLBACK); resolve(true); }
                else resolve(false);
            };
            sc.onerror = () => resolve(false);
            document.head.appendChild(sc);
        });
    }

    async function writeAuditLog(action, detail) {
        if (!_sb) return;
        try {
            await _sb.from('audit_logs').insert([{
                action, detail, user: _user?.name || 'System', created_at: new Date().toISOString()
            }]);
        } catch (e) { console.warn('[SEKURITI] audit_log error:', e.message); }
    }

    // === Helpers ===
    function getCurrentShift() {
        const jam = new Date().getHours();
        return (jam >= 7 && jam < 19) ? 'PAGI (07:00-19:00)' : 'MALAM (19:00-07:00)';
    }

    function getGeolocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) reject('GPS tidak didukung');
            navigator.geolocation.getCurrentPosition(
                pos => resolve(pos.coords),
                err => reject('Error GPS: ' + err.message),
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    }

    function checkSafeCore(lat, lng) {
        const R = 6371;
        const dLat = (lat - DEPOK_CORE.lat) * Math.PI / 180;        const dLng = (lng - DEPOK_CORE.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(DEPOK_CORE.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        return { safe: distance <= SAFE_RADIUS_KM, distance };
    }

    async function uploadPhoto(base64Data) {
        try {
            const response = await fetch(base64Data);
            const blob = await response.blob();
            const filename = `sekuriti/${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;
            const { error } = await _sb.storage.from('sekuriti-foto').upload(filename, blob, { cacheControl: '3600', upsert: false });
            if (error) throw error;
            const { data: urlData } = _sb.storage.from('sekuriti-foto').getPublicUrl(filename);
            return urlData.publicUrl;
        } catch (err) {
            console.error('[SEKURITI] Upload gagal:', err);
            return null;
        }
    }

    // === Render Functions ===
    function renderLaporanForm() {
        return `
        <div class="sek-panel">
            <h3 style="font-size:1.2rem;font-weight:700;margin-bottom:1.5rem;color:var(--sek-primary);">📝 Laporan Patroli Baru</h3>
            <form id="sekForm">
                <div class="sek-form-grid">
                    <div><label class="sek-label">Tanggal</label><input type="text" id="sek-tanggal" class="sek-input" readonly></div>
                    <div><label class="sek-label">Shift</label><input type="text" id="sek-shift-input" class="sek-input" readonly></div>
                </div>
                <div class="sek-form-grid">
                    <div><label class="sek-label">Petugas Jaga *</label>
                        <select id="sek-petugas" class="sek-select" required>
                            <option value="">-- Pilih Petugas --</option>
                            ${listPetugas.map(n => `<option value="${n}">${n}</option>`).join('')}
                        </select>
                    </div>
                    <div><label class="sek-label">Lokasi Patroli *</label><input type="text" id="sek-lokasi-input" class="sek-input" placeholder="Contoh: Pos Utama" required></div>
                </div>
                <div><label class="sek-label">Deskripsi Situasi *</label><textarea id="sek-deskripsi" rows="4" class="sek-textarea" placeholder="Jelaskan situasi / kejadian..." required></textarea></div>
                <div>
                    <label class="sek-label">Foto Bukti (wajib)</label>
                    <div class="sek-upload-area" onclick="document.getElementById('sek-foto').click()">
                        <i class="fas fa-camera" style="font-size:2rem;color:var(--sek-primary);margin-bottom:0.5rem;"></i>
                        <p style="font-size:0.9rem;">Klik untuk ambil foto (geotag otomatis)</p>
                        <input type="file" id="sek-foto" accept="image/*" capture="environment" style="display:none;" required>                    </div>
                    <img id="sek-preview" class="sek-preview" style="display:none; max-width:200px; margin-top:0.75rem;">
                    <input type="hidden" id="sek-foto-base64">
                </div>
                <div style="margin-top:1rem;">
                    <button type="submit" class="sek-btn sek-btn-primary" id="sek-submit"><i class="fas fa-lock"></i> Enkripsi & Kirim</button>
                </div>
                <div id="sek-form-result" style="margin-top:1rem;text-align:center;"></div>
            </form>
        </div>
        `;
    }

    function renderHistory() {
        return `
        <div class="sek-panel">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
                <h3 style="font-size:1.2rem;font-weight:700;color:var(--sek-primary);">📜 Riwayat Laporan Patroli</h3>
                <button class="sek-btn sek-btn-sm" id="sek-refresh-history"><i class="fas fa-sync-alt"></i> Refresh</button>
            </div>
            <div class="sek-table-wrap">
                <table class="sek-table">
                    <thead>
                        <tr><th>Tanggal</th><th>Shift</th><th>Petugas</th><th>Lokasi</th><th>Koordinat</th><th>Status</th><th>Aksi</th></tr>
                    </thead>
                    <tbody id="sek-history-body">
                        <tr><td colspan="7" style="text-align:center;padding:2rem;">Memuat...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        `;
    }

    function renderJadwal() {
        return `
        <div class="sek-panel">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
                <h3 style="font-size:1.2rem;font-weight:700;color:var(--sek-primary);">📅 Jadwal Piket Bulanan</h3>
                <div style="display:flex;gap:0.5rem;">
                    <button class="sek-btn sek-template-btn" id="sek-save-template"><i class="fas fa-save"></i> Simpan Template</button>
                    <button class="sek-btn sek-template-btn" id="sek-load-template"><i class="fas fa-folder-open"></i> Muat Template</button>
                    <button class="sek-btn sek-btn-primary" id="sek-generate-auto"><i class="fas fa-magic"></i> Generate Otomatis</button>
                    <button class="sek-btn sek-btn-primary" id="sek-save-jadwal"><i class="fas fa-database"></i> Simpan ke DB</button>
                </div>
            </div>
            <div class="sek-table-wrap" style="max-height:500px; overflow-y:auto;">
                <table class="sek-table sek-schedule-table" id="sek-schedule-table">
                    <thead id="sek-schedule-header"><tr><th>Petugas</th></tr></thead>
                    <tbody id="sek-schedule-body"></tbody>                </table>
            </div>
            <p style="font-size:0.7rem; color:var(--sek-text-muted); margin-top:0.75rem;">
                <i class="fas fa-info-circle"></i> Klik sel untuk ganti shift (P/M/L/CT). Drag nama petugas untuk tukar baris.
            </p>
        </div>
        `;
    }

    function renderHarian() {
        return `
        <div class="sek-panel">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
                <h3 style="font-size:1.2rem;font-weight:700;color:var(--sek-primary);">📊 Laporan Harian</h3>
                <div>
                    <button class="sek-btn sek-btn-sm" id="export-harian-pdf"><i class="fas fa-file-pdf"></i> PDF</button>
                    <button class="sek-btn sek-btn-sm" id="export-harian-excel"><i class="fas fa-file-excel"></i> Excel</button>
                </div>
            </div>
            <div id="sek-harian-content">
                <div class="sek-loader"><div class="sek-spinner"></div><p>Memuat laporan harian...</p></div>
            </div>
        </div>
        `;
    }

    // === Tab Switching ===
    function switchTab(newTab) {
        _tab = newTab;
        container.querySelectorAll('.sek-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === newTab);
        });
        container.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
        });
        container.querySelector(`#sek-${newTab}-tab`).style.display = 'block';
        
        if (newTab === 'history') loadHistory();
        if (newTab === 'jadwal') loadJadwal();
        if (newTab === 'harian') loadHarian();
    }

    // === Event Binding ===
    function bindEvents() {
        container.querySelectorAll('.sek-tab').forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });
        
        if (_tab === 'laporan') attachLaporanEvents();
        if (_tab === 'history') attachHistoryEvents();        if (_tab === 'jadwal') attachJadwalEvents();
        if (_tab === 'harian') attachHarianEvents();
    }

    function attachLaporanEvents() {
        const form = container.querySelector('#sekForm');
        const fotoInput = container.querySelector('#sek-foto');
        const preview = container.querySelector('#sek-preview');
        const base64Input = container.querySelector('#sek-foto-base64');
        const tanggalInput = container.querySelector('#sek-tanggal');
        const shiftInput = container.querySelector('#sek-shift-input');

        if (tanggalInput) tanggalInput.value = new Date().toISOString().split('T')[0];
        if (shiftInput) shiftInput.value = getCurrentShift();

        if (fotoInput) {
            fotoInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                        toast('File terlalu besar, maks 5MB', 'error');
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (preview) {
                            preview.src = ev.target.result;
                            preview.style.display = 'block';
                        }
                        if (base64Input) base64Input.value = ev.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        if (form) form.addEventListener('submit', handleSubmit);
    }

    function attachHistoryEvents() {
        const refreshBtn = container.querySelector('#sek-refresh-history');
        if (refreshBtn) refreshBtn.addEventListener('click', loadHistory);
    }

    function attachJadwalEvents() {
        loadJadwal();
        container.querySelector('#sek-save-template')?.addEventListener('click', () => saveTemplate());
        container.querySelector('#sek-load-template')?.addEventListener('click', () => loadTemplate());
        container.querySelector('#sek-generate-auto')?.addEventListener('click', () => generateAutoJadwal());
        container.querySelector('#sek-save-jadwal')?.addEventListener('click', () => saveJadwal());    }

    function attachHarianEvents() {
        loadHarian();
        container.querySelector('#export-harian-pdf')?.addEventListener('click', () => toast('Fitur PDF akan segera hadir!', 'info'));
        container.querySelector('#export-harian-excel')?.addEventListener('click', () => toast('Fitur Excel akan segera hadir!', 'info'));
    }

    // === Logic Functions ===
    async function handleSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const tanggal = container.querySelector('#sek-tanggal')?.value;
        const shift = container.querySelector('#sek-shift-input')?.value;
        const petugas = container.querySelector('#sek-petugas')?.value;
        const lokasi = container.querySelector('#sek-lokasi-input')?.value;
        const deskripsi = container.querySelector('#sek-deskripsi')?.value;
        const fotoBase64 = container.querySelector('#sek-foto-base64')?.value;

        if (!petugas || !lokasi || !deskripsi || !fotoBase64) {
            toast('Harap isi semua field wajib (termasuk foto)', 'warning');
            return;
        }

        const btn = container.querySelector('#sek-submit');
        const originalText = btn?.innerHTML;
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Memproses...';
        }

        try {
            let coords, safe, distance;
            try {
                coords = await getGeolocation();
                const check = checkSafeCore(coords.latitude, coords.longitude);
                safe = check.safe;
                distance = check.distance;
            } catch (gpsErr) {
                if (!confirm(`Gagal mendapatkan GPS (${gpsErr}). Lanjutkan tanpa koordinat?`)) throw new Error('Laporan dibatalkan');
                coords = null;
            }

            if (coords && !safe && !confirm(`Anda berada di luar safe core (${distance.toFixed(1)} km). Tetap kirim laporan?`)) {
                throw new Error('Laporan dibatalkan');
            }

            const fotoUrl = await uploadPhoto(fotoBase64);
            if (!fotoUrl) throw new Error('Upload foto gagal');
            const data = {
                tanggal, shift, petugas: [petugas], lokasi, deskripsi,
                koordinat: coords ? `${coords.latitude}, ${coords.longitude}` : null,
                foto_url: [fotoUrl], status: 'pending', created_at: new Date().toISOString()
            };

            const { error } = await _sb.from('sekuriti_reports').insert([data]);
            if (error) throw error;

            await writeAuditLog('Laporan Patroli', `${petugas} - ${lokasi}`);
            toast('Laporan berhasil dikirim!', 'success');
            if (form) form.reset();
            const preview = container.querySelector('#sek-preview');
            if (preview) preview.style.display = 'none';
            const base64Input = container.querySelector('#sek-foto-base64');
            if (base64Input) base64Input.value = '';
            const tanggalInput = container.querySelector('#sek-tanggal');
            if (tanggalInput) tanggalInput.value = new Date().toISOString().split('T')[0];
            const shiftInput = container.querySelector('#sek-shift-input');
            if (shiftInput) shiftInput.value = getCurrentShift();
        } catch (err) {
            console.error('[SEKURITI] Submit error:', err);
            toast('Gagal: ' + err.message, 'error');
            const result = container.querySelector('#sek-form-result');
            if (result) result.innerHTML = `<span style="color:#ef4444;">❌ ${err.message}</span>`;
        } finally {
            const btn = container.querySelector('#sek-submit');
            if (btn) {
                btn.disabled = false;
                if (originalText) btn.innerHTML = originalText;
            }
        }
    }

    async function loadHistory() {
        const tbody = container.querySelector('#sek-history-body');
        if (!tbody || !_sb) return;
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;"><div class="sek-spinner" style="margin:0 auto;"></div><p>Memuat...</p></td></tr>';
        try {
            const { data, error } = await _sb.from('sekuriti_reports').select('id, tanggal, shift, petugas, lokasi, koordinat, status, created_at').order('created_at', { ascending: false }).limit(50);
            if (error) throw error;
            if (!data || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;opacity:0.7;">Belum ada laporan</td></tr>';
                return;
            }
            let html = '';
            data.forEach(item => {
                const statusClass = item.status === 'verified' ? 'sek-badge-aman' : item.status === 'pending' ? 'sek-badge-warning' : 'sek-badge-danger';
                const statusText = item.status === 'verified' ? 'Terverifikasi' : item.status === 'pending' ? 'Pending' : 'Ditolak';
                html += `<tr>                    <td>${fmtDate(item.tanggal)}</td>
                    <td>${esc(item.shift)}</td>
                    <td>${Array.isArray(item.petugas) ? esc(item.petugas.join(', ')) : esc(item.petugas)}</td>
                    <td>${esc(item.lokasi)}</td>
                    <td>${item.koordinat || '-'}</td>
                    <td><span class="sek-badge ${statusClass}">${statusText}</span></td>
                    <td><button class="sek-btn sek-btn-sm" data-id="${item.id}" data-action="detail"><i class="fas fa-eye"></i></button></td>
                </tr>`;
            });
            tbody.innerHTML = html;
            tbody.querySelectorAll('[data-action="detail"]').forEach(btn => {
                btn.addEventListener('click', () => toast('Detail laporan ID: ' + btn.dataset.id, 'info'));
            });
        } catch (err) {
            console.error('[SEKURITI] loadHistory error:', err);
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:#ef4444;">Gagal memuat: ${esc(err.message)}</td></tr>`;
        }
    }

    async function loadJadwal() {
        const tbody = container.querySelector('#sek-schedule-body');
        const thead = container.querySelector('#sek-schedule-header tr');
        if (!tbody || !thead) return;

        const now = new Date();
        const bulan = now.getMonth() + 1;
        const tahun = now.getFullYear();
        const jmlHari = new Date(tahun, bulan, 0).getDate();

        let headerHtml = '<th>Petugas</th>';
        for (let i = 1; i <= jmlHari; i++) headerHtml += `<th>${i}</th>`;
        thead.innerHTML = headerHtml;

        await ensureSB();
        const { data, error } = await _sb.from('sekuriti_jadwal_master').select('petugas_name, jadwal_array').eq('bulan', bulan).eq('tahun', tahun);

        let html = '';
        listPetugas.forEach((nama, idx) => {
            const existing = data?.find(d => d.petugas_name === nama);
            const arr = existing?.jadwal_array || Array(jmlHari).fill('L');
            html += `<tr data-nama="${nama}" data-index="${idx}">`;
            html += `<td style="display:flex; align-items:center;"><span class="sek-drag-handle">☰</span> ${nama}</td>`;
            for (let tgl = 1; tgl <= jmlHari; tgl++) {
                const shift = arr[tgl-1] || 'L';
                html += `<td><select class="sek-schedule-input" data-nama="${nama}" data-tgl="${tgl}">${SHIFT_OPTIONS.map(opt => `<option value="${opt}" ${opt===shift?'selected':''}>${opt}</option>`).join('')}</select></td>`;
            }
            html += `</tr>`;
        });
        tbody.innerHTML = html;
        // Simple drag & drop without SortableJS dependency
        let draggedRow = null;
        tbody.querySelectorAll('.sek-drag-handle').forEach(handle => {
            handle.addEventListener('dragstart', (e) => {
                draggedRow = handle.closest('tr');
                setTimeout(() => draggedRow.style.opacity = '0.5', 0);
            });
            handle.addEventListener('dragend', () => {
                if (draggedRow) draggedRow.style.opacity = '1';
                draggedRow = null;
            });
        });
        tbody.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(tbody, e.clientY);
            if (draggedRow) {
                if (afterElement == null) tbody.appendChild(draggedRow);
                else tbody.insertBefore(draggedRow, afterElement);
            }
        });

        function getDragAfterElement(container, y) {
            const draggableElements = [...container.querySelectorAll('tr:not(.dragging)')];
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
                else return closest;
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }

        tbody.querySelectorAll('.sek-schedule-input').forEach(sel => {
            sel.addEventListener('change', function() {
                this.style.borderColor = '#f59e0b';
                setTimeout(() => this.style.borderColor = '', 1000);
            });
        });
    }

    async function saveJadwal() {
        const bulan = new Date().getMonth() + 1;
        const tahun = new Date().getFullYear();
        const rows = container.querySelectorAll('#sek-schedule-body tr');
        const dataToSave = [];

        rows.forEach(row => {
            const nama = row.dataset.nama;
            const selects = row.querySelectorAll('.sek-schedule-input');
            const jadwalArray = Array.from(selects).map(sel => sel.value);
            dataToSave.push({ petugas_name: nama, bulan, tahun, jadwal_array: jadwalArray });        });

        try {
            toast('Menyimpan jadwal...', 'info');
            for (const item of dataToSave) {
                await _sb.from('sekuriti_jadwal_master').upsert(item, { onConflict: 'petugas_name, bulan, tahun' });
            }
            toast('✅ Jadwal berhasil disimpan!', 'success');
            await writeAuditLog('Update Jadwal Sekuriti', `Bulan ${bulan}/${tahun}`);
        } catch (err) {
            toast('❌ Gagal: ' + err.message, 'error');
        }
    }

    function generateAutoJadwal() {
        const bulan = new Date().getMonth() + 1;
        const tahun = new Date().getFullYear();
        const jmlHari = new Date(tahun, bulan, 0).getDate();
        const jadwalBaru = {};

        for (let tgl = 1; tgl <= jmlHari; tgl++) {
            const offset = Math.floor((tgl - 1) / 5) % 7;
            for (let i = 0; i < listPetugas.length; i++) {
                const idx = (i + offset) % listPetugas.length;
                if (!jadwalBaru[listPetugas[i]]) jadwalBaru[listPetugas[i]] = [];
                if (idx < 3) jadwalBaru[listPetugas[i]][tgl-1] = 'P';
                else if (idx < 5) jadwalBaru[listPetugas[i]][tgl-1] = 'M';
                else jadwalBaru[listPetugas[i]][tgl-1] = 'L';
            }
        }

        const donihIndex = listPetugas.indexOf('DONIH');
        if (donihIndex !== -1) {
            for (let tgl = 1; tgl <= jmlHari; tgl++) {
                if (jadwalBaru['DONIH'][tgl-1] === 'M') {
                    for (let p of listPetugas) {
                        if (p === 'DONIH') continue;
                        if (jadwalBaru[p][tgl-1] === 'L') {
                            jadwalBaru[p][tgl-1] = 'M';
                            jadwalBaru['DONIH'][tgl-1] = 'L';
                            break;
                        }
                    }
                }
            }
        }

        const tbody = container.querySelector('#sek-schedule-body');
        tbody.querySelectorAll('tr').forEach(row => {
            const nama = row.dataset.nama;            const selects = row.querySelectorAll('.sek-schedule-input');
            selects.forEach((sel, idx) => { sel.value = jadwalBaru[nama][idx] || 'L'; });
        });

        toast('✅ Jadwal otomatis digenerate (pola 3-2-1)', 'success');
    }

    function saveTemplate() {
        const rows = container.querySelectorAll('#sek-schedule-body tr');
        const template = [];
        rows.forEach(row => {
            const nama = row.dataset.nama;
            const selects = row.querySelectorAll('.sek-schedule-input');
            const shifts = Array.from(selects).map(s => s.value);
            template.push({ nama, shifts });
        });
        localStorage.setItem('sekuriti_template', JSON.stringify(template));
        toast('✅ Template tersimpan di localStorage', 'success');
    }

    function loadTemplate() {
        const json = localStorage.getItem('sekuriti_template');
        if (!json) { toast('Tidak ada template tersimpan', 'warning'); return; }
        try {
            const template = JSON.parse(json);
            const tbody = container.querySelector('#sek-schedule-body');
            tbody.querySelectorAll('tr').forEach(row => {
                const nama = row.dataset.nama;
                const templateItem = template.find(t => t.nama === nama);
                if (templateItem) {
                    const selects = row.querySelectorAll('.sek-schedule-input');
                    selects.forEach((sel, idx) => { if (templateItem.shifts[idx]) sel.value = templateItem.shifts[idx]; });
                }
            });
            toast('✅ Template dimuat', 'success');
        } catch (err) { toast('❌ Template rusak', 'error'); }
    }

    async function loadHarian() {
        const contentDiv = container.querySelector('#sek-harian-content');
        if (!contentDiv) return;
        const today = new Date().toISOString().split('T')[0];
        await ensureSB();
        const { data, error } = await _sb.from('sekuriti_reports').select('*').eq('tanggal', today).order('created_at', { ascending: true });
        if (error) { contentDiv.innerHTML = `<p class="text-red-500">Error: ${error.message}</p>`; return; }
        let html = `<p class="text-sm text-slate-400 mb-2">Tanggal: ${today}</p>`;
        if (!data || data.length === 0) {
            html += '<p class="text-center py-4 opacity-70">Belum ada laporan hari ini.</p>';
        } else {
            html += '<div class="sek-table-wrap"><table class="sek-table"><thead><tr><th>Waktu</th><th>Petugas</th><th>Lokasi</th><th>Deskripsi</th><th>Foto</th></tr></thead><tbody>';            data.forEach(item => {
                const waktu = fmtDateTime(item.created_at);
                html += `<tr><td>${waktu}</td><td>${Array.isArray(item.petugas) ? item.petugas.join(', ') : item.petugas}</td><td>${esc(item.lokasi)}</td><td>${esc(item.deskripsi || '-')}</td><td>${item.foto_url?.length ? `<a href="${item.foto_url[0]}" target="_blank" class="text-emerald-400">Lihat</a>` : '-'}</td></tr>`;
            });
            html += '</tbody></table></div>';
        }
        contentDiv.innerHTML = html;
    }

    async function updateLocationStatus() {
        try {
            const coords = await getGeolocation();
            const { safe, distance } = checkSafeCore(coords.latitude, coords.longitude);
            const lokasiEl = container.querySelector('#sek-lokasi');
            const jarakEl = container.querySelector('#sek-jarak');
            const statusEl = container.querySelector('#sek-status');
            if (lokasiEl) lokasiEl.textContent = `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
            if (jarakEl) jarakEl.textContent = `${distance.toFixed(1)} km`;
            if (statusEl) statusEl.innerHTML = safe ? '<span class="sek-badge-aman">AMAN</span>' : '<span class="sek-badge-danger">LUAR CORE</span>';
        } catch (err) {
            const lokasiEl = container.querySelector('#sek-lokasi');
            const jarakEl = container.querySelector('#sek-jarak');
            const statusEl = container.querySelector('#sek-status');
            if (lokasiEl) lokasiEl.textContent = 'Tidak dapat diakses';
            if (jarakEl) jarakEl.textContent = '-';
            if (statusEl) statusEl.innerHTML = '<span class="sek-badge-danger">GPS ERROR</span>';
        }
    }

    // === Init ===
    await ensureSB();
    bindEvents();
    updateLocationStatus();
    setInterval(updateLocationStatus, 30000);
    console.log('[SEKURITI] ✅ Module initialized');
    
    // Return cleanup function
    return function cleanup() {
        document.getElementById('sekuriti-styles')?.remove();
        console.log('[SEKURITI] Cleanup done');
    };
}

// Console log for debugging
if (typeof window !== 'undefined') {
    console.log('🛡️ Sekuriti module loaded | FIXED VERSION ✅');
}