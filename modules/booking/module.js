import { supabase } from '../../core/supabase.js';
import { showToast } from '../../core/components.js';

export function init() {
    console.log('[BOOKING] Module loaded');
    
    // Populate sarana dropdown
    const saranaList = [
        "Aula SMP", "Aula SMA", "Saung Besar", "Saung Kecil",
        "Masjid", "Mushalla SMA", "Ruang Serbaguna",
        "Lapangan Basket", "Lapangan Volly", "Lapangan Tanah",
        "Kantin SMP", "Kantin SMA",
        "Labkom SD", "Labkom SMP", "Labkom SMA",
        "Perpustakaan SD", "Perpustakaan SMP", "Perpustakaan SMA"
    ];
    
    const saranaSelect = document.getElementById('sarana');
    if (saranaSelect) {
        saranaSelect.innerHTML = '<option value="">-- Pilih Sarana --</option>' +
            saranaList.map(s => `<option value="${s}">${s}</option>`).join('');
    }
    
    // Form submit handler
    document.getElementById('bookingForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = '⏳ Mengirim...';
        
        try {
            const { error } = await supabase
                .from('bookings')
                .insert([{
                    nama_peminjam: data.nama,
                    divisi: data.divisi || null,
                    no_hp: data.no_hp || null,
                    ruang: data.ruang,
                    tanggal: data.tanggal,
                    jam_mulai: data.jam_mulai,
                    jam_selesai: data.jam_selesai,
                    keperluan: data.keperluan || null,
                    peralatan: data.peralatan || null,
                    status: 'pending'
                }]);
            
            if (error) throw error;
            
            document.getElementById('form-result').innerHTML = 
                '<p class="text-green-500 font-bold">✅ Booking berhasil diajukan!</p>';
            showToast('Booking berhasil!', 'success');
            e.target.reset();
            
        } catch (err) {
            document.getElementById('form-result').innerHTML = 
                `<p class="text-red-500 font-bold">❌ ${err.message}</p>`;
            showToast('Gagal: ' + err.message, 'error');
            
        } finally {
            btn.disabled = false;
            btn.textContent = '📤 Ajukan Booking';
        }
    });
}
