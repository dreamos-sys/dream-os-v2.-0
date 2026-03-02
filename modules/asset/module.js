// modules/asset/module.js
import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';
import { store } from '../../core/store.js';

let currentAssets = [];

// ========== RENDER HTML ==========
function renderHTML() {
    const container = document.getElementById('module-content');
    if (!container) return;
    container.innerHTML = `
        <div class="max-w-6xl mx-auto p-4">
            <!-- Header -->
            <div class="bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-2xl mb-6 border border-purple-500/30">
                <h2 class="text-2xl font-bold text-purple-400">🏢 MANAJEMEN ASET</h2>
                <p class="text-xs text-slate-400">Asset Inventory & Tracking System</p>
            </div>

            <!-- Tabs -->
            <div class="flex space-x-2 mb-6 overflow-x-auto border-b border-slate-700">
                <button class="tab-btn active" data-tab="daftar">📋 Daftar Aset</button>
                <button class="tab-btn" data-tab="tambah">➕ Tambah Aset</button>
                <button class="tab-btn" data-tab="kondisi">🔧 Kondisi Aset</button>
                <button class="tab-btn" data-tab="history">📜 Riwayat</button>
            </div>

            <!-- Panel Daftar Aset -->
            <div id="tab-daftar" class="tab-panel">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">Semua Aset</h3>
                    <input type="text" id="search-asset" placeholder="Cari aset..." class="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-sm">
                </div>
                <div id="asset-list" class="space-y-2"></div>
            </div>

            <!-- Panel Tambah Aset -->
            <div id="tab-tambah" class="tab-panel hidden">
                <div class="bg-slate-800/50 p-6 rounded-xl">
                    <h3 class="text-xl font-bold mb-4">Form Aset Baru</h3>
                    <form id="assetForm" class="space-y-4">
                        <input type="hidden" id="asset-id">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm mb-1">Nama Aset *</label>
                                <input type="text" id="nama_aset" required class="w-full p-2 rounded bg-slate-700 border border-slate-600">
                            </div>
                            <div>
                                <label class="block text-sm mb-1">Kategori</label>
                                <input type="text" id="kategori" class="w-full p-2 rounded bg-slate-700 border border-slate-600">
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm mb-1">Lokasi</label>
                                <input type="text" id="lokasi" class="w-full p-2 rounded bg-slate-700 border border-slate-600">
                            </div>
                            <div>
                                <label class="block text-sm mb-1">Kondisi</label>
                                <select id="kondisi" class="w-full p-2 rounded bg-slate-700 border border-slate-600">
                                    <option value="baik">Baik</option>
                                    <option value="rusak_ringan">Rusak Ringan</option>
                                    <option value="rusak_berat">Rusak Berat</option>
                                    <option value="perbaikan">Perbaikan</option>
                                    <option value="hilang">Hilang</option>
                                </select>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm mb-1">Jumlah</label>
                                <input type="number" id="jumlah" min="0" value="1" class="w-full p-2 rounded bg-slate-700 border border-slate-600">
                            </div>
                            <div>
                                <label class="block text-sm mb-1">Satuan</label>
                                <input type="text" id="satuan" placeholder="unit/pcs" class="w-full p-2 rounded bg-slate-700 border border-slate-600">
                            </div>
                            <div>
                                <label class="block text-sm mb-1">Nilai (Rp)</label>
                                <input type="number" id="nilai" min="0" step="1000" class="w-full p-2 rounded bg-slate-700 border border-slate-600">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm mb-1">Keterangan / Serial Number</label>
                            <textarea id="keterangan" rows="2" class="w-full p-2 rounded bg-slate-700 border border-slate-600"></textarea>
                        </div>
                        <button type="submit" class="w-full bg-purple-600 hover:bg-purple-500 p-3 rounded-lg font-bold">Simpan Aset</button>
                        <div id="form-result" class="text-center text-sm"></div>
                    </form>
                </div>
            </div>

            <!-- Panel Kondisi Aset -->
            <div id="tab-kondisi" class="tab-panel hidden">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div class="bg-emerald-600/20 p-3 rounded-xl border border-emerald-600/30">
                        <p class="text-xs text-slate-400">Baik</p>
                        <p class="text-2xl font-bold text-emerald-400" id="kondisi-baik">0</p>
                    </div>
                    <div class="bg-yellow-600/20 p-3 rounded-xl border border-yellow-600/30">
                        <p class="text-xs text-slate-400">Rusak Ringan</p>
                        <p class="text-2xl font-bold text-yellow-400" id="kondisi-ringan">0</p>
                    </div>
                    <div class="bg-red-600/20 p-3 rounded-xl border border-red-600/30">
                        <p class="text-xs text-slate-400">Rusak Berat</p>
                        <p class="text-2xl font-bold text-red-400" id="kondisi-berat">0</p>
                    </div>
                    <div class="bg-orange-600/20 p-3 rounded-xl border border-orange-600/30">
                        <p class="text-xs text-slate-400">Perbaikan</p>
                        <p class="text-2xl font-bold text-orange-400" id="kondisi-perbaikan">0</p>
                    </div>
                </div>
                <h3 class="text-lg font-bold mb-3">Aset Bermasalah</h3>
                <div id="asset-masalah" class="space-y-2"></div>
            </div>

            <!-- Panel Riwayat -->
            <div id="tab-history" class="tab-panel hidden">
                <h3 class="text-lg font-bold mb-3">Riwayat Perubahan Aset</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full text-sm">
                        <thead class="bg-slate-800">
                            <tr>
                                <th class="p-2">Tanggal</th>
                                <th class="p-2">Aset</th>
                                <th class="p-2">Perubahan</th>
                                <th class="p-2">Oleh</th>
                            </tr>
                        </thead>
                        <tbody id="history-asset"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

// ========== ELEMEN DOM ==========
let elements = {};

// ========== INIT ==========
export async function init() {
    console.log('🏢 Modul Asset dimuat');
    renderHTML();

    elements = {
        tabs: document.querySelectorAll('.tab-btn'),
        panels: document.querySelectorAll('.tab-panel'),
        assetList: document.getElementById('asset-list'),
        searchAsset: document.getElementById('search-asset'),
        assetForm: document.getElementById('assetForm'),
        assetId: document.getElementById('asset-id'),
        namaAset: document.getElementById('nama_aset'),
        kategori: document.getElementById('kategori'),
        lokasi: document.getElementById('lokasi'),
        kondisi: document.getElementById('kondisi'),
        jumlah: document.getElementById('jumlah'),
        satuan: document.getElementById('satuan'),
        nilai: document.getElementById('nilai'),
        keterangan: document.getElementById('keterangan'),
        formResult: document.getElementById('form-result'),
        kondisiBaik: document.getElementById('kondisi-baik'),
        kondisiRingan: document.getElementById('kondisi-ringan'),
        kondisiBerat: document.getElementById('kondisi-berat'),
        kondisiPerbaikan: document.getElementById('kondisi-perbaikan'),
        assetMasalah: document.getElementById('asset-masalah'),
        historyAsset: document.getElementById('history-asset'),
    };

    await loadAssets();
    await loadKondisi();
    await loadHistory();

    attachEventListeners();

    activateTab('daftar');
}

function attachEventListeners() {
    elements.tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            activateTab(tab);
        });
    });

    elements.searchAsset?.addEventListener('input', (e) => {
        const keyword = e.target.value.toLowerCase();
        const filtered = currentAssets.filter(a => 
            a.nama_aset.toLowerCase().includes(keyword) ||
            (a.kategori && a.kategori.toLowerCase().includes(keyword)) ||
            (a.lokasi && a.lokasi.toLowerCase().includes(keyword))
        );
        renderAssetList(filtered);
    });

    elements.assetForm?.addEventListener('submit', handleAssetSubmit);
}

function activateTab(tabId) {
    elements.tabs.forEach(btn => {
        btn.classList.remove('active', 'text-purple-400', 'border-b-2', 'border-purple-500');
        btn.classList.add('text-slate-400');
    });
    const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active', 'text-purple-400', 'border-b-2', 'border-purple-500');
        activeBtn.classList.remove('text-slate-400');
    }

    elements.panels.forEach(panel => panel.classList.add('hidden'));
    document.getElementById(`tab-${tabId}`)?.classList.remove('hidden');

    if (tabId === 'daftar') {
        renderAssetList(currentAssets);
    } else if (tabId === 'kondisi') {
        loadKondisi();
    } else if (tabId === 'history') {
        loadHistory();
    }
}

// ========== LOAD ASET ==========
async function loadAssets() {
    if (!elements.assetList) return;
    elements.assetList.innerHTML = '<p class="text-center py-4"><span class="spinner"></span> Memuat...</p>';

    try {
        const { data, error } = await supabase
            .from('assets')
            .select('*')
            .order('nama_aset', { ascending: true });

        if (error) throw error;
        currentAssets = data || [];
        renderAssetList(currentAssets);
    } catch (err) {
        console.error(err);
        elements.assetList.innerHTML = '<p class="text-center py-4 text-red-500">Gagal memuat data</p>';
    }
}

function renderAssetList(items) {
    if (!elements.assetList) return;
    if (items.length === 0) {
        elements.assetList.innerHTML = '<p class="text-center py-4 text-slate-400">Belum ada aset</p>';
        return;
    }

    let html = '';
    items.forEach(asset => {
        const kondisiColor = {
            'baik': 'text-emerald-400',
            'rusak_ringan': 'text-yellow-400',
            'rusak_berat': 'text-red-400',
            'perbaikan': 'text-orange-400',
            'hilang': 'text-gray-400'
        }[asset.kondisi] || 'text-slate-400';

        html += `
            <div class="bg-slate-700/50 p-3 rounded-xl flex justify-between items-center">
                <div class="flex-1">
                    <div class="font-bold">${asset.nama_aset}</div>
                    <div class="text-xs text-slate-400">${asset.kategori || '-'} | ${asset.lokasi || '-'}</div>
                    <div class="text-xs mt-1 flex gap-2">
                        <span>Jumlah: ${asset.jumlah || 1} ${asset.satuan || ''}</span>
                        <span class="${kondisiColor}">Kondisi: ${asset.kondisi || 'baik'}</span>
                        ${asset.nilai ? `<span>💰 Rp ${asset.nilai.toLocaleString()}</span>` : ''}
                    </div>
                    ${asset.keterangan ? `<div class="text-[10px] text-slate-500">${asset.keterangan}</div>` : ''}
                </div>
                <div class="flex gap-2">
                    <button onclick="window.editAsset('${asset.id}')" class="bg-blue-600 px-3 py-1 rounded-lg text-xs">✏️</button>
                    <button onclick="window.hapusAsset('${asset.id}')" class="bg-red-600 px-3 py-1 rounded-lg text-xs">🗑️</button>
                </div>
            </div>
        `;
    });
    elements.assetList.innerHTML = html;
}

window.editAsset = async (id) => {
    const asset = currentAssets.find(a => a.id === id);
    if (!asset) return;

    elements.assetId.value = asset.id;
    elements.namaAset.value = asset.nama_aset;
    elements.kategori.value = asset.kategori || '';
    elements.lokasi.value = asset.lokasi || '';
    elements.kondisi.value = asset.kondisi || 'baik';
    elements.jumlah.value = asset.jumlah || 1;
    elements.satuan.value = asset.satuan || '';
    elements.nilai.value = asset.nilai || '';
    elements.keterangan.value = asset.keterangan || '';

    activateTab('tambah');
};

window.hapusAsset = async (id) => {
    if (!confirm('Yakin hapus aset ini?')) return;
    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (error) {
        showToast('Gagal hapus: ' + error.message, 'error');
    } else {
        showToast('Aset dihapus', 'success');
        loadAssets();
        loadKondisi();
        loadHistory();
    }
};

async function handleAssetSubmit(e) {
    e.preventDefault();
    const id = elements.assetId.value;
    const data = {
        nama_aset: elements.namaAset.value,
        kategori: elements.kategori.value || null,
        lokasi: elements.lokasi.value || null,
        kondisi: elements.kondisi.value,
        jumlah: parseInt(elements.jumlah.value) || 1,
        satuan: elements.satuan.value || null,
        nilai: elements.nilai.value ? parseInt(elements.nilai.value) : null,
        keterangan: elements.keterangan.value || null,
        updated_at: new Date().toISOString()
    };

    if (!data.nama_aset) {
        if (elements.formResult) elements.formResult.innerHTML = '<span class="text-red-500">Nama aset harus diisi!</span>';
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

    try {
        let error;
        if (id) {
            ({ error } = await supabase.from('assets').update(data).eq('id', id));
        } else {
            data.created_at = new Date().toISOString();
            ({ error } = await supabase.from('assets').insert([data]));
        }
        if (error) throw error;

        if (elements.formResult) elements.formResult.innerHTML = '<span class="text-green-500">✅ Aset disimpan!</span>';
        showToast('Aset berhasil disimpan', 'success');
        e.target.reset();
        elements.assetId.value = '';
        loadAssets();
        loadKondisi();
        loadHistory();
        setTimeout(() => {
            if (elements.formResult) elements.formResult.innerHTML = '';
        }, 3000);
        activateTab('daftar');
    } catch (err) {
        if (elements.formResult) elements.formResult.innerHTML = `<span class="text-red-500">❌ ${err.message}</span>`;
        showToast('Gagal simpan', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Simpan Aset';
    }
}

// ========== KONDISI ==========
async function loadKondisi() {
    try {
        const { data, error } = await supabase.from('assets').select('kondisi');
        if (error) throw error;

        const baik = data.filter(a => a.kondisi === 'baik').length;
        const ringan = data.filter(a => a.kondisi === 'rusak_ringan').length;
        const berat = data.filter(a => a.kondisi === 'rusak_berat').length;
        const perbaikan = data.filter(a => a.kondisi === 'perbaikan').length;

        if (elements.kondisiBaik) elements.kondisiBaik.textContent = baik;
        if (elements.kondisiRingan) elements.kondisiRingan.textContent = ringan;
        if (elements.kondisiBerat) elements.kondisiBerat.textContent = berat;
        if (elements.kondisiPerbaikan) elements.kondisiPerbaikan.textContent = perbaikan;

        if (!elements.assetMasalah) return;
        if (ringan + berat + perbaikan === 0) {
            elements.assetMasalah.innerHTML = '<p class="text-slate-400">Semua aset dalam kondisi baik</p>';
            return;
        }

        const { data: items } = await supabase
            .from('assets')
            .select('nama_aset, kondisi, jumlah, satuan, lokasi')
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
                        <span class="font-bold">${item.nama_aset}</span>
                        <span class="${color}">${item.kondisi}</span>
                    </div>
                    <div class="text-xs text-slate-400">${item.lokasi || '-'} | ${item.jumlah || 1} ${item.satuan || ''}</div>
                </div>
            `;
        });
        elements.assetMasalah.innerHTML = html;
    } catch (err) {
        console.error(err);
    }
}

// ========== RIWAYAT (sementara dari log aset, nanti bisa pakai audit_logs) ==========
async function loadHistory() {
    if (!elements.historyAsset) return;
    elements.historyAsset.innerHTML = '<tr><td colspan="4" class="text-center py-4"><span class="spinner"></span></td></tr>';

    try {
        // Gunakan audit_logs jika ada, atau assets dengan updated_at
        const { data, error } = await supabase
            .from('assets')
            .select('id, nama_aset, updated_at, created_at')
            .order('updated_at', { ascending: false })
            .limit(20);

        if (error) throw error;
        if (!data || data.length === 0) {
            elements.historyAsset.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-slate-400">Belum ada riwayat</td></tr>';
            return;
        }

        let html = '';
        data.forEach(asset => {
            html += `
                <tr>
                    <td class="p-2">${new Date(asset.updated_at || asset.created_at).toLocaleDateString('id-ID')}</td>
                    <td class="p-2">${asset.nama_aset}</td>
                    <td class="p-2">Diperbarui</td>
                    <td class="p-2">System</td>
                </tr>
            `;
        });
        elements.historyAsset.innerHTML = html;
    } catch (err) {
        console.error(err);
        elements.historyAsset.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-red-500">Gagal memuat</td></tr>';
    }
}

export function cleanup() {
    delete window.editAsset;
    delete window.hapusAsset;
    console.log('🏢 Modul Asset dibersihkan');
}
