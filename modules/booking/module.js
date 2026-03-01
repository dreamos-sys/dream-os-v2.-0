// modules/booking/module.js
import { api } from '../../core/api.js';
import { showToast } from '../../core/components.js';
import { eventBus } from '../../core/eventBus.js';

export function init() {
    console.log('📅 Modul Booking dimuat');

    const area = document.getElementById('module-content');
    if (!area) return;

    area.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
            <button onclick="window.loadModule('commandcenter')" class="btn-crystal" style="background: rgba(255,255,255,0.1); border: none; padding: 0.5rem 1rem; border-radius: 12px; cursor: pointer;">
                ⬅️ Kembali
            </button>
            <h3 class="crystal-text" style="margin:0;">📅 Form Booking Sarana</h3>
        </div>

        <div class="max-w-4xl mx-auto p-4">
            <form id="bookingForm" class="space-y-4">
                <!-- Nama -->
                <div>
                    <label class="block text-sm text-slate-400 mb-2">Nama Pemohon</label>
                    <input type="text" name="nama" required class="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 focus:border-emerald-500 transition">
                </div>
                <!-- Divisi -->
                <div>
                    <label class="block text-sm text-slate-400 mb-2">Divisi</label>
                    <input type="text" name="divisi" class="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 focus:border-emerald-500 transition">
                </div>
                <!-- No HP -->
                <div>
                    <label class="block text-sm text-slate-400 mb-2">No HP</label>
                    <input type="tel" name="no_hp" class="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 focus:border-emerald-500 transition">
                </div>
                <!-- Sarana -->
                <div>
                    <label class="block text-sm text-slate-400 mb-2">Pilih Sarana</label>
                    <select name="sarana" id="sarana" required class="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 focus:border-emerald-500 transition">
                        <option value="">-- Pilih Sarana --</option>
                    </select>
                </div>
                <!-- Tanggal -->
                <div>
                    <label class="block text-sm text-slate-400 mb-2">Tanggal</label>
                    <input type="date" name="tgl" id="tgl" required class="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 focus:border-emerald-500 transition">
                </div>
                <!-- Jam -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm text-slate-400 mb-2">Jam Mulai</label>
                        <input type="time" name="jam_mulai" required class="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 focus:border-emerald-500 transition">
                    </div>
                    <div>
                        <label class="block text-sm text-slate-400 mb-2">Jam Selesai</label>
                        <input type="time" name="jam_selesai" required class="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 focus:border-emerald-500 transition">
                    </div>
                </div>
                <!-- Peralatan -->
                <div>
                    <label class="block text-sm text-slate-400 mb-2">Peralatan Tambahan</label>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-800/50 p-4 rounded-2xl">
                        <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="alat" value="Kursi Futura"> Kursi Futura</label>
                        <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="alat" value="Kursi Chitose"> Kursi Chitose</label>
                        <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="alat" value="Meja Siswa"> Meja Siswa</label>
                        <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="alat" value="Meja Panjang"> Meja Panjang</label>
                        <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="alat" value="Meja Oshin"> Meja Oshin</label>
                        <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="alat" value="Taplak Meja"> Taplak Meja</label>
                        <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="alat" value="Projektor"> Projektor</label>
                        <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="alat" value="Screen Projektor"> Screen Projektor</label>
                        <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="alat" value="TV"> TV</label>
                    </div>
                </div>
                <!-- Keperluan -->
                <div>
                    <label class="block text-sm text-slate-400 mb-2">Keperluan (opsional)</label>
                    <textarea name="keperluan" rows="2" class="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 focus:border-emerald-500 transition"></textarea>
                </div>
                <button type="submit" class="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white p-4 rounded-xl font-bold transition">
                    <i class="fas fa-paper-plane mr-2"></i> AJUKAN BOOKING
                </button>
            </form>
            <div id="form-result" class="mt-4 text-center text-sm"></div>
        </div>
    `;

    // Data sarana
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

    // Aturan jam
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
        return new Date(dateStr + 'T00:00:00').getDay() === 0;
    }

    function isFriday(dateStr) {
        return new Date(dateStr + 'T00:00:00').getDay() === 5;
    }

    function getMinDate() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    }

    const tglInput = document.getElementById('tgl');
    if (tglInput) {
        tglInput.setAttribute('min', getMinDate());
        tglInput.value = getMinDate();
    }

    const form = document.getElementById('bookingForm');
    const resultDiv = document.getElementById('form-result');

    function setResultMessage(html, isError = false) {
        if (resultDiv) resultDiv.innerHTML = html;
        else showToast(html.replace(/<[^>]*>/g, ''), isError ? 'error' : 'info');
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
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

        // Validasi
        if (!data.nama || !data.sarana || !data.tgl || !data.jam_mulai || !data.jam_selesai) {
            setResultMessage('<span class="text-red-500">Lengkapi data wajib!</span>', true);
            return;
        }
        if (data.tgl < getMinDate()) {
            setResultMessage('<span class="text-red-500">Booking minimal sehari sebelumnya!</span>', true);
            return;
        }
        if (isWeekend(data.tgl)) {
            setResultMessage('<span class="text-red-500">Minggu tidak ada pelayanan.</span>', true);
            return;
        }
        if (data.sarana === MASJID) {
            setResultMessage('<span class="text-red-500">Masjid tidak tersedia.</span>', true);
            return;
        }
        const mulai = timeToNumber(data.jam_mulai);
        const selesai = timeToNumber(data.jam_selesai);
        if (mulai < WORK_HOURS.start || selesai > WORK_HOURS.end || selesai <= mulai) {
            setResultMessage('<span class="text-red-500">Jam harus 07:30-16:00 dan selesai > mulai.</span>', true);
            return;
        }
        if (isFriday(data.tgl) && FRIDAY_BLOCKED.includes(data.sarana)) {
            if (mulai < FRIDAY_BLOCK_END && selesai > FRIDAY_BLOCK_START) {
                setResultMessage(`<span class="text-red-500">${data.sarana} tidak tersedia Jumat 10:30-13:00.</span>`, true);
                return;
            }
        }

        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';

        try {
            // Cek bentrok
            const existing = await api.query('bookings', {
                ruang: data.sarana,
                tanggal: data.tgl,
                status: 'approved'
            });
            const bentrok = existing.some(b => {
                const bMulai = timeToNumber(b.jam_mulai);
                const bSelesai = timeToNumber(b.jam_selesai);
                return mulai < bSelesai && selesai > bMulai;
            });
            if (bentrok) {
                setResultMessage('<span class="text-red-500">Jadwal bentrok!</span>', true);
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i> AJUKAN BOOKING';
                return;
            }

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
            setResultMessage('<span class="text-green-500">✅ Booking berhasil!</span>');
            showToast('Booking berhasil', 'success');
            form.reset();
            if (tglInput) tglInput.value = getMinDate();
            eventBus.emit('booking-created', { id: payload.id });
        } catch (err) {
            setResultMessage(`<span class="text-red-500">❌ Gagal: ${err.message}</span>`, true);
            showToast('Gagal: ' + err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i> AJUKAN BOOKING';
        }
    });
}
