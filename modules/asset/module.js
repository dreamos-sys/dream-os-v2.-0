/**
 * DREAM OS v2.0 - ASSET & INVENTORY MODULE
 * Developer: Erwinsyah | Dream Team © 2026
 * Integrated: Asset Management + Inventory + Gudang
 */

import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';
import { store } from '../../core/store.js';

// ── 📊 STATE ─────────────────────────────────────────────
let assets = [];
let inventory = [];
let currentTab = 'asset';

// ── 🚀 INITIALIZATION ────────────────────────────────────
export async function init() {
    console.log('🏢 Asset & Inventory Module Loaded');
    
    // Check auth
    const user = store.get('user');
    if (!user) {
        showToast('⛔ Silakan login terlebih dahulu', 'error');
        setTimeout(() => window.history.back(), 2000);
        return;
    }

    await loadData();
    setupTabs();
    setupSearch();
    setupModals();
    
    console.log('[ASSET] Module initialized successfully');
}

// ── 🧹 CLEANUP ───────────────────────────────────────────
export function cleanup() {
    assets = [];
    inventory = [];
    console.log('[ASSET] Module cleanup complete');
}

// ── 📡 LOAD DATA ─────────────────────────────────────────
async function loadData() {
    try {
        await Promise.all([loadAssets(), loadInventory()]);
        updateStats();
        renderGudang(inventory);
        renderCharts();
    } catch (err) {        console.error('[ASSET] Load data error:', err);
        showToast('⚠️ Gagal memuat data', 'error');
    }
}

// ── 🏢 LOAD ASSETS ───────────────────────────────────────
async function loadAssets() {
    const container = document.getElementById('assetList');
    if (!container) return;
    
    try {
        const { data, error } = await supabase
            .from('assets')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        assets = data || [];
        renderAssets(assets);
        
    } catch (err) {
        console.error('[ASSET] Error:', err);
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-exclamation-triangle text-3xl text-red-400 mb-3"></i>
                <p class="text-red-400">Gagal memuat asset</p>
                <button onclick="loadAssets()" class="btn-action mt-4">Retry</button>
            </div>
        `;
    }
}

// ── 📦 LOAD INVENTORY ────────────────────────────────────
async function loadInventory() {
    const container = document.getElementById('inventoryList');
    if (!container) return;
    
    try {
        const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .order('nama_barang');
        
        if (error) throw error;
        inventory = data || [];
        renderInventory(inventory);
        renderGudang(inventory);
        
    } catch (err) {
        console.error('[INVENTORY] Error:', err);        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-exclamation-triangle text-3xl text-orange-400 mb-3"></i>
                <p class="text-orange-400">Gagal memuat inventory</p>
                <p class="text-xs opacity-60 mt-2">Table mungkin belum ada</p>
            </div>
        `;
    }
}

// ── 🎨 RENDER FUNCTIONS ──────────────────────────────────
function renderAssets(items) {
    const container = document.getElementById('assetList');
    if (!container) return;
    
    if (!items || items.length === 0) {
        container.innerHTML = '<p class="text-center opacity-60 py-8">Belum ada asset</p>';
        return;
    }
    
    container.innerHTML = items.map(a => {
        const conditionBadge = getConditionBadge(a.kondisi);
        return `
            <div class="asset-card">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="font-bold">${a.nama_asset || a.nama_barang || '-'}</div>
                        <div class="text-xs opacity-60">${a.kategori || '-'} | ${a.lokasi || '-'}</div>
                        <div class="text-xs opacity-40 mt-1">S/N: ${a.serial_number || '-'}</div>
                        ${a.harga ? `<div class="text-xs text-emerald-400 mt-1">Rp ${a.harga.toLocaleString('id-ID')}</div>` : ''}
                    </div>
                    <div class="text-right">
                        <span class="badge ${conditionBadge.class}">${conditionBadge.label}</span>
                        <button onclick="window.showQR('${a.id}', '${a.nama_asset || a.nama_barang}')" 
                                class="text-emerald-400 text-sm mt-2 block hover:text-emerald-300">
                            <i class="fas fa-qrcode"></i> QR
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderInventory(items) {
    const container = document.getElementById('inventoryList');
    if (!container) return;
    
    if (!items || items.length === 0) {
        container.innerHTML = '<p class="text-center opacity-60 py-8">Belum ada inventory</p>';        return;
    }
    
    container.innerHTML = items.map(i => {
        const isLow = i.jumlah <= i.minimal_stok;
        return `
            <div class="asset-card ${isLow ? 'border-red-500' : ''}">
                <div class="flex justify-between items-center">
                    <div>
                        <div class="font-bold">${i.nama_barang}</div>
                        <div class="text-xs opacity-60">${i.kategori || '-'} | ${i.lokasi_rak || '-'}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-lg font-bold ${isLow ? 'text-red-400' : 'text-emerald-400'}">
                            ${i.jumlah} ${i.satuan || ''}
                        </div>
                        <div class="text-xs opacity-60">Min: ${i.minimal_stok || 0}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderGudang(items) {
    const container = document.getElementById('gudangList');
    if (!container) return;
    
    if (!items || items.length === 0) {
        container.innerHTML = '<p class="text-center opacity-60 col-span-2 py-8">Belum ada data gudang</p>';
        return;
    }
    
    const categories = {};
    items.forEach(i => {
        const cat = i.kategori || 'Umum';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(i);
    });
    
    container.innerHTML = Object.entries(categories).map(([cat, items]) => `
        <div class="stat-box">
            <h3 class="font-bold mb-3 text-left flex items-center gap-2">
                <i class="fas fa-warehouse text-orange-400"></i>
                ${cat}
            </h3>
            <div class="space-y-2 text-left">
                ${items.map(i => `
                    <div class="flex justify-between text-sm p-2 bg-white/5 rounded">
                        <span>${i.nama_barang}</span>                        <span class="${i.jumlah <= i.minimal_stok ? 'text-red-400' : 'text-emerald-400'}">
                            ${i.jumlah} ${i.satuan || ''}
                        </span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function renderCharts() {
    // Simple chart rendering (can be enhanced with Chart.js)
    const assetChart = document.getElementById('assetCategoryChart');
    const inventoryChart = document.getElementById('inventoryStatusChart');
    
    if (assetChart) {
        const categories = {};
        assets.forEach(a => {
            const cat = a.kategori || 'Lainnya';
            categories[cat] = (categories[cat] || 0) + 1;
        });
        
        assetChart.innerHTML = Object.entries(categories).map(([cat, count]) => `
            <div class="flex justify-between items-center mb-2">
                <span class="text-sm">${cat}</span>
                <span class="text-emerald-400 font-bold">${count}</span>
            </div>
        `).join('') || '<p class="opacity-60">No data</p>';
    }
    
    if (inventoryChart) {
        const goodStock = inventory.filter(i => i.jumlah > i.minimal_stok).length;
        const lowStock = inventory.filter(i => i.jumlah <= i.minimal_stok).length;
        
        inventoryChart.innerHTML = `
            <div class="space-y-3">
                <div>
                    <div class="flex justify-between text-sm mb-1">
                        <span>Stock Aman</span>
                        <span class="text-emerald-400">${goodStock}</span>
                    </div>
                    <div class="h-2 bg-white/10 rounded-full">
                        <div class="h-full bg-emerald-500 rounded-full" style="width: ${inventory.length ? (goodStock/inventory.length)*100 : 0}%"></div>
                    </div>
                </div>
                <div>
                    <div class="flex justify-between text-sm mb-1">
                        <span>Stock Rendah</span>
                        <span class="text-red-400">${lowStock}</span>
                    </div>                    <div class="h-2 bg-white/10 rounded-full">
                        <div class="h-full bg-red-500 rounded-full" style="width: ${inventory.length ? (lowStock/inventory.length)*100 : 0}%"></div>
                    </div>
                </div>
            </div>
        `;
    }
}

// ── 📊 STATS UPDATE ──────────────────────────────────────
function updateStats() {
    const el = (id, val) => {
        const element = document.getElementById(id);
        if (element) element.textContent = val;
    };
    
    el('stat-total-asset', assets.length);
    el('stat-total-inventory', inventory.length);
    el('stat-low-stock', inventory.filter(i => i.jumlah <= i.minimal_stok).length);
    
    const totalValue = assets.reduce((sum, a) => sum + (a.harga || 0), 0);
    el('stat-total-value', totalValue.toLocaleString('id-ID'));
}

// ── 🎯 HELPER FUNCTIONS ──────────────────────────────────
function getConditionBadge(condition) {
    const badges = {
        'baik': { class: 'badge-good', label: 'Baik' },
        'rusak_ringan': { class: 'badge-warning', label: 'Rusak Ringan' },
        'rusak_berat': { class: 'badge-danger', label: 'Rusak Berat' }
    };
    return badges[condition] || { class: 'badge-good', label: 'Baik' };
}

// ── 🔧 SETUP FUNCTIONS ───────────────────────────────────
function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(tc => tc.classList.add('hidden'));
            const target = document.getElementById(`tab-${this.dataset.tab}`);
            if (target) target.classList.remove('hidden');
            
            currentTab = this.dataset.tab;
            console.log('[ASSET] Tab switched to:', currentTab);
        });
    });
}
function setupSearch() {
    const assetSearch = document.getElementById('searchAsset');
    const inventorySearch = document.getElementById('searchInventory');
    
    if (assetSearch) {
        assetSearch.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            const filtered = assets.filter(a => 
                (a.nama_asset || a.nama_barang || '').toLowerCase().includes(q) ||
                (a.kategori || '').toLowerCase().includes(q) ||
                (a.lokasi || '').toLowerCase().includes(q)
            );
            renderAssets(filtered);
        });
    }
    
    if (inventorySearch) {
        inventorySearch.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            const filtered = inventory.filter(i => 
                i.nama_barang.toLowerCase().includes(q) ||
                (i.kategori || '').toLowerCase().includes(q)
            );
            renderInventory(filtered);
        });
    }
}

function setupModals() {
    // Close modal on outside click
    document.querySelectorAll('.fixed.inset-0').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        });
    });
}

// ── 💾 SAVE FUNCTIONS ────────────────────────────────────
window.saveAsset = async function() {
    const data = {
        nama_asset: document.getElementById('assetName')?.value || '',
        kategori: document.getElementById('assetCategory')?.value || '',
        lokasi: document.getElementById('assetLocation')?.value || '',
        serial_number: document.getElementById('assetSerial')?.value || '',
        harga: parseFloat(document.getElementById('assetPrice')?.value) || 0,
        tanggal_beli: document.getElementById('assetDate')?.value || '',        kondisi: document.getElementById('assetCondition')?.value || 'baik',
        status: 'active',
        created_at: new Date().toISOString()
    };
    
    if (!data.nama_asset) {
        showToast('⚠️ Nama asset wajib diisi', 'warning');
        return;
    }
    
    try {
        const { error } = await supabase.from('assets').insert([data]);
        if (error) throw error;
        
        showToast('✅ Asset disimpan', 'success');
        window.closeAssetModal();
        await loadAssets();
        updateStats();
        
    } catch (err) {
        console.error('[ASSET] Save error:', err);
        showToast('❌ Gagal: ' + err.message, 'error');
    }
};

window.saveInventory = async function() {
    const data = {
        nama_barang: document.getElementById('invName')?.value || '',
        kategori: document.getElementById('invCategory')?.value || '',
        jumlah: parseInt(document.getElementById('invQty')?.value) || 0,
        satuan: document.getElementById('invUnit')?.value || '',
        minimal_stok: parseInt(document.getElementById('invMin')?.value) || 0,
        lokasi_rak: document.getElementById('invLocation')?.value || '',
        created_at: new Date().toISOString()
    };
    
    if (!data.nama_barang) {
        showToast('⚠️ Nama barang wajib diisi', 'warning');
        return;
    }
    
    try {
        const { error } = await supabase.from('inventory').insert([data]);
        if (error) throw error;
        
        showToast('✅ Inventory disimpan', 'success');
        window.closeInventoryModal();
        await loadInventory();
        updateStats();
            } catch (err) {
        console.error('[INVENTORY] Save error:', err);
        showToast('❌ Gagal: ' + err.message, 'error');
    }
};

// ── 🖼️ QR & EXPORT FUNCTIONS ─────────────────────────────
window.showQR = function(id, name) {
    // Can be enhanced with QR code library
    alert(`📱 QR Code Asset\n\nID: ${id}\nName: ${name}\n\n(Fitur QR lengkap coming soon!)`);
};

window.exportCSV = function() {
    let csv = 'Type,Name,Category,Location,Status/Qty,Value\n';
    
    assets.forEach(a => {
        csv += `Asset,${a.nama_asset || a.nama_barang || ''},${a.kategori || ''},${a.lokasi || ''},${a.kondisi || ''},${a.harga || 0}\n`;
    });
    
    inventory.forEach(i => {
        csv += `Inventory,${i.nama_barang},${i.kategori || ''},${i.lokasi_rak || ''},${i.jumlah},-\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asset_inventory_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('✅ CSV exported', 'success');
};

window.printQR = function() {
    if (!assets.length) {
        showToast('⚠️ Data asset kosong!', 'warning');
        return;
    }
    
    const printWin = window.open('', '_blank');
    printWin.document.write(`
        <html>
        <head>
            <title>Cetak QR Asset</title>
            <style>
                body { font-family: monospace; display: flex; flex-wrap: wrap; gap: 20px; padding: 20px; }
                .card { border: 1px solid #000; padding: 10px; width: 200px; text-align: center; }
                .qr { width: 120px; height: 120px; margin: 5px auto; }
                .no-print { position: fixed; top: 10px; right: 10px; }                @media print { .no-print { display: none; } }
            </style>
        </head>
        <body>
            <button class="no-print" onclick="window.print()">🖨️ Print</button>
            <button class="no-print" onclick="window.close()" style="margin-left:10px">❌ Close</button>
    `);
    
    assets.forEach(a => {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=ASSET-${a.id}`;
        printWin.document.write(`
            <div class="card">
                <div style="font-size:10px">ID: ${a.id}</div>
                <img src="${qrUrl}" class="qr" alt="QR">
                <div style="font-weight:bold">${a.nama_asset || a.nama_barang || ''}</div>
                <div style="font-size:10px">${a.lokasi || ''}</div>
            </div>
        `);
    });
    
    printWin.document.write('</body></html>');
    printWin.document.close();
    
    showToast('🖨️ Print window opened', 'success');
};

// ── 🪟 MODAL CONTROL ─────────────────────────────────────
window.openAssetModal = function() {
    const modal = document.getElementById('assetModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
};

window.closeAssetModal = function() {
    const modal = document.getElementById('assetModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    // Reset form
    document.querySelectorAll('#assetModal input').forEach(i => i.value = '');
};

window.openInventoryModal = function() {
    const modal = document.getElementById('inventoryModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');    }
};

window.closeInventoryModal = function() {
    const modal = document.getElementById('inventoryModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    // Reset form
    document.querySelectorAll('#inventoryModal input').forEach(i => i.value = '');
};

// ── 🎯 AUTO-INIT ─────────────────────────────────────────
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

console.log('[ASSET] Module.js loaded successfully ✅');
