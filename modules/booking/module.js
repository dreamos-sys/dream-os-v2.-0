/**
 * modules/booking/module.js
 * Dream OS v2.0 — Booking Module PROFESSIONAL
 *
 * ARSITEKTUR:
 * User booking → Sistem validasi otomatis → Lolos = APPROVED langsung
 * Admin = monitor semua data di Command Center (tidak approve manual)
 *
 * ✅ Anti double booking (cek approved + pending)
 * ✅ System lock after 16:00 (cek saat SUBMIT, bukan saat buka)
 * ✅ Friday prayer block 10:30-13:00 untuk ruang tertentu
 * ✅ Sunday & holiday block
 * ✅ Saturday warning (perlu role admin)
 * ✅ Real-time conflict check saat user isi form
 * ✅ Notifikasi booking hari ini & besok
 * ✅ Audit log otomatis ke Command Center
 * ✅ Bi idznillah 💚
 */

'use strict';

export default async function initModule(
    config, utils, supabase, currentUser,
    showToast, showModal, loader, translations, currentLang
) {

    /* ══════════════════════════════════════════════════
       CONSTANTS
    ══════════════════════════════════════════════════ */
    const CFG = {
        WORK_START:    7.5,   // 07:30
        WORK_END:      16.0,  // 16:00
        PRAYER_START:  10.5,  // 10:30
        PRAYER_END:    13.0,  // 13:00
        MIN_DAYS_AHEAD: 1,
        MAX_DAYS_AHEAD: 30,

        PRAYER_ROOMS: [
            'Aula SMP', 'Aula SMA', 'Serbaguna', 'Mushalla SMA'
        ],
        SARANA: [
            'Aula SMP', 'Aula SMA', 'Saung Besar', 'Saung Kecil',
            'Masjid (Maintenance)', 'Mushalla SMA', 'Serbaguna',
            'Lapangan Basket', 'Lapangan Volly', 'Lapangan Tanah',
            'Lapangan SMA', 'Kantin SMP', 'Kantin SMA',
            'Labkom SD', 'Labkom SMP', 'Labkom SMA',
            'Perpustakaan SD', 'Perpustakaan SMP', 'Perpustakaan SMA'
        ],
        PERALATAN: [
            'Kursi Futura', 'Kursi Chitose', 'Meja Siswa', 'Meja Panjang',
            'Meja Oshin', 'Taplak Meja', 'Projektor', 'Screen Projektor',
            'TV', 'Sound System', 'Sound Portable', 'Sound Portable Display (Karaoke)',
            'Mic Wireless', 'AC Portable'
        ],
        HOLIDAYS: [
            '2026-01-01','2026-01-27','2026-03-20','2026-04-10',
            '2026-05-01','2026-05-21','2026-06-01','2026-06-07',
            '2026-06-08','2026-08-17','2026-09-15','2026-11-24',
            '2026-12-25','2026-12-26'
        ]
    };

    /* ══════════════════════════════════════════════════
       HELPERS
    ══════════════════════════════════════════════════ */
    const toDecimal = t => { const [h,m] = t.split(':').map(Number); return h + m/60; };
    const toTime    = d => `${Math.floor(d).toString().padStart(2,'0')}:${Math.round((d%1)*60).toString().padStart(2,'0')}`;
    const dayOf     = s => new Date(s+'T00:00:00').getDay();
    const isSun     = s => dayOf(s) === 0;
    const isSat     = s => dayOf(s) === 6;
    const isFri     = s => dayOf(s) === 5;
    const isHoliday = s => CFG.HOLIDAYS.includes(s);
    const dayName   = s => ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][dayOf(s)];
    const isAdmin   = () => (currentUser?.perms||[]).includes('all') || currentUser?.role === 'admin';

    const minDate = () => {
        const d = new Date(); d.setDate(d.getDate() + CFG.MIN_DAYS_AHEAD);
        return d.toISOString().split('T')[0];
    };
    const maxDate = () => {
        const d = new Date(); d.setDate(d.getDate() + CFG.MAX_DAYS_AHEAD);
        return d.toISOString().split('T')[0];
    };

    function toast(msg, type='info') {
        if (typeof showToast === 'function') return showToast(msg, type);
        if (utils?.showToast) return utils.showToast(msg, type);
        console.log(`[Booking][${type}] ${msg}`);
    }

    function esc(s) {
        return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    /* ══════════════════════════════════════════════════
       AUDIT LOG
    ══════════════════════════════════════════════════ */
    async function writeAudit(action, detail) {
        if (!supabase) return;
        try {
            await supabase.from('audit_logs').insert([{
                action, detail,
                user: currentUser?.name || 'Guest',
                created_at: new Date().toISOString()
            }]);
        } catch(e) { console.warn('[Booking] audit:', e.message); }
    }

    /* ══════════════════════════════════════════════════
       VALIDATION — cek saat SUBMIT (bukan saat buka form)
    ══════════════════════════════════════════════════ */
    function validateBooking(d) {
        const errors = [], warnings = [];

        // ── Date rules ───────────────────────────────
        if (!d.tgl) { errors.push('Tanggal wajib diisi!'); return { errors, warnings }; }

        if (isSun(d.tgl))     errors.push('❌ Hari Minggu LIBUR — booking tidak tersedia.');
        if (isHoliday(d.tgl)) errors.push('❌ Tanggal merah LIBUR — booking tidak tersedia.');
        if (isSat(d.tgl) && !isAdmin()) errors.push('❌ Sabtu hanya untuk admin / tim umum. Hubungi Kabag Umum.');

        // ── Time rules ───────────────────────────────
        const mulai   = toDecimal(d.jam_mulai);
        const selesai = toDecimal(d.jam_selesai);

        if (mulai < CFG.WORK_START)  errors.push(`❌ Jam mulai minimal ${toTime(CFG.WORK_START)}`);
        if (selesai > CFG.WORK_END)  errors.push(`❌ Jam selesai maksimal ${toTime(CFG.WORK_END)}`);
        if (selesai <= mulai)        errors.push('❌ Jam selesai harus lebih besar dari jam mulai!');

        // ── System lock >16:00 saat submit ───────────
        // Hanya berlaku kalau booking HARI INI
        const today = new Date().toISOString().split('T')[0];
        if (d.tgl === today) {
            const nowH = new Date().getHours() + new Date().getMinutes()/60;
            if (nowH > CFG.WORK_END && !isAdmin()) {
                errors.push(`❌ Sistem booking tutup setelah ${toTime(CFG.WORK_END)}. Hubungi Kabag/Koord Umum.`);
            }
        }

        // ── Friday prayer block ───────────────────────
        if (isFri(d.tgl) && CFG.PRAYER_ROOMS.includes(d.sarana)) {
            if (mulai < CFG.PRAYER_END && selesai > CFG.PRAYER_START) {
                errors.push(`❌ ${esc(d.sarana)} tidak tersedia Jumat ${toTime(CFG.PRAYER_START)}–${toTime(CFG.PRAYER_END)} (Shalat Jumat). Pilih jam lain.`);
            }
        }

        // ── Maintenance room ─────────────────────────
        if (d.sarana === 'Masjid (Maintenance)') {
            errors.push('❌ Masjid sedang dalam maintenance. Tidak bisa dibooking.');
        }

        // ── Warnings ─────────────────────────────────
        if (isSat(d.tgl) && isAdmin()) warnings.push('⚠️ Booking Sabtu — pastikan sudah koordinasi tim.');
        if (isFri(d.tgl)) warnings.push('🕌 Hari Jumat — Jumat Berkah! Pastikan tidak bentrok Shalat Jumat.');

        return { errors, warnings };
    }

    /* ══════════════════════════════════════════════════
       DOUBLE BOOKING CHECK — cek approved DAN pending
    ══════════════════════════════════════════════════ */
    async function checkDoubleBooking(d, excludeId = null) {
        if (!supabase) return { conflict: false };
        try {
            let query = supabase
                .from('bookings')
                .select('id,nama_peminjam,jam_mulai,jam_selesai,status')
                .eq('ruang', d.sarana)
                .eq('tanggal', d.tgl)
                .in('status', ['approved', 'pending']); // ✅ cek keduanya

            if (excludeId) query = query.neq('id', excludeId);

            const { data: existing, error } = await query;
            if (error) throw error;

            const mulai   = toDecimal(d.jam_mulai);
            const selesai = toDecimal(d.jam_selesai);

            const hit = (existing||[]).find(b => {
                const bM = toDecimal(b.jam_mulai);
                const bS = toDecimal(b.jam_selesai);
                return mulai < bS && selesai > bM;
            });

            if (hit) return {
                conflict: true,
                isPending: hit.status === 'pending',
                message: hit.status === 'approved'
                    ? `❌ BENTROK! ${esc(d.sarana)} sudah di-booking oleh ${esc(hit.nama_peminjam)} (${hit.jam_mulai}–${hit.jam_selesai})`
                    : `⚠️ Ada booking PENDING di ${esc(d.sarana)} oleh ${esc(hit.nama_peminjam)} (${hit.jam_mulai}–${hit.jam_selesai}). Tidak bisa booking saat ada pending.`
            };
            return { conflict: false };
        } catch(e) {
            console.warn('[Booking] double check error:', e.message);
            return { conflict: false }; // fail open — jangan block user kalau DB error
        }
    }

    /* ══════════════════════════════════════════════════
       REAL-TIME AVAILABILITY INDICATOR
    ══════════════════════════════════════════════════ */
    let _checkTimeout = null;
    async function realtimeCheck() {
        const sarana   = document.getElementById('bk-sarana')?.value;
        const tgl      = document.getElementById('bk-tgl')?.value;
        const jamMulai = document.getElementById('bk-mulai')?.value;
        const jamSelesai = document.getElementById('bk-selesai')?.value;
        const indicator = document.getElementById('bk-avail');
        if (!indicator) return;

        if (!sarana || !tgl || !jamMulai || !jamSelesai) {
            indicator.innerHTML = '';
            return;
        }

        // Friday prayer check — instant, no DB needed
        if (isFri(tgl) && CFG.PRAYER_ROOMS.includes(sarana)) {
            const mulai = toDecimal(jamMulai), selesai = toDecimal(jamSelesai);
            if (mulai < CFG.PRAYER_END && selesai > CFG.PRAYER_START) {
                indicator.innerHTML = `<span style="color:#f59e0b">🕌 Bentrok Shalat Jumat ${toTime(CFG.PRAYER_START)}–${toTime(CFG.PRAYER_END)}</span>`;
                return;
            }
        }

        indicator.innerHTML = `<span style="color:#64748b"><i class="fas fa-circle-notch" style="animation:bk-spin 1s linear infinite"></i> Mengecek ketersediaan...</span>`;

        clearTimeout(_checkTimeout);
        _checkTimeout = setTimeout(async () => {
            const result = await checkDoubleBooking({ sarana, tgl, jam_mulai: jamMulai, jam_selesai: jamSelesai });
            if (result.conflict) {
                indicator.innerHTML = `<span style="color:#ef4444">⛔ ${result.message}</span>`;
            } else {
                indicator.innerHTML = `<span style="color:#10b981">✅ Tersedia! Ruang bebas di jam ini.</span>`;
            }
        }, 600); // debounce 600ms
    }

    /* ══════════════════════════════════════════════════
       NOTIFICATIONS — booking hari ini & besok
    ══════════════════════════════════════════════════ */
    async function loadNotifications() {
        if (!supabase) return [];
        try {
            const today = new Date().toISOString().split('T')[0];
            const tom   = new Date(); tom.setDate(tom.getDate()+1);
            const tomStr = tom.toISOString().split('T')[0];
            const { data } = await supabase
                .from('bookings')
                .select('*')
                .in('tanggal', [today, tomStr])
                .in('status', ['approved'])
                .order('tanggal').order('jam_mulai');
            return (data||[]).map(b => ({ ...b, isToday: b.tanggal === today }));
        } catch(e) { return []; }
    }

    function renderNotifPanel(notifs) {
        document.getElementById('bk-notif-panel')?.remove();
        const panel = document.createElement('div');
        panel.id = 'bk-notif-panel';
        panel.style.cssText = 'position:fixed;top:80px;right:16px;width:340px;max-height:70vh;overflow-y:auto;background:rgba(15,23,42,.97);border:1px solid rgba(59,130,246,.35);border-radius:16px;padding:1.25rem;z-index:1000;box-shadow:0 10px 40px rgba(0,0,0,.5);backdrop-filter:blur(12px)';

        const today  = notifs.filter(n => n.isToday);
        const tom    = notifs.filter(n => !n.isToday);

        const section = (title, color, items) => !items.length ? '' : `
            <div style="margin-bottom:.875rem">
                <div style="font-weight:800;font-size:.78rem;color:${color};margin-bottom:.5rem;text-transform:uppercase;letter-spacing:.5px">${title} (${items.length})</div>
                ${items.map(b => `
                    <div style="background:rgba(255,255,255,.04);border-left:3px solid ${color};border-radius:0 8px 8px 0;padding:.55rem .75rem;margin-bottom:.35rem">
                        <div style="font-weight:700;font-size:.82rem;color:#e2e8f0">${esc(b.ruang)}</div>
                        <div style="font-size:.7rem;color:#94a3b8;margin-top:2px">${b.jam_mulai}–${b.jam_selesai} · ${esc(b.nama_peminjam)}</div>
                        ${b.peralatan ? `<div style="font-size:.67rem;color:#64748b;margin-top:2px">🔧 ${esc(b.peralatan)}</div>` : ''}
                    </div>`).join('')}
            </div>`;

        panel.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.875rem">
                <span style="font-weight:800;color:#3b82f6;font-size:.92rem">🔔 Reminder Booking</span>
                <button onclick="document.getElementById('bk-notif-panel').remove()" style="background:none;border:none;color:#64748b;cursor:pointer;font-size:1rem">✕</button>
            </div>
            ${section('📅 Hari Ini','#10b981',today)}
            ${section('⏰ Besok','#f59e0b',tom)}
            ${!notifs.length ? '<div style="text-align:center;padding:1.5rem;color:#64748b;font-size:.82rem">📭 Tidak ada booking hari ini / besok</div>' : ''}
        `;
        document.body.appendChild(panel);
        // Auto dismiss 30s
        setTimeout(() => {
            if (panel.parentNode) {
                panel.style.transition = 'opacity .4s,transform .4s';
                panel.style.opacity = '0';
                panel.style.transform = 'translateX(20px)';
                setTimeout(() => panel.remove(), 400);
            }
        }, 30000);
    }

    /* ══════════════════════════════════════════════════
       RENDER HTML
    ══════════════════════════════════════════════════ */
    const container = document.getElementById('module-content');
    if (!container) { console.error('[Booking] #module-content not found'); return; }

    container.innerHTML = `
        <style>
            @keyframes bk-spin { to { transform:rotate(360deg); } }
            .bk-input { width:100%;background:rgba(255,255,255,.07);border:1.5px solid rgba(16,185,129,.22);border-radius:10px;padding:.6rem .875rem;color:#e2e8f0;font-family:inherit;font-size:.9rem;outline:none;transition:border-color .2s; }
            .bk-input:focus { border-color:#10b981;box-shadow:0 0 0 3px rgba(16,185,129,.12); }
            .bk-label { display:block;font-size:.72rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:.35rem; }
            .bk-group { display:flex;flex-direction:column;margin-bottom:.875rem; }
            .bk-grid2 { display:grid;grid-template-columns:1fr 1fr;gap:.875rem; }
            .bk-card { background:rgba(15,23,42,.88);border:1px solid rgba(16,185,129,.22);border-radius:16px;padding:1.25rem; }
            @media(max-width:520px) { .bk-grid2 { grid-template-columns:1fr; } }
            .bk-chip { display:inline-flex;align-items:center;gap:.3rem;padding:.2rem .6rem;border-radius:6px;font-size:.68rem;font-weight:700; }
            .bk-chip-ok   { background:rgba(16,185,129,.15);color:#10b981; }
            .bk-chip-warn { background:rgba(245,158,11,.15);color:#f59e0b; }
            .bk-chip-err  { background:rgba(239,68,68,.15);color:#ef4444; }
        </style>

        <div style="max-width:720px;margin:0 auto;padding:1rem;font-family:'Rajdhani','Inter',sans-serif;color:#e2e8f0">

            <!-- HEADER -->
            <div style="display:flex;align-items:center;gap:.875rem;margin-bottom:1.25rem">
                <button id="bk-back" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:.45rem .875rem;color:#e2e8f0;cursor:pointer;font-family:inherit;font-size:.82rem;font-weight:700">
                    <i class="fas fa-arrow-left"></i> Kembali
                </button>
                <div>
                    <h2 style="font-size:1.25rem;font-weight:800;color:#10b981;margin:0">📅 Form Booking Sarana</h2>
                    <p style="font-size:.67rem;color:#64748b;margin:0">Dream OS v2.0 · Auto-validasi · Anti double booking</p>
                </div>
                <!-- Notif Button -->
                <button id="bk-notif-btn" style="margin-left:auto;background:rgba(59,130,246,.15);border:1px solid rgba(59,130,246,.3);border-radius:50%;width:44px;height:44px;color:#3b82f6;cursor:pointer;font-size:1.1rem;position:relative;flex-shrink:0">
                    🔔<span id="bk-badge" style="display:none;position:absolute;top:-4px;right:-4px;background:#ef4444;color:white;border-radius:50%;width:18px;height:18px;font-size:.6rem;font-weight:700;align-items:center;justify-content:center"></span>
                </button>
            </div>

            <!-- AVAILABILITY INDICATOR -->
            <div id="bk-avail" style="font-size:.8rem;min-height:1.4rem;margin-bottom:.75rem;padding-left:.25rem"></div>

            <!-- FORM -->
            <div class="bk-card">
                <form id="bk-form">

                    <div class="bk-grid2">
                        <div class="bk-group">
                            <label class="bk-label">Nama Pemohon <span style="color:#ef4444">*</span></label>
                            <input id="bk-nama" name="nama" class="bk-input" placeholder="Nama lengkap" required value="${esc(currentUser?.name||'')}">
                        </div>
                        <div class="bk-group">
                            <label class="bk-label">Divisi / Unit</label>
                            <input id="bk-divisi" name="divisi" class="bk-input" placeholder="Divisi/Departemen" value="${esc(currentUser?.unit||currentUser?.divisi||'')}">
                        </div>
                    </div>

                    <div class="bk-group">
                        <label class="bk-label">No. HP <span style="color:#ef4444">*</span></label>
                        <input id="bk-hp" name="no_hp" class="bk-input" type="tel" placeholder="08xx-xxxx-xxxx" required>
                    </div>

                    <div class="bk-grid2">
                        <div class="bk-group">
                            <label class="bk-label">Pilih Sarana <span style="color:#ef4444">*</span></label>
                            <select id="bk-sarana" name="sarana" class="bk-input" required>
                                <option value="">-- Pilih Sarana --</option>
                                ${CFG.SARANA.map(s => `<option value="${s}">${s}</option>`).join('')}
                            </select>
                        </div>
                        <div class="bk-group">
                            <label class="bk-label">Tanggal <span style="color:#ef4444">*</span></label>
                            <input id="bk-tgl" name="tgl" class="bk-input" type="date" required
                                min="${minDate()}" max="${maxDate()}" value="${minDate()}">
                            <span id="bk-day-label" style="font-size:.7rem;margin-top:.25rem;color:#64748b"></span>
                        </div>
                    </div>

                    <div class="bk-grid2">
                        <div class="bk-group">
                            <label class="bk-label">Jam Mulai <span style="color:#ef4444">*</span></label>
                            <input id="bk-mulai" name="jam_mulai" class="bk-input" type="time"
                                min="07:30" max="16:00" value="08:00" required>
                        </div>
                        <div class="bk-group">
                            <label class="bk-label">Jam Selesai <span style="color:#ef4444">*</span></label>
                            <input id="bk-selesai" name="jam_selesai" class="bk-input" type="time"
                                min="07:30" max="16:00" value="10:00" required>
                        </div>
                    </div>

                    <!-- Peralatan -->
                    <div class="bk-group">
                        <label class="bk-label">Peralatan Tambahan</label>
                        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:.4rem;background:rgba(0,0,0,.2);border-radius:10px;padding:.75rem">
                            ${CFG.PERALATAN.map(p => `
                                <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer;padding:.3rem .4rem;border-radius:6px;transition:.15s;font-size:.82rem;color:#cbd5e1" onmouseover="this.style.background='rgba(16,185,129,.08)'" onmouseout="this.style.background='none'">
                                    <input type="checkbox" name="alat" value="${p}" style="width:14px;height:14px;accent-color:#10b981">
                                    ${esc(p)}
                                </label>`).join('')}
                        </div>
                    </div>

                    <div class="bk-group">
                        <label class="bk-label">Keperluan</label>
                        <textarea id="bk-keperluan" name="keperluan" class="bk-input" rows="3"
                            style="resize:vertical;min-height:72px"
                            placeholder="Jelaskan keperluan / kegiatan..."></textarea>
                    </div>

                    <!-- Submit -->
                    <button type="submit" id="bk-submit" style="width:100%;background:linear-gradient(135deg,#10b981,#059669);color:#020617;border:none;border-radius:12px;padding:.875rem;font-family:inherit;font-size:1rem;font-weight:800;cursor:pointer;transition:.2s;letter-spacing:.3px">
                        <i class="fas fa-paper-plane" style="margin-right:.4rem"></i> AJUKAN BOOKING
                    </button>

                </form>
            </div>

            <!-- INFO BOX -->
            <div style="margin-top:1rem;background:rgba(59,130,246,.07);border:1px solid rgba(59,130,246,.2);border-radius:12px;padding:.875rem">
                <div style="font-weight:800;font-size:.78rem;color:#3b82f6;margin-bottom:.5rem"><i class="fas fa-info-circle"></i> Aturan Booking</div>
                <div style="font-size:.75rem;color:#94a3b8;line-height:1.8">
                    • Jam operasional: <strong style="color:#e2e8f0">07:30 – 16:00</strong> (Senin–Jumat)<br>
                    • Sabtu: hanya admin / tim umum · Minggu & libur: <strong style="color:#ef4444">TUTUP</strong><br>
                    • Jumat <strong style="color:#e2e8f0">${toTime(CFG.PRAYER_START)}–${toTime(CFG.PRAYER_END)}</strong>: Aula & Serbaguna tidak tersedia (Shalat Jumat)<br>
                    • Booking minimal <strong style="color:#e2e8f0">H-1</strong> · Booking disetujui <strong style="color:#10b981">otomatis</strong> jika tidak ada bentrok<br>
                    • Semua data booking tampil di <strong style="color:#10b981">Command Center</strong> untuk monitoring admin
                </div>
            </div>

        </div>
    `;

    /* ══════════════════════════════════════════════════
       EVENT BINDINGS
    ══════════════════════════════════════════════════ */

    // Back button
    document.getElementById('bk-back')?.addEventListener('click', () => {
        if (typeof window.closeModule === 'function') window.closeModule();
        else history.back();
    });

    // Date label update
    const tglEl = document.getElementById('bk-tgl');
    function updateDayLabel() {
        const el = document.getElementById('bk-day-label');
        if (!el || !tglEl?.value) return;
        const s = tglEl.value;
        const name = dayName(s);
        if (isSun(s) || isHoliday(s)) {
            el.innerHTML = `<span style="color:#ef4444">⛔ ${name} — LIBUR</span>`;
        } else if (isSat(s)) {
            el.innerHTML = `<span style="color:#f59e0b">⚠️ ${name} — Perlu admin</span>`;
        } else if (isFri(s)) {
            el.innerHTML = `<span style="color:#3b82f6">🕌 ${name} — Jumat Berkah</span>`;
        } else {
            el.innerHTML = `<span style="color:#10b981">✅ ${name}</span>`;
        }
    }
    tglEl?.addEventListener('change', () => { updateDayLabel(); realtimeCheck(); });
    updateDayLabel();

    // Real-time check on field change
    ['bk-sarana','bk-mulai','bk-selesai'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', realtimeCheck);
    });

    // Notification button
    document.getElementById('bk-notif-btn')?.addEventListener('click', async () => {
        const notifs = await loadNotifications();
        renderNotifPanel(notifs);
    });

    // Load notification badge on init
    (async () => {
        const notifs = await loadNotifications();
        const badge = document.getElementById('bk-badge');
        if (badge && notifs.length) {
            badge.textContent = notifs.length;
            badge.style.display = 'flex';
            setTimeout(() => renderNotifPanel(notifs), 1200);
        }
    })();

    /* ══════════════════════════════════════════════════
       FORM SUBMIT — THE CORE
    ══════════════════════════════════════════════════ */
    document.getElementById('bk-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fd = new FormData(e.target);
        const data = {
            nama:       fd.get('nama')?.trim(),
            divisi:     fd.get('divisi')?.trim() || null,
            no_hp:      fd.get('no_hp')?.trim(),
            sarana:     fd.get('sarana'),
            tgl:        fd.get('tgl'),
            jam_mulai:  fd.get('jam_mulai'),
            jam_selesai:fd.get('jam_selesai'),
            peralatan:  fd.getAll('alat').join(', ') || null,
            keperluan:  fd.get('keperluan')?.trim() || null
        };

        // ── Step 1: Validation ────────────────────────
        const { errors, warnings } = validateBooking(data);
        warnings.forEach(w => toast(w, 'warning'));
        if (errors.length) {
            errors.forEach(err => toast(err, 'error'));
            return;
        }

        // ── Step 2: Double booking check ─────────────
        const btn = document.getElementById('bk-submit');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-circle-notch" style="animation:bk-spin 1s linear infinite;margin-right:.4rem"></i> Mengecek ketersediaan...';

        const dblCheck = await checkDoubleBooking(data);
        if (dblCheck.conflict) {
            toast(dblCheck.message, 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane" style="margin-right:.4rem"></i> AJUKAN BOOKING';
            // Update availability indicator
            document.getElementById('bk-avail').innerHTML =
                `<span style="color:#ef4444">⛔ ${dblCheck.message}</span>`;
            return;
        }

        // ── Step 3: Save to Supabase ─────────────────
        btn.innerHTML = '<i class="fas fa-circle-notch" style="animation:bk-spin 1s linear infinite;margin-right:.4rem"></i> Menyimpan...';

        try {
            const payload = {
                nama_peminjam: data.nama,
                divisi:        data.divisi,
                no_hp:         data.no_hp,
                ruang:         data.sarana,
                tanggal:       data.tgl,
                jam_mulai:     data.jam_mulai,
                jam_selesai:   data.jam_selesai,
                keperluan:     data.keperluan,
                peralatan:     data.peralatan,
                status:        'approved', // ✅ langsung approved kalau lolos semua validasi
                created_at:    new Date().toISOString(),
                created_by:    currentUser?.name || 'Guest'
            };

            if (supabase) {
                const { error } = await supabase.from('bookings').insert([payload]);
                if (error) throw error;
            } else {
                // Fallback localStorage (dev only)
                const local = JSON.parse(localStorage.getItem('bk_local')||'[]');
                local.push({ ...payload, id: Date.now() });
                localStorage.setItem('bk_local', JSON.stringify(local));
            }

            // Audit log → tampil di Command Center
            await writeAudit(
                'Booking Baru',
                `${data.sarana} · ${data.tgl} · ${data.jam_mulai}–${data.jam_selesai} · ${data.nama}`
            );

            // ── Step 4: Success ───────────────────────
            toast(`✅ Booking ${data.sarana} berhasil! ${data.tgl} ${data.jam_mulai}–${data.jam_selesai}`, 'success');
            document.getElementById('bk-avail').innerHTML =
                `<span style="color:#10b981">✅ Booking berhasil disimpan!</span>`;

            // Reset form
            e.target.reset();
            document.getElementById('bk-tgl').value = minDate();
            updateDayLabel();

        } catch(err) {
            toast('❌ Gagal menyimpan: ' + err.message, 'error');
            console.error('[Booking] submit error:', err);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane" style="margin-right:.4rem"></i> AJUKAN BOOKING';
        }
    });

    // Cleanup
    return function cleanup() {
        clearTimeout(_checkTimeout);
        document.getElementById('bk-notif-panel')?.remove();
        console.log('[Booking] cleanup ✅');
    };
}
