/**
 * modules/gudang/module.js
 * Dream OS v2.0 — Modul Gudang (FIXED)
 * ✅ Fitur: Daftar stok, transaksi masuk/keluar, reorder point, analytics
 */

'use strict';

const SB_URL_FALLBACK = 'https://pvznaeppaagylwddirla.supabase.co';
const SB_KEY_FALLBACK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2em5hZXBwYWFneWx3ZGRpcmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTEwNDMsImV4cCI6MjA4NzUyNzA0M30.t9SJi3VfsBDkKmeZ3egZ4rbvljl4xe0WwNkPtfA9-vo';

function injectCSS() {
    if (document.getElementById('gudang-styles')) return;
    const s = document.createElement('style');
    s.id = 'gudang-styles';
    s.textContent = `
        :root {
            --gudang-primary: #f59e0b;
            --gudang-primary-light: rgba(245,158,11,0.1);
            --gudang-primary-border: rgba(245,158,11,0.25);
            --gudang-bg-panel: rgba(15,23,42,0.88);
            --gudang-text: #e2e8f0;
            --gudang-text-muted: #94a3b8;
            --gudang-text-dim: #64748b;
            --gudang-border: rgba(255,255,255,0.08);
            --gudang-radius: 16px;
            --gudang-radius-sm: 12px;
            --gudang-radius-xs: 8px;
            --gudang-transition: 0.2s ease;
            --gudang-font-mono: 'JetBrains Mono', monospace;
            --gudang-font-sans: 'Rajdhani', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        @media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
        #gudang-root * { box-sizing: border-box; }
        #gudang-root { max-width: 1200px; margin: 0 auto; padding: 1rem; font-family: var(--gudang-font-sans); color: var(--gudang-text); }
        .gudang-panel { background: var(--gudang-bg-panel); backdrop-filter: blur(18px); border: 1px solid var(--gudang-primary-border); border-radius: var(--gudang-radius); padding: 1.5rem; margin-bottom: 1.5rem; transition: background var(--gudang-transition), border-color var(--gudang-transition); }
        .gudang-panel:hover { background: rgba(15,23,42,0.92); border-color: var(--gudang-primary); }
        .gudang-header { background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05)); border-left: 4px solid var(--gudang-primary); }
        .gudang-title { font-size: 1.8rem; font-weight: 800; background: linear-gradient(135deg, var(--gudang-primary), #d97706); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 0.25rem; }
        .gudang-sub { font-size: 0.75rem; color: var(--gudang-text-muted); }
        .gudang-tabs { display: flex; gap: 0.5rem; border-bottom: 2px solid var(--gudang-primary-border); margin-bottom: 1.5rem; overflow-x: auto; }
        .gudang-tab { padding: 0.65rem 1.5rem; background: rgba(255,255,255,0.04); border: 1px solid transparent; border-radius: 8px 8px 0 0; cursor: pointer; font-weight: 600; font-size: 0.9rem; color: var(--gudang-text-dim); white-space: nowrap; transition: background var(--gudang-transition), color var(--gudang-transition); }
        .gudang-tab:hover { background: var(--gudang-primary-light); color: var(--gudang-text); }
        .gudang-tab.active { background: var(--gudang-primary); color: #020617; border-color: var(--gudang-primary); }
        .gudang-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
        .gudang-label { display: block; font-size: 0.75rem; color: var(--gudang-text-muted); margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.5px; }
        .gudang-input, .gudang-select, .gudang-textarea { width: 100%; padding: 0.75rem 1rem; background: rgba(0,0,0,0.3); border: 1.5px solid var(--gudang-primary-border); border-radius: var(--gudang-radius-xs); color: var(--gudang-text); font-family: inherit; font-size: 0.9rem; outline: none; transition: border-color var(--gudang-transition), box-shadow var(--gudang-transition); }
        .gudang-input:focus, .gudang-select:focus, .gudang-textarea:focus { border-color: var(--gudang-primary); box-shadow: 0 0 0 3px var(--gudang-primary-light); }
        .gudang-select option { background: #1e293b; color: var(--gudang-text); }
        .gudang-textarea { resize: vertical; min-height: 80px; }        .gudang-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.6rem 1.2rem; border-radius: var(--gudang-radius-xs); font-weight: 700; cursor: pointer; transition: transform var(--gudang-transition), background var(--gudang-transition), border-color var(--gudang-transition); border: none; background: rgba(255,255,255,0.08); color: var(--gudang-text); }
        .gudang-btn:hover:not(:disabled) { transform: translateY(-1px); background: rgba(255,255,255,0.15); }
        .gudang-btn-primary { background: linear-gradient(135deg, var(--gudang-primary), #d97706); color: #020617; }
        .gudang-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 18px rgba(245,158,11,0.15); }
        .gudang-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .gudang-btn-sm { padding: 0.3rem 1rem; font-size: 0.75rem; border-radius: 20px; }
        .gudang-table-wrap { overflow-x: auto; border-radius: var(--gudang-radius); border: 1px solid var(--gudang-border); }
        table.gudang-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        table.gudang-table thead { background: rgba(0,0,0,0.3); }
        table.gudang-table th { padding: 0.75rem 1rem; text-align: left; font-size: 0.7rem; text-transform: uppercase; color: var(--gudang-text-muted); }
        table.gudang-table td { padding: 0.75rem 1rem; border-top: 1px solid var(--gudang-border); }
        table.gudang-table tr:hover td { background: rgba(255,255,255,0.02); }
        table.gudang-table tr.gudang-low { border-left: 4px solid #ef4444; background: rgba(239,68,68,0.05); }
        .gudang-badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
        .gudang-badge-low { background: rgba(239,68,68,0.2); color: #ef4444; }
        .gudang-badge-ok { background: rgba(16,185,129,0.2); color: #10b981; }
        .gudang-loader { display: flex; flex-direction: column; align-items: center; padding: 3rem; }
        .gudang-spinner { width: 40px; height: 40px; border: 3px solid var(--gudang-primary-light); border-top-color: var(--gudang-primary); border-radius: 50%; animation: gudang-spin 1s linear infinite; }
        @keyframes gudang-spin { to { transform: rotate(360deg); } }
        @media print { #gudang-root { background: white; color: #1e293b; padding: 0.5in; } .gudang-panel { background: white; backdrop-filter: none; border: 1px solid #ccc; box-shadow: none; } .gudang-tabs, .gudang-btn, .gudang-header::before { display: none; } }
        .tier-low .gudang-panel { backdrop-filter: none; background: rgba(15,23,42,0.95); }
        .tier-low .gudang-spinner { animation: none; }
    `;
    document.head.appendChild(s);
}

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
            el.style.cssText = `position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(245,158,11,.9);color:white;padding:9px 18px;border-radius:10px;z-index:99999;font-weight:700;font-size:.85rem;`;
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 2800);
        }
    };

    const esc = utils?.esc || function(s) {
        return String(s||'').replace(/[&<>"]/g, function(m) { return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[m]; });
    };

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', {day:'2-digit',month:'short',year:'numeric'}) : '—';    const fmtRp = (n) => 'Rp ' + Number(n||0).toLocaleString('id-ID');

    let _sb = supabase || null;
    let _user = currentUser || null;
    let _items = [];

    // ✅ FIXED: ensureSB implementation
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

    // ✅ FIXED: writeAuditLog implementation
    async function writeAuditLog(action, detail) {
        if (!_sb) return;
        try {
            await _sb.from('audit_logs').insert([{
                action,
                detail,
                user: _user?.name || 'System',
                created_at: new Date().toISOString()
            }]);
        } catch (e) { console.warn('[GUDANG] audit_log error:', e.message); }
    }

    function renderRoot(container) {
        const userName = _user?.name?.toUpperCase() || 'GUEST';
        container.innerHTML = `
        <div id="gudang-root">
            <div class="gudang-panel gudang-header">
                <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
                    <div style="font-size:3rem;">🏭</div>
                    <div>
                        <div class="gudang-title">GUDANG</div>
                        <div class="gudang-sub">Manajemen Persediaan & HPP</div>
                    </div>
                    <div style="margin-left:auto; display:flex; gap:0.5rem;">                        <span style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);color:#a855f7;padding:0.4rem 1rem;border-radius:30px;font-size:0.8rem;">${esc(userName)}</span>
                    </div>
                </div>
            </div>

            <!-- STATS OVERVIEW -->
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.75rem; margin-bottom:1.5rem;">
                <div class="gudang-panel" style="padding:1rem; background:rgba(245,158,11,0.1); border-left:4px solid var(--gudang-primary);">
                    <div style="font-size:0.75rem; opacity:0.8;">Total Barang</div>
                    <div style="font-size:1.8rem; font-weight:700; color:var(--gudang-primary);" id="gudang-stat-total">0</div>
                </div>
                <div class="gudang-panel" style="padding:1rem; background:rgba(239,68,68,0.1); border-left:4px solid #ef4444;">
                    <div style="font-size:0.75rem; opacity:0.8;">Stok Rendah</div>
                    <div style="font-size:1.8rem; font-weight:700; color:#ef4444;" id="gudang-stat-low">0</div>
                </div>
                <div class="gudang-panel" style="padding:1rem; background:rgba(16,185,129,0.1); border-left:4px solid #10b981;">
                    <div style="font-size:0.75rem; opacity:0.8;">Total Nilai</div>
                    <div style="font-size:1.2rem; font-weight:700; color:#10b981;" id="gudang-stat-nilai">Rp 0</div>
                </div>
            </div>

            <div class="gudang-tabs">
                <button class="gudang-tab active" data-tab="stok">📦 Stok</button>
                <button class="gudang-tab" data-tab="transaksi">📥 Transaksi</button>
                <button class="gudang-tab" data-tab="tambah">➕ Tambah Barang</button>
                <button class="gudang-tab" data-tab="analytics">📊 Analytics</button>
            </div>

            <!-- TAB STOK -->
            <div id="gudang-tab-stok" class="tab-content">
                <div class="gudang-panel">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
                        <h3 style="font-size:1.2rem; font-weight:700; color:var(--gudang-primary);">Daftar Barang Gudang</h3>
                        <input type="text" id="gudang-search" placeholder="Cari nama/kode..." class="gudang-input" style="max-width:250px;">
                    </div>
                    <div id="gudang-list"></div>
                </div>
            </div>

            <!-- TAB TRANSAKSI -->
            <div id="gudang-tab-transaksi" class="tab-content" style="display:none;">
                <div class="gudang-panel">
                    <h3 style="font-size:1.2rem; font-weight:700; margin-bottom:1rem; color:var(--gudang-primary);">Transaksi Stok</h3>
                    <form id="gudangTransForm">
                        <div class="gudang-form-grid">
                            <div><label class="gudang-label">Barang *</label>
                                <select id="gudang-trans-barang" class="gudang-select" required>
                                    <option value="">Pilih Barang</option>
                                </select>
                            </div>                            <div><label class="gudang-label">Jenis *</label>
                                <select id="gudang-trans-jenis" class="gudang-select" required>
                                    <option value="masuk">Masuk</option>
                                    <option value="keluar">Keluar</option>
                                </select>
                            </div>
                        </div>
                        <div class="gudang-form-grid">
                            <div><label class="gudang-label">Jumlah *</label><input type="number" id="gudang-trans-jumlah" class="gudang-input" min="1" required></div>
                            <div><label class="gudang-label">Harga Satuan (Rp)</label><input type="number" id="gudang-trans-harga" class="gudang-input" min="0" placeholder="Opsional untuk keluar"></div>
                        </div>
                        <div><label class="gudang-label">Keterangan</label><textarea id="gudang-trans-ket" rows="2" class="gudang-textarea" placeholder="Catatan transaksi..."></textarea></div>
                        <button type="submit" class="gudang-btn gudang-btn-primary">Proses Transaksi</button>
                        <div id="gudang-trans-result" style="margin-top:1rem;"></div>
                    </form>
                    <hr style="margin:1.5rem 0;border-color:var(--gudang-border);">
                    <h4 style="font-size:1rem; font-weight:700; margin-bottom:0.5rem;">Riwayat Transaksi</h4>
                    <div id="gudang-trans-history"></div>
                </div>
            </div>

            <!-- TAB TAMBAH BARANG -->
            <div id="gudang-tab-tambah" class="tab-content" style="display:none;">
                <div class="gudang-panel">
                    <h3 style="font-size:1.2rem; font-weight:700; margin-bottom:1rem; color:var(--gudang-primary);">Tambah/Edit Barang</h3>
                    <form id="gudangForm">
                        <input type="hidden" id="gudang-id">
                        <div class="gudang-form-grid">
                            <div><label class="gudang-label">Kode Barang *</label><input type="text" id="gudang-kode" class="gudang-input" required placeholder="Contoh: ATK-001"></div>
                            <div><label class="gudang-label">Nama Barang *</label><input type="text" id="gudang-nama" class="gudang-input" required></div>
                        </div>
                        <div class="gudang-form-grid">
                            <div><label class="gudang-label">Kategori</label><input type="text" id="gudang-kategori" class="gudang-input" placeholder="ATK/Kebersihan/Sparepart"></div>
                            <div><label class="gudang-label">Satuan</label><input type="text" id="gudang-satuan" class="gudang-input" placeholder="pcs/kg/liter"></div>
                        </div>
                        <div class="gudang-form-grid">
                            <div><label class="gudang-label">Stok Awal</label><input type="number" id="gudang-stok" class="gudang-input" min="0" value="0"></div>
                            <div><label class="gudang-label">Minimal Stok</label><input type="number" id="gudang-min" class="gudang-input" min="0" value="5"></div>
                        </div>
                        <div class="gudang-form-grid">
                            <div><label class="gudang-label">Harga Satuan (Rp)</label><input type="number" id="gudang-harga" class="gudang-input" min="0"></div>
                            <div><label class="gudang-label">Lokasi Rak</label><input type="text" id="gudang-rak" class="gudang-input" placeholder="Rak A-01"></div>
                        </div>
                        <div><label class="gudang-label">Supplier</label><input type="text" id="gudang-supplier" class="gudang-input" placeholder="Nama supplier"></div>
                        <button type="submit" class="gudang-btn gudang-btn-primary" id="gudang-submit">Simpan Barang</button>
                        <div id="gudang-form-result" style="margin-top:1rem;"></div>
                    </form>
                </div>
            </div>
            <!-- TAB ANALYTICS -->
            <div id="gudang-tab-analytics" class="tab-content" style="display:none;">
                <div class="gudang-panel">
                    <h3 style="font-size:1.2rem; font-weight:700; margin-bottom:1rem; color:var(--gudang-primary);">📊 Analytics Gudang</h3>
                    <div id="gudang-analytics-content"></div>
                </div>
            </div>
        </div>
        `;
    }

    // LOAD STATS
    async function loadStats() {
        try {
            const { data, error } = await _sb.from('gudang_persediaan').select('stok_akhir, min_stok, nilai_persediaan');
            if (error) throw error;
            
            const total = data?.length || 0;
            const low = data?.filter(i => i.stok_akhir <= i.min_stok).length || 0;
            const nilai = data?.reduce((sum, i) => sum + (i.nilai_persediaan || 0), 0) || 0;
            
            const totalEl = document.getElementById('gudang-stat-total');
            const lowEl = document.getElementById('gudang-stat-low');
            const nilaiEl = document.getElementById('gudang-stat-nilai');
            
            if (totalEl) totalEl.textContent = total;
            if (lowEl) lowEl.textContent = low;
            if (nilaiEl) nilaiEl.textContent = fmtRp(nilai);
        } catch (err) {
            console.warn('[GUDANG] Stats error:', err);
        }
    }

    // LOAD STOK
    async function loadStok() {
        const list = document.getElementById('gudang-list');
        if (!list) return;
        list.innerHTML = '<div class="gudang-loader"><div class="gudang-spinner"></div><p>Memuat...</p></div>';
        try {
            const { data, error } = await _sb.from('gudang_persediaan').select('*').order('nama_barang');
            if (error) throw error;
            _items = data || [];
            renderStokList(_items);
            loadStats();
        } catch (err) {
            list.innerHTML = `<p style="color:#ef4444;">Gagal memuat: ${esc(err.message)}</p>`;
        }
    }

    function renderStokList(items) {        const list = document.getElementById('gudang-list');
        if (!list) return;
        if (items.length === 0) { list.innerHTML = '<p style="opacity:0.7; text-align:center; padding:2rem;">Belum ada barang</p>'; return; }
        
        let html = '<div class="gudang-table-wrap"><table class="gudang-table"><thead><tr><th>Kode</th><th>Nama</th><th>Stok</th><th>Min</th><th>Harga</th><th>Nilai</th><th>Lokasi</th><th>Aksi</th></tr></thead><tbody>';
        items.forEach(i => {
            const isLow = i.stok_akhir <= i.min_stok;
            html += `
                <tr class="${isLow ? 'gudang-low' : ''}">
                    <td><strong>${esc(i.kode_barang)}</strong></td>
                    <td>${esc(i.nama_barang)}<br><span style="font-size:0.75rem; opacity:0.7;">${esc(i.kategori||'')}</span></td>
                    <td><span class="${isLow ? 'gudang-badge gudang-badge-low' : 'gudang-badge gudang-badge-ok'}">${i.stok_akhir} ${esc(i.satuan||'')}</span></td>
                    <td>${i.min_stok}</td>
                    <td>${fmtRp(i.harga_satuan_avg)}</td>
                    <td>${fmtRp(i.nilai_persediaan)}</td>
                    <td>${esc(i.lokasi_rak||'—')}</td>
                    <td><button class="gudang-btn gudang-btn-sm" data-id="${i.id}" data-action="edit"><i class="fas fa-edit"></i></button></td>
                </tr>
            `;
        });
        html += '</tbody></table></div>';
        list.innerHTML = html;
    }

    // EDIT
    function editItem(id) {
        const i = _items.find(x => x.id === id);
        if (!i) return;
        document.getElementById('gudang-id').value = i.id;
        document.getElementById('gudang-kode').value = i.kode_barang;
        document.getElementById('gudang-nama').value = i.nama_barang;
        document.getElementById('gudang-kategori').value = i.kategori || '';
        document.getElementById('gudang-satuan').value = i.satuan || '';
        document.getElementById('gudang-stok').value = i.stok_akhir;
        document.getElementById('gudang-min').value = i.min_stok;
        document.getElementById('gudang-harga').value = i.harga_satuan_avg;
        document.getElementById('gudang-rak').value = i.lokasi_rak || '';
        document.getElementById('gudang-supplier').value = i.supplier || '';
        document.querySelector('.gudang-tab[data-tab="tambah"]').click();
    }

    // SUBMIT BARANG
    async function handleSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('gudang-id').value;
        const data = {
            kode_barang: document.getElementById('gudang-kode').value,
            nama_barang: document.getElementById('gudang-nama').value,
            kategori: document.getElementById('gudang-kategori').value || null,
            satuan: document.getElementById('gudang-satuan').value || null,            stok_awal: parseInt(document.getElementById('gudang-stok').value) || 0,
            min_stok: parseInt(document.getElementById('gudang-min').value) || 0,
            harga_satuan_avg: parseFloat(document.getElementById('gudang-harga').value) || 0,
            lokasi_rak: document.getElementById('gudang-rak').value || null,
            supplier: document.getElementById('gudang-supplier').value || null
        };
        if (!data.kode_barang || !data.nama_barang) { toast('Kode dan nama wajib diisi', 'warning'); return; }
        
        const btn = document.getElementById('gudang-submit');
        btn.disabled = true; btn.innerHTML = '<i class="fas fa-circle-notch" style="animation:gudang-spin 1s linear infinite"></i> Menyimpan...';
        try {
            let error;
            if (id) ({ error } = await _sb.from('gudang_persediaan').update(data).eq('id', id));
            else ({ error } = await _sb.from('gudang_persediaan').insert([data]));
            if (error) throw error;
            await writeAuditLog('Gudang ' + (id?'Update':'Tambah'), data.kode_barang);
            toast('Berhasil', 'success');
            document.getElementById('gudangForm').reset();
            document.getElementById('gudang-id').value = '';
            loadStok();
            document.querySelector('.gudang-tab[data-tab="stok"]').click();
        } catch (err) {
            toast('Gagal: '+err.message, 'error');
        } finally {
            btn.disabled = false; btn.innerHTML = 'Simpan Barang';
        }
    }

    // LOAD DROPDOWN UNTUK TRANSAKSI
    async function loadDropdown() {
        const sel = document.getElementById('gudang-trans-barang');
        if (!sel) return;
        try {
            const { data } = await _sb.from('gudang_persediaan').select('id, nama_barang, stok_akhir, satuan');
            sel.innerHTML = '<option value="">Pilih Barang</option>' + (data||[]).map(i => `<option value="${i.id}">${i.nama_barang} (stok: ${i.stok_akhir} ${i.satuan||''})</option>`).join('');
        } catch (err) {
            console.error('Dropdown error:', err);
        }
    }

    // PROSES TRANSAKSI
    async function handleTransaksi(e) {
        e.preventDefault();
        const barangId = document.getElementById('gudang-trans-barang').value;
        const jenis = document.getElementById('gudang-trans-jenis').value;
        const jumlah = parseInt(document.getElementById('gudang-trans-jumlah').value);
        const harga = parseFloat(document.getElementById('gudang-trans-harga').value) || 0;
        const ket = document.getElementById('gudang-trans-ket').value;
        if (!barangId || !jumlah) { toast('Pilih barang dan isi jumlah', 'warning'); return; }
        const { data: barang, error: getErr } = await _sb.from('gudang_persediaan').select('*').eq('id', barangId).single();
        if (getErr || !barang) { toast('Barang tidak ditemukan', 'error'); return; }

        let newStok = barang.stok_akhir;
        if (jenis === 'masuk') newStok += jumlah;
        else newStok -= jumlah;
        if (newStok < 0) { toast('Stok tidak mencukupi', 'error'); return; }

        let newHarga = barang.harga_satuan_avg;
        if (jenis === 'masuk' && harga > 0) {
            newHarga = ((barang.stok_akhir * barang.harga_satuan_avg) + (jumlah * harga)) / newStok;
        }

        const { error: updateErr } = await _sb.from('gudang_persediaan').update({
            stok_akhir: newStok,
            harga_satuan_avg: newHarga
        }).eq('id', barangId);
        if (updateErr) { toast('Gagal update stok: ' + updateErr.message, 'error'); return; }

        await _sb.from('gudang_transaksi').insert([{
            barang_id: barangId,
            jenis,
            jumlah,
            harga_satuan: harga,
            keterangan: ket,
            user: _user?.name,
            created_at: new Date().toISOString()
        }]);

        await writeAuditLog('Transaksi Gudang', `${jenis} ${jumlah} ${barang.nama_barang}`);
        toast('Transaksi berhasil', 'success');
        document.getElementById('gudangTransForm').reset();
        loadStok();
        loadDropdown();
        loadTransHistory();
    }

    // RIWAYAT TRANSAKSI
    async function loadTransHistory() {
        const div = document.getElementById('gudang-trans-history');
        if (!div) return;
        try {
            const { data } = await _sb.from('gudang_transaksi').select('*, gudang_persediaan(nama_barang, satuan)').order('created_at', { ascending: false }).limit(20);
            if (!data || data.length === 0) { div.innerHTML = '<p style="opacity:0.7; text-align:center;">Belum ada transaksi</p>'; return; }
            let html = '<div class="gudang-table-wrap"><table class="gudang-table"><thead><tr><th>Waktu</th><th>Barang</th><th>Jenis</th><th>Jumlah</th><th>Harga</th><th>Keterangan</th></tr></thead><tbody>';
            data.forEach(t => {
                html += `<tr>
                    <td>${fmtDate(t.created_at)}</td>
                    <td>${esc(t.gudang_persediaan?.nama_barang || '-')}<br><span style="font-size:0.75rem; opacity:0.7;">${t.gudang_persediaan?.satuan||''}</span></td>
                    <td><span class="gudang-badge gudang-badge-${t.jenis==='masuk'?'ok':'low'}">${t.jenis}</span></td>                    <td>${t.jumlah}</td>
                    <td>${fmtRp(t.harga_satuan)}</td>
                    <td>${esc(t.keterangan||'')}</td>
                </tr>`;
            });
            html += '</tbody></table></div>';
            div.innerHTML = html;
        } catch (err) {
            div.innerHTML = `<p style="color:#ef4444;">Gagal memuat riwayat</p>`;
        }
    }

    // ANALYTICS
    async function loadAnalytics() {
        const content = document.getElementById('gudang-analytics-content');
        if (!content) return;
        content.innerHTML = '<div class="gudang-loader"><div class="gudang-spinner"></div></div>';
        
        try {
            // Top 5 barang dengan stok terendah
            const { data: lowStock } = await _sb.from('gudang_persediaan')
                .select('nama_barang, kategori, stok_akhir, min_stok, lokasi_rak')
                .lte('stok_akhir', 'min_stok')
                .order('stok_akhir', { ascending: true })
                .limit(5);
            
            // Kategori distribution
            const { data: byCategory } = await _sb.from('gudang_persediaan')
                .select('kategori')
                .not('kategori', 'is', null);
            
            const categoryCount = {};
            byCategory?.forEach(i => {
                categoryCount[i.kategori] = (categoryCount[i.kategori] || 0) + 1;
            });
            
            let html = `
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:1rem;">
                    <div class="gudang-panel">
                        <h4 style="margin-bottom:0.5rem;">⚠️ Stok Rendah</h4>
                        ${lowStock?.map(i => `
                            <div style="padding:0.5rem 0; border-bottom:1px solid var(--gudang-border);">
                                <strong>${esc(i.nama_barang)}</strong><br>
                                <span style="font-size:0.8rem; opacity:0.7;">${esc(i.kategori)} | ${esc(i.lokasi_rak)}</span><br>
                                <span style="color:#ef4444; font-weight:600;">Stok: ${i.stok_akhir} / Min: ${i.min_stok}</span>
                            </div>
                        `).join('') || '<p style="opacity:0.7;">Semua stok aman</p>'}
                    </div>
                    <div class="gudang-panel">
                        <h4 style="margin-bottom:0.5rem;">📦 Distribusi Kategori</h4>                        ${Object.entries(categoryCount).map(([cat, count]) => `
                            <div style="display:flex; justify-content:space-between; padding:0.25rem 0;">
                                <span>${esc(cat)}</span>
                                <span style="font-weight:600;">${count}</span>
                            </div>
                        `).join('') || '<p style="opacity:0.7;">Tidak ada data</p>'}
                    </div>
                </div>
            `;
            content.innerHTML = html;
        } catch (err) {
            content.innerHTML = `<p style="color:#ef4444;">Gagal memuat analytics</p>`;
        }
    }

    function attachEvents() {
        document.querySelectorAll('.gudang-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                document.querySelectorAll('.gudang-tab').forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('gudang-tab-stok').style.display = tab === 'stok' ? 'block' : 'none';
                document.getElementById('gudang-tab-transaksi').style.display = tab === 'transaksi' ? 'block' : 'none';
                document.getElementById('gudang-tab-tambah').style.display = tab === 'tambah' ? 'block' : 'none';
                document.getElementById('gudang-tab-analytics').style.display = tab === 'analytics' ? 'block' : 'none';
                if (tab === 'stok') loadStok();
                if (tab === 'transaksi') { loadDropdown(); loadTransHistory(); }
                if (tab === 'analytics') loadAnalytics();
            });
        });
        document.getElementById('gudangForm').addEventListener('submit', handleSubmit);
        document.getElementById('gudangTransForm').addEventListener('submit', handleTransaksi);
        document.getElementById('gudang-list').addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action="edit"]');
            if (btn) editItem(btn.dataset.id);
        });
        document.getElementById('gudang-search')?.addEventListener('input', (e) => {
            const kw = e.target.value.toLowerCase();
            const filtered = _items.filter(i => i.nama_barang.toLowerCase().includes(kw) || (i.kode_barang && i.kode_barang.toLowerCase().includes(kw)));
            renderStokList(filtered);
        });
    }

    setTimeout(async () => {
        const container = document.getElementById('module-content');
        if (!container) return;
        await ensureSB();
        renderRoot(container);
        attachEvents();
        loadStok();        console.log('[GUDANG] Ready ✅');
    }, 100);

    return function cleanup() {
        document.getElementById('gudang-styles')?.remove();
        console.log('[GUDANG] Cleanup done');
    };
}
