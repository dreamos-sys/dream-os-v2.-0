/**
 * modules/janitor-indoor/module.js
 * Dream OS v2.0 — Modul Janitor Indoor
 * ✅ Signature: (config, utils, supabase, currentUser, showToast, showModal, loader, translations, currentLang)
 * ✅ Fitur: Form ceklis kebersihan indoor, riwayat, jadwal, sinkron audit_log
 * ✅ Shift opsional: Non-Shift (06:30-17:00), Pagi (06:30-12:00), Siang (12:00-17:00)
 * ✅ Detail: Petugas, Gedung, Lantai
 */

'use strict';

/* ============================================================
   FALLBACK CONFIG (hanya jika supabase tidak diberikan)
============================================================ */
const SB_URL_FALLBACK = 'https://pvznaeppaagylwddirla.supabase.co';
const SB_KEY_FALLBACK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2em5hZXBwYWFneWx3ZGRpcmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTEwNDMsImV4cCI6MjA4NzUyNzA0M30.t9SJi3VfsBDkKmeZ3egZ4rbvljl4xe0WwNkPtfA9-vo';

/* ============================================================
   CSS (menggunakan variabel, print styles, reduced motion, tier-low)
============================================================ */
function injectCSS() {
    if (document.getElementById('janitor-in-styles')) return;
    const s = document.createElement('style');
    s.id = 'janitor-in-styles';
    s.textContent = `
        :root {
            --ji-primary: #14b8a6;
            --ji-primary-light: rgba(20,184,166,0.1);
            --ji-primary-border: rgba(20,184,166,0.25);
            --ji-bg-panel: rgba(15,23,42,0.88);
            --ji-text: #e2e8f0;
            --ji-text-muted: #94a3b8;
            --ji-text-dim: #64748b;
            --ji-border: rgba(255,255,255,0.08);
            --ji-border-strong: rgba(255,255,255,0.15);
            --ji-radius: 16px;
            --ji-radius-sm: 12px;
            --ji-radius-xs: 8px;
            --ji-transition: 0.2s ease;
            --ji-shadow: 0 4px 18px rgba(20,184,166,0.15);
            --ji-font-mono: 'JetBrains Mono', monospace;
            --ji-font-sans: 'Rajdhani', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        @media (prefers-reduced-motion: reduce) {
            * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }

        #janitor-in-root * { box-sizing: border-box; }
        #janitor-in-root {
            max-width: 1000px;
            margin: 0 auto;
            padding: 1rem;
            font-family: var(--ji-font-sans);
            color: var(--ji-text);
        }
        .ji-panel {
            background: var(--ji-bg-panel);
            backdrop-filter: blur(18px);
            border: 1px solid var(--ji-primary-border);
            border-radius: var(--ji-radius);
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            transition: background var(--ji-transition), border-color var(--ji-transition);
        }
        .ji-panel:hover {
            background: rgba(15,23,42,0.92);
            border-color: var(--ji-primary);
        }
        .ji-header {
            background: linear-gradient(135deg, rgba(20,184,166,0.15), rgba(20,184,166,0.05));
            border-left: 4px solid var(--ji-primary);
        }
        .ji-title {
            font-size: 1.8rem;
            font-weight: 800;
            background: linear-gradient(135deg, var(--ji-primary), #0d9488);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.25rem;
        }
        .ji-tabs {
            display: flex;
            gap: 0.5rem;
            border-bottom: 2px solid var(--ji-primary-border);
            margin-bottom: 1.5rem;
            overflow-x: auto;
            scrollbar-width: none;
        }
        .ji-tabs::-webkit-scrollbar { display: none; }
        .ji-tab {
            padding: 0.65rem 1.5rem;
            background: rgba(255,255,255,0.04);
            border: 1px solid transparent;
            border-radius: 8px 8px 0 0;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.9rem;
            color: var(--ji-text-dim);
            white-space: nowrap;
            transition: background var(--ji-transition), color var(--ji-transition);
        }
        .ji-tab:hover { background: var(--ji-primary-light); color: var(--ji-text); }
        .ji-tab.active { background: rgba(20,184,166,0.18); border-color: var(--ji-primary); color: var(--ji-primary); }
        .ji-form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 1rem;
        }
        .ji-label {
            display: block;
            font-size: 0.75rem;
            color: var(--ji-text-muted);
            margin-bottom: 0.25rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .ji-input, .ji-select, .ji-textarea {
            width: 100%;
            padding: 0.75rem 1rem;
            background: rgba(0,0,0,0.3);
            border: 1.5px solid var(--ji-primary-border);
            border-radius: var(--ji-radius-xs);
            color: var(--ji-text);
            font-family: inherit;
            font-size: 0.9rem;
            outline: none;
            transition: border-color var(--ji-transition), box-shadow var(--ji-transition);
        }
        .ji-input:focus, .ji-select:focus, .ji-textarea:focus {
            border-color: var(--ji-primary);
            box-shadow: 0 0 0 3px var(--ji-primary-light);
        }
        .ji-select option { background: #1e293b; color: var(--ji-text); }
        .ji-textarea { resize: vertical; min-height: 80px; }
        .ji-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            border-radius: var(--ji-radius-xs);
            font-weight: 700;
            cursor: pointer;
            transition: transform var(--ji-transition), background var(--ji-transition), border-color var(--ji-transition);
            border: none;
            font-family: inherit;
        }
        .ji-btn-primary {
            background: linear-gradient(135deg, var(--ji-primary), #0d9488);
            color: #020617;
            width: 100%;
        }
        .ji-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: var(--ji-shadow); }
        .ji-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .ji-btn-sm {
            padding: 0.4rem 1rem;
            font-size: 0.8rem;
            border-radius: var(--ji-radius-xs);
            background: rgba(255,255,255,0.08);
            border: 1px solid var(--ji-border-strong);
            color: var(--ji-text);
        }
        .ji-btn-sm:hover { background: var(--ji-primary-light); border-color: var(--ji-primary); }
        .ji-table-wrap {
            overflow-x: auto;
            border-radius: var(--ji-radius);
            border: 1px solid var(--ji-border);
        }
        table.ji-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.85rem;
        }
        table.ji-table thead { background: rgba(0,0,0,0.3); }
        table.ji-table th {
            padding: 0.75rem 1rem;
            text-align: left;
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--ji-text-muted);
        }
        table.ji-table td {
            padding: 0.75rem 1rem;
            border-top: 1px solid var(--ji-border);
            vertical-align: middle;
        }
        table.ji-table tr:hover td { background: rgba(255,255,255,0.02); }
        .ji-badge {
            display: inline-block;
            padding: 0.2rem 0.75rem;
            border-radius: 20px;
            font-size: 0.7rem;
            font-weight: 600;
        }
        .ji-badge-pending { background: rgba(245,158,11,0.2); color: #f59e0b; }
        .ji-badge-verified { background: rgba(16,185,129,0.2); color: #10b981; }
        .ji-badge-rejected { background: rgba(239,68,68,0.2); color: #ef4444; }
        .ji-checkbox-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 0.5rem;
            margin-top: 0.5rem;
            margin-bottom: 1rem;
        }
        .ji-checkbox-grid label {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            font-size: 0.85rem;
            color: #cbd5e1;
        }
        .ji-loader {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 3rem;
        }
        .ji-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--ji-primary-light);
            border-top-color: var(--ji-primary);
            border-radius: 50%;
            animation: ji-spin 1s linear infinite;
        }
        @keyframes ji-spin { to { transform: rotate(360deg); } }

        /* Print styles */
        @media print {
            #janitor-in-root {
                background: white;
                color: #1e293b;
                padding: 0.5in;
            }
            .ji-panel {
                background: white;
                backdrop-filter: none;
                border: 1px solid #ccc;
                box-shadow: none;
            }
            .ji-tabs, .ji-btn, .ji-header::before {
                display: none;
            }
        }

        /* Device tier low */
        .tier-low .ji-panel {
            backdrop-filter: none;
            background: rgba(15,23,42,0.95);
        }
        .tier-low .ji-spinner {
            animation: none;
        }
    `;
    document.head.appendChild(s);
}

/* ============================================================
   EXPORT DEFAULT — signature seragam dengan modul lain
============================================================ */
export default async function initModule(config, utils, supabase, currentUser, showToast, showModal, loader, translations, currentLang) {
    injectCSS();

    // Gunakan fungsi yang disediakan, fallback ke lokal
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

    // Helper sanitasi
    const esc = utils?.esc || function(s) {
        return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    };

    // Format tanggal
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', {day:'2-digit',month:'short',year:'numeric'}) : '—';

    // State lokal
    let _sb = supabase || null;
    let _user = currentUser || null;
    let _lang = currentLang || 'id';

    // Fallback inisialisasi supabase jika tidak diberikan
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

    // Helper menulis ke audit_logs
    async function writeAuditLog(action, detail) {
        if (!_sb) return;
        try {
            await _sb.from('audit_logs').insert([{
                action,
                detail,
                user: _user?.name || 'System',
                created_at: new Date().toISOString()
            }]);
        } catch (e) { console.warn('[JANITOR-IN] audit_log error:', e.message); }
    }

    /* ============================================================
       RENDER HTML (dengan field tambahan: gedung, lantai, shift opsi)
    ============================================================ */
    function renderRoot(container) {
        const userName = _user?.name?.toUpperCase() || 'GUEST';
        container.innerHTML = `
        <div id="janitor-in-root">
            <!-- HEADER -->
            <div class="ji-panel ji-header" style="margin-bottom:1.5rem">
                <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
                    <div style="font-size:3rem;">🧹</div>
                    <div>
                        <div class="ji-title">JANITOR INDOOR</div>
                        <div style="font-size:0.75rem;color:var(--ji-text-muted);">Daily Indoor Cleaning Checklist & Report</div>
                    </div>
                    <div style="margin-left:auto; display:flex; gap:0.5rem;">
                        <span style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);color:#a855f7;padding:0.4rem 1rem;border-radius:30px;font-size:0.8rem;">${esc(userName)}</span>
                    </div>
                </div>
            </div>

            <!-- TABS -->
            <div class="ji-tabs">
                <div class="ji-tab active" data-tab="form">📝 Form Ceklis</div>
                <div class="ji-tab" data-tab="history">📜 Riwayat</div>
                <div class="ji-tab" data-tab="schedule">📅 Jadwal</div>
            </div>

            <!-- TAB FORM -->
            <div id="ji-form-tab" class="tab-content">
                <div class="ji-panel">
                    <h3 style="font-size:1.2rem;font-weight:700;margin-bottom:1.5rem;color:var(--ji-primary);">📝 Form Ceklis Indoor</h3>
                    <form id="jiForm">
                        <div class="ji-form-grid">
                            <div>
                                <label class="ji-label">Tanggal</label>
                                <input type="date" id="ji-tanggal" class="ji-input" required>
                            </div>
                            <div>
                                <label class="ji-label">Shift / Waktu</label>
                                <select id="ji-shift" class="ji-select" required>
                                    <option value="Non Shift">Non Shift (06:30-17:00)</option>
                                    <option value="Pagi">Pagi (06:30-12:00)</option>
                                    <option value="Siang">Siang (12:00-17:00)</option>
                                </select>
                            </div>
                            <div>
                                <label class="ji-label">Petugas *</label>
                                <input type="text" id="ji-petugas" class="ji-input" placeholder="Nama petugas" value="${esc(_user?.name||'')}" required>
                            </div>
                            <div>
                                <label class="ji-label">Gedung</label>
                                <input type="text" id="ji-gedung" class="ji-input" placeholder="Gedung (opsional)">
                            </div>
                            <div>
                                <label class="ji-label">Lantai</label>
                                <input type="text" id="ji-lantai" class="ji-input" placeholder="Lantai / zona (opsional)">
                            </div>
                        </div>

                        <!-- TOILET SECTION -->
                        <div style="margin-top:1.5rem;">
                            <h4 style="font-size:1rem;font-weight:700;color:var(--ji-primary);margin-bottom:0.5rem;">🚽 Toilet</h4>
                            <div class="ji-checkbox-grid" id="toilet-grid">
                                <label><input type="checkbox" id="toilet_pintu_utama"> Pintu Utama</label>
                                <label><input type="checkbox" id="toilet_pintu_kubikal"> Pintu Kubikal</label>
                                <label><input type="checkbox" id="toilet_kaca"> Kaca / Cermin</label>
                                <label><input type="checkbox" id="toilet_exhaust"> Exhaust</label>
                                <label><input type="checkbox" id="toilet_dinding"> Dinding</label>
                                <label><input type="checkbox" id="toilet_tempat_wudhu"> Tempat Wudhu</label>
                                <label><input type="checkbox" id="toilet_lantai"> Lantai</label>
                                <label><input type="checkbox" id="toilet_floor_drain"> Floor Drain</label>
                                <label><input type="checkbox" id="toilet_kloset"> Kloset</label>
                                <label><input type="checkbox" id="toilet_plafon"> Plafon / Flapond</label>
                                <label><input type="checkbox" id="toilet_tempat_sampah"> Tempat Sampah</label>
                            </div>
                        </div>

                        <!-- RUANGAN SECTION -->
                        <div style="margin-top:1.5rem;">
                            <h4 style="font-size:1rem;font-weight:700;color:var(--ji-primary);margin-bottom:0.5rem;">🏢 Ruangan & Area Umum</h4>
                            <div class="ji-checkbox-grid" id="ruang-grid">
                                <label><input type="checkbox" id="ruang_loby_utama"> Loby Utama</label>
                                <label><input type="checkbox" id="ruang_teras"> Teras</label>
                                <label><input type="checkbox" id="ruang_lorong_utama"> Lorong Utama</label>
                                <label><input type="checkbox" id="ruang_balkon"> Balkon</label>
                                <label><input type="checkbox" id="ruang_pintu_utama"> Pintu Utama</label>
                                <label><input type="checkbox" id="ruang_pintu_kelas"> Pintu Kelas</label>
                                <label><input type="checkbox" id="ruang_jendela"> Jendela</label>
                                <label><input type="checkbox" id="ruang_kelas"> Kelas</label>
                                <label><input type="checkbox" id="ruang_aula"> Aula</label>
                                <label><input type="checkbox" id="ruang_sentra_musik"> Sentra Musik</label>
                                <label><input type="checkbox" id="ruang_sentra_kreasi"> Sentra Kreasi</label>
                                <label><input type="checkbox" id="ruang_uks"> UKS</label>
                                <label><input type="checkbox" id="ruang_psikolog"> Psikolog</label>
                                <label><input type="checkbox" id="ruang_lab_kom"> Lab Kom</label>
                                <label><input type="checkbox" id="ruang_lab_ipa"> Lab IPA</label>
                                <label><input type="checkbox" id="ruang_perpus"> Perpustakaan</label>
                                <label><input type="checkbox" id="ruang_kepsek"> Kepala Sekolah</label>
                                <label><input type="checkbox" id="ruang_guru_laki"> R. Guru Laki</label>
                                <label><input type="checkbox" id="ruang_guru_perempuan"> R. Guru Perempuan</label>
                                <label><input type="checkbox" id="ruang_pemasaran"> R. Pemasaran</label>
                                <label><input type="checkbox" id="ruang_admin_tu"> R. Admin TU</label>
                                <label><input type="checkbox" id="ruang_rapat"> R. Rapat</label>
                                <label><input type="checkbox" id="ruang_ceo"> R. CEO</label>
                                <label><input type="checkbox" id="ruang_kabid"> R. Kabid</label>
                                <label><input type="checkbox" id="ruang_osis"> R. Osis</label>
                                <label><input type="checkbox" id="ruang_mushalla"> R. Mushalla</label>
                                <label><input type="checkbox" id="ruang_inklusi"> R. Inklusi</label>
                                <label><input type="checkbox" id="ruang_gudang_olahraga"> Gudang Olahraga</label>
                                <label><input type="checkbox" id="ruang_serbaguna"> R. Serbaguna</label>
                                <label><input type="checkbox" id="ruang_masjid"> R. Masjid</label>
                                <label><input type="checkbox" id="ruang_kantin"> Kantin</label>
                                <label><input type="checkbox" id="ruang_saung_besar"> Saung Besar</label>
                                <label><input type="checkbox" id="ruang_saung_kecil"> Saung Kecil</label>
                                <label><input type="checkbox" id="ruang_pos"> Pos</label>
                                <label><input type="checkbox" id="ruang_gudang_umum"> Gudang Umum</label>
                                <label><input type="checkbox" id="ruang_tangga"> Tangga</label>
                                <label><input type="checkbox" id="ruang_lift"> Lift</label>
                                <label><input type="checkbox" id="ruang_lainnya"> Keterangan Lain</label>
                            </div>
                        </div>

                        <div>
                            <label class="ji-label">Catatan</label>
                            <textarea id="ji-catatan" rows="2" class="ji-textarea" placeholder="Catatan tambahan..."></textarea>
                        </div>

                        <div class="ji-form-grid">
                            <div>
                                <label class="ji-label">Foto Sebelum</label>
                                <input type="file" id="ji-foto-sebelum" accept="image/*" class="ji-input">
                            </div>
                            <div>
                                <label class="ji-label">Foto Sesudah</label>
                                <input type="file" id="ji-foto-sesudah" accept="image/*" class="ji-input">
                            </div>
                        </div>

                        <button type="submit" class="ji-btn ji-btn-primary" id="ji-submit">
                            <i class="fas fa-save"></i> Simpan Ceklis Indoor
                        </button>
                        <div id="ji-form-result" style="margin-top:1rem;text-align:center;"></div>
                    </form>
                </div>
            </div>

            <!-- TAB HISTORY -->
            <div id="ji-history-tab" class="tab-content" style="display:none;">
                <div class="ji-panel">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
                        <h3 style="font-size:1.2rem;font-weight:700;color:var(--ji-primary);">📜 Riwayat Ceklis Indoor</h3>
                        <button id="ji-refresh-history" class="ji-btn ji-btn-sm"><i class="fas fa-sync-alt"></i> Refresh</button>
                    </div>
                    <div class="ji-table-wrap">
                        <table class="ji-table">
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>Shift</th>
                                    <th>Petugas</th>
                                    <th>Gedung</th>
                                    <th>Lantai</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="ji-history-body">
                                <tr><td colspan="7" style="text-align:center;padding:2rem;">Memuat...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- TAB SCHEDULE -->
            <div id="ji-schedule-tab" class="tab-content" style="display:none;">
                <div class="ji-panel">
                    <h3 style="font-size:1.2rem;font-weight:700;margin-bottom:1.5rem;color:var(--ji-primary);">📅 Jadwal Petugas Indoor (Contoh)</h3>
                    <div class="ji-table-wrap">
                        <table class="ji-table">
                            <thead>
                                <tr>
                                    <th>Hari</th>
                                    <th>Pagi (06:30-12:00)</th>
                                    <th>Siang (12:00-17:00)</th>
                                </tr>
                            </thead>
                            <tbody id="ji-schedule-body">
                                <tr><td colspan="3" style="text-align:center;padding:2rem;">Jadwal belum tersedia</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    /* ============================================================
       LOAD RIWAYAT
    ============================================================ */
    async function loadHistory() {
        const tbody = document.getElementById('ji-history-body');
        if (!tbody || !_sb) return;

        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;"><div class="ji-spinner" style="margin:0 auto;"></div><p style="margin-top:1rem;">Memuat...</p></td></tr>';

        try {
            const { data, error } = await _sb
                .from('janitor_indoor')
                .select('id, tanggal, shift, petugas, gedung, lantai, status, created_at')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            if (!data || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;opacity:0.7;">Belum ada data</td></tr>';
                return;
            }

            let html = '';
            data.forEach(item => {
                let statusClass = 'ji-badge-pending';
                let statusText = 'Pending';
                if (item.status === 'verified') { statusClass = 'ji-badge-verified'; statusText = 'Selesai'; }
                else if (item.status === 'rejected') { statusClass = 'ji-badge-rejected'; statusText = 'Ditolak'; }
                html += `
                    <tr>
                        <td>${fmtDate(item.tanggal)}</td>
                        <td>${esc(item.shift)}</td>
                        <td>${esc(item.petugas)}</td>
                        <td>${esc(item.gedung || '')}</td>
                        <td>${esc(item.lantai || '')}</td>
                        <td><span class="ji-badge ${statusClass}">${statusText}</span></td>
                        <td><button class="ji-btn ji-btn-sm" data-id="${item.id}" data-action="detail"><i class="fas fa-eye"></i></button></td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        } catch (err) {
            console.error('[JANITOR-IN] Load history error:', err);
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:#ef4444;">Gagal memuat: ${esc(err.message)}</td></tr>`;
        }
    }

    /* ============================================================
       LOAD JADWAL (sementara statis, dengan shift Pagi/Siang)
    ============================================================ */
    function loadSchedule() {
        const tbody = document.getElementById('ji-schedule-body');
        if (!tbody) return;
        tbody.innerHTML = `
            <tr><td>Senin</td><td>Budi</td><td>Ani</td></tr>
            <tr><td>Selasa</td><td>Budi</td><td>Ani</td></tr>
            <tr><td>Rabu</td><td>Budi</td><td>Ani</td></tr>
            <tr><td>Kamis</td><td>Budi</td><td>Ani</td></tr>
            <tr><td>Jumat</td><td>Budi</td><td>Ani</td></tr>
            <tr><td>Sabtu</td><td>Budi</td><td>Ani</td></tr>
            <tr><td>Minggu</td><td>Libur</td><td>Libur</td></tr>
        `;
    }

    /* ============================================================
       DETAIL LAPORAN (placeholder)
    ============================================================ */
    function showDetail(id) {
        toast('Detail Janitor Indoor ID: ' + id, 'info');
        // Nanti bisa dikembangkan modal
    }

    /* ============================================================
       SUBMIT FORM
    ============================================================ */
    async function handleSubmit(e) {
        e.preventDefault();

        const tanggal = document.getElementById('ji-tanggal')?.value;
        const shift = document.getElementById('ji-shift')?.value;
        const petugas = document.getElementById('ji-petugas')?.value.trim();
        const gedung = document.getElementById('ji-gedung')?.value.trim() || null;
        const lantai = document.getElementById('ji-lantai')?.value.trim() || null;
        const catatan = document.getElementById('ji-catatan')?.value.trim() || null;

        if (!tanggal || !petugas) {
            toast('Tanggal dan Petugas harus diisi', 'warning');
            return;
        }

        // Kumpulkan toilet items
        const toilet = {};
        document.querySelectorAll('#toilet-grid input[type=checkbox]').forEach(cb => {
            const id = cb.id.replace('toilet_', '');
            toilet[id] = cb.checked;
        });

        // Kumpulkan ruangan items
        const ruangan = {};
        document.querySelectorAll('#ruang-grid input[type=checkbox]').forEach(cb => {
            const id = cb.id.replace('ruang_', '');
            ruangan[id] = cb.checked;
        });

        const items = { toilet, ruangan };

        // Foto (sederhana, hanya simpan nama file untuk demo)
        const fotoSebelum = document.getElementById('ji-foto-sebelum')?.files[0];
        const fotoSesudah = document.getElementById('ji-foto-sesudah')?.files[0];

        const data = {
            tanggal,
            shift,
            petugas,
            gedung,
            lantai,
            items,
            catatan,
            foto_sebelum: fotoSebelum ? fotoSebelum.name : null,
            foto_sesudah: fotoSesudah ? fotoSesudah.name : null,
            status: 'pending',
            created_at: new Date().toISOString()
        };

        const btn = document.getElementById('ji-submit');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-circle-notch" style="animation:ji-spin 1s linear infinite"></i> Menyimpan...';

        try {
            if (!_sb) throw new Error('Supabase tidak tersedia');
            const { error } = await _sb.from('janitor_indoor').insert([data]);
            if (error) throw error;

            // Catat ke audit_logs
            await writeAuditLog('Janitor Indoor', `Ceklis ${gedung || area} - ${shift} oleh ${petugas}`);

            toast('Ceklis indoor berhasil disimpan!', 'success');
            document.getElementById('jiForm').reset();

            // Reset tanggal ke hari ini
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('ji-tanggal').value = today;

            // Reset semua checkbox
            document.querySelectorAll('#toilet-grid input[type=checkbox]').forEach(cb => cb.checked = false);
            document.querySelectorAll('#ruang-grid input[type=checkbox]').forEach(cb => cb.checked = false);

            // Jika tab history aktif, refresh
            if (document.querySelector('.ji-tab.active')?.dataset.tab === 'history') {
                loadHistory();
            }
        } catch (err) {
            console.error('[JANITOR-IN] Submit error:', err);
            toast('Gagal: ' + err.message, 'error');
            document.getElementById('ji-form-result').innerHTML = `<span style="color:#ef4444;">❌ ${err.message}</span>`;
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }

    /* ============================================================
       SWITCH TAB
    ============================================================ */
    function switchTab(tab) {
        document.querySelectorAll('.ji-tab').forEach(t => t.classList.remove('active'));
        const activeTab = document.querySelector(`.ji-tab[data-tab="${tab}"]`);
        if (activeTab) activeTab.classList.add('active');

        document.getElementById('ji-form-tab').style.display = tab === 'form' ? 'block' : 'none';
        document.getElementById('ji-history-tab').style.display = tab === 'history' ? 'block' : 'none';
        document.getElementById('ji-schedule-tab').style.display = tab === 'schedule' ? 'block' : 'none';

        if (tab === 'history') loadHistory();
        if (tab === 'schedule') loadSchedule();
    }

    /* ============================================================
       ATTACH EVENT LISTENERS
    ============================================================ */
    function attachEvents() {
        document.querySelectorAll('.ji-tab').forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });

        document.getElementById('jiForm').addEventListener('submit', handleSubmit);

        document.getElementById('ji-refresh-history')?.addEventListener('click', loadHistory);

        // Delegasi untuk tombol detail
        document.getElementById('ji-history-body')?.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action="detail"]');
            if (btn) {
                const id = btn.dataset.id;
                showDetail(id);
            }
        });

        // Set tanggal default
        const today = new Date().toISOString().split('T')[0];
        const tglInput = document.getElementById('ji-tanggal');
        if (tglInput) tglInput.value = today;
    }

    /* ============================================================
       INIT (dijalankan setelah DOM siap)
    ============================================================ */
    setTimeout(async () => {
        const container = document.getElementById('module-content');
        if (!container) return;

        await ensureSB();
        renderRoot(container);
        attachEvents();
    }, 100);

    return `<!-- Janitor Indoor module dimuat -->`;
}

/* ============================================================
   CLEANUP
============================================================ */
export function cleanup() {
    document.getElementById('janitor-in-styles')?.remove();
    console.log('[JANITOR-IN] Cleanup done');
}
