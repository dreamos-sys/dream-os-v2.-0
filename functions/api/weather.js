/**
 * functions/api/weather.js
 * Dream OS v2.0 — Cloudflare Pages Function
 * Endpoint: /api/weather
 */

export async function onRequestGet(context) {
    const { env } = context;

    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=600'
    };

    if (!env.WEATHER_API_KEY) {
        return new Response(JSON.stringify({ error: 'Weather API not configured' }), {
            status: 503, headers
        });
    }

    const loc = env.LOCATION || 'Depok';
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(loc)}&appid=${env.WEATHER_API_KEY}&units=metric&lang=id`;

    try {
        const res  = await fetch(url);
        const data = await res.json();
        if (!res.ok) return new Response(JSON.stringify({ error: 'Weather fetch failed' }), { status: res.status, headers });

        return new Response(JSON.stringify({
            temp:     Math.round(data.main.temp),
            feels:    Math.round(data.main.feels_like),
            desc:     data.weather[0]?.description || '',
            main:     data.weather[0]?.main || '',
            humidity: data.main.humidity,
            wind:     data.wind?.speed || 0,
            city:     data.name,
            ts:       Date.now()
        }), { status: 200, headers });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 502, headers });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS' }
    });
}
