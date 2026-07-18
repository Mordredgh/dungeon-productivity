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

const BOSS_LORE = {
  'wyvern-hielo':'Nació en las cornisas donde el invierno jamás termina. Su aliento conserva las últimas voces de los exploradores perdidos.',
  'arana-gigante':'Teje sus nidos alrededor de reliquias olvidadas; cada hilo vibra con recuerdos robados a quien cae en su cueva.',
  'dragon-obsidiana':'Fue guardián de una fragua volcánica antes de que la piedra negra sellara su corazón con brasas eternas.',
  'custodio-tiempo':'No protege el tiempo: protege la grieta donde una era entera fue borrada del mundo.',
  'liche-rey':'Un monarca que rechazó la muerte y convirtió a su corte en una biblioteca de huesos y juramentos.',
  'arquitecto-vacio':'La primera inteligencia que construyó pasillos entre estrellas. Cada derrota apenas revela una pieza de su plano.',
  'la-que-susurra':'No habla al oído: responde desde el eco de decisiones que el héroe aún no ha tomado.',
};
function getBossLore(boss) {
  if (BOSS_LORE[boss.key]) return BOSS_LORE[boss.key];
  const element = boss.element || 'arcano';
  return `${boss.name} apareció cuando la energía ${element.toLowerCase()} corrompió su antiguo territorio. Los cronistas de Arcanum aún discuten si es una criatura, un castigo o un guardián olvidado.`;
}

function getBestiary() {
  try { return JSON.parse(hero.bestiary || '[]'); } catch { return []; }
}

function _bestiaryKnowledgeKey() { return `dungeon-bestiary-knowledge-${hero?.id || 'guest'}`; }
function getBossKnowledge(bossKey) {
  try { return JSON.parse(localStorage.getItem(_bestiaryKnowledgeKey()) || '{}')[bossKey] || { victories:0 }; }
  catch { return { victories:0 }; }
}
function _recordBossKnowledge(bossKey) {
  try {
    const all = JSON.parse(localStorage.getItem(_bestiaryKnowledgeKey()) || '{}');
    const next = { ...(all[bossKey] || {}), victories:(all[bossKey]?.victories || 0) + 1, lastSeen:Date.now() };
    all[bossKey] = next;
    localStorage.setItem(_bestiaryKnowledgeKey(), JSON.stringify(all));
    return next;
  } catch { return { victories:1 }; }
}
function getBossResearchStage(bossKey) {
  const wins = getBossKnowledge(bossKey).victories || 0;
  return wins >= 5 ? 3 : wins >= 3 ? 2 : wins >= 1 ? 1 : 0;
}

async function recordBossDefeat(bossKey) {
  const list = getBestiary();
  const wasKnown = list.includes(bossKey);
  const knowledge = _recordBossKnowledge(bossKey);
  if (!wasKnown) {
    list.push(bossKey);
    await saveHero({ bestiary: JSON.stringify(list) });
  }
  const def = (typeof BOSS_DEFS !== 'undefined' ? BOSS_DEFS : []).find(b => b.key === bossKey);
  if (def && !wasKnown) toast('📖', `Bestiario: ${def.name} registrado.`);
  if (def && knowledge.victories === 3) toast('🔍', `Tácticas de ${def.name} descifradas.`);
  if (def && knowledge.victories === 5) toast('✦', `Crónica completa de ${def.name} desbloqueada.`);
}

function renderBestiary() {
  const el = document.getElementById('bestiaryContent');
  if (!el || !hero) return;
  renderBestiaryCodex(el);
  return;

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
    const img   = `images/boss_${b.key}.webp`;
    return `<button class="bst-card ${known ? 'bst-known' : 'bst-unknown'}" style="--bc:${clr}" ${known ? `onclick="openBestiaryEntry('${b.key}')"` : 'disabled'}>
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
    </button>`;
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
    <div class="bst-entry-overlay" id="bestiaryEntry" style="display:none" onclick="closeBestiaryEntry()"><article class="bst-entry" onclick="event.stopPropagation()" id="bestiaryEntryCard"></article></div>
  `;
}

let _bestiarySelectedKey = null;
function renderBestiaryCodex(el) {
  const defeated = getBestiary();
  const all = typeof BOSS_DEFS === 'undefined' ? [] : BOSS_DEFS;
  const known = all.filter(boss => defeated.includes(boss.key));
  if (!_bestiarySelectedKey || !defeated.includes(_bestiarySelectedKey)) _bestiarySelectedKey = known[0]?.key || null;
  const selected = all.find(boss => boss.key === _bestiarySelectedKey);
  const pct = all.length ? Math.round(defeated.length / all.length * 100) : 0;
  const entry = boss => {
    if (!boss) return `<div class="bstd-empty"><span>📖</span><b>Aún no hay registros</b><p>Derrota a un jefe para abrir el primer capítulo del códice.</p></div>`;
    const color = BESTIARY_RARITY_CLR[boss.rarity] || '#9ca3af';
    const chart = typeof BOSS_ELEMENT_CHART === 'undefined' ? null : BOSS_ELEMENT_CHART[boss.element];
    return `<div class="bstd-art" style="--bstd:${color}"><img src="images/boss_${boss.key}.webp" alt="${escHtml(boss.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span style="display:none">${boss.emoji || '👹'}</span></div><article class="bstd-page"><span class="bstd-rarity" style="color:${color}">${boss.rarity}</span><h3>${escHtml(boss.name)}</h3><div class="bstd-seal"><span>${boss.element}</span><span>${boss.hp} HP</span></div><p>${escHtml(getBossLore(boss))}</p>${chart ? `<div class="bstd-tactics"><b>Margen del cronista</b><span>Débil ante <strong>${chart.weakTo?.join(', ') || '—'}</strong></span><span>Resiste <strong>${chart.resists?.join(', ') || '—'}</strong></span></div>` : ''}</article>`;
  };
  const card = boss => { const isKnown = defeated.includes(boss.key); const color = BESTIARY_RARITY_CLR[boss.rarity] || '#64748b'; return `<button class="bstd-spine ${isKnown ? 'is-known' : ''} ${boss.key === _bestiarySelectedKey ? 'is-current' : ''}" style="--bstd:${color}" ${isKnown ? `onclick="selectBestiaryEntry('${boss.key}')"` : 'disabled'}><span>${isKnown ? boss.emoji || '✦' : '?'}</span><b>${isKnown ? escHtml(boss.name) : 'Registro sellado'}</b><small>${boss.rarity}</small></button>`; };
  el.innerHTML = `<section class="bstd-shell"><header class="bstd-header"><div><span>ARCHIVO DE ARCANUM</span><h3>Bestiario del Dungeon</h3></div><div class="bstd-progress"><b>${defeated.length}/${all.length}</b><i><em style="width:${pct}%"></em></i><small>${pct}% descifrado</small></div></header><div class="bstd-layout"><aside class="bstd-shelf">${all.map(card).join('')}</aside><main class="bstd-detail">${entry(selected)}</main></div></section>`;
  if (selected) {
    const wins = getBossKnowledge(selected.key).victories || 0;
    const stage = getBossResearchStage(selected.key);
    const labels = ['Identidad sellada', 'Avistamiento registrado', 'Patrones tácticos', 'Crónica completa'];
    const page = el.querySelector('.bstd-page');
    if (page) page.insertAdjacentHTML('beforeend', `<div class="bstd-research"><b>Investigación: ${labels[stage]}</b><span>${wins}/5 victorias documentadas</span><i><em style="width:${Math.min(100, wins / 5 * 100)}%"></em></i><small>${stage < 2 ? 'Vence al jefe 3 veces para revelar sus patrones.' : stage < 3 ? 'Dos victorias más revelarán su crónica completa.' : 'Archivo completo: historia y tácticas descifradas.'}</small></div>`);
  }
}
function selectBestiaryEntry(key) { _bestiarySelectedKey = key; renderBestiary(); }

function openBestiaryEntry(key) {
  const boss = (typeof BOSS_DEFS === 'undefined' ? [] : BOSS_DEFS).find(entry => entry.key === key);
  const overlay = document.getElementById('bestiaryEntry');
  const card = document.getElementById('bestiaryEntryCard');
  if (!boss || !overlay || !card || !getBestiary().includes(key)) return;
  const color = BESTIARY_RARITY_CLR[boss.rarity] || '#9ca3af';
  const chart = typeof BOSS_ELEMENT_CHART !== 'undefined' ? BOSS_ELEMENT_CHART[boss.element] : null;
  card.style.setProperty('--bst-c', color);
  card.innerHTML = `<button class="bst-entry-close" onclick="closeBestiaryEntry()">×</button><div class="bst-entry-art"><img src="images/boss_${boss.key}.webp" alt="${escHtml(boss.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span style="display:none">${boss.emoji || '👹'}</span></div><div class="bst-entry-copy"><span class="bst-entry-rarity">${boss.rarity}</span><h3>${escHtml(boss.name)}</h3><div class="bst-entry-tags"><span>${boss.element || 'Normal'}</span><span>${boss.hp} HP</span></div><p>${escHtml(getBossLore(boss))}</p>${chart ? `<div class="bst-entry-tactics"><b>Registro táctico</b><span>Débil ante: ${chart.weakTo?.length ? chart.weakTo.join(', ') : 'sin debilidad conocida'}</span><span>Resiste: ${chart.resists?.length ? chart.resists.join(', ') : 'ninguna'}</span></div>` : ''}</div>`;
  overlay.style.display = 'flex';
}
function closeBestiaryEntry() { const overlay = document.getElementById('bestiaryEntry'); if (overlay) overlay.style.display = 'none'; }
