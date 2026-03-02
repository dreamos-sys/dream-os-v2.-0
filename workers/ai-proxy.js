/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  DREAM OS - AI PROXY WORKER v2.0                         ║
 * ║  "The Intelligent Gateway"                               ║
 * ║                                                          ║
 * ║  FILOSOFI:                                               ║
 * ║  • Seperti air: mengalir ke model terbaik               ║
 * ║  • Seperti napas: request → response → learn            ║
 * ║  • Seperti doa: setiap request diawali "Bismillah"      ║
 * ║                                                          ║
 * ║  🤲 Bi idznillah - Dengan izin Allah                     ║
 * ╚══════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────
// KONFIGURASI MODEL (Priority Order: 1→2→3)
// ─────────────────────────────────────────────────────────
const MODELS = {
  cerebras: {
    priority: 1,
    url: 'https://api.cerebras.ai/v1/chat/completions',
    model: 'llama-3.3-70b',
    apiKeyEnv: 'CEREBRAS_API_KEY',
    timeout: 15000,
    maxTokens: 1024,
    temperature: 0.5
  },
  qwen: {
    priority: 2,
    url: 'https://integrate.api.nvidia.com/v1/chat/completions',
    model: 'qwen/qwen3.5-397b-a17b',
    apiKeyEnv: 'NVIDIA_API_KEY',
    timeout: 20000,
    maxTokens: 2048,
    temperature: 0.3
  },
  deepseek: {
    priority: 3,
    url: 'https://integrate.api.nvidia.com/v1/chat/completions',
    model: 'deepseek-ai/deepseek-v3.2',
    apiKeyEnv: 'NVIDIA_API_KEY',
    timeout: 20000,
    maxTokens: 2048,
    temperature: 0.4
  }
};

// ─────────────────────────────────────────────────────────
// RATE LIMITING + CACHE (Cloudflare KV)
// ─────────────────────────────────────────────────────────const RATE_LIMIT = {
  windowMs: 60000,        // 1 minute window
  maxRequests: 30,         // max 30 requests per minute per IP
  cacheTTL: 300000         // cache responses for 5 minutes
};

// ─────────────────────────────────────────────────────────
// HELPER: Logging dengan "Spiritual Timestamp"
// ─────────────────────────────────────────────────────────
function spiritualLog(level, message, context = {}) {
  const timestamp = new Date().toISOString();
  const prayerTime = getPrayerTimeIndicator();
  
  console.log(`[${timestamp}] [${prayerTime}] [${level}] ${message}`, {
    ...context,
    __dream_os_meta: {
      version: '2.0',
      philosophy: 'bi_idznillah'
    }
  });
}

function getPrayerTimeIndicator() {
  const h = new Date().getHours();
  if (h >= 4 && h < 6) return '🌅SUBUH';
  if (h >= 6 && h < 12) return '☀️PAGI';
  if (h >= 12 && h < 15) return '☀️DZUHUR';
  if (h >= 15 && h < 18) return '🌤️ASHAR';
  if (h >= 18 && h < 19) return '🌇MAGHRIB';
  if (h >= 19 && h < 24) return '🌙ISYA';
  return '🌃MALAM';
}

// ─────────────────────────────────────────────────────────
// HELPER: Rate Limit Check (in-memory for worker)
// ─────────────────────────────────────────────────────────
const rateLimitStore = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const key = `rl:${ip}`;
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, []);
  }
  
  const requests = rateLimitStore.get(key);
  // Remove old requests outside window
  const validRequests = requests.filter(t => now - t < RATE_LIMIT.windowMs);
    if (validRequests.length >= RATE_LIMIT.maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((RATE_LIMIT.windowMs - (now - validRequests[0])) / 1000) };
  }
  
  validRequests.push(now);
  rateLimitStore.set(key, validRequests);
  
  // Cleanup old entries periodically
  if (validRequests.length % 10 === 0) {
    for (const [k, v] of rateLimitStore) {
      if (v.every(t => now - t >= RATE_LIMIT.windowMs)) {
        rateLimitStore.delete(k);
      }
    }
  }
  
  return { allowed: true };
}

// ─────────────────────────────────────────────────────────
// HELPER: Cache Check (using Cloudflare Cache API)
// ─────────────────────────────────────────────────────────
async function getCachedResponse(key) {
  try {
    const cache = caches.default;
    const response = await cache.match(key);
    if (response) {
      spiritualLog('CACHE_HIT', `Cache hit for: ${key.substring(0, 50)}...`);
      return response;
    }
  } catch (e) {
    // Cache not available (local dev), ignore
  }
  return null;
}

async function setCachedResponse(key, response, ttl = RATE_LIMIT.cacheTTL) {
  try {
    const cache = caches.default;
    // Clone response because body can only be read once
    const responseToCache = new Response(response.body, response);
    responseToCache.headers.append('Cache-Control', `public, max-age=${Math.floor(ttl/1000)}`);
    await cache.put(key, responseToCache);
    spiritualLog('CACHE_SET', `Cached response for: ${key.substring(0, 50)}...`);
  } catch (e) {
    // Ignore cache errors
  }
}

function generateCacheKey(message, model) {  // Simple hash for cache key
  const str = `${model}:${message.substring(0, 200)}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return `dreamos:ai:${hash}:${model}`;
}

// ─────────────────────────────────────────────────────────
// HELPER: Call AI Model with Fallback Chain
// ─────────────────────────────────────────────────────────
async function callAIModel(message, preferredModel = 'cerebras', env) {
  // Sort models by priority
  const sortedModels = Object.entries(MODELS)
    .sort((a, b) => a[1].priority - b[1].priority);
  
  // Start with preferred model, then fallback by priority
  const modelOrder = [
    sortedModels.find(([k]) => k === preferredModel)?.[0],
    ...sortedModels.map(([k]) => k).filter(k => k !== preferredModel)
  ].filter(Boolean);
  
  let lastError = null;
  
  for (const modelName of modelOrder) {
    const config = MODELS[modelName];
    const apiKey = env[config.apiKeyEnv];
    
    if (!apiKey) {
      spiritualLog('WARN', `API key not configured for ${modelName}, skipping`);
      continue;
    }
    
    try {
      spiritualLog('INFO', `Calling ${modelName}...`, { model: config.model });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);
      
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'DreamOS-AI-Proxy/2.0'
        },
        body: JSON.stringify({
          model: config.model,          messages: [
            { 
              role: 'system', 
              content: `You are Dream OS AI Assistant. You are helpful, concise, and wise. 
                       Jawab dalam bahasa Indonesia yang santun, singkat, dan jelas. 
                       Jika ditanya tentang sistem, arahkan ke modul terkait.
                       🤲 Bi idznillah.`
            },
            { role: 'user', content: message }
          ],
          max_tokens: config.maxTokens,
          temperature: config.temperature,
          stream: false
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      spiritualLog('SUCCESS', `Response from ${modelName}`, {
        model: config.model,
        tokens: data.usage?.total_tokens || 'N/A'
      });
      
      return {
        success: true,
        model: modelName,
        data: data,
        content: data.choices?.[0]?.message?.content || 'Maaf, saya tidak bisa memproses permintaan ini.'
      };
      
    } catch (error) {
      lastError = error;
      spiritualLog('ERROR', `Failed to call ${modelName}: ${error.message}`, {
        model: config.model,
        fallback: true
      });
      // Continue to next model in chain
    }
  }
  
  // All models failed
  return {    success: false,
    error: lastError?.message || 'All AI models unavailable',
    content: '⚠️ Maaf, sistem AI sedang mengalami gangguan. Silakan coba lagi nanti. 🤲'
  };
}

// ─────────────────────────────────────────────────────────
// HELPER: Log to Supabase (async, non-blocking)
// ─────────────────────────────────────────────────────────
async function logToSupabase(env, logData) {
  try {
    // Only log if Supabase URL is configured
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return;
    
    // Fire-and-forget: don't await to keep response fast
    env.ASSETS.fetch(`${env.SUPABASE_URL}/rest/v1/ai_logs`, {
      method: 'POST',
      headers: {
        'apikey': env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Pre
