/**
 * modules/janitor-outdoor/module.js
 * Dream OS v2.0 — Modul Janitor Outdoor
 * ✅ Signature: (config, utils, supabase, currentUser, showToast, showModal, loader, translations, currentLang)
 * ✅ Fitur: Form ceklis kebersihan outdoor, riwayat, jadwal, sinkron audit_log
 * ✅ Shift opsional: Non-Shift, Pagi (06:30-12:00), Siang (12:00-17:00)
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
    if (document.getElementById('janitor-out-styles')) return;
    const s = document.createElement('style');
    s.id = 'janitor-out-styles';
    s.textContent = `
        :root {
            --jo-primary: #06b6d4;
            --jo-primary-light: rgba(6,182,212,0.1);
            --jo-primary-border: rgba(6,182,212,0.25);
            --jo-bg-panel: rgba(15,23,42,0.88);
            --jo-text: #e2e8f0;
            --jo-text-muted: #94a3b8;
            --jo-text-dim: #64748b;
            --jo-border: rgba(255,255,255,0.08);
            --jo-border-strong: rgba(255,255,255,0.15);
            --jo-radius: 16px;
            --jo-radius-sm: 12px;
            --jo-radius-xs: 8px;
            --jo-transition: 0.2s ease;
            --jo-shadow: 0 4px 18px rgba(6,182,212,0.15);
            --jo-font-mono: 'JetBrains Mono', monospace;
            --jo-font-sans: 'Rajdhani', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        @media (prefers-reduced-motion: reduce) {
            * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }

        #janitor-out-root * { box-sizing: border-box; }
        #janitor-out-root {
            max-width: 1000px;
            margin: 0 auto;
            padding: 1rem;
            font-family: var(--jo-font-sans);
            color: var(--jo-text);
        }
        .jo-panel {
            background: var(--jo-bg-panel);
            backdrop-filter: blur(18px);
            border: 1px solid var(--jo-primary-border);
            border-radius: var(--jo-radius);
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            transition: background var(--jo-transition), border-color var(--jo-transition);
        }
        .jo-panel:hover {
            background: rgba(15,23,42,0.92);
            border-color: var(--jo-primary);
        }
        .jo-header {
            background: linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.05));
            border-left: 4px solid var(--jo-primary);
        }
        .jo-title {
            font-size: 1.8rem;
            font-weight: 800;
            background: linear-gradient(135deg, var(--jo-primary), #0891b2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.25rem;
        }
        .jo-tabs {
            display: flex;
            gap: 0.5rem;
            border-bottom: 2px solid var(--jo-primary-border);
            margin-bottom: 1.5rem;
            overflow-x: auto;
            scrollbar-width: none;
        }
        .jo-tabs::-webkit-scrollbar { display: none; }
        .jo-tab {
            padding: 0.65rem 1.5rem;
            background: rgba(255,255,255,0.04);
            border: 1px solid transparent;
            border-radius: 8px 8px 0 0;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.9rem;
            color: var(--jo-text-dim);
            white-space: nowrap;
            transition: background var(--jo-transition), color var(--jo-transition);
        }
        .jo-tab:hover { background: var(--jo-primary-light); color: var(--jo-text); }
        .jo-tab.active { background: rgba(6,182,212,0.18); border-color: var(--jo-primary); color: var(--jo-primary); }
        .jo-form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 1rem;
        }
        .jo-label {
            display: block;
            font-size: 0.75rem;
            color: var(--jo-text-muted);
            margin-bottom: 0.25rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .jo-input, .jo-select, .jo-textarea {
            width: 100%;
            padding: 0.75rem 1rem;
            background: rgba(0,0,0,0.3);
            border: 1.5px solid var(--jo-primary-border);
            border-radius: var(--jo-radius-xs);
            color: var(--jo-text);
            font-family: inherit;
            font-size: 0.9rem;
            outline: none;
            transition: border-color var(--jo-transition), box-shadow var(--jo-transition);
        }
        .jo-input:focus, .jo-select:focus, .jo-textarea:focus {
            border-color: var(--jo-primary);
            box-shadow: 0 0 0 3px var(--jo-primary-light);
        }
        .jo-select option { background: #1e293b; color: var(--jo-text); }
        .jo-textarea { resize: vertical; min-height: 80px; }
        .jo-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            border-radius: var(--jo-radius-xs);
            font-weight: 700;
            cursor: pointer;
            transition: transform var(--jo-transition), background var(--jo-transition), border-color var(--jo-transition);
            border: none;
            font-family: inherit;
        }
        .jo-btn-primary {
            background: linear-gradient(135deg, var(--jo-primary), #0891b2);
            color: #020617;
            width: 100%;
        }
        .jo-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: var(--jo-shadow); }
        .jo-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .jo-btn-sm {
            padding: 0.4rem 1rem;
            font-size: 0.8rem;
            border-radius: var(--jo-radius-xs);
            background: rgba(255,255,255,0.08);
            border: 1px solid var(--jo-border-strong);
            color: var(--jo-text);
        }
        .jo-btn-sm:hover { background: var(--jo-primary-light); border-color: var(--jo-primary); }
        .jo-table-wrap {
            overflow-x: auto;
            border-radius: var(--jo-radius);
            border: 1px solid var(--jo-border);
        }
        table.jo-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.85rem;
        }
        table.jo-table thead { background: rgba(0,0,0,0.3); }
        table.jo-table th {
            padding: 0.75rem 1rem;
            text-align: left;
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--jo-text-muted);
        }
        table.jo-table td {
            padding: 0.75rem 1rem;
            border-top: 1px solid var(--jo-border);
            vertical-align: middle;
        }
        table.jo-table tr:hover td { background: rgba(255,255,255,0.02); }
        .jo-badge {
            display: inline-block;
            padding: 0.2rem 0.75rem;
            border-radius: 20px;
            font-size: 0.7rem;
            font-weight: 600;
        }
        .jo-badge-pending { background: rgba(245,158,11,0.2); color: #f59e0b; }
        .jo-badge-verified { background: rgba(16,185,129,0.2); color: #10b981; }
        .jo-badge-rejected { background: rgba(239,68,68,0.2); color: #ef4444; }
        .jo-checkbox-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 0.5rem;
            margin-top: 0.5rem;
            margin-bottom: 1rem;
        }
        .jo-checkbox-grid label {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            font-size: 0.85rem;
            color: #cbd5e1;
        }
        .jo-loader {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 3rem;
        }
        .jo-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--jo-primary-light);
            border-top-color: var(--jo-primary);
            border-radius: 50%;
            animation: jo-spin 1s linear infinite;
        }
        @keyframes jo-spin { to { transform: rotate(360deg); } }

        /* Print styles */
        @media print {
            #janitor-out-root {
                background: white;
                color: #1e293b;
                padding: 0.5in;
            }
            .jo-panel {
                background: white;
                backdrop-filter: none;
                border: 1px solid #ccc;
                box-shadow: none;
            }
            .jo-tabs, .jo-btn, .jo-header::before {
                display: none;
            }
        }

        /* Device tier low */
        .tier-low .jo-panel {
            backdrop-filter: none;
            background: rgba(15,23,42,0.95);
        }
        .tier-low .jo-spinner {
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
        } catch (e) { console.warn('[JANITOR-OUT] audit_log error:', e.message); }
    }

    /* ============================================================
       RENDER HTML (dengan field tambahan: gedung, lantai, shift opsi)
    ============================================================ */
    function renderRoot(container) {
        const userName = _user?.name?.toUpperCase() || 'GUEST';
        container.innerHTML = `
        <div id="janitor-out-root">
            <!-- HEADER -->
            <div class="jo-panel jo-header" style="margin-bottom:1.5rem">
                <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
                    <div style="font-size:3rem;">🌿</div>
                    <div>
                        <div class="jo-title">JANITOR OUTDOOR</div>
                        <div style="font-size:0.75rem;color:var(--jo-text-muted);">Daily Outdoor Cleaning Checklist & Report</div>
                    </div>
                    <div style="margin-left:auto; display:flex; gap:0.5rem;">
                        <span style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);color:#a855f7;padding:0.4rem 1rem;border-radius:30px;font-size:0.8rem;">${esc(userName)}</span>
                    </div>
                </div>
            </div>

            <!-- TABS -->
            <div class="jo-tabs">
                <div class="jo-tab active" data-tab="form">📝 Form Ceklis</div>
                <div class="jo-tab" data-tab="history">📜 Riwayat</div>
                <div class="jo-tab" data-tab="schedule">📅 Jadwal</div>
            </div>

            <!-- TAB FORM -->
            <div id="jo-form-tab" class="tab-content">
                <div class="jo-panel">
                    <h3 style="font-size:1.2rem;font-weight:700;margin-bottom:1.5rem;color:var(--jo-primary);">📝 Form Ceklis Outdoor</h3>
                    <form id="joForm">
                        <div class="jo-form-grid">
                            <div>
                                <label class="jo-label">Tanggal</label>
                                <input type="date" id="jo-tanggal" class="jo-input" required>
                            </div>
                            <div>
                                <label class="jo-label">Shift / Waktu</label>
                                <select id="jo-shift" class="jo-select" required>
                                    <option value="Non Shift">Non Shift (06:30-17:00)</option>
                                    <option value="Pagi">Pagi (06:30-12:00)</option>
                                    <option value="Siang">Siang (12:00-17:00)</option>
                                </select>
                            </div>
                            <div>
                                <label class="jo-label">Petugas *</label>
                                <input type="text" id="jo-petugas" class="jo-input" placeholder="Nama petugas" value="${esc(_user?.name||'')}" required>
                            </div>
                            <div>
                                <label class="jo-label">Gedung</label>
                                <input type="text" id="jo-gedung" class="jo-input" placeholder="Gedung (opsional)">
                            </div>
                            <div>
                                <label class="jo-label">Lantai / Area</label>
                                <input type="text" id="jo-lantai" class="jo-input" placeholder="Lantai / zona (opsional)">
                            </div>
                        </div>

                        <!-- POIN PENGECEKAN -->
                        <div style="margin-top:1.5rem;">
                            <h4 style="font-size:1rem;font-weight:700;color:var(--jo-primary);margin-bottom:0.5rem;">📋 Poin Pengecekan</h4>
                            <div class="jo-checkbox-grid" id="check-grid">
                                <label><input type="checkbox" id="check_sampah"> Sampah bersih</label>
                                <label><input type="checkbox" id="check_rumput"> Rumput dipotong</label>
                                <label><input type="checkbox" id="check_selokan"> Selokan lancar</label>
                                <label><input type="checkbox" id="check_taman"> Taman rapi</label>
                                <label><input type="checkbox" id="check_paving"> Paving / jalan bersih</label>
                                <label><input type="checkbox" id="check_lampu"> Lampu taman berfungsi</label>
                                <label><input type="checkbox" id="check_air"> Drainase air baik</label>
                                <label><input type="checkbox" id="check_fasilitas"> Fasilitas umum utuh</label>
                            </div>
                        </div>

                        <div>
                            <label class="jo-label">Catatan / Temuan</label>
                            <textarea id="jo-catatan" rows="2" class="jo-textarea" placeholder="Misal: lampu mati, selokan mampet"></textarea>
                        </div>

                        <button type="submit" class="jo-btn jo-btn-primary" id="jo-submit">
                            <i class="fas fa-save"></i> Simpan Ceklis Outdoor
                        </button>
                        <div id="jo-form-result" style="margin-top:1rem;text-align:center;"></div>
                    </form>
                </div>
            </div>

            <!-- TAB HISTORY -->
            <div id="jo-history-tab" class="tab-content" style="display:none;">
                <div class="jo-panel">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
                        <h3 style="font-size:1.2rem;font-weight:700;color:var(--jo-primary);">📜 Riwayat Ceklis Outdoor</h3>
                        <button id="jo-refresh-history" class="jo-btn jo-btn-sm"><i class="fas fa-sync-alt"></i> Refresh</button>
                    </div>
                    <div class="jo-table-wrap">
                        <table class="jo-table">
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
                            <tbody id="jo-history-body">
                                <tr><td colspan="7" style="text-align:center;padding:2rem;">Memuat...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- TAB SCHEDULE -->
            <div id="jo-schedule-tab" class="tab-content" style="display:none;">
                <div class="jo-panel">
                    <h3 style="font-size:1.2rem;font-weight:700;margin-bottom:1.5rem;color:var(--jo-primary);">📅 Jadwal Petugas Outdoor (Contoh)</h3>
                    <div class="jo-table-wrap">
                        <table class="jo-table">
                            <thead>
                                <tr>
                                    <th>Hari</th>
                                    <th>Pagi (06:30-12:00)</th>
                                    <th>Siang (12:00-17:00)</th>
                                </tr>
                            </thead>
                            <tbody id="jo-schedule-body">
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
        const tbody = document.getElementById('jo-history-body');
        if (!tbody || !_sb) return;

        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;"><div class="jo-spinner" style="margin:0 auto;"></div><p style="margin-top:1rem;">Memuat...</p></td></tr>';

        try {
            const { data, error } = await _sb
                .from('janitor_outdoor')
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
                let statusClass = 'jo-badge-pending';
                let statusText = 'Pending';
                if (item.status === 'verified') { statusClass = 'jo-badge-verified'; statusText = 'Selesai'; }
                else if (item.status === 'rejected') { statusClass = 'jo-badge-rejected'; statusText = 'Ditolak'; }
                html += `
                    <tr>
                        <td>${fmtDate(item.tanggal)}</td>
                        <td>${esc(item.shift)}</td>
                        <td>${esc(item.petugas)}</td>
                        <td>${esc(item.gedung || '')}</td>
                        <td>${esc(item.lantai || '')}</td>
                        <td><span class="jo-badge ${statusClass}">${statusText}</span></td>
                        <td><button class="jo-btn jo-btn-sm" data-id="${item.id}" data-action="detail"><i class="fas fa-eye"></i></button></td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        } catch (err) {
            console.error('[JANITOR-OUT] Load history error:', err);
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:#ef4444;">Gagal memuat: ${esc(err.message)}</td></tr>`;
        }
    }

    /* ============================================================
       LOAD JADWAL (sementara statis, dengan shift Pagi/Siang)
    ============================================================ */
    function loadSchedule() {
        const tbody = document.getElementById('jo-schedule-body');
        if (!tbody) return;
        tbody.innerHTML = `
            <tr><td>Senin</td><td>Joko</td><td>Rina</td></tr>
            <tr><td>Selasa</td><td>Joko</td><td>Rina</td></tr>
            <tr><td>Rabu</td><td>Joko</td><td>Rina</td></tr>
            <tr><td>Kamis</td><td>Joko</td><td>Rina</td></tr>
            <tr><td>Jumat</td><td>Joko</td><td>Rina</td></tr>
            <tr><td>Sabtu</td><td>Joko</td><td>Rina</td></tr>
            <tr><td>Minggu</td><td>Libur</td><td>Libur</td></tr>
        `;
    }

    /* ============================================================
       DETAIL LAPORAN (placeholder)
    ============================================================ */
    function showDetail(id) {
        toast('Detail Janitor Outdoor ID: ' + id, 'info');
        // Nanti bisa dikembangkan modal
    }

    /* ============================================================
       SUBMIT FORM
    ============================================================ */
    async function handleSubmit(e) {
        e.preventDefault();

        const tanggal = document.getElementById('jo-tanggal')?.value;
        const shift = document.getElementById('jo-shift')?.value;
        const petugas = document.getElementById('jo-petugas')?.value.trim();
        const gedung = document.getElementById('jo-gedung')?.value.trim() || null;
        const lantai = document.getElementById('jo-lantai')?.value.trim() || null;
        const catatan = document.getElementById('jo-catatan')?.value.trim() || null;

        if (!tanggal || !petugas) {
            toast('Tanggal dan Petugas harus diisi', 'warning');
            return;
        }

        // Kumpulkan item checklist
        const items = {};
        document.querySelectorAll('#check-grid input[type=checkbox]').forEach(cb => {
            const id = cb.id.replace('check_', '');
            items[id] = cb.checked;
        });

        const data = {
            tanggal,
            shift,
            petugas,
            gedung,
            lantai,
            items,
            catatan,
            status: 'pending',
            created_at: new Date().toISOString()
        };

        const btn = document.getElementById('jo-submit');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-circle-notch" style="animation:jo-spin 1s linear infinite"></i> Menyimpan...';

        try {
            if (!_sb) throw new Error('Supabase tidak tersedia');
            const { error } = await _sb.from('janitor_outdoor').insert([data]);
            if (error) throw error;

            // Catat ke audit_logs
            await writeAuditLog('Janitor Outdoor', `Ceklis ${gedung || area} - ${shift} oleh ${petugas}`);

            toast('Ceklis outdoor berhasil disimpan!', 'success');
            document.getElementById('joForm').reset();

            // Reset tanggal ke hari ini
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('jo-tanggal').value = today;

            // Reset semua checkbox
            document.querySelectorAll('#check-grid input[type=checkbox]').forEach(cb => cb.checked = false);

            // Jika tab history aktif, refresh
            if (document.querySelector('.jo-tab.active')?.dataset.tab === 'history') {
                loadHistory();
            }
        } catch (err) {
            console.error('[JANITOR-OUT] Submit error:', err);
            toast('Gagal: ' + err.message, 'error');
            document.getElementById('jo-form-result').innerHTML = `<span style="color:#ef4444;">❌ ${err.message}</span>`;
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }

    /* ============================================================
       SWITCH TAB
    ============================================================ */
    function switchTab(tab) {
        document.querySelectorAll('.jo-tab').forEach(t => t.classList.remove('active'));
        const activeTab = document.querySelector(`.jo-tab[data-tab="${tab}"]`);
        if (activeTab) activeTab.classList.add('active');

        document.getElementById('jo-form-tab').style.display = tab === 'form' ? 'block' : 'none';
        document.getElementById('jo-history-tab').style.display = tab === 'history' ? 'block' : 'none';
        document.getElementById('jo-schedule-tab').style.display = tab === 'schedule' ? 'block' : 'none';

        if (tab === 'history') loadHistory();
        if (tab === 'schedule') loadSchedule();
    }

    /* ============================================================
       ATTACH EVENT LISTENERS
    ============================================================ */
    function attachEvents() {
        document.querySelectorAll('.jo-tab').forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });

        document.getElementById('joForm').addEventListener('submit', handleSubmit);

        document.getElementById('jo-refresh-history')?.addEventListener('click', loadHistory);

        // Delegasi untuk tombol detail
        document.getElementById('jo-history-body')?.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action="detail"]');
            if (btn) {
                const id = btn.dataset.id;
                showDetail(id);
            }
        });

        // Set tanggal default
        const today = new Date().toISOString().split('T')[0];
        const tglInput = document.getElementById('jo-tanggal');
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

    return `<!-- Janitor Outdoor module dimuat -->`;
}

/* ============================================================
   CLEANUP
============================================================ */
export function cleanup() {
    document.getElementById('janitor-out-styles')?.remove();
    console.log('[JANITOR-OUT] Cleanup done');
}
