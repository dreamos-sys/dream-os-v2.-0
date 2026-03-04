// ═══════════════════════════════════════════════════════
// core/aiCore.js - AI CORE ENGINE
// Dream OS v2.0 | Ocean Logic System
// "Lautan yang tahu dasarnya"
// ═══════════════════════════════════════════════════════

import { config } from './config.js';

export const aiCore = {
    // ========== STATE ==========
    mood: 'PEACEFUL',
    pulse: 100,
    threats: 0,
    lastCheck: Date.now(),
    sessionStart: null,
    
    // ========== MOOD CONFIG ==========
    moods: {
        PEACEFUL: { 
            color: '#10b981', 
            glow: '0 0 30px rgba(16,185,129,0.5)', 
            msg: 'Arus tenang, My Bro. Bismillah, semua modul sinkron 100%.',
            bodyFilter: 'none'
        },
        CAUTIOUS: { 
            color: '#3b82f6', 
            glow: '0 0 30px rgba(59,130,246,0.5)', 
            msg: 'Geofence 5KM aktif. Sistem dalam perlindungan penuh.',
            bodyFilter: 'none'
        },
        ALERT: { 
            color: '#f59e0b', 
            glow: '0 0 30px rgba(245,158,11,0.5)', 
            msg: 'Ada getaran asing di luar Safe Core. AI Core sedang menyerap gangguan.',
            bodyFilter: 'saturate(0.8)'
        },
        HOSTILE: { 
            color: '#ef4444', 
            glow: '0 0 30px rgba(239,68,68,0.5)', 
            msg: 'Peringatan! Upaya paksa terdeteksi. Memulai protokol pembersihan mandiri.',
            bodyFilter: 'hue-rotate(180deg) saturate(0.5)'
        }
    },
    
    // ========== CHECK SYSTEM PULSE ==========
    checkPulse: () => {
        const loginAttempts = parseInt(sessionStorage.getItem('login_attempts') || '0');
        const sessionAge = Date.now() - (aiCore.sessionStart || Date.now());
        const isOffline = !navigator.onLine;
                if (loginAttempts > 3) {
            aiCore.mood = 'HOSTILE';
            aiCore.threats++;
            aiCore.triggerDefense();
        } else if (isOffline && config.features.offlineMode === false) {
            aiCore.mood = 'CAUTIOUS';
        } else if (sessionAge > 300000) {
            aiCore.mood = 'ALERT';
        } else {
            const prayer = aiCore.getCurrentPrayer();
            if (['Maghrib', 'Isya', 'Subuh'].includes(prayer)) {
                aiCore.mood = 'PEACEFUL';
            } else {
                aiCore.mood = 'PEACEFUL';
            }
        }
        
        aiCore.lastCheck = Date.now();
        aiCore.pulse = aiCore.calculatePulse();
        return aiCore.mood;
    },
    
    // ========== CALCULATE PULSE ==========
    calculatePulse: () => {
        let pulse = 100;
        pulse -= aiCore.threats * 15;
        if (!navigator.onLine) pulse -= 20;
        const prayer = aiCore.getCurrentPrayer();
        if (['Subuh', 'Maghrib'].includes(prayer)) pulse += 10;
        return Math.max(0, Math.min(100, pulse));
    },
    
    // ========== TRIGGER DEFENSE PROTOCOL ==========
    triggerDefense: () => {
        console.warn('🛡️ DEPOK LIGHTNING STRIKE ACTIVATED');
        
        if (typeof window.api !== 'undefined' && config.features.auditLogging) {
            window.api.logAudit('DEFENSE_TRIGGERED', 'ai_core', {
                threats: aiCore.threats,
                mood: aiCore.mood,
                timestamp: new Date().toISOString()
            }).catch(() => {});
        }
        
        if (aiCore.threats >= 3) {
            console.log('🔥 Self-destruct protocol: Purifying sensitive data...');
            sessionStorage.clear();
            const safeKeys = ['dreamos_theme', 'dreamos_lang', 'dreamos_debug'];
            Object.keys(localStorage).forEach(key => {
                if (!safeKeys.includes(key)) localStorage.removeItem(key);            });
            console.log('✅ Data purification complete. System secured.');
            aiCore.threats = 0;
            aiCore.mood = 'CAUTIOUS';
        }
    },
    
    // ========== GET AI MESSAGE ==========
    getMessage: () => aiCore.moods[aiCore.mood]?.msg || 'System normal.',
    
    // ========== GET MOOD DATA ==========
    getMoodData: () => aiCore.moods[aiCore.mood] || aiCore.moods.PEACEFUL,
    
    // ========== UPDATE UI AURA ==========
    updateAura: (elementId = 'ai-core-widget') => {
        const moodData = aiCore.getMoodData();
        const widget = document.getElementById(elementId);
        
        if (widget) {
            widget.style.borderColor = moodData.color;
            widget.style.boxShadow = moodData.glow;
            widget.setAttribute('data-mood', aiCore.mood);
            const msgEl = widget.querySelector('.ai-message');
            if (msgEl) msgEl.textContent = aiCore.getMessage();
        }
        
        document.body.style.filter = moodData.bodyFilter;
        
        if (config.debug) {
            console.log(`🌊 AI Core: ${aiCore.mood} (pulse: ${aiCore.pulse}, threats: ${aiCore.threats})`);
        }
    },
    
    // ========== SPIRITUAL DIAGNOSIS ==========
    spiritualCheck: () => {
        const prayer = aiCore.getCurrentPrayer();
        const messages = {
            Subuh: '🕌 Waktu Subuh. Refresh aura dengan Shalawat. Sistem dalam mode tenang.',
            Dzuhur: '🕌 Waktu Dzuhur. Ingat shalat, sistem tetap optimal.',
            Ashar: '🕌 Waktu Ashar. Semangat menyelesaikan tugas sebelum Maghrib!',
            Maghrib: '🕌 Waktu Maghrib. UI adaptif: warna hangat, notifikasi lembut.',
            Isya: '🕌 Waktu Isya. Mode malam aktif. Tidur cukup, kerja optimal besok!'
        };
        return messages[prayer] || '✨ The Power Soul of Shalawat is protecting the system.';
    },
    
    // ========== GET CURRENT PRAYER ==========
    getCurrentPrayer: () => {
        const now = new Date();
        const [h, m] = [now.getHours(), now.getMinutes()];        const total = h * 60 + m;
        
        for (const [prayer, times] of Object.entries(config.prayerTimes)) {
            const [startH, startM] = times.start.split(':').map(Number);
            const [endH, endM] = times.end.split(':').map(Number);
            let startTotal = startH * 60 + startM;
            let endTotal = endH * 60 + endM;
            
            if (endTotal < startTotal) {
                endTotal += 24 * 60;
                if (total < startTotal) {
                    const checkTotal = total + 24 * 60;
                    if (checkTotal >= startTotal && checkTotal < endTotal) return prayer;
                }
            }
            
            if (total >= startTotal && total < endTotal) return prayer;
        }
        return 'Isya';
    },
    
    // ========== RESET THREATS ==========
    resetThreats: () => {
        if (sessionStorage.getItem('dream_role')?.toLowerCase().includes('admin')) {
            aiCore.threats = 0;
            aiCore.mood = 'PEACEFUL';
            console.log('🌊 AI Core: Threats reset by admin');
            return true;
        }
        console.warn('⚠️ resetThreats: Admin role required');
        return false;
    },
    
    // ========== AUTO-INIT ==========
    init: () => {
        console.log('🧠 AI Core Engine Initialized - Ocean Logic Active');
        aiCore.sessionStart = Date.now();
        
        setInterval(() => {
            aiCore.checkPulse();
            aiCore.updateAura();
        }, 5000);
        
        window.addEventListener('online', () => {
            aiCore.mood = 'PEACEFUL';
            aiCore.updateAura();
        });
        window.addEventListener('offline', () => {
            if (config.features.offlineMode === false) {
                aiCore.mood = 'CAUTIOUS';                aiCore.updateAura();
            }
        });
        
        aiCore.updateAura();
    }
};

// Global export
if (typeof window !== 'undefined') {
    window.aiCore = aiCore;
}

// Auto-init
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => aiCore.init());
    } else {
        aiCore.init();
    }
}
