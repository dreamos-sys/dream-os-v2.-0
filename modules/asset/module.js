import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';
import { store } from '../../core/store.js';

let currentAssets = [];

export async function init() {
    console.log('🏢 Modul Asset dimuat');

    await loadAssets();
    await loadStok();
    await loadRequests();
    await loadMaintenance();
    await loadInventoryDropdown();
    await loadAssetDropdown();

    // Chart Dashboard (sederhana)
    if (document.getElementById('categoryChart')) {
        const ctx = document.getElementById('categoryChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Elektronik', 'Furnitur', 'Kendaraan', 'Bangunan', 'ATK'],
                datasets: [{
                    data: [12, 19, 3, 5, 2],
                    backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
                }]
            }
        });
    }

    attachEventListeners();
}

function attachEventListeners() {
    document.getElementById('searchAsset')?.addEventListener('input', (e) => {
        const keyword = e.target.value.toLowerCase();
        const filtered = currentAssets.filter(a => 
            a.nama_asset.toLowerCase().includes(keyword) || 
            a.lokasi.toLowerCase().includes(keyword)
        );
        renderAssetTable(filtered);
    });

    document.getElementById('assetForm')?.addEventListener('submit', handleAssetSubmit);
    document.getElementById('stokForm')?.addEventListener('submit', handleStokSubmit);
    document.getElementById('requestForm')?.addEventListener('submit', handleRequestSubmit);
    document.getElementById('maintenanceForm')?.addEventListener('submit', handleMaintenanceSubmit);
    document.getElementById('add-item')?.addEventListener('click', addItemRow);
    document.getElementById('refresh-requests')?.addEventListener('click', loadRequests);
    document.getElementById('refresh-wo')?.addEventListener('click', loadMaintenance);
    document.getElementById('btn-export-asset')?.addEventListener('click', exportCSV);
    document.getElementById('btn-print-all-qr')?.addEventListener('click', printQR);

    // Delegasi untuk remove item
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-item')) {
            e.target.closest('.item-row').remove();
        }
    });

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(tc => tc.classList.add('hidden'));
            const target = document.getElementById(`tab-${this.dataset.tab}`);
            if (target) target.classList.remove('hidden');

            if (this.dataset.tab === 'inventory') loadStok();
            if (this.dataset.tab === 'requests') {
                loadRequests();
                loadInventoryDropdown();
            }
            if (this.dataset.tab === 'maintenance') {
                loadMaintenance();
                loadAssetDropdown();
            }
        });
    });
}

// ========== UTILITY ==========
const formatIDR = (val) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
}).format(val || 0);

function calculateBookValue(harga, tanggalBeli) {
    if (!harga || !tanggalBeli) return 0;
    const thnBeli = new Date(tanggalBeli).getFullYear();
    const thnSekarang = new Date().getFullYear();
    const umur = thnSekarang - thnBeli;
    const masaManfaat = 5;
    return harga - (harga * (Math.min(umur, masaManfaat) / masaManfaat));
}

// ========== ASSETS ==========
async function loadAssets() {
    const tbody = document.getElementById('asset-list');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center"><div class="spinner mx-auto"></div></td></tr>';

    try {
        const { data, error } = await supabase
            .from('assets')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        currentAssets = data || [];

        const total = currentAssets.length;
        const value = currentAssets.reduce((acc, curr) => acc + (curr.harga || 0), 0);
        const damaged = currentAssets.filter(a => a.kondisi === 'rusak_berat').length;
        const repair = currentAssets.filter(a => a.kondisi === 'rusak_ringan').length;

        document.getElementById('stat-total-asset').textContent = total;
        document.getElementById('stat-total-value').textContent = formatIDR(value);
        document.getElementById('stat-asset-repair').textContent = repair;
        document.getElementById('stat-asset-damaged').textContent = damaged;

        const totalBookValue = currentAssets.reduce((acc, curr) => 
            acc + calculateBookValue(curr.harga, curr.tanggal_beli), 0);
        document.getElementById('current-book-value').textContent = formatIDR(totalBookValue);

        renderAssetTable(currentAssets);
    } catch (err) {
        console.error(err);
        if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-red-500">Gagal memuat</td></tr>';
    }
}

function renderAssetTable(items) {
    const tbody = document.getElementById('asset-list');
    if (!tbody) return;
    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center opacity-50">Belum ada asset</td></tr>';
        return;
    }
    tbody.innerHTML = items.map(item => {
        let badgeColor = 'bg-green-100 text-green-700';
        if (item.kondisi === 'rusak_ringan') badgeColor = 'bg-yellow-100 text-yellow-700';
        if (item.kondisi === 'rusak_berat') badgeColor = 'bg-red-100 text-red-700';
        return `
            <tr class="hover:bg-slate-700/50">
                <td class="p-2">
                    <div class="font-bold">${item.nama_asset}</div>
                    <div class="text-[10px] text-slate-400">${item.kategori}</div>
                </td>
                <td class="p-2">${item.lokasi}</td>
                <td class="p-2"><span class="px-2 py-1 rounded-full text-[10px] font-black ${badgeColor}">${item.kondisi.replace('_', ' ')}</span></td>
                <td class="p-2 font-mono">${formatIDR(item.harga)}</td>
                <td class="p-2">
                    <button class="text-xs bg-slate-700 hover:bg-indigo-600 px-2 py-1 rounded transition">🔍</button>
                </td>
            </tr>
        `;
    }).join('');
}

async function handleAssetSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    btn.innerHTML = '<span>⏳ Menyimpan...</span>';

    const formData = {
        nama_asset: document.getElementById('nama_asset').value,
        kategori: document.getElementById('kategori').value,
        lokasi: document.getElementById('lokasi').value,
        kondisi: document.getElementById('kondisi').value,
        harga: parseFloat(document.getElementById('harga').value),
        tanggal_beli: document.getElementById('tanggal_beli').value,
        garansi: parseInt(document.getElementById('garansi').value) || 0,
        created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('assets').insert([formData]);
    const resDiv = document.getElementById('form-result');
    if (error) {
        resDiv.innerHTML = `<span class="text-red-500">❌ ${error.message}</span>`;
        showToast('Gagal simpan asset', 'error');
    } else {
        resDiv.innerHTML = '<span class="text-green-500">✅ Asset berhasil ditambahkan!</span>';
        showToast('Asset disimpan', 'success');
        e.target.reset();
        loadAssets();
        setTimeout(() => resDiv.innerHTML = '', 3000);
    }
    btn.disabled = false;
    btn.innerHTML = '💾 SIMPAN ASSET';
}

// ========== STOK (INVENTORY) ==========
async function loadStok() {
    const container = document.getElementById('stok-list');
    if (!container) return;
    container.innerHTML = '<p class="text-center py-4"><div class="spinner mx-auto"></div></p>';

    try {
        const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .order('nama_barang', { ascending: true });

        if (error) throw error;
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="text-center py-4 opacity-50">Belum ada data stok</p>';
            return;
        }

        let html = '<div class="space-y-2">';
        let lowStockCount = 0;
        data.forEach(item => {
            const isLow = item.jumlah <= item.minimal_stok;
            if (isLow) lowStockCount++;
            const warning = isLow ? 'text-red-500 font-bold' : '';
            html += `
                <div class="bg-slate-800/50 p-3 rounded-xl border-l-4 ${isLow ? 'border-red-500' : 'border-emerald-500'}">
                    <div class="flex justify-between">
                        <span class="font-semibold">${item.nama_barang}</span>
                        <span class="${warning}">${item.jumlah} ${item.satuan || ''}</span>
                    </div>
                    <div class="text-xs opacity-60">${item.kategori || '-'} | Lokasi: ${item.lokasi_rak || '-'}</div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
        document.getElementById('stat-stock-low').textContent = lowStockCount;
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p class="text-center py-4 text-red-500">Gagal memuat</p>';
    }
}

async function handleStokSubmit(e) {
    e.preventDefault();
    const nama = document.getElementById('stok_nama').value.trim();
    const jumlah = parseInt(document.getElementById('stok_jumlah').value);
    if (!nama || !jumlah) {
        document.getElementById('stok-result').innerHTML = '<span class="text-red-500">Nama dan jumlah wajib!</span>';
        return;
    }

    const data = {
        nama_barang: nama,
        kategori: document.getElementById('stok_kategori').value,
        lokasi_rak: document.getElementById('stok_lokasi').value,
        jumlah,
        satuan: document.getElementById('stok_satuan').value,
        minimal_stok: parseInt(document.getElementById('stok_minimal').value) || 0,
        maksimal_stok: parseInt(document.getElementById('stok_maksimal').value) || null
    };

    const { error } = await supabase.from('inventory').insert([data]);
    const resDiv = document.getElementById('stok-result');
    if (error) {
        resDiv.innerHTML = `<span class="text-red-500">❌ ${error.message}</span>`;
        showToast('Gagal tambah stok', 'error');
    } else {
        resDiv.innerHTML = '<span class="text-green-500">✅ Stok ditambahkan!</span>';
        showToast('Stok berhasil', 'success');
        e.target.reset();
        loadStok();
        setTimeout(() => resDiv.innerHTML = '', 3000);
    }
}

// ========== PERMINTAAN JANITOR ==========
async function loadRequests() {
    const container = document.getElementById('requests-list');
    if (!container) return;
    container.innerHTML = '<p class="text-center py-4"><div class="spinner mx-auto"></div></p>';

    try {
        const { data, error } = await supabase
            .from('janitor_requests')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="text-center py-4 opacity-50">Belum ada permintaan</p>';
            return;
        }

        let html = '';
        data.forEach(r => {
            const statusColor = {
                pending: 'text-yellow-500',
                approved: 'text-green-500',
                rejected: 'text-red-500',
                fulfilled: 'text-blue-500'
            }[r.status] || 'text-slate-400';

            html += `
                <div class="bg-slate-800/50 p-3 rounded-xl border-l-4 border-emerald-500">
                    <div class="flex justify-between text-xs">
                        <span class="font-bold">${r.requestor}</span>
                        <span class="${statusColor}">${r.status}</span>
                    </div>
                    <div class="text-[10px] opacity-60">${r.area} | ${r.shift} | ${r.tgl_butuh}</div>
                    <div class="text-xs mt-1">${JSON.parse(r.items).map(i => `${i.nama} (${i.jumlah})`).join(', ')}</div>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p class="text-center py-4 text-red-500">Gagal memuat</p>';
    }
}

async function loadInventoryDropdown() {
    const { data } = await supabase.from('inventory').select('nama_barang, id');
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
        <select class="item-select flex-1 p-2 rounded bg-slate-700 border border-slate-600 text-sm"></select>
        <input type="number" class="item-qty w-20 p-2 rounded bg-slate-700 border border-slate-600 text-sm" placeholder="Jml">
        <button type="button" class="remove-item text-red-400 hover:text-red-300">✖</button>
    `;
    container.appendChild(newRow);
    loadInventoryDropdown();
}

async function handleRequestSubmit(e) {
    e.preventDefault();
    const rows = document.querySelectorAll('.item-row');
    const items = [];
    for (let row of rows) {
        const select = row.querySelector('.item-select');
        const qty = row.querySelector('.item-qty')?.value;
        if (select.value && qty) {
            items.push({ id: select.value, nama: select.options[select.selectedIndex]?.text, jumlah: parseInt(qty) });
        }
    }
    if (items.length === 0) {
        document.getElementById('request-result').innerHTML = '<span class="text-red-500">Minimal satu alat harus dipilih!</span>';
        return;
    }

    const data = {
        requestor: document.getElementById('requestor').value,
        area: document.getElementById('area').value,
        shift: document.getElementById('shift').value,
        tgl_butuh: document.getElementById('tgl_butuh').value,
        items: JSON.stringify(items),
        catatan: document.getElementById('catatan').value,
        status: 'pending',
        created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('janitor_requests').insert([data]);
    const resDiv = document.getElementById('request-result');
    if (error) {
        resDiv.innerHTML = `<span class="text-red-500">❌ ${error.message}</span>`;
        showToast('Gagal', 'error');
    } else {
        resDiv.innerHTML = '<span class="text-green-500">✅ Permintaan diajukan!</span>';
        showToast('Permintaan berhasil', 'success');
        e.target.reset();
        document.getElementById('items-container').innerHTML = `
            <div class="item-row flex gap-2">
                <select class="item-select flex-1 p-2 rounded bg-slate-700 border border-slate-600 text-sm"></select>
                <input type="number" class="item-qty w-20 p-2 rounded bg-slate-700 border border-slate-600 text-sm" placeholder="Jml">
                <button type="button" class="remove-item text-red-400 hover:text-red-300">✖</button>
            </div>
        `;
        loadInventoryDropdown();
        loadRequests();
        setTimeout(() => resDiv.innerHTML = '', 3000);
    }
}

// ========== MAINTENANCE ==========
async function loadMaintenance() {
    const container = document.getElementById('wo-list');
    if (!container) return;
    container.innerHTML = '<p class="text-center py-4"><div class="spinner mx-auto"></div></p>';

    try {
        const { data, error } = await supabase
            .from('maintenance_orders')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="text-center py-4 opacity-50">Belum ada work order</p>';
            return;
        }

        let html = '';
        data.forEach(wo => {
            const priorityColor = {
                rendah: 'bg-slate-600',
                sedang: 'bg-yellow-600',
                tinggi: 'bg-red-600'
            }[wo.prioritas] || 'bg-slate-600';

            html += `
                <div class="bg-slate-800/50 p-3 rounded-xl border-l-4 border-yellow-500">
                    <div class="flex justify-between text-xs">
                        <span class="font-bold">${wo.asset_name}</span>
                        <span class="px-2 py-0.5 rounded-full text-[10px] ${priorityColor}">${wo.prioritas}</span>
                    </div>
                    <div class="text-[10px] opacity-60">Teknisi: ${wo.teknisi || '-'}</div>
                    <div class="text-xs mt-1">${wo.kerusakan}</div>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p class="text-center py-4 text-red-500">Gagal memuat</p>';
    }
}

async function loadAssetDropdown() {
    const { data } = await supabase.from('assets').select('id, nama_asset');
    const select = document.getElementById('wo_asset');
    if (select) {
        select.innerHTML = '<option value="">Pilih Asset</option>' + 
            (data || []).map(a => `<option value="${a.id}">${a.nama_asset}</option>`).join('');
    }
}

async function handleMaintenanceSubmit(e) {
    e.preventDefault();
    const assetId = document.getElementById('wo_asset').value;
    const assetName = document.getElementById('wo_asset').options[document.getElementById('wo_asset').selectedIndex]?.text;

    const data = {
        asset_id: assetId,
        asset_name: assetName,
        kerusakan: document.getElementById('wo_kerusakan').value,
        prioritas: document.getElementById('wo_prioritas').value,
        tanggal: document.getElementById('wo_tanggal').value,
        teknisi: document.getElementById('wo_teknisi').value,
        status: 'open',
        created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('maintenance_orders').insert([data]);
    const resDiv = document.getElementById('wo-result');
    if (error) {
        resDiv.innerHTML = `<span class="text-red-500">❌ ${error.message}</span>`;
        showToast('Gagal', 'error');
    } else {
        resDiv.innerHTML = '<span class="text-green-500">✅ Work Order dibuat!</span>';
        showToast('WO berhasil', 'success');
        e.target.reset();
        loadMaintenance();
        setTimeout(() => resDiv.innerHTML = '', 3000);
    }
}

// ========== EXPORT & QR ==========
function exportCSV() {
    let csv = 'Nama Asset,Kategori,Lokasi,Kondisi,Harga,Tanggal Beli\n';
    currentAssets.forEach(a => {
        csv += `${a.nama_asset},${a.kategori},${a.lokasi},${a.kondisi},${a.harga},${a.tanggal_beli}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'assets_dreamos.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    showToast('CSV diekspor', 'success');
}

function printQR() {
    if (!currentAssets.length) {
        showToast('Data asset kosong!', 'warning');
        return;
    }
    const printWin = window.open('', '_blank');
    printWin.document.write(`
        <html>
        <head><title>Cetak QR Asset</title>
        <style>
            body { font-family: monospace; display: flex; flex-wrap: wrap; gap: 20px; padding: 20px; }
            .card { border: 1px solid #000; padding: 10px; width: 200px; text-align: center; }
            .qr { width: 120px; height: 120px; margin: 5px auto; }
        </style>
        </head>
        <body>
            <div style="width:100%; text-align:center; margin-bottom:20px;">
                <button onclick="window.print()">🖨️ Print</button>
            </div>
    `);
    currentAssets.forEach(a => {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=ASSET-${a.id}`;
        printWin.document.write(`
            <div class="card">
                <div>ID: ${a.id}</div>
                <img src="${qrUrl}" class="qr">
                <div><strong>${a.nama_asset}</strong></div>
                <div style="font-size:10px;">${a.lokasi}</div>
            </div>
        `);
    });
    printWin.document.write('</body></html>');
    printWin.document.close();
}
