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

  const RARITY_LABEL = {
    comun:'Común', raro:'Raro', epico:'Épico',
    legendario:'Legendario', mitico:'Mítico', cataclismo:'Cataclismo'
  };

  const renderCard = b => {
    const known = defeated.includes(b.key);
    const clr   = BESTIARY_RARITY_CLR[b.rarity] || '#9ca3af';
    const img   = `images/boss_${b.key}.png`;
    return `<div class="bst-card ${known ? 'bst-known' : 'bst-unknown'}" style="--bc:${clr}">
      <div class="bst-rarity-bar" style="background:${clr}22;border-top:2px solid ${clr}">
        <span class="bst-rarity-label" style="color:${clr}">${RARITY_LABEL[b.rarity] || b.rarity}</span>
      </div>
      <div class="bst-img-wrap">
        <img src="${img}" class="bst-img${known ? '' : ' bst-silhouette'}" alt=""
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="bst-img-fallback" style="display:none">${known ? (b.emoji || '👹') : '❓'}</div>
        ${known ? '' : `<div class="bst-unknown-overlay"><span class="bst-q">?</span></div>`}
      </div>
      <div class="bst-name" style="color:${known ? clr : 'var(--text3)'}">
        ${known ? escHtml(b.name) : '???'}
      </div>
    </div>`;
  };

  const renderGroup = (label, bosses) => `
    <div class="bst-group-label">${escHtml(label)}</div>
    <div class="bst-grid">${bosses.map(renderCard).join('')}</div>`;

  const groups  = ['comun','raro','epico','legendario','mitico','cataclismo'];
  const seasonal = all.filter(b => b.seasonal);

  el.innerHTML = `
    <div class="bst-header">
      <div class="bst-count">📖 <strong>${doneCount}</strong> / ${total} jefes</div>
      <div class="bst-prog-bar"><div class="bst-prog-fill" style="width:${pct}%"></div></div>
      <div class="bst-pct">${pct}%</div>
    </div>
    ${groups.map(r => {
      const bosses = all.filter(b => !b.seasonal && b.rarity === r);
      return bosses.length ? renderGroup(RARITY_LABEL[r] || r.toUpperCase(), bosses) : '';
    }).join('')}
    ${seasonal.length ? renderGroup('Estacionales', seasonal) : ''}
  `;
}
