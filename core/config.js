/**
 * functions/api/config.js
 * Dream OS v2.0 — Cloudflare Pages Function
 * Endpoint: /api/config
 * Menyajikan konfigurasi aman dari Environment Variables
 * ISO 27001 · Zero key exposure to client
 */

export async function onRequestGet(context) {
    const { env } = context;

    // CORS headers
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
    };

    // Validasi environment variables ada
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
        return new Response(JSON.stringify({
            error: 'Server configuration error',
            code: 'ENV_MISSING'
        }), { status: 500, headers });
    }

    const payload = {
        url:  env.SUPABASE_URL,
        key:  env.SUPABASE_ANON_KEY,
        wkey: env.WEATHER_API_KEY || '',
        loc:  env.LOCATION || 'Depok',
        ts:   Date.now()  // cache busting
    };

    return new Response(JSON.stringify(payload), { status: 200, headers });
}

// Handle OPTIONS preflight
export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Max-Age': '86400'
        }
    });
}
