// workers/ai-proxy.js
// Cloudflare Worker untuk proxy AI requests dari Dream OS
// Menyembunyikan API key dari frontend

// Konfigurasi model
const MODELS = {
  cerebras: {
    url: 'https://api.cerebras.ai/v1/chat/completions',
    model: 'llama-3.3-70b',
    apiKeyEnv: 'CEREBRAS_API_KEY'
  },
  deepseek: {
    url: 'https://integrate.api.nvidia.com/v1/chat/completions',
    model: 'deepseek-ai/deepseek-v3.2',
    apiKeyEnv: 'NVIDIA_API_KEY'
  },
  qwen: {
    url: 'https://integrate.api.nvidia.com/v1/chat/completions',
    model: 'qwen/qwen3.5-397b-a17b',
    apiKeyEnv: 'NVIDIA_API_KEY'
  }
};

// Handler utama
export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    // Hanya accept POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { message, model = 'cerebras' } = await request.json();

      // Validasi input
      if (!message || typeof message !== 'string') {
        return new Response(JSON.stringify({ error: 'Message is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      // Pilih konfigurasi model
      const config = MODELS[model];
      if (!config) {
        return new Response(JSON.stringify({ error: 'Invalid model' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      // Ambil API key dari environment variable
      const apiKey = env[config.apiKeyEnv];
      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'API key not configured' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      // Panggil API eksternal
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: 'You are Dream OS AI Assistant. Jawab dalam bahasa Indonesia, singkat dan jelas.' },
            { role: 'user', content: message }
          ],
          max_tokens: 1024,
          temperature: 0.5,
          stream: false
        })
      });

      const data = await response.json();

      // Kembalikan response dengan CORS
      return new Response(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }
};
