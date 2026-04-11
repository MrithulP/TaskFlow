/* ============================================================
   Taskflow — Service Worker
   Cache name: taskflow-v1  (won't touch other apps)
   Key fix: navigation requests always fall back to index.html
   so the installed PWA never shows a 404 on launch.
   ============================================================ */

const CACHE_NAME = 'taskflow-v1';

const PRECACHE_URLS = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './manifest.json',
  './src/icon.svg',
  './src/icon-192.png',
  './src/icon-512.png'
];

/* ---- Install: pre-cache app shell ---- */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache =>
        Promise.allSettled(
          PRECACHE_URLS.map(url => cache.add(url))
        )
      )
      .then(() => self.skipWaiting())
  );
});

/* ---- Activate: clean up old taskflow caches only ---- */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key.startsWith('taskflow-') && key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* ---- Fetch ---- */
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  /* Only handle GET */
  if (req.method !== 'GET') return;

  /* Network-first for Google Fonts & cdnjs (external, versioned) */
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com' ||
    url.hostname === 'cdnjs.cloudflare.com'
  ) {
    event.respondWith(
      fetch(req)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          }
          return response;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  /* ---- THE KEY FIX ----
     For navigation requests (i.e. the browser loading a page URL,
     which is what happens when you tap the installed PWA icon):
     - Try the cache first
     - If not found, fetch from network
     - If network also fails (offline), fall back to cached index.html
     This prevents the "page does not exist" screen on PWA launch.
  ---------------------------------------------------------------- */
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html')
        .then(cached => {
          if (cached) return cached;
          return fetch(req)
            .catch(() => caches.match('./index.html'));
        })
    );
    return;
  }

  /* Cache-first for all other same-origin assets (css, js, images) */
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return response;
      });
    })
  );
});
