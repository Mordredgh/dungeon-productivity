const CACHE = 'dungeon-v16';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/dungeon.css',
  '/js/config.js',
  '/js/state.js',
  '/js/db.js',
  '/js/hero.js',
  '/js/quests.js',
  '/js/timer.js',
  '/js/inventory.js',
  '/js/spells.js',
  '/js/views.js',
  '/js/ui.js',
  '/js/events.js',
  '/js/shop.js',
  '/js/familiar.js',
  '/js/rpg.js',
  '/js/pets.js',
  '/js/weapons.js',
  '/js/character.js',
  '/js/spotify.js',
  '/js/weather.js',
  '/js/main.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  if (e.request.url.includes('supabase.co')) return;
  // HTML: network-first para siempre tener la versiÃ³n mÃ¡s reciente
  if (e.request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
