// modules/stok/module.js
import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';
import { store } from '../../core/store.js';

let currentStok = [];
let currentRequests = [];

// ========== RENDER HTML ==========
function renderHTML() {
    const container = document.getElementById('module-content');
    if (!container) return;
    container.innerHTML = `
        <div class="max-w-6xl mx-auto p-4">
            <!-- Header -->
            <div class="bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-2xl mb-6 border border-cyan-500/30">
                <h2 class="text-2xl font-bold text-cyan-400">📦 MANAJEMEN STOK</h2>
                <p class="text-xs text-slate-400">Inventory & Tool Request System</p>
            </div>

            <!-- Tabs -->
            <div class="flex space-x-2 mb-6 overflow-x-auto border-b border-slate-700">
                <button class="tab-btn active" data-tab="stok">📋 Stok Barang</button>
                <button class="tab-btn" data-tab="permintaan">📝 Permintaan Alat</button>
                <button class="tab-btn" data-tab="riwayat">📜 Riwayat</button>
                <button class="tab-btn" data-tab="kondisi">🔧 Kondisi Alat</button>
            </div>

            <!-- Panel Stok -->
            <div id="tab-stok" class="tab-panel">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">Daftar Stok</h3>
                    <div class="flex gap-2">
                        <input type="text" id="search-stok" placeholder="Cari barang..." class="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-sm">
                    </div>
                </div>
                <div id="stok-list" class="space-y-2"></div>

                <div class="mt-6 bg-slate-800/50 p-4 rounded-xl">
                    <h3 class="text-md font-bold mb-3">Tambah / Edit Stok</h3>
                    <form id="stokForm" class="space-y-3">
                        <input type="hidden" id="stok-id">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label class="text-xs">Nama Barang</label>
                                <input type="text" id="nama_barang" required class="w-full p-2 rounded bg-slate-700 border border-slate-600">
                            </div>
                            <div>
                                <label class="text-xs">Kategori</label>
                                <input type="text" id="kategori" class="w-full p-2 rounded bg-slate-700 border border-slate-600">
                            </div>
                        </div>
                        <div class="grid grid-cols-3 gap-3">
                            <div>
                                <label class="text-xs">Jumlah</label>
                                <input type="number" id="jumlah" min="0" required class="w-full p-2 rounded bg-slate-700 border border-slate-600">
                            </div>
                            <div>
                                <label class="text-xs">Satuan</label>
                                <input type="text" id="satuan" placeholder="pcs/unit" class="w-full p-2 rounded bg-slate-700 border border-slate-600">
                            </div>
                            <div>
                                <label class="text-xs">Minimal Stok</label>
                                <input type="number" id="minimal_stok" min="0" class="w-full p-2 rounded bg-slate-700 border border-slate-600">
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="text-xs">Lokasi</label>
                                <input type="text" id="lokasi" placeholder="Rak / Gudang" class="w-full p-2 rounded bg-slate-700 border border-slate-600">
                            </div>
                            <div>
                                <label class="text-xs">Kondisi</label>
                                <select id="kondisi" class="w-full p-2 rounded bg-slate-700 border border-slate-600">
                                    <option value="baik">Baik</option>
                                    <option value="rusak_ringan">Rusak Ringan</option>
                                    <option value="rusak_berat">Rusak Berat</option>
                                    <option value="perbaikan">Perbaikan</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" class="w-full bg-cyan-600 hover:bg-cyan-500 p-2 rounded-lg font-bold">Simpan</button>
                        <div id="stok-result" class="text-center text-sm"></div>
                    </form>
                </div>
            </div>

            <!-- Panel Permintaan -->
            <div id="tab-permintaan" class="tab-panel hidden">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Form Permintaan -->
                    <div class="bg-slate-800/50 p-4 rounded-xl">
                        <h3 class="text-lg font-bold mb-3">Form Permintaan Alat</h3>
                        <form id="requestForm" class="space-y-3">
                            <div>
                                <label class="text-xs">Nama Petugas</label>
                                <input type="text" id="req-petugas" required class="w-full p-2 rounded bg-slate-700 border border-slate-600">
                            </div>
                            <div>
                                <label class="text-xs">Area / Lokasi</label>
                                <input type="text" id="req-area" required class="w-full p-2 rounded bg-slate-700 border border-slate-600">
                            </div>
                            <div>
                                <label class="text-xs">Tanggal (opsional)</label>
                                <input type="date" id="req-tanggal" class="w-full p-2 rounded bg-slate-700 border border-slate-600">
                            </div>
                            <div>
                                <label class="text-xs">Catatan (opsional)</label>
                                <textarea id="req-catatan" rows="2" class="w-full p-2 rounded bg-slate-700 border border-slate-600"></textarea>
                            </div>
                            <div>
                                <label class="text-xs">Alat yang diminta</label>
                                <div id="items-container" class="space-y-2">
                                    <div class="item-row flex gap-2">
                                        <select class="item-select flex-1 p-2 rounded bg-slate-700 border border-slate-600 text-sm">
                                            <option value="">Pilih Alat</option>
                                        </select>
                                        <input type="number" class="item-qty w-20 p-2 rounded bg-slate-700 border border-slate-600 text-sm" placeholder="Jml">
                                        <button type="button" class="remove-item text-red-400 hover:text-red-300">✖</button>
                                    </div>
                                </div>
                                <button type="button" id="add-item" class="mt-2 text-xs text-cyan-400 hover:text-cyan-300">+ Tambah Alat</button>
                            </div>
                            <button type="submit" class="w-full bg-orange-600 hover:bg-orange-500 p-2 rounded-lg font-bold">
                                <i class="fas fa-paper-plane mr-2"></i> Ajukan
                            </button>
                            <div id="request-result" class="text-center text-sm"></div>
                        </form>
                    </div>

                    <!-- Daftar Permintaan Pending -->
                    <div>
                        <div class="flex justify-between items-center mb-3">
                            <h3 class="text-lg font-bold">Permintaan Pending</h3>
                            <button id="refresh-requests" class="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-xs">↻ Refresh</button>
                        </div>
                        <div id="requests-list" class="space-y-2"></div>
                    </div>
                </div>
            </div>

            <!-- Panel Riwayat -->
            <div id="tab-riwayat" class="tab-panel hidden">
                <h3 class="text-lg font-bold mb-3">Riwayat Permintaan</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full text-sm">
                        <thead class="bg-slate-800">
                            <tr>
                                <th class="p-2">Tanggal</th>
                                <th class="p-2">Petugas</th>
                                <th class="p-2">Area</th>
                                <th class="p-2">Alat</th>
                                <th class="p-2">Status</th>
                            </tr>
                        </thead>
                        <tbody id="history-requests"></tbody>
                    </table>
                </div>
            </div>

            <!-- Panel Kondisi -->
            <div id="tab-kondisi" class="tab-panel hidden">
                <div class="grid grid-cols-3 gap-4 mb-4">
                    <div class="bg-yellow-600/20 p-3 rounded-xl border border-yellow-600/30">
                        <p class="text-xs text-slate-400">Rusak Ringan</p>
                        <p class="text-2xl font-bold text-yellow-400" id="kondisi-rusak-ringan">0</p>
                    </div>
                    <div class="bg-red-600/20 p-3 rounded-xl border border-red-600/30">
                        <p class="text-xs text-slate-400">Rusak Berat</p>
                        <p class="text-2xl font-bold text-red-400" id="kondisi-rusak-berat">0</p>
                    </div>
                    <div class="bg-orange-600/20 p-3 rounded-xl border border-orange-600/30">
                        <p class="text-xs text-slate-400">Perbaikan</p>
                        <p class="text-2xl font-bold text-orange-400" id="kondisi-perbaikan">0</p>
                    </div>
                </div>
                <h3 class="text-lg font-bold mb-3">Alat Bermasalah</h3>
                <div id="rusak-list" class="space-y-2"></div>
            </div>
        </div>
    `;
}

// ========== ELEMEN DOM (akan diisi setelah render) ==========
let elements = {};

// ========== FUNGSI UTAMA ==========
export async function init() {
    console.log('📦 Modul Stok dimuat');
    renderHTML();

    // Ambil elemen setelah render
    elements = {
        tabs: document.querySelectorAll('.tab-btn'),
        panels: document.querySelectorAll('.tab-panel'),
        stokList: document.getElementById('stok-list'),
        searchStok: document.getElementById('search-stok'),
        stokForm: document.getElementById('stokForm'),
        stokId: document.getElementById('stok-id'),
        namaBarang: document.getElementById('nama_barang'),
        kategori: document.getElementById('kategori'),
        jumlah: document.getElementById('jumlah'),
        satuan: document.getElementById('satuan'),
        lokasi: document.getElementById('lokasi'),
        minimalStok: document.getElementById('minimal_stok'),
        kondisi: document.getElementById('kondisi'),
        stokResult: document.getElementById('stok-result'),
        requestForm: document.getElementById('requestForm'),
        reqPetugas: document.getElementById('req-petugas'),
        reqArea: document.getElementById('req-area'),
        reqTanggal: document.getElementById('req-tanggal'),
        reqCatatan: document.getElementById('req-catatan'),
        itemsContainer: document.getElementById('items-container'),
        addItemBtn: document.getElementById('add-item'),
        requestResult: document.getElementById('request-result'),
        requestsList: document.getElementById('requests-list'),
        refreshRequests: document.getElementById('refresh-requests'),
        historyRequests: document.getElementById('history-requests'),
        kondisiRusakRingan: document.getElementById('kondisi-rusak-ringan'),
        kondisiRusakBerat: document.getElementById('kondisi-rusak-berat'),
        kondisiPerbaikan: document.getElementById('kondisi-perbaikan'),
        rusakList: document.getElementById('rusak-list'),
    };

    // Load data awal
    await loadStok();
    await loadRequests();
    await loadKondisi();

    // Pasang event listeners
    attachEventListeners();

    // Aktifkan tab stok default
    activateTab('stok');
}

function attachEventListeners() {
    // Tab navigation
    elements.tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            activateTab(tab);
        });
    });

    // Form stok submit
    elements.stokForm?.addEventListener('submit', handleStokSubmit);

    // Search stok
    elements.searchStok?.addEventListener('input', (e) => {
        const keyword = e.target.value.toLowerCase();
        const filtered = currentStok.filter(item => 
            item.nama_barang.toLowerCase().includes(keyword) ||
            (item.kategori && item.kategori.toLowerCase().includes(keyword))
        );
        renderStokList(filtered);
    });

    // Permintaan form
    elements.requestForm?.addEventListener('submit', handleRequestSubmit);
    elements.addItemBtn?.addEventListener('click', addItemRow);
    elements.refreshRequests?.addEventListener('click', loadRequests);

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
    elements.tabs.forEach(btn => {
        btn.classList.remove('active', 'text-cyan-400', 'border-b-2', 'border-cyan-500');
        btn.classList.add('text-slate-400');
    });
    const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active', 'text-cyan-400', 'border-b-2', 'border-cyan-500');
        activeBtn.classList.remove('text-slate-400');
    }

    elements.panels.forEach(panel => panel.classList.add('hidden'));
    document.getElementById(`tab-${tabId}`)?.classList.remove('hidden');

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
    if (!elements.stokList) return;
    elements.stokList.innerHTML = '<p class="text-center py-4"><span class="spinner"></span> Memuat...</p>';

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
        elements.stokList.innerHTML = '<p class="text-center py-4 text-red-500">Gagal memuat data</p>';
    }
}

function renderStokList(items) {
    if (!elements.stokList) return;
    if (items.length === 0) {
        elements.stokList.innerHTML = '<p class="text-center py-4 text-slate-400">Belum ada stok</p>';
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
    elements.stokList.innerHTML = html;
}

window.editStok = async (id) => {
    const item = currentStok.find(i => i.id === id);
    if (!item) return;

    elements.stokId.value = item.id;
    elements.namaBarang.value = item.nama_barang;
    elements.kategori.value = item.kategori || '';
    elements.jumlah.value = item.jumlah;
    elements.satuan.value = item.satuan || '';
    elements.lokasi.value = item.lokasi || '';
    elements.minimalStok.value = item.minimal_stok || 0;
    elements.kondisi.value = item.kondisi || 'baik';
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
    const id = elements.stokId.value;
    const data = {
        nama_barang: elements.namaBarang.value,
        kategori: elements.kategori.value,
        jumlah: parseInt(elements.jumlah.value),
        satuan: elements.satuan.value,
        lokasi: elements.lokasi.value,
        minimal_stok: parseInt(elements.minimalStok.value) || 0,
        kondisi: elements.kondisi.value
    };

    if (!data.nama_barang || data.jumlah < 0) {
        if (elements.stokResult) elements.stokResult.innerHTML = '<span class="text-red-500">Data tidak valid!</span>';
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

        if (elements.stokResult) elements.stokResult.innerHTML = '<span class="text-green-500">✅ Stok disimpan!</span>';
        showToast('Stok berhasil disimpan', 'success');
        e.target.reset();
        elements.stokId.value = '';
        loadStok();
        setTimeout(() => {
            if (elements.stokResult) elements.stokResult.innerHTML = '';
        }, 3000);
    } catch (err) {
        if (elements.stokResult) elements.stokResult.innerHTML = `<span class="text-red-500">❌ ${err.message}</span>`;
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
    const container = elements.itemsContainer;
    if (!container) return;
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
        if (select && select.value && qty) {
            const nama = select.options[select.selectedIndex]?.text;
            items.push({ id: select.value, nama, jumlah: parseInt(qty) });
        }
    }
    if (items.length === 0) {
        if (elements.requestResult) elements.requestResult.innerHTML = '<span class="text-red-500">Pilih minimal satu alat!</span>';
        return;
    }

    const petugas = elements.reqPetugas?.value;
    const area = elements.reqArea?.value;
    const tanggal = elements.reqTanggal?.value || new Date().toISOString().split('T')[0];
    const catatan = elements.reqCatatan?.value;

    if (!petugas) {
        if (elements.requestResult) elements.requestResult.innerHTML = '<span class="text-red-500">Nama petugas harus diisi!</span>';
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

        if (elements.requestResult) elements.requestResult.innerHTML = '<span class="text-green-500">✅ Permintaan diajukan!</span>';
        showToast('Permintaan berhasil', 'success');
        e.target.reset();
        // reset items container
        if (elements.itemsContainer) {
            elements.itemsContainer.innerHTML = `
                <div class="item-row flex gap-2">
                    <select class="item-select flex-1 p-2 rounded bg-slate-700 border border-slate-600 text-sm">
                        <option value="">Pilih Alat</option>
                    </select>
                    <input type="number" class="item-qty w-20 p-2 rounded bg-slate-700 border border-slate-600 text-sm" placeholder="Jml">
                    <button type="button" class="remove-item text-red-400 hover:text-red-300">✖</button>
                </div>
            `;
        }
        loadInventoryDropdown();
        loadRequests();
        setTimeout(() => {
            if (elements.requestResult) elements.requestResult.innerHTML = '';
        }, 3000);
    } catch (err) {
        if (elements.requestResult) elements.requestResult.innerHTML = `<span class="text-red-500">❌ ${err.message}</span>`;
        showToast('Gagal', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i> Ajukan';
    }
}

async function loadRequests() {
    if (!elements.requestsList) return;
    elements.requestsList.innerHTML = '<p class="text-center py-4"><span class="spinner"></span> Memuat...</p>';

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
            elements.requestsList.innerHTML = '<p class="text-center py-4 text-slate-400">Tidak ada permintaan pending</p>';
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
        elements.requestsList.innerHTML = html;
    } catch (err) {
        console.error(err);
        elements.requestsList.innerHTML = '<p class="text-center py-4 text-red-500">Gagal memuat</p>';
    }
}

async function loadAllRequestsHistory() {
    if (!elements.historyRequests) return;
    elements.historyRequests.innerHTML = '<tr><td colspan="5" class="text-center py-4"><span class="spinner"></span></td></tr>';

    try {
        const { data, error } = await supabase
            .from('tool_requests')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        if (!data || data.length === 0) {
            elements.historyRequests.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-slate-400">Belum ada riwayat</td></tr>';
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
        elements.historyRequests.innerHTML = html;
    } catch (err) {
        console.error(err);
        elements.historyRequests.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-red-500">Gagal memuat</td></tr>';
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

        if (elements.kondisiRusakRingan) elements.kondisiRusakRingan.textContent = rusakRingan;
        if (elements.kondisiRusakBerat) elements.kondisiRusakBerat.textContent = rusakBerat;
        if (elements.kondisiPerbaikan) elements.kondisiPerbaikan.textContent = perbaikan;

        if (!elements.rusakList) return;
        if (rusakRingan + rusakBerat + perbaikan === 0) {
            elements.rusakList.innerHTML = '<p class="text-slate-400">Semua alat dalam kondisi baik</p>';
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
        elements.rusakList.innerHTML = html;
    } catch (err) {
        console.error(err);
    }
}

export function cleanup() {
    // Hapus fungsi global
    delete window.editStok;
    delete window.hapusStok;
    console.log('📦 Modul Stok dibersihkan');
}
