/**
 * modules/k3/module.js
 * Dream OS v2.0 — K3 Report Module (Self-Contained)
 */

// ========== SUPABASE CONFIG ==========
const SB_URL = 'https://pvznaeppaagylwddirla.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2em5hZXBwYWFneWx3ZGRpcmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTEwNDMsImV4cCI6MjA4NzUyNzA0M30.t9SJi3VfsBDkKmeZ3egZ4rbvljl4xe0WwNkPtfA9-vo';

// ========== STATE ==========
let _sb = null;
let _currentUser = null;
let _currentLang = 'id';

// ========== INIT SUPABASE ==========
async function initSupabase() {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        _sb = window.supabase.createClient(SB_URL, SB_KEY);
        return true;
    }

    console.warn('[K3] Supabase tidak ditemukan, auto-inject CDN...');
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
        console.error('[K3] Gagal auto-inject supabase:', err);
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
function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function fmtDate(d) {
    return d ? new Date(d).toLocaleDateString('id-ID') : '';
}
function fmtDateTime(d) {
    return d ? new Date(d).toLocaleString('id-ID', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '';
}

// ========== INJECT CSS ==========
function injectCSS() {
    if (document.getElementById('k3-styles')) return;
    const style = document.createElement('style');
    style.id = 'k3-styles';
    style.textContent = `
        #k3-root * { box-sizing: border-box; }
        #k3-root {
            max-width: 1000px;
            margin: 0 auto;
            padding: 1rem;
            font-family: 'Inter', 'Rajdhani', sans-serif;
            color: #e2e8f0;
        }
        .k3-panel {
            background: rgba(15,23,42,0.85);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(245,158,11,0.25);
            border-radius: 16px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
        }
        .k3-header {
            background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05));
            border-left: 4px solid #f59e0b;
        }
        .k3-title {
            font-size: 1.8rem;
            font-weight: 800;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.25rem;
        }
        .k3-sub {
            font-size: 0.75rem;
            color: #94a3b8;
        }
        .k3-tabs {
            display: flex;
            gap: 0.5rem;
            border-bottom: 2px solid rgba(245,158,11,0.3);
            margin-bottom: 1.5rem;
            overflow-x: auto;
        }
        .k3-tab {
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
        .k3-tab:hover { background: rgba(245,158,11,0.08); color: #e2e8f0; }
        .k3-tab.active { background: rgba(245,158,11,0.18); border-color: #f59e0b; color: #f59e0b; }
        .k3-form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-bottom: 1rem;
        }
        .k3-label {
            display: block;
            font-size: 0.75rem;
            color: #94a3b8;
            margin-bottom: 0.25rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .k3-input, .k3-select, .k3-textarea {
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
        .k3-input:focus, .k3-select:focus, .k3-textarea:focus {
            outline: none;
            border-color: #f59e0b;
            box-shadow: 0 0 0 3px rgba(245,158,11,0.2);
        }
        .k3-btn {
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
        .k3-btn-primary {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            width: 100%;
        }
        .k3-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(245,158,11,0.4); }
        .k3-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .k3-btn-sm {
            padding: 0.4rem 1rem;
            font-size: 0.8rem;
            border-radius: 8px;
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.1);
            color: #e2e8f0;
        }
        .k3-btn-sm:hover { background: rgba(245,158,11,0.2); border-color: #f59e0b; }
        .k3-upload-area {
            border: 2px dashed rgba(245,158,11,0.4);
            border-radius: 16px;
            padding: 1.5rem;
            text-align: center;
            cursor: pointer;
            transition: 0.2s;
            background: rgba(245,158,11,0.05);
        }
        .k3-upload-area:hover { border-color: #f59e0b; background: rgba(245,158,11,0.1); }
        .k3-preview {
            max-width: 200px;
            max-height: 150px;
            border-radius: 12px;
            margin-top: 0.75rem;
            display: none;
        }
        .k3-table-wrap {
            overflow-x: auto;
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,0.08);
        }
        table.k3-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.85rem;
        }
        table.k3-table thead { background: rgba(0,0,0,0.3); }
        table.k3-table th {
            padding: 0.75rem 1rem;
            text-align: left;
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #94a3b8;
        }
        table.k3-table td {
            padding: 0.75rem 1rem;
            border-top: 1px solid rgba(255,255,255,0.05);
        }
        table.k3-table tr:hover td { background: rgba(255,255,255,0.02); }
        .k3-badge {
            display: inline-block;
            padding: 0.2rem 0.75rem;
            border-radius: 20px;
            font-size: 0.7rem;
            font-weight: 600;
        }
        .k3-badge-pending { background: rgba(245,158,11,0.2); color: #f59e0b; }
        .k3-badge-approved { background: rgba(16,185,129,0.2); color: #10b981; }
        .k3-badge-rejected { background: rgba(239,68,68,0.2); color: #ef4444; }
        .k3-loader {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 3rem;
        }
        .k3-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(245,158,11,0.2);
            border-top-color: #f59e0b;
            border-radius: 50%;
            animation: k3-spin 1s linear infinite;
        }
        @keyframes k3-spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
}

// ========== RENDER HTML ==========
function renderRoot(container) {
    container.innerHTML = `
    <div id="k3-root">
        <!-- HEADER -->
        <div class="k3-panel k3-header" style="margin-bottom:1.5rem">
            <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
                <div style="font-size:3rem;">⚠️</div>
                <div>
                    <div class="k3-title">K3 REPORT</div>
                    <div class="k3-sub">Keselamatan & Kesehatan Kerja</div>
                </div>
                <div style="margin-left:auto; display:flex; gap:0.5rem;">
                    <span id="k3-user-badge" style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);color:#a855f7;padding:0.4rem 1rem;border-radius:30px;font-size:0.8rem;">GUEST</span>
                </div>
            </div>
        </div>

        <!-- TABS -->
        <div class="k3-tabs">
            <div class="k3-tab active" data-tab="form">📋 Form Laporan</div>
            <div class="k3-tab" data-tab="history">📜 Riwayat</div>
        </div>

        <!-- FORM TAB -->
        <div id="k3-form-tab" class="tab-content">
            <div class="k3-panel">
                <h3 style="font-size:1.2rem;font-weight:700;margin-bottom:1.5rem;color:#f59e0b;">📝 Laporan Baru</h3>
                <form id="k3Form">
                    <div class="k3-form-grid">
                        <div>
                            <label class="k3-label">Tanggal</label>
                            <input type="date" id="k3-tanggal" class="k3-input" required>
                        </div>
                        <div>
                            <label class="k3-label">Lokasi</label>
                            <input type="text" id="k3-lokasi" class="k3-input" placeholder="Gedung A Lantai 2" required>
                        </div>
                    </div>
                    <div class="k3-form-grid">
                        <div>
                            <label class="k3-label">Jenis Laporan</label>
                            <select id="k3-jenis" class="k3-select" required>
                                <option value="">-- Pilih --</option>
                                <option value="kerusakan">🔧 Kerusakan Fasilitas</option>
                                <option value="kehilangan">📦 Kehilangan</option>
                                <option value="kebersihan">🧹 Kebersihan</option>
                                <option value="kecelakaan">⚠️ Kecelakaan</option>
                                <option value="bahaya">☢️ Potensi Bahaya</option>
                                <option value="lainnya">📌 Lainnya</option>
                            </select>
                        </div>
                        <div>
                            <label class="k3-label">Prioritas</label>
                            <select id="k3-priority" class="k3-select">
                                <option value="normal">⚪ Normal</option>
                                <option value="high">🟡 Tinggi</option>
                                <option value="critical">🔴 Critical</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label class="k3-label">Deskripsi</label>
                        <textarea id="k3-deskripsi" rows="4" class="k3-textarea" placeholder="Jelaskan detail kejadian..." required></textarea>
                    </div>
                    <div>
                        <label class="k3-label">Foto Bukti (Opsional)</label>
                        <div class="k3-upload-area" onclick="document.getElementById('k3-foto').click()">
                            <i class="fas fa-camera" style="font-size:2rem;color:#f59e0b;margin-bottom:0.5rem;"></i>
                            <p style="font-size:0.9rem;">Klik untuk ambil foto atau upload</p>
                            <p style="font-size:0.7rem;opacity:0.7;">Maks 5MB (JPG, PNG)</p>
                            <input type="file" id="k3-foto" accept="image/*" capture="environment" style="display:none;">
                        </div>
                        <img id="k3-preview" class="k3-preview">
                        <input type="hidden" id="k3-foto-base64">
                    </div>
                    <div class="k3-form-grid">
                        <div>
                            <label class="k3-label">Pelapor</label>
                            <input type="text" id="k3-pelapor" class="k3-input" placeholder="Nama Anda" required>
                        </div>
                        <div style="display:flex;align-items:flex-end;">
                            <button type="submit" class="k3-btn k3-btn-primary" id="k3-submit">
                                <i class="fas fa-paper-plane"></i> Kirim Laporan
                            </button>
                        </div>
                    </div>
                </form>
                <div id="k3-form-result" style="margin-top:1rem;text-align:center;"></div>
            </div>
        </div>

        <!-- HISTORY TAB (hidden initially) -->
        <div id="k3-history-tab" class="tab-content" style="display:none;">
            <div class="k3-panel">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
                    <h3 style="font-size:1.2rem;font-weight:700;color:#f59e0b;">📜 Riwayat Laporan K3</h3>
                    <button id="k3-refresh-history" class="k3-btn k3-btn-sm"><i class="fas fa-sync-alt"></i> Refresh</button>
                </div>
                <div class="k3-table-wrap">
                    <table class="k3-table">
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Lokasi</th>
                                <th>Jenis</th>
                                <th>Pelapor</th>
                                <th>Prioritas</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="k3-history-body">
                            <tr><td colspan="7" style="text-align:center;padding:2rem;">Memuat...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    `;
}

// ========== UPLOAD FOTO (opsional) ==========
async function uploadPhoto(base64Data) {
    try {
        const response = await fetch(base64Data);
        const blob = await response.blob();
        const filename = `k3/${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;
        const { error } = await _sb.storage
            .from('k3-foto')
            .upload(filename, blob, { cacheControl: '3600', upsert: false });
        if (error) throw error;
        const { data: urlData } = _sb.storage.from('k3-foto').getPublicUrl(filename);
        return urlData.publicUrl;
    } catch (err) {
        console.error('[K3] Upload gagal:', err);
        return null;
    }
}

// ========== LOAD HISTORY ==========
async function loadHistory() {
    const tbody = document.getElementById('k3-history-body');
    if (!tbody || !_sb) return;

    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;"><div class="k3-spinner" style="margin:0 auto;"></div><p style="margin-top:1rem;">Memuat...</p></td></tr>';

    try {
        const { data, error } = await _sb
            .from('k3_reports')
            .select('id, tanggal, lokasi, jenis_laporan, pelapor, priority, status, created_at')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;opacity:0.7;">Belum ada laporan K3</td></tr>';
            return;
        }

        let html = '';
        data.forEach(item => {
            const statusClass = item.status === 'pending' ? 'k3-badge-pending' : item.status === 'verified' ? 'k3-badge-approved' : 'k3-badge-rejected';
            const statusText = item.status === 'pending' ? 'Pending' : item.status === 'verified' ? 'Selesai' : 'Ditolak';
            html += `
                <tr>
                    <td>${fmtDate(item.tanggal)}</td>
                    <td>${esc(item.lokasi)}</td>
                    <td>${esc(item.jenis_laporan)}</td>
                    <td>${esc(item.pelapor)}</td>
                    <td>${item.priority || 'normal'}</td>
                    <td><span class="k3-badge ${statusClass}">${statusText}</span></td>
                    <td><button class="k3-btn k3-btn-sm" onclick="window._k3_detail('${item.id}')"><i class="fas fa-eye"></i></button></td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    } catch (err) {
        console.error('[K3] Load history error:', err);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:#ef4444;">Gagal memuat: ${esc(err.message)}</td></tr>`;
    }
}

// ========== DETAIL LAPORAN (sementara alert) ==========
window._k3_detail = (id) => {
    alert('Detail laporan ID: ' + id);
    // Nanti bisa dikembangkan modal
};

// ========== SUBMIT FORM ==========
async function handleSubmit(e) {
    e.preventDefault();

    const tanggal = document.getElementById('k3-tanggal').value;
    const lokasi = document.getElementById('k3-lokasi').value;
    const jenis = document.getElementById('k3-jenis').value;
    const deskripsi = document.getElementById('k3-deskripsi').value;
    const pelapor = document.getElementById('k3-pelapor').value;
    const priority = document.getElementById('k3-priority').value;
    const fotoBase64 = document.getElementById('k3-foto-base64').value;

    if (!tanggal || !lokasi || !jenis || !deskripsi || !pelapor) {
        toast('Harap isi semua field wajib', 'warning');
        return;
    }

    const btn = document.getElementById('k3-submit');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';

    try {
        const data = {
            tanggal,
            lokasi,
            jenis_laporan: jenis,
            deskripsi,
            pelapor,
            priority: priority || 'normal',
            status: 'pending',
            created_at: new Date().toISOString()
        };

        if (fotoBase64) {
            const photoUrl = await uploadPhoto(fotoBase64);
            if (photoUrl) {
                data.foto_url = [photoUrl];
            } else {
                data.foto_url = [fotoBase64]; // fallback base64
            }
        }

        const { error } = await _sb.from('k3_reports').insert([data]);
        if (error) throw error;

        toast('Laporan K3 berhasil dikirim!', 'success');
        document.getElementById('k3Form').reset();
        document.getElementById('k3-preview').style.display = 'none';
        document.getElementById('k3-foto-base64').value = '';

        // Reset tanggal ke hari ini
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('k3-tanggal').value = today;

        // Jika tab history sedang aktif, refresh
        if (document.querySelector('.k3-tab[data-tab="history"]').classList.contains('active')) {
            loadHistory();
        }
    } catch (err) {
        console.error('[K3] Submit error:', err);
        toast('Gagal: ' + err.message, 'error');
        document.getElementById('k3-form-result').innerHTML = `<span style="color:#ef4444;">❌ ${err.message}</span>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// ========== SWITCH TAB ==========
function switchTab(tab) {
    document.querySelectorAll('.k3-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.k3-tab[data-tab="${tab}"]`).classList.add('active');

    document.getElementById('k3-form-tab').style.display = tab === 'form' ? 'block' : 'none';
    document.getElementById('k3-history-tab').style.display = tab === 'history' ? 'block' : 'none';

    if (tab === 'history') {
        loadHistory();
    }
}

// ========== ATTACH EVENT LISTENERS ==========
function attachEvents() {
    document.querySelectorAll('.k3-tab').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    document.getElementById('k3Form').addEventListener('submit', handleSubmit);

    document.getElementById('k3-refresh-history')?.addEventListener('click', loadHistory);

    // Upload foto preview
    document.getElementById('k3-foto').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast('File terlalu besar, maks 5MB', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                document.getElementById('k3-preview').src = ev.target.result;
                document.getElementById('k3-preview').style.display = 'block';
                document.getElementById('k3-foto-base64').value = ev.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Set default tanggal
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('k3-tanggal').value = today;
}

// ========== EXPORTED INIT ==========
export async function init(params = {}) {
    console.log('[K3] init()', params);

    injectCSS();

    const container = document.getElementById('module-content');
    if (!container) { console.error('[K3] #module-content tidak ditemukan'); return; }

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
        document.getElementById('k3-user-badge').textContent = params.user.name?.toUpperCase() || 'USER';
    }
    if (params.lang) _currentLang = params.lang;

    attachEvents();

    console.log('[K3] Ready ✅');
}

// ========== EXPORTED CLEANUP ==========
export function cleanup() {
    document.getElementById('k3-styles')?.remove();
    delete window._k3_detail;
    console.log('[K3] Cleanup done');
}
