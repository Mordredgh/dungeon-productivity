'use strict';

/* ── JARDÍN DE MASCOTAS ─────────────────────────────────────── */

const GARDEN_ZONES = {
  'dragon-fuego':    { xMin:2,  xMax:23, yMin:5,  yMax:44 },
  'pantera-sombra':  { xMin:26, xMax:48, yMin:52, yMax:90 },
  'grifo':           { xMin:33, xMax:56, yMin:5,  yMax:44 },
  'zorro-naturaleza':{ xMin:51, xMax:73, yMin:5,  yMax:90 },
  'lobo-tormenta':   { xMin:76, xMax:97, yMin:5,  yMax:44 },
  'fenix-mitico':    { xMin:76, xMax:97, yMin:52, yMax:90 },
  'rey-tempestad':   { xMin:37, xMax:63, yMin:32, yMax:68 },
};

let _gardenTimers   = [];
let _gardenFS       = false;
let _gardenActive   = false;

function cleanupGarden() {
  _gardenTimers.forEach(id => clearInterval(id));
  _gardenTimers = [];
  _gardenActive = false;
}

/* ── RENDER PRINCIPAL ──────────────────────────────────────── */
function renderGarden() {
  const container = document.getElementById('petGardenView');
  if (!container) return;
  cleanupGarden();

  const inv       = typeof inventory !== 'undefined' ? inventory : [];
  const hasPets   = typeof pets !== 'undefined' && pets.length > 0;
  const hasAnyEgg = inv.some(i => i.item_type === 'pet_egg');

  if (!hasPets && !hasAnyEgg) {
    container.innerHTML = `
      <div class="garden-empty">
        <div style="font-size:52px;margin-bottom:12px">🌿</div>
        <div>El jardín está vacío. Incuba tu primera mascota para verla aquí.</div>
        <button class="pet-action-btn" style="margin-top:16px" onclick="switchView('shop')">🏪 Tienda</button>
      </div>`;
    return;
  }

  const tod = typeof getDungeonTOD === 'function' ? getDungeonTOD() : 'morning';

  container.innerHTML = `
    <div class="garden-wrap" id="gardenWrap">
      <img src="images/jardin_fondo.png" class="garden-bg-img" alt="Jardín de Mascotas">
      <div class="garden-tod-overlay garden-tod-${tod}"></div>
      <div class="garden-pets-layer" id="gardenPetsLayer"></div>
      <div class="garden-controls">
        <button class="garden-fs-btn" onclick="_gardenToggleFS()" title="Pantalla completa">⛶</button>
      </div>
    </div>
    <div class="rey-sanctuary" id="reySanctuary" style="display:none" onclick="_closeReySanctuary()">
      <div class="rey-sanctuary-inner" onclick="event.stopPropagation()">
        <button class="rey-close-btn" onclick="_closeReySanctuary()">✕</button>
        <div class="rey-sanctuary-bg"></div>
        <div id="reySanctuaryContent"></div>
      </div>
    </div>
    <div class="garden-modal-overlay" id="gardenModal" style="display:none" onclick="_closeGardenModal()">
      <div class="garden-modal" onclick="event.stopPropagation()" id="gardenModalInner"></div>
    </div>`;

  _gardenActive = true;
  _renderGardenPets();
}

/* ── RENDERIZA CADA MASCOTA ──────────────────────────────────── */
function _renderGardenPets() {
  const layer = document.getElementById('gardenPetsLayer');
  if (!layer) return;
  layer.innerHTML = '';

  const inv        = typeof inventory !== 'undefined' ? inventory : [];
  const petsList   = typeof pets !== 'undefined' ? pets : [];
  const ALL_KEYS   = ['dragon-fuego','pantera-sombra','grifo','zorro-naturaleza','lobo-tormenta','fenix-mitico','rey-tempestad'];

  for (const key of ALL_KEYS) {
    const zone     = GARDEN_ZONES[key];
    if (!zone) continue;

    const ownedPet = petsList.find(p => p.pet_key === key);
    const hasEgg   = inv.some(i => i.item_key === 'pet_egg_' + key);
    if (!ownedPet && !hasEgg) continue;

    const isRey    = key === 'rey-tempestad';
    const stage    = ownedPet ? ownedPet.stage : 'egg';
    const isMount  = stage === 'mount';
    const size     = isRey ? 96 : (isMount ? 80 : 56);
    const def      = typeof _petDef === 'function' ? _petDef(key) : null;
    const mood     = _gardenMood(ownedPet);

    // Start position: center of zone
    const startX   = zone.xMin + (zone.xMax - zone.xMin) * 0.4;
    const startY   = zone.yMin + (zone.yMax - zone.yMin) * 0.4;

    const el = document.createElement('div');
    el.className = [
      'garden-pet',
      stage === 'egg'  ? 'garden-pet-egg'   : '',
      isMount          ? 'garden-pet-mount'  : (stage === 'baby' ? 'garden-pet-baby' : ''),
      ownedPet?.is_active ? 'garden-pet-active' : '',
      isRey            ? 'garden-pet-rey'    : '',
    ].filter(Boolean).join(' ');

    el.style.cssText = `left:${startX}%;top:${startY}%;width:${size}px;height:${size}px;`;
    el.dataset.key   = key;

    el.innerHTML = `
      <img src="images/pet_${stage}_${key}.png" class="garden-pet-img" alt="${escHtml(def?.name || key)}"
           onerror="this.src='${typeof CDN !== 'undefined' ? CDN : ''}dungeon/pet_${stage}_${key}.png';this.onerror=null">
      ${ownedPet?.is_active ? '<div class="garden-pet-crown">👑</div>' : ''}
      ${mood ? `<div class="garden-pet-mood">${mood}</div>` : ''}`;

    el.onclick = () => isRey ? _openReySanctuary() : _openGardenModal(key);
    layer.appendChild(el);

    // Wander only for living pets (not eggs, not Rey in main garden)
    if (stage !== 'egg' && !isRey) {
      _startWander(el, zone, stage);
    }
    // Near-hatch wobble
    if (stage === 'egg' && (ownedPet?.pet_xp || 0) > 100) {
      el.classList.add('garden-egg-near-hatch');
    }
  }
}

/* ── SISTEMA WANDER ──────────────────────────────────────────── */
function _startWander(el, zone, stage) {
  const isMount = stage === 'mount';
  const rand    = (a, b) => a + Math.random() * (b - a);
  let curX      = parseFloat(el.style.left);
  const sizeOff = isMount ? 6 : 4; // % offset so pet stays within zone

  const move = () => {
    if (!document.getElementById('gardenWrap') || !_gardenActive) return;
    const tx  = rand(zone.xMin, zone.xMax - sizeOff);
    const ty  = rand(zone.yMin, zone.yMax - sizeOff);
    const dur = isMount ? rand(6000, 10000) : rand(3500, 7000);

    el.style.transform  = tx < curX ? 'scaleX(-1)' : 'scaleX(1)';
    el.style.transition = `left ${dur}ms ease-in-out, top ${dur}ms ease-in-out`;
    el.style.left = tx + '%';
    el.style.top  = ty + '%';
    curX = tx;
  };

  // First move after a small delay so pets feel alive from the start
  const delay = Math.random() * 2000;
  const tid = setTimeout(() => {
    move();
    const interval = setInterval(move, isMount ? rand(7000, 12000) : rand(5000, 9000));
    _gardenTimers.push(interval);
  }, delay);
  _gardenTimers.push(tid);
}

/* ── MOOD BADGE ──────────────────────────────────────────────── */
function _gardenMood(pet) {
  if (!pet) return null;
  const h = new Date().getHours();
  if (h >= 23 || h < 6) return '💤';
  const lastFed = parseInt(localStorage.getItem('pet_lastfed_' + pet.id) || '0');
  if (lastFed && Date.now() - lastFed < 2 * 3600000)  return '⭐';
  if (lastFed && Date.now() - lastFed > 24 * 3600000) return '🍖';
  if (pet.is_active && typeof hero !== 'undefined' && (hero?.streak || 0) >= 7) return '🔥';
  return null;
}

/* ── MODAL DE MASCOTA ──────────────────────────────────────── */
function _openGardenModal(key) {
  const modal = document.getElementById('gardenModal');
  const inner = document.getElementById('gardenModalInner');
  if (!modal || !inner) return;

  const def      = typeof _petDef === 'function' ? _petDef(key) : null;
  const pet      = (typeof pets !== 'undefined' ? pets : []).find(p => p.pet_key === key);
  const inv      = typeof inventory !== 'undefined' ? inventory : [];
  const hasEgg   = inv.some(i => i.item_key === 'pet_egg_' + key);

  if (!pet && hasEgg) {
    // Show egg incubation option
    const potions = typeof getInvCount === 'function' ? getInvCount('pet_potion_' + key) : 0;
    const canHatch = def && potions >= def.hatch;
    inner.innerHTML = `
      <img src="images/pet_egg_${key}.png" class="gm-pet-img" alt="" onerror="this.style.display='none'">
      <div class="gm-name">${escHtml(def?.name || key)}</div>
      <div class="gm-stage">🥚 Huevo</div>
      <div class="gm-meta">Necesitas ${def?.hatch || '?'} pociones<br>Tienes <b style="color:${canHatch ? 'var(--green)' : 'var(--red)'}">${potions}</b></div>
      ${canHatch ? `<button class="pet-action-btn" onclick="_closeGardenModal();hatchEgg('${key}')">🐣 Eclosionar</button>` : ''}
      <button class="gm-close-btn" onclick="_closeGardenModal()">Cerrar</button>`;
    modal.style.display = 'flex';
    return;
  }

  if (!pet) return;

  const stage    = pet.stage;
  const isMount  = stage === 'mount';
  const petLvl   = pet.pet_level || 1;
  const petXP    = pet.pet_xp    || 0;
  const xpMax    = isMount ? (typeof _petXPForNextLevel === 'function' ? _petXPForNextLevel(petLvl) : 200) : (typeof PET_BABY_XP_PER_LEVEL !== 'undefined' ? PET_BABY_XP_PER_LEVEL : 150);
  const xpPct    = (isMount && petLvl >= 50) ? 100 : Math.round((petXP / xpMax) * 100);
  const stLabel  = isMount ? '🌟 Montura' : (petLvl >= 15 ? '✨ Nv.15 — Lista!' : '🐣 Bebé');

  let actionBtn = '';
  if (isMount && petLvl < 50) {
    const food = typeof getInvCount === 'function' ? getInvCount('pet_food_' + key) : 0;
    actionBtn = `<button class="pet-action-btn ${food > 0 ? '' : 'pet-btn-disabled'}"
      onclick="_closeGardenModal();feedPetFood('${pet.id}')" ${food > 0 ? '' : 'disabled'}>
      🍖 Alimentar (${food})</button>`;
  } else if (!isMount) {
    const potions = typeof getInvCount === 'function' ? getInvCount('pet_potion_' + key) : 0;
    const label   = petLvl < 15 ? `🧪 Poción +50 XP (${potions})` : `🌟 Evolucionar (${potions})`;
    actionBtn = `<button class="pet-action-btn ${potions > 0 ? '' : 'pet-btn-disabled'}"
      onclick="_closeGardenModal();feedPet('${pet.id}')" ${potions > 0 ? '' : 'disabled'}>
      ${label}</button>`;
  }

  inner.innerHTML = `
    <img src="images/pet_${stage}_${key}.png" class="gm-pet-img" alt="" onerror="this.style.display='none'">
    <div class="gm-name">${escHtml(def?.name || key)}</div>
    <div class="gm-stage">${stLabel} · Nv.${petLvl}</div>
    <div class="gm-xp-bar-wrap">
      <div class="gm-xp-bar"><div class="gm-xp-fill" style="width:${xpPct}%"></div></div>
      <span class="gm-xp-label">${isMount && petLvl >= 50 ? 'NIVEL MÁXIMO' : petXP + '/' + xpMax + ' XP'}</span>
    </div>
    ${actionBtn}
    <button class="pet-action-btn ${pet.is_active ? 'pet-btn-active' : ''}"
      onclick="_closeGardenModal();setActivePet('${pet.is_active ? '' : pet.id}')">
      ${pet.is_active ? '✅ Mascota activa' : '🐾 Activar'}
    </button>
    <button class="gm-close-btn" onclick="_closeGardenModal()">Cerrar</button>`;

  modal.style.display = 'flex';
}

function _closeGardenModal() {
  const m = document.getElementById('gardenModal');
  if (m) m.style.display = 'none';
}

/* ── SANTUARIO DEL REY ───────────────────────────────────────── */
function _openReySanctuary() {
  const overlay  = document.getElementById('reySanctuary');
  const content  = document.getElementById('reySanctuaryContent');
  if (!overlay || !content) return;

  const key    = 'rey-tempestad';
  const pet    = (typeof pets !== 'undefined' ? pets : []).find(p => p.pet_key === key);
  const inv    = typeof inventory !== 'undefined' ? inventory : [];
  const hasEgg = inv.some(i => i.item_key === 'pet_egg_rey-tempestad');
  const def    = typeof _petDef === 'function' ? _petDef(key) : null;

  if (!pet && !hasEgg) return;

  const stage   = pet?.stage || 'egg';
  const isMount = stage === 'mount';
  const petLvl  = pet?.pet_level || 1;

  let actionBtn = '';
  if (pet && !isMount) {
    const potions = typeof getInvCount === 'function' ? getInvCount('pet_potion_rey-tempestad') : 0;
    actionBtn = `<button class="pet-action-btn" style="margin-top:12px"
      onclick="_closeReySanctuary();feedPet('${pet.id}')">
      ${potions > 0 ? `🧪 Alimentar (${potions})` : '🧪 Sin pociones'}
    </button>`;
  } else if (isMount && petLvl < 50) {
    const food = typeof getInvCount === 'function' ? getInvCount('pet_food_rey-tempestad') : 0;
    actionBtn = `<button class="pet-action-btn" style="margin-top:12px"
      onclick="_closeReySanctuary();feedPetFood('${pet.id}')">
      ${food > 0 ? `⚡ Alimentar (${food})` : '⚡ Sin alimento'}
    </button>`;
  } else if (hasEgg && !pet) {
    const potions = typeof getInvCount === 'function' ? getInvCount('pet_potion_rey-tempestad') : 0;
    const canHatch = def && potions >= (def.hatch || 0);
    if (canHatch) actionBtn = `<button class="pet-action-btn" style="margin-top:12px" onclick="_closeReySanctuary();hatchEgg('rey-tempestad')">🐣 Eclosionar</button>`;
  }

  const stageLabel = isMount ? `🌟 Montura · Nv.${petLvl}/50` : stage === 'egg' ? '🥚 Huevo' : `🐣 Bebé · Nv.${petLvl}/15`;

  content.innerHTML = `
    <div class="rey-pet-wrap">
      <img src="images/pet_${stage}_rey-tempestad.png" class="rey-pet-img" alt="${escHtml(def?.name || 'Rey')}"
           onerror="this.style.display='none'">
      <div class="rey-pet-name">👑 ${escHtml(def?.name || 'Rey de la Tempestad')}</div>
      <div class="rey-pet-stage">${stageLabel}</div>
      ${isMount && petLvl >= 50 ? '<div class="rey-pet-maxed">⚡ ¡NIVEL MÁXIMO ALCANZADO!</div>' : ''}
      ${actionBtn}
    </div>`;

  overlay.style.display = 'flex';
}

function _closeReySanctuary() {
  const o = document.getElementById('reySanctuary');
  if (o) o.style.display = 'none';
}

/* ── FULLSCREEN (portal al body para escapar overflow/transform) ─ */
function _gardenToggleFS() {
  _gardenFS = !_gardenFS;
  const wrap = document.getElementById('gardenWrap');
  if (!wrap) return;

  if (_gardenFS) {
    // Marcar el lugar original con un placeholder
    const ph = document.createElement('div');
    ph.id = 'gardenFSPlaceholder';
    ph.style.display = 'none';
    wrap.parentNode.insertBefore(ph, wrap);

    // Crear portal en body
    const portal = document.createElement('div');
    portal.id = 'gardenFSPortal';
    portal.style.cssText = 'position:fixed;inset:0;z-index:9000;background:#000;';
    document.body.appendChild(portal);

    // Forzar estilos fullscreen en el wrap
    wrap.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;aspect-ratio:auto;border-radius:0;';
    portal.appendChild(wrap);

    const btn = wrap.querySelector('.garden-fs-btn');
    if (btn) btn.textContent = '⊠';

    const onKey = e => { if (e.key === 'Escape') { _gardenToggleFS(); document.removeEventListener('keydown', onKey); } };
    document.addEventListener('keydown', onKey);
  } else {
    // Restaurar al lugar original
    const portal = document.getElementById('gardenFSPortal');
    const ph     = document.getElementById('gardenFSPlaceholder');
    wrap.removeAttribute('style');
    if (ph) { ph.parentNode.insertBefore(wrap, ph); ph.remove(); }
    if (portal) portal.remove();

    const btn = wrap.querySelector('.garden-fs-btn');
    if (btn) btn.textContent = '⛶';
  }
}

/* ── TAB SWITCHER ────────────────────────────────────────────── */
function switchPetsTab(tab) {
  const listView   = document.getElementById('petsView');
  const gardenView = document.getElementById('petGardenView');
  document.querySelectorAll('.pets-tab-btn').forEach(b =>
    b.classList.toggle('pets-tab-active', b.dataset.tab === tab));

  if (tab === 'garden') {
    if (listView)   listView.style.display   = 'none';
    if (gardenView) { gardenView.style.display = 'block'; renderGarden(); }
  } else {
    if (listView)   listView.style.display   = 'block';
    if (gardenView) { gardenView.style.display = 'none'; cleanupGarden(); }
    if (typeof renderPets === 'function') renderPets();
  }
}
