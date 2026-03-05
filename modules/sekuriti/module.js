/**
 * modules/sekuriti/module.js
 * Dream OS v2.0 — Modul Sekuriti (Revisi)
 * ✅ Signature: (config, utils, supabase, currentUser, showToast, showModal, loader, translations, currentLang)
 * ✅ Fitur: Laporan patroli dengan GPS & foto, riwayat, jadwal 2 shift (PAGI 07-19, MALAM 19-07)
 * ✅ Smart system: validasi safe core, upload foto, integrasi audit_logs
 */

'use strict';

/* ============================================================
   FALLBACK CONFIG
============================================================ */
const SB_URL_FALLBACK = 'https://pvznaeppaagylwddirla.supabase.co';
const SB_KEY_FALLBACK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2em5hZXBwYWFneWx3ZGRpcmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTEwNDMsImV4cCI6MjA4NzUyNzA0M30.t9SJi3VfsBDkKmeZ3egZ4rbvljl4xe0WwNkPtfA9-vo';

const DEPOK_CORE = { lat: -6.4000, lng: 106.8200 };
const SAFE_RADIUS_KM = 5.0;
const listPetugas = ['SUDARSONO', 'MARHUSIN', 'HERIYATNO', 'SUNARKO', 'HARIYANSAHC', 'AGUS SUTISNA', 'DONIH'];

/* ============================================================
   CSS
============================================================ */
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
            --sek-border: rgba(255,255,255,0.08);
            --sek-border-strong: rgba(255,255,255,0.15);
            --sek-radius: 16px;
            --sek-radius-sm: 12px;
            --sek-radius-xs: 8px;
            --sek-transition: 0.2s ease;
            --sek-shadow: 0 4px 18px rgba(16,185,129,0.15);
            --sek-font-mono: 'JetBrains Mono', monospace;
            --sek-font-sans: 'Rajdhani', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        @media (prefers-reduced-motion: reduce) {
            * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
        #sekuriti-root * { box-sizing: border-box; }
        #sekuriti-root {
            max-width: 1200px;
            margin: 0 auto;
            padding: 1rem;
            font-family: var(--sek-font-sans);
            color: var(--sek-text);
        }
        .sek-panel {
            background: var(--sek-bg-panel);
            backdrop-filter: blur(18px);
            border: 1px solid var(--sek-primary-border);
            border-radius: var(--sek-radius);
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            transition: background var(--sek-transition), border-color var(--sek-transition);
        }
        .sek-panel:hover {
            background: rgba(15,23,42,0.92);
            border-color: var(--sek-primary);
        }
        .sek-header {
            background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05));
            border-left: 4px solid var(--sek-primary);
        }
        .sek-title {
            font-size: 1.8rem;
            font-weight: 800;
            background: linear-gradient(135deg, var(--sek-primary), #059669);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.25rem;
        }
        .sek-sub {
            font-size: 0.75rem;
            color: var(--sek-text-muted);
        }
        .sek-tabs {
            display: flex;
            gap: 0.5rem;
            border-bottom: 2px solid var(--sek-primary-border);
            margin-bottom: 1.5rem;
            overflow-x: auto;
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
            transition: background var(--sek-transition), color var(--sek-transition);
        }
        .sek-tab:hover { background: var(--sek-primary-light); color: var(--sek-text); }
        .sek-tab.active { background: rgba(16,185,129,0.18); border-color: var(--sek-primary); color: var(--sek-primary); }
        .sek-status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 0.75rem;
            margin-bottom: 1.5rem;
        }
        .sek-status-card {
            background: rgba(0,0,0,0.2);
            border-radius: var(--sek-radius-sm);
            padding: 1rem;
            border-left: 3px solid var(--sek-primary);
        }
        .sek-status-label {
            font-size: 0.65rem;
            text-transform: uppercase;
            color: var(--sek-text-muted);
            letter-spacing: 0.5px;
        }
        .sek-status-value {
            font-size: 1.1rem;
            font-weight: 700;
            margin-top: 0.25rem;
            color: var(--sek-text);
        }
        .sek-form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-bottom: 1rem;
        }
        .sek-label {
            display: block;
            font-size: 0.75rem;
            color: var(--sek-text-muted);
            margin-bottom: 0.25rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
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
            outline: none;
            transition: border-color var(--sek-transition), box-shadow var(--sek-transition);
        }
        .sek-input:focus, .sek-select:focus, .sek-textarea:focus {
            border-color: var(--sek-primary);
            box-shadow: 0 0 0 3px var(--sek-primary-light);
        }
        .sek-select option { background: #1e293b; color: var(--sek-text); }
        .sek-textarea { resize: vertical; min-height: 80px; }
        .sek-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.6rem 1.2rem;
            border-radius: var(--sek-radius-xs);
            font-weight: 700;
            font-size: 0.85rem;
            cursor: pointer;
            transition: transform var(--sek-transition), background var(--sek-transition), border-color var(--sek-transition);
            border: none;
            background: rgba(255,255,255,0.08);
            color: var(--sek-text);
        }
        .sek-btn:hover:not(:disabled) { transform: translateY(-1px); background: rgba(255,255,255,0.15); }
        .sek-btn-primary {
            background: linear-gradient(135deg, var(--sek-primary), #059669);
            color: #020617;
        }
        .sek-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: var(--sek-shadow); }
        .sek-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .sek-btn-sm {
            padding: 0.3rem 1rem;
            font-size: 0.75rem;
            border-radius: 20px;
        }
        .sek-upload-area {
            border: 2px dashed var(--sek-primary-border);
            border-radius: var(--sek-radius);
            padding: 1.5rem;
            text-align: center;
            cursor: pointer;
            transition: var(--sek-transition);
            background: var(--sek-primary-light);
        }
        .sek-upload-area:hover { border-color: var(--sek-primary); background: rgba(16,185,129,0.1); }
        .sek-preview {
            max-width: 200px;
            max-height: 150px;
            border-radius: var(--sek-radius-sm);
            margin-top: 0.75rem;
            display: none;
        }
        .sek-table-wrap {
            overflow-x: auto;
            border-radius: var(--sek-radius);
            border: 1px solid var(--sek-border);
        }
        table.sek-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.85rem;
        }
        table.sek-table thead { background: rgba(0,0,0,0.3); }
        table.sek-table th {
            padding: 0.75rem 1rem;
            text-align: left;
            font-size: 0.7rem;
            text-transform: uppercase;
            color: var(--sek-text-muted);
        }
        table.sek-table td {
            padding: 0.75rem 1rem;
            border-top: 1px solid var(--sek-border);
        }
        table.sek-table tr:hover td { background: rgba(255,255,255,0.02); }
        .sek-badge {
            display: inline-block;
            padding: 0.2rem 0.75rem;
            border-radius: 20px;
            font-size: 0.7rem;
            font-weight: 600;
        }
        .sek-badge-aman { background: rgba(16,185,129,0.2); color: #10b981; }
        .sek-badge-warning { background: rgba(245,158,11,0.2); color: #f59e0b; }
        .sek-badge-danger { background: rgba(239,68,68,0.2); color: #ef4444; }
        .sek-loader {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 3rem;
        }
        .sek-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--sek-primary-light);
            border-top-color: var(--sek-primary);
            border-radius: 50%;
            animation: sek-spin 1s linear infinite;
        }
        @keyframes sek-spin { to { transform: rotate(360deg); } }

        /* Print styles */
        @media print {
            #sekuriti-root {
                background: white;
                color: #1e293b;
                padding: 0.5in;
            }
            .sek-panel {
                background: white;
                backdrop-filter: none;
                border: 1px solid #ccc;
                box-shadow: none;
            }
            .sek-tabs, .sek-btn, .sek-header::before {
                display: none;
            }
        }

        /* Device tier low */
        .tier-low .sek-panel {
            backdrop-filter: none;
            background: rgba(15,23,42,0.95);
        }
        .tier-low .sek-spinner {
            animation: none;
        }
    `;
    document.head.appendChild(s);
}

/* ============================================================
   EXPORT DEFAULT
============================================================ */
export default async function initModule(config, utils, supabase, currentUser, showToast, showModal, loader, translations, currentLang) {
    injectCSS();

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
    let _lang = currentLang || 'id';

    function ensureSB() {
        if (_sb) return Promise.resolve(true);
        if (window.supabase?.createClient) {
            _sb = window.supabase.createClient(SB_URL_FALLBACK, SB_KEY_FALLBACK);
            return Promise.resolve(true);
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
                action,
                detail,
                user: _user?.name || 'System',
                created_at: new Date().toISOString()
            }]);
        } catch (e) { console.warn('[SEKURITI] audit_log error:', e.message); }
    }

    /* ============================================================
       HELPERS SPESIFIK
    ============================================================ */
    function getCurrentShift() {
        const jam = new Date().getHours();
        return (jam >= 7 && jam < 19) ? 'PAGI (07:00-19:00)' : 'MALAM (19:00-07:00)';
    }

    function getGeolocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) reject('GPS tidak didukung');
            navigator.geolocation.getCurrentPosition(
                pos => resolve(pos.coords),
                err => {
                    if (err.code === 1) reject('Izin GPS ditolak');
                    else if (err.code === 2) reject('Posisi tidak tersedia');
                    else if (err.code === 3) reject('Timeout GPS');
                    else reject('Error GPS: ' + err.message);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    }

    function checkSafeCore(lat, lng) {
        const R = 6371;
        const dLat = (lat - DEPOK_CORE.lat) * Math.PI / 180;
        const dLng = (lng - DEPOK_CORE.lng) * Math.PI / 180;
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
            const { error } = await _sb.storage
                .from('sekuriti-foto')
                .upload(filename, blob, { cacheControl: '3600', upsert: false });
            if (error) throw error;
            const { data: urlData } = _sb.storage.from('sekuriti-foto').getPublicUrl(filename);
            return urlData.publicUrl;
        } catch (err) {
            console.error('[SEKURITI] Upload gagal:', err);
            return null;
        }
    }

    /* ============================================================
       RENDER HTML
    ============================================================ */
    function renderRoot(container) {
        const userName = _user?.name?.toUpperCase() || 'GUEST';
        container.innerHTML = `
        <div id="sekuriti-root">
            <div class="sek-panel sek-header">
                <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
                    <div style="font-size:3rem;">🛡️</div>
                    <div>
                        <div class="sek-title">SEKURITI</div>
                        <div class="sek-sub">Sistem Monitoring & Laporan Patroli 24/7 · 2 Shift</div>
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
                <button class="sek-tab" data-tab="jadwal">📅 Jadwal</button>
            </div>

            <!-- TAB LAPORAN -->
            <div id="sek-laporan-tab" class="tab-content">
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
                                <p style="font-size:0.7rem;opacity:0.7;">Maks 5MB (JPG, PNG)</p>
                                <input type="file" id="sek-foto" accept="image/*" capture="environment" style="display:none;" required>
                            </div>
                            <img id="sek-preview" class="sek-preview">
                            <input type="hidden" id="sek-foto-base64">
                        </div>
                        <div style="margin-top:1rem;">
                            <button type="submit" class="sek-btn sek-btn-primary" id="sek-submit"><i class="fas fa-lock"></i> Enkripsi & Kirim</button>
                        </div>
                        <div id="sek-form-result" style="margin-top:1rem;text-align:center;"></div>
                    </form>
                </div>
            </div>

            <!-- TAB HISTORY -->
            <div id="sek-history-tab" class="tab-content" style="display:none;">
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
            </div>

            <!-- TAB JADWAL -->
            <div id="sek-jadwal-tab" class="tab-content" style="display:none;">
                <div class="sek-panel">
                    <h3 style="font-size:1.2rem;font-weight:700;margin-bottom:1.5rem;color:var(--sek-primary);">📅 Jadwal Petugas</h3>
                    <div id="sek-jadwal-view">
                        <div class="sek-loader"><div class="sek-spinner"></div><p style="margin-top:1rem;">Memuat jadwal...</p></div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    /* ============================================================
       LOAD HISTORY
    ============================================================ */
    async function loadHistory() {
        const tbody = document.getElementById('sek-history-body');
        if (!tbody || !_sb) return;
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;"><div class="sek-spinner" style="margin:0 auto;"></div><p>Memuat...</p></td></tr>';
        try {
            const { data, error } = await _sb
                .from('sekuriti_reports')
                .select('id, tanggal, shift, petugas, lokasi, koordinat, status, created_at')
                .order('created_at', { ascending: false })
                .limit(50);
            if (error) throw error;
            if (!data || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;opacity:0.7;">Belum ada laporan</td></tr>';
                return;
            }
            let html = '';
            data.forEach(item => {
                const statusClass = item.status === 'verified' ? 'sek-badge-aman' : item.status === 'pending' ? 'sek-badge-warning' : 'sek-badge-danger';
                const statusText = item.status === 'verified' ? 'Terverifikasi' : item.status === 'pending' ? 'Pending' : 'Ditolak';
                html += `
                    <tr>
                        <td>${fmtDate(item.tanggal)}</td>
                        <td>${esc(item.shift)}</td>
                        <td>${Array.isArray(item.petugas) ? esc(item.petugas.join(', ')) : esc(item.petugas)}</td>
                        <td>${esc(item.lokasi)}</td>
                        <td>${item.koordinat || '-'}</td>
                        <td><span class="sek-badge ${statusClass}">${statusText}</span></td>
                        <td><button class="sek-btn sek-btn-sm" data-id="${item.id}" data-action="detail"><i class="fas fa-eye"></i></button></td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        } catch (err) {
            console.error('[SEKURITI] loadHistory error:', err);
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:#ef4444;">Gagal memuat: ${esc(err.message)}</td></tr>`;
        }
    }

    /* ============================================================
       LOAD JADWAL
    ============================================================ */
    async function loadJadwal() {
        const view = document.getElementById('sek-jadwal-view');
        if (!view || !_sb) return;
        view.innerHTML = '<div class="sek-loader"><div class="sek-spinner"></div><p style="margin-top:1rem;">Memuat jadwal...</p></div>';
        try {
            const now = new Date();
            const tgl = now.getDate();
            const bulan = now.getMonth() + 1;
            const tahun = now.getFullYear();
            const { data, error } = await _sb
                .from('sekuriti_jadwal_master')
                .select('petugas_name, jadwal_array')
                .eq('bulan', bulan)
                .eq('tahun', tahun);
            if (error) throw error;
            if (!data || data.length === 0) {
                view.innerHTML = '<p style="text-align:center;padding:2rem;opacity:0.7;">Belum ada jadwal untuk bulan ini</p>';
                return;
            }
            let html = '<div class="sek-table-wrap"><table class="sek-table"><thead><tr><th>Petugas</th><th>Hari Ini</th><th>Besok</th><th>Lusa</th></tr></thead><tbody>';
            data.forEach(item => {
                const arr = item.jadwal_array || [];
                const todayShift = arr[tgl - 1] || '-';
                const tomorrowShift = arr[tgl] || '-';
                const dayAfterShift = arr[tgl + 1] || '-';
                html += `<tr><td>${esc(item.petugas_name)}</td><td>${todayShift}</td><td>${tomorrowShift}</td><td>${dayAfterShift}</td></tr>`;
            });
            html += '</tbody></table></div>';
            view.innerHTML = html;
        } catch (err) {
            console.error('[SEKURITI] loadJadwal error:', err);
            view.innerHTML = `<p style="text-align:center;padding:2rem;color:#ef4444;">Gagal memuat jadwal: ${esc(err.message)}</p>`;
        }
    }

    /* ============================================================
       SUBMIT FORM
    ============================================================ */
    async function handleSubmit(e) {
        e.preventDefault();
        const tanggal = document.getElementById('sek-tanggal').value;
        const shift = document.getElementById('sek-shift-input').value;
        const petugas = document.getElementById('sek-petugas').value;
        const lokasi = document.getElementById('sek-lokasi-input').value;
        const deskripsi = document.getElementById('sek-deskripsi').value;
        const fotoBase64 = document.getElementById('sek-foto-base64').value;

        if (!petugas || !lokasi || !deskripsi || !fotoBase64) {
            toast('Harap isi semua field wajib (termasuk foto)', 'warning');
            return;
        }

        const btn = document.getElementById('sek-submit');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-circle-notch" style="animation:sek-spin 1s linear infinite"></i> Memproses...';

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
                tanggal,
                shift,
                petugas: [petugas],
                lokasi,
                deskripsi,
                koordinat: coords ? `${coords.latitude}, ${coords.longitude}` : null,
                foto_url: [fotoUrl],
                status: 'pending',
                created_at: new Date().toISOString()
            };

            const { error } = await _sb.from('sekuriti_reports').insert([data]);
            if (error) throw error;

            await writeAuditLog('Laporan Patroli', `${petugas} - ${lokasi}`);
            toast('Laporan berhasil dikirim!', 'success');
            document.getElementById('sekForm').reset();
            document.getElementById('sek-preview').style.display = 'none';
            document.getElementById('sek-foto-base64').value = '';
            document.getElementById('sek-tanggal').value = new Date().toISOString().split('T')[0];
            document.getElementById('sek-shift-input').value = getCurrentShift();

            if (document.querySelector('.sek-tab[data-tab="history"]')?.classList.contains('active')) {
                loadHistory();
            }
        } catch (err) {
            console.error('[SEKURITI] Submit error:', err);
            toast('Gagal: ' + err.message, 'error');
            document.getElementById('sek-form-result').innerHTML = `<span style="color:#ef4444;">❌ ${err.message}</span>`;
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }

    /* ============================================================
       DETAIL
    ============================================================ */
    function showDetail(id) {
        toast('Detail laporan ID: ' + id, 'info');
    }

    /* ============================================================
       UPDATE LOKASI
    ============================================================ */
    async function updateLocationStatus() {
        try {
            const coords = await getGeolocation();
            const { safe, distance } = checkSafeCore(coords.latitude, coords.longitude);
            document.getElementById('sek-lokasi').textContent = `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
            document.getElementById('sek-jarak').textContent = `${distance.toFixed(1)} km`;
            document.getElementById('sek-status').innerHTML = safe
                ? '<span class="sek-badge-aman">AMAN</span>'
                : '<span class="sek-badge-danger">LUAR CORE</span>';
        } catch (err) {
            document.getElementById('sek-lokasi').textContent = 'Tidak dapat diakses';
            document.getElementById('sek-jarak').textContent = '-';
            document.getElementById('sek-status').innerHTML = '<span class="sek-badge-danger">GPS ERROR</span>';
        }
    }

    /* ============================================================
       SWITCH TAB
    ============================================================ */
    function switchTab(tab) {
        document.querySelectorAll('.sek-tab').forEach(t => t.classList.remove('active'));
        const activeTab = document.querySelector(`.sek-tab[data-tab="${tab}"]`);
        if (activeTab) activeTab.classList.add('active');

        document.getElementById('sek-laporan-tab').style.display = tab === 'laporan' ? 'block' : 'none';
        document.getElementById('sek-history-tab').style.display = tab === 'history' ? 'block' : 'none';
        document.getElementById('sek-jadwal-tab').style.display = tab === 'jadwal' ? 'block' : 'none';

        if (tab === 'history') loadHistory();
        if (tab === 'jadwal') loadJadwal();
    }

    /* ============================================================
       ATTACH EVENTS
    ============================================================ */
    function attachEvents() {
        document.querySelectorAll('.sek-tab').forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });

        document.getElementById('sekForm').addEventListener('submit', handleSubmit);
        document.getElementById('sek-refresh-history')?.addEventListener('click', loadHistory);

        document.getElementById('sek-foto').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    toast('File terlalu besar, maks 5MB', 'error');
                    return;
                }
                const reader = new FileReader();
                reader.onload = (ev) => {
                    document.getElementById('sek-preview').src = ev.target.result;
                    document.getElementById('sek-preview').style.display = 'block';
                    document.getElementById('sek-foto-base64').value = ev.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        // Delegasi untuk tombol detail
        document.getElementById('sek-history-body').addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action="detail"]');
            if (btn) showDetail(btn.dataset.id);
        });

        // Set tanggal dan shift
        document.getElementById('sek-tanggal').value = new Date().toISOString().split('T')[0];
        document.getElementById('sek-shift-input').value = getCurrentShift();

        updateLocationStatus();
        setInterval(updateLocationStatus, 30000);
    }

    /* ============================================================
       INIT
    ============================================================ */
    setTimeout(async () => {
        const container = document.getElementById('module-content');
        if (!container) return;

        await ensureSB();
        renderRoot(container);
        attachEvents();

        console.log('[SEKURITI] Ready ✅');
    }, 100);

    return function cleanup() {
        document.getElementById('sekuriti-styles')?.remove();
        console.log('[SEKURITI] Cleanup done');
    };
}
