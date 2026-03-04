// ═══════════════════════════════════════════════════════
// core/config.js - Dream OS v2.0 Central Configuration
// Ocean Logic System | "Lautan yang tahu dasarnya"
// ═══════════════════════════════════════════════════════

export const config = {
    // App Metadata
    appName: 'Dream OS',
    version: '2.0',
    baseUrl: window.location.origin + window.location.pathname.replace(/\/[^/]*$/, ''),
    
    // Supabase Configuration (Project Asli)
    supabase: {
        url: 'https://pvznaeppaagylwddirla.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2em5hZXBwYWFneWx3ZGRpcmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTEwNDMsImV4cCI6MjA4NzUyNzA0M30.t9SJi3VfsBDkKmeZ3egZ4rbvljl4xe0WwNkPtfA9-vo'
    },
    
    // Weather API Configuration
    weather: {
        apiKey: 'f7890d7569950ffa34a5827880e8442f',
        city: 'Depok',
        units: 'metric',
        language: 'id',
        refreshInterval: 30 * 60 * 1000,
        alerts: {
            rain: true,
            wind: true,
            extremeTemp: true
        }
    },
    
    // Geofence Configuration (Depok Area)
    geofence: {
        lat: -6.4,
        lng: 106.8,
        radiusKm: 5,
        enabled: true
    },
    
    // Prayer Times (24h format, handles overnight)
    prayerTimes: {
        Subuh:  { start: '04:30', end: '06:00', bg: { dark: '#1e3c5c', light: '#d4e6f1' } },
        Dzuhur: { start: '12:00', end: '14:30', bg: { dark: '#4a6b7a', light: '#f0e6d2' } },
        Ashar:  { start: '14:31', end: '17:30', bg: { dark: '#8a6e4b', light: '#f5e0c3' } },
        Maghrib:{ start: '17:31', end: '18:30', bg: { dark: '#8a4f4a', light: '#f7d2c4' } },
        Isya:   { start: '18:31', end: '04:29', bg: { dark: '#2c3e50', light: '#c0d0e0' } }
    },
    
    // Feature Flags
    features: {
        offlineMode: true,
        weatherAlerts: true,
        aiInsights: true,
        prayerAdaptation: true,
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
        supabaseProject: config.supabase.url.split('/')[2].split('.')[0],
        geofence: config.geofence.enabled ? `✅ ${config.geofence.radiusKm}km` : '❌'
    });
}

console.log('✅ Config loaded - Dream OS v' + config.version + ' | Ocean Logic Active 🌊');
