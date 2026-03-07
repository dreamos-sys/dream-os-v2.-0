/**
 * modules/booking/module.js
 * Dream OS v2.0 — Smart Booking Form with AI Guardian
 * ✅ Conflict prediction · Prayer-time aware · Om Team collaboration
 */

'use strict';

/* ── SMART ENGINE IMPORT ── */
import { DREAM_SMART_ENGINE } from '../core/smart-engine.js';

/* ══════════════════════════════════════════════════════════
   SMART FORM VALIDATION
══════════════════════════════════════════════════════════ */
async function validateBooking(data) {
    const validations = [];
    
    // ✅ Smart conflict check
    const conflictCheck = await window.dream_smart_booking_check(data);
    if (!conflictCheck.allowed) {
        if (conflictCheck.conflict) {
            validations.push({
                field: 'ruang',
                message: `⚠️ Conflict terdeteksi:\n${conflictCheck.alternatives.map(a => a.suggestion).join('\n')}`,
                severity: 'warning'
            });
        }
        if (conflictCheck.prayer_time) {
            validations.push({
                field: 'tanggal_jam',
                message: `🕌 Booking saat waktu shalat tidak diizinkan`,
                severity: 'error'
            });
        }
    }
    
    // ✅ Smart duration check
    const startHour = parseInt(data.jam_mulai.split(':')[0]);
    const endHour   = parseInt(data.jam_selesai.split(':')[0]);
    const duration  = endHour - startHour;
    
    if (duration > 8) { // Max 8 hours
        validations.push({
            field: 'jam_selesai',
            message: `⏰ Durasi booking maksimal 8 jam`,
            severity: 'warning'
        });
    }
    
    // ✅ Smart room capacity check    if (data.jumlah_peserta > 100 && data.ruang.includes('Aula')) {
        validations.push({
            field: 'jumlah_peserta',
            message: `👥 Kapasitas Aula maksimal 100 peserta`,
            severity: 'warning'
        });
    }
    
    return validations;
}

/* ══════════════════════════════════════════════════════════
   SMART BOOKING FORM
══════════════════════════════════════════════════════════ */
function renderBookingForm(prefill) {
    prefill = prefill || {};
    const c = getEl('booking-content');
    c.innerHTML = `
      <div class="cc2-panel cc2-sweep">
        <h3 style="font-size:.95rem;font-weight:800;margin-bottom:1rem;color:#10b981">
          <i class="fas fa-calendar-check" style="margin-right:.5rem"></i>
          Formulir Booking Pintar
        </h3>
        
        <!-- SMART WARNING BANNER -->
        <div id="booking-smart-warnings" class="cc2-alert cc2-alert-warning" style="display:none">
          <i class="fas fa-info-circle"></i>
          <div id="warnings-text"></div>
        </div>
        
        <div class="cc2-form-grid">
          <div class="cc2-form-group full">
            <label class="cc2-label">Nama Peminjam *</label>
            <input id="booking-name" class="cc2-input" placeholder="Contoh: Kak Ahmad Rizki" value="${esc(prefill.nama_peminjam || S.user?.name || '')}">
          </div>
          <div class="cc2-form-group">
            <label class="cc2-label">Ruang *</label>
            <select id="booking-room" class="cc2-select">
              <option value="">Pilih ruang</option>
              <option value="Aula SMP" ${prefill.ruang==='Aula SMP'?'selected':''}>Aula SMP</option>
              <option value="Aula SMA" ${prefill.ruang==='Aula SMA'?'selected':''}>Aula SMA</option>
              <option value="Aula Umum" ${prefill.ruang==='Aula Umum'?'selected':''}>Aula Umum</option>
              <option value="Masjid" ${prefill.ruang==='Masjid'?'selected':''}>Masjid</option>
              <option value="Mushalla" ${prefill.ruang==='Mushalla'?'selected':''}>Mushalla</option>
              <option value="Ruang Rapat" ${prefill.ruang==='Ruang Rapat'?'selected':''}>Ruang Rapat</option>
              <option value="Lab Komputer" ${prefill.ruang==='Lab Komputer'?'selected':''}>Lab Komputer</option>
              <option value="Perpustakaan" ${prefill.ruang==='Perpustakaan'?'selected':''}>Perpustakaan</option>
            </select>
          </div>
          <div class="cc2-form-group">            <label class="cc2-label">Tanggal *</label>
            <input id="booking-date" class="cc2-input" type="date" value="${prefill.tanggal || new Date().toISOString().split('T')[0]}">
          </div>
          <div class="cc2-form-group">
            <label class="cc2-label">Jam Mulai *</label>
            <input id="booking-start" class="cc2-input" type="time" value="${prefill.jam_mulai || '08:00'}">
          </div>
          <div class="cc2-form-group">
            <label class="cc2-label">Jam Selesai *</label>
            <input id="booking-end" class="cc2-input" type="time" value="${prefill.jam_selesai || '10:00'}">
          </div>
          <div class="cc2-form-group">
            <label class="cc2-label">Jumlah Peserta</label>
            <input id="booking-participants" class="cc2-input" type="number" placeholder="0" value="${prefill.jumlah_peserta || ''}">
          </div>
          <div class="cc2-form-group">
            <label class="cc2-label">Kontak</label>
            <input id="booking-contact" class="cc2-input" placeholder="WhatsApp/Phone" value="${esc(prefill.kontak || '')}">
          </div>
          <div class="cc2-form-group full">
            <label class="cc2-label">Deskripsi Kegiatan *</label>
            <textarea id="booking-desc" class="cc2-textarea" rows="3" placeholder="Jelaskan kegiatan secara singkat...">${esc(prefill.deskripsi || '')}</textarea>
          </div>
          <div class="cc2-form-group full">
            <label class="cc2-label">Perlengkapan Tambahan</label>
            <div class="cc2-input-rp">
              <span>+</span>
              <input id="booking-equip" class="cc2-input" placeholder="Sound system, proyektor, dll" value="${esc(prefill.perlengkapan_tambahan || '')}">
            </div>
          </div>
        </div>
        
        <hr class="cc2-divider">
        
        <div style="display:flex;gap:.5rem;justify-content:flex-end;flex-wrap:wrap">
          <button class="cc2-btn cc2-btn-bl" id="booking-cancel"><i class="fas fa-times"></i> Batal</button>
          <button class="cc2-btn cc2-btn-em cc2-btn-lg" id="booking-submit"><i class="fas fa-paper-plane"></i> Kirim Booking</button>
        </div>
      </div>`;
    
    // Bind events
    getEl('booking-cancel').addEventListener('click', renderDashboard);
    getEl('booking-submit').addEventListener('click', submitSmartBooking);
    
    // Smart validation on input change
    ['booking-room', 'booking-date', 'booking-start', 'booking-end'].forEach(id => {
        getEl(id)?.addEventListener('change', validateSmartForm);
    });
}
/* ── SMART FORM VALIDATOR ── */
async function validateSmartForm() {
    const data = {
        ruang: getEl('booking-room')?.value || '',
        tanggal: getEl('booking-date')?.value || '',
        jam_mulai: getEl('booking-start')?.value || '',
        jam_selesai: getEl('booking-end')?.value || ''
    };
    
    if (!data.ruang || !data.tanggal || !data.jam_mulai || !data.jam_selesai) return;
    
    const validations = await validateBooking(data);
    
    const banner = getEl('booking-smart-warnings');
    const textEl = getEl('warnings-text');
    
    if (validations.length) {
        banner.style.display = 'flex';
        textEl.innerHTML = validations.map(v => `<div>${v.message}</div>`).join('');
        
        // Highlight problematic fields
        validations.forEach(v => {
            const field = getEl('booking-'+v.field.replace('_',''));
            if (field) field.style.border = v.severity==='error' ? '2px solid #ef4444' : '2px solid #f59e0b';
        });
    } else {
        banner.style.display = 'none';
        // Clear field highlights
        ['booking-room','booking-date','booking-start','booking-end'].forEach(id => {
            const field = getEl(id);
            if (field) field.style.border = '1.5px solid rgba(16,185,129,.22)';
        });
    }
}

/* ── SMART BOOKING SUBMITTER ── */
async function submitSmartBooking() {
    const data = {
        nama_peminjam: (getEl('booking-name')?.value || '').trim(),
        ruang: getEl('booking-room')?.value || '',
        tanggal: getEl('booking-date')?.value || '',
        jam_mulai: getEl('booking-start')?.value || '',
        jam_selesai: getEl('booking-end')?.value || '',
        jumlah_peserta: getEl('booking-participants')?.value || '',
        kontak: (getEl('booking-contact')?.value || '').trim(),
        deskripsi: (getEl('booking-desc')?.value || '').trim(),
        perlengkapan_tambahan: (getEl('booking-equip')?.value || '').trim(),
        created_at: new Date().toISOString(),
        status: 'pending'
    };    
    // Required field validation
    if (!data.nama_peminjam || !data.ruang || !data.tanggal || !data.jam_mulai || !data.jam_selesai || !data.deskripsi) {
        doToast('❌ Lengkapi semua field wajib (*)', 'error');
        return;
    }
    
    // Smart validation
    const validations = await validateBooking(data);
    if (validations.some(v => v.severity === 'error')) {
        doToast('⚠️ Perbaiki error sebelum submit', 'error');
        return;
    }
    
    // Show loading
    const btn = getEl('booking-submit');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch spin"></i> Mengirim...';
    
    if (!_sb) {
        doToast('❌ Database tidak tersedia', 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Booking';
        return;
    }
    
    try {
        // Submit booking
        const res = await _sb.from('bookings').insert([data]);
        if (res.error) throw res.error;
        
        // ✅ Log to smart audit engine
        await DREAM_SMART_ENGINE.audit.log('Booking Submitted', _user, {
            module: 'booking',
            action: 'create',
             { ruang: data.ruang, tanggal: data.tanggal, jam: data.jam_mulai }
        });
        
        // ✅ Auto-notify Om Team
        if (S.sb) {
            // Auto-notify Om Janitor
            await S.sb.from('notifications').insert([{
                recipient_role: 'janitor',
                message: `Kak Booking: Booking baru untuk ruang ${data.ruang} · ${data.tanggal} · ${data.jam_mulai}-${data.jam_selesai}`,
                priority: 'normal',
                created_at: new Date().toISOString()
            }]);
            
            // Auto-notify Om Security (if Aula/Masjid)
            if (data.ruang.includes('Aula') || data.ruang.includes('Masjid')) {                await S.sb.from('notifications').insert([{
                    recipient_role: 'sekuriti',
                    message: `Kak Booking: Booking ${data.ruang} — mohon extra security saat kegiatan`,
                    priority: 'high',
                    created_at: new Date().toISOString()
                }]);
            }
        }
        
        doToast('✅ Booking berhasil dikirim! 🏡', 'success');
        renderDashboard();
        
    } catch (error) {
        console.error('[Booking] Submit failed:', error.message);
        doToast(`❌ Gagal: ${error.message}`, 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Booking';
    }
}

/* ── SMART DASHBOARD WITH PREDICTIONS ── */
function renderDashboard() {
    const c = getEl('booking-content');
    c.innerHTML = `
      <div class="cc2-panel cc2-sweep">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem;margin-bottom:1rem">
          <h3 style="font-size:.95rem;font-weight:800;margin:0;color:#10b981">
            <i class="fas fa-calendar-day" style="margin-right:.5rem"></i>
            Dream AI Guardian Dashboard
          </h3>
          <button class="cc2-btn cc2-btn-em" id="booking-new-btn"><i class="fas fa-plus"></i> Booking Baru</button>
        </div>
        
        <!-- SMART PREDICTION PANEL -->
        <div class="cc2-ai" style="margin-bottom:1.25rem">
          <h4 style="font-size:.88rem;font-weight:800;margin-bottom:.5rem;color:#a855f7">
            🧠 Prediksi Dream AI Guardian
          </h4>
          <div id="booking-predictions" style="font-size:.78rem;color:#94a3b8;margin-bottom:.5rem"></div>
        </div>
        
        <!-- BOOKING LIST -->
        <div id="booking-list"></div>
      </div>`;
    
    getEl('booking-new-btn').addEventListener('click', () => renderBookingForm());
    loadSmartBookingList();
    showSmartPredictions();
}
/* ── SMART PREDICTIONS ── */
function showSmartPredictions() {
    if (!_sb) return;
    
    // Load booking patterns
    _sb.from('bookings').select('ruang,tanggal,jam_mulai,jam_selesai,status').order('created_at', { ascending: false }).limit(50)
        .then(res => {
            if (res.error) return;
            const bookings = res.data || [];
            
            // Analyze patterns
            const predictions = analyzeBookingPatterns(bookings);
            const predEl = getEl('booking-predictions');
            if (!predEl) return;
            
            predEl.innerHTML = predictions.map(p => `<div style="margin-bottom:.3rem">💡 ${p}</div>`).join('');
        });
}

function analyzeBookingPatterns(bookings) {
    const predictions = [];
    
    // Peak room usage
    const roomUsage = {};
    bookings.forEach(b => {
        roomUsage[b.ruang] = (roomUsage[b.ruang] || 0) + 1;
    });
    
    const peakRooms = Object.entries(roomUsage)
        .sort(([,a],[,b]) => b - a)
        .slice(0, 3);
    
    if (peakRooms.length) {
        predictions.push(`Ruang paling banyak dibooking: ${peakRooms.map(([room,count]) => `${room} (${count})`).join(', ')}`);
    }
    
    // Time patterns
    const timeUsage = {};
    bookings.forEach(b => {
        const hour = parseInt(b.jam_mulai.split(':')[0]);
        timeUsage[hour] = (timeUsage[hour] || 0) + 1;
    });
    
    const peakHours = Object.entries(timeUsage)
        .sort(([,a],[,b]) => b - a)
        .slice(0, 3);
    
    if (peakHours.length) {
        predictions.push(`Jam booking paling ramai: ${peakHours.map(([hour,count]) => `${hour}:00 (${count})`).join(', ')}`);
    }    
    // Duration patterns
    const durations = bookings.map(b => {
        const start = parseInt(b.jam_mulai.split(':')[0]);
        const end   = parseInt(b.jam_selesai.split(':')[0]);
        return end - start;
    }).filter(d => d > 0);
    
    if (durations.length) {
        const avgDuration = Math.round(durations.reduce((a,b) => a+b, 0) / durations.length);
        predictions.push(`Durasi rata-rata booking: ${avgDuration} jam`);
    }
    
    // Conflict patterns
    const conflicts = bookings.filter(b => b.status === 'conflict').length;
    if (conflicts > 0) {
        predictions.push(`⚠️ ${conflicts} booking mengalami conflict — perlu penjadwalan ulang`);
    }
    
    return predictions;
}

/* ── SMART BOOKING LIST LOADER ── */
async function loadSmartBookingList() {
    if (!_sb) return;
    
    const isAdmin = S.user && (S.user.perms || []).includes('all');
    let query = _sb.from('bookings').select('*').order('tanggal', { ascending: false }).order('jam_mulai');
    if (!isAdmin && S.user) query = query.eq('nama_peminjam', S.user.name);
    
    const res = await query;
    const data = res.data || [];
    
    const listEl = getEl('booking-list');
    if (!listEl) return;
    
    if (!data.length) {
        listEl.innerHTML = '<p style="text-align:center;padding:2rem;opacity:.45">🎉 Belum ada booking hari ini</p>';
        return;
    }
    
    listEl.innerHTML = data.map(b => {
        const statusBadge = b.status==='pending'?'<span class="cc2-badge cc2-b-pend">Pending</span>':
                           b.status==='approved'?'<span class="cc2-badge cc2-b-appr">Disetujui</span>':
                           b.status==='rejected'?'<span class="cc2-badge cc2-b-rej">Ditolak</span>':
                           b.status==='completed'?'<span class="cc2-badge cc2-b-em">Selesai</span>':'<span class="cc2-badge cc2-b-draft">Draft</span>';
        
        const isPrayerTime = DREAM_SMART_ENGINE.schedule.isPrayerTime(new Date(b.tanggal + 'T' + b.jam_mulai + ':00'));
        const prayerWarning = isPrayerTime ? '<span style="color:#f59e0b;font-size:.65rem">⚠️ Waktu shalat</span>' : '';
                return `<div class="cc2-card" style="border-left:3px solid ${b.status==='pending'?'#f59e0b':b.status==='approved'?'#10b981':b.status==='rejected'?'#ef4444':'#94a3b8'}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.5rem;margin-bottom:.55rem">
            <div>
              <div style="font-weight:700;font-size:.85rem">${esc(b.nama_peminjam || '—')}</div>
              <div style="font-size:.67rem;color:#64748b">${esc(b.ruang || '—')} · ${fmtDate(b.tanggal)} · ${b.jam_mulai}-${b.jam_selesai}</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.2rem">${statusBadge}${prayerWarning}</div>
          </div>
          <div style="font-size:.75rem;color:#94a3b8;margin-bottom:.55rem;border-left:2px solid rgba(255,255,255,.12);padding-left:.6rem">${esc(b.deskripsi || '—')}</div>
          <div style="display:flex;gap:.4rem;flex-wrap:wrap">
            ${isAdmin && b.status==='pending' ? 
              `<button class="cc2-btn cc2-btn-em cc2-btn-sm" data-act="approve" data-id="${b.id}"><i class="fas fa-check"></i> Setujui</button>
               <button class="cc2-btn cc2-btn-re cc2-btn-sm" data-act="reject" data-id="${b.id}"><i class="fas fa-times"></i> Tolak</button>` : 
              b.status==='approved' ? '<span style="color:#10b981;font-size:.7rem">✅ Sudah disetujui</span>' :
              b.status==='rejected' ? '<span style="color:#ef4444;font-size:.7rem">❌ Ditolak</span>' : ''}
          </div>
        </div>`;
    }).join('');
    
    // Bind approval events
    if (isAdmin) {
        document.querySelectorAll('[data-act]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const { act, id } = e.target.dataset;
                await handleApproval(act, id);
            });
        });
    }
}

/* ── SMART APPROVAL HANDLER ── */
async function handleApproval(action, id) {
    if (!_sb) return;
    
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    const res = await _sb.from('bookings').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
    if (res.error) {
        doToast(`❌ Gagal: ${res.error.message}`, 'error');
        return;
    }
    
    // ✅ Log to audit
    await DREAM_SMART_ENGINE.audit.log(`Booking ${action.charAt(0).toUpperCase() + action.slice(1)}`, _user, {
        module: 'booking',
        action,
        record_id: id
    });
    
    // ✅ Auto-notify user    const booking = await _sb.from('bookings').select('*').eq('id', id).single();
    if (booking.data) {
        const userMsg = `Kak ${booking.data.nama_peminjam}, booking ruang ${booking.data.ruang} telah ${action === 'approve' ? 'disetujui' : 'ditolak'}`;
        doToast(`✅ Booking ${action === 'approve' ? 'disetujui' : 'ditolak'}`, 'success');
        
        // Auto-notify Om Janitor/Security if approved
        if (action === 'approve') {
            await S.sb.from('notifications').insert([{
                recipient_role: 'janitor',
                message: `Kak Booking: Booking ${booking.data.ruang} · ${booking.data.tanggal} · ${booking.data.jam_mulai} disetujui — Om Janitor, siapkan ruang`,
                priority: 'normal',
                created_at: new Date().toISOString()
            }]);
        }
    }
    
    loadSmartBookingList();
}

/* ── GLOBAL INIT ── */
window.booking_onMount = function(content, supabase) {
    _sb = supabase;
    renderDashboard();
    
    // Subscribe to booking changes for real-time updates
    if (_sb) {
        _sb.channel('booking-smart')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, () => {
                if (S.tab === 'booking') loadSmartBookingList();
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' }, () => {
                if (S.tab === 'booking') loadSmartBookingList();
            })
            .subscribe();
    }
    
    return function cleanup() {
        if (_sb) _sb.removeChannel('booking-smart');
    };
};
