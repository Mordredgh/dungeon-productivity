'use strict';

/* ── SALA PERSONAL ────────────────────────────────────────────
   Cuarto del héroe con muebles arrastrables.
   hero.sala_personal = { placed: [{id, x, y}] }
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

let _salaSelected = null;
let _salaDrag     = null;

function _getSala() {
  try { return JSON.parse(hero.sala_personal || '{}'); } catch { return {}; }
}

async function _saveSala(data) {
  hero.sala_personal = JSON.stringify(data);
  await saveHero({ sala_personal: hero.sala_personal });
}

function renderSalaPersonal() {
  const el = document.getElementById('ctab-sala-personal');
  if (!el || !hero) return;

  const data   = _getSala();
  const placed = data.placed || [];

  el.innerHTML = `
    <div class="sala-layout">
      <div class="sala-room" id="salaRoom">
        <div class="sala-room-overlay"></div>
        ${placed.map((item, i) => {
          const def = SALA_FURNITURE.find(f => f.id === item.id);
          if (!def) return '';
          return `<div class="sala-item" data-idx="${i}" style="left:${item.x}%;top:${item.y}%"
                       title="Doble clic para quitar">
            <img src="${CDN}dungeon/${escHtml(def.img)}" alt="${escHtml(def.name)}" draggable="false">
          </div>`;
        }).join('')}
        <div class="sala-hint">${_salaSelected ? '🖱 Click para colocar · Esc para cancelar' : 'Selecciona un mueble →'}</div>
      </div>
      <div class="sala-picker">
        <div class="sala-picker-title">🪑 Muebles</div>
        <div class="sala-picker-grid">
          ${SALA_FURNITURE.map(f => `
            <div class="sala-picker-item${_salaSelected === f.id ? ' sala-selected' : ''}"
                 onclick="salaSelectFurniture('${f.id}')" title="${escHtml(f.name)}">
              <img src="${CDN}dungeon/${escHtml(f.img)}" alt=""
                   onerror="this.style.display='none'">
              <span class="sala-picker-label">${escHtml(f.name)}</span>
            </div>`).join('')}
        </div>
        <div class="sala-help">Click → selecciona<br>Click en sala → coloca<br>Doble clic → quitar</div>
      </div>
    </div>`;

  _salaBindEvents();
}

function salaSelectFurniture(id) {
  _salaSelected = _salaSelected === id ? null : id;
  renderSalaPersonal();
}

function _salaBindEvents() {
  const room = document.getElementById('salaRoom');
  if (!room) return;

  room.addEventListener('click', e => {
    if (!_salaSelected) return;
    if (e.target.closest('.sala-item')) return;
    const rect = room.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width)  * 100);
    const y = Math.round(((e.clientY - rect.top)  / rect.height) * 100);
    const data   = _getSala();
    data.placed  = data.placed || [];
    data.placed.push({ id: _salaSelected, x: Math.max(3, Math.min(97, x)), y: Math.max(3, Math.min(95, y)) });
    _saveSala(data).then(() => renderSalaPersonal());
  });

  room.addEventListener('dblclick', e => {
    const item = e.target.closest('.sala-item');
    if (!item) return;
    const idx  = parseInt(item.dataset.idx);
    const data = _getSala();
    data.placed = data.placed || [];
    data.placed.splice(idx, 1);
    _saveSala(data).then(() => renderSalaPersonal());
  });

  room.querySelectorAll('.sala-item').forEach(item => {
    item.addEventListener('pointerdown', e => {
      e.stopPropagation();
      item.setPointerCapture(e.pointerId);
      item.classList.add('sala-dragging');
      const rect = room.getBoundingClientRect();
      _salaDrag = { item, idx: parseInt(item.dataset.idx), rect, moved: false };
    });

    item.addEventListener('pointermove', e => {
      if (!_salaDrag || _salaDrag.item !== item) return;
      _salaDrag.moved = true;
      const x = Math.round(((e.clientX - _salaDrag.rect.left)  / _salaDrag.rect.width)  * 100);
      const y = Math.round(((e.clientY - _salaDrag.rect.top)   / _salaDrag.rect.height) * 100);
      item.style.left = Math.max(3, Math.min(97, x)) + '%';
      item.style.top  = Math.max(3, Math.min(95, y)) + '%';
    });

    item.addEventListener('pointerup', async e => {
      if (!_salaDrag || _salaDrag.item !== item) return;
      item.classList.remove('sala-dragging');
      if (_salaDrag.moved) {
        const x = Math.round(((e.clientX - _salaDrag.rect.left)  / _salaDrag.rect.width)  * 100);
        const y = Math.round(((e.clientY - _salaDrag.rect.top)   / _salaDrag.rect.height) * 100);
        const data = _getSala();
        if (data.placed && data.placed[_salaDrag.idx]) {
          data.placed[_salaDrag.idx].x = Math.max(3, Math.min(97, x));
          data.placed[_salaDrag.idx].y = Math.max(3, Math.min(95, y));
          await _saveSala(data);
        }
      }
      _salaDrag = null;
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && _salaSelected) { _salaSelected = null; renderSalaPersonal(); }
  }, { once: true });
}
