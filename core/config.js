// ═══════════════════════════════════════════════════════
// core/config.js - Dream OS v2.0 Central Configuration
// Ocean Logic System | "Lautan yang tahu dasarnya"
// ✅ SECURE VERSION — No hardcoded keys!
// ═══════════════════════════════════════════════════════

export const config = {
    // App Metadata
    appName: 'Dream OS',
    version: '2.0',
    baseUrl: window.location.origin + window.location.pathname.replace(/\/[^/]*$/, ''),

    // ⚠️ Supabase & API keys TIDAK disimpan di sini
    // Semua keys diambil dari /api/config (Cloudflare Pages Function)
    // Lihat: functions/api/config.js
    supabase: {
        url:     null, // diisi saat runtime via loadRemoteConfig()
        anonKey: null  // diisi saat runtime via loadRemoteConfig()
    },

    // Weather — konfigurasi non-sensitif saja
    weather: {
        city:            'Depok',
        units:           'metric',
        language:        'id',
        refreshInterval: 30 * 60 * 1000,
        alerts: {
            rain:        true,
            wind:        true,
            extremeTemp: true
        }
    },

    // Geofence Configuration (Depok Area)
    geofence: {
        lat:      -6.4,
        lng:      106.8,
        radiusKm: 5,
        enabled:  true
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
        offlineMode:      true,
        weatherAlerts:    true,
        aiInsights:       true,
        prayerAdaptation: true,
        biometricAuth:    false,
        auditLogging:     true
    },

    // Environment Detection
    get environment() {
        if (window.location.hostname.includes('localhost'))  return 'development';
        if (window.location.hostname.includes('github.io')) return 'staging';
        return 'production';
    },

    // Debug Mode
    get debug() {
        return this.environment === 'development' ||
               localStorage.getItem('dreamos_debug') === 'true';
    }
};

/**
 * loadRemoteConfig()
 * Ambil konfigurasi sensitif dari Cloudflare Pages Function /api/config
 * Keys tidak pernah di-hardcode di client
 */
export async function loadRemoteConfig() {
    try {
        const res = await fetch('/api/config', {
            cache: 'no-store'
        });

        if (!res.ok) throw new Error('HTTP ' + res.status);

        const remote = await res.json();

        if (remote.url && remote.key) {
            config.supabase.url     = remote.url;
            config.supabase.anonKey = remote.key;

            if (config.debug) {
                console.log('✅ Remote config loaded from Cloudflare Edge');
                console.log('🔒 Supabase project:', remote.url.split('/')[2].split('.')[0]);
            }

            return remote;
        }

        throw new Error('Invalid config response');

    } catch (e) {
        console.error('❌ loadRemoteConfig failed:', e.message);

        // Fallback hanya untuk development localhost
        if (config.environment === 'development') {
            console.warn('⚠️ DEV MODE: Using local fallback config');
            config.supabase.url     = 'YOUR_SUPABASE_URL_HERE';
            config.supabase.anonKey = 'YOUR_SUPABASE_KEY_HERE';
        }

        return null;
    }
}

// Auto-log in debug mode
if (config.debug) {
    console.log('🔧 Dream OS Debug Mode:', {
        env:      config.environment,
        baseUrl:  config.baseUrl,
        geofence: config.geofence.enabled ? `✅ ${config.geofence.radiusKm}km` : '❌'
    });
}

console.log('✅ Config loaded - Dream OS v' + config.version + ' | Ocean Logic Active 🌊');
