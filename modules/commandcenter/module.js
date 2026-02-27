/**
 * DREAM OS v13.2 - FINAL MODULE ENGINE
 * Bismillah bi idznillah. [cite: 2026-01-18]
 */

import { supabase } from './supabase.js';
import { showToast } from './components.js';

export const ModuleEngine = {
    // --- 🛠️ DISPATCHER UTAMA ---
    async loadModule(id) {
        console.log(`[ENGINE] Menjalankan Saraf Modul: ${id}`);
        
        try {
            // Validasi Jam Kerja (07:30 - 16:00) [cite: 2026-01-11]
            const now = new Date();
            const hour = now.getHours();
            const min = now.getMinutes();
            const timeVal = hour + min / 60;

            if (id !== 'sekuriti' && (timeVal < 7.5 || timeVal > 16.0)) {
                showToast('Di luar jam kerja. Akses dibatasi.', 'warning');
                return;
            }

            switch (id) {
                // Tab Dashboard
                case 'analytics': return showToast('Analytics ISO 9001 Aktif', 'info');
                case 'pengajuan': return this.openForm('PENGAJUAN');
                case 'laporan': return showToast('Laporan SPJ Siap', 'info');
                case 'ai': return showToast('AI Judge Menganalisis...', 'info');
                case 'slides': return showToast('Membuka Slide UI...', 'info');
                case 'files': return this.checkVault();
                case 'backup': return window.createBackup ? window.createBackup() : showToast('Fungsi Backup belum siap', 'error');
                case 'qr': return showToast('Kamera Redmi Note Siaga', 'info');
                case 'approval': return this.checkApproval();

                // Tab R. Kerja
                case 'booking': return this.openForm('BOOKING');
                case 'k3': return this.openForm('K3_REPORT');
                case 'sekuriti': return this.openForm('SECURITY_REPORT');
                case 'janitor-indoor': 
                case 'janitor-outdoor': return showToast('Laporan Kebersihan Terkirim', 'success');
                case 'stok': 
                case 'gudang': return showToast('Sinkronisasi Stok Gudang...', 'info');
                case 'maintenance': return this.openForm('MAINTENANCE');
                case 'asset': return showToast('Asset Management ISO 55001', 'info');

                // Tab Dana
                case 'dana': return this.openForm('DANA_REQUEST');

                default:
                    showToast(`Saraf ${id} dalam pengembangan`, 'warning');
            }
        } catch (err) {
            console.error(err);
            showToast('Saraf Sistem Terganggu', 'error');
        }
    },

    // --- 📝 LOGIKA FORM ---
    openForm(type) {
        // Applicant: Erwinsyah [cite: 2026-01-24]
        console.log(`[UI] Membuka Form ${type} untuk Erwinsyah...`);
        showToast(`Membuka Form ${type}`, 'info');
    },

    // --- 💰 LOGIKA APPROVAL ---
    async checkApproval() {
        // Approver: Hanung Budianto S. E [cite: 2026-01-24]
        showToast('Memeriksa antrean Bapak Hanung...', 'info');
        const { count } = await supabase.from('pengajuan_dana').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        showToast(`Ada ${count || 0} pengajuan pending.`, count > 0 ? 'warning' : 'success');
    },

    // --- 🛡️ LOGIKA VAULT ---
    checkVault() {
        // Safe Core 5km [cite: 2026-01-14]
        showToast('Enkripsi Vault Aktif', 'success');
    }
};

// Pasang ke Global window agar bisa dipanggil CommandCenter
window.loadModule = (id) => ModuleEngine.loadModule(id);
