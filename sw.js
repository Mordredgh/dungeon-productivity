const CACHE = 'dungeon-v76';
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
  '/js/goals.js',
  '/js/reputation.js',
  '/js/patterns.js',
  '/js/mechanics.js',
  '/js/character.js',
  '/js/spotify.js',
  '/js/weather.js',
  '/js/dungeon_clock.js',
  '/js/skill_tree.js',
  '/js/bestiary.js',
  '/js/dungeon_grows.js',
  '/js/runes.js',
  '/js/google_fit.js',
  '/js/hero_score.js',
  '/js/push.js',
  '/js/combos.js',
  '/js/habits.js',
  '/js/ruleta.js',
  '/js/duolingo.js',
  '/js/drops.js',
  '/js/daily_goal.js',
  '/js/weekly_summary.js',
  '/js/challenges.js',
  '/js/zones.js',
  '/js/hero_card.js',
  '/js/world_map.js',
  '/js/auth.js',
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

self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'Arcanum', {
      body:    data.body  || '',
      icon:    'https://stdedxhxxoyostymldqn.supabase.co/storage/v1/object/public/assets/dungeon/logo-icon.png',
      badge:   'https://stdedxhxxoyostymldqn.supabase.co/storage/v1/object/public/assets/dungeon/logo-icon.png',
      vibrate: [200, 100, 200],
      data:    { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type:'window', includeUncontrolled:true }).then(list => {
      const existing = list.find(c => c.url.includes(self.location.origin));
      if (existing) { existing.focus(); existing.navigate(e.notification.data?.url || '/'); }
      else clients.openWindow(e.notification.data?.url || '/');
    })
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
