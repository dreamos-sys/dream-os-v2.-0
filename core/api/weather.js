/**
 * functions/api/weather.js
 * Dream OS v2.0 — Cloudflare Pages Function
 * Endpoint: /api/weather
 * Proxy ke OpenWeatherMap — key tidak pernah ke client
 * ISO 27001 · Secure API Proxy
 */

export async function onRequestGet(context) {
    const { env, request } = context;

    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=600' // cache 10 menit di edge
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

        if (!res.ok) {
            return new Response(JSON.stringify({ error: 'Weather fetch failed', detail: data }), {
                status: res.status, headers
            });
        }

        // Return data cuaca yang sudah diproses
        return new Response(JSON.stringify({
            temp:    Math.round(data.main.temp),
            feels:   Math.round(data.main.feels_like),
            desc:    data.weather[0]?.description || '',
            icon:    data.weather[0]?.icon || '',
            main:    data.weather[0]?.main || '',
            humidity:data.main.humidity,
            wind:    data.wind?.speed || 0,
            city:    data.name,
            ts:      Date.now()
        }), { status: 200, headers });

    } catch (e) {
        return new Response(JSON.stringify({ error: 'Proxy error', message: e.message }), {
            status: 502, headers
        });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS'
        }
    });
}
