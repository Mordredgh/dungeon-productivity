'use strict';

let pets = [];

async function loadPets() {
  if (!hero) return;
  const { data } = await db.from('dungeon_pets').select('*').eq('hero_id', hero.id);
  pets = data || [];
}

function _petDef(key) { return PET_DEFS.find(p => p.key === key); }

/* XP necesaria para subir al siguiente nivel de montura (Nv.1-50) */
function _petXPForNextLevel(level) {
  if (level <= 10) return 100;
  if (level <= 25) return 200;
  return 400;
}

/* XP necesaria para subir de nivel bebé (Nv.1-15, siempre 150) */
const PET_BABY_XP_PER_LEVEL = 150;

/* Dar XP a la mascota bebé activa (llamado desde boss defeat y potiones) */
async function addActivePetXP(xp) {
  const active = pets.find(p => p.is_active && p.stage === 'baby');
  if (!active) return;
  const def = _petDef(active.pet_key);
  if (!def) return;
  const curLvl = active.pet_level || 1;
  if (curLvl >= 15) return;
  let newXP  = (active.pet_xp || 0) + xp;
  let newLvl = curLvl;
  while (newLvl < 15 && newXP >= PET_BABY_XP_PER_LEVEL) { newXP -= PET_BABY_XP_PER_LEVEL; newLvl++; }
  await db.from('dungeon_pets').update({ pet_level: newLvl, pet_xp: newXP }).eq('id', active.id);
  active.pet_level = newLvl; active.pet_xp = newXP;
  if (newLvl > curLvl) {
    const msg = newLvl === 15 ? ' ✨ ¡Lista para evolucionar!' : ` (${newXP}/${PET_BABY_XP_PER_LEVEL} XP)`;
    toast(def.icon, `¡${def.name} subió a Nv.${newLvl}!${msg}`);
  }
  renderActivePet();
}

/* Stats de una montura a un nivel dado */
function getPetStatAtLevel(def, level) {
  if (!def?.base_stats || level < 1) return { atk:0, def:0, spd:0, lck:0 };
  const g = def.stat_gain || {};
  const l = Math.min(level, 50) - 1;
  return {
    atk: +((def.base_stats.atk + l * (g.atk || 0)).toFixed(2)),
    def: +((def.base_stats.def + l * (g.def || 0)).toFixed(1)),
    spd: +((def.base_stats.spd + l * (g.spd || 0)).toFixed(2)),
    lck: +((def.base_stats.lck + l * (g.lck || 0)).toFixed(2)),
  };
}

/* Stat bonus de la montura activa (wired en addXP / renderHeroUI / gold calc) */
function getPetMountStat(stat) {
  const active = pets.find(p => p.is_active && p.stage === 'mount');
  if (!active) return 0;
  const def = _petDef(active.pet_key);
  if (!def?.base_stats) return 0;
  return getPetStatAtLevel(def, active.pet_level || 1)[stat] || 0;
}

function getPetEffect(type) {
  const active = pets.find(p => p.is_active);
  if (!active || active.stage === 'egg') return 0;
  const ab = PET_ABILITIES?.[active.pet_key]?.[active.stage];
  if (!ab) return 0;
  if (ab.type === type) return ab.val;
  if (type === 'main_hp'   && ab.type === 'main_hp_shield') return ab.val;
  if (type === 'no_hp_loss' && ab.type === 'main_hp_shield') return 1;
  return 0;
}

async function hatchEgg(petKey) {
  const def = _petDef(petKey);
  if (!def) return;
  const eggs    = getInvCount('pet_egg_' + petKey);
  const potions = getInvCount('pet_potion_' + petKey);
  if (eggs < 1) { toast('🥚', `No tienes huevo de ${def.name}.`); return; }
  if (potions < def.hatch) {
    toast('🧪', `Necesitas ${def.hatch} pociones de ${def.name} (tienes ${potions}).`);
    return;
  }
  await consumeInvItem('pet_egg_' + petKey, 1);
  await consumeInvItem('pet_potion_' + petKey, def.hatch);
  const { data } = await db.from('dungeon_pets').insert({
    hero_id: hero.id, pet_key: petKey,
    stage: 'baby', potions_fed: 0, pet_level: 1, pet_xp: 0, is_active: false,
    obtained_at: new Date().toISOString()
  }).select().single();
  if (data) pets.push(data);
  toast('🐣', `¡${def.name} ha eclosionado! Nv.1 — derrota jefes y dale pociones para subirla.`);
  renderPets();
  renderActivePet();
}

async function feedPet(petId) {
  const pet = pets.find(p => p.id === petId);
  if (!pet) return;
  const def = _petDef(pet.pet_key);
  if (!def) return;
  if (pet.stage === 'mount') { toast('🌟', `${def.name} ya es montura. Usa alimento especial para subirla de nivel.`); return; }
  const potions = getInvCount('pet_potion_' + pet.pet_key);
  if (potions < 1) { toast('🧪', `No tienes pociones de ${def.name}.`); return; }
  await consumeInvItem('pet_potion_' + pet.pet_key, 1);

  const petLvl = pet.pet_level || 1;

  if (petLvl < 15) {
    // Fase leveling: poción da XP
    const xpGain = 50;
    let newXP  = (pet.pet_xp || 0) + xpGain;
    let newLvl = petLvl;
    while (newLvl < 15 && newXP >= PET_BABY_XP_PER_LEVEL) { newXP -= PET_BABY_XP_PER_LEVEL; newLvl++; }
    await db.from('dungeon_pets').update({ pet_level: newLvl, pet_xp: newXP }).eq('id', petId);
    pet.pet_level = newLvl; pet.pet_xp = newXP;
    if (newLvl > petLvl) {
      toast(def.icon, `¡${def.name} → Nv.${newLvl}!${newLvl === 15 ? ' ✨ ¡Lista para evolucionar!' : ''}`);
    } else {
      toast('🧪', `+${xpGain} XP → ${def.name} Nv.${newLvl} (${newXP}/${PET_BABY_XP_PER_LEVEL} XP)`);
    }
  } else {
    // Fase evolución: pociones para convertir en Montura
    const newFed = (pet.potions_fed || 0) + 1;
    const willEvo = newFed >= def.evolve;
    const updateObj = { potions_fed: newFed };
    if (willEvo) { updateObj.stage = 'mount'; updateObj.pet_level = 1; updateObj.pet_xp = 0; }
    await db.from('dungeon_pets').update(updateObj).eq('id', petId);
    Object.assign(pet, updateObj);
    if (willEvo) {
      toast('🌟', `¡${def.name} evolucionó a Montura! Nv.1 — aliméntala para subir de nivel.`);
      checkReyTempestad();
    } else {
      toast('✨', `Poción de evolución: ${newFed}/${def.evolve} — ${def.name} Nv.15`);
    }
  }
  renderPets(); renderActivePet();
}

async function feedPetFood(petId) {
  const pet = pets.find(p => p.id === petId);
  if (!pet || pet.stage !== 'mount') { toast('⚠️', 'Solo las monturas pueden comer este alimento.'); return; }
  const def = _petDef(pet.pet_key);
  if (!def) return;
  const foodKey = 'pet_food_' + pet.pet_key;
  if (getInvCount(foodKey) < 1) { toast('🍖', `Sin alimento para ${def.name}. Cómpralo en la Tienda → Alimento.`); return; }
  if ((pet.pet_level || 1) >= 50) { toast('⭐', `¡${def.name} ya está en nivel máximo (50)!`); return; }

  await consumeInvItem(foodKey, 1);
  const gained  = def.food_xp || 50;
  const curLvl  = pet.pet_level || 1;
  let newXP     = (pet.pet_xp || 0) + gained;
  let newLvl    = curLvl;

  while (newLvl < 50 && newXP >= _petXPForNextLevel(newLvl)) {
    newXP -= _petXPForNextLevel(newLvl);
    newLvl++;
  }

  await db.from('dungeon_pets').update({ pet_level: newLvl, pet_xp: newXP }).eq('id', petId);
  pet.pet_level = newLvl; pet.pet_xp = newXP;

  if (newLvl > curLvl) {
    const st = getPetStatAtLevel(def, newLvl);
    toast('⭐', `¡${def.name} → Nv.${newLvl}! ⚔️+${st.atk}% 🛡️+${Math.floor(st.def)}HP ⚡+${st.spd}% 🍀+${st.lck}%`);
    if (typeof dungeonPush === 'function') dungeonPush(`⭐ ¡${def.name} subió a Nv.${newLvl}!`, `¡Sigue alimentándola para desbloquear más stats!`);
    checkReyTempestad();
  } else {
    const need = _petXPForNextLevel(newLvl);
    toast(def.icon, `+${gained} XP · ${def.name} Nv.${newLvl} (${newXP}/${need} para siguiente)`);
  }
  renderPets(); renderActivePet();
}

/* Rey de la Tempestad — se auto-otorga cuando las 6 mascotas base están en montura nv.50 */
async function checkReyTempestad() {
  if (!hero) return;
  const reyDef = typeof PET_DEFS !== 'undefined' ? PET_DEFS.find(p => p.key === 'rey-tempestad') : null;
  if (!reyDef) return;
  // Ya tiene al Rey
  if (pets.some(p => p.pet_key === 'rey-tempestad')) return;
  // Ya tiene el huevo
  if (typeof getInvCount === 'function' && getInvCount('pet_egg_rey-tempestad') > 0) return;
  // Verificar que las 6 mascotas base estén en montura nv.50
  const mainKeys = ['zorro-naturaleza','pantera-sombra','lobo-tormenta','grifo','dragon-fuego','fenix-mitico'];
  const allMaxed = mainKeys.every(key => {
    const pet = pets.find(p => p.pet_key === key);
    return pet && pet.stage === 'mount' && (pet.pet_level || 1) >= 50;
  });
  if (!allMaxed) return;
  // Otorgar el huevo
  if (typeof addInvItem === 'function') await addInvItem('pet_egg_rey-tempestad', 'pet_egg', 1);
  toast('👑', '¡El Rey de la Tempestad despertó! Huevo épico añadido a tu inventario.');
  if (typeof dungeonPush === 'function') dungeonPush('👑 Rey de la Tempestad', '¡Tus 6 mascotas alcanzaron el nivel máximo! El huevo está en tu inventario.');
  if (typeof renderInventory === 'function') renderInventory();
}

async function setActivePet(petId) {
  await db.from('dungeon_pets').update({ is_active: false }).eq('hero_id', hero.id);
  pets.forEach(p => { p.is_active = false; });
  if (petId) {
    await db.from('dungeon_pets').update({ is_active: true }).eq('id', petId);
    const pet = pets.find(p => p.id === petId);
    if (pet) pet.is_active = true;
  }
  renderPets();
  renderActivePet();
}

function _petPowerReady() {
  const today = new Date().toISOString().split('T')[0];
  return !hero || hero.pet_power_date !== today;
}

function renderActivePet() {
  const active = pets.find(p => p.is_active);
  const def    = active ? _petDef(active.pet_key) : null;

  // Sidebar chip (left panel)
  const chip = document.getElementById('activePetDisplay');
  if (chip) {
    if (!active || !def) { chip.style.display = 'none'; }
    else {
      chip.style.display = 'flex';
      chip.innerHTML = `
        <img src="images/pet_${active.stage}_${active.pet_key}.png" class="active-pet-img" alt="${escHtml(def.name)}"
             onerror="this.src='${CDN}dungeon/pet_${active.stage}_${active.pet_key}.png';this.onerror=null">
        <span style="display:none;font-size:20px">${def.icon}</span>
        <div class="active-pet-info">
          <span class="active-pet-name">${escHtml(def.name)}</span>
          <span class="active-pet-stage ${active.stage==='mount'?'stage-mount':'stage-baby'}">${active.stage==='mount'?'🌟 Montura':'🐣 Bebé'}</span>
        </div>`;
    }
  }

  const section = document.getElementById('activePetSection');
  const panel   = document.getElementById('activePetPanel');
  if (!section || !panel) return;

  const today   = new Date().toISOString().split('T')[0];
  const powered = !_petPowerReady();

  /* ── Active pet (baby or mount) ─────────────────────────── */
  if (active && def) {
    const stage   = active.stage;
    const isMount = stage === 'mount';
    const petLvl  = active.pet_level || 1;
    const petXP   = active.pet_xp || 0;
    const potions = typeof getInvCount==='function' ? getInvCount('pet_potion_'+active.pet_key) : 0;
    const ab      = PET_ABILITIES?.[active.pet_key]?.[stage];
    const fondoUrl= `images/pet_fondo_${stage}_${active.pet_key}.png`;
    const stageLabel = isMount ? '🌟 Montura' : '🐣 Bebé';

    section.querySelector('.panel-title').textContent = `🐾 Mascota — ${stageLabel}`;
    panel.innerHTML = `
      <div class="pet-rpanel">
        <div class="pet-rpanel-imgwrap">
          <img src="${fondoUrl}" class="pet-rpanel-bg" alt="">
          <img src="images/pet_${stage}_${active.pet_key}.png" class="pet-rpanel-img ${isMount?'anim-bounce':'anim-float'}" alt=""
               onerror="this.src='${CDN}dungeon/pet_${stage}_${active.pet_key}.png';this.onerror=null">
          <div class="pet-rpanel-emoji" style="display:none">${def.icon}</div>
        </div>
        <div class="pet-rpanel-body">
          <div class="pet-rpanel-info">
            <div class="pet-rpanel-name">${escHtml(def.name)}</div>
            <div class="pet-rpanel-rarity">${def.rarity}</div>
            ${ab ? `<div class="pet-ability-tag" style="margin:4px 0">${ab.icon} ${escHtml(ab.desc)}</div>` : ''}
            ${!isMount ? (() => {
              if (petLvl < 15) {
                const xpPct = Math.round((petXP / PET_BABY_XP_PER_LEVEL) * 100);
                return `
                <div class="pet-level-badge">🐣 Nv. ${petLvl} / 15</div>
                <div class="pet-evo-wrap" style="margin-top:4px">
                  <div class="pet-evo-bar"><div class="pet-evo-fill" style="width:${xpPct}%"></div></div>
                  <span class="pet-evo-label">${petXP}/${PET_BABY_XP_PER_LEVEL} XP · Pociones +50XP · Jefes +30/100/250</span>
                </div>
                <button class="pet-action-btn ${potions>0?'':'pet-btn-disabled'}" style="margin-top:4px"
                  onclick="feedPet('${active.id}')" ${potions>0?'':'disabled'}>🧪 Poción +50 XP (${potions})</button>`;
              } else {
                const evoPct = Math.min(100, Math.round(((active.potions_fed||0)/def.evolve)*100));
                return `
                <div class="pet-level-badge" style="color:var(--yellow)">✨ Nv. 15 — ¡Lista para evolucionar!</div>
                <div class="pet-evo-wrap" style="margin-top:4px">
                  <div class="pet-evo-bar"><div class="pet-evo-fill" style="width:${evoPct}%;background:var(--yellow)"></div></div>
                  <span class="pet-evo-label">${active.potions_fed||0}/${def.evolve} pociones de evolución</span>
                </div>
                <button class="pet-action-btn ${potions>0?'':'pet-btn-disabled'}" style="margin-top:4px"
                  onclick="feedPet('${active.id}')" ${potions>0?'':'disabled'}>🌟 Evolucionar (${potions} pocs.)</button>`;
              }
            })() : (() => {
              const lvl   = active.pet_level || 1;
              const xp    = active.pet_xp || 0;
              const need  = _petXPForNextLevel(lvl);
              const xpPct = lvl >= 50 ? 100 : Math.round((xp / need) * 100);
              const st    = getPetStatAtLevel(def, lvl);
              const food  = typeof getInvCount === 'function' ? getInvCount('pet_food_' + active.pet_key) : 0;
              return `
              <div class="pet-level-badge">⭐ Nv. ${lvl} / 50</div>
              <div class="pet-evo-wrap" style="margin-top:4px">
                <div class="pet-evo-bar"><div class="pet-evo-fill pet-xp-fill" style="width:${xpPct}%"></div></div>
                <span class="pet-evo-label">${lvl>=50?'MAX':xp+'/'+need+' XP'}</span>
              </div>
              <div class="pet-stats-grid">
                <div class="pet-stat-cell" title="Bonus XP de misiones">⚔️ <b>${st.atk}%</b></div>
                <div class="pet-stat-cell" title="HP máximo extra">🛡️ <b>+${Math.floor(st.def)}</b></div>
                <div class="pet-stat-cell" title="Bonus Oro de misiones">⚡ <b>${st.spd}%</b></div>
                <div class="pet-stat-cell" title="Probabilidad de loot">🍀 <b>${st.lck}%</b></div>
              </div>
              ${lvl < 50 ? `<button class="pet-action-btn ${food>0?'':'pet-btn-disabled'}" style="margin-top:4px"
                onclick="feedPetFood('${active.id}')" ${food>0?'':'disabled'}>🍖 Alimentar (${food})</button>` : ''}
              <div style="font-size:9px;color:var(--text3);margin-top:2px">Alimento en Tienda → 🍖 Alimento</div>`;
            })()}
            <button class="pet-power-btn ${powered?'pet-power-used':'anim-pulse-btn'}" onclick="activatePetPower()" ${powered?'disabled':''}>
              ${powered ? '⏳ Poder usado hoy' : `${ab?.icon||'⚡'} Activar Poder`}
            </button>
            <button class="pet-action-btn" style="margin-top:2px;font-size:10px;opacity:.7"
              onclick="setActivePet('')">Desactivar</button>
          </div>
        </div>
      </div>`;
    return;
  }

  /* ── Egg in inventory ────────────────────────────────────── */
  const inv     = typeof inventory !== 'undefined' ? inventory : [];
  const eggItem = inv.find(i => i.item_type === 'pet_egg');
  if (eggItem) {
    const petKey  = eggItem.item_key.replace('pet_egg_', '');
    const eDef    = _petDef(petKey);
    const ab      = PET_ABILITIES?.[petKey]?.egg;
    const fondoUrl= `images/pet_fondo_egg_${petKey}.png`;

    section.querySelector('.panel-title').textContent = '🥚 Mascota — Huevo';
    panel.innerHTML = `
      <div class="pet-rpanel">
        <div class="pet-rpanel-imgwrap">
          <img src="${fondoUrl}" class="pet-rpanel-bg" alt="">
          <img src="images/pet_egg_${petKey}.png" class="pet-rpanel-img anim-shake" alt=""
               onerror="this.src='${CDN}dungeon/pet_egg_${petKey}.png';this.onerror=null">
          <div class="pet-rpanel-emoji" style="display:none">${eDef?.icon||'🥚'}</div>
        </div>
        <div class="pet-rpanel-body">
          <div class="pet-rpanel-info">
            <div class="pet-rpanel-name">${escHtml(eDef?.name||'Huevo')}</div>
            <div class="pet-rpanel-rarity">${eDef?.rarity||''}</div>
            ${ab ? `<div class="pet-ability-tag" style="margin:4px 0">${ab.icon} ${escHtml(ab.desc)}</div>` : ''}
            <button class="pet-power-btn ${powered?'pet-power-used':'anim-pulse-btn'}" onclick="activatePetPower()" ${powered?'disabled':''}>
              ${powered ? '⏳ Poder usado hoy' : `${ab?.icon||'🥚'} Activar Poder`}
            </button>
          </div>
        </div>
      </div>`;
    return;
  }

  /* ── Empty ───────────────────────────────────────────────── */
  section.querySelector('.panel-title').textContent = '🐾 Mascota';
  panel.innerHTML = `<div style="font-size:11px;color:var(--text3);text-align:center;padding:8px 0">
    Sin mascota.<br><button class="pet-action-btn" style="margin-top:6px" onclick="switchView('shop')">🏪 Comprar huevo</button></div>`;
}

async function activatePetPower() {
  if (!_petPowerReady()) { toast('⏳', 'Poder ya usado hoy. Mañana estará disponible.'); return; }
  const today  = new Date().toISOString().split('T')[0];
  const active = pets.find(p => p.is_active);

  let petKey, stage, ab, def;
  if (active) {
    petKey = active.pet_key; stage = active.stage;
  } else {
    const inv = typeof inventory !== 'undefined' ? inventory : [];
    const egg = inv.find(i => i.item_type === 'pet_egg');
    if (!egg) { toast('🥚', 'No tienes mascota ni huevo activo.'); return; }
    petKey = egg.item_key.replace('pet_egg_', ''); stage = 'egg';
  }
  ab  = PET_ABILITIES?.[petKey]?.[stage];
  def = _petDef(petKey);
  if (!ab) { toast('🐾', 'Sin poder disponible.'); return; }

  if (hero) { hero.pet_power_date = today; await saveHero({ pet_power_date: today }); }

  const name = def?.name || 'Mascota';
  if (ab.type === 'act_xp') {
    await addXP(ab.val, 'side', null);
    toast(ab.icon, `¡${name}! +${ab.val} XP`);
  } else if (ab.type === 'act_double' || (stage !== 'egg' && ab.type === 'side_crit')) {
    if (hero) { hero.double_next = true; saveHero({ double_next: true }); }
    toast(ab.icon, `¡${name}! Próxima misión 2× XP`);
  } else if (ab.type === 'act_boss' || (stage !== 'egg' && ab.type === 'boss_dmg')) {
    const dmg = stage === 'egg' ? ab.val : Math.round(ab.val * 40);
    if (typeof damageBoss === 'function') damageBoss(dmg);
    toast(ab.icon, `¡${name}! -${dmg} HP al jefe`);
  } else if (ab.type === 'act_hp' || ab.type === 'main_hp_shield') {
    const gain = ab.type === 'main_hp_shield' ? (hero?.hp_max || 100) : ab.val;
    const newHp = ab.type === 'main_hp_shield' ? (hero?.hp_max || 100) : Math.min((hero?.hp||100)+gain, hero?.hp_max||100);
    if (hero) { hero.hp = newHp; await saveHero({ hp: newHp }); renderHeroUI(); }
    toast(ab.icon, ab.type === 'main_hp_shield' ? `¡${name}! HP restaurado al máximo` : `¡${name}! +${gain} HP`);
  } else if (ab.type === 'daily_xp') {
    const xp = ab.val * 4;
    await addXP(xp, 'side', null);
    toast(ab.icon, `¡${name}! +${xp} XP`);
  } else if (ab.type === 'pom_xp') {
    await addXP(ab.val * 3, 'side', null);
    toast(ab.icon, `¡${name}! +${ab.val * 3} XP`);
  } else if (ab.type === 'epic_xp') {
    await addXP(60, 'side', null);
    toast(ab.icon, `¡${name}! +60 XP`);
  } else if (ab.type === 'all_xp') {
    const exp = Date.now() + 30 * 60 * 1000;
    if (hero) { hero.potion_exp = exp; saveHero({ potion_exp: exp }); }
    toast(ab.icon, `¡${name}! 2× XP por 30 minutos`);
  } else if (ab.type === 'main_hp') {
    const newHp = Math.min((hero?.hp||100)+ab.val*3, hero?.hp_max||100);
    if (hero) { hero.hp = newHp; await saveHero({ hp: newHp }); renderHeroUI(); }
    toast(ab.icon, `¡${name}! +${ab.val*3} HP`);
  }

  renderActivePet();
  if (typeof updateBossBanner === 'function') updateBossBanner();
}

function renderPets() {
  const el = document.getElementById('petsView');
  if (!el) return;

  const eggRows = PET_DEFS.map(def => {
    const qty = getInvCount('pet_egg_' + def.key);
    return qty > 0 ? { def, qty } : null;
  }).filter(Boolean);

  const ownedGroups = PET_DEFS.map(def => {
    const myPets = pets.filter(p => p.pet_key === def.key);
    return myPets.length ? { def, myPets } : null;
  }).filter(Boolean);

  let html = '';

  if (eggRows.length) {
    html += `<div class="pets-section-title">🥚 Huevos en Inventario</div><div class="pets-grid">`;
    for (const { def, qty } of eggRows) {
      const imgUrl = `images/pet_egg_${def.key}.png`;
      const potions  = getInvCount('pet_potion_' + def.key);
      const canHatch = potions >= def.hatch;
      html += `
      <div class="pet-card">
        <div class="pet-card-visual">
          <img src="${imgUrl}" class="pet-card-img" alt="${escHtml(def.name)}"
               onerror="this.src='${CDN}dungeon/pet_egg_${def.key}.png';this.onerror=null">
          ${qty > 1 ? `<span class="pet-qty-badge">×${qty}</span>` : ''}
        </div>
        <div class="pet-card-name">${escHtml(def.name)}</div>
        <div class="pet-card-rarity">${def.rarity}</div>
        <div class="pet-card-meta">Necesitas <b>${def.hatch}</b> pociones · Tienes <b style="color:${potions>=def.hatch?'var(--green)':'var(--red)'}">${potions}</b></div>
        <button class="pet-action-btn ${canHatch ? '' : 'pet-btn-disabled'}"
          onclick="hatchEgg('${def.key}')" ${canHatch ? '' : 'disabled'}>
          🐣 Eclosionar
        </button>
      </div>`;
    }
    html += `</div>`;
  }

  if (ownedGroups.length) {
    html += `<div class="pets-section-title" style="margin-top:20px">🐾 Tus Mascotas</div><div class="pets-grid">`;
    for (const { def, myPets } of ownedGroups) {
      for (const pet of myPets) {
        const imgUrl   = `images/pet_${pet.stage}_${def.key}.png`;
        const fedPct   = Math.min(100, Math.round(((pet.potions_fed||0) / def.evolve) * 100));
        const potions  = getInvCount('pet_potion_' + def.key);
        const isActive = pet.is_active;
        const isMount  = pet.stage === 'mount';
        html += `
        <div class="pet-card ${isActive ? 'pet-card-active' : ''}">
          <div class="pet-card-visual">
            <img src="${imgUrl}" class="pet-card-img" alt="${escHtml(def.name)}"
                 onerror="this.src='${CDN}dungeon/pet_${pet.stage}_${def.key}.png';this.onerror=null">
            ${isMount ? `<span class="pet-mount-crown">🌟</span>` : ''}
          </div>
          <div class="pet-card-name">${escHtml(def.name)}</div>
          <div class="pet-card-rarity">${isMount ? '🌟 Montura' : '🐣 Bebé'}</div>
          ${(() => { const ab = PET_ABILITIES?.[def.key]?.[pet.stage]; return ab ? `<div class="pet-ability-tag" style="font-size:9px">${ab.icon} ${escHtml(ab.desc)}</div>` : ''; })()}
          ${!isMount ? (() => {
            const bLvl  = pet.pet_level || 1;
            const bXP   = pet.pet_xp || 0;
            if (bLvl < 15) {
              const xpPct = Math.round((bXP / PET_BABY_XP_PER_LEVEL) * 100);
              return `
              <div class="pet-level-badge">🐣 Nv. ${bLvl} / 15</div>
              <div class="pet-evo-wrap">
                <div class="pet-evo-bar"><div class="pet-evo-fill" style="width:${xpPct}%"></div></div>
                <span class="pet-evo-label">${bXP}/${PET_BABY_XP_PER_LEVEL} XP</span>
              </div>
              <button class="pet-action-btn ${potions > 0 ? '' : 'pet-btn-disabled'}"
                onclick="feedPet('${pet.id}')" ${potions > 0 ? '' : 'disabled'}>
                🧪 Poción +50 XP (${potions})
              </button>`;
            } else {
              const evoPct = Math.min(100, Math.round(((pet.potions_fed||0)/def.evolve)*100));
              return `
              <div class="pet-level-badge" style="color:var(--yellow)">✨ Nv. 15 — ¡Lista!</div>
              <div class="pet-evo-wrap">
                <div class="pet-evo-bar"><div class="pet-evo-fill" style="width:${evoPct}%;background:var(--yellow)"></div></div>
                <span class="pet-evo-label">${pet.potions_fed||0}/${def.evolve} pocs. evo.</span>
              </div>
              <button class="pet-action-btn ${potions > 0 ? '' : 'pet-btn-disabled'}"
                onclick="feedPet('${pet.id}')" ${potions > 0 ? '' : 'disabled'}>
                🌟 Evolucionar (${potions})
              </button>`;
            }
          })() : (() => {
            const lvl  = pet.pet_level || 1;
            const xp   = pet.pet_xp || 0;
            const need = _petXPForNextLevel(lvl);
            const xpPct= lvl >= 50 ? 100 : Math.round((xp / need) * 100);
            const st   = getPetStatAtLevel(def, lvl);
            const food = typeof getInvCount === 'function' ? getInvCount('pet_food_' + pet.pet_key) : 0;
            return `
            <div class="pet-level-badge">⭐ Nv. ${lvl} / 50</div>
            <div class="pet-evo-wrap">
              <div class="pet-evo-bar"><div class="pet-evo-fill pet-xp-fill" style="width:${xpPct}%"></div></div>
              <span class="pet-evo-label">${lvl>=50?'MAX':xp+'/'+need+' XP'}</span>
            </div>
            <div class="pet-stats-mini">⚔️${st.atk}% 🛡️+${Math.floor(st.def)} ⚡${st.spd}%</div>
            <button class="pet-action-btn ${food>0?'':'pet-btn-disabled'}"
              onclick="feedPetFood('${pet.id}')" ${food>0?'':'disabled'}>
              🍖 Alimentar (${food})
            </button>`;
          })()}
          <button class="pet-action-btn ${isActive ? 'pet-btn-active' : ''}"
            onclick="setActivePet('${isActive ? '' : pet.id}')">
            ${isActive ? '✅ Activa' : '🐾 Activar'}
          </button>
        </div>`;
      }
    }
    html += `</div>`;
  }

  if (!eggRows.length && !ownedGroups.length) {
    html = `<div class="pets-empty">
      <div style="font-size:52px;margin-bottom:12px">🥚</div>
      <div style="font-size:15px;font-weight:600;color:var(--text)">Sin mascotas todavía</div>
      <div style="font-size:13px;color:var(--text2);margin-top:6px">Compra huevos en la tienda y usa pociones para eclosionarlos.</div>
      <button class="btn btn-primary" style="margin-top:16px" onclick="openShop()">🏪 Ir a la Tienda</button>
    </div>`;
  }

  el.innerHTML = html;
  if (typeof animPageItems === 'function') animPageItems('.pet-card', el);
}

// legacy familiar stub — reemplazado por mascotas
function getFamiliarXPBonus() { return 0; }
function renderFamiliar() {}
