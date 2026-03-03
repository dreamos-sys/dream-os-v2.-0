// ═══════════════════════════════════════════════════════
// DREAM OS v2.0 - CONFIGURATION (PROJECT ASLI)
// ═══════════════════════════════════════════════════════

export const config = {
    // App Metadata
    appName: 'Dream OS',
    version: '2.0',
    baseUrl: window.location.origin + window.location.pathname.replace(/\/[^/]*$/, ''),
    
    // Supabase - PROJECT ASLI ✅
    supabase: {
        url: 'https://pvznaeppaagylwddirla.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2em5hZXBwYWFneWx3ZGRpcmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTEwNDMsImV4cCI6MjA4NzUyNzA0M30.t9SJi3VfsBDkKmeZ3egZ4rbvljl4xe0WwNkPtfA9-vo'
    },
    
    // Location & Geofence (Depok area)
    geofence: {
        lat: -6.4,
        lng: 106.8,
        radiusKm: 5,
        enabled: true
    },
    
    // Prayer Times (24h format, handles overnight)
    prayerTimes: {
        subuh:  { start: '04:30', end: '06:00', bg: { dark: '#1e3c5c', light: '#d4e6f1' } },
        dzuhur: { start: '12:00', end: '14:30', bg: { dark: '#4a6b7a', light: '#f0e6d2' } },
        ashar:  { start: '14:31', end: '17:30', bg: { dark: '#8a6e4b', light: '#f5e0c3' } },
        maghrib:{ start: '17:31', end: '18:30', bg: { dark: '#8a4f4a', light: '#f7d2c4' } },
        isya:   { start: '18:31', end: '04:29', bg: { dark: '#2c3e50', light: '#c0d0e0' } }
    },
    
    // Feature Flags
    features: {
        offlineMode: true,
        weatherAlerts: true,
        aiInsights: false,
        biometricAuth: false,
        auditLogging: true
    },
    
    // Environment Detection
    get environment() {
        if (window.location.hostname.includes('localhost')) return 'development';
        if (window.location.hostname.includes('github.io')) return 'staging';
        return 'production';
    },
    
    // Debug Mode
    get debug() {
        return this.environment === 'development' || 
               localStorage.getItem('dreamos_debug') === 'true';
    }
};

// Auto-log in debug mode
if (config.debug) {
    console.log('🔧 Dream OS Debug Mode:', {
        env: config.environment,
        baseUrl: config.baseUrl,
        supabaseProject: config.supabase.url.split('/')[2].split('.')[0]
    });
}

console.log('✅ Config loaded - Dream OS v' + config.version);
