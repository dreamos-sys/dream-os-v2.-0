/**
 * modules/janitor-outdoor/module.js
 * Dream OS v2.0 — Modul Janitor Outdoor (Self-Contained)
 * Fitur: Form ceklis kebersihan outdoor, riwayat, jadwal
 */

// ========== SUPABASE CONFIG ==========
const SB_URL = 'https://pvznaeppaagylwddirla.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2em5hZXBwYWFneWx3ZGRpcmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTEwNDMsImV4cCI6MjA4NzUyNzA0M30.t9SJi3VfsBDkKmeZ3egZ4rbvljl4xe0WwNkPtfA9-vo';

// ========== STATE ==========
let _sb = null;
let _currentUser = null;
let _currentLang = localStorage.getItem('lang') || 'id';

// ========== INIT SUPABASE ==========
async function initSupabase() {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        _sb = window.supabase.createClient(SB_URL, SB_KEY);
        return true;
    }

    console.warn('[JANITOR-OUT] Supabase tidak ditemukan, auto-inject CDN...');
    try {
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });

        if (window.supabase && typeof window.supabase.createClient === 'function') {
            _sb = window.supabase.createClient(SB_URL, SB_KEY);
            return true;
        }
        throw new Error('Supabase masih undefined setelah load');
    } catch (err) {
        console.error('[JANITOR-OUT] Gagal auto-inject supabase:', err);
        return false;
    }
}

// ========== BUILT-IN TOAST ==========
function toast(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    if (container) {
        const el = document.createElement('div');
        el.className = 'toast ' + type;
        el.innerHTML = `<span>${type==='success'?'✅':type==='error'?'❌':type==='warning'?'⚠️':'ℹ️'}</span><span>${msg}</span>`;
        container.appendChild(el);
        setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
        return;
    }
    const el = document.createElement('div');
    el.style.cssText = `
        position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
        background:${type==='error'?'rgba(239,68,68,.9)':type==='warning'?'rgba(245,158,11,.9)':type==='info'?'rgba(59,130,246,.9)':'rgba(16,185,129,.9)'};
        color:white;padding:10px 20px;border-radius:12px;z-index:99999;
        font-family:'Rajdhani','Inter',sans-serif;font-weight:700;font-size:.9rem;
        opacity:0;transition:opacity .3s;white-space:nowrap;
    `;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.style.opacity = '1', 10);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
}

// ========== HELPERS ==========
function setEl(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('id-ID') : ''; }

// ========== INJECT CSS ==========
function injectCSS() {
    if (document.getElementById('janitor-out-styles')) return;
    const style = document.createElement('style');
    style.id = 'janitor-out-styles';
    style.textContent = `
        #janitor-out-root * { box-sizing: border-box; }
        #janitor-out-root {
            max-width: 1000px;
            margin: 0 auto;
            padding: 1rem;
            font-family: 'Inter', 'Rajdhani', sans-serif;
            color: #e2e8f0;
        }
        .jo-panel {
            background: rgba(15,23,42,0.85);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(6,182,212,0.25);
            border-radius: 16px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
        }
        .jo-header {
            background: linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.05));
            border-left: 4px solid #06b6d4;
        }
        .jo-title {
            font-size: 1.8rem;
            font-weight: 800;
            background: linear-gradient(135deg, #06b6d4, #0891b2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.25rem;
        }
        .jo-tabs {
            display: flex;
            gap: 0.5rem;
            border-bottom: 2px solid rgba(6,182,212,0.3);
            margin-bottom: 1.5rem;
            overflow-x: auto;
        }
        .jo-tab {
            padding: 0.65rem 1.5rem;
            background: rgba(255,255,255,0.04);
            border: 1px solid transparent;
            border-radius: 8px 8px 0 0;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.9rem;
            color: #94a3b8;
            white-space: nowrap;
        }
        .jo-tab:hover { background: rgba(6,182,212,0.08); color: #e2e8f0; }
        .jo-tab.active { background: rgba(6,182,212,0.18); border-color: #06b6d4; color: #06b6d4; }
        .jo-form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 1rem;
        }
        .jo-label {
            display: block;
            font-size: 0.75rem;
            color: #94a3b8;
            margin-bottom: 0.25rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .jo-input, .jo-select, .jo-textarea {
            width: 100%;
            padding: 0.75rem 1rem;
            background: rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            color: white;
            font-family: inherit;
            font-size: 0.9rem;
            transition: 0.2s;
        }
        .jo-input:focus, .jo-select:focus, .jo-textarea:focus {
            outline: none;
            border-color: #06b6d4;
            box-shadow: 0 0 0 3px rgba(6,182,212,0.2);
        }
        .jo-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            border-radius: 12px;
            font-weight: 700;
            cursor: pointer;
            transition: 0.2s;
            border: none;
            font-family: inherit;
        }
        .jo-btn-primary {
            background: linear-gradient(135deg, #06b6d4, #0891b2);
            color: white;
            width: 100%;
        }
        .jo-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(6,182,212,0.4); }
        .jo-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .jo-btn-sm {
            padding: 0.4rem 1rem;
            font-size: 0.8rem;
            border-radius: 8px;
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.1);
            color: #e2e8f0;
        }
        .jo-btn-sm:hover { background: rgba(6,182,212,0.2); border-color: #06b6d4; }
        .jo-table-wrap {
            overflow-x: auto;
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,0.08);
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
            color: #94a3b8;
        }
        table.jo-table td {
            padding: 0.75rem 1rem;
            border-top: 1px solid rgba(255,255,255,0.05);
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
            border: 3px solid rgba(6,182,212,0.2);
            border-top-color: #06b6d4;
            border-radius: 50%;
            animation: jo-spin 1s linear infinite;
        }
        @keyframes jo-spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
}

// ========== RENDER HTML ==========
function renderRoot(container) {
    container.innerHTML = `
    <div id="janitor-out-root">
        <!-- HEADER -->
        <div class="jo-panel jo-header" style="margin-bottom:1.5rem">
            <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
                <div style="font-size:3rem;">🌿</div>
                <div>
                    <div class="jo-title">JANITOR OUTDOOR</div>
                    <div class="jo-sub" style="font-size:0.75rem;color:#94a3b8;">Daily Outdoor Cleaning Checklist & Report</div>
                </div>
                <div style="margin-left:auto; display:flex; gap:0.5rem;">
                    <span id="jo-user-badge" style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);color:#a855f7;padding:0.4rem 1rem;border-radius:30px;font-size:0.8rem;">GUEST</span>
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
                <h3 style="font-size:1.2rem;font-weight:700;margin-bottom:1.5rem;color:#06b6d4;">📝 Form Ceklis Outdoor</h3>
                <form id="joForm">
                    <div class="jo-form-grid">
                        <div>
                            <label class="jo-label">Tanggal</label>
                            <input type="date" id="jo-tanggal" class="jo-input" required>
                        </div>
                        <div>
                            <label class="jo-label">Shift</label>
                            <select id="jo-shift" class="jo-select" required>
                                <option value="Pagi">Pagi (07:00-15:00)</option>
                                <option value="Siang">Siang (15:00-23:00)</option>
                                <option value="Malam">Malam (23:00-07:00)</option>
                            </select>
                        </div>
                        <div>
                            <label class="jo-label">Petugas</label>
                            <input type="text" id="jo-petugas" class="jo-input" placeholder="Nama petugas" required>
                        </div>
                        <div>
                            <label class="jo-label">Area / Lokasi</label>
                            <input type="text" id="jo-area" class="jo-input" placeholder="Taman Depan, Lapangan" required>
                        </div>
                    </div>

                    <!-- POIN PENGECEKAN -->
                    <div style="margin-top:1.5rem;">
                        <h4 style="font-size:1rem;font-weight:700;color:#06b6d4;margin-bottom:0.5rem;">📋 Poin Pengecekan</h4>
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
                    <h3 style="font-size:1.2rem;font-weight:700;color:#06b6d4;">📜 Riwayat Ceklis Outdoor</h3>
                    <button id="jo-refresh-history" class="jo-btn jo-btn-sm"><i class="fas fa-sync-alt"></i> Refresh</button>
                </div>
                <div class="jo-table-wrap">
                    <table class="jo-table">
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Shift</th>
                                <th>Petugas</th>
                                <th>Area</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="jo-history-body">
                            <tr><td colspan="6" style="text-align:center;padding:2rem;">Memuat...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- TAB SCHEDULE -->
        <div id="jo-schedule-tab" class="tab-content" style="display:none;">
            <div class="jo-panel">
                <h3 style="font-size:1.2rem;font-weight:700;margin-bottom:1.5rem;color:#06b6d4;">📅 Jadwal Petugas Outdoor (Contoh)</h3>
                <div class="jo-table-wrap">
                    <table class="jo-table">
                        <thead>
                            <tr>
                                <th>Hari</th>
                                <th>Pagi</th>
                                <th>Siang</th>
                                <th>Malam</th>
                            </tr>
                        </thead>
                        <tbody id="jo-schedule-body">
                            <tr><td colspan="4" style="text-align:center;padding:2rem;">Jadwal belum tersedia</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    `;
}

// ========== LOAD RIWAYAT ==========
async function loadHistory() {
    const tbody = document.getElementById('jo-history-body');
    if (!tbody || !_sb) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;"><div class="jo-spinner" style="margin:0 auto;"></div><p style="margin-top:1rem;">Memuat...</p></td></tr>';

    try {
        const { data, error } = await _sb
            .from('janitor_outdoor')
            .select('id, tanggal, shift, petugas, area, status, created_at')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;opacity:0.7;">Belum ada data</td></tr>';
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
                    <td>${esc(item.area)}</td>
                    <td><span class="jo-badge ${statusClass}">${statusText}</span></td>
                    <td><button class="jo-btn jo-btn-sm" onclick="window._jo_detail('${item.id}')"><i class="fas fa-eye"></i></button></td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    } catch (err) {
        console.error('[JANITOR-OUT] Load history error:', err);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:#ef4444;">Gagal memuat: ${esc(err.message)}</td></tr>`;
    }
}

// ========== LOAD JADWAL (sementara statis) ==========
function loadSchedule() {
    const tbody = document.getElementById('jo-schedule-body');
    if (!tbody) return;
    tbody.innerHTML = `
        <tr><td>Senin</td><td>Joko</td><td>Rina</td><td>Agus</td></tr>
        <tr><td>Selasa</td><td>Joko</td><td>Rina</td><td>Agus</td></tr>
        <tr><td>Rabu</td><td>Joko</td><td>Rina</td><td>Agus</td></tr>
        <tr><td>Kamis</td><td>Joko</td><td>Rina</td><td>Agus</td></tr>
        <tr><td>Jumat</td><td>Joko</td><td>Rina</td><td>Agus</td></tr>
        <tr><td>Sabtu</td><td>Joko</td><td>Rina</td><td>Agus</td></tr>
        <tr><td>Minggu</td><td>Libur</td><td>Libur</td><td>Libur</td></tr>
    `;
}

// ========== DETAIL LAPORAN ==========
window._jo_detail = (id) => {
    alert('Detail Janitor Outdoor ID: ' + id);
    // Bisa dikembangkan modal
};

// ========== SUBMIT FORM ==========
async function handleSubmit(e) {
    e.preventDefault();

    const tanggal = document.getElementById('jo-tanggal')?.value;
    const shift = document.getElementById('jo-shift')?.value;
    const petugas = document.getElementById('jo-petugas')?.value;
    const area = document.getElementById('jo-area')?.value;
    const catatan = document.getElementById('jo-catatan')?.value;

    if (!tanggal || !petugas || !area) {
        toast('Tanggal, Petugas, Area harus diisi', 'warning');
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
        area,
        items,
        catatan: catatan || null,
        status: 'pending',
        created_at: new Date().toISOString()
    };

    const btn = document.getElementById('jo-submit');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

    try {
        const { error } = await _sb.from('janitor_outdoor').insert([data]);
        if (error) throw error;

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

// ========== SWITCH TAB ==========
function switchTab(tab) {
    document.querySelectorAll('.jo-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.jo-tab[data-tab="${tab}"]`).classList.add('active');

    document.getElementById('jo-form-tab').style.display = tab === 'form' ? 'block' : 'none';
    document.getElementById('jo-history-tab').style.display = tab === 'history' ? 'block' : 'none';
    document.getElementById('jo-schedule-tab').style.display = tab === 'schedule' ? 'block' : 'none';

    if (tab === 'history') loadHistory();
    if (tab === 'schedule') loadSchedule();
}

// ========== ATTACH EVENT LISTENERS ==========
function attachEvents() {
    document.querySelectorAll('.jo-tab').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    document.getElementById('joForm').addEventListener('submit', handleSubmit);

    document.getElementById('jo-refresh-history')?.addEventListener('click', loadHistory);

    // Set tanggal default
    const today = new Date().toISOString().split('T')[0];
    const tglInput = document.getElementById('jo-tanggal');
    if (tglInput) tglInput.value = today;
}

// ========== EXPORTED INIT ==========
export async function init(params = {}) {
    console.log('[JANITOR-OUT] init()', params);

    injectCSS();

    const container = document.getElementById('module-content');
    if (!container) { console.error('[JANITOR-OUT] #module-content tidak ditemukan'); return; }

    const sbOk = await initSupabase();
    if (!sbOk) {
        container.innerHTML = `<div style="text-align:center;padding:3rem;color:#ef4444">
            <i class="fas fa-exclamation-circle" style="font-size:2rem;margin-bottom:1rem"></i>
            <p style="font-weight:700">Gagal load Supabase</p>
            <p style="font-size:.82rem;opacity:.7;margin-top:.5rem">Cek koneksi internet — CDN supabase-js gagal dimuat</p>
        </div>`;
        return;
    }

    renderRoot(container);

    if (params.user) {
        _currentUser = params.user;
        document.getElementById('jo-user-badge').textContent = params.user.name?.toUpperCase() || 'USER';
    }
    if (params.lang) _currentLang = params.lang;

    attachEvents();

    console.log('[JANITOR-OUT] Ready ✅');
}

// ========== EXPORTED CLEANUP ==========
export function cleanup() {
    document.getElementById('janitor-out-styles')?.remove();
    delete window._jo_detail;
    console.log('[JANITOR-OUT] Cleanup done');
}
