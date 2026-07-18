'use strict';
/* ============================================================
   FACCIONES DEL DUNGEON
   Reputación acumulada por tipo de misión completada (all-time).
   3 rangos por facción — cada rango da bonus pasivo de XP (igual
   patrón que Zonas) en misiones del tipo de esa facción. El rango
   máximo desbloquea una SERIE de 3 misiones reales al azar (de un
   pool más grande); el bono de oro/XP se entrega al completar las
   3. Reclamable de nuevo cada FACTION_RECLAIM_COOLDOWN_MS una vez
   completada la serie anterior.
   hero.faction_claims = [{ id, questIds:[...], done, doneAt }]
   (histórico — se van agregando entradas, nunca se borran)
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

/* Bonus pasivo de XP por rango de facción — llamado desde quests.js completeQuest() */
function getFactionBonus(q) {
  const def = FACTION_DEFS.find(f => f.type === q.type);
  if (!def) return 0;
  const xp = _factionXP(def.type);
  const idx = _factionRankIndex(def, xp);
  return def.ranks[idx].bonus || 0;
}

function _factionFocusKey() { return `dungeon-faction-focus-${hero?.id || 'guest'}`; }
function getFactionFocus() { return localStorage.getItem(_factionFocusKey()) || ''; }
function getFactionFocusBonus(q) {
  const focused = FACTION_DEFS.find(f => f.id === getFactionFocus());
  return focused && focused.type === q.type ? .10 : 0;
}
function setFactionFocus(factionId) {
  const def = FACTION_DEFS.find(f => f.id === factionId);
  if (!def) return;
  const next = getFactionFocus() === factionId ? '' : factionId;
  localStorage.setItem(_factionFocusKey(), next);
  toast(def.icon, next ? `${def.name} es ahora tu rumbo activo: +10% XP en sus misiones.` : 'Rumbo de facción desactivado.');
  renderFactions();
}

function _factionClaims() {
  try { return JSON.parse(hero?.faction_claims || '[]'); } catch { return []; }
}

function _factionLatestClaim(factionId, claims) {
  const own = claims.filter(c => c.id === factionId);
  return own.length ? own[own.length - 1] : null;
}

async function claimFactionExclusive(factionId) {
  const def = FACTION_DEFS.find(f => f.id === factionId);
  if (!def || !hero) return;
  const xp = _factionXP(def.type);
  const rankIdx = _factionRankIndex(def, xp);
  if (rankIdx < def.ranks.length - 1) { toast('🔒', 'Aún no alcanzas el rango máximo de esta facción.'); return; }

  const claims = _factionClaims();
  const latest = _factionLatestClaim(factionId, claims);
  if (latest && !latest.done) { toast('⏳', 'Ya tienes una serie en progreso para esta facción.'); return; }
  if (latest && latest.done) {
    const elapsed = Date.now() - (latest.doneAt || 0);
    if (elapsed < FACTION_RECLAIM_COOLDOWN_MS) {
      const daysLeft = Math.ceil((FACTION_RECLAIM_COOLDOWN_MS - elapsed) / 86400000);
      toast('🔒', `Podrás reclamar una nueva serie de ${def.name} en ${daysLeft} día${daysLeft === 1 ? '' : 's'}.`);
      return;
    }
  }

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

  claims.push({ id: factionId, questIds, done: false, doneAt: null });
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
  entry.doneAt = Date.now();
  hero.faction_claims = JSON.stringify(claims);
  await saveHero({ faction_claims: hero.faction_claims });
  if (def) {
    const salaFaction = typeof getSalaBonus === 'function' ? getSalaBonus('faction_xp') : 0;
    const rawXP = Math.round(def.exclusive.xp * (1 + salaFaction));
    const rewardXP = typeof balanceReward === 'function' ? balanceReward('xp', def.exclusive.xp, rawXP).amount : rawXP;
    const rewardGold = typeof balanceReward === 'function' ? balanceReward('gold', def.exclusive.gold, def.exclusive.gold).amount : def.exclusive.gold;
    await addXP(rewardXP, 'side', null);
    if (typeof addGold === 'function') addGold(rewardGold);
    if (typeof recordRewardLedger === 'function') recordRewardLedger({ type:'faction', faction:def.id, xp:rewardXP, gold:rewardGold, at:Date.now() });
    toast(def.icon, `¡Serie de ${def.name} completada! +${rewardXP} XP, +${rewardGold} oro.`);
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
  const latest   = _factionLatestClaim(def.id, claims);
  const focused  = getFactionFocus() === def.id;

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
  rankEl.textContent = rank.name + (rank.bonus > 0 ? ` · +${Math.round(rank.bonus * 100)}% XP` : '');
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
  const inProgress = latest && !latest.done;
  const onCooldown = latest && latest.done && (Date.now() - (latest.doneAt || 0)) < FACTION_RECLAIM_COOLDOWN_MS;
  const canClaim = isMax && !inProgress && !onCooldown;
  btn.disabled = !canClaim;
  if (inProgress) {
    btn.textContent = '⏳ Serie en progreso — revisa tus misiones';
  } else if (onCooldown) {
    const daysLeft = Math.ceil((FACTION_RECLAIM_COOLDOWN_MS - (Date.now() - latest.doneAt)) / 86400000);
    btn.textContent = `✅ Completada — nueva serie en ${daysLeft}d`;
  } else if (isMax) {
    btn.textContent = latest ? '🎁 Reclamar nueva serie' : '🎁 Reclamar serie de misiones';
  } else {
    btn.textContent = '🔒 Rango máximo para desbloquear';
  }
  btn.addEventListener('click', () => claimFactionExclusive(def.id));

  const focusBtn = document.createElement('button');
  focusBtn.className = 'faction-focus-btn' + (focused ? ' faction-focus-active' : '');
  focusBtn.textContent = focused ? '✦ Rumbo activo · +10% XP' : 'Fijar rumbo · +10% XP';
  focusBtn.addEventListener('click', () => setFactionFocus(def.id));

  card.append(hd, desc, barTrack, barLbl, focusBtn, btn);
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
