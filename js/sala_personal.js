'use strict';

/* ── SALA PERSONAL ────────────────────────────────────────────
   Cuarto del héroe con muebles arrastrables y escalables.
   hero.sala_personal = { placed: [{id, x, y, scale}] }
   ─────────────────────────────────────────────────────────── */

const SALA_FURNITURE = [
  { id:'sillon',       name:'Sillón',          img:'mueble_sillon.png'       },
  { id:'candelabro',   name:'Candelabro',       img:'mueble_candelabro.png'   },
  { id:'cofre',        name:'Cofre',            img:'mueble_cofre.png'        },
  { id:'espejo',       name:'Espejo Arcano',    img:'mueble_espejo.png'       },
  { id:'estanteria',   name:'Estantería',       img:'mueble_estanteria.png'   },
  { id:'bola-cristal', name:'Bola de Cristal',  img:'mueble_bola-cristal.png' },
  { id:'cuadro',       name:'Cuadro',           img:'mueble_cuadro.png'       },
  { id:'planta',       name:'Planta Arcana',    img:'mueble_planta.png'       },
  { id:'rack-armas',   name:'Rack de Armas',    img:'mueble_rack-armas.png'   },
  { id:'vasija',       name:'Vasija',           img:'mueble_vasija.png'       },
];

let _salaSelected       = null;  // id de mueble a colocar
let _salaSelectedPlaced = null;  // índice de item placed seleccionado para editar
let _salaDrag           = null;
let _salaSaveTimer      = null;

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

function renderSalaPersonal() {
  const el = document.getElementById('ctab-sala-personal');
  if (!el || !hero) return;

  const data   = _getSala();
  const placed = data.placed || [];

  // Painter's algorithm: items con y mayor van encima
  const sorted = placed
    .map((item, i) => ({ ...item, _orig: i }))
    .sort((a, b) => a.y - b.y);

  const selItem = _salaSelectedPlaced !== null ? placed[_salaSelectedPlaced] : null;
  const selDef  = selItem ? SALA_FURNITURE.find(f => f.id === selItem.id) : null;

  el.innerHTML = `
    <div class="sala-layout">
      <div class="sala-room" id="salaRoom">
        ${sorted.map(item => {
          const def = SALA_FURNITURE.find(f => f.id === item.id);
          if (!def) return '';
          const userScale  = item.scale || 1;
          const finalScale = userScale * _perspScale(item.y);
          const isSel      = _salaSelectedPlaced === item._orig;
          return `<div class="sala-item${isSel ? ' sala-item-selected' : ''}"
                       data-idx="${item._orig}"
                       style="left:${item.x}%;top:${item.y}%;z-index:${Math.round(item.y + 1)};--s:${finalScale.toFixed(3)}">
            <div class="sala-shadow"></div>
            <img src="${CDN}dungeon/${escHtml(def.img)}" alt="${escHtml(def.name)}" draggable="false">
          </div>`;
        }).join('')}
        <div class="sala-hint" id="salaHint">
          ${_salaSelected
            ? '🖱 Click para colocar &nbsp;·&nbsp; Esc para cancelar'
            : _salaSelectedPlaced !== null
            ? '↕ Rueda para escalar &nbsp;·&nbsp; Arrastra para mover'
            : 'Selecciona un mueble →'}
        </div>
      </div>

      <div class="sala-picker" id="salaPicker">
        ${selItem && selDef ? `
          <div class="sala-props-panel">
            <div class="sala-props-name">${escHtml(selDef.name)}</div>
            <img class="sala-props-preview" src="${CDN}dungeon/${escHtml(selDef.img)}" alt="">
            <label class="sala-props-label">Tamaño</label>
            <input type="range" class="sala-size-slider" id="salaSizeSlider"
                   min="30" max="230" step="5"
                   value="${Math.round((selItem.scale || 1) * 100)}"
                   oninput="salaResizeItem(${_salaSelectedPlaced}, this.value / 100)">
            <div class="sala-props-pct" id="salaSizePct">${Math.round((selItem.scale || 1) * 100)}%</div>
            <button class="btn btn-ghost sala-delete-btn" onclick="salaDeleteItem(${_salaSelectedPlaced})">🗑 Quitar mueble</button>
            <button class="btn btn-ghost sala-deselect-btn" onclick="salaDeselectPlaced()">← Catálogo</button>
          </div>
        ` : `
          <div class="sala-picker-title">🪑 Muebles</div>
          <div class="sala-picker-grid">
            ${SALA_FURNITURE.map(f => `
              <div class="sala-picker-item${_salaSelected === f.id ? ' sala-selected' : ''}"
                   onclick="salaSelectFurniture('${f.id}')" title="${escHtml(f.name)}">
                <img src="${CDN}dungeon/${escHtml(f.img)}" alt="" onerror="this.style.display='none'">
                <span class="sala-picker-label">${escHtml(f.name)}</span>
              </div>`).join('')}
          </div>
          <div class="sala-help">Selecciona → haz clic en sala<br>Clic en mueble → editar tamaño<br>Rueda del ratón → escalar</div>
        `}
      </div>
    </div>`;

  _salaBindEvents();
}

function salaSelectFurniture(id) {
  _salaSelected       = _salaSelected === id ? null : id;
  _salaSelectedPlaced = null;
  renderSalaPersonal();
}

function salaDeselectPlaced() {
  _salaSelectedPlaced = null;
  renderSalaPersonal();
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
    if (e.target.closest('.sala-item')) return;
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
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (_salaSelected)               { _salaSelected = null;       renderSalaPersonal(); }
    else if (_salaSelectedPlaced !== null) { _salaSelectedPlaced = null; renderSalaPersonal(); }
  }, { once: true });
}
