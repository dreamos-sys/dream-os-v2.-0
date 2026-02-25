const CACHE_NAME = 'dreamos-v2-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/core/config.js',
  '/core/supabase.js',
  '/core/store.js',
  '/core/auth.js',
  '/core/router.js',
  '/core/api.js',
  '/core/components.js',
  '/core/error.js',
  '/core/ai.js',
  '/core/notification.js',
  '/core/offline.js',
  '/core/audit.js',
  '/core/utils.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
});
