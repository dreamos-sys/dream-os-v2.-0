/**
 * functions/api/xai.js
 * Dream OS v2.0 — Cloudflare Pages Function
 * Endpoint: /api/xai
 * Proxy ke x.ai Grok API
 */

export async function onRequestPost(context) {
    const { env, request } = context;

    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    if (!env.XAI_API_KEY) {
        return new Response(JSON.stringify({ error: 'x.ai service not configured' }), {
            status: 503, headers
        });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
            status: 400, headers
        });
    }

    const { messages, model = 'grok-1', stream = false, temperature = 0.7 } = body;
    if (!messages || !Array.isArray(messages)) {
        return new Response(JSON.stringify({ error: 'messages array required' }), {
            status: 400, headers
        });
    }

    const payload = {
        messages,
        model,
        stream,
        temperature
    };

    try {
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.XAI_API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        if (stream) {
            const newHeaders = new Headers(headers);
            newHeaders.delete('content-length');
            return new Response(response.body, {
                status: response.status,
                headers: newHeaders
            });
        } else {
            const data = await response.json();
            if (!response.ok) {
                return new Response(JSON.stringify({ error: data.error?.message || 'x.ai service error' }), {
                    status: response.status,
                    headers
                });
            }
            return new Response(JSON.stringify(data), { status: 200, headers });
        }
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers
        });
    }
}
