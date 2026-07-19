'use strict';

/* ── SALA PERSONAL ────────────────────────────────────────────
   Cuarto del héroe con muebles arrastrables y escalables.
   hero.sala_personal = { placed: [{id, x, y, scale}] }
   ─────────────────────────────────────────────────────────── */

const SALA_FURNITURE = [
  { id:'trono-arcano',       name:'Trono Arcano',        img:'mueble_trono_arcano.webp',        category:'asientos',   rarity:'Legendario', price:5000, bonus:'Un asiento digno del Señor del Santuario.', size:132 },
  { id:'mesa-orbe-astral',   name:'Mesa de Orbe Astral', img:'mueble_mesa_orbe_astral.webp',    category:'decoracion', rarity:'Épico',       price:2800, bonus:'+5% XP en descanso.', size:142 },
  { id:'librero-alquimico',  name:'Librero Alquímico',   img:'mueble_librero_alquimico.webp',   category:'decoracion', rarity:'Raro',        price:1400, bonus:'Resguarda fórmulas, tomos y elixires.', size:138 },
  { id:'chimenea-arcana',    name:'Chimenea Arcana',     img:'mueble_chimenea_arcana.webp',     category:'decoracion', rarity:'Épico',       price:3200, bonus:'Una llama violeta para tus vigilias.', size:142 },
  { id:'espejo-dorado',      name:'Espejo Dorado',       img:'mueble_espejo_dorado.webp',       category:'muros',      rarity:'Épico',       price:2600, bonus:'Refleja un poder que aún no dominas.', size:126 },
  { id:'rack-arsenal',       name:'Rack del Arsenal',    img:'mueble_rack_arsenal.webp',        category:'decoracion', rarity:'Raro',        price:1800, bonus:'Exhibe las armas de tus aventuras.', size:132 },
  { id:'cofre-ancestral',    name:'Cofre Ancestral',     img:'mueble_cofre_ancestral.webp',     category:'decoracion', rarity:'Raro',        price:1900, bonus:'Guarda los trofeos de la campaña.', size:116 },
  { id:'arbol-arcano',       name:'Árbol Arcano',        img:'mueble_arbol_arcano.webp',        category:'decoracion', rarity:'Épico',       price:3000, bonus:'Vida mágica que florece en tu sala.', size:136 },
  { id:'candelabro-violeta', name:'Candelabro Violeta',  img:'mueble_candelabro_violeta.webp',  category:'luz',        rarity:'Raro',        price:1200, bonus:'Ilumina los secretos del santuario.', size:112 },
  { id:'estandarte-arcano',  name:'Estandarte Arcano',   img:'mueble_estandarte_arcano.webp',   category:'muros',      rarity:'Común',       price:0, bonus:'Marca tu dominio sobre esta estancia.', size:116 },
  { id:'farol-dorado',       name:'Farol Dorado',        img:'mueble_farol_dorado.webp',        category:'luz',        rarity:'Raro',        price:1500, bonus:'Una luz cálida contra la oscuridad.', size:112 },
  { id:'tapete-astral',      name:'Tapete Astral',       img:'mueble_tapete_astral.webp',       category:'piso',       rarity:'Épico',       price:2400, bonus:'El centro ritual de tu santuario.', size:158 },
  // Legacy: conserva los muebles ya guardados por versiones anteriores.
  { id:'sillon',       name:'Sillón',          img:'mueble_sillon.webp',       category:'asientos',   rarity:'Raro',   bonus:'Un rincón digno de un héroe.', legacy:true },
  { id:'candelabro',   name:'Candelabro',       img:'mueble_candelabro.webp',   category:'luz',        rarity:'Común',  bonus:'Ilumina los secretos de la sala.', legacy:true },
  { id:'cofre',        name:'Cofre',            img:'mueble_cofre.webp',        category:'decoracion', rarity:'Raro',   bonus:'Guarda los trofeos de tu aventura.', legacy:true },
  { id:'espejo',       name:'Espejo Arcano',    img:'mueble_espejo.webp',       category:'muros',      rarity:'Épico',  bonus:'Refleja un poder que aún no dominas.', legacy:true },
  { id:'estanteria',   name:'Estantería',       img:'mueble_estanteria.webp',   category:'decoracion', rarity:'Raro',   bonus:'Tomos, frascos y memorias antiguas.', legacy:true },
  { id:'bola-cristal', name:'Bola de Cristal',  img:'mueble_bola-cristal.webp', category:'decoracion', rarity:'Épico',  bonus:'+5% XP en descanso.', legacy:true },
  { id:'cuadro',       name:'Cuadro',           img:'mueble_cuadro.webp',       category:'muros',      rarity:'Común',  bonus:'Una historia para tus muros.', legacy:true },
  { id:'planta',       name:'Planta Arcana',    img:'mueble_planta.webp',       category:'decoracion', rarity:'Raro',   bonus:'Un toque de vida encantada.', legacy:true },
  { id:'rack-armas',   name:'Rack de Armas',    img:'mueble_rack-armas.webp',   category:'decoracion', rarity:'Épico',  bonus:'Exhibe tus armas más memorables.', legacy:true },
  { id:'vasija',       name:'Vasija',           img:'mueble_vasija.webp',       category:'decoracion', rarity:'Común',  bonus:'Detalles que completan el santuario.', legacy:true },
];

const SALA_CATEGORIES = [
  ['all', 'Todos'], ['asientos', 'Asientos'], ['luz', 'Luz'],
  ['muros', 'Muros'], ['piso', 'Piso'], ['decoracion', 'Decoración'],
];

/* Un solo mueble puede resonar a la vez: decoración con decisión, no bonus gratis apilado. */
const SALA_RESONANCES = {
  'trono-arcano':      { effect:'boss_resist', value:.12, label:'+12% resistencia contra jefes' },
  'mesa-orbe-astral':  { effect:'quest_xp', value:.05, label:'+5% XP de misiones' },
  'librero-alquimico': { effect:'spell_frag', value:1, label:'+1 fragmento de hechizo en botín' },
  'chimenea-arcana':   { effect:'pet_rest', value:.25, label:'+25% recuperación de mascotas' },
  'espejo-dorado':     { effect:'boss_crit', value:.05, label:'+5% crítico contra jefes' },
  'rack-arsenal':      { effect:'forge_speed', value:.15, label:'Forja 15% más rápida' },
  'cofre-ancestral':   { effect:'gold', value:.08, label:'+8% oro obtenido' },
  'arbol-arcano':      { effect:'pet_xp', value:.15, label:'+15% XP de mascota activa' },
  'candelabro-violeta':{ effect:'drop_rate', value:.10, label:'+10% probabilidad de botín' },
  'estandarte-arcano': { effect:'faction_xp', value:.10, label:'+10% XP de facción' },
  'farol-dorado':      { effect:'night_xp', value:.08, label:'+8% XP nocturna' },
  'tapete-astral':     { effect:'boss_dmg', value:.10, label:'+10% daño contra jefes' },
};

function getSalaBonus(effect) {
  if (!hero) return 0;
  const active = SALA_RESONANCES[_getSala().attunedId];
  return active?.effect === effect ? active.value : 0;
}

let _salaSelected       = null;  // id de mueble a colocar
let _salaSelectedPlaced = null;  // índice de item placed seleccionado para editar
let _salaDrag           = null;
let _salaResize          = null;
let _salaSaveTimer      = null;
let _salaCategory       = 'all';

function _getSala() {
  try { return JSON.parse(hero.sala_personal || '{}'); } catch { return {}; }
}

async function _saveSala(data) {
  hero.sala_personal = JSON.stringify(data);
  await saveHero({ sala_personal: hero.sala_personal });
}

function _debounceSave(data) {
  clearTimeout(_salaSaveTimer);
  _salaSaveTimer = setTimeout(() => _saveSala(data), 400);
}

// Perspectiva automática: items más arriba (y pequeño) se ven más chicos
function _perspScale(y) {
  return 0.45 + (y / 100) * 0.75; // y=0→0.45, y=100→1.2
}

function _starterSala() {
  return [
    { id:'estandarte-arcano',  x:21, y:35, scale:.86 },
    { id:'candelabro-violeta', x:19, y:71, scale:.82 },
  ];
}

function _salaOwned(data) {
  return new Set(Array.isArray(data.owned) ? data.owned : (data.placed || []).map(item => item.id));
}

function renderSalaPersonal() {
  const el = document.getElementById('ctab-sala-personal');
  if (!el || !hero) return;

  const data   = _getSala();
  if (!data.seeded) {
    data.placed = data.placed?.length ? data.placed : _starterSala();
    data.owned = Array.from(_salaOwned(data));
    data.seeded = true;
    _saveSala(data).then(() => renderSalaPersonal());
    return;
  }
  const placed = data.placed || [];
  const owned = _salaOwned(data);

  // Painter's algorithm: items con y mayor van encima
  const sorted = placed
    .map((item, i) => ({ ...item, _orig: i }))
    .sort((a, b) => a.y - b.y);

  const selItem = _salaSelectedPlaced !== null ? placed[_salaSelectedPlaced] : null;
  const selDef  = selItem ? SALA_FURNITURE.find(f => f.id === selItem.id) : null;
  const placingDef = _salaSelected ? SALA_FURNITURE.find(f => f.id === _salaSelected) : null;
  const visibleFurniture = SALA_FURNITURE.filter(f => !f.legacy && (_salaCategory === 'all' || f.category === _salaCategory));

  el.innerHTML = `
    <div class="sala-layout">
      <div class="sala-room" id="salaRoom">
        <div class="sala-room-header">
          <div>
            <span class="sala-room-kicker">SALA PERSONAL</span>
            <strong>Santuario Arcano</strong>
          </div>
          <span class="sala-room-count">${data.attunedId ? '✦ Resonancia activa' : placed.length + ' objeto' + (placed.length === 1 ? '' : 's')}</span>
        </div>
        <div class="sala-placement-grid" aria-hidden="true"></div>
        ${sorted.map(item => {
          const def = SALA_FURNITURE.find(f => f.id === item.id);
          if (!def) return '';
          const userScale  = item.scale || 1;
          const finalScale = userScale * _perspScale(item.y);
          const isSel      = _salaSelectedPlaced === item._orig;
          return `<div class="sala-item${isSel ? ' sala-item-selected' : ''}"
                       data-idx="${item._orig}"
                       style="left:${item.x}%;top:${item.y}%;z-index:${Math.round(item.y + 1)};--s:${finalScale.toFixed(3)};--r:${item.rotate || 0}deg;--item-size:${def.size || 90}px">
            <div class="sala-shadow"></div>
            <img src="images/${escHtml(def.img)}" alt="${escHtml(def.name)}" draggable="false">
            ${isSel ? '<button class="sala-resize-handle" type="button" aria-label="Arrastra para cambiar tamaño" title="Arrastra para cambiar tamaño"></button>' : ''}
          </div>`;
        }).join('')}
        <div class="sala-hint" id="salaHint">
          ${_salaSelected
            ? `Coloca ${escHtml(placingDef?.name || 'el mueble')} · Esc para cancelar`
            : _salaSelectedPlaced !== null
            ? 'Arrastra para mover · rueda para escalar'
            : 'Elige un objeto para comenzar a decorar'}
        </div>
        <div class="sala-toolbar" role="toolbar" aria-label="Controles de sala">
          <button class="sala-tool-btn" type="button" onclick="salaRotateSelected(-90)">↺<span>Izquierda</span></button>
          <button class="sala-tool-btn" type="button" onclick="salaRotateSelected(90)">↻<span>Derecha</span></button>
          <button class="sala-tool-btn" type="button" onclick="salaResizeSelected(-.1)">−<span>Reducir</span></button>
          <button class="sala-tool-btn" type="button" onclick="salaResizeSelected(.1)">＋<span>Ampliar</span></button>
          <button class="sala-tool-btn sala-tool-save" type="button" onclick="salaSaveCurrent()">▣<span>Guardar</span></button>
        </div>
      </div>

      <div class="sala-picker" id="salaPicker">
        <div class="sala-picker-top">
          <span class="sala-picker-kicker">INVENTARIO DE SALA</span>
          <button class="sala-close-btn" type="button" title="Cancelar selección" onclick="salaClearSelection()">×</button>
        </div>
        <div class="sala-category-tabs">
          ${SALA_CATEGORIES.map(([id, label]) => `<button class="sala-category${_salaCategory === id ? ' sala-category-active' : ''}" type="button" onclick="salaSetCategory('${id}')">${label}</button>`).join('')}
        </div>
        <div class="sala-picker-grid">
          ${visibleFurniture.length ? visibleFurniture.map(f => {
            const isOwned = owned.has(f.id);
            return `<button class="sala-picker-item${_salaSelected === f.id ? ' sala-selected' : ''}${isOwned ? '' : ' sala-locked'}"
                 type="button" onclick="${isOwned ? `salaSelectFurniture('${f.id}')` : `buySalaFurniture('${f.id}')`}" title="${escHtml(f.name)}">
              <img src="images/${escHtml(f.img)}" alt="">
              <span class="sala-picker-label">${escHtml(f.name)}</span>
              ${isOwned ? '<span class="sala-owned-mark">Propio</span>' : `<span class="sala-price">${f.price.toLocaleString('es-MX')} oro</span>`}
            </button>`;
          }).join('') : '<div class="sala-empty-category">Aún no hay objetos en esta categoría.</div>'}
        </div>
        ${selItem && selDef ? `
          <div class="sala-props-panel">
            <div class="sala-detail-head">
              <img class="sala-props-preview" src="images/${escHtml(selDef.img)}" alt="">
              <div><div class="sala-props-name">${escHtml(selDef.name)}</div><span class="sala-rarity">${escHtml(selDef.rarity)}</span></div>
            </div>
            <p class="sala-props-bonus">${escHtml(SALA_RESONANCES[selDef.id]?.label || selDef.bonus)}</p>
            ${SALA_RESONANCES[selDef.id] ? `<button class="sala-attune-btn ${data.attunedId === selDef.id ? 'sala-attuned' : ''}" onclick="salaAttune('${selDef.id}')">${data.attunedId === selDef.id ? '✦ Resonando ahora' : '✦ Activar resonancia'}</button>` : ''}
            <label class="sala-props-label">Tamaño</label>
            <input type="range" class="sala-size-slider" id="salaSizeSlider"
                   min="30" max="230" step="5"
                   value="${Math.round((selItem.scale || 1) * 100)}"
                   oninput="salaResizeItem(${_salaSelectedPlaced}, this.value / 100)">
            <div class="sala-props-pct" id="salaSizePct">${Math.round((selItem.scale || 1) * 100)}%</div>
            <button class="btn btn-ghost sala-delete-btn" onclick="salaDeleteItem(${_salaSelectedPlaced})">🗑 Quitar mueble</button>
            <button class="btn btn-ghost sala-deselect-btn" onclick="salaDeselectPlaced()">← Volver al inventario</button>
          </div>
        ` : placingDef ? `<div class="sala-place-card"><img src="images/${escHtml(placingDef.img)}" alt=""><div><strong>${escHtml(placingDef.name)}</strong><span class="sala-rarity">${escHtml(placingDef.rarity)}</span><p>${escHtml(placingDef.bonus)}</p></div><button class="sala-place-btn" type="button" onclick="salaFocusRoom()">Colocar</button></div>` : '<div class="sala-help">Elige un objeto y haz clic en la sala.<br>Selecciona uno colocado para moverlo, girarlo o cambiar su tamaño.</div>'}
      </div>
    </div>`;

  _salaBindEvents();
  // No animar transform aquí: GSAP sobrescribe el scale/rotate del editor de sala.
}

function salaSelectFurniture(id) {
  if (!_salaOwned(_getSala()).has(id)) {
    if (typeof toast === 'function') toast('✦', 'Primero compra esta pieza para tu santuario.');
    return;
  }
  _salaSelected       = _salaSelected === id ? null : id;
  _salaSelectedPlaced = null;
  renderSalaPersonal();
}

async function buySalaFurniture(id) {
  const furniture = SALA_FURNITURE.find(item => item.id === id && !item.legacy);
  const data = _getSala();
  if (!furniture || _salaOwned(data).has(id)) return salaSelectFurniture(id);
  if (typeof spendGold !== 'function' || !spendGold(furniture.price)) {
    if (typeof toast === 'function') toast('✦', `Necesitas ${furniture.price.toLocaleString('es-MX')} oro para ${furniture.name}.`);
    return;
  }
  data.owned = [..._salaOwned(data), id];
  await _saveSala(data);
  if (typeof toast === 'function') toast('✦', `${furniture.name} ya forma parte de tu santuario.`);
  _salaSelected = id;
  _salaSelectedPlaced = null;
  renderSalaPersonal();
}

function salaSetCategory(category) {
  _salaCategory = category;
  renderSalaPersonal();
}

function salaClearSelection() {
  _salaSelected = null;
  _salaSelectedPlaced = null;
  renderSalaPersonal();
}

function salaDeselectPlaced() {
  _salaSelectedPlaced = null;
  renderSalaPersonal();
}

async function salaAttune(id) {
  const data = _getSala();
  if (!(data.placed || []).some(item => item.id === id) || !SALA_RESONANCES[id]) return;
  data.attunedId = data.attunedId === id ? null : id;
  await _saveSala(data);
  if (typeof toast === 'function') toast('✦', data.attunedId ? 'Resonancia activa: ' + SALA_RESONANCES[id].label : 'Resonancia desactivada.');
  renderSalaPersonal();
}

function salaFocusRoom() {
  document.getElementById('salaRoom')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function salaFocusSelected() {
  const selected = document.querySelector('.sala-item-selected');
  if (selected) {
    selected.classList.add('sala-item-focus');
    setTimeout(() => selected.classList.remove('sala-item-focus'), 600);
  } else if (typeof toast === 'function') toast('✦', 'Selecciona un mueble colocado para moverlo.');
}

function salaRotateSelected(degrees = 90) {
  if (_salaSelectedPlaced === null) {
    if (typeof toast === 'function') toast('↻', 'Selecciona un mueble colocado para girarlo.');
    return;
  }
  const data = _getSala();
  const item = data.placed?.[_salaSelectedPlaced];
  if (!item) return;
  item.rotate = ((item.rotate || 0) + degrees + 360) % 360;
  _saveSala(data);
  const el = document.querySelector(`.sala-item[data-idx="${_salaSelectedPlaced}"]`);
  if (el) el.style.setProperty('--r', `${item.rotate}deg`);
}

function salaResizeSelected(delta) {
  if (_salaSelectedPlaced === null) {
    if (typeof toast === 'function') toast('↕', 'Selecciona un mueble colocado para cambiar su tamaño.');
    return;
  }
  const item = _getSala().placed?.[_salaSelectedPlaced];
  if (!item) return;
  salaResizeItem(_salaSelectedPlaced, (item.scale || 1) + delta);
}

function salaSaveCurrent() {
  _saveSala(_getSala());
  if (typeof toast === 'function') toast('✦', 'Sala personal guardada.');
}

function salaResizeItem(idx, scale) {
  const data = _getSala();
  if (!data.placed || !data.placed[idx]) return;
  const clamped = Math.max(0.3, Math.min(2.3, scale));
  data.placed[idx].scale = Math.round(clamped * 100) / 100;

  // Update DOM immediately (no full re-render)
  const pct  = document.getElementById('salaSizePct');
  if (pct) pct.textContent = Math.round(clamped * 100) + '%';
  const item = document.querySelector(`.sala-item[data-idx="${idx}"]`);
  if (item) {
    const persp = _perspScale(data.placed[idx].y);
    item.style.setProperty('--s', (clamped * persp).toFixed(3));
  }
  _debounceSave(data);
}

async function salaDeleteItem(idx) {
  const data  = _getSala();
  data.placed = (data.placed || []);
  data.placed.splice(idx, 1);
  _salaSelectedPlaced = null;
  await _saveSala(data);
  renderSalaPersonal();
}

function _salaBindEvents() {
  const room = document.getElementById('salaRoom');
  if (!room) return;

  // Click empty room: place furniture or deselect
  room.addEventListener('click', e => {
    if (e.target.closest('.sala-item, .sala-toolbar')) return;
    if (_salaSelected) {
      const rect = room.getBoundingClientRect();
      const x = Math.round(((e.clientX - rect.left) / rect.width)  * 100);
      const y = Math.round(((e.clientY - rect.top)  / rect.height) * 100);
      const data  = _getSala();
      data.placed = data.placed || [];
      data.placed.push({
        id: _salaSelected,
        x: Math.max(5, Math.min(95, x)),
        y: Math.max(5, Math.min(92, y)),
        scale: 1,
      });
      _salaSelected = null;
      _saveSala(data).then(() => renderSalaPersonal());
    } else if (_salaSelectedPlaced !== null) {
      _salaSelectedPlaced = null;
      renderSalaPersonal();
    }
  });

  // Per-item events
  room.querySelectorAll('.sala-item').forEach(el => {
    const idx = parseInt(el.dataset.idx);

    // Click: select item (if not dragging)
    el.addEventListener('click', e => {
      e.stopPropagation();
      if (_salaDrag?.moved) return;
      if (!_salaSelected) {
        _salaSelectedPlaced = _salaSelectedPlaced === idx ? null : idx;
        renderSalaPersonal();
      }
    });

    // Double-click: quick delete
    el.addEventListener('dblclick', e => {
      e.stopPropagation();
      salaDeleteItem(idx);
    });

    // Wheel: resize
    el.addEventListener('wheel', e => {
      e.preventDefault();
      e.stopPropagation();
      const data = _getSala();
      if (!data.placed || !data.placed[idx]) return;
      const delta    = e.deltaY < 0 ? 0.1 : -0.1;
      const newScale = Math.max(0.3, Math.min(2.3, (data.placed[idx].scale || 1) + delta));
      data.placed[idx].scale = Math.round(newScale * 100) / 100;

      const persp = _perspScale(data.placed[idx].y);
      el.style.setProperty('--s', (newScale * persp).toFixed(3));

      // Sync slider if props panel open
      if (_salaSelectedPlaced === idx) {
        const slider = document.getElementById('salaSizeSlider');
        const pct    = document.getElementById('salaSizePct');
        if (slider) slider.value = Math.round(newScale * 100);
        if (pct)    pct.textContent = Math.round(newScale * 100) + '%';
      }
      _debounceSave(data);
    }, { passive: false });

    // Drag
    el.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      e.stopPropagation();
      el.setPointerCapture(e.pointerId);
      el.classList.add('sala-dragging');
      const rect = room.getBoundingClientRect();
      _salaDrag = { el, idx, rect, sx: e.clientX, sy: e.clientY, moved: false };
    });

    el.addEventListener('pointermove', e => {
      if (!_salaDrag || _salaDrag.el !== el) return;
      if (Math.hypot(e.clientX - _salaDrag.sx, e.clientY - _salaDrag.sy) > 4) _salaDrag.moved = true;
      if (!_salaDrag.moved) return;
      const x = Math.max(5, Math.min(95, Math.round(((e.clientX - _salaDrag.rect.left) / _salaDrag.rect.width)  * 100)));
      const y = Math.max(5, Math.min(92, Math.round(((e.clientY - _salaDrag.rect.top)  / _salaDrag.rect.height) * 100)));
      el.style.left = x + '%';
      el.style.top  = y + '%';
      // Live perspective update while dragging
      const data = _getSala();
      if (data.placed && data.placed[idx]) {
        el.style.setProperty('--s', ((data.placed[idx].scale || 1) * _perspScale(y)).toFixed(3));
      }
    });

    el.addEventListener('pointerup', async e => {
      if (!_salaDrag || _salaDrag.el !== el) return;
      el.classList.remove('sala-dragging');
      if (_salaDrag.moved) {
        const x = Math.max(5, Math.min(95, Math.round(((e.clientX - _salaDrag.rect.left) / _salaDrag.rect.width)  * 100)));
        const y = Math.max(5, Math.min(92, Math.round(((e.clientY - _salaDrag.rect.top)  / _salaDrag.rect.height) * 100)));
        const data = _getSala();
        if (data.placed && data.placed[idx]) {
          data.placed[idx].x = x;
          data.placed[idx].y = y;
          await _saveSala(data);
          renderSalaPersonal(); // re-sort z-index
        }
      }
      _salaDrag = null;
    });

    const resizeHandle = el.querySelector('.sala-resize-handle');
    if (resizeHandle) {
      resizeHandle.addEventListener('pointerdown', e => {
        e.preventDefault();
        e.stopPropagation();
        resizeHandle.setPointerCapture(e.pointerId);
        const item = _getSala().placed?.[idx];
        if (!item) return;
        _salaResize = { idx, sx: e.clientX, sy: e.clientY, scale: item.scale || 1 };
      });

      resizeHandle.addEventListener('pointermove', e => {
        if (!_salaResize || _salaResize.idx !== idx) return;
        e.preventDefault();
        const distance = (e.clientX - _salaResize.sx) - (e.clientY - _salaResize.sy);
        salaResizeItem(idx, _salaResize.scale + distance / 150);
      });

      resizeHandle.addEventListener('pointerup', e => {
        if (!_salaResize || _salaResize.idx !== idx) return;
        e.preventDefault();
        _salaResize = null;
      });
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (_salaSelected)               { _salaSelected = null;       renderSalaPersonal(); }
    else if (_salaSelectedPlaced !== null) { _salaSelectedPlaced = null; renderSalaPersonal(); }
  }, { once: true });
}
