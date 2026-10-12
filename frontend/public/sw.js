/**
 * MealMitra - Progressive Web App Service Worker.
 * Caches frontend app shell assets for offline availability.
 * Does NOT cache sensitive auth credentials or passwords.
 * Bypasses all /api/ requests so API always goes directly to the backend.
 */

const CACHE_NAME = 'mealmitra-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/app.css',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

// Install: precache static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: purge stale caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Stale-While-Revalidate for app assets only
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Exclude non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // DO NOT INTERCEPT API calls or backend ports (direct network only)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/') || url.port === '5000') {
    return;
  }

  // Bypass Vite dev internal requests
  if (url.pathname.startsWith('/@vite') || url.pathname.startsWith('/@fs') || url.pathname.startsWith('/@id') || url.pathname.includes('vite')) {
    return;
  }

  // App shell & static assets (JS, CSS, HTML, Fonts, Images)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
