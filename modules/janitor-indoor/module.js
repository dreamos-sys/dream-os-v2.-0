/**
 * modules/janitor-indoor/module.js
 * Dream OS v2.0 — Modul Janitor Indoor (Self-Contained)
 * Fitur: Form ceklis kebersihan, riwayat, jadwal
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

    console.warn('[JANITOR-IN] Supabase tidak ditemukan, auto-inject CDN...');
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
        console.error('[JANITOR-IN] Gagal auto-inject supabase:', err);
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
    if (document.getElementById('janitor-in-styles')) return;
    const style = document.createElement('style');
    style.id = 'janitor-in-styles';
    style.textContent = `
        #janitor-in-root * { box-sizing: border-box; }
        #janitor-in-root {
            max-width: 1000px;
            margin: 0 auto;
            padding: 1rem;
            font-family: 'Inter', 'Rajdhani', sans-serif;
            color: #e2e8f0;
        }
        .ji-panel {
            background: rgba(15,23,42,0.85);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(20,184,166,0.25);
            border-radius: 16px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
        }
        .ji-header {
            background: linear-gradient(135deg, rgba(20,184,166,0.15), rgba(20,184,166,0.05));
            border-left: 4px solid #14b8a6;
        }
        .ji-title {
            font-size: 1.8rem;
            font-weight: 800;
            background: linear-gradient(135deg, #14b8a6, #0d9488);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.25rem;
        }
        .ji-tabs {
            display: flex;
            gap: 0.5rem;
            border-bottom: 2px solid rgba(20,184,166,0.3);
            margin-bottom: 1.5rem;
            overflow-x: auto;
        }
        .ji-tab {
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
        .ji-tab:hover { background: rgba(20,184,166,0.08); color: #e2e8f0; }
        .ji-tab.active { background: rgba(20,184,166,0.18); border-color: #14b8a6; color: #14b8a6; }
        .ji-form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 1rem;
        }
        .ji-label {
            display: block;
            font-size: 0.75rem;
            color: #94a3b8;
            margin-bottom: 0.25rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .ji-input, .ji-select, .ji-textarea {
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
        .ji-input:focus, .ji-select:focus, .ji-textarea:focus {
            outline: none;
            border-color: #14b8a6;
            box-shadow: 0 0 0 3px rgba(20,184,166,0.2);
        }
        .ji-btn {
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
        .ji-btn-primary {
            background: linear-gradient(135deg, #14b8a6, #0d9488);
            color: white;
            width: 100%;
        }
        .ji-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(20,184,166,0.4); }
        .ji-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .ji-btn-sm {
            padding: 0.4rem 1rem;
            font-size: 0.8rem;
            border-radius: 8px;
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.1);
            color: #e2e8f0;
        }
        .ji-btn-sm:hover { background: rgba(20,184,166,0.2); border-color: #14b8a6; }
        .ji-table-wrap {
            overflow-x: auto;
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,0.08);
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
            color: #94a3b8;
        }
        table.ji-table td {
            padding: 0.75rem 1rem;
            border-top: 1px solid rgba(255,255,255,0.05);
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
            border: 3px solid rgba(20,184,166,0.2);
            border-top-color: #14b8a6;
            border-radius: 50%;
            animation: ji-spin 1s linear infinite;
        }
        @keyframes ji-spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
}

// ========== RENDER HTML ==========
function renderRoot(container) {
    container.innerHTML = `
    <div id="janitor-in-root">
        <!-- HEADER -->
        <div class="ji-panel ji-header" style="margin-bottom:1.5rem">
            <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
                <div style="font-size:3rem;">🧹</div>
                <div>
                    <div class="ji-title">JANITOR INDOOR</div>
                    <div class="ji-sub" style="font-size:0.75rem;color:#94a3b8;">Daily Cleaning Checklist & Report</div>
                </div>
                <div style="margin-left:auto; display:flex; gap:0.5rem;">
                    <span id="ji-user-badge" style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);color:#a855f7;padding:0.4rem 1rem;border-radius:30px;font-size:0.8rem;">GUEST</span>
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
                <h3 style="font-size:1.2rem;font-weight:700;margin-bottom:1.5rem;color:#14b8a6;">📝 Form Ceklis Indoor</h3>
                <form id="jiForm">
                    <div class="ji-form-grid">
                        <div>
                            <label class="ji-label">Tanggal</label>
                            <input type="date" id="ji-tanggal" class="ji-input" required>
                        </div>
                        <div>
                            <label class="ji-label">Shift</label>
                            <select id="ji-shift" class="ji-select" required>
                                <option value="pagi">Pagi</option>
                                <option value="siang">Siang</option>
                                <option value="sore">Sore</option>
                            </select>
                        </div>
                        <div>
                            <label class="ji-label">Petugas</label>
                            <input type="text" id="ji-petugas" class="ji-input" placeholder="Nama petugas" required>
                        </div>
                        <div>
                            <label class="ji-label">Lokasi Gedung</label>
                            <select id="ji-lokasi" class="ji-select" required>
                                <option value="">Pilih</option>
                                <option value="SD">Gedung SD</option>
                                <option value="SMP">Gedung SMP</option>
                                <option value="SMA">Gedung SMA</option>
                            </select>
                        </div>
                    </div>

                    <!-- TOILET SECTION -->
                    <div style="margin-top:1.5rem;">
                        <h4 style="font-size:1rem;font-weight:700;color:#14b8a6;margin-bottom:0.5rem;">🚽 Toilet</h4>
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
                        <h4 style="font-size:1rem;font-weight:700;color:#14b8a6;margin-bottom:0.5rem;">🏢 Ruangan & Area Umum</h4>
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
                    <h3 style="font-size:1.2rem;font-weight:700;color:#14b8a6;">📜 Riwayat Ceklis Indoor</h3>
                    <button id="ji-refresh-history" class="ji-btn ji-btn-sm"><i class="fas fa-sync-alt"></i> Refresh</button>
                </div>
                <div class="ji-table-wrap">
                    <table class="ji-table">
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
                        <tbody id="ji-history-body">
                            <tr><td colspan="6" style="text-align:center;padding:2rem;">Memuat...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- TAB SCHEDULE -->
        <div id="ji-schedule-tab" class="tab-content" style="display:none;">
            <div class="ji-panel">
                <h3 style="font-size:1.2rem;font-weight:700;margin-bottom:1.5rem;color:#14b8a6;">📅 Jadwal Piket Mingguan</h3>
                <div class="ji-table-wrap">
                    <table class="ji-table">
                        <thead>
                            <tr>
                                <th>Hari</th>
                                <th>Pagi</th>
                                <th>Siang</th>
                                <th>Sore</th>
                            </tr>
                        </thead>
                        <tbody id="ji-schedule-body">
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
    const tbody = document.getElementById('ji-history-body');
    if (!tbody || !_sb) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;"><div class="ji-spinner" style="margin:0 auto;"></div><p style="margin-top:1rem;">Memuat...</p></td></tr>';

    try {
        const { data, error } = await _sb
            .from('janitor_indoor')
            .select('id, tanggal, shift, petugas, lokasi, status, created_at')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;opacity:0.7;">Belum ada data</td></tr>';
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
                    <td>${esc(item.lokasi)}</td>
                    <td><span class="ji-badge ${statusClass}">${statusText}</span></td>
                    <td><button class="ji-btn ji-btn-sm" onclick="window._ji_detail('${item.id}')"><i class="fas fa-eye"></i></button></td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    } catch (err) {
        console.error('[JANITOR-IN] Load history error:', err);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:#ef4444;">Gagal memuat: ${esc(err.message)}</td></tr>`;
    }
}

// ========== LOAD JADWAL (sementara statis) ==========
function loadSchedule() {
    const tbody = document.getElementById('ji-schedule-body');
    if (!tbody) return;
    tbody.innerHTML = `
        <tr><td>Senin</td><td>Budi</td><td>Ani</td><td>Cici</td></tr>
        <tr><td>Selasa</td><td>Budi</td><td>Ani</td><td>Cici</td></tr>
        <tr><td>Rabu</td><td>Budi</td><td>Ani</td><td>Cici</td></tr>
        <tr><td>Kamis</td><td>Budi</td><td>Ani</td><td>Cici</td></tr>
        <tr><td>Jumat</td><td>Budi</td><td>Ani</td><td>Cici</td></tr>
        <tr><td>Sabtu</td><td>Budi</td><td>Ani</td><td>Cici</td></tr>
        <tr><td>Minggu</td><td>Libur</td><td>Libur</td><td>Libur</td></tr>
    `;
}

// ========== DETAIL LAPORAN ==========
window._ji_detail = (id) => {
    alert('Detail Janitor Indoor ID: ' + id);
    // Bisa dikembangkan modal
};

// ========== SUBMIT FORM ==========
async function handleSubmit(e) {
    e.preventDefault();

    const tanggal = document.getElementById('ji-tanggal')?.value;
    const shift = document.getElementById('ji-shift')?.value;
    const petugas = document.getElementById('ji-petugas')?.value;
    const lokasi = document.getElementById('ji-lokasi')?.value;
    const catatan = document.getElementById('ji-catatan')?.value;

    if (!tanggal || !petugas || !lokasi) {
        toast('Tanggal, Petugas, Lokasi harus diisi', 'warning');
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

    // Foto (sederhana, hanya simpan nama file)
    const fotoSebelum = document.getElementById('ji-foto-sebelum')?.files[0];
    const fotoSesudah = document.getElementById('ji-foto-sesudah')?.files[0];

    const data = {
        tanggal,
        shift,
        petugas,
        lokasi,
        items,
        catatan: catatan || null,
        foto_sebelum: fotoSebelum ? fotoSebelum.name : null,
        foto_sesudah: fotoSesudah ? fotoSesudah.name : null,
        status: 'pending',
        created_at: new Date().toISOString()
    };

    const btn = document.getElementById('ji-submit');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

    try {
        const { error } = await _sb.from('janitor_indoor').insert([data]);
        if (error) throw error;

        toast('Ceklis berhasil disimpan!', 'success');
        document.getElementById('jiForm').reset();

        // Reset tanggal ke hari ini
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('ji-tanggal').value = today;

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

// ========== SWITCH TAB ==========
function switchTab(tab) {
    document.querySelectorAll('.ji-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.ji-tab[data-tab="${tab}"]`).classList.add('active');

    document.getElementById('ji-form-tab').style.display = tab === 'form' ? 'block' : 'none';
    document.getElementById('ji-history-tab').style.display = tab === 'history' ? 'block' : 'none';
    document.getElementById('ji-schedule-tab').style.display = tab === 'schedule' ? 'block' : 'none';

    if (tab === 'history') loadHistory();
    if (tab === 'schedule') loadSchedule();
}

// ========== ATTACH EVENT LISTENERS ==========
function attachEvents() {
    document.querySelectorAll('.ji-tab').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    document.getElementById('jiForm').addEventListener('submit', handleSubmit);

    document.getElementById('ji-refresh-history')?.addEventListener('click', loadHistory);

    // Set tanggal default
    const today = new Date().toISOString().split('T')[0];
    const tglInput = document.getElementById('ji-tanggal');
    if (tglInput) tglInput.value = today;
}

// ========== EXPORTED INIT ==========
export async function init(params = {}) {
    console.log('[JANITOR-IN] init()', params);

    injectCSS();

    const container = document.getElementById('module-content');
    if (!container) { console.error('[JANITOR-IN] #module-content tidak ditemukan'); return; }

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
        document.getElementById('ji-user-badge').textContent = params.user.name?.toUpperCase() || 'USER';
    }
    if (params.lang) _currentLang = params.lang;

    attachEvents();

    console.log('[JANITOR-IN] Ready ✅');
}

// ========== EXPORTED CLEANUP ==========
export function cleanup() {
    document.getElementById('janitor-in-styles')?.remove();
    delete window._ji_detail;
    console.log('[JANITOR-IN] Cleanup done');
}
