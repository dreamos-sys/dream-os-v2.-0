/**
 * modules/booking/module.js
 * Dream OS v2.0 - Booking Module
 * ✅ FIXED: Signature match + audit_log integration with Command Center
 * Bi idznillah, booking lancar! 🕌📅
 */

// ✅ EXPORT DEFAULT + ASYNC + PARAMETER MATCH
export default async function initModule(config, utils, supabase, currentUser, showToast, showModal, loader, translations, currentLang) {

    // ========== CONFIG & CONSTANTS ==========
    const CONFIG = {
        WORK_HOURS: { start: 7.5, end: 16.0 },
        FRIDAY_BLOCK: { start: 10.5, end: 13.0 },
        FRIDAY_BLOCKED_ROOMS: ['Aula SMP', 'Serbaguna'],
        MIN_BOOKING_DAYS: 1,
        MAX_BOOKING_DAYS: 30,
        SARANA_LIST: [
            "Aula SMP", "Aula SMA", "Saung Besar", "Saung Kecil",
            "Masjid (Maintenance)", "Mushalla SMA", "Serbaguna",
            "Lapangan Basket", "Lapangan Volly", "Lapangan Tanah",
            "Lapangan SMA", "Kantin SMP", "Kantin SMA",
            "Labkom SD", "Labkom SMP", "Labkom SMA",
            "Perpustakaan SD", "Perpustakaan SMP", "Perpustakaan SMA"
        ],
        HOLIDAYS_2026: [
            '2026-01-01', '2026-01-27', '2026-03-20', '2026-04-10',
            '2026-05-01', '2026-05-21', '2026-06-01', '2026-06-07',
            '2026-06-08', '2026-08-17', '2026-09-15', '2026-11-24',
            '2026-12-25', '2026-12-26'
        ]
    };

    // ========== HELPER FUNCTIONS ==========
    function timeToDecimal(timeStr) {
        const [h, m] = timeStr.split(':').map(Number);
        return h + (m / 60);
    }
    function decimalToTime(decimal) {
        const h = Math.floor(decimal);
        const m = Math.round((decimal - h) * 60);
        return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
    }
    function getDayName(dateStr) {
        const days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
        return days[new Date(dateStr + 'T00:00:00').getDay()];
    }
    function isSunday(d)  { return new Date(d+'T00:00:00').getDay() === 0; }
    function isSaturday(d){ return new Date(d+'T00:00:00').getDay() === 6; }
    function isFriday(d)  { return new Date(d+'T00:00:00').getDay() === 5; }
    function isHoliday(d) { return CONFIG.HOLIDAYS_2026.includes(d); }
    function getMinDate() { const d=new Date(); d.setDate(d.getDate()+CONFIG.MIN_BOOKING_DAYS); return d.toISOString().split('T')[0]; }
    function getMaxDate() { const d=new Date(); d.setDate(d.getDate()+CONFIG.MAX_BOOKING_DAYS); return d.toISOString().split('T')[0]; }

    // ✅ Unified toast — pakai utils dari loader, fallback ke showToast param, fallback ke console
    function doToast(msg, type = 'info') {
        if (utils?.showToast)               return utils.showToast(msg, type);
        if (typeof showToast === 'function') return showToast(msg, type);
        console.log(`[Booking][${type}] ${msg}`);
    }

    // ========== VALIDATION ==========
    function validateBooking(data) {
        const errors = [], warnings = [];
        const selectedDate = new Date(data.tgl + 'T00:00:00');
        const today = new Date(); today.setHours(0,0,0,0);

        if (selectedDate < today)   errors.push('Tanggal tidak boleh di masa lalu!');
        if (isSunday(data.tgl))     errors.push('❌ Hari Minggu LIBUR!');
        if (isHoliday(data.tgl))    errors.push('❌ Tanggal merah LIBUR!');
        if (isSaturday(data.tgl))   warnings.push('⚠️ Sabtu hanya untuk team umum!');

        const mulai = timeToDecimal(data.jam_mulai), selesai = timeToDecimal(data.jam_selesai);
        if (mulai < CONFIG.WORK_HOURS.start)   errors.push(`Jam mulai minimal ${decimalToTime(CONFIG.WORK_HOURS.start)}`);
        if (selesai > CONFIG.WORK_HOURS.end)   errors.push(`Jam selesai maksimal ${decimalToTime(CONFIG.WORK_HOURS.end)}`);
        if (selesai <= mulai)                  errors.push('Jam selesai harus > jam mulai!');

        if (isFriday(data.tgl) && CONFIG.FRIDAY_BLOCKED_ROOMS.includes(data.sarana)) {
            if (mulai < CONFIG.FRIDAY_BLOCK.end && selesai > CONFIG.FRIDAY_BLOCK.start) {
                errors.push(`❌ ${data.sarana} tidak tersedia Jumat ${decimalToTime(CONFIG.FRIDAY_BLOCK.start)}-${decimalToTime(CONFIG.FRIDAY_BLOCK.end)}`);
            }
        }
        if (data.sarana === 'Masjid (Maintenance)') errors.push('❌ Masjid sedang maintenance!');
        return { errors, warnings };
    }

    // ========== DOUBLE BOOKING CHECK ==========
    async function checkDoubleBooking(data) {
        if (!supabase) return { hasConflict: false };
        try {
            const { data: existing, error } = await supabase
                .from('bookings')
                .select('*')
                .eq('ruang', data.sarana)
                .eq('tanggal', data.tgl)
                .eq('status', 'approved');
            if (error) throw error;

            const mulai = timeToDecimal(data.jam_mulai), selesai = timeToDecimal(data.jam_selesai);
            const conflict = existing?.find(b => {
                const bMulai = timeToDecimal(b.jam_mulai), bSelesai = timeToDecimal(b.jam_selesai);
                return mulai < bSelesai && selesai > bMulai;
            });
            if (conflict) return {
                hasConflict: true,
                message: `❌ BENTROK! ${data.sarana} sudah di-booking ${conflict.nama_peminjam}`
            };
            return { hasConflict: false };
        } catch (err) {
            console.warn('⚠️ Double check failed:', err.message);
            return { hasConflict: false };
        }
    }

    // ✅ AUDIT LOG — dipanggil setelah booking berhasil agar Command Center bisa membaca aktivitas
    async function writeAuditLog(action, detail, user) {
        if (!supabase) return;
        try {
            await supabase.from('audit_logs').insert([{
                action,
                detail,
                user: user || 'Unknown',
                created_at: new Date().toISOString()
            }]);
        } catch (err) {
            console.warn('[Booking] audit_log gagal:', err.message);
        }
    }

    // ========== RENDER FORM HTML ==========
    return `
        <div class="max-w-4xl mx-auto p-4">
            <div style="display:flex;align-items:center;gap:1rem;margin-bottom:2rem">
                <button onclick="window.closeModule()" class="px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 hover:border-emerald-500 transition text-white">
                    <i class="fas fa-arrow-left mr-2"></i> Kembali
                </button>
                <h2 class="text-2xl font-bold text-white">📅 Form Booking Sarana</h2>
            </div>

            <form id="bookingForm" class="space-y-6 bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                <div class="grid md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm text-slate-400 mb-2">Nama Pemohon <span class="text-red-500">*</span></label>
                        <input type="text" name="nama" required class="w-full p-3 rounded-xl bg-slate-900 border border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition text-white" placeholder="Nama lengkap" value="${currentUser?.name || ''}">
                    </div>
                    <div>
                        <label class="block text-sm text-slate-400 mb-2">Divisi</label>
                        <input type="text" name="divisi" class="w-full p-3 rounded-xl bg-slate-900 border border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition text-white" placeholder="Divisi/Departemen" value="${currentUser?.role || ''}">
                    </div>
                </div>
                <div>
                    <label class="block text-sm text-slate-400 mb-2">No. HP <span class="text-red-500">*</span></label>
                    <input type="tel" name="no_hp" required class="w-full p-3 rounded-xl bg-slate-900 border border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition text-white" placeholder="08xx-xxxx-xxxx">
                </div>
                <div class="grid md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm text-slate-400 mb-2">Pilih Sarana <span class="text-red-500">*</span></label>
                        <select name="sarana" id="sarana" required class="w-full p-3 rounded-xl bg-slate-900 border border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition text-white">
                            <option value="">-- Pilih Sarana --</option>
                            ${CONFIG.SARANA_LIST.map(s => `<option value="${s}">${s}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm text-slate-400 mb-2">Tanggal <span class="text-red-500">*</span></label>
                        <input type="date" name="tgl" id="tgl" required min="${getMinDate()}" max="${getMaxDate()}" value="${getMinDate()}" class="w-full p-3 rounded-xl bg-slate-900 border border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition text-white">
                        <p id="dateWarning" class="text-xs text-orange-400 mt-1 hidden"><i class="fas fa-exclamation-triangle mr-1"></i><span></span></p>
                    </div>
                </div>
                <div class="grid md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm text-slate-400 mb-2">Jam Mulai <span class="text-red-500">*</span></label>
                        <input type="time" name="jam_mulai" id="jam_mulai" required min="07:30" max="16:00" value="08:00" class="w-full p-3 rounded-xl bg-slate-900 border border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition text-white">
                    </div>
                    <div>
                        <label class="block text-sm text-slate-400 mb-2">Jam Selesai <span class="text-red-500">*</span></label>
                        <input type="time" name="jam_selesai" id="jam_selesai" required min="07:30" max="16:00" value="10:00" class="w-full p-3 rounded-xl bg-slate-900 border border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition text-white">
                    </div>
                </div>
                <div>
                    <label class="block text-sm text-slate-400 mb-2">Peralatan Tambahan</label>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-900/50 p-4 rounded-xl">
                        ${['Kursi Futura','Kursi Chitose','Meja Siswa','Meja Panjang','Meja Oshin','Taplak Meja','Projektor','Screen Projektor','TV','Sound System','Mic Wireless','AC Portable'].map(alat => `
                            <label class="flex items-center gap-2 cursor-pointer hover:bg-slate-800 p-2 rounded-lg transition">
                                <input type="checkbox" name="alat" value="${alat}" class="w-4 h-4 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500">
                                <span class="text-sm text-slate-300">${alat}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                <div>
                    <label class="block text-sm text-slate-400 mb-2">Keperluan (opsional)</label>
                    <textarea name="keperluan" rows="3" class="w-full p-3 rounded-xl bg-slate-900 border border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition text-white" placeholder="Jelaskan keperluan booking..."></textarea>
                </div>
                <button type="submit" id="submitBtn" class="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-4 px-6 rounded-xl transition transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                    <i class="fas fa-paper-plane mr-2"></i> AJUKAN BOOKING
                </button>
            </form>

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

    // ========== EVENT HANDLERS ==========
    setTimeout(() => {
        const form        = document.getElementById('bookingForm');
        const tglInput    = document.getElementById('tgl');
        const dateWarning = document.getElementById('dateWarning');
        const submitBtn   = document.getElementById('submitBtn');

        // Date change handler
        tglInput?.addEventListener('change', (e) => {
            const dateStr = e.target.value;
            const dayName = getDayName(dateStr);
            if (isSunday(dateStr) || isHoliday(dateStr)) {
                dateWarning.classList.remove('hidden');
                dateWarning.querySelector('span').textContent = `${dayName} - LIBUR!`;
                dateWarning.className = 'text-xs text-red-400 mt-1';
            } else if (isSaturday(dateStr)) {
                dateWarning.classList.remove('hidden');
                dateWarning.querySelector('span').textContent = `${dayName} - Optional`;
                dateWarning.className = 'text-xs text-orange-400 mt-1';
            } else if (isFriday(dateStr)) {
                dateWarning.classList.remove('hidden');
                dateWarning.querySelector('span').textContent = `${dayName} - Jumat Berkah!`;
                dateWarning.className = 'text-xs text-blue-400 mt-1';
            } else {
                dateWarning.classList.add('hidden');
            }
        });

        // Form submit handler
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const alatList = formData.getAll('alat');
            const data = {
                nama:        formData.get('nama'),
                divisi:      formData.get('divisi'),
                no_hp:       formData.get('no_hp'),
                sarana:      formData.get('sarana'),
                tgl:         formData.get('tgl'),
                jam_mulai:   formData.get('jam_mulai'),
                jam_selesai: formData.get('jam_selesai'),
                peralatan:   alatList.join(', '),
                keperluan:   formData.get('keperluan')
            };

            const validation = validateBooking(data);
            if (validation.warnings.length) validation.warnings.forEach(w => doToast(w, 'warning'));
            if (validation.errors.length)   { validation.errors.forEach(err => doToast(err, 'error')); return; }

            doToast('🔍 Mengecek ketersediaan...', 'info');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Checking...';

            const doubleCheck = await checkDoubleBooking(data);
            if (doubleCheck.hasConflict) {
                doToast(doubleCheck.message, 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i> AJUKAN BOOKING';
                return;
            }

            try {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Menyimpan...';

                const payload = {
                    nama_peminjam: data.nama,
                    divisi:        data.divisi || null,
                    no_hp:         data.no_hp,
                    ruang:         data.sarana,
                    tanggal:       data.tgl,
                    jam_mulai:     data.jam_mulai,
                    jam_selesai:   data.jam_selesai,
                    keperluan:     data.keperluan || null,
                    peralatan:     data.peralatan,
                    status:        'pending',
                    created_at:    new Date().toISOString(),
                    created_by:    currentUser?.name || 'Unknown'
                };

                if (supabase) {
                    const { error } = await supabase.from('bookings').insert(payload);
                    if (error) throw error;

                    // ✅ INTEGRASI COMMAND CENTER: Tulis ke audit_logs agar
                    // tab Activity & Dashboard Command Center langsung update
                    await writeAuditLog(
                        'Booking Baru',
                        `${data.sarana} · ${data.tgl} ${data.jam_mulai}-${data.jam_selesai} · ${data.nama}`,
                        currentUser?.name || data.nama
                    );
                } else {
                    // Fallback offline
                    const existing = JSON.parse(localStorage.getItem('bookings') || '[]');
                    existing.push({ ...payload, id: Date.now() });
                    localStorage.setItem('bookings', JSON.stringify(existing));
                }

                doToast('✅ Booking berhasil! Menunggu approval.', 'success');
                form.reset();
                tglInput.value = getMinDate();
                dateWarning.classList.add('hidden');

            } catch (err) {
                doToast('❌ Gagal: ' + err.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i> AJUKAN BOOKING';
            }
        });
    }, 100);
}

if (typeof window !== 'undefined') {
    console.log('📅 Booking module loaded | Signature: MATCH ✅ | CC Integration: ON ✅');
}
