import { api } from '../../core/api.js';
import { showToast } from '../../core/components.js';

export function init() {
    console.log('Modul Booking dimuat');

    // ========== DATA SARANA ==========
    const saranaList = [
        "Aula SMP", "Aula SMA", "Saung Besar", "Saung Kecil",
        "Masjid (Maintenance)", "Mushalla SMA", "Serbaguna",
        "Lapangan Basket", "Lapangan Volly", "Lapangan Tanah",
        "Lapangan SMA", "Kantin SMP", "Kantin SMA",
        "Labkom SD", "Labkom SMP", "Labkom SMA",
        "Perpustakaan SD", "Perpustakaan SMP", "Perpustakaan SMA"
    ];

    // ========== ATURAN ==========
    const WORK_HOURS = { start: 7.5, end: 16.0 }; // 07:30 - 16:00
    const FRIDAY_BLOCKED = ["Aula SMP", "Serbaguna"]; // ruangan yang diblokir Jumat 10:30-13:00
    const FRIDAY_BLOCK_START = 10.5; // 10:30
    const FRIDAY_BLOCK_END = 13.0;   // 13:00
    const MASJID = "Masjid (Maintenance)"; // tidak boleh dipinjam sama sekali

    // Helper: konversi jam ke angka desimal
    function timeToNumber(t) {
        const [h, m] = t.split(':').map(Number);
        return h + m / 60;
    }

    // Helper: cek apakah hari Sabtu atau Minggu
    function isWeekend(dateStr) {
        const day = new Date(dateStr + 'T00:00:00').getDay();
        return day === 0; // 0 = Minggu, 6 = Sabtu
    }
    function isFriday(dateStr) {
        return new Date(dateStr + 'T00:00:00').getDay() === 5;
    }
    function isSaturday(dateStr) {
        return new Date(dateStr + 'T00:00:00').getDay() === 6;
    }

    // Helper: minimal booking H-1
    function getMinDate() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    }

    // ========== INIT DROPDOWN SARANA ==========
    const saranaSelect = document.getElementById('sarana');
    if (saranaSelect) {
        saranaSelect.innerHTML = saranaList.map(s => `<option value="${s}">${s}</option>`).join('');
    }

    // ========== SET MIN TANGGAL = H+1 ==========
    const tglInput = document.getElementById('tgl');
    if (tglInput) {
        tglInput.setAttribute('min', getMinDate());
        tglInput.value = getMinDate(); // default ke besok
    }

    // ========== HANDLE SUBMIT ==========
    const form = document.getElementById('bookingForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        // Kumpulkan alat yang dicentang
        const alat = formData.getAll('alat');
        const data = {
            nama: formData.get('nama'),
            divisi: formData.get('divisi'),
            no_hp: formData.get('no_hp'),
            sarana: formData.get('sarana'),
            tgl: formData.get('tgl'),
            jam_mulai: formData.get('jam_mulai'),
            jam_selesai: formData.get('jam_selesai'),
            peralatan: alat.join(', '),
            keperluan: formData.get('keperluan')
        };

        // ========== VALIDASI DASAR ==========
        if (!data.nama || !data.sarana || !data.tgl || !data.jam_mulai || !data.jam_selesai) {
            document.getElementById('form-result').innerHTML = '<span class="text-red-500">Nama, Sarana, Tanggal, Jam Mulai, dan Jam Selesai wajib diisi!</span>';
            return;
        }

        // ========== VALIDASI TANGGAL MINIMAL ==========
        if (data.tgl < getMinDate()) {
            document.getElementById('form-result').innerHTML = '<span class="text-red-500">Booking minimal sehari sebelumnya!</span>';
            return;
        }

        // ========== VALIDASI HARI MINGGU ==========
        if (isWeekend(data.tgl)) {
            document.getElementById('form-result').innerHTML = '<span class="text-red-500">Minggu tidak ada pelayanan booking.</span>';
            return;
        }

        // ========== VALIDASI SABTU (opsional, jika diperlukan bisa ditambahkan) ==========
        // Misal Sabtu hanya sampai jam 12 siang? Sesuaikan kebutuhan
        // if (isSaturday(data.tgl) && timeToNumber(data.jam_selesai) > 12) { ... }

        // ========== VALIDASI MASJID (tidak boleh booking) ==========
        if (data.sarana === MASJID) {
            document.getElementById('form-result').innerHTML = '<span class="text-red-500">Masjid tidak tersedia untuk peminjaman.</span>';
            return;
        }

        // ========== VALIDASI JAM KERJA 07:30 - 16:00 ==========
        const mulai = timeToNumber(data.jam_mulai);
        const selesai = timeToNumber(data.jam_selesai);
        if (mulai < WORK_HOURS.start || selesai > WORK_HOURS.end || selesai <= mulai) {
            document.getElementById('form-result').innerHTML = `<span class="text-red-500">Jam harus antara 07:30 - 16:00, dan selesai setelah mulai.</span>`;
            return;
        }

        // ========== VALIDASI JUMAT UNTUK RUANGAN TERTENTU ==========
        if (isFriday(data.tgl) && FRIDAY_BLOCKED.includes(data.sarana)) {
            if (mulai < FRIDAY_BLOCK_END && selesai > FRIDAY_BLOCK_START) {
                document.getElementById('form-result').innerHTML = `<span class="text-red-500">${data.sarana} tidak tersedia setiap Jumat pukul 10:30 - 13:00 untuk Shalat Jumat.</span>`;
                return;
            }
        }

        // ========== CEK BENTROK DENGAN BOOKING LAIN ==========
        const { data: existing, error } = await api.query('bookings', {
            ruang: data.sarana,
            tanggal: data.tgl,
            status: 'approved'
        });

        if (error) throw error;

        const bentrok = existing.some(b => {
            const bMulai = timeToNumber(b.jam_mulai);
            const bSelesai = timeToNumber(b.jam_selesai);
            return mulai < bSelesai && selesai > bMulai;
        });

        if (bentrok) {
            document.getElementById('form-result').innerHTML = '<span class="text-red-500">Jadwal bentrok dengan booking lain yang sudah disetujui.</span>';
            return;
        }

        // ========== SIMPAN BOOKING ==========
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';

        try {
            const payload = {
                nama_peminjam: data.nama,
                divisi: data.divisi || null,
                no_hp: data.no_hp || null,
                ruang: data.sarana,
                tanggal: data.tgl,
                jam_mulai: data.jam_mulai,
                jam_selesai: data.jam_selesai,
                keperluan: data.keperluan || null,
                peralatan: data.peralatan,
                status: 'pending',
                created_at: new Date().toISOString()
            };

            await api.create('bookings', payload);

            document.getElementById('form-result').innerHTML = '<span class="text-green-500">✅ Booking berhasil diajukan!</span>';
            showToast('Booking berhasil', 'success');
            form.reset();
            // reset tanggal ke besok lagi
            tglInput.value = getMinDate();
        } catch (err) {
            console.error(err);
            document.getElementById('form-result').innerHTML = `<span class="text-red-500">❌ Gagal: ${err.message}</span>`;
            showToast('Gagal booking', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i> AJUKAN BOOKING';
        }
    });
}
