'use strict';

/* ── BESTIARIO ───────────────────────────────────────────────
   Galería de jefes derrotados.
   Guardado en hero.bestiary (jsonb array de boss_key).
   ─────────────────────────────────────────────────────────── */

const BESTIARY_DEFS = [
  { key:'caballero-esqueleto', name:'Caballero Esqueleto',    rarity:'normal',     icon:'💀', lore:'Un guerrero olvidado atrapado en metal oxidado. Tu primer jefe derrotado.' },
  { key:'demonio-sombras',     name:'Demonio de Sombras',     rarity:'legendario', icon:'👿', lore:'Criatura nacida del caos del Dungeon. Sus garras rasgan el tejido del tiempo.' },
  { key:'liche-ancestral',     name:'Liche Ancestral',        rarity:'mitico',     icon:'🧟', lore:'Archiimago que rechazó la muerte. Su sabiduría es tan vasta como su crueldad.' },
  { key:'halloween',           name:'Señor de las Sombras',   rarity:'mitico',     icon:'🎃', lore:'Despierta cada año en el umbral entre mundos. Su poder es inmenso... y temporal.' },
  { key:'navidad',             name:'Krampus Arcano',         rarity:'mitico',     icon:'🎄', lore:'No todos los regalos son buenos. Éste castiga a los héroes flojos del año.' },
  { key:'anio-nuevo',          name:'Dragón del Tiempo',      rarity:'mitico',     icon:'🐲', lore:'Guardián de los últimos instantes del año. Su derrota abre las puertas al futuro.' },
];

function getBestiary() {
  try { return JSON.parse(hero.bestiary || '[]'); } catch { return []; }
}

async function recordBossDefeat(bossKey) {
  const list = getBestiary();
  if (list.includes(bossKey)) return;
  list.push(bossKey);
  await saveHero({ bestiary: JSON.stringify(list) });
  const def = BESTIARY_DEFS.find(b => b.key === bossKey);
  if (def) toast('📖', `Bestiario actualizado: ${def.name} registrado.`);
}

function renderBestiary() {
  const el = document.getElementById('bestiaryContent');
  if (!el || !hero) return;

  const defeated = getBestiary();
  const total    = BESTIARY_DEFS.length;
  const pct      = Math.round((defeated.length / total) * 100);

  el.innerHTML = `
    <div class="bestiary-header">
      <span>Jefes derrotados: <strong>${defeated.length} / ${total}</strong></span>
      <div class="bestiary-prog-bar"><div class="bestiary-prog-fill" style="width:${pct}%"></div></div>
    </div>
    <div class="bestiary-grid">
      ${BESTIARY_DEFS.map(b => {
        const known = defeated.includes(b.key);
        const img   = `${CDN}dungeon/boss_${b.key}.png`;
        const rarityColor = { normal:'#9ca3af', legendario:'#f59e0b', mitico:'#ef4444' }[b.rarity] || '#9ca3af';
        return `
          <div class="bestiary-card ${known ? 'bestiary-known' : 'bestiary-unknown'}" style="--bc:${rarityColor}">
            ${known
              ? `<img src="${img}" class="bestiary-img" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                 <div class="bestiary-emoji" style="display:none">${b.icon}</div>`
              : `<div class="bestiary-emoji bestiary-hidden">❓</div>`}
            <div class="bestiary-name" style="color:${known ? rarityColor : 'var(--text3)'}">
              ${known ? b.name : '???'}
            </div>
            ${known ? `<div class="bestiary-lore">${b.lore}</div>` : `<div class="bestiary-lore">Aún no derrotado</div>`}
            <span class="bestiary-rarity" style="color:${rarityColor}">${b.rarity}</span>
          </div>`;
      }).join('')}
    </div>`;
}
