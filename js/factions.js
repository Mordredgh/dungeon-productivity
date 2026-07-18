'use strict';
/* ============================================================
   FACCIONES DEL DUNGEON
   Reputación acumulada por tipo de misión completada (all-time).
   3 rangos por facción; el rango máximo desbloquea una SERIE de
   3 misiones reales concretas (no 1 sola genérica). El bono de
   oro/XP se entrega al completar las 3. Reclamable una sola vez.
   hero.faction_claims = [{ id, questIds:[...], done:false }]
   ============================================================ */

function _factionXP(type) {
  return quests
    .filter(q => q.done && q.type === type)
    .reduce((s, q) => s + (XP_TABLE[type] || 50), 0);
}

function _factionRankIndex(def, xp) {
  let idx = 0;
  def.ranks.forEach((r, i) => { if (xp >= r.xp) idx = i; });
  return idx;
}

function _factionClaims() {
  try { return JSON.parse(hero?.faction_claims || '[]'); } catch { return []; }
}

async function claimFactionExclusive(factionId) {
  const def = FACTION_DEFS.find(f => f.id === factionId);
  if (!def || !hero) return;
  const xp = _factionXP(def.type);
  const rankIdx = _factionRankIndex(def, xp);
  if (rankIdx < def.ranks.length - 1) { toast('🔒', 'Aún no alcanzas el rango máximo de esta facción.'); return; }
  const claims = _factionClaims();
  if (claims.some(c => c.id === factionId)) { toast('✅', 'Ya reclamaste la serie de misiones de esta facción.'); return; }

  const pool  = [...def.exclusive.stepsPool];
  const steps = [];
  for (let i = 0; i < 3 && pool.length; i++) {
    steps.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }

  const questIds = [];
  for (const step of steps) {
    const { data } = await db.from('dungeon_quests').insert({
      hero_id: hero.id,
      name: step,
      type: def.type,
      tags: '#faccion',
      notes: `Misión de la serie exclusiva de ${def.name}.`,
      priority: 'epico',
    }).select().single();
    if (data) { quests.push(data); questIds.push(data.id); }
  }

  claims.push({ id: factionId, questIds, done: false });
  hero.faction_claims = JSON.stringify(claims);
  await saveHero({ faction_claims: hero.faction_claims });
  toast(def.icon, `¡3 misiones de ${def.name} desbloqueadas! Complétalas para el bono final.`);
  renderQuestList();
  renderFactions();
}

/* Llamado desde quests.js completeQuest() tras cada misión completada */
async function checkFactionExclusiveProgress(questId) {
  if (!hero) return;
  const claims = _factionClaims();
  const entry = claims.find(c => !c.done && c.questIds && c.questIds.includes(questId));
  if (!entry) return;
  const allDone = entry.questIds.every(qid => quests.find(q => q.id === qid && q.done));
  if (!allDone) return;

  const def = FACTION_DEFS.find(f => f.id === entry.id);
  entry.done = true;
  hero.faction_claims = JSON.stringify(claims);
  await saveHero({ faction_claims: hero.faction_claims });
  if (def) {
    await addXP(def.exclusive.xp, 'side', null);
    if (typeof addGold === 'function') addGold(def.exclusive.gold);
    toast(def.icon, `¡Serie de ${def.name} completada! +${def.exclusive.xp} XP, +${def.exclusive.gold} oro.`);
  }
  renderFactions();
}

function _factionCardEl(def, claims) {
  const xp       = _factionXP(def.type);
  const rankIdx  = _factionRankIndex(def, xp);
  const rank     = def.ranks[rankIdx];
  const isMax    = rankIdx === def.ranks.length - 1;
  const nextRank = def.ranks[rankIdx + 1];
  const pct      = nextRank ? Math.min(100, Math.round(((xp - rank.xp) / (nextRank.xp - rank.xp)) * 100)) : 100;
  const claimEntry = claims.find(c => c.id === def.id);

  const card = document.createElement('div');
  card.className = 'faction-card';
  card.style.setProperty('--fc', def.color);

  const hd = document.createElement('div');
  hd.className = 'faction-card-hd';
  const icon = document.createElement('span');
  icon.className = 'faction-icon';
  icon.textContent = def.icon;
  const title = document.createElement('div');
  title.className = 'faction-title';
  const name = document.createElement('div');
  name.className = 'faction-name';
  name.textContent = def.name;
  const rankEl = document.createElement('div');
  rankEl.className = 'faction-rank';
  rankEl.textContent = rank.name;
  title.append(name, rankEl);
  hd.append(icon, title);

  const desc = document.createElement('div');
  desc.className = 'faction-desc';
  desc.textContent = def.desc;

  const barTrack = document.createElement('div');
  barTrack.className = 'faction-bar-track';
  const barFill = document.createElement('div');
  barFill.className = 'faction-bar-fill';
  barFill.style.width = pct + '%';
  barTrack.append(barFill);

  const barLbl = document.createElement('div');
  barLbl.className = 'faction-bar-lbl';
  barLbl.textContent = isMax ? `${xp} XP acumulados` : `${xp}/${nextRank.xp} XP para ${nextRank.name}`;

  const btn = document.createElement('button');
  btn.className = 'faction-claim-btn';
  const claimed = !!claimEntry;
  const done = claimEntry?.done;
  btn.disabled = !(isMax && !claimed);
  btn.textContent = done ? '✅ Serie completada' : claimed ? '⏳ Serie en progreso — revisa tus misiones' : isMax ? '🎁 Reclamar serie de misiones' : '🔒 Rango máximo para desbloquear';
  btn.addEventListener('click', () => claimFactionExclusive(def.id));

  card.append(hd, desc, barTrack, barLbl, btn);
  return card;
}

function renderFactions() {
  const el = document.getElementById('factionsView');
  if (!el || !hero) return;
  const claims = _factionClaims();
  el.textContent = '';
  const grid = document.createElement('div');
  grid.className = 'faction-grid';
  FACTION_DEFS.forEach(def => grid.append(_factionCardEl(def, claims)));
  el.append(grid);
}
