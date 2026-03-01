// generate-modules.js
// Jalankan dengan: node generate-modules.js

const fs = require('fs');
const path = require('path');

// Daftar modul yang akan dibuat
const modules = [
    { id: 'booking', name: 'BOOKING', icon: '📅', table: 'bookings' },
    { id: 'k3', name: 'K3', icon: '⚠️', table: 'k3_reports' },
    { id: 'dana', name: 'DANA', icon: '💰', table: 'pengajuan_dana' },
    { id: 'stok', name: 'STOK', icon: '📦', table: 'inventory' },
    { id: 'maintenance', name: 'MAINTENANCE', icon: '🔧', table: 'maintenance_tasks' },
    { id: 'asset', name: 'ASSET', icon: '🏢', table: 'assets' },
    { id: 'sekuriti', name: 'SEKURITI', icon: '🛡️', table: 'security_reports' },
    { id: 'janitor-indoor', name: 'JANITOR IN', icon: '🧹', table: 'janitor_indoor' },
    { id: 'janitor-outdoor', name: 'JANITOR OUT', icon: '🌿', table: 'janitor_outdoor' },
    { id: 'files', name: 'FILES', icon: '📁', table: null }, // khusus file manager
    { id: 'backup', name: 'BACKUP', icon: '💾', table: null } // khusus backup
];

// Template module.js (contoh dari booking)
function getModuleTemplate(moduleId, moduleName, tableName) {
    const isDataModule = tableName !== null;
    return `/**
 * DREAM OS v13.5 - SUBMODULE: ${moduleName}
 * Bismillah bi idznillah.
 */
import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';

export async function init() {
    const area = document.getElementById('content-area');
    if (!area) return;

    // Render struktur dasar
    area.innerHTML = \`
        <div class="submodule-header" style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
            <button onclick="window.loadModule('commandcenter')" class="btn-crystal" style="background: rgba(255,255,255,0.1); border: none; padding: 0.5rem 1rem; border-radius: 12px;">
                ⬅️ Kembali
            </button>
            <h3 class="crystal-text" style="margin:0;">${moduleIcon} Daftar ${moduleName} Pending</h3>
        </div>
        <div id="${moduleId}-list" class="list-container" style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div class="text-center py-8 opacity-60 crystal-text">Memuat data...</div>
        </div>
    \`;

    ${isDataModule ? `await fetch${capitalize(moduleId)}();` : '// Modul ini tidak mengambil data dari tabel (khusus upload/backup)'}
}

${isDataModule ? `
async function fetch${capitalize(moduleId)}() {
    const container = document.getElementById('${moduleId}-list');
    try {
        const { data, error } = await supabase
            .from('${tableName}')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<p class="empty-state crystal-text text-center py-4">Alhamdulillah, tidak ada antrean.</p>';
            return;
        }

        container.innerHTML = data.map(item => \`
            <div class="glass-card p-3" style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong class="crystal-text">\${item.nama_kegiatan || item.judul || '-'}</strong>
                    <p class="text-xs opacity-70 crystal-text">\${new Date(item.created_at).toLocaleString('id-ID')}</p>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="handleApprove('\${item.id}', '${moduleId}', 'approved')" class="btn-approve" style="background: rgba(16,185,129,0.2); border: 1px solid var(--emerald); border-radius: 8px; padding: 0.3rem 0.8rem; color: var(--emerald);">Setujui</button>
                    <button onclick="handleApprove('\${item.id}', '${moduleId}', 'rejected')" class="btn-reject" style="background: rgba(239,68,68,0.2); border: 1px solid #ef4444; border-radius: 8px; padding: 0.3rem 0.8rem; color: #ef4444;">Tolak</button>
                </div>
            </div>
        \`).join('');
    } catch (err) {
        container.innerHTML = '<p class="text-red-400 crystal-text">❌ Gagal memuat data</p>';
        showToast(err.message, 'error');
    }
}
` : ''}

// Global function untuk approval (ditempel di window)
window.handleApprove = async (id, module, status) => {
    showToast('Memproses keputusan Bapak Hanung...', 'info');
    const tableMap = {
        booking: 'bookings',
        k3: 'k3_reports',
        dana: 'pengajuan_dana',
        maintenance: 'maintenance_tasks',
        stok: 'inventory',
        asset: 'assets',
        sekuriti: 'security_reports',
        'janitor-indoor': 'janitor_indoor',
        'janitor-outdoor': 'janitor_outdoor'
    };
    const table = tableMap[module];
    if (!table) return;

    const { error } = await supabase
        .from(table)
        .update({ 
            status: status, 
            approved_by: 'Hanung Budianto S. E',
            updated_at: new Date() 
        })
        .eq('id', id);

    if (!error) {
        showToast(\`✅ Berhasil di-\${status}!\`, 'success');
        // Refresh daftar
        if (module === 'booking') fetchBooking();
        else if (module === 'k3') fetchK3();
        else if (module === 'dana') fetchDana();
        // ... tambahkan sesuai kebutuhan
    } else {
        showToast('❌ Gagal: ' + error.message, 'error');
    }
};
`;
}

// Helper untuk kapitalisasi
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

// Buat folder dan file
modules.forEach(mod => {
    const folderPath = path.join(__dirname, 'modules', mod.id);
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
        console.log(`📁 Folder dibuat: modules/${mod.id}`);
    }
    const filePath = path.join(folderPath, 'module.js');
    const content = getModuleTemplate(mod.id, mod.name, mod.table);
    fs.writeFileSync(filePath, content);
    console.log(`📄 File dibuat: modules/${mod.id}/module.js`);
});

console.log('\n✅ SEMUA SUBMODUL BERHASIL DIGENERATE!');
console.log('Sekarang tinggal isi logika spesifik masing-masing modul (misalnya field yang ditampilkan).');
console.log('Jalankan perintah: node generate-modules.js');
