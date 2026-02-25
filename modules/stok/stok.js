import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';
import { store } from '../../core/store.js';

let currentStok = [];
let currentRequests = [];

export async function init() {
    console.log('📦 Modul Stok dimuat');

    // Load data awal
    await loadStok();
    await loadRequests();
    await loadKondisi();

    // Pasang event listeners
    attachEventListeners();

    // Inisialisasi tab
    activateTab('stok');
}

function attachEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            activateTab(tab);
        });
    });

    // Form stok submit
    document.getElementById('stokForm').addEventListener('submit', handleStokSubmit);

    // Search stok
    document.getElementById('search-stok').addEventListener('input', (e) => {
        const keyword = e.target.value.toLowerCase();
        const filtered = currentStok.filter(item => 
            item.nama_barang.toLowerCase().includes(keyword) ||
            (item.kategori && item.kategori.toLowerCase().includes(keyword))
        );
        renderStokList(filtered);
    });

    // Permintaan form
    document.getElementById('requestForm').addEventListener('submit', handleRequestSubmit);
    document.getElementById('add-item').addEventListener('click', addItemRow);
    document.getElementById('refresh-requests').addEventListener('click', loadRequests);

    // Delegasi untuk remove item
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-item')) {
            e.target.closest('.item-row').remove();
        }
    });

    // Inisialisasi dropdown alat di form permintaan
    loadInventoryDropdown();
}

function activateTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.classList.add('text-slate-400');
    });
    const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.classList.remove('text-slate-400');
    }

    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.add('hidden'));
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');

    if (tabId === 'stok') {
        renderStokList(currentStok);
    } else if (tabId === 'permintaan') {
        loadInventoryDropdown();
        loadRequests();
    } else if (tabId === 'riwayat') {
        loadAllRequestsHistory();
    } else if (tabId === 'kondisi') {
        loadKondisi();
    }
}

// ========== STOK ==========
async function loadStok() {
    const container = document.getElementById('stok-list');
    container.innerHTML = '<p class="text-center py-4"><span class="spinner"></span> Memuat...</p>';

    try {
        const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .order('nama_barang', { ascending: true });

        if (error) throw error;
        currentStok = data || [];
        renderStokList(currentStok);
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p class="text-center py-4 text-red-500">Gagal memuat data</p>';
    }
}

function renderStokList(items) {
    const container = document.getElementById('stok-list');
    if (items.length === 0) {
        container.innerHTML = '<p class="text-center py-4 text-slate-400">Belum ada stok</p>';
        return;
    }

    let html = '';
    items.forEach(item => {
        const isLow = item.jumlah <= item.minimal_stok;
        const lowClass = isLow ? 'low-stock' : '';
        const kondisiColor = {
            'baik': 'text-emerald-400',
            'rusak_ringan': 'text-yellow-400',
            'rusak_berat': 'text-red-400',
            'perbaikan': 'text-orange-400'
        }[item.kondisi] || 'text-slate-400';

        html += `
            <div class="bg-slate-700/50 p-3 rounded-xl flex justify-between items-center ${lowClass}">
                <div class="flex-1">
                    <div class="font-bold">${item.nama_barang}</div>
                    <div class="text-xs text-slate-400">${item.kategori || '-'} | ${item.lokasi || 'Tanpa lokasi'}</div>
                    <div class="text-xs mt-1 flex gap-2">
                        <span class="${item.jumlah <= item.minimal_stok ? 'text-red-400 font-bold' : ''}">Stok: ${item.jumlah} ${item.satuan || ''}</span>
                        <span class="${kondisiColor}">Kondisi: ${item.kondisi || 'baik'}</span>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button onclick="window.editStok('${item.id}')" class="bg-blue-600 px-3 py-1 rounded-lg text-xs">✏️</button>
                    <button onclick="window.hapusStok('${item.id}')" class="bg-red-600 px-3 py-1 rounded-lg text-xs">🗑️</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

window.editStok = async (id) => {
    const item = currentStok.find(i => i.id === id);
    if (!item) return;

    document.getElementById('stok-id').value = item.id;
    document.getElementById('nama_barang').value = item.nama_barang;
    document.getElementById('kategori').value = item.kategori || '';
    document.getElementById('jumlah').value = item.jumlah;
    document.getElementById('satuan').value = item.satuan || '';
    document.getElementById('lokasi').value = item.lokasi || '';
    document.getElementById('minimal_stok').value = item.minimal_stok || 0;
    document.getElementById('kondisi').value = item.kondisi || 'baik';
};

window.hapusStok = async (id) => {
    if (!confirm('Yakin hapus stok ini?')) return;
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (error) {
        showToast('Gagal hapus: ' + error.message, 'error');
    } else {
        showToast('Stok dihapus', 'success');
        loadStok();
    }
};

async function handleStokSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('stok-id').value;
    const data = {
        nama_barang: document.getElementById('nama_barang').value,
        kategori: document.getElementById('kategori').value,
        jumlah: parseInt(document.getElementById('jumlah').value),
        satuan: document.getElementById('satuan').value,
        lokasi: document.getElementById('lokasi').value,
        minimal_stok: parseInt(document.getElementById('minimal_stok').value) || 0,
        kondisi: document.getElementById('kondisi').value
    };

    if (!data.nama_barang || data.jumlah < 0) {
        document.getElementById('stok-result').innerHTML = '<span class="text-red-500">Data tidak valid!</span>';
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

    try {
        let error;
        if (id) {
            ({ error } = await supabase.from('inventory').update(data).eq('id', id));
        } else {
            ({ error } = await supabase.from('inventory').insert([data]));
        }
        if (error) throw error;

        document.getElementById('stok-result').innerHTML = '<span class="text-green-500">✅ Stok disimpan!</span>';
        showToast('Stok berhasil disimpan', 'success');
        e.target.reset();
        document.getElementById('stok-id').value = '';
        loadStok();
        setTimeout(() => document.getElementById('stok-result').innerHTML = '', 3000);
    } catch (err) {
        document.getElementById('stok-result').innerHTML = `<span class="text-red-500">❌ ${err.message}</span>`;
        showToast('Gagal simpan', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Simpan';
    }
}

// ========== PERMINTAAN ALAT ==========
async function loadInventoryDropdown() {
    const { data } = await supabase.from('inventory').select('id, nama_barang').eq('kondisi', 'baik').gt('jumlah', 0);
    const selects = document.querySelectorAll('.item-select');
    selects.forEach(sel => {
        sel.innerHTML = '<option value="">Pilih Alat</option>' + 
            (data || []).map(i => `<option value="${i.id}">${i.nama_barang}</option>`).join('');
    });
}

function addItemRow() {
    const container = document.getElementById('items-container');
    const newRow = document.createElement('div');
    newRow.className = 'item-row flex gap-2';
    newRow.innerHTML = `
        <select class="item-select flex-1 p-2 rounded bg-slate-700 border border-slate-600 text-sm">
            <option value="">Pilih Alat</option>
        </select>
        <input type="number" class="item-qty w-20 p-2 rounded bg-slate-700 border border-slate-600 text-sm" placeholder="Jml">
        <button type="button" class="remove-item text-red-400 hover:text-red-300">✖</button>
    `;
    container.appendChild(newRow);
    loadInventoryDropdown(); // refresh semua dropdown
}

async function handleRequestSubmit(e) {
    e.preventDefault();
    const rows = document.querySelectorAll('.item-row');
    const items = [];
    for (let row of rows) {
        const select = row.querySelector('.item-select');
        const qty = row.querySelector('.item-qty')?.value;
        if (select.value && qty) {
            const nama = select.options[select.selectedIndex]?.text;
            items.push({ id: select.value, nama, jumlah: parseInt(qty) });
        }
    }
    if (items.length === 0) {
        document.getElementById('request-result').innerHTML = '<span class="text-red-500">Pilih minimal satu alat!</span>';
        return;
    }

    const petugas = document.getElementById('req-petugas').value;
    const area = document.getElementById('req-area').value;
    const tanggal = document.getElementById('req-tanggal').value || new Date().toISOString().split('T')[0];
    const catatan = document.getElementById('req-catatan').value;

    if (!petugas) {
        document.getElementById('request-result').innerHTML = '<span class="text-red-500">Nama petugas harus diisi!</span>';
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';

    try {
        const { error } = await supabase.from('tool_requests').insert([{
            petugas,
            area,
            tanggal,
            items: JSON.stringify(items),
            catatan,
            status: 'pending',
            created_at: new Date().toISOString()
        }]);

        if (error) throw error;

        document.getElementById('request-result').innerHTML = '<span class="text-green-500">✅ Permintaan diajukan!</span>';
        showToast('Permintaan berhasil', 'success');
        e.target.reset();
        // reset items container
        document.getElementById('items-container').innerHTML = `
            <div class="item-row flex gap-2">
                <select class="item-select flex-1 p-2 rounded bg-slate-700 border border-slate-600 text-sm">
                    <option value="">Pilih Alat</option>
                </select>
                <input type="number" class="item-qty w-20 p-2 rounded bg-slate-700 border border-slate-600 text-sm" placeholder="Jml">
                <button type="button" class="remove-item text-red-400 hover:text-red-300">✖</button>
            </div>
        `;
        loadInventoryDropdown();
        loadRequests();
        setTimeout(() => document.getElementById('request-result').innerHTML = '', 3000);
    } catch (err) {
        document.getElementById('request-result').innerHTML = `<span class="text-red-500">❌ ${err.message}</span>`;
        showToast('Gagal', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i> Ajukan';
    }
}

async function loadRequests() {
    const container = document.getElementById('requests-list');
    container.innerHTML = '<p class="text-center py-4"><span class="spinner"></span> Memuat...</p>';

    try {
        const { data, error } = await supabase
            .from('tool_requests')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;
        currentRequests = data || [];
        if (data.length === 0) {
            container.innerHTML = '<p class="text-center py-4 text-slate-400">Tidak ada permintaan pending</p>';
            return;
        }

        let html = '';
        data.forEach(req => {
            const items = JSON.parse(req.items || '[]');
            const itemText = items.map(i => `${i.nama} (${i.jumlah})`).join(', ');
            html += `
                <div class="bg-slate-700/50 p-3 rounded-xl border-l-4 border-yellow-500">
                    <div class="flex justify-between text-xs">
                        <span class="font-bold">${req.petugas}</span>
                        <span class="text-yellow-400">${req.status}</span>
                    </div>
                    <div class="text-[10px] text-slate-400">${req.area} | ${req.tanggal}</div>
                    <div class="text-xs mt-1">${itemText}</div>
                    ${req.catatan ? `<div class="text-[10px] italic">📝 ${req.catatan}</div>` : ''}
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p class="text-center py-4 text-red-500">Gagal memuat</p>';
    }
}

async function loadAllRequestsHistory() {
    const tbody = document.getElementById('history-requests');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4"><span class="spinner"></span></td></tr>';

    try {
        const { data, error } = await supabase
            .from('tool_requests')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-slate-400">Belum ada riwayat</td></tr>';
            return;
        }

        let html = '';
        data.forEach(req => {
            const items = JSON.parse(req.items || '[]');
            const itemText = items.map(i => `${i.nama} (${i.jumlah})`).join(', ');
            html += `
                <tr>
                    <td class="p-2">${req.tanggal}</td>
                    <td class="p-2">${req.petugas}</td>
                    <td class="p-2">${req.area}</td>
                    <td class="p-2">${itemText}</td>
                    <td class="p-2">
                        <span class="px-2 py-0.5 rounded-full text-xs ${req.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : req.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">
                            ${req.status}
                        </span>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    } catch (err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-red-500">Gagal memuat</td></tr>';
    }
}

// ========== KONDISI ALAT ==========
async function loadKondisi() {
    try {
        const { data, error } = await supabase.from('inventory').select('kondisi');
        if (error) throw error;

        const rusakRingan = data.filter(i => i.kondisi === 'rusak_ringan').length;
        const rusakBerat = data.filter(i => i.kondisi === 'rusak_berat').length;
        const perbaikan = data.filter(i => i.kondisi === 'perbaikan').length;

        document.getElementById('kondisi-rusak-ringan').textContent = rusakRingan;
        document.getElementById('kondisi-rusak-berat').textContent = rusakBerat;
        document.getElementById('kondisi-perbaikan').textContent = perbaikan;

        const rusakList = document.getElementById('rusak-list');
        if (rusakRingan + rusakBerat + perbaikan === 0) {
            rusakList.innerHTML = '<p class="text-slate-400">Semua alat dalam kondisi baik</p>';
            return;
        }

        const { data: items } = await supabase
            .from('inventory')
            .select('nama_barang, kondisi, jumlah, satuan')
            .in('kondisi', ['rusak_ringan', 'rusak_berat', 'perbaikan'])
            .order('kondisi');

        let html = '';
        items.forEach(item => {
            const color = {
                'rusak_ringan': 'text-yellow-400',
                'rusak_berat': 'text-red-400',
                'perbaikan': 'text-orange-400'
            }[item.kondisi];
            html += `
                <div class="bg-slate-700/50 p-2 rounded">
                    <div class="flex justify-between">
                        <span class="font-bold">${item.nama_barang}</span>
                        <span class="${color}">${item.kondisi}</span>
                    </div>
                    <div class="text-xs text-slate-400">Stok: ${item.jumlah} ${item.satuan || ''}</div>
                </div>
            `;
        });
        rusakList.innerHTML = html;
    } catch (err) {
        console.error(err);
    }
}
