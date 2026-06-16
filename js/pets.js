'use strict';

let pets = [];

async function loadPets() {
  if (!hero) return;
  const { data } = await db.from('dungeon_pets').select('*').eq('hero_id', hero.id);
  pets = data || [];
}

function _petDef(key) { return PET_DEFS.find(p => p.key === key); }

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
    stage: 'baby', potions_fed: 0, is_active: false,
    obtained_at: new Date().toISOString()
  }).select().single();
  if (data) pets.push(data);
  toast('🐣', `¡${def.name} ha eclosionado!`);
  renderPets();
  renderActivePet();
}

async function feedPet(petId) {
  const pet = pets.find(p => p.id === petId);
  if (!pet) return;
  const def = _petDef(pet.pet_key);
  if (!def) return;
  if (pet.stage === 'mount') { toast('⭐', `${def.name} ya es una montura al máximo.`); return; }
  const potions = getInvCount('pet_potion_' + pet.pet_key);
  if (potions < 1) { toast('🧪', `No tienes pociones de ${def.name}.`); return; }
  await consumeInvItem('pet_potion_' + pet.pet_key, 1);
  const newFed   = (pet.potions_fed || 0) + 1;
  const newStage = newFed >= def.evolve ? 'mount' : 'baby';
  await db.from('dungeon_pets').update({ potions_fed: newFed, stage: newStage }).eq('id', petId);
  pet.potions_fed = newFed;
  pet.stage = newStage;
  if (newStage === 'mount') toast('🌟', `¡${def.name} ha evolucionado a Montura!`);
  else toast('🧪', `+1 poción a ${def.name}. Progreso: ${newFed}/${def.evolve}`);
  renderPets();
  renderActivePet();
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
      const imgUrl = `${CDN}dungeon/pet_${active.stage}_${active.pet_key}.png`;
      chip.style.display = 'flex';
      chip.innerHTML = `
        <img src="${imgUrl}" class="active-pet-img" alt="${escHtml(def.name)}"
             onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
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
    const fedPct  = isMount ? 100 : Math.min(100, Math.round(((active.potions_fed||0)/def.evolve)*100));
    const potions = typeof getInvCount==='function' ? getInvCount('pet_potion_'+active.pet_key) : 0;
    const ab      = PET_ABILITIES?.[active.pet_key]?.[stage];
    const fondoUrl= `${CDN}dungeon/pet_fondo_${stage}_${active.pet_key}.png`;
    const stageLabel = isMount ? '🌟 Montura' : '🐣 Bebé';

    section.querySelector('.panel-title').textContent = `🐾 Mascota — ${stageLabel}`;
    panel.innerHTML = `
      <div class="pet-rpanel" style="--pet-fondo:url('${fondoUrl}')">
        <div class="pet-rpanel-imgwrap">
          <div class="pet-rpanel-bg"></div>
          <img src="${CDN}dungeon/pet_${stage}_${active.pet_key}.png" class="pet-rpanel-img" alt=""
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div class="pet-rpanel-emoji" style="display:none">${def.icon}</div>
        </div>
        <div class="pet-rpanel-body">
          <div class="pet-rpanel-info">
            <div class="pet-rpanel-name">${escHtml(def.name)}</div>
            <div class="pet-rpanel-rarity">${def.rarity}</div>
            ${ab ? `<div class="pet-ability-tag" style="margin:4px 0">${ab.icon} ${escHtml(ab.desc)}</div>` : ''}
            ${!isMount ? `
            <div class="pet-evo-wrap" style="margin-top:4px">
              <div class="pet-evo-bar"><div class="pet-evo-fill" style="width:${fedPct}%"></div></div>
              <span class="pet-evo-label">${active.potions_fed||0}/${def.evolve} evo</span>
            </div>
            <button class="pet-action-btn ${potions>0?'':'pet-btn-disabled'}" style="margin-top:4px"
              onclick="feedPet('${active.id}')" ${potions>0?'':'disabled'}>🧪 Alimentar (${potions})</button>
            ` : `<div style="font-size:10px;color:var(--gold);margin-top:2px">✨ Forma final</div>`}
            <button class="pet-power-btn ${powered?'pet-power-used':''}" onclick="activatePetPower()" ${powered?'disabled':''}>
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
    const fondoUrl= `${CDN}dungeon/pet_fondo_egg_${petKey}.png`;

    section.querySelector('.panel-title').textContent = '🥚 Mascota — Huevo';
    panel.innerHTML = `
      <div class="pet-rpanel" style="--pet-fondo:url('${fondoUrl}')">
        <div class="pet-rpanel-imgwrap">
          <div class="pet-rpanel-bg"></div>
          <img src="${CDN}dungeon/pet_egg_${petKey}.png" class="pet-rpanel-img" alt=""
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div class="pet-rpanel-emoji" style="display:none">${eDef?.icon||'🥚'}</div>
        </div>
        <div class="pet-rpanel-body">
          <div class="pet-rpanel-info">
            <div class="pet-rpanel-name">${escHtml(eDef?.name||'Huevo')}</div>
            <div class="pet-rpanel-rarity">${eDef?.rarity||''}</div>
            ${ab ? `<div class="pet-ability-tag" style="margin:4px 0">${ab.icon} ${escHtml(ab.desc)}</div>` : ''}
            <button class="pet-power-btn ${powered?'pet-power-used':''}" onclick="activatePetPower()" ${powered?'disabled':''}>
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
      const imgUrl = `${CDN}dungeon/pet_egg_${def.key}.png`;
      const potions  = getInvCount('pet_potion_' + def.key);
      const canHatch = potions >= def.hatch;
      html += `
      <div class="pet-card">
        <div class="pet-card-visual">
          <img src="${imgUrl}" class="pet-card-img" alt="${escHtml(def.name)}"
               onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
          <div class="pet-card-emoji" style="display:none">${def.icon}</div>
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
        const imgUrl   = `${CDN}dungeon/pet_${pet.stage}_${def.key}.png`;
        const fedPct   = Math.min(100, Math.round(((pet.potions_fed||0) / def.evolve) * 100));
        const potions  = getInvCount('pet_potion_' + def.key);
        const isActive = pet.is_active;
        const isMount  = pet.stage === 'mount';
        html += `
        <div class="pet-card ${isActive ? 'pet-card-active' : ''}">
          <div class="pet-card-visual">
            <img src="${imgUrl}" class="pet-card-img" alt="${escHtml(def.name)}"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
            <div class="pet-card-emoji" style="display:none">${def.icon}</div>
            ${isMount ? `<span class="pet-mount-crown">🌟</span>` : ''}
          </div>
          <div class="pet-card-name">${escHtml(def.name)}</div>
          <div class="pet-card-rarity">${isMount ? '🌟 Montura' : '🐣 Bebé'}</div>
          ${(() => { const ab = PET_ABILITIES?.[def.key]?.[pet.stage]; return ab ? `<div class="pet-ability-tag" style="font-size:9px">${ab.icon} ${escHtml(ab.desc)}</div>` : ''; })()}
          ${!isMount ? `
          <div class="pet-evo-wrap">
            <div class="pet-evo-bar"><div class="pet-evo-fill" style="width:${fedPct}%"></div></div>
            <span class="pet-evo-label">${pet.potions_fed||0}/${def.evolve}</span>
          </div>
          <button class="pet-action-btn ${potions > 0 ? '' : 'pet-btn-disabled'}"
            onclick="feedPet('${pet.id}')" ${potions > 0 ? '' : 'disabled'}>
            🧪 Alimentar (${potions})
          </button>` : ''}
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
}
