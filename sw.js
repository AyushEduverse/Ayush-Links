/* ============================================
   Service Worker — Ayush-link PWA
   Cache-first strategy for static assets
   Network-first strategy for external links
   ============================================ */
const CACHE_NAME = 'ayush-link-v1';
const STATIC_CACHE = 'ayush-link-static-v1';

// Critical assets to pre-cache on install (core HTML/CSS/JS/icons only)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/css/variables.css',
  '/css/base.css',
  '/css/hero.css',
  '/css/components.css',
  '/css/responsive.css',
  '/css/animations.css',
  '/css/touch.css',
  '/js/theme.js',
  '/js/email.js',
  '/js/whatsapp.js',
  '/js/gsap-entrance.js',
  '/js/typed.js',
  '/js/stars.js',
  '/js/interactions.js',
  '/js/touch.js',
  '/js/init.js',
  '/assets/icons/favicon.ico',
  '/assets/icons/favicon-16x16.png',
  '/assets/icons/favicon-32x32.png',
  '/assets/icons/android-chrome-192x192.png',
  '/assets/icons/android-chrome-512x512.png',
  '/assets/icons/site.webmanifest',
  '/assets/image/Aayush.webp'
];

// ---------- INSTALL ----------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      // Use individual cache.add() with catch so a single failure
      // doesn't prevent SW installation
      return Promise.allSettled(
        PRECACHE_ASSETS.map((asset) =>
          cache.add(asset).catch(() => {
            console.warn('[PWA] Failed to cache:', asset);
          })
        )
      );
    }).then(() => {
      self.skipWaiting();
    })
  );
});

// ---------- ACTIVATE (cleanup old caches) ----------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      self.clients.claim();
    })
  );
});

// ---------- FETCH ----------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (CDN scripts, fonts, remix icons) —
  // let the browser handle them natively
  if (url.origin !== self.location.origin) {
    return;
  }

  // Cache-first strategy for our own assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Stale-while-revalidate: update cache in background
        fetch(request).then((response) => {
          if (response && response.status === 200) {
            const cache = caches.open(STATIC_CACHE);
            cache.then((c) => c.put(request, response));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      // Not in cache — fetch from network
      return fetch(request).then((response) => {
        // Cache successful responses for future offline use
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
        }
        return response;
      }).catch(() => {
        // Offline fallback: return index.html for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
