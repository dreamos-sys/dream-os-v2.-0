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
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    if (!env.NVIDIA_API_KEY) {
        return new Response(JSON.stringify({ error: 'AI service not configured' }), {
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

    const { messages, system, stream = true } = body;
    if (!messages || !Array.isArray(messages)) {
        return new Response(JSON.stringify({ error: 'messages array required' }), {
            status: 400, headers
        });
    }

    const allMessages = system
        ? [{ role: 'system', content: system }, ...messages]
        : messages;

    const payload = {
        model: "qwen/qwen3.5-397b-a17b",
        messages: allMessages,
        max_tokens: 16384,
        temperature: 0.60,
        top_p: 0.95,
        top_k: 20,
        presence_penalty: 0,
        repetition_penalty: 1,
        stream: stream,
        chat_template_kwargs: { enable_thinking: true }
    };

    try {
        const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.NVIDIA_API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        if (stream) {
            const { status, headers: respHeaders } = response;
            const newHeaders = new Headers(headers);
            newHeaders.delete('content-length');
            return new Response(response.body, {
                status,
                headers: newHeaders
            });
        } else {
            const data = await response.json();
            if (!response.ok) {
                return new Response(JSON.stringify({ error: data.error?.message || 'AI service error' }), {
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
