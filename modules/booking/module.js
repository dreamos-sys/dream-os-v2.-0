// ═══════════════════════════════════════════════════════
// modules/booking/module.js - Form Booking Sarana
// Dream OS v2.0 | Smart Scheduling System
// ═══════════════════════════════════════════════════════

// Import dari core (sesuaikan path)
import { api } from '../../core/api.js';

// Fallback showToast jika nggak ada di core
function showToast(message, type = 'info') {
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
    } else {
        alert(message);
    }
}

export function init({ user, lang }) {
    console.log('📅 Modul Booking Initialized');
    
    const area = document.getElementById('module-content');
    if (!area) {
        console.error('❌ module-content not found!');
        return;
    }

    // ========== KONFIGURASI ==========
    const CONFIG = {
        WORK_HOURS: { start: 7.5, end: 16.0 }, // 07:30 - 16:00
        FRIDAY_BLOCK: { start: 10.5, end: 13.0 }, // Jumat 10:30-13:00
        FRIDAY_BLOCKED_ROOMS: ['Aula SMP', 'Serbaguna'],
        MIN_BOOKING_DAYS: 1, // Minimal H-1
        MAX_BOOKING_DAYS: 30, // Maksimal 30 hari ke depan
        SARANA_LIST: [
            "Aula SMP", "Aula SMA", "Saung Besar", "Saung Kecil",
            "Masjid (Maintenance)", "Mushalla SMA", "Serbaguna",
            "Lapangan Basket", "Lapangan Volly", "Lapangan Tanah",
            "Lapangan SMA", "Kantin SMP", "Kantin SMA",
            "Labkom SD", "Labkom SMP", "Labkom SMA",
            "Perpustakaan SD", "Perpustakaan SMP", "Perpustakaan SMA"
        ],
        // Tanggal merah 2026 (basic list - bisa ditambah)
        HOLIDAYS_2026: [
            '2026-01-01', // Tahun Baru
            '2026-01-27', // Isra Mi'raj
            '2026-03-20', // Maulid Nabi
            '2026-04-10', // Wafat Isa
            '2026-05-01', // Buruh
            '2026-05-21', // Kenaikan Isa
            '2026-06-01', // Pancasila            '2026-06-07', // Idul Fitri (1 Syawal 1447)
            '2026-06-08', // Idul Fitri (2 Syawal)
            '2026-08-17', // Kemerdekaan
            '2026-09-15', // Tahun Baru Islam
            '2026-11-24', // Maulid Nabi (alternate)
            '2026-12-25', // Natal
            '2026-12-26'  // Cuti Natal
        ]
    };

    // ========== RENDER FORM ==========
    area.innerHTML = `
        <div class="max-w-4xl mx-auto p-4">
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem;">
                <button onclick="window.closeModule()" class="px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 hover:border-emerald-500 transition text-white">
                    <i class="fas fa-arrow-left mr-2"></i> Kembali
                </button>
                <h2 class="text-2xl font-bold text-white">📅 Form Booking Sarana</h2>
            </div>

            <form id="bookingForm" class="space-y-6 bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                <!-- Data Pemohon -->
                <div class="grid md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm text-slate-400 mb-2">Nama Pemohon <span class="text-red-500">*</span></label>
                        <input type="text" name="nama" required 
                            class="w-full p-3 rounded-xl bg-slate-900 border border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition text-white"
                            placeholder="Nama lengkap">
                    </div>
                    <div>
                        <label class="block text-sm text-slate-400 mb-2">Divisi</label>
                        <input type="text" name="divisi" 
                            class="w-full p-3 rounded-xl bg-slate-900 border border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition text-white"
                            placeholder="Divisi/Departemen">
                    </div>
                </div>

                <div>
                    <label class="block text-sm text-slate-400 mb-2">No. HP <span class="text-red-500">*</span></label>
                    <input type="tel" name="no_hp" required 
                        class="w-full p-3 rounded-xl bg-slate-900 border border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition text-white"
                        placeholder="08xx-xxxx-xxxx">
                </div>

                <!-- Sarana & Tanggal -->
                <div class="grid md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm text-slate-400 mb-2">Pilih Sarana <span class="text-red-500">*</span></label>
                        <select name="sarana" id="sarana" required 
                            class="w-full p-3 rounded-xl bg-slate-900 border border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition text-white">                            <option value="">-- Pilih Sarana --</option>
                            ${CONFIG.SARANA_LIST.map(s => `<option value="${s}">${s}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm text-slate-400 mb-2">Tanggal <span class="text-red-500">*</span></label>
                        <input type="date" name="tgl" id="tgl" required 
                            class="w-full p-3 rounded-xl bg-slate-900 border border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition text-white">
                        <p id="dateWarning" class="text-xs text-orange-400 mt-1 hidden"><i class="fas fa-exclamation-triangle mr-1"></i><span></span></p>
                    </div>
                </div>

                <!-- Jam -->
                <div class="grid md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm text-slate-400 mb-2">Jam Mulai <span class="text-red-500">*</span></label>
                        <input type="time" name="jam_mulai" id="jam_mulai" required 
                            class="w-full p-3 rounded-xl bg-slate-900 border border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition text-white">
                        <p class="text-xs text-slate-500 mt-1">Min: 07:30</p>
                    </div>
                    <div>
                        <label class="block text-sm text-slate-400 mb-2">Jam Selesai <span class="text-red-500">*</span></label>
                        <input type="time" name="jam_selesai" id="jam_selesai" required 
                            class="w-full p-3 rounded-xl bg-slate-900 border border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition text-white">
                        <p class="text-xs text-slate-500 mt-1">Max: 16:00</p>
                    </div>
                </div>

                <!-- Peralatan -->
                <div>
                    <label class="block text-sm text-slate-400 mb-2">Peralatan Tambahan</label>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-900/50 p-4 rounded-xl">
                        ${['Kursi Futura', 'Kursi Chitose', 'Meja Siswa', 'Meja Panjang', 'Meja Oshin', 'Taplak Meja', 'Projektor', 'Screen Projektor', 'TV', 'Sound System', 'Mic Wireless', 'AC Portable'].map(alat => `
                            <label class="flex items-center gap-2 cursor-pointer hover:bg-slate-800 p-2 rounded-lg transition">
                                <input type="checkbox" name="alat" value="${alat}" class="w-4 h-4 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500">
                                <span class="text-sm text-slate-300">${alat}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <!-- Keperluan -->
                <div>
                    <label class="block text-sm text-slate-400 mb-2">Keperluan (opsional)</label>
                    <textarea name="keperluan" rows="3" 
                        class="w-full p-3 rounded-xl bg-slate-900 border border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition text-white"
                        placeholder="Jelaskan keperluan booking..."></textarea>
                </div>

                <!-- Submit Button -->                <button type="submit" id="submitBtn" 
                    class="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-4 px-6 rounded-xl transition transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                    <i class="fas fa-paper-plane mr-2"></i> AJUKAN BOOKING
                </button>
            </form>

            <!-- Info Box -->
            <div class="mt-6 p-4 bg-blue-900/30 border border-blue-700/50 rounded-xl">
                <h4 class="text-blue-400 font-bold mb-2"><i class="fas fa-info-circle mr-2"></i>Informasi:</h4>
                <ul class="text-sm text-slate-300 space-y-1">
                    <li>• Jam operasional: <strong>07:30 - 16:00</strong> (Senin-Jumat)</li>
                    <li>• Sabtu: <strong>Optional</strong> (untuk team umum)</li>
                    <li>• Minggu & Tanggal Merah: <strong>LIBUR</strong></li>
                    <li>• Jumat 10:30-13:00: Aula & Serbaguna <strong>tidak tersedia</strong></li>
                    <li>• Booking minimal <strong>H-1</strong></li>
                </ul>
            </div>
        </div>
    `;

    // ========== HELPER FUNCTIONS ==========
    
    // Convert time string to decimal (e.g., "07:30" -> 7.5)
    function timeToDecimal(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours + (minutes / 60);
    }

    // Convert decimal to time string (e.g., 7.5 -> "07:30")
    function decimalToTime(decimal) {
        const hours = Math.floor(decimal);
        const minutes = Math.round((decimal - hours) * 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    // Check if date is weekend
    function getDayName(dateStr) {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        return days[new Date(dateStr + 'T00:00:00').getDay()];
    }

    function isSunday(dateStr) {
        return new Date(dateStr + 'T00:00:00').getDay() === 0;
    }

    function isSaturday(dateStr) {
        return new Date(dateStr + 'T00:00:00').getDay() === 6;
    }

    function isFriday(dateStr) {        return new Date(dateStr + 'T00:00:00').getDay() === 5;
    }

    function isHoliday(dateStr) {
        return CONFIG.HOLIDAYS_2026.includes(dateStr);
    }

    // Get min/max date
    function getMinDate() {
        const min = new Date();
        min.setDate(min.getDate() + CONFIG.MIN_BOOKING_DAYS);
        return min.toISOString().split('T')[0];
    }

    function getMaxDate() {
        const max = new Date();
        max.setDate(max.getDate() + CONFIG.MAX_BOOKING_DAYS);
        return max.toISOString().split('T')[0];
    }

    // ========== VALIDATION LOGIC ==========
    
    function validateBooking(data) {
        const errors = [];
        const warnings = [];

        // 1. Check tanggal
        const selectedDate = new Date(data.tgl + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            errors.push('Tanggal tidak boleh di masa lalu!');
        }

        // 2. Check hari
        if (isSunday(data.tgl)) {
            errors.push('❌ Hari Minggu LIBUR - tidak ada pelayanan booking!');
        }

        if (isHoliday(data.tgl)) {
            errors.push('❌ Tanggal merah LIBUR - tidak ada pelayanan booking!');
        }

        if (isSaturday(data.tgl)) {
            warnings.push('⚠️ Sabtu hanya untuk team umum - pastikan kebutuhan mendesak!');
        }

        // 3. Check jam operasional
        const mulai = timeToDecimal(data.jam_mulai);        const selesai = timeToDecimal(data.jam_selesai);

        if (mulai < CONFIG.WORK_HOURS.start) {
            errors.push(`Jam mulai terlalu pagi! Minimal ${decimalToTime(CONFIG.WORK_HOURS.start)}`);
        }

        if (selesai > CONFIG.WORK_HOURS.end) {
            errors.push(`Jam selesai terlalu sore! Maksimal ${decimalToTime(CONFIG.WORK_HOURS.end)}`);
        }

        if (selesai <= mulai) {
            errors.push('Jam selesai harus lebih besar dari jam mulai!');
        }

        // 4. Check Jumat block time
        if (isFriday(data.tgl) && CONFIG.FRIDAY_BLOCKED_ROOMS.includes(data.sarana)) {
            if (mulai < CONFIG.FRIDAY_BLOCK.end && selesai > CONFIG.FRIDAY_BLOCK.start) {
                errors.push(`❌ ${data.sarana} tidak tersedia Jumat ${decimalToTime(CONFIG.FRIDAY_BLOCK.start)}-${decimalToTime(CONFIG.FRIDAY_BLOCK.end)} (waktu shalat)!`);
            }
        }

        // 5. Check masjid
        if (data.sarana === 'Masjid (Maintenance)') {
            errors.push('❌ Masjid sedang dalam maintenance - tidak tersedia untuk booking!');
        }

        return { errors, warnings };
    }

    // Check double booking
    async function checkDoubleBooking(data) {
        try {
            // Query existing bookings for same date & room
            const existing = await api.query('bookings', {
                eq: {
                    ruang: data.sarana,
                    tanggal: data.tgl,
                    status: 'approved'
                }
            });

            const mulai = timeToDecimal(data.jam_mulai);
            const selesai = timeToDecimal(data.jam_selesai);

            // Check overlap
            const conflict = existing.find(booking => {
                const bMulai = timeToDecimal(booking.jam_mulai);
                const bSelesai = timeToDecimal(booking.jam_selesai);
                
                // Overlap logic: start1 < end2 AND end1 > start2                return mulai < bSelesai && selesai > bMulai;
            });

            if (conflict) {
                return {
                    hasConflict: true,
                    message: `❌ JAM BENTROK! ${data.sarana} sudah di-booking ${conflict.nama_peminjam} (${decimalToTime(timeToDecimal(conflict.jam_mulai))}-${decimalToTime(timeToDecimal(conflict.jam_selesai))})`
                };
            }

            return { hasConflict: false };
        } catch (err) {
            console.error('Error checking double booking:', err);
            return { hasConflict: false, error: err.message };
        }
    }

    // ========== FORM HANDLING ==========
    
    const form = document.getElementById('bookingForm');
    const tglInput = document.getElementById('tgl');
    const dateWarning = document.getElementById('dateWarning');
    const submitBtn = document.getElementById('submitBtn');

    // Set date range
    if (tglInput) {
        tglInput.min = getMinDate();
        tglInput.max = getMaxDate();
        tglInput.value = getMinDate();
    }

    // Real-time date validation
    tglInput?.addEventListener('change', (e) => {
        const dateStr = e.target.value;
        const dayName = getDayName(dateStr);
        
        if (isSunday(dateStr)) {
            dateWarning.classList.remove('hidden');
            dateWarning.querySelector('span').textContent = `${dayName} - LIBUR!`;
            dateWarning.className = 'text-xs text-red-400 mt-1';
        } else if (isHoliday(dateStr)) {
            dateWarning.classList.remove('hidden');
            dateWarning.querySelector('span').textContent = `${dayName} - Tanggal Merah (LIBUR)!`;
            dateWarning.className = 'text-xs text-red-400 mt-1';
        } else if (isSaturday(dateStr)) {
            dateWarning.classList.remove('hidden');
            dateWarning.querySelector('span').textContent = `${dayName} - Optional (Team Umum)`;
            dateWarning.className = 'text-xs text-orange-400 mt-1';
        } else if (isFriday(dateStr)) {
            dateWarning.classList.remove('hidden');            dateWarning.querySelector('span').textContent = `${dayName} - Jumat Berkah!`;
            dateWarning.className = 'text-xs text-blue-400 mt-1';
        } else {
            dateWarning.classList.add('hidden');
        }
    });

    // Form submit
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const alatList = formData.getAll('alat');
        
        const data = {
            nama: formData.get('nama'),
            divisi: formData.get('divisi'),
            no_hp: formData.get('no_hp'),
            sarana: formData.get('sarana'),
            tgl: formData.get('tgl'),
            jam_mulai: formData.get('jam_mulai'),
            jam_selesai: formData.get('jam_selesai'),
            peralatan: alatList.join(', '),
            keperluan: formData.get('keperluan')
        };

        // Validasi
        const validation = validateBooking(data);
        
        // Show warnings
        if (validation.warnings.length > 0) {
            validation.warnings.forEach(w => showToast(w, 'warning'));
        }

        // Check errors
        if (validation.errors.length > 0) {
            validation.errors.forEach(err => showToast(err, 'error'));
            return;
        }

        // Check double booking
        showToast('🔍 Mengecek ketersediaan...', 'info');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Checking...';

        const doubleCheck = await checkDoubleBooking(data);
        
        if (doubleCheck.hasConflict) {
            showToast(doubleCheck.message, 'error');
            submitBtn.disabled = false;            submitBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i> AJUKAN BOOKING';
            return;
        }

        if (doubleCheck.error) {
            showToast('⚠️ Warning: Tidak bisa cek bentrok - ' + doubleCheck.error, 'warning');
        }

        // Submit to database
        try {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Menyimpan...';
            
            const payload = {
                nama_peminjam: data.nama,
                divisi: data.divisi || null,
                no_hp: data.no_hp,
                ruang: data.sarana,
                tanggal: data.tgl,
                jam_mulai: data.jam_mulai,
                jam_selesai: data.jam_selesai,
                keperluan: data.keperluan || null,
                peralatan: data.peralatan,
                status: 'pending', // Default pending approval
                created_at: new Date().toISOString(),
                created_by: user?.name || 'Unknown'
            };

            await api.create('bookings', payload);
            
            showToast('✅ Booking berhasil diajukan! Menunggu approval.', 'success');
            
            // Reset form
            form.reset();
            tglInput.value = getMinDate();
            dateWarning.classList.add('hidden');
            
        } catch (err) {
            console.error('Booking error:', err);
            showToast('❌ Gagal menyimpan booking: ' + err.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i> AJUKAN BOOKING';
        }
    });

    console.log('✅ Modul Booking fully initialized!');
}

// Auto-init for compatibility
if (typeof window !== 'undefined') {    window.bookingModule = { init };
}
