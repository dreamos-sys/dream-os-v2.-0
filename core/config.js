// ═══════════════════════════════════════════════════════
// DREAM OS v2.0 - CONFIGURATION
// ═══════════════════════════════════════════════════════

export const config = {
    appName: 'Dream OS',
    version: '2.0',
    baseUrl: window.location.origin + '/dream-os-v2.-0',
    supabaseUrl: 'https://rqpodzjexghrvcpyacyo.supabase.co',
    geofence: {
        lat: -6.4,
        lng: 106.8,
        radiusKm: 5
    },
    prayerTimes: {
        subuh: { start: '04:30', end: '06:00' },
        dzuhur: { start: '12:00', end: '14:30' },
        ashar: { start: '14:31', end: '17:30' },
        maghrib: { start: '17:31', end: '18:30' },
        isya: { start: '18:31', end: '04:29' }
    }
};

console.log('✅ Config loaded');
