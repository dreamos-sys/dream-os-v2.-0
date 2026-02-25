import { api } from '../../core/api.js';
import { showToast } from '../../core/components.js';

export function init() {
    console.log('Modul Booking dimuat');
    const saranaList = [
        "Aula SMP", "Aula SMA", "Saung Besar", "Saung Kecil",
        "Masjid (Maintenance)", "Mushalla SMA", "Serbaguna",
        "Lapangan Basket", "Lapangan Volly", "Lapangan Tanah",
        "Lapangan SMA", "Kantin SMP", "Kantin SMA",
        "Labkom SD", "Labkom SMP", "Labkom SMA",
        "Perpustakaan SD", "Perpustakaan SMP", "Perpustakaan SMA"
    ];
    const saranaSelect = document.getElementById('sarana');
    if (saranaSelect) {
        saranaSelect.innerHTML = saranaList.map(s => `<option value="${s}">${s}</option>`).join('');
    }

    document.getElementById('bookingForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        if (!data.nama || !data.sarana || !data.tgl || !data.jam_mulai || !data.jam_selesai) {
            document.getElementById('form-result').innerHTML = '<span class="text-red-500">Semua field wajib diisi!</span>';
            return;
        }

        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';

        try {
            const result = await api.create('bookings', {
                nama_peminjam: data.nama,
                ruang: data.sarana,
                tanggal: data.tgl,
                jam_mulai: data.jam_mulai,
                jam_selesai: data.jam_selesai,
                keperluan: data.keperluan || '',
                status: 'pending',
                created_at: new Date().toISOString()
            });

            document.getElementById('form-result').innerHTML = '<span class="text-green-500">✅ Booking berhasil diajukan!</span>';
            showToast('Booking berhasil', 'success');
            e.target.reset();
        } catch (err) {
            document.getElementById('form-result').innerHTML = `<span class="text-red-500">❌ Gagal: ${err.message}</span>`;
            showToast('Gagal booking', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'AJUKAN BOOKING';
        }
    });
}
