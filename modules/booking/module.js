import { supabase } from '../../core/supabase.js';
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

    document.getElementById('bookingForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        const { error } = await supabase.from('bookings').insert([{
            nama_peminjam: data.nama,
            ruang: data.sarana,
            tanggal: data.tgl,
            jam_mulai: data.jam_mulai,
            jam_selesai: data.jam_selesai,
            keperluan: data.keperluan,
            status: 'pending'
        }]);

        const resultDiv = document.getElementById('form-result');
        if (error) {
            resultDiv.innerHTML = `<span class="text-red-500">❌ ${error.message}</span>`;
            showToast('Gagal menyimpan booking', 'error');
        } else {
            resultDiv.innerHTML = '<span class="text-green-500">✅ Booking berhasil diajukan!</span>';
            showToast('Booking berhasil', 'success');
            e.target.reset();
        }
    });
}
