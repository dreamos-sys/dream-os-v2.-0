/**
 * modules/asset/module.js
 * Dream OS v2.0 — Modul Manajemen Aset (Self-Contained)
 * Fitur: Daftar aset, tambah/edit, kondisi, riwayat
 */

// ========== SUPABASE CONFIG ==========
const SB_URL = 'https://pvznaeppaagylwddirla.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2em5hZXBwYWFneWx3ZGRpcmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTEwNDMsImV4cCI6MjA4NzUyNzA0M30.t9SJi3VfsBDkKmeZ3egZ4rbvljl4xe0WwNkPtfA9-vo';

// ========== STATE ==========
let _sb = null;
let _currentUser = null;
let _currentLang = localStorage.getItem('lang') || 'id';
let _currentAssets = [];

// ========== INIT SUPABASE ==========
async function initSupabase() {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        _sb = window.supabase.createClient(SB_URL, SB_KEY);
        return true;
    }

    console.warn('[ASSET] Supabase tidak ditemukan, auto-inject CDN...');
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
        console.error('[ASSET] Gagal auto-inject supabase:', err);
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

// ========== INJECT CSS ==========
function injectCSS() {
    if (document.getElementById('asset-styles')) return;
    const style = document.createElement('style');
    style.id = 'asset-styles';
    style.textContent = `
        #asset-root * { box-sizing: border-box; }
        #asset-root {
            max-width: 1000px;
            margin: 0 auto;
            padding: 1rem;
            font-family: 'Inter', 'Rajdhani', sans-serif;
            color: #e2e8f0;
        }
        .asset-panel {
            background: rgba(15,23,42,0.85);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(168,85,247,0.25);
            border-radius: 16px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
        }
        .asset-header {
            background: linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.05));
            border-left: 4px solid #a855f7;
        }
        .asset-title {
            font-size: 1.8rem;
            font-weight: 800;
            background: linear-gradient(135deg, #a855f7, #9333ea);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.25rem;
        }
        .asset-tabs {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
            border-bottom: 2px solid rgba(168,85,247,0.3);
            margin-bottom: 1.5rem;
        }
        .asset-tab {
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
        .asset-tab:hover { background: rgba(168,85,247,0.08); color: #e2e8f0; }
        .asset-tab.active { background: rgba(168,85,247,0.18); border-color: #a855f7; color: #a855f7; }
        .asset-form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 1rem;
        }
        .asset-label {
            display: block;
            font-size: 0.75rem;
            color: #94a3b8;
            margin-bottom: 0.25rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .asset-input, .asset-select, .asset-textarea {
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
        .asset-input:focus, .asset-select:focus, .asset-textarea:focus {
            outline: none;
            border-color: #a855f7;
            box-shadow: 0 0 0 3px rgba(168,85,247,0.2);
        }
        .asset-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.6rem 1.2rem;
            border-radius: 12px;
            font-weight: 700;
            font-size: 0.85rem;
            cursor: pointer;
            transition: 0.2s;
            border: none;
            background: rgba(255,255,255,0.08);
            color: #e2e8f0;
        }
        .asset-btn:hover { transform: translateY(-1px); background: rgba(255,255,255,0.15); }
        .asset-btn-primary {
            background: linear-gradient(135deg, #a855f7, #9333ea);
            color: white;
            width: 100%;
        }
        .asset-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(168,85,247,0.4); }
        .asset-btn-sm {
            padding: 0.3rem 1rem;
            font-size: 0.75rem;
            border-radius: 20px;
        }
        .asset-stat-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 0.75rem;
            margin-bottom: 1.5rem;
        }
        .asset-stat-card {
            background: rgba(0,0,0,0.2);
            border-radius: 12px;
            padding: 1rem;
            border-left: 3px solid #a855f7;
        }
        .asset-stat-label {
            font-size: 0.65rem;
            text-transform: uppercase;
            color: #94a3b8;
            letter-spacing: 0.5px;
        }
        .asset-stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            margin-top: 0.25rem;
        }
        .asset-card {
            background: rgba(0,0,0,0.2);
            border-radius: 16px;
            padding: 1rem;
            margin-bottom: 0.75rem;
            border: 1px solid rgba(255,255,255,0.05);
        }
        .asset-badge {
            display: inline-block;
            padding: 0.2rem 0.75rem;
            border-radius: 30px;
            font-size: 0.65rem;
            font-weight: 700;
            text-transform: uppercase;
        }
        .asset-badge-baik { background: rgba(16,185,129,0.2); color: #10b981; }
        .asset-badge-ringan { background: rgba(245,158,11,0.2); color: #f59e0b; }
        .asset-badge-berat { background: rgba(239,68,68,0.2); color: #ef4444; }
        .asset-badge-perbaikan { background: rgba(249,115,22,0.2); color: #f97316; }
        .asset-badge-hilang { background: rgba(100,116,139,0.2); color: #64748b; }
        .asset-loader {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 3rem;
        }
        .asset-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(168,85,247,0.2);
            border-top-color: #a855f7;
            border-radius: 50%;
            animation: asset-spin 1s linear infinite;
        }
        @keyframes asset-spin { to { transform: rotate(360deg); } }
        table.asset-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.85rem;
        }
        table.asset-table thead { background: rgba(0,0,0,0.3); }
        table.asset-table th { padding: 0.75rem; text-align: left; font-size: 0.7rem; text-transform: uppercase; color: #94a3b8; }
        table.asset-table td { padding: 0.75rem; border-top: 1px solid rgba(255,255,255,0.05); }
        table.asset-table tr:hover td { background: rgba(255,255,255,0.02); }
    `;
    document.head.appendChild(style);
}

// ========== RENDER HTML ==========
function renderRoot(container) {
    container.innerHTML = `
    <div id="asset-root">
        <!-- HEADER -->
        <div class="asset-panel asset-header" style="margin-bottom:1.5rem">
            <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
                <div style="font-size:3rem;">🏢</div>
                <div>
                    <div class="asset-title">MANAJEMEN ASET</div>
                    <div class="asset-sub" style="font-size:0.75rem;color:#94a3b8;">Asset Inventory & Tracking System</div>
                </div>
                <div style="margin-left:auto; display:flex; gap:0.5rem;">
                    <span id="asset-user-badge" style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);color:#a855f7;padding:0.4rem 1rem;border-radius:30px;font-size:0.8rem;">GUEST</span>
                </div>
            </div>
        </div>

        <!-- TABS -->
        <div class="asset-tabs">
            <button class="asset-tab active" data-tab="daftar">📋 Daftar Aset</button>
            <button class="asset-tab" data-tab="tambah">➕ Tambah Aset</button>
            <button class="asset-tab" data-tab="kondisi">🔧 Kondisi Aset</button>
            <button class="asset-tab" data-tab="history">📜 Riwayat</button>
        </div>

        <!-- TAB DAFTAR -->
        <div id="asset-tab-daftar" class="tab-content">
            <div class="asset-panel">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                    <h3 style="font-size:1.2rem; font-weight:700; color:#a855f7;">Semua Aset</h3>
                    <input type="text" id="asset-search" placeholder="Cari aset..." style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:30px; padding:0.4rem 1rem; color:white; font-size:0.85rem;">
                </div>
                <div id="asset-list"></div>
            </div>
        </div>

        <!-- TAB TAMBAH -->
        <div id="asset-tab-tambah" class="tab-content" style="display:none;">
            <div class="asset-panel">
                <h3 style="font-size:1.2rem; font-weight:700; margin-bottom:1.5rem; color:#a855f7;">Form Aset Baru</h3>
                <form id="assetForm">
                    <input type="hidden" id="asset-id">
                    <div class="asset-form-grid">
                        <div>
                            <label class="asset-label">Nama Aset *</label>
                            <input type="text" id="asset-nama" class="asset-input" required>
                        </div>
                        <div>
                            <label class="asset-label">Kategori</label>
                            <input type="text" id="asset-kategori" class="asset-input">
                        </div>
                    </div>
                    <div class="asset-form-grid">
                        <div>
                            <label class="asset-label">Lokasi</label>
                            <input type="text" id="asset-lokasi" class="asset-input">
                        </div>
                        <div>
                            <label class="asset-label">Kondisi</label>
                            <select id="asset-kondisi" class="asset-select">
                                <option value="baik">Baik</option>
                                <option value="rusak_ringan">Rusak Ringan</option>
                                <option value="rusak_berat">Rusak Berat</option>
                                <option value="perbaikan">Perbaikan</option>
                                <option value="hilang">Hilang</option>
                            </select>
                        </div>
                    </div>
                    <div class="asset-form-grid">
                        <div>
                            <label class="asset-label">Jumlah</label>
                            <input type="number" id="asset-jumlah" min="0" value="1" class="asset-input">
                        </div>
                        <div>
                            <label class="asset-label">Satuan</label>
                            <input type="text" id="asset-satuan" placeholder="unit/pcs" class="asset-input">
                        </div>
                        <div>
                            <label class="asset-label">Nilai (Rp)</label>
                            <input type="number" id="asset-nilai" min="0" step="1000" class="asset-input">
                        </div>
                    </div>
                    <div>
                        <label class="asset-label">Keterangan / Serial Number</label>
                        <textarea id="asset-keterangan" rows="2" class="asset-textarea"></textarea>
                    </div>
                    <button type="submit" class="asset-btn asset-btn-primary" id="asset-submit">
                        <i class="fas fa-save"></i> Simpan Aset
                    </button>
                    <div id="asset-form-result" style="margin-top:1rem; text-align:center;"></div>
                </form>
            </div>
        </div>

        <!-- TAB KONDISI -->
        <div id="asset-tab-kondisi" class="tab-content" style="display:none;">
            <div class="asset-panel">
                <div class="asset-stat-grid">
                    <div class="asset-stat-card"><div class="asset-stat-label">Baik</div><div class="asset-stat-value" id="asset-stat-baik">0</div></div>
                    <div class="asset-stat-card"><div class="asset-stat-label">Rusak Ringan</div><div class="asset-stat-value" id="asset-stat-ringan">0</div></div>
                    <div class="asset-stat-card"><div class="asset-stat-label">Rusak Berat</div><div class="asset-stat-value" id="asset-stat-berat">0</div></div>
                    <div class="asset-stat-card"><div class="asset-stat-label">Perbaikan</div><div class="asset-stat-value" id="asset-stat-perbaikan">0</div></div>
                </div>
                <h3 style="font-size:1rem; font-weight:700; margin:1rem 0 0.5rem; color:#a855f7;">Aset Bermasalah</h3>
                <div id="asset-masalah"></div>
            </div>
        </div>

        <!-- TAB HISTORY -->
        <div id="asset-tab-history" class="tab-content" style="display:none;">
            <div class="asset-panel">
                <h3 style="font-size:1.2rem; font-weight:700; margin-bottom:1.5rem; color:#a855f7;">Riwayat Perubahan Aset</h3>
                <div style="overflow-x:auto;">
                    <table class="asset-table">
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Aset</th>
                                <th>Perubahan</th>
                                <th>Oleh</th>
                            </tr>
                        </thead>
                        <tbody id="asset-history-body">
                            <tr><td colspan="4" style="text-align:center; padding:2rem;">Memuat...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    `;
}

// ========== LOAD ASET ==========
async function loadAssets() {
    const list = document.getElementById('asset-list');
    if (!list) return;

    list.innerHTML = '<div class="asset-loader"><div class="asset-spinner"></div><p style="margin-top:1rem;">Memuat...</p></div>';

    try {
        const { data, error } = await _sb
            .from('assets')
            .select('*')
            .order('nama_aset', { ascending: true });

        if (error) throw error;
        _currentAssets = data || [];
        renderAssetList(_currentAssets);
    } catch (err) {
        console.error('[ASSET] load error:', err);
        list.innerHTML = `<p style="text-align:center; padding:2rem; color:#ef4444;">Gagal memuat: ${esc(err.message)}</p>`;
    }
}

function renderAssetList(items) {
    const list = document.getElementById('asset-list');
    if (!list) return;
    if (items.length === 0) {
        list.innerHTML = '<p style="text-align:center; padding:2rem; opacity:0.7;">Belum ada aset</p>';
        return;
    }

    let html = '';
    items.forEach(asset => {
        const kondisiClass = {
            'baik': 'asset-badge-baik',
            'rusak_ringan': 'asset-badge-ringan',
            'rusak_berat': 'asset-badge-berat',
            'perbaikan': 'asset-badge-perbaikan',
            'hilang': 'asset-badge-hilang'
        }[asset.kondisi] || 'asset-badge-baik';

        html += `
            <div class="asset-card">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="flex:1;">
                        <div style="font-weight:700; font-size:1rem;">${esc(asset.nama_aset)}</div>
                        <div style="font-size:0.7rem; color:#94a3b8; margin-top:2px;">${esc(asset.kategori || '—')} | ${esc(asset.lokasi || '—')}</div>
                        <div style="display:flex; gap:0.75rem; font-size:0.75rem; margin-top:0.25rem;">
                            <span>📦 ${asset.jumlah || 1} ${esc(asset.satuan || '')}</span>
                            <span class="${kondisiClass}" style="padding:0.1rem 0.5rem; border-radius:12px;">${asset.kondisi || 'baik'}</span>
                            ${asset.nilai ? `<span>💰 Rp ${asset.nilai.toLocaleString()}</span>` : ''}
                        </div>
                        ${asset.keterangan ? `<div style="font-size:0.7rem; color:#64748b; margin-top:0.25rem;">${esc(asset.keterangan)}</div>` : ''}
                    </div>
                    <div style="display:flex; gap:0.25rem;">
                        <button class="asset-btn asset-btn-sm" onclick="window.asset_edit('${asset.id}')"><i class="fas fa-edit"></i></button>
                        <button class="asset-btn asset-btn-sm" onclick="window.asset_hapus('${asset.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            </div>
        `;
    });
    list.innerHTML = html;
}

// ========== LOAD STATISTIK KONDISI ==========
async function loadKondisi() {
    try {
        const { data, error } = await _sb.from('assets').select('kondisi');
        if (error) throw error;

        const baik = data.filter(a => a.kondisi === 'baik').length;
        const ringan = data.filter(a => a.kondisi === 'rusak_ringan').length;
        const berat = data.filter(a => a.kondisi === 'rusak_berat').length;
        const perbaikan = data.filter(a => a.kondisi === 'perbaikan').length;

        setEl('asset-stat-baik', baik);
        setEl('asset-stat-ringan', ringan);
        setEl('asset-stat-berat', berat);
        setEl('asset-stat-perbaikan', perbaikan);

        const masalahEl = document.getElementById('asset-masalah');
        if (!masalahEl) return;

        if (ringan + berat + perbaikan === 0) {
            masalahEl.innerHTML = '<p style="opacity:0.7;">Semua aset dalam kondisi baik</p>';
            return;
        }

        const { data: items } = await _sb
            .from('assets')
            .select('nama_aset, kondisi, jumlah, satuan, lokasi')
            .in('kondisi', ['rusak_ringan', 'rusak_berat', 'perbaikan'])
            .order('kondisi');

        let html = '';
        items.forEach(item => {
            const color = {
                'rusak_ringan': '#f59e0b',
                'rusak_berat': '#ef4444',
                'perbaikan': '#f97316'
            }[item.kondisi];
            html += `
                <div style="background:rgba(0,0,0,0.2); border-radius:8px; padding:0.75rem; margin-bottom:0.5rem;">
                    <div style="display:flex; justify-content:space-between;">
                        <span style="font-weight:600;">${esc(item.nama_aset)}</span>
                        <span style="color:${color};">${item.kondisi}</span>
                    </div>
                    <div style="font-size:0.7rem; color:#94a3b8;">${esc(item.lokasi || '—')} | ${item.jumlah || 1} ${item.satuan || ''}</div>
                </div>
            `;
        });
        masalahEl.innerHTML = html;
    } catch (err) {
        console.error('[ASSET] loadKondisi error:', err);
    }
}

// ========== LOAD RIWAYAT (dari assets atau audit_logs) ==========
async function loadHistory() {
    const tbody = document.getElementById('asset-history-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:2rem;"><div class="asset-spinner" style="margin:0 auto;"></div></td></tr>';

    try {
        // Gunakan audit_logs jika ada, fallback ke assets
        let data = [];
        const { data: logs, error } = await _sb
            .from('audit_logs')
            .select('*')
            .eq('table_name', 'assets')
            .order('created_at', { ascending: false })
            .limit(30);

        if (!error && logs?.length) {
            data = logs;
        } else {
            // fallback: assets dengan updated_at
            const { data: assets } = await _sb
                .from('assets')
                .select('id, nama_aset, updated_at, created_at')
                .order('updated_at', { ascending: false })
                .limit(20);
            data = (assets || []).map(a => ({
                created_at: a.updated_at || a.created_at,
                action: 'Diperbarui',
                record_id: a.id,
                record_name: a.nama_aset,
                user: 'System'
            }));
        }

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:2rem; opacity:0.7;">Belum ada riwayat</td></tr>';
            return;
        }

        let html = '';
        data.forEach(item => {
            html += `
                <tr>
                    <td style="padding:0.5rem;">${fmtDate(item.created_at)}</td>
                    <td style="padding:0.5rem;">${esc(item.record_name || item.nama_aset || '-')}</td>
                    <td style="padding:0.5rem;">${esc(item.action || 'Update')}</td>
                    <td style="padding:0.5rem;">${esc(item.user || 'System')}</td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    } catch (err) {
        console.error('[ASSET] loadHistory error:', err);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:2rem; color:#ef4444;">Gagal memuat</td></tr>';
    }
}

// ========== HANDLE SUBMIT FORM ==========
async function handleAssetSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('asset-id')?.value;
    const nama = document.getElementById('asset-nama')?.value;
    if (!nama) {
        toast('Nama aset harus diisi', 'warning');
        return;
    }

    const data = {
        nama_aset: nama,
        kategori: document.getElementById('asset-kategori')?.value || null,
        lokasi: document.getElementById('asset-lokasi')?.value || null,
        kondisi: document.getElementById('asset-kondisi')?.value || 'baik',
        jumlah: parseInt(document.getElementById('asset-jumlah')?.value) || 1,
        satuan: document.getElementById('asset-satuan')?.value || null,
        nilai: document.getElementById('asset-nilai')?.value ? parseInt(document.getElementById('asset-nilai').value) : null,
        keterangan: document.getElementById('asset-keterangan')?.value || null,
        updated_at: new Date().toISOString()
    };

    const btn = document.getElementById('asset-submit');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

    try {
        let error;
        if (id) {
            ({ error } = await _sb.from('assets').update(data).eq('id', id));
        } else {
            data.created_at = new Date().toISOString();
            ({ error } = await _sb.from('assets').insert([data]));
        }
        if (error) throw error;

        toast('Aset berhasil disimpan', 'success');
        document.getElementById('assetForm').reset();
        document.getElementById('asset-id').value = '';
        await loadAssets();
        await loadKondisi();
        await loadHistory();
        switchTab('daftar');
    } catch (err) {
        console.error('[ASSET] submit error:', err);
        toast('Gagal: ' + err.message, 'error');
        document.getElementById('asset-form-result').innerHTML = `<span style="color:#ef4444;">❌ ${err.message}</span>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// ========== FUNGSI GLOBAL UNTUK TOMBOL ==========
window.asset_edit = async (id) => {
    const asset = _currentAssets.find(a => a.id === id);
    if (!asset) return;

    document.getElementById('asset-id').value = asset.id;
    document.getElementById('asset-nama').value = asset.nama_aset;
    document.getElementById('asset-kategori').value = asset.kategori || '';
    document.getElementById('asset-lokasi').value = asset.lokasi || '';
    document.getElementById('asset-kondisi').value = asset.kondisi || 'baik';
    document.getElementById('asset-jumlah').value = asset.jumlah || 1;
    document.getElementById('asset-satuan').value = asset.satuan || '';
    document.getElementById('asset-nilai').value = asset.nilai || '';
    document.getElementById('asset-keterangan').value = asset.keterangan || '';

    switchTab('tambah');
};

window.asset_hapus = async (id) => {
    if (!confirm('Yakin hapus aset ini?')) return;
    const { error } = await _sb.from('assets').delete().eq('id', id);
    if (error) {
        toast('Gagal hapus: ' + error.message, 'error');
    } else {
        toast('Aset dihapus', 'success');
        loadAssets();
        loadKondisi();
        loadHistory();
    }
};

// ========== SWITCH TAB ==========
function switchTab(tabId) {
    document.querySelectorAll('.asset-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.asset-tab[data-tab="${tabId}"]`).classList.add('active');

    document.getElementById('asset-tab-daftar').style.display = tabId === 'daftar' ? 'block' : 'none';
    document.getElementById('asset-tab-tambah').style.display = tabId === 'tambah' ? 'block' : 'none';
    document.getElementById('asset-tab-kondisi').style.display = tabId === 'kondisi' ? 'block' : 'none';
    document.getElementById('asset-tab-history').style.display = tabId === 'history' ? 'block' : 'none';

    if (tabId === 'kondisi') loadKondisi();
    if (tabId === 'history') loadHistory();
    if (tabId === 'daftar') loadAssets(); // refresh
}

// ========== SEARCH ==========
function setupSearch() {
    const searchInput = document.getElementById('asset-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const keyword = e.target.value.toLowerCase();
            const filtered = _currentAssets.filter(a =>
                a.nama_aset.toLowerCase().includes(keyword) ||
                (a.kategori && a.kategori.toLowerCase().includes(keyword)) ||
                (a.lokasi && a.lokasi.toLowerCase().includes(keyword))
            );
            renderAssetList(filtered);
        });
    }
}

// ========== ATTACH EVENT LISTENERS ==========
function attachEvents() {
    document.querySelectorAll('.asset-tab').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    document.getElementById('assetForm').addEventListener('submit', handleAssetSubmit);
    setupSearch();
}

// ========== EXPORTED INIT ==========
export async function init(params = {}) {
    console.log('[ASSET] init()', params);

    injectCSS();

    const container = document.getElementById('module-content');
    if (!container) { console.error('[ASSET] #module-content tidak ditemukan'); return; }

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
        document.getElementById('asset-user-badge').textContent = params.user.name?.toUpperCase() || 'USER';
    }
    if (params.lang) _currentLang = params.lang;

    await loadAssets();
    await loadKondisi();
    await loadHistory();
    attachEvents();

    console.log('[ASSET] Ready ✅');
}

// ========== EXPORTED CLEANUP ==========
export function cleanup() {
    document.getElementById('asset-styles')?.remove();
    delete window.asset_edit;
    delete window.asset_hapus;
    console.log('[ASSET] Cleanup done');
}
