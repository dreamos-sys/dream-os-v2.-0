/**
 * DREAM OS v2.0 - ASSET & INVENTORY MODULE
 * Developer: Erwinsyah | Dream Team © 2026
 */

import { supabase } from '../../core/supabase.js';

// ── STATE ─────────────────────────────────────────────
let assets = [];
let inventory = [];
const AUTHORIZED_ROLES = ['ADMIN', 'ARCHITECT', 'DEVELOPER', 'MASTER'];

// ── INIT ──────────────────────────────────────────────
async function init() {
    console.log('🏢 Asset Module Loading...');
    
    // Expose functions to window
    window.openAssetModal = openAssetModal;
    window.closeAssetModal = closeAssetModal;
    window.openInventoryModal = openInventoryModal;
    window.closeInventoryModal = closeInventoryModal;
    window.saveAsset = saveAsset;
    window.saveInventory = saveInventory;
    window.deleteAsset = deleteAsset;
    window.deleteInventory = deleteInventory;
    window.seedDummyData = seedDummyData;
    window.exportCSV = exportCSV;
    window.printQR = printQR;
    window.showQR = showQR;
    
    // Setup tabs
    setupTabs();
    
    // Load data
    await loadData();
    
    console.log('✅ Asset Module Ready');
}

// ── TABS ──────────────────────────────────────────────
function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active from all
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active to clicked
            this.classList.add('active');
            const tabId = this.dataset.tab;            document.getElementById('tab-' + tabId).classList.add('active');
            
            console.log('📑 Tab switched:', tabId);
        });
    });
}

// ── LOAD DATA ─────────────────────────────────────────
async function loadData() {
    await Promise.all([loadAssets(), loadInventory()]);
    updateStats();
}

async function loadAssets() {
    const container = document.getElementById('assetList');
    if (!container) return;
    
    container.innerHTML = '<div class="text-center py-12"><i class="fas fa-circle-notch spin text-2xl mb-3"></i><p>Memuat...</p></div>';
    
    try {
        const { data, error } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        assets = data || [];
        renderAssets();
    } catch (err) {
        console.error('[ASSET] Error:', err);
        container.innerHTML = '<p class="text-center text-red-400 py-8">Gagal memuat</p>';
    }
}

async function loadInventory() {
    try {
        const { data, error } = await supabase.from('inventory').select('*').order('nama_barang');
        if (error) throw error;
        inventory = data || [];
        renderInventory();
        renderGudang();
        renderCharts();
    } catch (err) {
        console.error('[INVENTORY] Error:', err);
        inventory = [];
    }
}

// ── RENDER ────────────────────────────────────────────
function renderAssets() {
    const container = document.getElementById('assetList');
    if (!container) return;
    
    if (assets.length === 0) {        container.innerHTML = `
            <div class="text-center py-12">
                <p class="opacity-60 mb-4">Belum ada asset</p>
                <button onclick="window.seedDummyData()" class="btn-action btn-orange">
                    <i class="fas fa-database mr-2"></i> Generate Dummy Data
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = assets.map(a => {
        const badge = getBadge(a.kondisi);
        return `
            <div class="asset-card">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="font-bold">${a.nama_asset || '-'}</div>
                        <div class="text-xs opacity-60">${a.kategori || '-'} | ${a.lokasi || '-'}</div>
                        ${a.harga ? `<div class="text-xs text-emerald-400 mt-1">Rp ${a.harga.toLocaleString('id-ID')}</div>` : ''}
                    </div>
                    <div class="text-right">
                        <span class="badge ${badge.class}">${badge.label}</span>
                        <div class="flex gap-2 mt-2 justify-end">
                            <button onclick="window.showQR('${a.id}', '${a.nama_asset}')" class="text-emerald-400 text-sm"><i class="fas fa-qrcode"></i></button>
                            <button onclick="window.deleteAsset('${a.id}')" class="text-red-400 text-sm"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderInventory() {
    const container = document.getElementById('inventoryList');
    if (!container) return;
    
    if (inventory.length === 0) {
        container.innerHTML = '<p class="text-center opacity-60 py-8">Belum ada inventory</p>';
        return;
    }
    
    container.innerHTML = inventory.map(i => {
        const isLow = i.jumlah <= i.minimal_stok;
        return `
            <div class="asset-card ${isLow ? 'border-red-500' : ''}">
                <div class="flex justify-between items-center">
                    <div>
                        <div class="font-bold">${i.nama_barang}</div>                        <div class="text-xs opacity-60">${i.kategori || '-'} | ${i.lokasi_rak || '-'}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-lg font-bold ${isLow ? 'text-red-400' : 'text-emerald-400'}">${i.jumlah} ${i.satuan || ''}</div>
                        <div class="text-xs opacity-60">Min: ${i.minimal_stok || 0}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderGudang() {
    const container = document.getElementById('gudangList');
    if (!container) return;
    
    if (inventory.length === 0) {
        container.innerHTML = '<p class="text-center opacity-60 col-span-2 py-8">Belum ada data</p>';
        return;
    }
    
    const categories = {};
    inventory.forEach(i => {
        const cat = i.kategori || 'Umum';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(i);
    });
    
    container.innerHTML = Object.entries(categories).map(([cat, items]) => `
        <div class="stat-box">
            <h3 class="font-bold mb-3 text-left">${cat}</h3>
            <div class="space-y-2 text-left">
                ${items.map(i => `
                    <div class="flex justify-between text-sm p-2 bg-white/5 rounded">
                        <span>${i.nama_barang}</span>
                        <span class="${i.jumlah <= i.minimal_stok ? 'text-red-400' : 'text-emerald-400'}">${i.jumlah} ${i.satuan || ''}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function renderCharts() {
    const assetChart = document.getElementById('assetCategoryChart');
    const invChart = document.getElementById('inventoryStatusChart');
    
    if (assetChart) {
        const cats = {};
        assets.forEach(a => { cats[a.kategori || 'Lainnya'] = (cats[a.kategori || 'Lainnya'] || 0) + 1; });        assetChart.innerHTML = Object.entries(cats).map(([c, n]) => `<div class="flex justify-between mb-2"><span>${c}</span><span class="text-emerald-400">${n}</span></div>`).join('') || '<p class="opacity-60">No data</p>';
    }
    
    if (invChart) {
        const good = inventory.filter(i => i.jumlah > i.minimal_stok).length;
        const low = inventory.filter(i => i.jumlah <= i.minimal_stok).length;
        invChart.innerHTML = `
            <div class="space-y-3">
                <div><div class="flex justify-between text-sm mb-1"><span>Stock Aman</span><span class="text-emerald-400">${good}</span></div><div class="h-2 bg-white/10 rounded"><div class="h-full bg-emerald-500 rounded" style="width:${inventory.length ? (good/inventory.length)*100 : 0}%"></div></div></div>
                <div><div class="flex justify-between text-sm mb-1"><span>Stock Rendah</span><span class="text-red-400">${low}</span></div><div class="h-2 bg-white/10 rounded"><div class="h-full bg-red-500 rounded" style="width:${inventory.length ? (low/inventory.length)*100 : 0}%"></div></div></div>
            </div>
        `;
    }
}

function updateStats() {
    setEl('stat-total-asset', assets.length);
    setEl('stat-total-inventory', inventory.length);
    setEl('stat-low-stock', inventory.filter(i => i.jumlah <= i.minimal_stok).length);
    setEl('stat-total-value', assets.reduce((s, a) => s + (a.harga || 0), 0).toLocaleString('id-ID'));
}

function setEl(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

function getBadge(cond) {
    if (cond === 'baik') return { class: 'badge-good', label: 'Baik' };
    if (cond === 'rusak_ringan') return { class: 'badge-warning', label: 'Rusak Ringan' };
    if (cond === 'rusak_berat') return { class: 'badge-danger', label: 'Rusak Berat' };
    return { class: 'badge-good', label: 'Baik' };
}

// ── MODALS ────────────────────────────────────────────
function openAssetModal() {
    const m = document.getElementById('assetModal');
    if (m) { m.classList.remove('hidden'); m.classList.add('flex'); }
}

function closeAssetModal() {
    const m = document.getElementById('assetModal');
    if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }
    document.querySelectorAll('#assetModal input').forEach(i => i.value = '');
}

function openInventoryModal() {
    const m = document.getElementById('inventoryModal');
    if (m) { m.classList.remove('hidden'); m.classList.add('flex'); }
}

function closeInventoryModal() {
    const m = document.getElementById('inventoryModal');    if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }
    document.querySelectorAll('#inventoryModal input').forEach(i => i.value = '');
}

// ── SAVE ──────────────────────────────────────────────
async function saveAsset() {
    const data = {
        nama_asset: document.getElementById('assetName')?.value || '',
        kategori: document.getElementById('assetCategory')?.value || '',
        lokasi: document.getElementById('assetLocation')?.value || '',
        serial_number: document.getElementById('assetSerial')?.value || '',
        harga: parseFloat(document.getElementById('assetPrice')?.value) || 0,
        tanggal_beli: document.getElementById('assetDate')?.value || '',
        kondisi: document.getElementById('assetCondition')?.value || 'baik',
        status: 'active',
        created_at: new Date().toISOString()
    };
    
    if (!data.nama_asset) { alert('Nama asset wajib!'); return; }
    
    try {
        const { error } = await supabase.from('assets').insert([data]);
        if (error) throw error;
        alert('✅ Asset disimpan');
        closeAssetModal();
        loadAssets();
        updateStats();
    } catch (err) {
        alert('❌ Gagal: ' + err.message);
    }
}

async function saveInventory() {
    const data = {
        nama_barang: document.getElementById('invName')?.value || '',
        kategori: document.getElementById('invCategory')?.value || '',
        jumlah: parseInt(document.getElementById('invQty')?.value) || 0,
        satuan: document.getElementById('invUnit')?.value || '',
        minimal_stok: parseInt(document.getElementById('invMin')?.value) || 0,
        lokasi_rak: document.getElementById('invLocation')?.value || '',
        created_at: new Date().toISOString()
    };
    
    if (!data.nama_barang) { alert('Nama barang wajib!'); return; }
    
    try {
        const { error } = await supabase.from('inventory').insert([data]);
        if (error) throw error;
        alert('✅ Inventory disimpan');
        closeInventoryModal();        loadInventory();
        updateStats();
    } catch (err) {
        alert('❌ Gagal: ' + err.message);
    }
}

// ── DELETE ────────────────────────────────────────────
async function deleteAsset(id) {
    if (!confirm('Hapus asset ini?')) return;
    try {
        await supabase.from('assets').delete().eq('id', id);
        alert('✅ Asset dihapus');
        loadAssets();
        updateStats();
    } catch (err) {
        alert('❌ Gagal: ' + err.message);
    }
}

async function deleteInventory(id) {
    if (!confirm('Hapus item ini?')) return;
    try {
        await supabase.from('inventory').delete().eq('id', id);
        alert('✅ Inventory dihapus');
        loadInventory();
        updateStats();
    } catch (err) {
        alert('❌ Gagal: ' + err.message);
    }
}

// ── DUMMY DATA ────────────────────────────────────────
async function seedDummyData() {
    if (!confirm('Generate dummy data?')) return;
    
    const dummyAssets = [
        { nama_asset: 'MacBook Pro M3', kategori: 'Elektronik', lokasi: 'R. IT', serial_number: 'MBP-001', harga: 45000000, tanggal_beli: '2026-01-15', kondisi: 'baik', status: 'active' },
        { nama_asset: 'Dell XPS 15', kategori: 'Elektronik', lokasi: 'R. IT', serial_number: 'DXP-002', harga: 35000000, tanggal_beli: '2026-01-20', kondisi: 'rusak_ringan', status: 'active' },
        { nama_asset: 'Toyota Innova', kategori: 'Kendaraan', lokasi: 'Parkir', serial_number: 'B 1234 XYZ', harga: 550000000, tanggal_beli: '2025-06-15', kondisi: 'baik', status: 'active' },
        { nama_asset: 'Meeting Table', kategori: 'Furnitur', lokasi: 'R. Rapat', serial_number: 'MT-003', harga: 15000000, tanggal_beli: '2025-12-10', kondisi: 'baik', status: 'active' },
        { nama_asset: 'AC Daikin 2PK', kategori: 'Elektronik', lokasi: 'R. Server', serial_number: 'AC-007', harga: 12000000, tanggal_beli: '2025-08-01', kondisi: 'rusak_berat', status: 'maintenance' }
    ];
    
    const dummyInv = [
        { nama_barang: 'Kertas A4', kategori: 'ATK', jumlah: 50, satuan: 'Rim', minimal_stok: 10, lokasi_rak: 'A-01' },
        { nama_barang: 'Pulpen', kategori: 'ATK', jumlah: 200, satuan: 'Pcs', minimal_stok: 50, lokasi_rak: 'A-02' },
        { nama_barang: 'Toner HP', kategori: 'ATK', jumlah: 8, satuan: 'Pcs', minimal_stok: 5, lokasi_rak: 'A-03' },
        { nama_barang: 'Sabun Lantai', kategori: 'Cleaning', jumlah: 15, satuan: 'Liter', minimal_stok: 10, lokasi_rak: 'B-01' },
        { nama_barang: 'Lampu LED', kategori: 'Electrical', jumlah: 30, satuan: 'Pcs', minimal_stok: 15, lokasi_rak: 'C-01' }    ];
    
    try {
        await supabase.from('assets').insert(dummyAssets);
        await supabase.from('inventory').insert(dummyInv);
        alert('✅ Dummy data created!');
        loadData();
    } catch (err) {
        alert('❌ Gagal: ' + err.message);
    }
}

// ── EXPORT & QR ───────────────────────────────────────
function exportCSV() {
    let csv = 'Type,Name,Category,Location,Value\n';
    assets.forEach(a => csv += `Asset,${a.nama_asset},${a.kategori},${a.lokasi},${a.harga}\n`);
    inventory.forEach(i => csv += `Inventory,${i.nama_barang},${i.kategori},${i.lokasi_rak},-\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asset_${Date.now()}.csv`;
    a.click();
    alert('✅ CSV exported');
}

function printQR() {
    if (!assets.length) { alert('No assets!'); return; }
    const w = window.open('', '_blank');
    w.document.write('<html><head><title>QR Assets</title></head><body>');
    assets.forEach(a => {
        w.document.write(`<div style="border:1px solid #000;padding:10px;margin:10px;display:inline-block;text-align:center;"><img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=ASSET-${a.id}"><div>${a.nama_asset}</div></div>`);
    });
    w.document.write('</body></html>');
    alert('🖨️ Print window opened');
}

function showQR(id, name) {
    alert(`📱 QR Code\n\nID: ${id}\nName: ${name}`);
}

// ── SEARCH ────────────────────────────────────────────
document.getElementById('searchAsset')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = assets.filter(a => (a.nama_asset || '').toLowerCase().includes(q));
    const container = document.getElementById('assetList');
    if (container && filtered.length === 0) container.innerHTML = '<p class="text-center opacity-60 py-8">Tidak ditemukan</p>';
    else if (container) assets = filtered.length > 0 ? filtered : assets;
    renderAssets();
});
document.getElementById('searchInventory')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = inventory.filter(i => i.nama_barang.toLowerCase().includes(q));
    const container = document.getElementById('inventoryList');
    if (container) inventory = filtered.length > 0 ? filtered : inventory;
    renderInventory();
});

// ── AUTO INIT ─────────────────────────────────────────
init();
