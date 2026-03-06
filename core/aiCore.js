/**
 * core/aiCore.js
 * AI CORE ENGINE - The Current Oracle
 * Dream OS v2.0 | Ocean Logic System
 * "Lautan yang tahu dasarnya"
 * 
 * ✅ FIXED VERSION
 * - Defense protocol proporsional (tidak langsung hapus data)
 * - Interval cleanup anti memory leak
 * - Session age logic benar
 * - Aura effect tidak merusak UX
 * - Prayer times sinkron dengan config.prayerTimes
 * - Shalawat spirit tetap terjaga 💚
 */

'use strict';

/* ══════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════ */
const PULSE_INTERVAL    = 5000;   // 5 detik
const MAX_LOGIN_WARN    = 3;      // Warning setelah 3x gagal
const MAX_LOGIN_LOCK    = 5;      // Lockout setelah 5x gagal
const SESSION_ALERT_MS  = 300000; // 5 menit = alert
const SESSION_MAX_MS    = 3600000;// 1 jam = force logout

/* ══════════════════════════════════════════════════════════
   AI CORE ENGINE
══════════════════════════════════════════════════════════ */
export const aiCore = {

    // ── STATE ────────────────────────────────────────────
    mood:       'PEACEFUL',
    pulse:      100,
    threats:    0,
    lastCheck:  Date.now(),
    _intervalId: null,        // ✅ FIX: simpan ID untuk cleanup
    _locked:    false,        // ✅ FIX: lockout flag
    _listeners: [],           // ✅ FIX: event listeners registry

    // ── MOOD DEFINITIONS ─────────────────────────────────
    moods: {
        PEACEFUL: {
            color: '#10b981',
            glow:  '0 0 30px rgba(16,185,129,0.4)',
            msg:   '✅ Arus tenang. Bismillah — semua modul sinkron 100%.',
            // ✅ FIX: Tidak ada body filter di PEACEFUL
            bodyFilter: 'none'
        },
        CAUTIOUS: {
            color: '#3b82f6',
            glow:  '0 0 30px rgba(59,130,246,0.4)',
            msg:   '🛡️ Geofence 5KM aktif. Sistem dalam perlindungan penuh.',
            bodyFilter: 'none'  // ✅ FIX: Tidak filter body
        },
        ALERT: {
            color: '#f59e0b',
            glow:  '0 0 30px rgba(245,158,11,0.4)',
            msg:   '⚠️ Ada getaran asing. AI Core sedang menyerap gangguan.',
            bodyFilter: 'none'  // ✅ FIX: Tidak filter body
        },
        HOSTILE: {
            color: '#ef4444',
            glow:  '0 0 40px rgba(239,68,68,0.6)',
            msg:   '🚨 Upaya paksa terdeteksi. Protokol keamanan aktif.',
            // ✅ FIX: Hanya border pulse, tidak hue-rotate seluruh body
            bodyFilter: 'none'
        }
    },

    // ── PRAYER TIMES (sinkron dengan config) ─────────────
    // ✅ FIX: Gunakan format yang konsisten, bisa override dari config
    prayerTimes: {
        Subuh:  { start: '04:30', end: '06:00', arabic: 'الفجر' },
        Dzuhur: { start: '12:00', end: '14:30', arabic: 'الظهر' },
        Ashar:  { start: '14:31', end: '17:30', arabic: 'العصر' },
        Maghrib:{ start: '17:31', end: '18:30', arabic: 'المغرب' },
        Isya:   { start: '18:31', end: '23:59', arabic: 'العشاء' }
    },

    /* ══════════════════════════════════════════════════
       INIT — dengan support cleanup
    ══════════════════════════════════════════════════ */
    init(externalConfig) {
        // Sinkron prayer times dari config eksternal jika ada
        if (externalConfig?.prayerTimes) {
            this.prayerTimes = {
                ...this.prayerTimes,
                ...externalConfig.prayerTimes
            };
        }

        // ✅ FIX: Bersihkan interval lama sebelum buat baru
        this.destroy();

        // Set session start jika belum ada
        if (!sessionStorage.getItem('session_start')) {
            sessionStorage.setItem('session_start', Date.now().toString());
        }

        // Jalankan pertama kali
        this.checkPulse();
        this.updateAura();

        // ✅ FIX: Simpan ID interval
        this._intervalId = setInterval(() => {
            this.checkPulse();
            this.updateAura();
        }, PULSE_INTERVAL);

        console.log('🧠 AI Core Engine Initialized — Ocean Logic Active 🌊');
        console.log('✨ The Power Soul of Shalawat is protecting the system.');

        return this; // chainable
    },

    /* ══════════════════════════════════════════════════
       DESTROY — cleanup sempurna
    ══════════════════════════════════════════════════ */
    destroy() {
        if (this._intervalId) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
        // Restore body filter jika ada
        if (document.body) {
            document.body.style.filter = 'none';
        }
    },

    /* ══════════════════════════════════════════════════
       CHECK PULSE — logika ancaman yang proporsional
    ══════════════════════════════════════════════════ */
    checkPulse() {
        const loginAttempts = parseInt(sessionStorage.getItem('login_attempts') || '0');
        const sessionStart  = parseInt(sessionStorage.getItem('session_start') || '0');

        // ✅ FIX: sessionAge benar — fallback ke 0 jika tidak ada session
        const sessionAge = sessionStart > 0 ? (Date.now() - sessionStart) : 0;
        const isOffline  = !navigator.onLine;

        // ── Threat Assessment ────────────────────────
        if (loginAttempts >= MAX_LOGIN_LOCK) {
            // ✅ FIX: Hanya lockout UI, TIDAK hapus data otomatis
            this.mood = 'HOSTILE';
            if (!this._locked) {
                this._locked = true;
                this.threats++;
                this._triggerDefense(loginAttempts);
            }
        } else if (loginAttempts >= MAX_LOGIN_WARN) {
            this.mood = 'ALERT';
            this.threats = Math.max(this.threats, 1);
        } else if (isOffline) {
            this.mood = 'CAUTIOUS';
        } else if (sessionAge > SESSION_MAX_MS) {
            // Session terlalu lama — paksa logout bersih
            this.mood = 'ALERT';
            this._emitEvent('session_expired');
        } else if (sessionAge > SESSION_ALERT_MS) {
            this.mood = 'ALERT';
        } else {
            this.mood    = 'PEACEFUL';
            this._locked = false;
        }

        this.lastCheck = Date.now();
        return this.mood;
    },

    /* ══════════════════════════════════════════════════
       TRIGGER DEFENSE — proporsional & tidak destruktif
    ══════════════════════════════════════════════════ */
    _triggerDefense(attempts) {
        console.warn('🛡️ DEPOK LIGHTNING STRIKE — Level', this.threats);

        if (this.threats === 1) {
            // Level 1: Tampilkan warning ke user
            this._emitEvent('defense_warn', {
                attempts,
                message: '⚠️ Terlalu banyak percobaan login. Akun terkunci 5 menit.'
            });

            // Lockout sementara 5 menit
            const lockUntil = Date.now() + (5 * 60 * 1000);
            sessionStorage.setItem('lockout_until', lockUntil.toString());
            sessionStorage.setItem('login_attempts', '0'); // Reset counter

        } else if (this.threats === 2) {
            // Level 2: Perpanjang lockout + notif admin
            this._emitEvent('defense_escalate', {
                attempts,
                message: '🚨 Percobaan akses tidak sah berulang. Sesi dihentikan.'
            });
            // ✅ Hanya hapus session, BUKAN localStorage
            sessionStorage.clear();
            sessionStorage.setItem('session_start', Date.now().toString());

        } else if (this.threats >= 3) {
            // Level 3: Full lockout — emit event untuk parent handle
            // ✅ FIX: TIDAK localStorage.clear() otomatis
            // Biarkan parent app yang memutuskan
            this._emitEvent('defense_critical', {
                attempts,
                message: '💀 Protokol keamanan maksimum. Sistem terkunci.'
            });

            // Log untuk audit (tanpa data sensitif)
            console.warn('[AiCore] Critical defense triggered. threats:', this.threats);
        }
    },

    /* ══════════════════════════════════════════════════
       UPDATE AURA — aman untuk UX
    ══════════════════════════════════════════════════ */
    updateAura() {
        const moodData = this.moods[this.mood];
        if (!moodData) return;

        const widget = document.getElementById('ai-core-widget');

        if (widget) {
            widget.style.borderColor = moodData.color;
            widget.style.boxShadow   = moodData.glow;
            widget.setAttribute('data-mood', this.mood);

            // ✅ FIX: Hanya widget yang berubah visual, bukan seluruh body
            if (this.mood === 'HOSTILE') {
                widget.style.animation = 'aicore-hostile-pulse 1s ease-in-out infinite';
            } else {
                widget.style.animation = '';
            }
        }

        // ✅ FIX: Body filter hanya untuk emergency — dan dengan overlay, bukan hue-rotate
        // Tidak ada lagi hue-rotate(180deg) yang merusak seluruh UI
        document.body.style.filter = 'none';

        return moodData;
    },

    /* ══════════════════════════════════════════════════
       SPIRITUAL CHECK — sinkron dengan prayer times
    ══════════════════════════════════════════════════ */
    spiritualCheck() {
        const now  = new Date();
        const hhmm = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');

        // ✅ FIX: Gunakan this.prayerTimes (sinkron dengan config)
        for (const [name, time] of Object.entries(this.prayerTimes)) {
            if (this._inTimeRange(hhmm, time.start, time.end)) {
                return `🕌 Waktu ${name}. Refresh aura dengan Shalawat — Bi idznillah 💚`;
            }
        }

        return '✨ The Power Soul of Shalawat is protecting the system.';
    },

    /* ══════════════════════════════════════════════════
       GET MESSAGE
    ══════════════════════════════════════════════════ */
    getMessage() {
        return this.moods[this.mood]?.msg || '✅ System normal.';
    },

    /* ══════════════════════════════════════════════════
       GET STATUS — untuk dashboard
    ══════════════════════════════════════════════════ */
    getStatus() {
        return {
            mood:        this.mood,
            pulse:       this.pulse,
            threats:     this.threats,
            lastCheck:   this.lastCheck,
            message:     this.getMessage(),
            spiritual:   this.spiritualCheck(),
            color:       this.moods[this.mood]?.color || '#10b981',
            sessionAge:  Date.now() - parseInt(sessionStorage.getItem('session_start') || Date.now()),
            isLocked:    this._locked
        };
    },

    /* ══════════════════════════════════════════════════
       EVENT SYSTEM — decoupled dari DOM
    ══════════════════════════════════════════════════ */
    on(event, callback) {
        this._listeners.push({ event, callback });
        return this; // chainable
    },

    off(event) {
        this._listeners = this._listeners.filter(l => l.event !== event);
        return this;
    },

    _emitEvent(event, data) {
        this._listeners
            .filter(l => l.event === event)
            .forEach(l => {
                try { l.callback(data); }
                catch(e) { console.warn('[AiCore] Event handler error:', e.message); }
            });

        // Juga dispatch sebagai CustomEvent untuk komponen lain
        try {
            window.dispatchEvent(new CustomEvent('aicore:' + event, { detail: data }));
        } catch(e) {}
    },

    /* ══════════════════════════════════════════════════
       HELPERS
    ══════════════════════════════════════════════════ */
    _inTimeRange(current, start, end) {
        // Handle overnight range (misal Isya 18:31 - 04:29)
        if (start <= end) {
            return current >= start && current <= end;
        } else {
            return current >= start || current <= end;
        }
    },

    // Reset threats (untuk admin use)
    resetThreats() {
        this.threats  = 0;
        this._locked  = false;
        this.mood     = 'PEACEFUL';
        sessionStorage.removeItem('login_attempts');
        sessionStorage.removeItem('lockout_until');
        console.log('🔄 AI Core threats reset. System restored to PEACEFUL.');
    }
};

/* ══════════════════════════════════════════════════════════
   CSS INJECTION — hostile pulse animation (widget only)
══════════════════════════════════════════════════════════ */
(function injectAICoreCSS() {
    if (document.getElementById('aicore-styles')) return;
    const s = document.createElement('style');
    s.id = 'aicore-styles';
    s.textContent = `
        @keyframes aicore-hostile-pulse {
            0%, 100% { box-shadow: 0 0 20px rgba(239,68,68,0.4); }
            50%       { box-shadow: 0 0 50px rgba(239,68,68,0.9); }
        }
        #ai-core-widget[data-mood="HOSTILE"] {
            border-color: #ef4444 !important;
        }
        #ai-core-widget[data-mood="ALERT"] {
            border-color: #f59e0b !important;
        }
        #ai-core-widget[data-mood="CAUTIOUS"] {
            border-color: #3b82f6 !important;
        }
        #ai-core-widget[data-mood="PEACEFUL"] {
            border-color: #10b981 !important;
        }
    `;
    document.head.appendChild(s);
})();

/* ══════════════════════════════════════════════════════════
   USAGE EXAMPLE (di main app):

   import { aiCore } from './core/aiCore.js';

   // Init dengan config
   aiCore
       .on('defense_warn',     (d) => showToast(d.message, 'warning'))
       .on('defense_escalate', (d) => showToast(d.message, 'error'))
       .on('defense_critical', (d) => forceLogout())
       .on('session_expired',  ()  => refreshSession())
       .init(config);

   // Cleanup saat modul di-unload
   // aiCore.destroy();

══════════════════════════════════════════════════════════ */
