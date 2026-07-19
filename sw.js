/* ArcANUM service worker: núcleo pequeño, arte bajo demanda.
   Nunca precachear sprites/fondos completos: el navegador los guarda al verlos. */
const CACHE = 'dungeon-v283';
const CORE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/dungeon.css',
  '/css/dungeon-v2.css',
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('dungeon-') && key !== CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

function shouldCache(request) {
  const url = new URL(request.url);
  return url.origin === self.location.origin
    && request.method === 'GET'
    && (/\.(?:js|css|webp|png|svg|woff2?)$/i.test(url.pathname) || url.pathname === '/' || url.pathname.endsWith('.html'));
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (!shouldCache(request)) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(request, copy));
      return response;
    }).catch(() => caches.match(request).then(hit => hit || caches.match('/index.html'))));
    return;
  }

  event.respondWith(caches.match(request).then(hit => hit || fetch(request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(request, copy));
    }
    return response;
  })));
});
