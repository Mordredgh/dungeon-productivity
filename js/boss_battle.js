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
    { id:'zarpazo',    name:'Zarpazo',            icon:'🌿', power:1.0, type:'Normal',    reqLevel:0  },
    { id:'mordida',    name:'Mordida Silvestre',   icon:'🦷', power:1.5, type:'Normal',    reqLevel:0  },
    { id:'torbellino', name:'Torbellino Verde',    icon:'🌪️', power:2.5, type:'Elemental', reqLevel:5  },
    { id:'furia-nat',  name:'Furia Natural',       icon:'🌳', power:4.0, type:'Especial',  reqLevel:15 },
  ],
  'pantera-sombra': [
    { id:'garra',    name:'Garra Oscura',     icon:'🌑', power:1.0, type:'Normal',   reqLevel:0  },
    { id:'paso',     name:'Paso Sombra',      icon:'💨', power:1.5, type:'Normal',   reqLevel:0  },
    { id:'mirada',   name:'Mirada Abisal',    icon:'👁️', power:2.5, type:'Oscuro',   reqLevel:5  },
    { id:'eclipse',  name:'Eclipse Total',    icon:'🌑', power:4.0, type:'Especial', reqLevel:15 },
  ],
  'lobo-tormenta': [
    { id:'mordisco', name:'Mordisco Eléctrico', icon:'⚡', power:1.0, type:'Normal',    reqLevel:0  },
    { id:'aullido',  name:'Aullido de Trueno',  icon:'🌩️', power:1.5, type:'Eléctrico', reqLevel:0  },
    { id:'rayo',     name:'Rayo Ártico',         icon:'❄️', power:2.5, type:'Eléctrico', reqLevel:5  },
    { id:'tormenta', name:'Tormenta de Acero',   icon:'🌀', power:4.0, type:'Especial',  reqLevel:15 },
  ],
  'grifo': [
    { id:'picotazo', name:'Picotazo Arcano',   icon:'🦅', power:1.0, type:'Normal',   reqLevel:0  },
    { id:'garra-g',  name:'Garra Épica',       icon:'✨', power:1.5, type:'Normal',   reqLevel:0  },
    { id:'viento',   name:'Ráfaga de Viento',  icon:'💨', power:2.5, type:'Aéreo',    reqLevel:5  },
    { id:'divino',   name:'Juicio Divino',     icon:'⚡', power:4.0, type:'Especial', reqLevel:15 },
  ],
  'dragon-fuego': [
    { id:'zarpa-d',  name:'Zarpa de Fuego',    icon:'🔥', power:1.0, type:'Normal',  reqLevel:0  },
    { id:'mordida-d',name:'Mordida Llameante', icon:'🐉', power:1.5, type:'Fuego',   reqLevel:0  },
    { id:'llamarada',name:'Llamarada',         icon:'🌋', power:2.5, type:'Fuego',   reqLevel:5  },
    { id:'inferno',  name:'Infierno Eterno',   icon:'☄️', power:4.0, type:'Especial',reqLevel:15 },
  ],
  'fenix-mitico': [
    { id:'pluma',    name:'Pluma de Fuego',    icon:'🔥', power:1.0, type:'Normal',   reqLevel:0  },
    { id:'llama-f',  name:'Llama Purificadora',icon:'✨', power:1.5, type:'Normal',   reqLevel:0  },
    { id:'resurgir', name:'Resurgir',          icon:'💫', power:2.5, type:'Mágico',   reqLevel:5  },
    { id:'sol-eterno',name:'Sol Eterno',       icon:'☀️', power:4.0, type:'Especial', reqLevel:15 },
  ],
  'rey-tempestad': [
    { id:'corona',   name:'Corona de Truenos', icon:'👑', power:1.0, type:'Normal',    reqLevel:0  },
    { id:'decreto',  name:'Decreto Imperial',  icon:'⚡', power:1.5, type:'Eléctrico', reqLevel:0  },
    { id:'tifon',    name:'Tifón Real',        icon:'🌪️', power:2.5, type:'Cataclismo',reqLevel:5  },
    { id:'apocalipsis',name:'Apocalipsis',     icon:'🌩️', power:4.0, type:'Especial',  reqLevel:15 },
  ],
};

const _BB_FALLBACK_MOVES = [
  { id:'ataque',    name:'Ataque',         icon:'⚔️', power:1.0, type:'Normal',   reqLevel:0  },
  { id:'embestida', name:'Embestida',      icon:'💥', power:1.5, type:'Normal',   reqLevel:0  },
  { id:'rafaga',    name:'Ráfaga Mágica',  icon:'✨', power:2.5, type:'Mágico',   reqLevel:5  },
  { id:'devastar',  name:'Devastar',       icon:'🔥', power:4.0, type:'Especial', reqLevel:15 },
];

function _bbMoves(petKey) { return PET_MOVES[petKey] || _BB_FALLBACK_MOVES; }

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

/* ── Ataques: clave por ciclo+periodo (no solo fecha) ─────── */
/* Esto garantiza 5 ataques frescos cuando se genera un boss nuevo */
function _bbAttackKey(cycle) {
  const period = typeof _bossPeriodKey === 'function' ? _bossPeriodKey(cycle) : new Date().toISOString().split('T')[0];
  return 'dungeon-bb-atk-' + cycle + '-' + period;
}
function _bbMaxAttacks() { return 5 + (typeof getMasteryBonus === 'function' ? getMasteryBonus('voluntad') : 0); }
function _bbLeft(cycle) { try { return Math.max(0, _bbMaxAttacks() - parseInt(localStorage.getItem(_bbAttackKey(cycle)) || '0', 10)); } catch { return _bbMaxAttacks(); } }
function _bbUse(cycle)  { try { const k = _bbAttackKey(cycle); localStorage.setItem(k, String((parseInt(localStorage.getItem(k)||'0',10))+1)); } catch {} }

/* ── Nivel del jefe — escala con el nivel del héroe ───────── */
function _bbBossLevel() { return hero?._level || 1; }

/* ── Daño del boss al contra-atacar (estilo Pokémon: nivel + variación) ── */
function _bbBossDmg() {
  const state = getMultiBossState();
  const boss  = state[_bbCycle];
  if (!boss || !_bbPetDef) return 3;
  const petDef    = getPetStatAtLevel(_bbPetDef, _bbPet?.pet_level || 1).def || 0;
  const rarMult   = { comun:0.4, raro:0.7, epico:1.1, legendario:1.5, mitico:2.0, cataclismo:2.8 }[boss.rarity] || 1;
  const levelTerm = (2 * _bbBossLevel() / 5 + 2);
  const random    = 0.85 + Math.random() * 0.30; // 0.85–1.15, variación real por golpe
  const base      = levelTerm * rarMult * 1.2;
  return Math.max(1, Math.round(base * random) - Math.floor(petDef * 0.3));
}

/* ── Daño solo al ciclo objetivo ──────────────────────────── */
function _damageBossCycle(cycle, baseDmg) {
  const state = getMultiBossState();
  const b = state[cycle];
  if (!b || b.defeated) return 0;

  const weather  = typeof getTodayWeather === 'function' ? getTodayWeather() : '';
  const petMult  = typeof getPetEffect    === 'function' ? (getPetEffect('boss_dmg')   || 1) : 1;
  const runeMult = typeof getRuneBonus    === 'function' ? (1 + getRuneBonus('boss_dmg'))     : 1;
  const finalDmg = Math.max(1, Math.round((weather === 'storm' ? baseDmg * 2 : baseDmg) * petMult * runeMult));

  b.hp = Math.max(0, b.hp - finalDmg);

  if (b.hp === 0) {
    b.defeated = true;
    const reward = (typeof BOSS_DEFEAT_REWARDS !== 'undefined' && BOSS_DEFEAT_REWARDS[b.rarity]) || { gold:50, xp:100 };
    setTimeout(async () => {
      if (typeof addGold        === 'function') addGold(reward.gold);
      if (typeof addXP          === 'function') await addXP(reward.xp, 'main', null);
      if (typeof toast          === 'function') toast('🏆', `¡${b.name} DERROTADO! +${reward.gold}🪙 +${reward.xp} XP`);
      if (typeof dungeonPush    === 'function') dungeonPush('🏆 ¡Jefe Derrotado!', `${b.name} venció. +${reward.gold}🪙 +${reward.xp} XP`);
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
  const bonus  = Math.floor(petSt.atk * 2);
  const mult   = typeof getElementMultiplier === 'function' ? getElementMultiplier(_bbBossElement(), move.type) : 1;
  const masteryMult = 1 + (typeof getMasteryBonus === 'function' ? getMasteryBonus('fuerza_bruta') : 0);
  return Math.max(1, Math.round((base + bonus) * mult * masteryMult));
}

/* Variación aleatoria estilo Pokémon (0.85–1.15) — aplicar solo al golpear de verdad */
function _bbApplyVariance(dmg) {
  return Math.max(1, Math.round(dmg * (0.85 + Math.random() * 0.30)));
}

/* ── Abrir pantalla de batalla ────────────────────────────── */
function openBossBattle(cycle) {
  const bossState = getMultiBossState();
  const boss = bossState[cycle];
  if (!boss) return;
  if (boss.defeated) { toast('🏆', 'Este jefe ya fue derrotado. ¡Espera al siguiente ciclo!'); return; }

  _bbCycle   = cycle;
  _bbPet     = (typeof pets !== 'undefined' && pets.find(p => p.is_active && p.stage !== 'egg'))
               || (typeof pets !== 'undefined' && pets.find(p => p.stage !== 'egg'))
               || null;
  _bbPetDef  = _bbPet ? PET_DEFS.find(d => d.key === _bbPet.pet_key) : null;
  _bbAnimating = false;
  _bbHeroSkillUsed = false;

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
  _bbPet    = p;
  _bbPetDef = PET_DEFS.find(d => d.key === p.pet_key) || null;
  _bbRender();
}

/* ── Renderizar pantalla ──────────────────────────────────── */
function _bbRender() {
  if (!_bbCycle) return;
  const bossState = getMultiBossState();
  const boss      = bossState[_bbCycle];
  if (!boss) return;

  const hpPct = Math.max(0, Math.round((boss.hp / boss.maxHp) * 100));
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
  if (bgBoss) bgBoss.style.backgroundImage = `url('images/boss-bg-${boss.rarity}-${variant}.png')`;

  /* ─ Cycle badge ─ */
  const badge = document.getElementById('bbCycleBadge');
  if (badge) { badge.textContent = cycleLabel; badge.style.background = rarClr + '22'; badge.style.color = rarClr; }

  /* ─ Boss info ─ */
  const bossEl    = _bbBossElement();
  const elemIcon  = { Fuego:'🔥', Elemental:'🌿', Eléctrico:'⚡', Aéreo:'💨', Oscuro:'🌑', Mágico:'✨', Cataclismo:'🌀', Normal:'⚪' }[bossEl] || '⚪';
  const bossInfoEl = document.getElementById('bbBossInfo');
  if (bossInfoEl) bossInfoEl.innerHTML = `
    <div class="bb-entity-name" style="color:${rarClr}">${escHtml(boss.name)} <span style="font-size:11px;color:var(--text3)">Nv.${_bbBossLevel()}</span></div>
    <div class="bb-rarity-chip" style="color:${rarClr};border-color:${rarClr}44">${rarLbl}</div>
    <div class="bb-rarity-chip" style="margin-left:4px">${elemIcon} ${escHtml(bossEl)}</div>
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
    ? `<img class="bb-boss-img" src="images/boss_${escHtml(boss.key)}.png" alt="${escHtml(boss.name)}"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="bb-sprite-emoji">${bossEmoji}</div>`
    : `<div class="bb-sprite-emoji">${bossEmoji}</div>`;

  /* ─ Pet side ─ */
  const petSpriteEl = document.getElementById('bbPetSprite');
  const petInfoEl   = document.getElementById('bbPetInfo');
  const movePanelEl = document.getElementById('bbMovePanel');

  if (!_bbPet || !_bbPetDef) {
    if (petSpriteEl) petSpriteEl.innerHTML = `<div class="bb-sprite-emoji" style="font-size:60px">🥚</div>`;
    if (petInfoEl)   petInfoEl.innerHTML   = '<div class="bb-entity-name" style="color:var(--text3)">Sin mascota</div>';
    if (movePanelEl) movePanelEl.innerHTML = `
      <div class="bb-no-pet-msg">Necesitas una mascota para batallar.
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
    : `<img class="bb-pet-img" src="images/pet_${_petStage}_${_petKey}.png" alt="${escHtml(_bbPetDef.name)}"
           onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
       <div class="bb-pet-emoji" style="display:none">${_petIcon}</div>`;

  /* ─ Pet info ─ */
  const petHpPct = Math.max(0, Math.round((_bbPetHp / _bbPetMaxHp) * 100));
  const petHpClr = petHpPct > 50 ? '#4ade80' : petHpPct > 25 ? '#facc15' : '#f87171';
  if (petInfoEl) petInfoEl.innerHTML = `
    <div class="bb-entity-name">${escHtml(_bbPetDef.name)}</div>
    <div class="bb-level-chip">Nv.${_bbPet.pet_level || 1} · ${_bbPet.stage}</div>
    <div class="bb-hp-row">
      <span class="bb-hp-lbl">HP</span>
      <div class="bb-hp-track"><div id="bbPetHpFill" class="bb-hp-fill" style="width:${petHpPct}%;background:${petHpClr}"></div></div>
      <span class="bb-hp-val">${_bbPetHp}/${_bbPetMaxHp}</span>
    </div>
    <div class="bb-stat-row">⚔️ ATK ${petSt.atk.toFixed(1)} · 🛡️ DEF +${petSt.def.toFixed(0)}</div>`;

  /* ─ Selectora de mascota ─ */
  const availPets = typeof pets !== 'undefined' ? pets.filter(p => p.stage !== 'egg') : [];
  const petChipsHtml = availPets.length > 1
    ? `<div class="bb-pet-chips">${availPets.map(p => {
        const def = PET_DEFS.find(d => d.key === p.pet_key);
        return `<button class="bb-pet-chip${p.id === _bbPet.id ? ' active' : ''}" onclick="_bbPickPet('${p.id}')">
          ${def?.icon || '🐾'} <span>${escHtml(def?.name?.split(' ')[0] || p.pet_key)}</span>
        </button>`;
      }).join('')}</div>` : '';

  /* ─ Movimientos ─ */
  const moves = _bbMoves(_bbPet.pet_key);
  const movesHtml = moves.map((mv, i) => {
    const unlocked = _bbMoveUnlocked(mv, _bbPet);
    const disabled = !unlocked || attacksLeft === 0;
    const dmg      = unlocked ? _bbCalcDmg(mv) : '?';
    const elMult   = unlocked && typeof getElementMultiplier === 'function' ? getElementMultiplier(bossEl, mv.type) : 1;
    const elTag     = elMult > 1 ? ' <span style="color:#4ade80">▲</span>' : elMult < 1 ? ' <span style="color:#f87171">▼</span>' : '';
    const typeClass = 'bb-type-' + mv.type.toLowerCase().replace(/[^a-z]/g,'');
    return `<button class="bb-move-btn${unlocked ? '' : ' bb-move-locked'}${attacksLeft === 0 ? ' bb-move-exhausted' : ''}"
      onclick="${disabled ? '' : `executeBattleAttack(${i})`}"
      ${disabled ? 'disabled' : ''}
      title="${unlocked ? mv.name + ' · ~' + dmg + ' daño' + (elMult > 1 ? ' (súper efectivo)' : elMult < 1 ? ' (poco efectivo)' : '') : '🔒 Requiere Nv.' + mv.reqLevel}">
      <span class="bb-move-icon">${mv.icon}</span>
      <span class="bb-move-name">${mv.name}</span>
      <span class="bb-move-type ${typeClass}">${unlocked ? mv.type : '🔒 Nv.' + mv.reqLevel}</span>
      ${unlocked ? `<span class="bb-move-dmg">~${dmg}${elTag}</span>` : ''}
    </button>`;
  }).join('');

  const resetMsg = { daily:'Reinicia mañana', weekly:'Reinicia el lunes', monthly:'Reinicia el 1ro del mes' }[_bbCycle] || '';

  /* ─ Skill de héroe (1 uso por batalla, independiente de los ataques de mascota) ─ */
  const heroSkill = (typeof HERO_BATTLE_SKILLS !== 'undefined') ? HERO_BATTLE_SKILLS[hero?.hero_class] : null;
  const heroSkillHtml = heroSkill ? `
    <button class="bb-move-btn bb-hero-skill${_bbHeroSkillUsed ? ' bb-move-exhausted' : ''}"
      onclick="${_bbHeroSkillUsed ? '' : 'useHeroBattleSkill()'}" ${_bbHeroSkillUsed || _bbAnimating ? 'disabled' : ''}
      title="${heroSkill.desc}">
      <span class="bb-move-icon">${heroSkill.icon}</span>
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
      <img src="images/pet_pocion_${escHtml(_bbPet.pet_key)}.png" class="bb-move-icon-img" alt=""
           onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
      <span class="bb-move-icon" style="display:none">🧪</span>
      <span class="bb-move-name">Poción de ${escHtml(_bbPetDef.name.split(' ')[0])}</span>
      <span class="bb-move-type">Cura 40% HP</span>
      <span class="bb-move-dmg">×${potionCount}</span>
    </button>`;

  if (movePanelEl) movePanelEl.innerHTML = `
    ${petChipsHtml}
    <div class="bb-moves-grid">${movesHtml}</div>
    ${heroSkillHtml}
    ${potionHtml}
    <div class="bb-attacks-counter${attacksLeft === 0 ? ' exhausted' : ''}">
      ⚔️ ${attacksLeft}/${_bbMaxAttacks()} ataques hoy · <span>${resetMsg}</span>
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
    toast('💀', `${_bbPetDef?.name || 'Tu mascota'} se debilitó en batalla...`);
    await _bbDelay(800);
    closeBossBattle();
    return;
  }

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

  _bbAnimating = true;

  const dmg = _bbApplyVariance(_bbCalcDmg(move));
  _bbUse(_bbCycle);

  /* ─ Animación: pet lunge ─ */
  const petEl = document.querySelector('.bb-pet-emoji');
  if (petEl) { petEl.style.transition = 'transform .12s'; petEl.style.transform = 'translateX(24px) scale(1.15)'; }

  await _bbDelay(130);

  /* ─ Aplicar daño al boss ─ */
  const actualDmg = _damageBossCycle(_bbCycle, dmg);

  /* ─ Boss shake ─ */
  const bossSpriteEl = document.getElementById('bbBossSprite');
  if (bossSpriteEl) bossSpriteEl.classList.add('bb-hit');

  /* ─ Flotar número de daño ─ */
  _bbSpawnDmgFloat(actualDmg, bossSpriteEl);

  /* ─ Feedback de efectividad elemental ─ */
  const _elMult = typeof getElementMultiplier === 'function' ? getElementMultiplier(_bbBossElement(), move.type) : 1;
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
    toast('💀', `${_bbPetDef?.name || 'Tu mascota'} se debilitó en batalla...`);
    await _bbDelay(800);
    closeBossBattle();
    return;
  }

  _bbRender();
}

/* ── Contraataque del jefe — reusable (ataque de mascota y skill de héroe) ── */
async function _bbBossCounterAttack() {
  await _bbDelay(260);
  const bossSpriteEl2 = document.getElementById('bbBossSprite');
  if (bossSpriteEl2) {
    bossSpriteEl2.style.transition = 'transform .14s cubic-bezier(.4,0,.2,1)';
    bossSpriteEl2.style.transform  = 'translateX(-22px) scale(1.07)';
  }
  await _bbDelay(150);
  if (bossSpriteEl2) bossSpriteEl2.style.transform = '';

  const bossDmg      = _bbBossDmg();
  // Bono de set Druida: mascota no cae en batalla durante 48h tras equipar
  const druidaShield = typeof isDruidaProtectionActive === 'function' && isDruidaProtectionActive();
  _bbPetHp            = Math.max(druidaShield ? 1 : 0, _bbPetHp - bossDmg);
  const petSpriteEl2  = document.getElementById('bbPetSprite');
  if (petSpriteEl2) petSpriteEl2.classList.add('bb-hit');
  _bbSpawnPetDmgFloat(bossDmg, petSpriteEl2);

  await _bbDelay(380);
  if (petSpriteEl2) petSpriteEl2.classList.remove('bb-hit');
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

    const actualDmg = _damageBossCycle(_bbCycle, _bbApplyVariance(dmg));
    if (bossSpriteEl) bossSpriteEl.classList.add('bb-hit');
    _bbSpawnDmgFloat(actualDmg, bossSpriteEl);
    toast(skill.icon, `${skill.name}! ${actualDmg} de daño.`);

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
    toast('💀', `${_bbPetDef?.name || 'Tu mascota'} se debilitó en batalla...`);
    await _bbDelay(800);
    closeBossBattle();
    return;
  }

  _bbRender();
}

function _bbDelay(ms) { return new Promise(r => setTimeout(r, ms)); }

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

  gsap.set([title, bname, items, btn], { opacity: 0, y: 24 });
  gsap.set(screen, { opacity: 0 });
  gsap.to(screen, { opacity: 1, duration: 0.35, ease: 'power2.out' });

  const tl = gsap.timeline({ delay: 0.25 });
  tl.to(title, { opacity: 1, y: 0, scale: 1.18, duration: 0.45, ease: 'back.out(1.9)' })
    .to(title,  { scale: 1, duration: 0.28, ease: 'power2.out' }, '+=0.05')
    .to(bname,  { opacity: 1, y: 0, duration: 0.3,  ease: 'power2.out' }, '-=0.1')
    .to(items,  { opacity: 1, y: 0, duration: 0.25, stagger: 0.11, ease: 'power2.out' }, '-=0.05')
    .to(btn,    { opacity: 1, y: 0, duration: 0.3,  ease: 'power2.out' }, '-=0.05');
}
