const CACHE = 'dungeon-v188';
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
  '/js/oracle.js',
  '/js/shop.js',
  '/js/familiar.js',
  '/js/rpg.js',
  '/js/pets.js',
  '/js/weapons.js',
  '/js/secret_sets.js',
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
  '/js/animations.js',
  '/js/effects.js',
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
  /* Rune fragments */
  '/images/runa_fragmento_fuerza.png',
  '/images/runa_fragmento_vida.png',
  '/images/runa_fragmento_velocidad.png',
  '/images/runa_fragmento_arcana.png',
  '/images/runa_fragmento_xp.png',
  '/images/runa_fragmento_sombra.png',
  '/images/runa_fragmento_mitica.png',
  '/images/runa_fragmento_proteccion.png',
  /* Complete runes */
  '/images/runa_fuerza.png',
  '/images/runa_vida.png',
  '/images/runa_velocidad.png',
  '/images/runa_arcana.png',
  '/images/runa_xp.png',
  '/images/runa_sombra.png',
  '/images/runa_mitica.png',
  '/images/runa_proteccion.png',
  /* Consumables */
  '/images/item_potion.png',
  '/images/item_scroll.png',
  '/images/item_amulet.png',
  '/images/item_xpstone.png',
  '/images/item_revival.png',
  '/images/item_hp_minor.png',
  '/images/item_gold_rush.png',
  '/images/item_boss_shield.png',
  '/images/item_xp_scroll_sm.png',
  /* Spell images */
  '/images/spell_frenzy.png',
  '/images/spell_speed.png',
  '/images/spell_berserker.png',
  '/images/spell_shield.png',
  '/images/spell_modo-berserker.png',
  '/images/spell_healing.png',
  '/images/spell_mente-acero.png',
  '/images/spell_rayo-arcano.png',
  '/images/spell_bola-fuego.png',
  '/images/spell_maldicion-abismal.png',
  '/images/spell_tormenta-hielo.png',
  '/images/spell_furia-dragon.png',
  /* Dungeon rooms */
  '/images/dungeon_sala1.png',
  '/images/dungeon_sala2.png',
  '/images/dungeon_sala3.png',
  '/images/dungeon_sala4.png',
  '/images/dungeon_sala5.png',
  '/images/dungeon_sala6.png',
  '/images/dungeon_sala7.png',
  '/images/dungeon_sala8.png',
  '/images/dungeon_sala9.png',
  /* World map */
  '/images/mapa_mundo.png',
  /* World map icons */
  '/images/map_ciudadela.png',
  '/images/map_campo.png',
  '/images/map_torre.png',
  '/images/map_fortaleza.png',
  '/images/map_jardin.png',
  '/images/map_cripta.png',
  /* Pet garden */
  '/js/pet_garden.js',
  '/js/boss_battle.js',
  '/images/jardin_fondo.png',
  /* Pet eggs */
  '/images/pet_egg_zorro-naturaleza.png',
  '/images/pet_egg_pantera-sombra.png',
  '/images/pet_egg_lobo-tormenta.png',
  '/images/pet_egg_grifo.png',
  '/images/pet_egg_dragon-fuego.png',
  '/images/pet_egg_fenix-mitico.png',
  '/images/pet_egg_rey-tempestad.png',
  /* Pet babies */
  '/images/pet_baby_zorro-naturaleza.png',
  '/images/pet_baby_pantera-sombra.png',
  '/images/pet_baby_lobo-tormenta.png',
  '/images/pet_baby_grifo.png',
  '/images/pet_baby_dragon-fuego.png',
  '/images/pet_baby_fenix-mitico.png',
  '/images/pet_baby_rey-tempestad.png',
  /* Pet mounts */
  '/images/pet_mount_zorro-naturaleza.png',
  '/images/pet_mount_pantera-sombra.png',
  '/images/pet_mount_lobo-tormenta.png',
  '/images/pet_mount_grifo.png',
  '/images/pet_mount_dragon-fuego.png',
  '/images/pet_mount_fenix-mitico.png',
  '/images/pet_mount_rey-tempestad.png',
  /* Pet potions */
  '/images/pet_pocion_zorro-naturaleza.png',
  '/images/pet_pocion_pantera-sombra.png',
  '/images/pet_pocion_lobo-tormenta.png',
  '/images/pet_pocion_grifo.png',
  '/images/pet_pocion_dragon-fuego.png',
  '/images/pet_pocion_fenix-mitico.png',
  '/images/pet_pocion_rey-tempestad.png',
  /* Pet food */
  '/images/pet_alimento_zorro-naturaleza.png',
  '/images/pet_alimento_pantera-sombra.png',
  '/images/pet_alimento_lobo-tormenta.png',
  '/images/pet_alimento_grifo.png',
  '/images/pet_alimento_dragon-fuego.png',
  '/images/pet_alimento_fenix-mitico.png',
  '/images/pet_alimento_rey-tempestad.png',
  /* Weapons & armor */
  '/images/arma_espada_comun.png','/images/arma_espada_raro.png','/images/arma_espada_epico.png','/images/arma_espada_legendario.png','/images/arma_espada_mitico.png',
  '/images/arma_mazo_comun.png','/images/arma_mazo_raro.png','/images/arma_mazo_epico.png','/images/arma_mazo_legendario.png','/images/arma_mazo_mitico.png',
  '/images/arma_baculo_comun.png','/images/arma_baculo_raro.png','/images/arma_baculo_epico.png','/images/arma_baculo_legendario.png','/images/arma_baculo_mitico.png',
  '/images/arma_arco_comun.png','/images/arma_arco_raro.png','/images/arma_arco_epico.png','/images/arma_arco_legendario.png','/images/arma_arco_mitico.png',
  '/images/arma_dagas_comun.png','/images/arma_dagas_raro.png','/images/arma_dagas_epico.png','/images/arma_dagas_legendario.png','/images/arma_dagas_mitico.png',
  '/images/arma_pecho_comun.png','/images/arma_pecho_raro.png','/images/arma_pecho_epico.png','/images/arma_pecho_legendario.png','/images/arma_pecho_mitico.png',
  '/images/arma_casco_comun.png','/images/arma_casco_raro.png','/images/arma_casco_epico.png','/images/arma_casco_legendario.png','/images/arma_casco_mitico.png',
  '/images/arma_botas_comun.png','/images/arma_botas_raro.png','/images/arma_botas_epico.png','/images/arma_botas_legendario.png','/images/arma_botas_mitico.png',
  '/images/arma_guantes_comun.png','/images/arma_guantes_raro.png','/images/arma_guantes_epico.png','/images/arma_guantes_legendario.png','/images/arma_guantes_mitico.png',
  '/images/arma_grebas_comun.png','/images/arma_grebas_raro.png','/images/arma_grebas_epico.png','/images/arma_grebas_legendario.png','/images/arma_grebas_mitico.png',
  /* Character portraits */
  '/images/char_guerrero_humano.png','/images/char_guerrero_elfo.png',
  '/images/char_mago_humano.png','/images/char_mago_elfo.png',
  '/images/char_arquero_humano.png','/images/char_arquero_elfo.png',
  '/images/char_clerigo_humano.png','/images/char_clerigo_elfo.png',
  '/images/char_picaro_humano.png','/images/char_picaro_elfo.png',
  '/images/char_fundador_humano.png','/images/char_fundador_elfo.png',
  /* Secret class portraits */
  '/images/char_secreto_crononauta.png','/images/char_secreto_paladin.png',
  '/images/char_secreto_nigromante.png','/images/char_secreto_titan.png',
  '/images/char_secreto_druida.png','/images/char_secreto_estrella-caida.png',
  /* Pet fondos */
  '/images/pet_fondo_baby_zorro-naturaleza.png','/images/pet_fondo_baby_pantera-sombra.png','/images/pet_fondo_baby_lobo-tormenta.png','/images/pet_fondo_baby_grifo.png','/images/pet_fondo_baby_dragon-fuego.png','/images/pet_fondo_baby_fenix-mitico.png','/images/pet_fondo_baby_rey-tempestad.png',
  '/images/pet_fondo_mount_zorro-naturaleza.png','/images/pet_fondo_mount_pantera-sombra.png','/images/pet_fondo_mount_lobo-tormenta.png','/images/pet_fondo_mount_grifo.png','/images/pet_fondo_mount_dragon-fuego.png','/images/pet_fondo_mount_fenix-mitico.png','/images/pet_fondo_mount_rey-tempestad.png',
  '/images/pet_fondo_egg_zorro-naturaleza.png','/images/pet_fondo_egg_pantera-sombra.png','/images/pet_fondo_egg_lobo-tormenta.png','/images/pet_fondo_egg_grifo.png','/images/pet_fondo_egg_dragon-fuego.png','/images/pet_fondo_egg_fenix-mitico.png','/images/pet_fondo_egg_rey-tempestad.png',
  /* Sala personal furniture */
  '/images/mueble_sillon.png','/images/mueble_candelabro.png','/images/mueble_cofre.png',
  '/images/mueble_espejo.png','/images/mueble_estanteria.png','/images/mueble_bola-cristal.png',
  '/images/mueble_cuadro.png','/images/mueble_planta.png','/images/mueble_rack-armas.png',
  '/images/mueble_vasija.png',
  /* View backgrounds */
  '/images/fondo_misiones.png','/images/fondo_metas.png','/images/fondo_stats.png',
  '/images/fondo_logros.png','/images/fondo_history.png','/images/fondo_shop.png',
  '/images/fondo_inventario.png','/images/fondo_pets.png','/images/fondo_dungeon-grows.png',
  '/images/fondo_integrations.png','/images/fondo_character.png','/images/fondo_habilidades.png',
  '/images/fondo_runas.png','/images/fondo_bestiario.png','/images/fondo_herrero.png',
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





