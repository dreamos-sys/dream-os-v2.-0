/**
 * modules/gudang/module.js
 * Dream OS v2.0 — Modul Gudang
 * ✅ Fitur: Daftar stok gudang, transaksi masuk/keluar, reorder point
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
        /* ... (sama seperti modul lain, disesuaikan warna) ... */
    `;
    // (isi CSS disingkat karena mirip, ganti warna primary #f59e0b)
    document.head.appendChild(s);
}

export default async function initModule(config, utils, supabase, currentUser, showToast, showModal, loader, translations, currentLang) {
    injectCSS();

    const toast = showToast || function(msg, type) { /* fallback */ };
    const esc = utils?.esc || function(s) { return String(s||'').replace(/[&<>"]/g, function(m) { return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[m]; }); };
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', {day:'2-digit',month:'short',year:'numeric'}) : '—';
    const fmtRp = (n) => 'Rp ' + Number(n||0).toLocaleString('id-ID');

    let _sb = supabase || null;
    let _user = currentUser || null;
    let _items = [];

    function ensureSB() { /* ... */ }
    async function writeAuditLog(action, detail) { /* ... */ }

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
                    <div style="margin-left:auto; display:flex; gap:0.5rem;">
                        <span style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);color:#a855f7;padding:0.4rem 1rem;border-radius:30px;font-size:0.8rem;">${esc(userName)}</span>
                    </div>
                </div>
            </div>

            <div class="gudang-tabs">
                <button class="gudang-tab active" data-tab="stok">📦 Stok</button>
                <button class="gudang-tab" data-tab="transaksi">📥 Transaksi</button>
                <button class="gudang-tab" data-tab="tambah">➕ Tambah Barang</button>
            </div>

            <!-- TAB STOK -->
            <div id="gudang-tab-stok" class="tab-content">
                <div class="gudang-panel">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                        <h3 style="font-size:1.2rem; font-weight:700; color:var(--gudang-primary);">Daftar Barang Gudang</h3>
                        <input type="text" id="gudang-search" placeholder="Cari..." class="gudang-input" style="max-width:200px;">
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
                            <div><label class="gudang-label">Barang</label>
                                <select id="gudang-trans-barang" class="gudang-select" required>
                                    <option value="">Pilih Barang</option>
                                </select>
                            </div>
                            <div><label class="gudang-label">Jenis</label>
                                <select id="gudang-trans-jenis" class="gudang-select" required>
                                    <option value="masuk">Masuk</option>
                                    <option value="keluar">Keluar</option>
                                </select>
                            </div>
                        </div>
                        <div class="gudang-form-grid">
                            <div><label class="gudang-label">Jumlah</label><input type="number" id="gudang-trans-jumlah" class="gudang-input" min="1" required></div>
                            <div><label class="gudang-label">Harga Satuan (Rp)</label><input type="number" id="gudang-trans-harga" class="gudang-input" min="0"></div>
                        </div>
                        <div><label class="gudang-label">Keterangan</label><textarea id="gudang-trans-ket" rows="2" class="gudang-textarea"></textarea></div>
                        <button type="submit" class="gudang-btn gudang-btn-primary">Proses</button>
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
                            <div><label class="gudang-label">Kode Barang *</label><input type="text" id="gudang-kode" class="gudang-input" required></div>
                            <div><label class="gudang-label">Nama Barang *</label><input type="text" id="gudang-nama" class="gudang-input" required></div>
                        </div>
                        <div class="gudang-form-grid">
                            <div><label class="gudang-label">Kategori</label><input type="text" id="gudang-kategori" class="gudang-input"></div>
                            <div><label class="gudang-label">Satuan</label><input type="text" id="gudang-satuan" class="gudang-input" placeholder="pcs/kg/liter"></div>
                        </div>
                        <div class="gudang-form-grid">
                            <div><label class="gudang-label">Stok Awal</label><input type="number" id="gudang-stok" class="gudang-input" min="0" value="0"></div>
                            <div><label class="gudang-label">Minimal Stok</label><input type="number" id="gudang-min" class="gudang-input" min="0" value="0"></div>
                        </div>
                        <div class="gudang-form-grid">
                            <div><label class="gudang-label">Harga Satuan (Rp)</label><input type="number" id="gudang-harga" class="gudang-input" min="0"></div>
                            <div><label class="gudang-label">Lokasi Rak</label><input type="text" id="gudang-rak" class="gudang-input"></div>
                        </div>
                        <div><label class="gudang-label">Supplier</label><input type="text" id="gudang-supplier" class="gudang-input"></div>
                        <button type="submit" class="gudang-btn gudang-btn-primary" id="gudang-submit">Simpan</button>
                        <div id="gudang-form-result" style="margin-top:1rem;"></div>
                    </form>
                </div>
            </div>
        </div>
        `;
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
        } catch (err) {
            list.innerHTML = `<p style="color:#ef4444;">Gagal memuat: ${esc(err.message)}</p>`;
        }
    }

    function renderStokList(items) {
        const list = document.getElementById('gudang-list');
        if (!list) return;
        if (items.length === 0) { list.innerHTML = '<p style="opacity:0.7;">Belum ada barang</p>'; return; }
        let html = '<div class="gudang-table-wrap"><table class="gudang-table"><thead><tr><th>Kode</th><th>Nama</th><th>Stok</th><th>Min</th><th>Harga</th><th>Nilai</th><th>Aksi</th></tr></thead><tbody>';
        items.forEach(i => {
            const isLow = i.stok_akhir <= i.min_stok;
            html += `
                <tr class="${isLow ? 'gudang-low' : ''}">
                    <td>${esc(i.kode_barang)}</td>
                    <td>${esc(i.nama_barang)}</td>
                    <td>${i.stok_akhir} ${esc(i.satuan||'')}</td>
                    <td>${i.min_stok}</td>
                    <td>${fmtRp(i.harga_satuan_avg)}</td>
                    <td>${fmtRp(i.nilai_persediaan)}</td>
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
            satuan: document.getElementById('gudang-satuan').value || null,
            stok_awal: parseInt(document.getElementById('gudang-stok').value) || 0,
            min_stok: parseInt(document.getElementById('gudang-min').value) || 0,
            harga_satuan_avg: parseFloat(document.getElementById('gudang-harga').value) || 0,
            lokasi_rak: document.getElementById('gudang-rak').value || null,
            supplier: document.getElementById('gudang-supplier').value || null
        };
        if (!data.kode_barang || !data.nama_barang) { toast('Kode dan nama wajib diisi', 'warning'); return; }
        const btn = document.getElementById('gudang-submit');
        btn.disabled = true; btn.innerHTML = 'Menyimpan...';
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
            btn.disabled = false; btn.innerHTML = 'Simpan';
        }
    }

    // LOAD DROPDOWN UNTUK TRANSAKSI
    async function loadDropdown() {
        const sel = document.getElementById('gudang-trans-barang');
        if (!sel) return;
        try {
            const { data } = await _sb.from('gudang_persediaan').select('id, nama_barang, stok_akhir');
            sel.innerHTML = '<option value="">Pilih Barang</option>' + (data||[]).map(i => `<option value="${i.id}">${i.nama_barang} (stok: ${i.stok_akhir})</option>`).join('');
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

        // Ambil data barang
        const { data: barang, error: getErr } = await _sb.from('gudang_persediaan').select('*').eq('id', barangId).single();
        if (getErr || !barang) { toast('Barang tidak ditemukan', 'error'); return; }

        let newStok = barang.stok_akhir;
        if (jenis === 'masuk') newStok += jumlah;
        else newStok -= jumlah;
        if (newStok < 0) { toast('Stok tidak mencukupi', 'error'); return; }

        // Update harga rata-rata jika masuk (average)
        let newHarga = barang.harga_satuan_avg;
        if (jenis === 'masuk' && harga > 0) {
            newHarga = ((barang.stok_akhir * barang.harga_satuan_avg) + (jumlah * harga)) / newStok;
        }

        const { error: updateErr } = await _sb.from('gudang_persediaan').update({
            stok_akhir: newStok,
            harga_satuan_avg: newHarga
        }).eq('id', barangId);
        if (updateErr) { toast('Gagal update stok: ' + updateErr.message, 'error'); return; }

        // Catat transaksi
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
            const { data } = await _sb.from('gudang_transaksi').select('*, gudang_persediaan(nama_barang)').order('created_at', { ascending: false }).limit(20);
            if (!data || data.length === 0) { div.innerHTML = '<p style="opacity:0.7;">Belum ada transaksi</p>'; return; }
            let html = '<div class="gudang-table-wrap"><table class="gudang-table"><thead><tr><th>Waktu</th><th>Barang</th><th>Jenis</th><th>Jumlah</th><th>Harga</th><th>Keterangan</th></tr></thead><tbody>';
            data.forEach(t => {
                html += `<tr>
                    <td>${fmtDate(t.created_at)}</td>
                    <td>${esc(t.gudang_persediaan?.nama_barang || '-')}</td>
                    <td>${t.jenis}</td>
                    <td>${t.jumlah}</td>
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

    function attachEvents() {
        // Tab switching
        document.querySelectorAll('.gudang-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                document.querySelectorAll('.gudang-tab').forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('gudang-tab-stok').style.display = tab === 'stok' ? 'block' : 'none';
                document.getElementById('gudang-tab-transaksi').style.display = tab === 'transaksi' ? 'block' : 'none';
                document.getElementById('gudang-tab-tambah').style.display = tab === 'tambah' ? 'block' : 'none';
                if (tab === 'stok') loadStok();
                if (tab === 'transaksi') { loadDropdown(); loadTransHistory(); }
            });
        });
        document.getElementById('gudangForm').addEventListener('submit', handleSubmit);
        document.getElementById('gudangTransForm').addEventListener('submit', handleTransaksi);
        document.getElementById('gudang-list').addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action="edit"]');
            if (btn) editItem(btn.dataset.id);
        });
        // Search
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
        loadStok();
        console.log('[GUDANG] Ready ✅');
    }, 100);

    return function cleanup() {
        document.getElementById('gudang-styles')?.remove();
        console.log('[GUDANG] Cleanup done');
    };
}
