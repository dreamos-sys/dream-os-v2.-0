// modules/approval/module.js
import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';
import { eventBus } from '../../core/eventBus.js';

export async function init() {
    console.log('✅ Modul Approval dimuat');

    const area = document.getElementById('module-content');
    if (!area) return;

    // Render struktur HTML
    area.innerHTML = `
        <div class="submodule-header" style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
            <button onclick="window.loadModule('commandcenter')" class="btn-crystal" style="background: rgba(255,255,255,0.1); border: none; padding: 0.5rem 1rem; border-radius: 12px; cursor: pointer;">
                ⬅️ Kembali
            </button>
            <h3 class="crystal-text" style="margin:0;">✅ Approval</h3>
        </div>

        <div class="space-y-4">
            <div class="glass-card p-3">
                <h4 class="text-md font-bold mb-2 crystal-text">📅 Booking Pending</h4>
                <div id="approval-booking" class="space-y-2"></div>
            </div>
            <div class="glass-card p-3">
                <h4 class="text-md font-bold mb-2 crystal-text">⚠️ K3 Pending</h4>
                <div id="approval-k3" class="space-y-2"></div>
            </div>
            <div class="glass-card p-3">
                <h4 class="text-md font-bold mb-2 crystal-text">💰 Dana Pending</h4>
                <div id="approval-dana" class="space-y-2"></div>
            </div>
        </div>
    `;

    await loadApprovals();
}

async function loadApprovals() {
    try {
        // Booking pending
        const { data: bookings } = await supabase
            .from('bookings')
            .select('id, nama_peminjam, ruang, tanggal, jam_mulai')
            .eq('status', 'pending')
            .limit(10);
        const bookingDiv = document.getElementById('approval-booking');
        if (bookings?.length) {
            bookingDiv.innerHTML = bookings.map(b => `
                <div class="flex justify-between items-center bg-slate-700 p-3 rounded-xl">
                    <span class="text-xs">📅 ${b.tanggal} ${b.jam_mulai} - ${b.nama_peminjam} (${b.ruang})</span>
                    <div class="flex gap-2">
                        <button onclick="updateBookingStatus('${b.id}', 'approved')" class="bg-green-600 px-3 py-1 rounded text-[10px]">✓ Setujui</button>
                        <button onclick="updateBookingStatus('${b.id}', 'rejected')" class="bg-red-600 px-3 py-1 rounded text-[10px]">✗ Tolak</button>
                    </div>
                </div>
            `).join('');
        } else {
            bookingDiv.innerHTML = '<p class="text-slate-400">Tidak ada pending booking</p>';
        }

        // K3 pending
        const { data: k3 } = await supabase
            .from('k3_reports')
            .select('id, tanggal, lokasi, jenis_laporan, pelapor')
            .eq('status', 'pending')
            .limit(10);
        const k3Div = document.getElementById('approval-k3');
        if (k3?.length) {
            k3Div.innerHTML = k3.map(k => `
                <div class="flex justify-between items-center bg-slate-700 p-3 rounded-xl">
                    <span class="text-xs">⚠️ ${k.tanggal} - ${k.lokasi} (${k.jenis_laporan}) - ${k.pelapor}</span>
                    <button onclick="updateK3Status('${k.id}', 'verified')" class="bg-blue-600 px-3 py-1 rounded text-[10px]">Verifikasi</button>
                </div>
            `).join('');
        } else {
            k3Div.innerHTML = '<p class="text-slate-400">Tidak ada pending K3</p>';
        }

        // Dana pending
        const { data: dana } = await supabase
            .from('pengajuan_dana')
            .select('id, judul, nominal, pengaju')
            .eq('status', 'pending')
            .limit(10);
        const danaDiv = document.getElementById('approval-dana');
        if (dana?.length) {
            danaDiv.innerHTML = dana.map(d => `
                <div class="flex justify-between items-center bg-slate-700 p-3 rounded-xl">
                    <span class="text-xs">💰 ${d.judul} - Rp ${Number(d.nominal).toLocaleString()} (${d.pengaju})</span>
                    <div class="flex gap-2">
                        <button onclick="updateDanaStatus('${d.id}', 'disetujui')" class="bg-green-600 px-3 py-1 rounded text-[10px]">✓ Setujui</button>
                        <button onclick="updateDanaStatus('${d.id}', 'ditolak')" class="bg-red-600 px-3 py-1 rounded text-[10px]">✗ Tolak</button>
                    </div>
                </div>
            `).join('');
        } else {
            danaDiv.innerHTML = '<p class="text-slate-400">Tidak ada pengajuan dana</p>';
        }
    } catch (err) {
        console.error(err);
        showToast('Gagal memuat approval', 'error');
    }
}

// ===== FUNGSI GLOBAL UNTUK TOMBOL =====
window.updateBookingStatus = async (id, status) => {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (error) {
        showToast('Gagal update', 'error');
    } else {
        showToast(`Booking ${status}`, 'success');
        loadApprovals();
        eventBus.emit('stats-update'); // beri tahu command center
    }
};

window.updateK3Status = async (id, status) => {
    const { error } = await supabase.from('k3_reports').update({ status }).eq('id', id);
    if (error) {
        showToast('Gagal update', 'error');
    } else {
        showToast(`K3 ${status}`, 'success');
        loadApprovals();
        eventBus.emit('stats-update');
    }
};

window.updateDanaStatus = async (id, status) => {
    const { error } = await supabase.from('pengajuan_dana').update({ status }).eq('id', id);
    if (error) {
        showToast('Gagal update', 'error');
    } else {
        showToast(`Dana ${status}`, 'success');
        loadApprovals();
        eventBus.emit('stats-update');
    }
};
