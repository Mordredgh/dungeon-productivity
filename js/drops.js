'use strict';

/* ── SISTEMA DE DROPS ──────────────────────────────────────────
   Al completar una misión muestra animación de +XP +Gold
   y con probabilidad baja un item especial.
   ─────────────────────────────────────────────────────────── */

const DROP_CHANCES = {
  legendary: { item: .40, frag: .60 },
  epic:      { item: .25, frag: .45 },
  rare:      { item: .12, frag: .30 },
  uncommon:  { item: .06, frag: .18 },
  common:    { item: .03, frag: .10 },
};

const DROP_ITEMS = [
  { icon: '💊', label: 'Poción HP', effect: async () => { if(hero){ await addHP(15); toast('💊','Poción HP +15'); } } },
  { icon: '⚡', label: 'Energía',   effect: async () => { await addXP(25,'side',null); toast('⚡','Energía +25 XP'); } },
  { icon: '🪙', label: 'Bolsa Oro', effect: async () => { addGold(20); toast('🪙','¡Bolsa de Oro +20!'); } },
  { icon: '🔮', label: 'Fragmento', effect: async () => { toast('🔮','Fragmento Arcano x1'); } },
  { icon: '🌟', label: 'Estrella',  effect: async () => { await addXP(50,'side',null); toast('🌟','¡Estrella Dorada! +50 XP'); } },
];

function spawnLootDrop(xpAmt, goldAmt, rarity = 'common', originEl = null) {
  const container = document.getElementById('lootDropContainer');
  if (!container) return;

  // Position: near origin element or center screen
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  if (originEl) {
    const rect = originEl.getBoundingClientRect();
    x = rect.left + rect.width / 2;
    y = rect.top + rect.height / 2;
  }

  // XP float
  _spawnFloat(container, x + Math.random() * 30 - 15, y, `
    <div class="loot-drop-xp">+${xpAmt} XP</div>
  `);

  // Gold float (offset)
  if (goldAmt > 0) {
    setTimeout(() => {
      _spawnFloat(container, x + Math.random() * 30 - 15, y + 10, `
        <div class="loot-drop-label">🪙 +${goldAmt}</div>
      `);
    }, 120);
  }

  // Random item drop
  const chances = DROP_CHANCES[rarity] || DROP_CHANCES.common;
  const _spawnItem = (delay) => {
    const item = DROP_ITEMS[Math.floor(Math.random() * DROP_ITEMS.length)];
    setTimeout(async () => {
      _spawnFloat(container, x + Math.random() * 40 - 20, y - 10, `
        <div class="loot-drop-icon">${item.icon}</div>
        <div class="loot-drop-label">${item.label}</div>
      `);
      await item.effect();
    }, delay);
  };
  const roll = Math.random();
  if (roll < chances.item) {
    _spawnItem(300);
  } else if (roll < chances.frag) {
    setTimeout(() => {
      _spawnFloat(container, x + Math.random() * 40 - 20, y - 10, `
        <div class="loot-drop-icon">🔮</div>
        <div class="loot-drop-label">Fragmento</div>
      `);
    }, 300);
  }

  // LCK: +1 extra item roll per 5 points
  const lckExtra = Math.floor((hero?.lck || 0) / 5);
  for (let i = 0; i < lckExtra; i++) {
    if (Math.random() < chances.item) _spawnItem(500 + i * 250);
  }
}

function _spawnFloat(container, x, y, innerHTML) {
  const el = document.createElement('div');
  el.className = 'loot-drop';
  el.innerHTML = innerHTML;
  el.style.left = `${x}px`;
  el.style.top  = `${y}px`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 2400);
}
