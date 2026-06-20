const CACHE = 'dungeon-v97';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/dungeon.css',
  '/css/dungeon-v2.css',
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
  '/js/sala_personal.js',
  '/js/auth.js',
  '/js/main.js',
  '/images/boss-bg-comun-1.png',
  '/images/boss-bg-comun-2.png',
  '/images/boss-bg-raro-1.png',
  '/images/boss-bg-raro-2.png',
  '/images/boss-bg-epico-1.png',
  '/images/boss-bg-epico-2.png',
  '/images/boss-bg-legendario-1.png',
  '/images/boss-bg-legendario-2.png',
  '/images/boss-bg-mitico-1.png',
  '/images/boss-bg-mitico-2.png',
  '/images/boss-bg-cataclismo-1.png',
  '/images/boss-bg-cataclismo-2.png',
  '/images/boss_arana-gigante.png',
  '/images/boss_anio-nuevo.png',
  '/images/boss_behemot-vacio.png',
  '/images/boss_caballero-espectral.png',
  '/images/boss_custodio-tiempo.png',
  '/images/boss_devorador-constelaciones.png',
  '/images/boss_dragon-tormentas.png',
  '/images/boss_dragon-obsidiana.png',
  '/images/boss_arquitecto-vacio.png',
  '/images/boss_fenix-cenizas.png',
  '/images/boss_golem-cristal.png',
  '/images/boss_golem-piedra.png',
  '/images/boss_halloween.png',
  '/images/boss_hidra-pesadilla.png',
  '/images/boss_kraken-abisal.png',
  '/images/boss_la-que-susurra.png',
  '/images/boss_demonio-sombras.png',
  '/images/boss_liche-ancestral.png',
  '/images/boss_liche-rey.png',
  '/images/boss_navidad.png',
  '/images/boss_caballero-esqueleto.png',
  '/images/boss_ogro-cripta.png',
  '/images/boss_quimera.png',
  '/images/boss_serafin-caido.png',
  '/images/boss_slime-corrosivo.png',
  '/images/boss_titan-magma.png',
  '/images/boss_wyvern-hielo.png',
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
