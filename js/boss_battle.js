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
let _bbCycle     = null;
let _bbPet       = null;
let _bbPetDef    = null;
let _bbAnimating = false;

/* ── Límite de 5 ataques por día por ciclo ────────────────── */
function _bbStorageKey() { return 'dungeon-bb-' + new Date().toISOString().split('T')[0]; }
function _bbGetUsed()    { try { return JSON.parse(localStorage.getItem(_bbStorageKey()) || '{}'); } catch { return {}; } }
function _bbSetUsed(d)   { localStorage.setItem(_bbStorageKey(), JSON.stringify(d)); }
function _bbLeft(cycle)  { return Math.max(0, 5 - (_bbGetUsed()[cycle] || 0)); }
function _bbUse(cycle)   { const d = _bbGetUsed(); d[cycle] = (d[cycle] || 0) + 1; _bbSetUsed(d); }

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

/* ── Calcular daño de un movimiento ───────────────────────── */
function _bbCalcDmg(move) {
  const bossState = getMultiBossState();
  const boss      = bossState[_bbCycle];
  if (!boss || !_bbPetDef) return 1;
  const petSt  = getPetStatAtLevel(_bbPetDef, _bbPet.pet_level || 1);
  const base   = Math.ceil(boss.maxHp * 0.04 * move.power);
  const bonus  = Math.floor(petSt.atk * 2);
  return Math.max(1, base + bonus);
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

  _bbRender();

  const overlay = document.getElementById('bossBattleOverlay');
  if (overlay) {
    overlay.classList.add('bb-open');
    document.body.style.overflow = 'hidden';
    const arena = overlay.querySelector('.bb-arena');
    if (arena) {
      arena.classList.add('bb-entering');
      setTimeout(() => arena.classList.remove('bb-entering'), 700);
    }
  }
}

function closeBossBattle() {
  const overlay = document.getElementById('bossBattleOverlay');
  if (overlay) overlay.classList.remove('bb-open');
  document.body.style.overflow = '';
  _bbCycle = null;
  _bbAnimating = false;
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
  const bossInfoEl = document.getElementById('bbBossInfo');
  if (bossInfoEl) bossInfoEl.innerHTML = `
    <div class="bb-entity-name" style="color:${rarClr}">${escHtml(boss.name)}</div>
    <div class="bb-rarity-chip" style="color:${rarClr};border-color:${rarClr}44">${rarLbl}</div>
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
  if (petSpriteEl) petSpriteEl.innerHTML = `<div class="bb-sprite-emoji bb-pet-emoji">${_bbPetDef.icon}</div>`;

  /* ─ Pet info ─ */
  if (petInfoEl) petInfoEl.innerHTML = `
    <div class="bb-entity-name">${escHtml(_bbPetDef.name)}</div>
    <div class="bb-level-chip">Nv.${_bbPet.pet_level || 1} · ${_bbPet.stage}</div>
    <div class="bb-hp-row">
      <span class="bb-hp-lbl">HP</span>
      <div class="bb-hp-track"><div class="bb-hp-fill" style="width:100%;background:#4ade80"></div></div>
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
    const typeClass = 'bb-type-' + mv.type.toLowerCase().replace(/[^a-z]/g,'');
    return `<button class="bb-move-btn${unlocked ? '' : ' bb-move-locked'}${attacksLeft === 0 ? ' bb-move-exhausted' : ''}"
      onclick="${disabled ? '' : `executeBattleAttack(${i})`}"
      ${disabled ? 'disabled' : ''}
      title="${unlocked ? mv.name + ' · ~' + dmg + ' daño' : '🔒 Requiere Nv.' + mv.reqLevel}">
      <span class="bb-move-icon">${mv.icon}</span>
      <span class="bb-move-name">${mv.name}</span>
      <span class="bb-move-type ${typeClass}">${unlocked ? mv.type : '🔒 Nv.' + mv.reqLevel}</span>
      ${unlocked ? `<span class="bb-move-dmg">~${dmg}</span>` : ''}
    </button>`;
  }).join('');

  const resetMsg = { daily:'Reinicia mañana', weekly:'Reinicia el lunes', monthly:'Reinicia el 1ro del mes' }[_bbCycle] || '';

  if (movePanelEl) movePanelEl.innerHTML = `
    ${petChipsHtml}
    <div class="bb-moves-grid">${movesHtml}</div>
    <div class="bb-attacks-counter${attacksLeft === 0 ? ' exhausted' : ''}">
      ⚔️ ${attacksLeft}/5 ataques hoy · <span>${resetMsg}</span>
    </div>`;
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

  const dmg = _bbCalcDmg(move);
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

  await _bbDelay(120);
  if (petEl) { petEl.style.transform = ''; }

  await _bbDelay(350);
  if (bossSpriteEl) bossSpriteEl.classList.remove('bb-hit');

  await _bbDelay(180);
  _bbAnimating = false;

  /* ─ Verificar derrota ─ */
  const bossState = getMultiBossState();
  const boss = bossState[_bbCycle];
  if (boss?.defeated) {
    await _bbDelay(700);
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
