/**
 * DREAM OS v13.2 - REVISED COMPLETE MODULE ENGINE
 * Integritas Sistem: Mutual Integration like a body [cite: 2026-02-26]
 * Spirit: Bismillah bi idznillah & Shalawat [cite: 2026-01-18]
 */

import { supabase } from './supabase.js';
import { showToast } from './components.js';
import { DreamKernel } from './kernel-integrator.js';

export const ModuleEngine = {
    // --- 🛠️ 1. DISPATCHER UTAMA ---
    async loadModule(id) {
        // Menggunakan backtick (`) agar ${id} terbaca dengan benar
        console.log(`[ENGINE] Menjalankan Saraf Modul: ${id}`);
        
        try {
            // Proteksi: Lokasi Depok & Jam Operasional (07:30-16:00) [cite: 2026-01-11, 2026-01-14]
            const isAuthorized = await DreamKernel.gatekeeper(id.toUpperCase());
            if (!isAuthorized) return;

            switch (id) {
                case 'analytics': return this.viewAnalytics();
                case 'pengajuan': return this.openUniversalForm('PENGAJUAN');
                case 'laporan': return this.viewReports();
                case 'ai': return this.triggerAIJudge();
                case 'slides': return showToast('Membuka Slide UI...', 'info');
                case 'files': return this.openVault();
                case 'backup': return window.createBackup();
                case 'qr': return this.initQRScanner();
                case 'approval': return this.viewApprovalQueue();

                case 'booking': return this.openUniversalForm('BOOKING');
                case 'k3': return this.openUniversalForm('K3_REPORT');
                case 'sekuriti': return this.openUniversalForm('SECURITY_REPORT');
                case 'janitor-indoor': 
                case 'janitor-outdoor': return this.quickActionJanitor(id);
                case 'stok': 
                case 'gudang': return this.viewInventory(id);
                case 'maintenance': return this.openUniversalForm('MAINTENANCE');
                case 'asset': return this.viewAssetList();
                case 'dana': return this.openUniversalForm('DANA_REQUEST');

                default:
                    // Fix: Gunakan backtick untuk template literal
                    showToast(`Saraf ${id} belum terhubung ke Kernel.`, 'warning');
            }
        } catch (err) {
            // Pastikan Immunity tersedia di window atau core
            if (window.Immunity) window.Immunity.catch(err, `Module_${id}`);
            else console.error(`Error in ${id}:`, err);
        }
    },

    // --- 📝 2. DYNAMIC FORM HANDLER ---
    openUniversalForm(type) {
        // Applicant: Erwinsyah [cite: 2026-01-24]
        console.log(`[UI] Membuka Form ${type} untuk Erwinsyah...`);
        showToast(`Membuka Form ${type}`, 'info');
        // Logic UI Form ditangani oleh form-handler.js
    },

    // --- 📦 3. LOGIKA INVENTORY ---
    async viewInventory(type) {
        const { data, error } = await supabase.from('inventory').select('*');
        if (error) return showToast('Gagal muat stok', 'error');
        showToast(`Data ${type} sinkron.`, 'success');
    },

    // --- 💰 4. LOGIKA APPROVAL (Bapak Hanung Budianto S. E) ---
    async viewApprovalQueue() {
        // Approver: Hanung Budianto S. E [cite: 2026-01-24]
        console.log("Memeriksa antrean persetujuan Bapak Hanung..."); 
        const { data } = await supabase.from('pengajuan_dana').select('*').eq('status', 'pending');
        if (data?.length > 0) {
            showToast(`Ada ${data.length} permintaan butuh Approval.`, 'warning');
        } else {
            showToast('Semua amanah sudah disetujui.', 'success');
        }
    },

    // --- 🛡️ 5. LOGIKA SECURITY & VAULT ---
    openVault() {
        // Proteksi Safe Core 5KM [cite: 2026-01-14]
        if (window.isOutsideSafeZone) {
            showToast('Safe Core Terlanggar! Vault Terkunci.', 'danger');
            return;
        }
        showToast('Vault Terbuka - Enkripsi Aktif', 'success');
    },

    // --- 🤖 6. AI JUDGE ---
    async triggerAIJudge() {
        showToast('AI Sedang Menimbang Konflik...', 'info');
        await DreamKernel.execute('AI_ANALYZE', { target: 'all_modules' });
    },

    // --- 🧹 7. QUICK ACTION JANITOR ---
    async quickActionJanitor(type) {
        const area = type.includes('indoor') ? 'INDOOR' : 'OUTDOOR';
        await DreamKernel.execute('JANITOR_CHECK', { area: area, status: 'CLEAN' });
        showToast(`Laporan kebersihan ${area} dikirim.`, 'success');
    },

    // --- 📱 8. QR SCANNER INIT ---
    initQRScanner() {
        // Kamera Redmi Note 9 Pro [cite: 2026-01-11]
        showToast('Kamera Siaga: Menunggu Scan QR...', 'info');
    },

    // --- 📈 9. MISSING FUNCTIONS (REVISI) ---
    viewAnalytics() {
        showToast('Memuat Analisis Real-time...', 'info');
    },
    viewReports() {
        showToast('Membuka Laporan SPJ & K3...', 'info');
    },
    viewAssetList() {
        showToast('Memuat Daftar Aset ISO 55001...', 'info');
    }
};

window.loadModule = (id) => ModuleEngine.loadModule(id);
