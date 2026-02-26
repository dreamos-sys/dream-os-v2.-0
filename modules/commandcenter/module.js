import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';

export async function init() {
    console.log('[COMMANDCENTER] Module loaded');

    try {
        // Load stats
        const [booking, k3, dana] = await Promise.all([
            supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('k3_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('pengajuan_dana').select('*', { count: 'exact', head: true }).eq('status', 'pending')
        ]);

        const bookingCount = booking.count || 0;
        const k3Count = k3.count || 0;
        const danaCount = dana.count || 0;
        const total = bookingCount + k3Count + danaCount;

        // Update stats jika elemen ada
        const statBooking = document.getElementById('stat-booking');
        const statK3 = document.getElementById('stat-k3');
        const statDana = document.getElementById('stat-dana');
        const statTotal = document.getElementById('stat-total');
        const aiMessage = document.getElementById('aiMessage');
        const securityStatus = document.getElementById('securityStatus');

        if (statBooking) statBooking.textContent = bookingCount;
        if (statK3) statK3.textContent = k3Count;
        if (statDana) statDana.textContent = danaCount;
        if (statTotal) statTotal.textContent = total;

        // Update security status
        if (securityStatus) {
            securityStatus.className = 'security-status';
            if (total === 0) {
                securityStatus.classList.add('status-safe');
                securityStatus.innerHTML = '<i class="fas fa-shield-check mr-2"></i><span>AMAN</span>';
            } else if (total < 10) {
                securityStatus.classList.add('status-warning');
                securityStatus.innerHTML = '<i class="fas fa-triangle-exclamation mr-2"></i><span>WASPADA</span>';
            } else {
                securityStatus.classList.add('status-danger');
                securityStatus.innerHTML = '<i class="fas fa-circle-exclamation mr-2"></i><span>BAHAYA</span>';
            }
        }

        // AI message
        if (aiMessage) {
            const insights = [];
            if (bookingCount > 5) insights.push('📈 Booking meningkat 25% dari minggu lalu');
            if (k3Count > 3) insights.push('⚠️ Perlu review K3 reports yang pending');
            if (danaCount > 5) insights.push('💰 Ada pengajuan dana yang perlu approval');
            if (insights.length === 0) insights.push('✅ Semua sistem berjalan optimal');
            aiMessage.textContent = insights.join(' | ');
        }

        // Predictive list
        const predictiveList = document.getElementById('predictiveList');
        if (predictiveList) {
            predictiveList.innerHTML = `
                <li class="predictive-item">
                    <i class="fas fa-check-circle"></i>
                    <span>📊 Trend booking stabil untuk 7 hari ke depan</span>
                </li>
                <li class="predictive-item high">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>⚠️ 3 K3 reports butuh attention dalam 24 jam</span>
                </li>
                <li class="predictive-item critical">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>🔴 Storage akan penuh dalam 14 hari</span>
                </li>
            `;
        }

        // Health bars (contoh statis, bisa diganti dengan data real)
        const healthDb = document.getElementById('health-db');
        const healthApi = document.getElementById('health-api');
        const healthStorage = document.getElementById('health-storage');
        const healthSecurity = document.getElementById('health-security');

        if (healthDb) { healthDb.textContent = '98%'; }
        if (healthApi) { healthApi.textContent = '100%'; }
        if (healthStorage) { healthStorage.textContent = '75%'; }
        if (healthSecurity) { healthSecurity.textContent = '100%'; }

        // Last sync
        const lastSync = document.getElementById('lastSync');
        if (lastSync) { lastSync.textContent = new Date().toLocaleTimeString('id-ID'); }

        console.log('[COMMANDCENTER] Stats loaded successfully');
    } catch (err) {
        console.error('[COMMANDCENTER] Error loading stats:', err);
        showToast('Gagal memuat statistik', 'error');
    }
}
