/**
 * functions/api/ai.js
 * Dream OS v2.0 — Cloudflare Pages Function
 * Endpoint: /api/ai
 * Proxy ke NVIDIA/Qwen API
 */

export async function onRequestPost(context) {
    const { env, request } = context;

    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    };

    if (!env.NVIDIA_API_KEY) {
        return new Response(JSON.stringify({ error: 'AI service not configured' }), {
            status: 503, headers
        });
    }

    let body;
    try { body = await request.json(); }
    catch (e) { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers }); }

    const { messages, system } = body;
    if (!messages || !Array.isArray(messages)) {
        return new Response(JSON.stringify({ error: 'messages array required' }), { status: 400, headers });
    }

    // Tambahkan system message jika ada
    const allMessages = system
        ? [{ role: 'system', content: system }, ...messages.slice(-6)]
        : messages.slice(-6);

    try {
        const resp = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type':  'application/json',
                'Authorization': `Bearer ${env.NVIDIA_API_KEY}`
            },
            body: JSON.stringify({
                model:       'qwen/qwen3.5-397b-a17b',
                messages:    allMessages,
                max_tokens:  500,
                temperature: 0.6,
                top_p:       0.95,
                stream:      false
            })
        });

        const data = await resp.json();
        if (!resp.ok) return new Response(JSON.stringify({ error
