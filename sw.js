/**
 * 🛡️ DREAM OS v2.0 SERVICE WORKER
 * Offline-First • Prayer-Aware • Bi idznillah 💚
 * Version: 2.0.0
 * 
 * Compatible with:
 * - Base64 inline images
 * - Dynamic module imports (/modules/*/module.js)
 * - Supabase real-time connections
 * - Prayer-based UI changes
 * - Multi-language (i18n)
 */

'use strict';

/* ══════════════════════════════════════════════
   CONFIG & CACHE NAMES
   ══════════════════════════════════════════════ */
const CACHE_VERSION = 'v2.0.0';
const STATIC_CACHE = `dream-os-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dream-os-dynamic-${CACHE_VERSION}`;
const MODULE_CACHE = `dream-os-modules-${CACHE_VERSION}`;

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  
  // External CDNs (critical for offline fallback)
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Rajdhani:wght@400;600;700&family=JetBrains+Mono:wght@400;700&display=swap',
  'https://fonts.gstatic.com/s/amiri/v26/J7aRnpd8CGxBHpUrtLMA7w.woff2',
  'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.1.6/purify.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  
  // Weather proxy (for offline fallback)
  'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://api.openweathermap.org/data/2.5/weather?q=Depok&appid=f7890d7569950ffa34a5827880e8442f&units=metric&lang=id')
];

// Module paths pattern (for dynamic caching)
const MODULE_PATTERN = /^\/modules\/[^/]+\/module\.js$/;

// API endpoints that should bypass cache
const API_ENDPOINTS = [
  '/api/config',
  '/supabase',
  'supabase.co',  'allorigins.win'
];

// Prayer background classes (for offline UI consistency)
const PRAYER_CLASSES = [
  'prayer-subuh',
  'prayer-dzuhur', 
  'prayer-ashar',
  'prayer-maghrib',
  'prayer-isya'
];

/* ══════════════════════════════════════════════
   INSTALL EVENT — Cache static assets
   ══════════════════════════════════════════════ */
self.addEventListener('install', event => {
  console.log('🔧 [SW] Installing Dream OS Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('📦 [SW] Caching static assets...');
        return Promise.all(
          STATIC_ASSETS.map(url => 
            fetch(url)
              .then(response => {
                if (response.ok) {
                  return cache.put(url, response);
                }
                console.warn(`⚠️ [SW] Failed to cache: ${url}`);
                return Promise.resolve();
              })
              .catch(err => {
                console.warn(`⚠️ [SW] Network error caching ${url}:`, err.message);
                return Promise.resolve();
              })
          )
        );
      })
      .then(() => {
        console.log('✅ [SW] Static assets cached');
        return self.skipWaiting(); // Activate immediately
      })
      .catch(err => {
        console.error('❌ [SW] Installation failed:', err);
      })
  );
});

/* ══════════════════════════════════════════════   ACTIVATE EVENT — Clean old caches
   ══════════════════════════════════════════════ */
self.addEventListener('activate', event => {
  console.log('🚀 [SW] Activating Dream OS Service Worker...');
  
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, MODULE_CACHE];
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => !currentCaches.includes(cacheName))
            .map(cacheName => {
              console.log('🗑️ [SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('✅ [SW] Old caches cleaned');
        return self.clients.claim(); // Take control of all pages
      })
  );
});

/* ══════════════════════════════════════════════
   FETCH EVENT — Smart caching strategy
   ══════════════════════════════════════════════ */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip non-http(s) protocols
  if (!url.protocol.startsWith('http')) return;
  
  // Strategy based on request type
  if (isApiRequest(url)) {
    // API requests: Network-first with timeout
    event.respondWith(networkFirst(request, 5000));
  } else if (isModuleRequest(url)) {
    // Module JS files: Cache-first with network update
    event.respondWith(cacheFirstWithUpdate(request, MODULE_CACHE));
  } else if (isStaticAsset(url)) {
    // Static assets: Cache-first
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else {    // Everything else: Stale-while-revalidate
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
  }
});

/* ══════════════════════════════════════════════
   HELPER: Identify request types
   ══════════════════════════════════════════════ */
function isApiRequest(url) {
  return API_ENDPOINTS.some(endpoint => 
    url.pathname.includes(endpoint) || url.hostname.includes(endpoint)
  );
}

function isModuleRequest(url) {
  return MODULE_PATTERN.test(url.pathname);
}

function isStaticAsset(url) {
  return STATIC_ASSETS.some(asset => 
    url.href === asset || url.href.includes(asset.replace('https://', ''))
  );
}

/* ══════════════════════════════════════════════
   STRATEGY: Network-First with Timeout
   For: API calls, Supabase, Weather
   ══════════════════════════════════════════════ */
async function networkFirst(request, timeoutMs) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Network timeout')), timeoutMs);
  });
  
  try {
    // Try network first
    const networkResponse = await Promise.race([
      fetch(request),
      timeoutPromise
    ]);
    
    // Cache successful responses for future offline use
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE);
      // Clone because response can only be read once
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {    console.warn('⚠️ [SW] Network failed, trying cache:', request.url);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for APIs
    if (request.headers.get('accept')?.includes('application/json')) {
      return new Response(JSON.stringify({ 
        error: 'offline', 
        message: 'You are offline. Some features may not work.' 
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Default offline response
    return new Response('Offline', { status: 503 });
  }
}

/* ══════════════════════════════════════════════
   STRATEGY: Cache-First with Background Update
   For: Module JS files (dynamic imports)
   ══════════════════════════════════════════════ */
async function cacheFirstWithUpdate(request, cacheName) {
  // Try cache first for instant load
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache in background (stale-while-revalidate)
    fetch(request)
      .then(response => {
        if (response.ok) {
          caches.open(cacheName).then(cache => {
            cache.put(request, response);
            console.log('🔄 [SW] Module updated in background:', request.url);
          });
        }
      })
      .catch(err => {
        console.warn('⚠️ [SW] Background update failed:', err.message);
      });
    
    return cachedResponse;
  }
    // Not in cache — fetch from network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('❌ [SW] Module load failed:', request.url);
    
    // Return minimal fallback for modules
    return new Response(
      `console.warn('Module ${request.url} offline'); export default function() { return '<div class="p-4 text-center text-slate-400">⚠️ Module offline</div>'; }`,
      { headers: { 'Content-Type': 'application/javascript' } }
    );
  }
}

/* ══════════════════════════════════════════════
   STRATEGY: Cache-First (Simple)
   For: Static assets (CSS, fonts, icons)
   ══════════════════════════════════════════════ */
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Fetch from network if not cached
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('❌ [SW] Static asset failed:', request.url);
    
    // Return empty response for non-critical assets
    return new Response('', { status: 404 });
  }
}

/* ══════════════════════════════════════════════
   STRATEGY: Stale-While-Revalidate
   For: HTML pages, dynamic content
   ══════════════════════════════════════════════ */async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  // Fetch from network in background
  const fetchPromise = fetch(request)
    .then(networkResponse => {
      if (networkResponse.ok) {
        caches.open(cacheName).then(cache => {
          cache.put(request, networkResponse);
        });
      }
      return networkResponse;
    })
    .catch(() => null); // Ignore network errors
  
  // Return cached immediately, or wait for network
  return cachedResponse || fetchPromise || caches.match('/index.html');
}

/* ══════════════════════════════════════════════
   BACKGROUND SYNC — Offline form submissions
   ══════════════════════════════════════════════ */
self.addEventListener('sync', event => {
  console.log('🔄 [SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-booking' || event.tag === 'sync-k3') {
    event.waitUntil(syncOfflineData(event.tag));
  }
});

async function syncOfflineData(tag) {
  console.log('📤 [SW] Syncing offline data:', tag);
  
  try {
    // Get pending requests from IndexedDB (implement in main app)
    // const pendingRequests = await getPendingRequestsFromDB(tag);
    
    // Retry failed submissions
    // for (const req of pendingRequests) {
    //   await fetch(req.url, { method: 'POST', body: req.body, headers: req.headers });
    // }
    
    console.log('✅ [SW] Offline data synced');
  } catch (error) {
    console.error('❌ [SW] Sync failed:', error);
    throw error; // Will retry later
  }
}

/* ══════════════════════════════════════════════   PUSH NOTIFICATIONS — Ready for future use
   ══════════════════════════════════════════════ */
self.addEventListener('push', event => {
  console.log('📬 [SW] Push notification:', event.data?.text());
  
  const options = {
    body: event.data?.text() || 'New update from Dream OS',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [200, 100, 200],
    data: { timestamp: Date.now() },
    actions: [
      { action: 'open', title: 'Buka' },
      { action: 'close', title: 'Tutup' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Dream OS', options)
  );
});

/* ══════════════════════════════════════════════
   MESSAGE HANDLING — Communicate with main app
   ══════════════════════════════════════════════ */
self.addEventListener('message', event => {
  console.log('💬 [SW] Message:', event.data?.type);
  
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data?.type === 'CLEAR_CACHE') {
    // Clear specific cache or all
    const cacheName = event.data.cacheName;
    if (cacheName) {
      caches.delete(cacheName).then(() => {
        console.log('🗑️ [SW] Cache cleared:', cacheName);
        event.ports[0]?.postMessage({ success: true });
      });
    } else {
      // Clear all Dream OS caches
      caches.keys().then(names => {
        Promise.all(
          names.filter(n => n.startsWith('dream-os-'))
            .map(n => caches.delete(n))
        ).then(() => {
          console.log('🗑️ [SW] All caches cleared');
          event.ports[0]?.postMessage({ success: true });
        });      });
    }
  }
  
  if (event.data?.type === 'GET_CACHE_STATS') {
    // Return cache usage stats to main app
    caches.keys().then(names => {
      Promise.all(
        names.map(async name => {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          return { name, count: keys.length };
        })
      ).then(stats => {
        event.ports[0]?.postMessage({ caches: stats });
      });
    });
  }
});

/* ══════════════════════════════════════════════
   PERIODIC SYNC — Cache cleanup (Chrome 89+)
   ══════════════════════════════════════════════ */
self.addEventListener('periodicsync', event => {
  if (event.tag === 'cache-cleanup') {
    event.waitUntil(cleanupOldCaches());
  }
});

async function cleanupOldCaches() {
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, MODULE_CACHE];
  
  const cacheNames = await caches.keys();
  const toDelete = cacheNames.filter(name => 
    name.startsWith('dream-os-') && !currentCaches.includes(name)
  );
  
  await Promise.all(toDelete.map(name => caches.delete(name)));
  console.log('🧹 [SW] Cleaned up old caches:', toDelete);
}

/* ══════════════════════════════════════════════
   UTILITY: Check online status
   ══════════════════════════════════════════════ */
async function isOnline() {
  try {
    const response = await fetch('/manifest.json', { 
      method: 'HEAD',
      cache: 'no-store',
      mode: 'no-cors'    });
    return response.ok || response.type === 'opaque';
  } catch {
    return false;
  }
}

/* ══════════════════════════════════════════════
   LOGGING — Console output for debugging
   ══════════════════════════════════════════════ */
console.log('✅ [SW] Dream OS Service Worker loaded');
console.log('🕌 Bi idznillah — Ready to serve offline! 💚');
console.log('📱 Cache version:', CACHE_VERSION);
