/**
 * AI CORE ENGINE - The Current Oracle
 * Dream OS v2.0 | Ocean Logic System
 * "Lautan yang tahu dasarnya"
 */

export const aiCore = {
    // STATE
    mood: 'PEACEFUL',
    pulse: 100,
    threats: 0,
    lastCheck: Date.now(),
    
    // MOOD COLORS
    moods: {
        PEACEFUL: { color: '#10b981', glow: '0 0 30px rgba(16,185,129,0.5)', msg: 'Arus tenang, My Bro. Bismillah, semua modul sinkron 100%.' },
        CAUTIOUS: { color: '#3b82f6', glow: '0 0 30px rgba(59,130,246,0.5)', msg: 'Geofence 5KM aktif. Sistem dalam perlindungan penuh.' },
        ALERT: { color: '#f59e0b', glow: '0 0 30px rgba(245,158,11,0.5)', msg: 'Ada getaran asing di luar Safe Core. AI Core sedang menyerap gangguan.' },
        HOSTILE: { color: '#ef4444', glow: '0 0 30px rgba(239,68,68,0.5)', msg: 'Peringatan! Upaya paksa terdeteksi. Memulai protokol pembersihan mandiri.' }
    },
    
    // CHECK SYSTEM PULSE
    checkPulse: () => {
        const loginAttempts = parseInt(sessionStorage.getItem('login_attempts') || '0');
        const sessionAge = Date.now() - parseInt(sessionStorage.getItem('session_start') || Date.now());
        const isOffline = !navigator.onLine;
        
        // Threat Detection
        if (loginAttempts > 3) {
            aiCore.mood = 'HOSTILE';
            aiCore.threats++;
            aiCore.triggerDefense();
        } else if (isOffline) {
            aiCore.mood = 'CAUTIOUS';
        } else if (sessionAge > 300000) { // 5 min
            aiCore.mood = 'ALERT';
        } else {
            aiCore.mood = 'PEACEFUL';
        }
        
        aiCore.lastCheck = Date.now();
        return aiCore.mood;
    },
    
    // TRIGGER DEFENSE PROTOCOL
    triggerDefense: () => {
        console.warn('🛡️ DEPOK LIGHTNING STRIKE ACTIVATED');
        // Clear sensitive data after 3 failed attempts
        if (aiCore.threats >= 3) {
            sessionStorage.clear();            localStorage.clear();
            console.log('🔥 Self-destruct complete. Data purified.');
        }
    },
    
    // GET AI MESSAGE
    getMessage: () => {
        return aiCore.moods[aiCore.mood]?.msg || 'System normal.';
    },
    
    // UPDATE UI AURA
    updateAura: () => {
        const moodData = aiCore.moods[aiCore.mood];
        const widget = document.getElementById('ai-core-widget');
        
        if (widget) {
            widget.style.borderColor = moodData.color;
            widget.style.boxShadow = moodData.glow;
            widget.setAttribute('data-mood', aiCore.mood);
        }
        
        // Update body filter for hostile mode
        if (aiCore.mood === 'HOSTILE') {
            document.body.style.filter = 'hue-rotate(180deg) saturate(0.5)';
        } else {
            document.body.style.filter = 'none';
        }
        
        console.log(`🌊 AI Core Status: ${aiCore.getMessage()}`);
    },
    
    // SPIRITUAL DIAGNOSIS
    spiritualCheck: () => {
        const hour = new Date().getHours();
        const prayers = {
            fajr: { start: 4, end: 6 },
            dhuhr: { start: 12, end: 13 },
            asr: { start: 15, end: 16 },
            maghrib: { start: 18, end: 19 },
            isha: { start: 19, end: 20 }
        };
        
        for (const [prayer, time] of Object.entries(prayers)) {
            if (hour >= time.start && hour <= time.end) {
                return `🕌 Waktu ${prayer}. Refresh aura dengan Shalawat.`;
            }
        }
        return '✨ The Power Soul of Shalawat is protecting the system.';
    },
        // AUTO-INIT
    init: () => {
        console.log('🧠 AI Core Engine Initialized - Ocean Logic Active');
        setInterval(() => {
            aiCore.checkPulse();
            aiCore.updateAura();
        }, 5000); // Check every 5 seconds
    }
};

// Auto-init
aiCore.init();
