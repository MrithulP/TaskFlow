/* ============================================================
   Taskflow — Service Worker
   Scope: /taskflow/   (set in index.html registration)
   Cache: taskflow-v1  (unique name — won't touch other apps)
   ============================================================ */

const CACHE_NAME = 'taskflow-v1';

const PRECACHE_URLS = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './manifest.json',
  './src/icon.svg',
  './src/logo.svg',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
];

/* ---- Install: pre-cache all shell assets ---- */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        PRECACHE_URLS.map(url =>
          cache.add(url).catch(() => {
            console.warn('[Taskflow SW] Failed to pre-cache:', url);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

/* ---- Activate: delete any old taskflow caches ---- */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith('taskflow-') && key !== CACHE_NAME)
          .map(key => {
            console.log('[Taskflow SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

/* ---- Fetch: cache-first for local assets, network-first for CDN ---- */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  /* Only handle GET requests */
  if (event.request.method !== 'GET') return;

  /* Network-first for Google Fonts & CDN (they update) */
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com' ||
    url.hostname === 'cdnjs.cloudflare.com'
  ) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  /* Cache-first for everything else (app shell) */
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        /* Only cache valid same-origin responses */
        if (
          response &&
          response.status === 200 &&
          response.type === 'basic'
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
