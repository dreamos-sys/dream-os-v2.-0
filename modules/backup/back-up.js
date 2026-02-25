import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';

export async function init() {
    console.log('💾 Modul Backup dimuat');
    loadBackupList();
}

function loadBackupList() {
    const list = JSON.parse(localStorage.getItem('dreamos_backups') || '[]');
    const container = document.getElementById('backup-list');
    if (list.length === 0) {
        container.innerHTML = '<p class="text-slate-400">Belum ada backup</p>';
        return;
    }
    container.innerHTML = list.map((b, i) => `
        <div class="flex justify-between items-center bg-slate-700 p-3 rounded-xl">
            <span class="text-xs">${new Date(b.timestamp).toLocaleString('id-ID')}</span>
            <div class="flex gap-2">
                <button onclick="restoreBackup(${i})" class="bg-blue-600 px-3 py-1 rounded text-[10px]">🔄 Restore</button>
                <button onclick="deleteBackup(${i})" class="bg-red-600 px-3 py-1 rounded text-[10px]">🗑️</button>
            </div>
        </div>
    `).join('');
}

window.createBackup = async function() {
    try {
        // Ambil semua data dari tabel penting
        const tables = ['bookings', 'k3_reports', 'pengajuan_dana', 'assets', 'inventory', 'janitor_indoor', 'janitor_outdoor', 'maintenance_tasks', 'sekuriti_reports'];
        const backup = {};
        for (const table of tables) {
            const { data } = await supabase.from(table).select('*');
            backup[table] = data || [];
        }
        backup.timestamp = new Date().toISOString();

        const backups = JSON.parse(localStorage.getItem('dreamos_backups') || '[]');
        backups.push(backup);
        localStorage.setItem('dreamos_backups', JSON.stringify(backups));
        showToast('Backup berhasil dibuat', 'success');
        loadBackupList();
    } catch (err) {
        showToast('Gagal backup: ' + err.message, 'error');
    }
};

window.restoreBackup = function(index) {
    if (!confirm('Timpa data sekarang?')) return;
    const backups = JSON.parse(localStorage.getItem('dreamos_backups') || '[]');
    const backup = backups[index];
    if (!backup) return;
    // Implementasi restore (bisa dengan mengirim ke Supabase)
    alert('Fitur restore belum diimplementasikan (demo)');
};

window.deleteBackup = function(index) {
    if (!confirm('Hapus backup ini?')) return;
    const backups = JSON.parse(localStorage.getItem('dreamos_backups') || '[]');
    backups.splice(index, 1);
    localStorage.setItem('dreamos_backups', JSON.stringify(backups));
    showToast('Backup dihapus', 'success');
    loadBackupList();
};
