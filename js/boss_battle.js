'use strict';
/* ============================================================
   BOSS BATTLE  — Sistema de combate tipo Pokémon  v1
   ============================================================ */

/* ── Movimientos por mascota (4 por mascota) ─────────────────
   power: multiplicador sobre el daño base
   reqLevel: nivel mínimo de la mascota para desbloquear
   (0 = siempre disponible)
   ──────────────────────────────────────────────────────────── */
const PET_MOVES = {
  'zorro-naturaleza': [
    { id:'zarpazo',    name:'Zarpazo',            icon:'🌿', img:'move_normal', power:1.0, type:'Normal',    reqLevel:0  },
    { id:'mordida',    name:'Mordida Silvestre',   icon:'🦷', img:'move_normal', power:1.5, type:'Normal',    reqLevel:0  },
    { id:'torbellino', name:'Torbellino Verde',    icon:'🌪️', img:'move_elemental', power:2.5, type:'Elemental', reqLevel:5  },
    { id:'furia-nat',  name:'Furia Natural',       icon:'🌳', img:'move_especial', power:4.0, type:'Especial',  reqLevel:15 },
  ],
  'pantera-sombra': [
    { id:'garra',    name:'Garra Oscura',     icon:'🌑', img:'move_normal', power:1.0, type:'Normal',   reqLevel:0  },
    { id:'paso',     name:'Paso Sombra',      icon:'💨', img:'move_normal', power:1.5, type:'Normal',   reqLevel:0  },
    { id:'mirada',   name:'Mirada Abisal',    icon:'👁️', img:'move_oscuro', power:2.5, type:'Oscuro',   reqLevel:5  },
    { id:'eclipse',  name:'Eclipse Total',    icon:'🌑', img:'move_especial', power:4.0, type:'Especial', reqLevel:15 },
  ],
  'lobo-tormenta': [
    { id:'mordisco', name:'Mordisco Eléctrico', icon:'⚡', img:'move_normal', power:1.0, type:'Normal',    reqLevel:0  },
    { id:'aullido',  name:'Aullido de Trueno',  icon:'🌩️', img:'move_electrico', power:1.5, type:'Eléctrico', reqLevel:0  },
    { id:'rayo',     name:'Rayo Ártico',         icon:'❄️', img:'move_electrico', power:2.5, type:'Eléctrico', reqLevel:5  },
    { id:'tormenta', name:'Tormenta de Acero',   icon:'🌀', img:'move_especial', power:4.0, type:'Especial',  reqLevel:15 },
  ],
  'grifo': [
    { id:'picotazo', name:'Picotazo Arcano',   icon:'🦅', img:'move_normal', power:1.0, type:'Normal',   reqLevel:0  },
    { id:'garra-g',  name:'Garra Épica',       icon:'✨', img:'move_normal', power:1.5, type:'Normal',   reqLevel:0  },
    { id:'viento',   name:'Ráfaga de Viento',  icon:'💨', img:'move_aereo', power:2.5, type:'Aéreo',    reqLevel:5  },
    { id:'divino',   name:'Juicio Divino',     icon:'⚡', img:'move_especial', power:4.0, type:'Especial', reqLevel:15 },
  ],
  'dragon-fuego': [
    { id:'zarpa-d',  name:'Zarpa de Fuego',    icon:'🔥', img:'move_normal', power:1.0, type:'Normal',  reqLevel:0  },
    { id:'mordida-d',name:'Mordida Llameante', icon:'🐉', img:'move_fuego', power:1.5, type:'Fuego',   reqLevel:0  },
    { id:'llamarada',name:'Llamarada',         icon:'🌋', img:'move_fuego', power:2.5, type:'Fuego',   reqLevel:5  },
    { id:'inferno',  name:'Infierno Eterno',   icon:'☄️', img:'move_especial', power:4.0, type:'Especial',reqLevel:15 },
  ],
  'fenix-mitico': [
    { id:'pluma',    name:'Pluma de Fuego',    icon:'🔥', img:'move_normal', power:1.0, type:'Normal',   reqLevel:0  },
    { id:'llama-f',  name:'Llama Purificadora',icon:'✨', img:'move_fuego', power:1.5, type:'Normal',   reqLevel:0  },
    { id:'resurgir', name:'Resurgir',          icon:'💫', img:'move_magico', power:2.5, type:'Mágico',   reqLevel:5  },
    { id:'sol-eterno',name:'Sol Eterno',       icon:'☀️', img:'move_especial', power:4.0, type:'Especial', reqLevel:15 },
  ],
  'rey-tempestad': [
    { id:'corona',   name:'Corona de Truenos', icon:'👑', img:'move_normal', power:1.0, type:'Normal',    reqLevel:0  },
    { id:'decreto',  name:'Decreto Imperial',  icon:'⚡', img:'move_electrico', power:1.5, type:'Eléctrico', reqLevel:0  },
    { id:'tifon',    name:'Tifón Real',        icon:'🌪️', img:'move_elemental', power:2.5, type:'Cataclismo',reqLevel:5  },
    { id:'apocalipsis',name:'Apocalipsis',     icon:'🌩️', img:'move_especial', power:4.0, type:'Especial',  reqLevel:15 },
  ],
};

const _BB_FALLBACK_MOVES = [
  { id:'ataque',    name:'Ataque',         icon:'⚔️', power:1.0, type:'Normal',   reqLevel:0  },
  { id:'embestida', name:'Embestida',      icon:'💥', power:1.5, type:'Normal',   reqLevel:0  },
  { id:'rafaga',    name:'Ráfaga Mágica',  icon:'✨', power:2.5, type:'Mágico',   reqLevel:5  },
  { id:'devastar',  name:'Devastar',       icon:'🔥', power:4.0, type:'Especial', reqLevel:15 },
];

function _bbMoves(petKey) { return PET_MOVES[petKey] || _BB_FALLBACK_MOVES; }

function _bbMoveVisual(move) {
  const type = String(move?.type || 'Normal').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const img = move?.img || `move_${type}`;
  return `<img class="bb-move-art" src="images/${img}.webp" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"><span style="display:none">${move?.icon || '✦'}</span>`;
}

function _bbHeroVisual(heroClass, fallback) {
  const img = `habilidad_${heroClass || 'guerrero'}`;
  return `<img class="bb-move-art" src="images/${img}.webp" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"><span style="display:none">${fallback || '✦'}</span>`;
}

function _bbMoveUnlocked(move, pet) {
  return (pet.pet_level || 1) >= (move.reqLevel || 0);
}

/* ── Estado local de la batalla ───────────────────────────── */
let _bbCycle         = null;
let _bbPet           = null;
let _bbPetDef        = null;
let _bbAnimating     = false;
let _bbEnteringTimer = null;
let _bbPetHp         = 100;
let _bbPetMaxHp      = 100;
let _bbHeroSkillUsed = false;

/* ── Modificadores de stats en batalla (estilo Pokémon, ±6) ── */
let _bbPetAtkStage = 0;
let _bbPetDefStage = 0;
/* ── Estado alterado de la mascota (solo local a la batalla) ── */
let _bbPetStatus = null; // null | 'quemado' | 'paralizado'
let _bbTurn = 'player';
let _bbBattleLog = [];
let _bbBattleStats = { damage:0, hits:0, crits:0, healing:0 };
let _bbCalloutTimer = null;
let _bbLastPhase = null;
let _bbSpeed = 1;
/* ── Último golpe fue crítico (leído justo tras _bbApplyVariance/_bbBossDmg) ── */
let _bbLastCrit = false;

function _bbResetBattleModifiers() {
  _bbPetAtkStage = 0;
  _bbPetDefStage = 0;
  _bbPetStatus   = null;
}

function _bbSetTurn(turn, message) {
  _bbTurn = turn;
  const banner = document.getElementById('bbTurnBanner');
  if (!banner) return;
  banner.className = `bb-turn-banner bb-turn-${turn}`;
  banner.innerHTML = `<span class="bb-turn-pip"></span><strong>${turn === 'boss' ? 'TURNO ENEMIGO' : 'TU TURNO'}</strong><span>${escHtml(message || (turn === 'boss' ? 'El jefe prepara su contraataque' : 'Elige una habilidad'))}</span>`;
}

function _bbLogEvent(icon, message, tone = '') {
  _bbBattleLog.push({ icon, message, tone });
  _bbBattleLog = _bbBattleLog.slice(-6);
  const log = document.getElementById('bbBattleLog');
  if (!log) return;
  log.innerHTML = `<div class="bb-log-title">✦ Crónica de combate</div>${_bbBattleLog.slice(-4).reverse().map(entry =>
    `<div class="bb-log-entry ${entry.tone}"><span>${entry.icon}</span><span>${escHtml(entry.message)}</span></div>`
  ).join('')}`;
}

function _bbCombatCallout(message, tone = '') {
  const callout = document.getElementById('bbCombatCallout');
  if (!callout) return;
  if (_bbCalloutTimer) clearTimeout(_bbCalloutTimer);
  callout.className = `bb-combat-callout ${tone}`;
  callout.textContent = message;
  requestAnimationFrame(() => callout.classList.add('bb-callout-show'));
  _bbCalloutTimer = setTimeout(() => callout.classList.remove('bb-callout-show'), 1150);
}

function _bbBossIntent(phase) {
  const element = _bbBossElement();
  const byElement = {
    Fuego:['🔥','Acumula ceniza ardiente'], Eléctrico:['⚡','Carga una descarga rúnica'],
    Oscuro:['🌑','Teje sombras alrededor'], Elemental:['🌿','Invoca raíces del santuario'],
    Mágico:['✦','Canaliza energía arcana'], Aéreo:['💨','Reúne viento cortante'],
    Cataclismo:['🜂','Despierta un cataclismo'], Normal:['⚔️','Mide tu defensa']
  };
  const base = byElement[element] || byElement.Normal;
  if (phase === 'final') return { icon:'☠️', text:`Furia final: ${base[1].toLowerCase()}` };
  if (phase === 'enraged') return { icon:'💢', text:`Enfurecido: ${base[1].toLowerCase()}` };
  return { icon:base[0], text:base[1] };
}

function toggleBattleSpeed() {
  _bbSpeed = _bbSpeed === 1 ? 1.6 : _bbSpeed === 1.6 ? 2 : 1;
  const button = document.getElementById('bbSpeedBtn');
  if (button) button.textContent = `${_bbSpeed}×`;
  _bbCombatCallout(_bbSpeed === 1 ? 'RITMO NORMAL' : `RITMO ${_bbSpeed}×`, 'super');
}

function _bbBurstVfx(kind, anchorEl) {
  const layer = document.getElementById('bbCombatVfx');
  if (!layer || !anchorEl) return;
  const rect = anchorEl.getBoundingClientRect();
  const burst = document.createElement('div');
  burst.className = `bb-vfx-burst bb-vfx-${kind}`;
  burst.style.left = `${rect.left + rect.width / 2}px`;
  burst.style.top = `${rect.top + rect.height / 2}px`;
  layer.appendChild(burst);
  setTimeout(() => burst.remove(), 650);
}

/* Multiplicador de etapa estilo Pokémon: etapa>=0 → (2+n)/2, etapa<0 → 2/(2-n) */
function _bbStageMult(stage) {
  return stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
}
function _bbRaiseAtkStage(n) { _bbPetAtkStage = Math.max(-6, Math.min(6, _bbPetAtkStage + n)); }
function _bbLowerStat(stat, n) {
  if (stat === 'atk') _bbPetAtkStage = Math.max(-6, Math.min(6, _bbPetAtkStage - n));
  else _bbPetDefStage = Math.max(-6, Math.min(6, _bbPetDefStage - n));
}

/* ── Ataques: clave por ciclo+periodo (no solo fecha) ─────── */
/* Esto garantiza 5 ataques frescos cuando se genera un boss nuevo */
function _bbAttackKey(cycle) {
  const period = typeof _bossPeriodKey === 'function' ? _bossPeriodKey(cycle) : new Date().toISOString().split('T')[0];
  return 'dungeon-bb-atk-' + cycle + '-' + period;
}
/* La batalla debe permitir una sesión táctica real, no cinco clics y fuera. */
function _bbMaxAttacks() {
  const strategyBonus = typeof hasGoldUpgrade === 'function' && hasGoldUpgrade('war_table') ? 3 : 0;
  return 12 + strategyBonus + (typeof getMasteryBonus === 'function' ? getMasteryBonus('voluntad') : 0);
}
function _bbLeft(cycle) { try { return Math.max(0, _bbMaxAttacks() - parseInt(localStorage.getItem(_bbAttackKey(cycle)) || '0', 10)); } catch { return _bbMaxAttacks(); } }
function _bbUse(cycle)  { try { const k = _bbAttackKey(cycle); localStorage.setItem(k, String((parseInt(localStorage.getItem(k)||'0',10))+1)); } catch {} }

/* ── PP por movimiento — límite individual además del contador global ──
   Movimientos más fuertes (Especial) tienen menos usos por jefe/período. */
function _bbMoveMaxPP(move) {
  if (move.power >= 4)   return 2;
  if (move.power >= 2.5) return 3;
  if (move.power >= 1.5) return 5;
  return 8;
}
function _bbMovePPKey(cycle, moveId) {
  const period = typeof _bossPeriodKey === 'function' ? _bossPeriodKey(cycle) : new Date().toISOString().split('T')[0];
  return 'dungeon-bb-pp-' + cycle + '-' + period + '-' + moveId;
}
function _bbMovePPLeft(cycle, move) {
  try { return Math.max(0, _bbMoveMaxPP(move) - parseInt(localStorage.getItem(_bbMovePPKey(cycle, move.id)) || '0', 10)); }
  catch { return _bbMoveMaxPP(move); }
}
function _bbUseMovePP(cycle, move) {
  try { const k = _bbMovePPKey(cycle, move.id); localStorage.setItem(k, String((parseInt(localStorage.getItem(k)||'0',10))+1)); } catch {}
}

/* ── Nivel del jefe — escala con el nivel del héroe ───────── */
function _bbBossLevel() { return hero?._level || 1; }

/* ── Daño del boss al contra-atacar (estilo Pokémon: nivel + variación) ── */
function _bbBossDmg() {
  const state = getMultiBossState();
  const boss  = state[_bbCycle];
  _bbLastCrit = false;
  if (!boss || !_bbPetDef) return 3;
  const petDef    = (getPetStatAtLevel(_bbPetDef, _bbPet?.pet_level || 1).def || 0) * _bbStageMult(_bbPetDefStage);
  const rarMult   = { comun:0.4, raro:0.7, epico:1.1, legendario:1.5, mitico:2.0, cataclismo:2.8 }[boss.rarity] || 1;
  const levelTerm = (2 * _bbBossLevel() / 5 + 2);
  const random    = 0.85 + Math.random() * 0.30; // 0.85–1.15, variación real por golpe
  const hpPct     = boss.maxHp ? boss.hp / boss.maxHp : 1;
  const phaseMult = hpPct <= .25 ? 1.55 : hpPct <= .60 ? 1.28 : 1;
  const base      = levelTerm * rarMult * 1.2 * phaseMult;
  const isCrit    = Math.random() < 0.05;
  _bbLastCrit     = isCrit;
  const critMult  = isCrit ? 1.5 : 1;
  const salaResist = typeof getSalaBonus === 'function' ? getSalaBonus('boss_resist') : 0;
  return Math.max(1, Math.round((Math.round(base * random * critMult) - Math.floor(petDef * 0.3)) * (1 - salaResist)));
}

/* ── Daño solo al ciclo objetivo ──────────────────────────── */
function _damageBossCycle(cycle, baseDmg) {
  const state = getMultiBossState();
  const b = state[cycle];
  if (!b || b.defeated) return 0;

  const weather  = typeof getTodayWeather === 'function' ? getTodayWeather() : '';
  const petMult  = typeof getPetEffect    === 'function' ? (getPetEffect('boss_dmg')   || 1) : 1;
  const petSpecMult = typeof getActivePetSpecializationBonus === 'function' ? 1 + getActivePetSpecializationBonus('boss_dmg') : 1;
  const runeMult = typeof getRuneBonus    === 'function' ? (1 + getRuneBonus('boss_dmg'))     : 1;
  const dungeonMult = typeof getDungeonBonus === 'function' ? getDungeonBonus('boss_dmg') : 1;
  const doctrineMult = typeof getPrestigeDoctrineBonus === 'function' ? 1 + getPrestigeDoctrineBonus('boss_dmg') : 1;
  const finalDmg = Math.max(1, Math.round((weather === 'storm' ? baseDmg * 2 : baseDmg) * petMult * petSpecMult * runeMult * dungeonMult * doctrineMult));

  b.hp = Math.max(0, b.hp - finalDmg);

  if (b.hp === 0) {
    b.defeated = true;
    const reward = (typeof BOSS_DEFEAT_REWARDS !== 'undefined' && BOSS_DEFEAT_REWARDS[b.rarity]) || { gold:50, xp:100 };
    setTimeout(async () => {
      const xp = typeof balanceReward === 'function' ? balanceReward('xp', reward.xp, reward.xp).amount : reward.xp;
      const gold = typeof balanceReward === 'function' ? balanceReward('gold', reward.gold, reward.gold).amount : reward.gold;
      if (typeof addGold        === 'function') addGold(gold);
      if (typeof addXP          === 'function') await addXP(xp, 'main', null);
      if (typeof recordRewardLedger === 'function') recordRewardLedger({ type:'boss', boss:b.key, xp, gold, at:Date.now() });
      if (typeof toast          === 'function') toast('🏆', `¡${b.name} DERROTADO! +${gold}🪙 +${xp} XP`);
      if (typeof dungeonPush    === 'function') dungeonPush('🏆 ¡Jefe Derrotado!', `${b.name} venció. +${gold}🪙 +${xp} XP`);
      if (typeof recordBossDefeat === 'function') recordBossDefeat(b.key);
      if (typeof trackBossKill    === 'function') trackBossKill();
      if (typeof addActivePetXP   === 'function') addActivePetXP({ daily:30, weekly:100, monthly:250 }[cycle] || 30);
      if (typeof tryRuneDrop === 'function' && Math.random() < (reward.runeChance || 0)) setTimeout(() => tryRuneDrop('boss'), 1400);
      if (typeof updateBossBanner === 'function') updateBossBanner();
    }, 800);
  }

  if (typeof saveMultiBossState === 'function') saveMultiBossState(state);
  if (typeof updateBossBanner   === 'function') updateBossBanner();

  return finalDmg;
}

/* ── Agotamiento de mascota — al caer en batalla, no se cura sola ──
   Escala con la rareza del jefe: cuanto más duro el combate, más
   tiempo real de descanso necesita. Se puede saltar con una poción. */
const _BB_EXHAUST_HOURS = { comun:2, raro:2, epico:4, legendario:4, mitico:8, cataclismo:8 };

function _bbIsPetExhausted(pet) {
  return typeof isPetResting === 'function' ? isPetResting(pet) : !!(pet && pet.exhausted_until && new Date(pet.exhausted_until) > new Date());
}

async function _bbSetPetExhausted() {
  if (!_bbPet || !_bbCycle) return;
  const bossState = getMultiBossState();
  const boss      = bossState[_bbCycle];
  const baseHours = _BB_EXHAUST_HOURS[boss?.rarity] || 2;
  const salaRest = typeof getSalaBonus === 'function' ? getSalaBonus('pet_rest') : 0;
  const gardenRest = typeof getGardenBonus === 'function' ? getGardenBonus('rest') : 0;
  const hours     = Math.max(1, Math.ceil(baseHours * (1 - salaRest) * (1 - gardenRest)));
  const until     = new Date(Date.now() + hours * 3600000).toISOString();
  _bbPet.exhausted_until = until;
  await db.from('dungeon_pets').update({ exhausted_until: until }).eq('id', _bbPet.id);
  return hours;
}

async function _bbHandlePetFaint() {
  const hours = await _bbSetPetExhausted();
  toast('💀', `${_bbPetDef?.name || 'Tu mascota'} se debilitó en batalla... descansará ${hours}h (o usa una poción para despertarla ya).`);
  await _bbDelay(1000);
  closeBossBattle();
}

/* ── Elemento del jefe activo ──────────────────────────────── */
function _bbBossElement() {
  const bossState = getMultiBossState();
  const boss      = bossState[_bbCycle];
  if (!boss) return 'Normal';
  const def = typeof BOSS_DEFS !== 'undefined' ? BOSS_DEFS.find(d => d.key === boss.key) : null;
  return def?.element || 'Normal';
}

/* ── Calcular daño de un movimiento (con efectividad elemental) ──
   Determinístico — se usa para el preview en los botones. La
   variación aleatoria real se aplica al golpear con _bbApplyVariance(). */
function _bbCalcDmg(move) {
  const bossState = getMultiBossState();
  const boss      = bossState[_bbCycle];
  if (!boss || !_bbPetDef) return 1;
  const petSt  = getPetStatAtLevel(_bbPetDef, _bbPet.pet_level || 1);
  const base   = Math.ceil(boss.maxHp * 0.04 * move.power);
  const bonus  = Math.floor(petSt.atk * 2 * _bbStageMult(_bbPetAtkStage));
  const mult   = typeof getElementMultiplier === 'function' ? getElementMultiplier(_bbBossElement(), move.type) : 1;
  const masteryMult = 1 + (typeof getMasteryBonus === 'function' ? getMasteryBonus('fuerza_bruta') : 0);
  const salaMult    = 1 + (typeof getSalaBonus === 'function' ? getSalaBonus('boss_dmg') : 0);
  const burnMult    = _bbPetStatus === 'quemado' ? 0.75 : 1;
  return Math.max(1, Math.round((base + bonus) * mult * masteryMult * salaMult * burnMult));
}

/* Variación aleatoria estilo Pokémon (0.85–1.15) + golpe crítico (~8%, x1.5) —
   aplicar solo al golpear de verdad, nunca en el preview determinístico. */
function _bbApplyVariance(dmg) {
  const isCrit = Math.random() < (0.08 + (typeof getSalaBonus === 'function' ? getSalaBonus('boss_crit') : 0));
  _bbLastCrit  = isCrit;
  const critMult = isCrit ? 1.5 : 1;
  return Math.max(1, Math.round(dmg * (0.85 + Math.random() * 0.30) * critMult));
}

/* ── Abrir pantalla de batalla ────────────────────────────── */
function openBossBattle(cycle) {
  const bossState = getMultiBossState();
  const boss = bossState[cycle];
  if (!boss) return;
  if (boss.defeated) { toast('🏆', 'Este jefe ya fue derrotado. ¡Espera al siguiente ciclo!'); return; }

  _bbCycle   = cycle;
  const _availablePets = (typeof pets !== 'undefined' ? pets : []).filter(p => p.stage !== 'egg' && !_bbIsPetExhausted(p));
  _bbPet     = _availablePets.find(p => p.is_active) || _availablePets[0] || null;
  _bbPetDef  = _bbPet ? PET_DEFS.find(d => d.key === _bbPet.pet_key) : null;
  _bbAnimating = false;
  _bbHeroSkillUsed = false;
  _bbTurn = 'player';
  _bbBattleLog = [];
  _bbBattleStats = { damage:0, hits:0, crits:0, healing:0 };
  _bbLastPhase = null;
  _bbResetBattleModifiers();

  /* Inicializar HP de combate de la mascota */
  if (_bbPet && _bbPetDef) {
    const st    = getPetStatAtLevel(_bbPetDef, _bbPet.pet_level || 1);
    _bbPetMaxHp = Math.max(20, 40 + Math.round(st.atk * 4));
    _bbPetHp    = _bbPetMaxHp;
  } else {
    _bbPetMaxHp = 40; _bbPetHp = 40;
  }

  /* Ocultar pantalla de victoria si quedó de batalla anterior */
  const vs = document.getElementById('bbVictoryScreen');
  if (vs) { vs.style.display = 'none'; vs.style.opacity = ''; }

  _bbRender();
  _bbLogEvent('📜', `${boss.name} entra al campo de batalla.`);

  const overlay = document.getElementById('bossBattleOverlay');
  if (overlay) {
    overlay.classList.add('bb-open');
    document.body.style.overflow = 'hidden';
    const arena = overlay.querySelector('.bb-arena');
    if (arena) {
      if (_bbEnteringTimer) clearTimeout(_bbEnteringTimer);
      arena.classList.add('anim-bb-entering');
      _bbEnteringTimer = setTimeout(() => { arena.classList.remove('anim-bb-entering'); _bbEnteringTimer = null; }, 700);
    }
  }
}

function closeBossBattle() {
  const overlay = document.getElementById('bossBattleOverlay');
  if (overlay) overlay.classList.remove('bb-open');
  document.body.style.overflow = '';
  _bbCycle = null;
  _bbAnimating = false;
  const vs = document.getElementById('bbVictoryScreen');
  if (vs) { vs.style.display = 'none'; vs.style.opacity = ''; }
}

/* ── Seleccionar mascota en batalla ───────────────────────── */
function _bbPickPet(petId) {
  if (typeof pets === 'undefined') return;
  const p = pets.find(x => x.id === petId);
  if (!p) return;
  if (typeof isPetOnGardenExpedition === 'function' && isPetOnGardenExpedition(p.id)) { toast('🧭', 'Esta mascota está explorando el jardín y no puede entrar a batalla.'); return; }
  if (_bbIsPetExhausted(p)) { toast('😴', 'Esta mascota está descansando — no puede batallar todavía.'); return; }
  _bbPet    = p;
  _bbPetDef = PET_DEFS.find(d => d.key === p.pet_key) || null;
  const st    = getPetStatAtLevel(_bbPetDef, _bbPet.pet_level || 1);
  _bbPetMaxHp = Math.max(20, 40 + Math.round(st.atk * 4));
  _bbPetHp    = _bbPetMaxHp;
  _bbResetBattleModifiers();
  _bbRender();
}

/* ── Renderizar pantalla ──────────────────────────────────── */
function _bbRender() {
  if (!_bbCycle) return;
  const bossState = getMultiBossState();
  const boss      = bossState[_bbCycle];
  if (!boss) return;

  const hpPct = Math.max(0, Math.round((boss.hp / boss.maxHp) * 100));
  const phase = hpPct <= 25 ? 'final' : hpPct <= 60 ? 'enraged' : 'opening';
  if (_bbLastPhase && _bbLastPhase !== phase) {
    const phaseText = phase === 'final' ? '¡Fase final! El jefe pelea sin piedad.' : '¡El jefe entra en furia!';
    _bbLogEvent(phase === 'final' ? '☠️' : '💢', phaseText, 'enemy');
    _bbCombatCallout(phase === 'final' ? '¡FASE FINAL!' : '¡ENFURECIDO!', 'enemy');
  }
  _bbLastPhase = phase;
  const arena = document.querySelector('#bossBattleOverlay .bb-arena');
  if (arena) {
    arena.dataset.phase = phase;
    arena.classList.toggle('bb-arena-enraged', phase === 'enraged' || phase === 'final');
  }
  const hpClr = hpPct > 50 ? '#4ade80' : hpPct > 25 ? '#facc15' : '#f87171';

  const rarClr = {
    comun:'#9ca3af', raro:'#60a5fa', epico:'#c084fc',
    legendario:'#f9e2af', mitico:'#fb923c', cataclismo:'#f43f5e'
  }[boss.rarity] || '#9ca3af';
  const rarLbl = { comun:'Común', raro:'Raro', epico:'Épico', legendario:'Legendario', mitico:'Mítico', cataclismo:'CATACLISMO' }[boss.rarity] || boss.rarity;
  const cycleLabel = { daily:'☀️ Diario', weekly:'📅 Semanal', monthly:'🌙 Mensual' }[_bbCycle] || _bbCycle;

  /* ─ Boss background ─ */
  const variant = (Math.floor(Date.now() / 86400000) % 2) + 1;
  const bgBoss  = document.getElementById('bbBg');
  if (bgBoss) bgBoss.style.backgroundImage = `url('images/boss-bg-${boss.rarity}-${variant}.webp')`;

  /* ─ Cycle badge ─ */
  const badge = document.getElementById('bbCycleBadge');
  if (badge) { badge.textContent = cycleLabel; badge.style.background = rarClr + '22'; badge.style.color = rarClr; }
  _bbSetTurn(_bbTurn, phase === 'final' ? 'Fase final: el jefe está desesperado' : phase === 'enraged' ? 'Fase dos: el jefe se enfurece' : _bbTurn === 'boss' ? 'El jefe prepara su contraataque' : 'Elige una habilidad');

  /* ─ Boss info ─ */
  const bossEl    = _bbBossElement();
  const bossIntent = _bbBossIntent(phase);
  const elemIcon  = { Fuego:'🔥', Elemental:'🌿', Eléctrico:'⚡', Aéreo:'💨', Oscuro:'🌑', Mágico:'✨', Cataclismo:'🌀', Normal:'⚪' }[bossEl] || '⚪';
  const bossInfoEl = document.getElementById('bbBossInfo');
  if (bossInfoEl) bossInfoEl.innerHTML = `
    <div class="bb-entity-name" style="color:${rarClr}">${escHtml(boss.name)} <span style="font-size:11px;color:var(--text3)">Nv.${_bbBossLevel()}</span></div>
    <div class="bb-rarity-chip" style="color:${rarClr};border-color:${rarClr}44">${rarLbl}</div>
    <div class="bb-rarity-chip" style="margin-left:4px">${elemIcon} ${escHtml(bossEl)}</div>
    <div class="bb-boss-intent"><span>${bossIntent.icon}</span><span>${escHtml(bossIntent.text)}</span></div>
    <div class="bb-hp-row">
      <span class="bb-hp-lbl">HP</span>
      <div class="bb-hp-track"><div id="bbBossHpFill" class="bb-hp-fill" style="width:${hpPct}%;background:${hpClr}"></div></div>
      <span class="bb-hp-val">${boss.hp}/${boss.maxHp}</span>
    </div>`;

  /* ─ Boss sprite ─ */
  const bossDef      = typeof BOSS_DEFS !== 'undefined' ? BOSS_DEFS.find(d => d.key === boss.key) : null;
  const bossEmoji    = bossDef?.emoji || '👹';
  const bossSpriteEl = document.getElementById('bbBossSprite');
  if (bossSpriteEl) bossSpriteEl.innerHTML = boss.key
    ? `<img class="bb-boss-img" src="images/boss_${escHtml(boss.key)}.webp" alt="${escHtml(boss.name)}"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="bb-sprite-emoji">${bossEmoji}</div>`
    : `<div class="bb-sprite-emoji">${bossEmoji}</div>`;

  /* ─ Pet side ─ */
  const petSpriteEl = document.getElementById('bbPetSprite');
  const petInfoEl   = document.getElementById('bbPetInfo');
  const movePanelEl = document.getElementById('bbMovePanel');

  if (!_bbPet || !_bbPetDef) {
    const hasRestingPets = (typeof pets !== 'undefined' ? pets : []).some(p => p.stage !== 'egg' && _bbIsPetExhausted(p));
    if (petSpriteEl) petSpriteEl.innerHTML = `<div class="bb-sprite-emoji" style="font-size:60px">${hasRestingPets ? '😴' : '🥚'}</div>`;
    if (petInfoEl)   petInfoEl.innerHTML   = `<div class="bb-entity-name" style="color:var(--text3)">${hasRestingPets ? 'Mascotas descansando' : 'Sin mascota'}</div>`;
    if (movePanelEl) movePanelEl.innerHTML = hasRestingPets
      ? `<div class="bb-no-pet-msg">Todas tus mascotas están agotadas por batallas anteriores.<br>Usa una poción en Mascotas para despertar una ahora, o espera a que descansen.
          <button class="btn btn-ghost" style="margin-top:10px;font-size:12px" onclick="closeBossBattle();switchView('pets')">🐾 Ir a Mascotas</button>
        </div>`
      : `<div class="bb-no-pet-msg">Necesitas una mascota para batallar.
          <button class="btn btn-primary" style="margin-top:10px;font-size:12px" onclick="closeBossBattle();switchView('shop')">🏪 Ir a la Tienda</button>
        </div>`;
    return;
  }

  const petSt      = getPetStatAtLevel(_bbPetDef, _bbPet.pet_level || 1);
  const attacksLeft = _bbLeft(_bbCycle);

  /* ─ Pet sprite ─ */
  /* ─ Pet sprite: imagen real si baby/mount, emoji si huevo ─ */
  const _petStage = _bbPet.stage || 'baby';
  const _petKey   = escHtml(_bbPet.pet_key || '');
  const _petIcon  = escHtml(_bbPetDef.icon || '🐾');
  if (petSpriteEl) petSpriteEl.innerHTML = (_petStage === 'egg')
    ? `<div class="bb-pet-emoji">${_petIcon}</div>`
    : `<img class="bb-pet-img" src="images/pet_${_petStage}_${_petKey}.webp" alt="${escHtml(_bbPetDef.name)}"
           onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
       <div class="bb-pet-emoji" style="display:none">${_petIcon}</div>`;

  /* ─ Pet info ─ */
  const petHpPct = Math.max(0, Math.round((_bbPetHp / _bbPetMaxHp) * 100));
  const petHpClr = petHpPct > 50 ? '#4ade80' : petHpPct > 25 ? '#facc15' : '#f87171';
  const statusTag = _bbPetStatus === 'quemado' ? '<span class="bb-status-tag bb-status-burn">🔥 Quemado</span>'
    : _bbPetStatus === 'paralizado' ? '<span class="bb-status-tag bb-status-para">⚡ Paralizado</span>' : '';
  const stageTag = (_bbPetAtkStage || _bbPetDefStage)
    ? `<span class="bb-status-tag">${_bbPetAtkStage ? '⚔️' + (_bbPetAtkStage > 0 ? '+' : '') + _bbPetAtkStage : ''} ${_bbPetDefStage ? '🛡️' + (_bbPetDefStage > 0 ? '+' : '') + _bbPetDefStage : ''}</span>`
    : '';
  if (petInfoEl) petInfoEl.innerHTML = `
    <div class="bb-entity-name">${escHtml(_bbPetDef.name)}${_bbPet.is_shiny ? ' ✨' : ''}</div>
    <div class="bb-level-chip">Nv.${_bbPet.pet_level || 1} · ${_bbPet.stage}</div>
    <div class="bb-hp-row">
      <span class="bb-hp-lbl">HP</span>
      <div class="bb-hp-track"><div id="bbPetHpFill" class="bb-hp-fill" style="width:${petHpPct}%;background:${petHpClr}"></div></div>
      <span class="bb-hp-val">${_bbPetHp}/${_bbPetMaxHp}</span>
    </div>
    <div class="bb-stat-row">⚔️ ATK ${petSt.atk.toFixed(1)} · 🛡️ DEF +${petSt.def.toFixed(0)}</div>
    <div class="bb-status-row">${statusTag}${stageTag}</div>`;

  /* ─ Selectora de mascota ─ */
  const availPets = typeof pets !== 'undefined' ? pets.filter(p => p.stage !== 'egg') : [];
  const petChipsHtml = availPets.length > 1
    ? `<div class="bb-pet-chips">${availPets.map(p => {
        const def   = PET_DEFS.find(d => d.key === p.pet_key);
        const rest  = _bbIsPetExhausted(p);
        return `<button class="bb-pet-chip${p.id === _bbPet.id ? ' active' : ''}${rest ? ' bb-pet-chip-resting' : ''}"
            onclick="_bbPickPet('${p.id}')" title="${rest ? 'Descansando' : ''}">
          <img src="images/pet_${p.stage}_${p.pet_key}.webp" alt="" class="bb-pet-chip-art"> <span>${escHtml(def?.name?.split(' ')[0] || p.pet_key)}${rest ? ' · descansando' : ''}</span>
        </button>`;
      }).join('')}</div>` : '';

  /* ─ Movimientos ─ */
  const moves = _bbMoves(_bbPet.pet_key);
  const movesHtml = moves.map((mv, i) => {
    const unlocked = _bbMoveUnlocked(mv, _bbPet);
    const ppLeft   = unlocked ? _bbMovePPLeft(_bbCycle, mv) : 0;
    const disabled = !unlocked || attacksLeft === 0 || ppLeft <= 0;
    const dmg      = unlocked ? _bbCalcDmg(mv) : '?';
    const elMult   = unlocked && typeof getElementMultiplier === 'function' ? getElementMultiplier(bossEl, mv.type) : 1;
    const elTag     = elMult > 1 ? ' <span style="color:#4ade80">▲</span>' : elMult < 1 ? ' <span style="color:#f87171">▼</span>' : '';
    const typeClass = 'bb-type-' + mv.type.toLowerCase().replace(/[^a-z]/g,'');
    return `<button class="bb-move-btn${unlocked ? '' : ' bb-move-locked'}${attacksLeft === 0 || ppLeft <= 0 ? ' bb-move-exhausted' : ''}${elMult > 1 ? ' bb-move-super' : elMult < 1 ? ' bb-move-weak' : ''}"
      onclick="${disabled ? '' : `executeBattleAttack(${i})`}"
      ${disabled ? 'disabled' : ''}
      title="${unlocked ? mv.name + ' · ~' + dmg + ' daño' + (elMult > 1 ? ' (súper efectivo)' : elMult < 1 ? ' (poco efectivo)' : '') : '🔒 Requiere Nv.' + mv.reqLevel}">
      <span class="bb-move-icon">${_bbMoveVisual(mv)}</span>
      <span class="bb-move-name">${mv.name}</span>
      <span class="bb-move-type ${typeClass}">${unlocked ? mv.type : '🔒 Nv.' + mv.reqLevel}</span>
      ${unlocked ? `<span class="bb-move-dmg">~${dmg}${elTag}</span><span class="bb-move-pp">PP ${ppLeft}/${_bbMoveMaxPP(mv)}</span>` : ''}
    </button>`;
  }).join('');

  const resetMsg = { daily:'Reinicia mañana', weekly:'Reinicia el lunes', monthly:'Reinicia el 1ro del mes' }[_bbCycle] || '';

  /* ─ Skill de héroe (1 uso por batalla, independiente de los ataques de mascota) ─ */
  const heroSkill = (typeof HERO_BATTLE_SKILLS !== 'undefined') ? HERO_BATTLE_SKILLS[hero?.hero_class] : null;
  const heroSkillHtml = heroSkill ? `
    <button class="bb-move-btn bb-hero-skill${_bbHeroSkillUsed ? ' bb-move-exhausted' : ''}"
      onclick="${_bbHeroSkillUsed ? '' : 'useHeroBattleSkill()'}" ${_bbHeroSkillUsed || _bbAnimating ? 'disabled' : ''}
      title="${heroSkill.desc}">
      <span class="bb-move-icon">${_bbHeroVisual(hero?.hero_class, heroSkill.icon)}</span>
      <span class="bb-move-name">${heroSkill.name}</span>
      <span class="bb-move-type">Habilidad de Héroe</span>
      <span class="bb-move-dmg">${_bbHeroSkillUsed ? 'Usada' : '1×/batalla'}</span>
    </button>` : '';

  /* ─ Poción de mascota usable en batalla (consume la de eclosión/evolución) ─ */
  const potionCount = getInvCount('pet_potion_' + _bbPet.pet_key);
  const potionHtml = `
    <button class="bb-move-btn bb-battle-potion${potionCount < 1 ? ' bb-move-exhausted' : ''}"
      onclick="${potionCount < 1 || _bbAnimating ? '' : 'useBattlePotion()'}" ${potionCount < 1 || _bbAnimating ? 'disabled' : ''}
      title="Cura 40% del HP máx de tu mascota. Usa la misma poción que necesitas para evolucionarla.">
      <img src="images/pet_pocion_${escHtml(_bbPet.pet_key)}.webp" class="bb-move-icon-img" alt=""
           onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
      <span class="bb-move-icon" style="display:none">🧪</span>
      <span class="bb-move-name">Poción de ${escHtml(_bbPetDef.name.split(' ')[0])}</span>
      <span class="bb-move-type">Cura 40% HP</span>
      <span class="bb-move-dmg">×${potionCount}</span>
    </button>`;

  if (movePanelEl) movePanelEl.innerHTML = `
    ${petChipsHtml}
    <div class="bb-actions-grid">${movesHtml}${heroSkillHtml}${potionHtml}</div>
    <div class="bb-attacks-counter${attacksLeft === 0 ? ' exhausted' : ''}">
      ⚔️ ${attacksLeft}/${_bbMaxAttacks()} energía de combate · <span>${resetMsg}</span>
    </div>`;
}

/* ── Usar poción de mascota en batalla (cura, cuesta 1 poción de evolución) ── */
async function useBattlePotion() {
  if (_bbAnimating || !_bbPet || !_bbPetDef) return;
  const potionCount = getInvCount('pet_potion_' + _bbPet.pet_key);
  if (potionCount < 1) return;
  if (!confirm(`¿Usar 1 Poción de ${_bbPetDef.name}? Ya no la tendrás para eclosionar o evolucionar mascotas.`)) return;

  _bbAnimating = true;
  const ok = await consumeInvItem('pet_potion_' + _bbPet.pet_key, 1);
  if (!ok) { _bbAnimating = false; return; }

  const healAmt = Math.round(_bbPetMaxHp * 0.40);
  _bbPetHp = Math.min(_bbPetMaxHp, _bbPetHp + healAmt);
  _bbBattleStats.healing += healAmt;
  _bbLogEvent('🧪', `${_bbPetDef.name} recupera ${healAmt} HP.`, 'heal');
  _bbCombatCallout(`+${healAmt} HP`, 'heal');
  const petSpriteEl = document.getElementById('bbPetSprite');
  const floater = document.getElementById('bbPetDmgFloat');
  if (floater && petSpriteEl) {
    floater.textContent = '+' + healAmt;
    floater.className   = 'bb-dmg-float bb-pet-side bb-dmg-active bb-heal-float';
    const rect = petSpriteEl.getBoundingClientRect();
    floater.style.left = (rect.left + rect.width  / 2 - 30) + 'px';
    floater.style.top  = (rect.top  + rect.height / 3)      + 'px';
    setTimeout(() => { floater.className = 'bb-dmg-float bb-pet-side'; }, 900);
  }
  toast('🧪', `+${healAmt} HP para ${_bbPetDef.name}.`);
  await _bbDelay(500);

  await _bbBossCounterAttack();
  _bbAnimating = false;

  if (_bbPetHp <= 0) {
    await _bbHandlePetFaint();
    return;
  }

  _bbTurn = 'player';
  _bbRender();
}

/* ── Ejecutar ataque ──────────────────────────────────────── */
async function executeBattleAttack(moveIdx) {
  if (_bbAnimating || !_bbCycle || !_bbPet || !_bbPetDef) return;

  const left = _bbLeft(_bbCycle);
  if (left <= 0) { toast('⏳', 'Ya usaste todos tus ataques de hoy para este jefe.'); return; }

  const moves = _bbMoves(_bbPet.pet_key);
  const move  = moves[moveIdx];
  if (!move || !_bbMoveUnlocked(move, _bbPet)) return;
  if (_bbMovePPLeft(_bbCycle, move) <= 0) { toast('🚫', `${move.name} sin usos restantes hoy.`); return; }

  _bbAnimating = true;
  _bbSetTurn('player', `${_bbPetDef.name} usa una habilidad`);

  /* ─ Parálisis: chance de fallar el turno por completo. Se pierde el turno
       (el jefe contraataca) pero NO se gasta ataque diario ni PP — fiel a Pokémon. ── */
  if (_bbPetStatus === 'paralizado' && Math.random() < 0.25) {
    toast('⚡', `¡${_bbPetDef.name} está paralizado y no pudo atacar!`, 1300);
    await _bbDelay(400);
    await _bbBossCounterAttack();
    _bbAnimating = false;
    if (_bbPetHp <= 0) { await _bbHandlePetFaint(); return; }
    _bbTurn = 'player';
    _bbRender();
    return;
  }

  _bbUse(_bbCycle);
  _bbUseMovePP(_bbCycle, move);

  /* ─ Especial (movimiento definitivo): también sube ATK propio 1 etapa ── */
  if (move.type === 'Especial') _bbRaiseAtkStage(1);

  const dmg = _bbApplyVariance(_bbCalcDmg(move));
  const wasCrit = _bbLastCrit;

  /* ─ Animación: pet lunge ─ */
  const petEl = document.querySelector('.bb-pet-emoji');
  if (petEl) { petEl.style.transition = 'transform .12s'; petEl.style.transform = 'translateX(24px) scale(1.15)'; }

  await _bbDelay(130);

  /* ─ Aplicar daño al boss ─ */
  const actualDmg = _damageBossCycle(_bbCycle, dmg);
  _bbBattleStats.damage += actualDmg;
  _bbBattleStats.hits += 1;
  if (wasCrit) _bbBattleStats.crits += 1;
  _bbLogEvent(move.icon, `${_bbPetDef.name} usó ${move.name}: -${actualDmg} HP`, wasCrit ? 'critical' : '');

  /* ─ Boss shake ─ */
  const bossSpriteEl = document.getElementById('bbBossSprite');
  if (bossSpriteEl) bossSpriteEl.classList.add('bb-hit');
  _bbBurstVfx(move.type.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, ''), bossSpriteEl);

  /* ─ Flotar número de daño ─ */
  _bbSpawnDmgFloat(actualDmg, bossSpriteEl);

  if (wasCrit) toast('💥', '¡Golpe crítico!', 1000);
  if (move.type === 'Especial') toast('⬆️', `¡${_bbPetDef.name} sube su ATAQUE!`, 1000);

  /* ─ Feedback de efectividad elemental ─ */
  const _elMult = typeof getElementMultiplier === 'function' ? getElementMultiplier(_bbBossElement(), move.type) : 1;
  if (wasCrit) _bbCombatCallout('¡GOLPE CRÍTICO!', 'critical');
  if (_elMult > 1) _bbCombatCallout('¡SÚPER EFECTIVO!', 'super');
  else if (_elMult < 1) _bbCombatCallout('RESISTIDO', 'weak');
  if (_elMult > 1)      toast('🔥', '¡Súper efectivo!', 1200);
  else if (_elMult < 1) toast('🛡️', 'Poco efectivo...', 1200);

  await _bbDelay(120);
  if (petEl) { petEl.style.transform = ''; }

  await _bbDelay(350);
  if (bossSpriteEl) bossSpriteEl.classList.remove('bb-hit');

  /* ─ Verificar derrota del boss ─ */
  const bossState = getMultiBossState();
  const boss = bossState[_bbCycle];
  if (boss?.defeated) {
    await _bbDelay(600);
    _bbAnimating = false;
    _bbShowVictory(boss);
    return;
  }

  /* ─ Counter-attack del boss ──────────────────────────────── */
  await _bbBossCounterAttack();

  await _bbDelay(180);
  _bbAnimating = false;

  if (_bbPetHp <= 0) {
    await _bbHandlePetFaint();
    return;
  }

  _bbTurn = 'player';
  _bbRender();
}

/* ── Contraataque del jefe — reusable (ataque de mascota y skill de héroe) ── */
async function _bbBossCounterAttack() {
  const boss = getMultiBossState()[_bbCycle];
  _bbSetTurn('boss', `${boss?.name || 'El jefe'} contraataca`);
  await _bbDelay(260);
  const bossSpriteEl2 = document.getElementById('bbBossSprite');
  if (bossSpriteEl2) {
    bossSpriteEl2.style.transition = 'transform .14s cubic-bezier(.4,0,.2,1)';
    bossSpriteEl2.style.transform  = 'translateX(-22px) scale(1.07)';
  }
  await _bbDelay(150);
  if (bossSpriteEl2) bossSpriteEl2.style.transform = '';

  const bossDmg      = _bbBossDmg();
  if (_bbLastCrit) toast('💥', '¡Golpe crítico del jefe!', 1000);
  // Bono de set Druida: mascota no cae en batalla durante 48h tras equipar
  const druidaShield = typeof isDruidaProtectionActive === 'function' && isDruidaProtectionActive();
  _bbPetHp            = Math.max(druidaShield ? 1 : 0, _bbPetHp - bossDmg);
  _bbLogEvent('☠️', `${boss?.name || 'El jefe'} contraataca: -${bossDmg} HP.`, 'enemy');
  _bbCombatCallout(`-${bossDmg} HP`, 'enemy');
  const petSpriteEl2  = document.getElementById('bbPetSprite');
  if (petSpriteEl2) petSpriteEl2.classList.add('bb-hit');
  _bbBurstVfx('enemy', petSpriteEl2);
  _bbSpawnPetDmgFloat(bossDmg, petSpriteEl2);

  await _bbDelay(380);
  if (petSpriteEl2) petSpriteEl2.classList.remove('bb-hit');

  if (_bbPetHp <= 0) return;

  /* ── Debuff de estadística: 15% chance de que el jefe baje ATK o DEF ── */
  if (Math.random() < 0.15) {
    const stat = Math.random() < 0.5 ? 'atk' : 'def';
    _bbLowerStat(stat, 1);
    toast('📉', `¡${boss?.name || 'El jefe'} debilitó tu ${stat === 'atk' ? 'ATAQUE' : 'DEFENSA'}!`, 1200);
  }

  /* ── Infligir estado alterado según elemento del jefe ── */
  const bossElNow = _bbBossElement();
  if (!_bbPetStatus && bossElNow === 'Fuego' && Math.random() < 0.25) {
    _bbPetStatus = 'quemado';
    toast('🔥', `${_bbPetDef?.name || 'Tu mascota'} quedó QUEMADA — pierde daño y HP cada turno.`, 1400);
  } else if (!_bbPetStatus && bossElNow === 'Eléctrico' && Math.random() < 0.25) {
    _bbPetStatus = 'paralizado';
    toast('⚡', `${_bbPetDef?.name || 'Tu mascota'} quedó PARALIZADA — puede fallar su turno.`, 1400);
  }

  /* ── DoT de quemadura ── */
  if (_bbPetStatus === 'quemado') {
    const burnDmg = Math.max(1, Math.round(_bbPetMaxHp * 0.06));
    _bbPetHp = Math.max(0, _bbPetHp - burnDmg);
    _bbSpawnPetDmgFloat(burnDmg, petSpriteEl2);
    toast('🔥', `Quemadura: -${burnDmg} HP`, 900);
    await _bbDelay(300);
  }
}

/* ── Habilidad de héroe en combate — 1 uso por batalla ────── */
async function useHeroBattleSkill() {
  if (_bbAnimating || _bbHeroSkillUsed || !_bbCycle || !hero) return;
  const skill = typeof HERO_BATTLE_SKILLS !== 'undefined' ? HERO_BATTLE_SKILLS[hero.hero_class] : null;
  if (!skill) return;

  _bbAnimating = true;
  _bbHeroSkillUsed = true;

  const bossSpriteEl = document.getElementById('bbBossSprite');
  const moves        = _bbPet ? _bbMoves(_bbPet.pet_key) : [];
  const baseMove      = moves[0];

  if (skill.type === 'heal') {
    /* Clérigo: restaura HP de la mascota, no ataca */
    const healAmt = Math.round(_bbPetMaxHp * skill.power);
    _bbPetHp = Math.min(_bbPetMaxHp, _bbPetHp + healAmt);
    _bbBattleStats.healing += healAmt;
    _bbLogEvent(skill.icon, `${skill.name} restaura ${healAmt} HP.`, 'heal');
    _bbCombatCallout(`+${healAmt} HP`, 'heal');
    const petSpriteEl = document.getElementById('bbPetSprite');
    const floater = document.getElementById('bbPetDmgFloat');
    if (floater && petSpriteEl) {
      floater.textContent = '+' + healAmt;
      floater.className   = 'bb-dmg-float bb-pet-side bb-dmg-active bb-heal-float';
      const rect = petSpriteEl.getBoundingClientRect();
      floater.style.left = (rect.left + rect.width  / 2 - 30) + 'px';
      floater.style.top  = (rect.top  + rect.height / 3)      + 'px';
      setTimeout(() => { floater.className = 'bb-dmg-float bb-pet-side'; }, 900);
    }
    toast(skill.icon, `${skill.name}: +${healAmt} HP a tu mascota.`);
    await _bbDelay(500);
  } else {
    let dmg;
    if (skill.type === 'crit' && baseMove) {
      const bestDmg = Math.max(...moves.filter(m => _bbMoveUnlocked(m, _bbPet)).map(m => _bbCalcDmg(m)));
      dmg = Math.round(bestDmg * skill.power);
    } else if (skill.type === 'double' && baseMove) {
      dmg = _bbCalcDmg(baseMove) * 2;
    } else {
      const bossState = getMultiBossState();
      const boss       = bossState[_bbCycle];
      const base       = boss ? Math.ceil(boss.maxHp * skill.power) : 1;
      const mult       = typeof getElementMultiplier === 'function' ? getElementMultiplier(_bbBossElement(), skill.type) : 1;
      dmg = Math.max(1, Math.round(base * mult));
    }

    const variedDmg = _bbApplyVariance(dmg);
    const wasCrit    = _bbLastCrit;
    const actualDmg = _damageBossCycle(_bbCycle, variedDmg);
    _bbBattleStats.damage += actualDmg;
    _bbBattleStats.hits += 1;
    if (wasCrit) _bbBattleStats.crits += 1;
    _bbLogEvent(skill.icon, `${skill.name}: -${actualDmg} HP.`, wasCrit ? 'critical' : '');
    if (wasCrit) _bbCombatCallout('¡CRÍTICO HEROICO!', 'critical');
    if (bossSpriteEl) bossSpriteEl.classList.add('bb-hit');
    _bbSpawnDmgFloat(actualDmg, bossSpriteEl);
    toast(skill.icon, `${skill.name}! ${actualDmg} de daño.${wasCrit ? ' 💥 ¡Crítico!' : ''}`);

    if (skill.type === 'Normal' && hero.hero_class === 'fundador' && typeof addGold === 'function') {
      const bonusGold = Math.round(actualDmg * 0.5);
      addGold(bonusGold);
      toast('💰', `Visión Estratégica convierte daño en +${bonusGold} 🪙`);
    }

    await _bbDelay(350);
    if (bossSpriteEl) bossSpriteEl.classList.remove('bb-hit');
  }

  const bossState = getMultiBossState();
  const boss = bossState[_bbCycle];
  if (boss?.defeated) {
    await _bbDelay(600);
    _bbAnimating = false;
    _bbShowVictory(boss);
    return;
  }

  await _bbBossCounterAttack();
  _bbAnimating = false;

  if (_bbPetHp <= 0) {
    await _bbHandlePetFaint();
    return;
  }

  _bbTurn = 'player';
  _bbRender();
}

function _bbDelay(ms) { return new Promise(r => setTimeout(r, Math.max(40, ms / _bbSpeed))); }

function _bbSpawnDmgFloat(dmg, anchorEl) {
  const floater = document.getElementById('bbDmgFloat');
  if (!floater) return;
  floater.textContent = '-' + dmg;
  floater.className   = 'bb-dmg-float bb-dmg-active';
  if (anchorEl) {
    const rect = anchorEl.getBoundingClientRect();
    floater.style.left = (rect.left + rect.width  / 2 - 30) + 'px';
    floater.style.top  = (rect.top  + rect.height / 3)      + 'px';
  }
  setTimeout(() => { floater.className = 'bb-dmg-float'; }, 900);
}

function _bbSpawnPetDmgFloat(dmg, anchorEl) {
  const floater = document.getElementById('bbPetDmgFloat');
  if (!floater) return;
  floater.textContent = '-' + dmg;
  floater.className   = 'bb-dmg-float bb-pet-side bb-dmg-active';
  if (anchorEl) {
    const rect = anchorEl.getBoundingClientRect();
    floater.style.left = (rect.left + rect.width  / 2 - 30) + 'px';
    floater.style.top  = (rect.top  + rect.height / 3)      + 'px';
  }
  setTimeout(() => { floater.className = 'bb-dmg-float bb-pet-side'; }, 900);
}

/* ── Pantalla de victoria con GSAP ───────────────────────── */
function _bbShowVictory(boss) {
  const screen = document.getElementById('bbVictoryScreen');
  if (!screen) { closeBossBattle(); return; }

  const reward = (typeof BOSS_DEFEAT_REWARDS !== 'undefined' && BOSS_DEFEAT_REWARDS[boss.rarity]) || { gold:50, xp:100, runeChance:0 };
  const runeWon = Math.random() < (reward.runeChance || 0);

  document.getElementById('bbVictoryBossName').textContent = boss.name;
  document.getElementById('bbVictoryRewards').innerHTML = `
    <div class="bb-vr-item bb-vr-gold">🪙 +${reward.gold} Oro</div>
    <div class="bb-vr-item bb-vr-xp">⭐ +${reward.xp} XP</div>
    ${runeWon ? '<div class="bb-vr-item bb-vr-rune">💎 ¡Fragmento de Runa!</div>' : ''}`;

  const summary = document.getElementById('bbVictorySummary');
  if (summary) summary.innerHTML = `
    <span>⚔️ ${_bbBattleStats.hits} golpes</span>
    <span>💥 ${_bbBattleStats.damage} daño</span>
    <span>✦ ${_bbBattleStats.crits} críticos</span>
    ${_bbBattleStats.healing ? `<span>🧪 ${_bbBattleStats.healing} curado</span>` : ''}`;
  screen.style.display = 'flex';

  /* ── Partículas de fondo ─ */
  const sparks = document.getElementById('bbVictorySparks');
  if (sparks) {
    sparks.innerHTML = '';
    const colors = ['#facc15','#fb923c','#4ade80','#c084fc','#60a5fa'];
    for (let i = 0; i < 22; i++) {
      const s = document.createElement('span');
      s.className = 'bb-spark';
      s.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;background:${colors[i%colors.length]};animation-delay:${(Math.random()*0.8).toFixed(2)}s;animation-duration:${(1+Math.random()*1.2).toFixed(2)}s`;
      sparks.appendChild(s);
    }
  }

  if (typeof gsap === 'undefined') return;

  const title   = screen.querySelector('.bb-victory-title');
  const bname   = screen.querySelector('.bb-victory-boss-name');
  const items   = screen.querySelectorAll('.bb-vr-item');
  const btn     = screen.querySelector('.bb-victory-btn');
  const chest   = screen.querySelector('.bb-victory-chest');

  gsap.set([title, bname, items, btn], { opacity: 0, y: 24 });
  gsap.set(chest, { opacity: 0, scale: .45, rotation: -10 });
  gsap.set(screen, { opacity: 0 });
  gsap.to(screen, { opacity: 1, duration: 0.35, ease: 'power2.out' });

  const tl = gsap.timeline({ delay: 0.25 });
  tl.to(chest, { opacity: 1, scale: 1.18, rotation: 0, duration: 0.42, ease: 'back.out(2.2)' })
    .to(title, { opacity: 1, y: 0, scale: 1.18, duration: 0.45, ease: 'back.out(1.9)' }, '-=0.14')
    .to(title,  { scale: 1, duration: 0.28, ease: 'power2.out' }, '+=0.05')
    .to(bname,  { opacity: 1, y: 0, duration: 0.3,  ease: 'power2.out' }, '-=0.1')
    .to(items,  { opacity: 1, y: 0, duration: 0.25, stagger: 0.11, ease: 'power2.out' }, '-=0.05')
    .to(btn,    { opacity: 1, y: 0, duration: 0.3,  ease: 'power2.out' }, '-=0.05');
}

document.addEventListener('keydown', event => {
  const overlay = document.getElementById('bossBattleOverlay');
  if (!overlay?.classList.contains('bb-open') || _bbAnimating) return;
  if (/INPUT|TEXTAREA|SELECT/.test(event.target?.tagName || '')) return;
  const index = Number(event.key) - 1;
  if (index >= 0 && index < 4) {
    event.preventDefault();
    executeBattleAttack(index);
  }
});
