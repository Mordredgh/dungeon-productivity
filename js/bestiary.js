'use strict';

/* ── BESTIARIO ─────────────────────────────────────────────────
   Todos los jefes de BOSS_DEFS.
   Bloqueados (silhouette) hasta ser derrotados.
   hero.bestiary = JSON array de boss keys derrotados.
   ─────────────────────────────────────────────────────────── */

const BESTIARY_RARITY_CLR = {
  comun:'#9ca3af', raro:'#60a5fa', epico:'#a855f7',
  legendario:'#f59e0b', mitico:'#ef4444', cataclismo:'#ec4899'
};

function getBestiary() {
  try { return JSON.parse(hero.bestiary || '[]'); } catch { return []; }
}

async function recordBossDefeat(bossKey) {
  const list = getBestiary();
  if (list.includes(bossKey)) return;
  list.push(bossKey);
  await saveHero({ bestiary: JSON.stringify(list) });
  const def = (typeof BOSS_DEFS !== 'undefined' ? BOSS_DEFS : []).find(b => b.key === bossKey);
  if (def) toast('📖', `Bestiario: ${def.name} registrado.`);
}

function renderBestiary() {
  const el = document.getElementById('bestiaryContent');
  if (!el || !hero) return;

  const defeated  = getBestiary();
  const all       = typeof BOSS_DEFS !== 'undefined' ? BOSS_DEFS : [];
  const total     = all.length;
  const doneCount = all.filter(b => defeated.includes(b.key)).length;
  const pct       = total ? Math.round((doneCount / total) * 100) : 0;

  const renderCard = b => {
    const known = defeated.includes(b.key);
    const clr   = BESTIARY_RARITY_CLR[b.rarity] || '#9ca3af';
    const img   = `${CDN}dungeon/boss_${b.key}.png`;
    return `<div class="bestiary-card ${known ? 'bestiary-known' : 'bestiary-unknown'}" style="--bc:${clr}">
      <div class="bestiary-img-wrap">
        <img src="${img}" class="bestiary-img${known ? '' : ' bestiary-locked'}" alt=""
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="bestiary-fallback" style="display:none">${known ? (b.emoji || '👹') : '❓'}</div>
        ${known ? '' : '<div class="bestiary-lock-icon">🔒</div>'}
      </div>
      <div class="bestiary-name" style="color:${known ? clr : 'var(--text3)'}">
        ${known ? escHtml(b.name) : ''}
      </div>
      <span class="bestiary-rarity" style="color:${clr}">${b.rarity}</span>
    </div>`;
  };

  const renderGroup = (label, bosses) => `
    <div class="bestiary-group-label">${escHtml(label)}</div>
    <div class="bestiary-grid">${bosses.map(renderCard).join('')}</div>`;

  const groups  = ['comun','raro','epico','legendario','mitico','cataclismo'];
  const seasonal = all.filter(b => b.seasonal);

  el.innerHTML = `
    <div class="bestiary-header">
      <span>Jefes derrotados: <strong>${doneCount} / ${total}</strong></span>
      <div class="bestiary-prog-bar"><div class="bestiary-prog-fill" style="width:${pct}%"></div></div>
    </div>
    ${groups.map(r => {
      const bosses = all.filter(b => !b.seasonal && b.rarity === r);
      return bosses.length ? renderGroup(r.toUpperCase(), bosses) : '';
    }).join('')}
    ${seasonal.length ? renderGroup('ESTACIONALES', seasonal) : ''}
  `;
}
