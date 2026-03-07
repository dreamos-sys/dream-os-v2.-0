/**
 * modules/core/smart-engine.js
 * Dream OS v2.0 — Smart AI Guardian Engine
 * ✅ Self-learning · Prayer-aware · Predictive · Auto-healing
 * 
 * Dream Team Family © 2026 · Bi idznillah
 */

'use strict';

/* ══════════════════════════════════════════════════════════
   DREAM SMART ENGINE CORE
══════════════════════════════════════════════════════════ */
const DREAM_SMART_ENGINE = {
    
    /* ── CONFIG ── */
    config: {
        prayerTimes: {
            subuh:   [330, 390],   // 05:30-06:30
            dzuhur:  [690, 720],   // 11:30-12:00
            ashar:   [870, 900],   // 14:30-15:00
            maghrib: [1050, 1080], // 17:30-18:00
            isya:    [1230, 1260], // 20:30-21:00
            jumat:   [630, 780]    // 10:30-13:00 (Jumat ceremony)
        },
        bookingMaxDuration: 8, // hours
        stockAlertDays: 3,
        autoBackupInterval: 24 * 60 * 60 * 1000, // 24 hours
        omTeamTitles: {
            'sekuriti':    { formal: 'Kak', familiar: 'Om', relation: 'protector' },
            'janitor':     { formal: 'Kak', familiar: 'Om', relation: 'caretaker' },
            'stok':        { formal: 'Kak', familiar: 'Om', relation: 'provider' },
            'maintenance': { formal: 'Kak', familiar: 'Om', relation: 'helper' },
            'inventaris':  { formal: 'Kak', familiar: 'Om', relation: 'guardian' },
            'gudang':      { formal: 'Kak', familiar: 'Om', relation: 'keeper' },
            'asset':       { formal: 'Kak', familiar: 'Om', relation: 'custodian' },
            'booking':     { formal: 'Kak', familiar: 'Kak', relation: 'scheduler' },
            'k3':          { formal: 'Kak', familiar: 'Kak', relation: 'safety-officer' },
            'admin':       { formal: 'Kak', familiar: 'Kak', relation: 'leader' },
            'master':      { formal: 'Pak/Bu', familiar: 'Pak/Bu', relation: 'elder' },
            'developer':   { formal: 'Mas/Mbak', familiar: 'Mas/Mbak', relation: 'builder' }
        }
    },
    
    /* ── SMART SCHEDULING ENGINE ── */
    schedule: {
        
        // ✅ Convert time string to decimal
        timeToDecimal: function(timeStr) {
            if (!timeStr) return 0;            const [h, m] = timeStr.split(':').map(Number);
            return h + (m / 60);
        },
        
        // ✅ Convert decimal to time string
        decimalToTime: function(decimal) {
            const h = Math.floor(decimal);
            const m = Math.round((decimal - h) * 60);
            return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
        },
        
        // ✅ Check if datetime is prayer time
        isPrayerTime: function(datetime) {
            const date = new Date(datetime);
            const day  = date.getDay(); // 0=Sunday, 5=Friday
            const time = date.getHours() * 60 + date.getMinutes();
            
            // Jumat: 10:30-13:00 (Jumat ceremony time)
            if (day === 5 && time >= 630 && time <= 780) return true;
            
            // Other prayer times
            const prayerTimes = [
                this.config.prayerTimes.subuh,
                this.config.prayerTimes.dzuhur,
                this.config.prayerTimes.ashar,
                this.config.prayerTimes.maghrib,
                this.config.prayerTimes.isya
            ];
            
            return prayerTimes.some(([start, end]) => time >= start && time <= end);
        },
        
        // ✅ Get next prayer time
        getNextPrayerTime: function(datetime) {
            const date = new Date(datetime);
            const currentTime = date.getHours() * 60 + date.getMinutes();
            
            const prayers = [
                { name: 'Subuh',   time: this.config.prayerTimes.subuh[0] },
                { name: 'Dzuhur',  time: this.config.prayerTimes.dzuhur[0] },
                { name: 'Ashar',   time: this.config.prayerTimes.ashar[0] },
                { name: 'Maghrib', time: this.config.prayerTimes.maghrib[0] },
                { name: 'Isya',    time: this.config.prayerTimes.isya[0] }
            ];
            
            // Find next prayer
            const next = prayers.find(p => p.time > currentTime);
            if (next) {
                const h = Math.floor(next.time / 60);
                const m = next.time % 60;                return { name: next.name, time: `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}` };
            }
            
            // Next day Subuh
            return { name: 'Subuh', time: '05:30' };
        },
        
        // ✅ Check booking conflicts
        checkConflicts: function(newBooking, existingBookings) {
            if (!newBooking || !existingBookings) return false;
            
            const newStart = this.timeToDecimal(newBooking.jam_mulai);
            const newEnd   = this.timeToDecimal(newBooking.jam_selesai);
            
            return existingBookings.some(b => {
                if (b.id === newBooking.id) return false; // Skip self
                if (b.status === 'rejected' || b.status === 'cancelled') return false;
                
                const bStart = this.timeToDecimal(b.jam_mulai);
                const bEnd   = this.timeToDecimal(b.jam_selesai);
                
                return newBooking.ruang === b.ruang &&
                       newBooking.tanggal === b.tanggal &&
                       newStart < bEnd && newEnd > bStart;
            });
        },
        
        // ✅ Smart auto-resolve conflicts
        autoResolve: function(conflict) {
            if (!conflict || !conflict.booking) return null;
            
            const suggestions = [];
            
            // Alternative rooms
            const allRooms = ['Aula SMP', 'Aula SMA', 'Aula Umum', 'Masjid', 'Mushalla', 'Ruang Rapat', 'Lab Komputer', 'Perpustakaan'];
            const availableRooms = allRooms.filter(room => 
                room !== conflict.booking.ruang && 
                !this.checkConflicts({...conflict.booking, ruang: room}, conflict.existing || [])
            );
            
            suggestions.push(...availableRooms.map(r => ({
                type: 'room_change',
                suggestion: `Pindah ke ${r}`,
                priority: 'high'
            })));
            
            // Alternative times (±30 minutes)
            const currentTime = this.timeToDecimal(conflict.booking.jam_mulai);
            for (let offset = 30; offset <= 120; offset += 30) {
                const altStart = currentTime + (offset/60);                const altEnd   = this.timeToDecimal(conflict.booking.jam_selesai) + (offset/60);
                
                // Check if alternative time is prayer time
                const testDate = new Date(conflict.booking.tanggal + 'T' + this.decimalToTime(altStart) + ':00');
                if (!this.isPrayerTime(testDate)) {
                    suggestions.push({
                        type: 'time_shift',
                        suggestion: `Shift ke ${this.decimalToTime(altStart)}-${this.decimalToTime(altEnd)}`,
                        priority: 'medium'
                    });
                }
            }
            
            return {
                alternatives: suggestions,
                priority: 'high',
                resolved: suggestions.length > 0
            };
        }
    },
    
    /* ── SMART NOTIFICATION ENGINE ── */
    notify: {
        
        // ✅ Get Om Team title
        getOmTitle: function(role, context = 'familiar') {
            const config = DREAM_SMART_ENGINE.config.omTeamTitles[role] || { formal: 'Kak', familiar: 'Kak', relation: 'team' };
            return config[context] || config.formal;
        },
        
        // ✅ Predict what might happen
        predict: function(currentData) {
            const predictions = [];
            
            // Stock prediction
            if (currentData.inventory && currentData.inventory.length) {
                currentData.inventory.forEach(item => {
                    const daysLeft = Math.round(item.jumlah / (item.avg_daily_usage || 1));
                    if (daysLeft <= DREAM_SMART_ENGINE.config.stockAlertDays) {
                        predictions.push({
                            type: 'stock_low',
                            message: `Stok ${item.nama_barang} tinggal ${daysLeft} hari — ${this.getOmTitle('stok')} Stok, mohon reorder`,
                            urgency: 'high',
                            target: 'stok'
                        });
                    }
                });
            }
            
            // Maintenance prediction            if (currentData.maintenance && currentData.maintenance.length) {
                const frequentIssues = currentData.maintenance
                    .filter(h => h.frequency >= 3)
                    .map(h => h.equipment);
                
                if (frequentIssues.length) {
                    predictions.push({
                        type: 'preventive_maintenance',
                        message: `Equipment ${frequentIssues.join(', ')} sering rusak — ${this.getOmTitle('maintenance')} Maintenance, mohon preventive maintenance`,
                        urgency: 'medium',
                        target: 'maintenance'
                    });
                }
            }
            
            // Booking pattern prediction
            if (currentData.bookings && currentData.bookings.length) {
                const roomUsage = {};
                currentData.bookings.forEach(b => {
                    roomUsage[b.ruang] = (roomUsage[b.ruang] || 0) + 1;
                });
                
                const peakRooms = Object.entries(roomUsage)
                    .filter(([,count]) => count >= 5)
                    .map(([room]) => room);
                
                if (peakRooms.length) {
                    predictions.push({
                        type: 'peak_usage',
                        message: `Ruang ${peakRooms.join(', ')} sering penuh — auto-suggest ruang alternatif`,
                        urgency: 'low',
                        target: 'booking'
                    });
                }
            }
            
            // K3 safety prediction
            if (currentData.k3 && currentData.k3.length) {
                const highPriority = currentData.k3.filter(k => k.priority === 'high').length;
                if (highPriority >= 3) {
                    predictions.push({
                        type: 'safety_alert',
                        message: `${highPriority} laporan K3 prioritas tinggi — ${this.getOmTitle('sekuriti')} Security, mohon extra vigilance`,
                        urgency: 'high',
                        target: 'sekuriti'
                    });
                }
            }
            
            return predictions;        },
        
        // ✅ Prioritize alerts
        prioritize: function(alert) {
            const priorities = {
                'emergency': 5,
                'high': 4,
                'medium': 3,
                'normal': 2,
                'low': 1
            };
            return priorities[alert.urgency] || 2;
        },
        
        // ✅ Route to correct Om
        route: function(message, targetRole) {
            const title = this.getOmTitle(targetRole, 'familiar');
            const recipient = `${title} ${targetRole.charAt(0).toUpperCase() + targetRole.slice(1)}`;
            
            return {
                recipient,
                message: message.replace(/(Om|Kak|Pak|Bu)/, title),
                channel: 'in_app',
                priority: this.prioritize({ urgency: 'normal' })
            };
        }
    },
    
    /* ── SMART AUDIT ENGINE ── */
    audit: {
        
        // ✅ Smart logging with context
        log: async function(action, user, context, additionalData = {}) {
            // Check if Supabase is available
            if (!window.S?.sb && !window._sb) {
                console.warn('[SmartEngine] ⚠️ No database connection for audit');
                return;
            }
            
            const sb = window.S?.sb || window._sb;
            
            const auditEntry = {
                action,
                detail: JSON.stringify(context),
                user: user?.name || 'System',
                role: user?.role || 'guest',
                module: context?.module || 'unknown',
                timestamp: new Date().toISOString(),
                ip_address: await this.getClientIP(),
                user_agent: navigator.userAgent,                ...additionalData
            };
            
            try {
                await sb.from('audit_logs').insert(auditEntry);
                console.log('[SmartEngine] ✅ Audit logged:', action);
            } catch (e) {
                console.warn('[SmartEngine] ⚠️ Audit log failed:', e.message);
            }
        },
        
        // ✅ Trace 4W (What, When, Where, Why)
        trace: function(what, when, where, why) {
            return {
                what, when, where, why,
                who: window.S?.user?.name || 'System',
                how: 'via ' + (window.S?.user?.role || 'unknown_module'),
                status: 'logged',
                created_at: new Date().toISOString()
            };
        },
        
        // ✅ Get client IP
        getClientIP: async function() {
            try {
                const response = await fetch('https://api.ipify.org');
                return await response.text();
            } catch (e) {
                return 'unknown';
            }
        }
    },
    
    /* ── SMART BACKUP ENGINE ── */
    backup: {
        
        // ✅ Selective backup (critical data only)
        selective: function(data) {
            const criticalTables = [
                'bookings', 'k3_reports', 'pengajuan_dana', 
                'spj', 'audit_logs', 'maintenance_tasks'
            ];
            
            const criticalData = {};
            criticalTables.forEach(table => {
                if (data[table]) {
                    criticalData[table] = data[table].filter(record => 
                        record.status === 'pending' || 
                        record.status === 'urgent' || 
                        new Date(record.created_at) > new Date(Date.now() - 7*24*60*60*1000) // Last week                    );
                }
            });
            
            return criticalData;
        },
        
        // ✅ Auto-backup with smart scheduling
        auto: function(schedule = 'daily') {
            const backupSchedule = {
                'daily': 24*60*60*1000,
                'weekly': 7*24*60*60*1000,
                'monthly': 30*24*60*60*1000
            };
            
            const interval = backupSchedule[schedule] || backupSchedule.daily;
            
            setInterval(async () => {
                if (!window.S?.sb) {
                    console.warn('[SmartEngine] ⚠️ No database for backup');
                    return;
                }
                
                try {
                    const tables = ['bookings', 'k3_reports', 'pengajuan_dana', 'spj', 'audit_logs'];
                    const backupData = {};
                    
                    for (const table of tables) {
                        const { data, error } = await window.S.sb
                            .from(table)
                            .select('*')
                            .gte('created_at', new Date(Date.now() - 7*24*60*60*1000).toISOString());
                        
                        if (!error) backupData[table] = data;
                    }
                    
                    const selectiveData = this.selective(backupData);
                    localStorage.setItem('dreamos_backup_' + Date.now(), JSON.stringify(selectiveData));
                    
                    // Log backup
                    await DREAM_SMART_ENGINE.audit.log('System Backup', window.S.user, {
                        schedule,
                        records_backed_up: Object.keys(selectiveData).reduce((a,t) => a + (selectiveData[t]?.length||0), 0),
                        timestamp: new Date().toISOString()
                    });
                    
                    console.log('[SmartEngine] ✅ Auto backup completed');
                    
                } catch (e) {
                    console.warn('[SmartEngine] ⚠️ Auto backup failed:', e.message);                }
            }, interval);
        }
    },
    
    /* ── SMART TRUST INDICATORS ── */
    trust: {
        
        // ✅ Calculate safety level
        calculateSafety: function(k3Reports) {
            if (!k3Reports || !k3Reports.length) return 100;
            const highPriority = k3Reports.filter(r => r.priority === 'high').length;
            return Math.max(0, Math.min(100, 100 - (highPriority * 5)));
        },
        
        // ✅ Calculate cleanliness level
        calculateCleanliness: function(janitorTasks) {
            if (!janitorTasks || !janitorTasks.length) return 95;
            const completed = janitorTasks.filter(t => t.status === 'completed').length;
            return Math.round((completed / janitorTasks.length) * 100);
        },
        
        // ✅ Calculate security level
        calculateSecurity: function(securityIncidents) {
            if (!securityIncidents || !securityIncidents.length) return 100;
            const recent = securityIncidents.filter(i => 
                new Date(i.created_at) > new Date(Date.now() - 24*60*60*1000)
            ).length;
            return Math.max(0, Math.min(100, 100 - (recent * 10)));
        },
        
        // ✅ Calculate prayer time compliance
        calculatePrayerCompliance: function(bookings) {
            if (!bookings || !bookings.length) return 100;
            const violations = bookings.filter(b => 
                DREAM_SMART_ENGINE.schedule.isPrayerTime(new Date(b.tanggal + 'T' + b.jam_mulai + ':00'))
            ).length;
            return Math.max(0, Math.min(100, 100 - (violations * 20)));
        }
    },
    
    /* ── INITIALIZATION ── */
    init: function() {
        console.log('🧠 Dream Smart Engine initializing...');
        
        // Start auto-backup
        this.backup.auto('daily');
        
        // Expose to window for module access
        if (typeof window !== 'undefined') {            window.DREAM_SMART_ENGINE = this;
            window.dream_smart_booking_check = async (data) => {
                if (!window.S?.sb) return { allowed: true };
                
                const { data: existing, error } = await window.S.sb
                    .from('bookings')
                    .select('*')
                    .eq('tanggal', data.tanggal)
                    .eq('status', 'approved');
                
                if (error) return { allowed: true, warning: 'Cannot verify availability' };
                
                const hasConflict = this.schedule.checkConflicts(data, existing);
                
                if (hasConflict) {
                    const resolution = this.schedule.autoResolve({
                        booking: data,
                        existing: existing
                    });
                    
                    return { 
                        allowed: false, 
                        conflict: true,
                        alternatives: resolution?.alternatives || []
                    };
                }
                
                if (this.schedule.isPrayerTime(new Date(data.tanggal + 'T' + data.jam_mulai))) {
                    return { 
                        allowed: false, 
                        prayer_time: true,
                        message: 'Booking saat waktu shalat tidak diizinkan'
                    };
                }
                
                return { allowed: true };
            };
        }
        
        console.log('✅ Dream Smart Engine ready — Bi idznillah 💚');
    }
};

/* ── AUTO-INIT ── */
if (typeof window !== 'undefined') {
    DREAM_SMART_ENGINE.init();
}

/* ── EXPORT ── */
if (typeof module !== 'undefined' && module.exports) {    module.exports = { DREAM_SMART_ENGINE };
}

// Export for ES modules
if (typeof window !== 'undefined') {
    window.DREAM_SMART_ENGINE = DREAM_SMART_ENGINE;
}
