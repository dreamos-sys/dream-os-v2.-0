import { api } from '../../core/api.js';
import { showToast } from '../../core/components.js';

export function init() {
    console.log('📅 Modul Booking dimuat');

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
    const WORK_HOURS = { start: 7.5, end: 16.0 };
    const FRIDAY_BLOCKED = ["Aula SMP", "Serbaguna"];
    const FRIDAY_BLOCK_START = 10.5;
    const FRIDAY_BLOCK_END = 13.0;
    const MASJID = "Masjid (Maintenance)";

    function timeToNumber(t) {
        const [h, m] = t.split(':').map(Number);
        return h + m / 60;
    }

    function isWeekend(dateStr) {
        const day = new Date(dateStr + 'T00:00:00').getDay();
        return day === 0; // Minggu
    }

    function isFriday(dateStr) {
        return new Date(dateStr + 'T00:00:00').getDay() === 5;
    }

    function getMinDate() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    }

    // ========== INIT DROPDOWN ==========
    const saranaSelect = document.getElementById('sarana');
    if (saranaSelect) {
        saranaSelect.innerHTML = saranaList.map(s => `<option value="${s}">${s}</option>`).join('');
    }

    // ========== SET TANGGAL MIN ==========
    const tglInput = document.getElementById('tgl');
    if (tglInput) {
        tglInput.setAttribute('min', getMinDate());
        tglInput.value = getMinDate();
    }

    const form = document.getElementById('bookingForm');
    if (!form) {
        console.error('❌ Form tidak ditemukan!');
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('✅ Submit triggered');

        const formData = new FormData(e.target);
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

        console.log('Data form:', data);

        // ========== VALIDASI ==========
        if (!data.nama || !data.sarana || !data.tgl || !data.jam_mulai || !data.jam_selesai) {
            document.getElementById('form-result').innerHTML = '<span class="text-red-500">Lengkapi data wajib!</span>';
            return;
        }

        if (data.tgl < getMinDate()) {
            document.getElementById('form-result').innerHTML = '<span class="text-red-500">Booking minimal sehari sebelumnya!</span>';
            return;
        }

        if (isWeekend(data.tgl)) {
            document.getElementById('form-result').innerHTML = '<span class="text-red-500">Minggu tidak ada pelayanan.</span>';
            return;
        }

        if (data.sarana === MASJID) {
            document.getElementById('form-result').innerHTML = '<span class="text-red-500">Masjid tidak tersedia.</span>';
            return;
        }

        const mulai = timeToNumber(data.jam_mulai);
        const selesai = timeToNumber(data.jam_selesai);
        if (mulai < WORK_HOURS.start || selesai > WORK_HOURS.end || selesai <= mulai) {
            document.getElementById('form-result').innerHTML = `<span class="text-red-500">Jam harus 07:30-16:00 dan selesai > mulai.</span>`;
            return;
        }

        if (isFriday(data.tgl) && FRIDAY_BLOCKED.includes(data.sarana)) {
            if (mulai < FRIDAY_BLOCK_END && selesai > FRIDAY_BLOCK_START) {
                document.getElementById('form-result').innerHTML = `<span class="text-red-500">${data.sarana} tidak tersedia Jumat 10:30-13:00.</span>`;
                return;
            }
        }

        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';

        try {
            // ===== CEK BENTROK =====
            console.log('Cek bentrok...');
            const existing = await api.query('bookings', {
                ruang: data.sarana,
                tanggal: data.tgl,
                status: 'approved'
            });
            console.log('Data existing:', existing);

            const bentrok = existing.some(b => {
                const bMulai = timeToNumber(b.jam_mulai);
                const bSelesai = timeToNumber(b.jam_selesai);
                return mulai < bSelesai && selesai > bMulai;
            });

            if (bentrok) {
                document.getElementById('form-result').innerHTML = '<span class="text-red-500">Jadwal bentrok!</span>';
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i> AJUKAN BOOKING';
                return;
            }

            // ===== SIMPAN =====
            console.log('Menyimpan booking...');
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

            const result = await api.create('bookings', payload);
            console.log('Insert sukses:', result);

            document.getElementById('form-result').innerHTML = '<span class="text-green-500">✅ Booking berhasil!</span>';
            showToast('Booking berhasil', 'success');
            form.reset();
            tglInput.value = getMinDate();

        } catch (err) {
            console.error('❌ Error saat proses:', err);
            document.getElementById('form-result').innerHTML = `<span class="text-red-500">❌ Gagal: ${err.message}</span>`;
            showToast('Gagal: ' + err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i> AJUKAN BOOKING';
        }
    });
}
