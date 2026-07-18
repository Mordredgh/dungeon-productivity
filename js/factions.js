'use strict';
/* ============================================================
   FACCIONES DEL DUNGEON
   Reputación acumulada por tipo de misión completada (all-time).
   3 rangos por facción; el rango máximo desbloquea 1 misión
   exclusiva reclamable una sola vez (hero.faction_claims jsonb).
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
  if (claims.includes(factionId)) { toast('✅', 'Ya reclamaste la misión exclusiva de esta facción.'); return; }

  const { data } = await db.from('dungeon_quests').insert({
    hero_id: hero.id,
    name: def.exclusive.name,
    type: def.type,
    tags: '#faccion',
    notes: `Misión exclusiva de ${def.name}.`,
    priority: 'epico',
  }).select().single();
  if (data) quests.push(data);

  claims.push(factionId);
  hero.faction_claims = JSON.stringify(claims);
  await saveHero({ faction_claims: hero.faction_claims });
  toast(def.icon, `¡Misión exclusiva de ${def.name} desbloqueada! Revisa tus misiones.`);
  renderQuestList();
  renderFactions();
}

function _factionCardEl(def, claims) {
  const xp       = _factionXP(def.type);
  const rankIdx  = _factionRankIndex(def, xp);
  const rank     = def.ranks[rankIdx];
  const isMax    = rankIdx === def.ranks.length - 1;
  const nextRank = def.ranks[rankIdx + 1];
  const pct      = nextRank ? Math.min(100, Math.round(((xp - rank.xp) / (nextRank.xp - rank.xp)) * 100)) : 100;
  const claimed  = claims.includes(def.id);

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
  btn.disabled = !(isMax && !claimed);
  btn.textContent = claimed ? '✅ Misión exclusiva reclamada' : isMax ? `🎁 Reclamar: ${def.exclusive.name}` : '🔒 Rango máximo para desbloquear';
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
