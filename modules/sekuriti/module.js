/**
 * modules/sekuriti/module.js
 * Dream OS v2.0 — Modul Sekuriti (Self-Contained)
 * Fitur: Laporan patroli dengan GPS & foto, riwayat laporan, jadwal petugas
 */

// ========== SUPABASE CONFIG ==========
const SB_URL = 'https://pvznaeppaagylwddirla.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2em5hZXBwYWFneWx3ZGRpcmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTEwNDMsImV4cCI6MjA4NzUyNzA0M30.t9SJi3VfsBDkKmeZ3egZ4rbvljl4xe0WwNkPtfA9-vo';

// ========== KONFIGURASI ==========
const DEPOK_CORE = { lat: -6.4000, lng: 106.8200 };
const SAFE_RADIUS_KM = 5.0;
const listPetugas = ['SUDARSONO', 'MARHUSIN', 'HERIYATNO', 'SUNARKO', 'HARIYANSAHC', 'AGUS SUTISNA', 'DONIH'];

// ========== STATE ==========
let _sb = null;
let _currentUser = null;
let _currentLang = 'id';
let _lastWeather = null;

// ========== INIT SUPABASE ==========
async function initSupabase() {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        _sb = window.supabase.createClient(SB_URL, SB_KEY);
        return true;
    }

    console.warn('[SEKURITI] Supabase tidak ditemukan, auto-inject CDN...');
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
        console.error('[SEKURITI] Gagal auto-inject supabase:', err);
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
function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('id-ID') : ''; }
function fmtDateTime(d) { return d ? new Date(d).toLocaleString('id-ID', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : ''; }
function fmtRp(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }

// ========== DETEKSI SHIFT ==========
function getCurrentShift() {
    const jam = new Date().getHours();
    return (jam >= 7 && jam < 19) ? 'PAGI (07:00-19:00)' : 'MALAM (19:00-07:00)';
}

// ========== GEO ==========
function getGeolocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) reject('GPS tidak didukung');
        navigator.geolocation.getCurrentPosition(
            pos => resolve(pos.coords),
            err => reject('Izin GPS ditolak'),
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

// ========== INJECT CSS ==========
function injectCSS() {
    if (document.getElementById('sekuriti-styles')) return;
    const style = document.createElement('style');
    style.id = 'sekuriti-styles';
    style.textContent = `
        #sekuriti-root * { box-sizing: border-box; }
        #sekuriti-root {
            max-width: 1000px;
            margin: 0 auto;
            padding: 1rem;
            font-family: 'Inter', 'Rajdhani', sans-serif;
            color: #e2e8f0;
        }
        .sek-panel {
            background: rgba(15,23,42,0.85);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(16,185,129,0.25);
            border-radius: 16px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
        }
        .sek-header {
            background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05));
            border-left: 4px solid #10b981;
        }
        .sek-title {
            font-size: 1.8rem;
            font-weight: 800;
            background: linear-gradient(135deg, #10b981, #059669);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.25rem;
        }
        .sek-sub {
            font-size: 0.75rem;
            color: #94a3b8;
        }
        .sek-tabs {
            display: flex;
            gap: 0.5rem;
            border-bottom: 2px solid rgba(16,185,129,0.3);
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
            color: #94a3b8;
            white-space: nowrap;
        }
        .sek-tab:hover { background: rgba(16,185,129,0.08); color: #e2e8f0; }
        .sek-tab.active { background: rgba(16,185,129,0.18); border-color: #10b981; color: #10b981; }
        .sek-status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 0.75rem;
            margin-bottom: 1.5rem;
        }
        .sek-status-card {
            background: rgba(0,0,0,0.2);
            border-radius: 12px;
            padding: 1rem;
            border-left: 3px solid #10b981;
        }
        .sek-status-label {
            font-size: 0.65rem;
            text-transform: uppercase;
            color: #94a3b8;
            letter-spacing: 0.5px;
        }
        .sek-status-value {
            font-size: 1.1rem;
            font-weight: 700;
            margin-top: 0.25rem;
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
            color: #94a3b8;
            margin-bottom: 0.25rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .sek-input, .sek-select, .sek-textarea {
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
        .sek-input:focus, .sek-select:focus, .sek-textarea:focus {
            outline: none;
            border-color: #10b981;
            box-shadow: 0 0 0 3px rgba(16,185,129,0.2);
        }
        .sek-btn {
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
        .sek-btn-primary {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            width: 100%;
        }
        .sek-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(16,185,129,0.4); }
        .sek-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .sek-btn-sm {
            padding: 0.4rem 1rem;
            font-size: 0.8rem;
            border-radius: 8px;
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.1);
            color: #e2e8f0;
        }
        .sek-btn-sm:hover { background: rgba(16,185,129,0.2); border-color: #10b981; }
        .sek-upload-area {
            border: 2px dashed rgba(16,185,129,0.4);
            border-radius: 16px;
            padding: 1.5rem;
            text-align: center;
            cursor: pointer;
            transition: 0.2s;
            background: rgba(16,185,129,0.05);
        }
        .sek-upload-area:hover { border-color: #10b981; background: rgba(16,185,129,0.1); }
        .sek-preview {
            max-width: 200px;
            max-height: 150px;
            border-radius: 12px;
            margin-top: 0.75rem;
            display: none;
        }
        .sek-table-wrap {
            overflow-x: auto;
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,0.08);
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
            letter-spacing: 0.5px;
            color: #94a3b8;
        }
        table.sek-table td {
            padding: 0.75rem 1rem;
            border-top: 1px solid rgba(255,255,255,0.05);
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
            border: 3px solid rgba(16,185,129,0.2);
            border-top-color: #10b981;
            border-radius: 50%;
            animation: sek-spin 1s linear infinite;
        }
        @keyframes sek-spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
}

// ========== RENDER HTML ==========
function renderRoot(container) {
    container.innerHTML = `
    <div id="sekuriti-root">
        <!-- HEADER -->
        <div class="sek-panel sek-header" style="margin-bottom:1.5rem">
            <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
                <div style="font-size:3rem;">🛡️</div>
                <div>
                    <div class="sek-title">SEKURITI</div>
                    <div class="sek-sub">Sistem Monitoring & Laporan Patroli</div>
                </div>
                <div style="margin-left:auto; display:flex; gap:0.5rem;">
                    <span id="sek-user-badge" style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);color:#a855f7;padding:0.4rem 1rem;border-radius:30px;font-size:0.8rem;">GUEST</span>
                </div>
            </div>
        </div>

        <!-- STATUS CARDS -->
        <div class="sek-status-grid">
            <div class="sek-status-card">
                <div class="sek-status-label">SHIFT</div>
                <div class="sek-status-value" id="sek-shift">${getCurrentShift()}</div>
            </div>
            <div class="sek-status-card">
                <div class="sek-status-label">LOKASI</div>
                <div class="sek-status-value" id="sek-lokasi">—</div>
            </div>
            <div class="sek-status-card">
                <div class="sek-status-label">JARAK DARI CORE</div>
                <div class="sek-status-value" id="sek-jarak">—</div>
            </div>
            <div class="sek-status-card">
                <div class="sek-status-label">STATUS</div>
                <div class="sek-status-value" id="sek-status">—</div>
            </div>
        </div>

        <!-- TABS -->
        <div class="sek-tabs">
            <div class="sek-tab active" data-tab="laporan">📋 Laporan Patroli</div>
            <div class="sek-tab" data-tab="history">📜 Riwayat</div>
            <div class="sek-tab" data-tab="jadwal">📅 Jadwal</div>
        </div>

        <!-- TAB LAPORAN -->
        <div id="sek-laporan-tab" class="tab-content">
            <div class="sek-panel">
                <h3 style="font-size:1.2rem;font-weight:700;margin-bottom:1.5rem;color:#10b981;">📝 Laporan Patroli Baru</h3>
                <form id="sekForm">
                    <div class="sek-form-grid">
                        <div>
                            <label class="sek-label">Tanggal</label>
                            <input type="text" id="sek-tanggal" class="sek-input" readonly>
                        </div>
                        <div>
                            <label class="sek-label">Shift</label>
                            <input type="text" id="sek-shift-input" class="sek-input" readonly>
                        </div>
                    </div>
                    <div class="sek-form-grid">
                        <div>
                            <label class="sek-label">Petugas Jaga</label>
                            <select id="sek-petugas" class="sek-select" required>
                                <option value="">-- Pilih Petugas --</option>
                                ${listPetugas.map(n => `<option value="${n}">${n}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="sek-label">Lokasi Patroli</label>
                            <input type="text" id="sek-lokasi-input" class="sek-input" placeholder="Contoh: Pos Utama" required>
                        </div>
                    </div>
                    <div>
                        <label class="sek-label">Deskripsi Situasi</label>
                        <textarea id="sek-deskripsi" rows="4" class="sek-textarea" placeholder="Jelaskan situasi / kejadian..." required></textarea>
                    </div>
                    <div>
                        <label class="sek-label">Foto Bukti (wajib)</label>
                        <div class="sek-upload-area" onclick="document.getElementById('sek-foto').click()">
                            <i class="fas fa-camera" style="font-size:2rem;color:#10b981;margin-bottom:0.5rem;"></i>
                            <p style="font-size:0.9rem;">Klik untuk ambil foto (geotag otomatis)</p>
                            <p style="font-size:0.7rem;opacity:0.7;">Maks 5MB (JPG, PNG)</p>
                            <input type="file" id="sek-foto" accept="image/*" capture="environment" style="display:none;" required>
                        </div>
                        <img id="sek-preview" class="sek-preview">
                        <input type="hidden" id="sek-foto-base64">
                    </div>
                    <div style="margin-top:1rem;">
                        <button type="submit" class="sek-btn sek-btn-primary" id="sek-submit">
                            <i class="fas fa-lock"></i> Enkripsi & Kirim
                        </button>
                    </div>
                    <div id="sek-form-result" style="margin-top:1rem;text-align:center;"></div>
                </form>
            </div>
        </div>

        <!-- TAB HISTORY -->
        <div id="sek-history-tab" class="tab-content" style="display:none;">
            <div class="sek-panel">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
                    <h3 style="font-size:1.2rem;font-weight:700;color:#10b981;">📜 Riwayat Laporan Patroli</h3>
                    <button id="sek-refresh-history" class="sek-btn sek-btn-sm"><i class="fas fa-sync-alt"></i> Refresh</button>
                </div>
                <div class="sek-table-wrap">
                    <table class="sek-table">
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Shift</th>
                                <th>Petugas</th>
                                <th>Lokasi</th>
                                <th>Koordinat</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
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
                <h3 style="font-size:1.2rem;font-weight:700;margin-bottom:1.5rem;color:#10b981;">📅 Jadwal Petugas</h3>
                <div id="sek-jadwal-view">
                    <div class="sek-loader"><div class="sek-spinner"></div><p style="margin-top:1rem;">Memuat jadwal...</p></div>
                </div>
            </div>
        </div>
    </div>
    `;
}

// ========== UPLOAD FOTO ==========
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

// ========== LOAD RIWAYAT ==========
async function loadHistory() {
    const tbody = document.getElementById('sek-history-body');
    if (!tbody || !_sb) return;

    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;"><div class="sek-spinner" style="margin:0 auto;"></div><p style="margin-top:1rem;">Memuat...</p></td></tr>';

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
                    <td>${esc(item.petugas?.join?.(', ') || item.petugas)}</td>
                    <td>${esc(item.lokasi)}</td>
                    <td>${item.koordinat || '-'}</td>
                    <td><span class="sek-badge ${statusClass}">${statusText}</span></td>
                    <td><button class="sek-btn sek-btn-sm" onclick="window._sek_detail('${item.id}')"><i class="fas fa-eye"></i></button></td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    } catch (err) {
        console.error('[SEKURITI] Load history error:', err);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:#ef4444;">Gagal memuat: ${esc(err.message)}</td></tr>`;
    }
}

// ========== LOAD JADWAL ==========
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
        console.error('[SEKURITI] Load jadwal error:', err);
        view.innerHTML = `<p style="text-align:center;padding:2rem;color:#ef4444;">Gagal memuat jadwal: ${esc(err.message)}</p>`;
    }
}

// ========== DETAIL LAPORAN ==========
window._sek_detail = (id) => {
    alert('Detail laporan ID: ' + id);
    // Bisa dikembangkan modal
};

// ========== SUBMIT FORM ==========
async function handleSubmit(e) {
    e.preventDefault();

    const tanggal = document.getElementById('sek-tanggal').value;
    const shift = document.getElementById('sek-shift-input').value;
    const petugas = document.getElementById('sek-petugas').value;
    const lokasi = document.getElementById('sek-lokasi-input').value;
    const deskripsi = document.getElementById('sek-deskripsi').value;
    const fotoBase64 = document.getElementById('sek-foto-base64').value;

    if (!petugas || !lokasi || !deskripsi) {
        toast('Harap isi semua field wajib', 'warning');
        return;
    }

    const btn = document.getElementById('sek-submit');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';

    try {
        // Ambil GPS
        const coords = await getGeolocation();
        const { safe, distance } = checkSafeCore(coords.latitude, coords.longitude);
        if (!safe) {
            if (!confirm(`Anda berada di luar safe core (${distance.toFixed(1)} km). Tetap kirim laporan?`)) {
                throw new Error('Laporan dibatalkan');
            }
        }

        // Upload foto
        if (!fotoBase64) throw new Error('Foto wajib diambil');
        const fotoUrl = await uploadPhoto(fotoBase64);
        if (!fotoUrl) throw new Error('Upload foto gagal');

        const data = {
            tanggal,
            shift,
            petugas: [petugas],
            lokasi,
            deskripsi,
            koordinat: `${coords.latitude}, ${coords.longitude}`,
            foto_url: [fotoUrl],
            status: 'pending',
            created_at: new Date().toISOString()
        };

        const { error } = await _sb.from('sekuriti_reports').insert([data]);
        if (error) throw error;

        toast('Laporan berhasil dikirim!', 'success');
        document.getElementById('sekForm').reset();
        document.getElementById('sek-preview').style.display = 'none';
        document.getElementById('sek-foto-base64').value = '';
        // Reset tanggal dan shift
        document.getElementById('sek-tanggal').value = new Date().toISOString().split('T')[0];
        document.getElementById('sek-shift-input').value = getCurrentShift();

        // Refresh jika tab history aktif
        if (document.querySelector('.sek-tab[data-tab="history"]').classList.contains('active')) {
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

// ========== UPDATE STATUS LOKASI ==========
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

// ========== SWITCH TAB ==========
function switchTab(tab) {
    document.querySelectorAll('.sek-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.sek-tab[data-tab="${tab}"]`).classList.add('active');

    document.getElementById('sek-laporan-tab').style.display = tab === 'laporan' ? 'block' : 'none';
    document.getElementById('sek-history-tab').style.display = tab === 'history' ? 'block' : 'none';
    document.getElementById('sek-jadwal-tab').style.display = tab === 'jadwal' ? 'block' : 'none';

    if (tab === 'history') loadHistory();
    if (tab === 'jadwal') loadJadwal();
}

// ========== ATTACH EVENT LISTENERS ==========
function attachEvents() {
    document.querySelectorAll('.sek-tab').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    document.getElementById('sekForm').addEventListener('submit', handleSubmit);

    document.getElementById('sek-refresh-history')?.addEventListener('click', loadHistory);

    // Upload foto preview
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

    // Set tanggal dan shift
    document.getElementById('sek-tanggal').value = new Date().toISOString().split('T')[0];
    document.getElementById('sek-shift-input').value = getCurrentShift();

    // Update lokasi setiap 30 detik
    updateLocationStatus();
    setInterval(updateLocationStatus, 30000);
}

// ========== EXPORTED INIT ==========
export async function init(params = {}) {
    console.log('[SEKURITI] init()', params);

    injectCSS();

    const container = document.getElementById('module-content');
    if (!container) { console.error('[SEKURITI] #module-content tidak ditemukan'); return; }

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
        document.getElementById('sek-user-badge').textContent = params.user.name?.toUpperCase() || 'USER';
    }
    if (params.lang) _currentLang = params.lang;

    attachEvents();

    console.log('[SEKURITI] Ready ✅');
}

// ========== EXPORTED CLEANUP ==========
export function cleanup() {
    document.getElementById('sekuriti-styles')?.remove();
    delete window._sek_detail;
    console.log('[SEKURITI] Cleanup done');
}
