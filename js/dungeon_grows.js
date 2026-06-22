'use strict';

/* ── EL DUNGEON CRECE CONTIGO ────────────────────────────────
   9 salas narrativas que se desbloquean con semanas productivas.
   Req: 10 misiones + 300 XP + racha intacta en la semana.
   Puramente cosmético — nunca bloquea funcionalidad real.
   ─────────────────────────────────────────────────────────── */

const DUNGEON_ROOMS = [
  {
    id:'entrada', sala:1, icon:'🚪', name:'La Entrada', req:0,
    color:'#c2410c', link:'quests', ambient:'embers',
    desc:'Las puertas antiguas se abren ante ti. Aquí comienza toda aventura.',
    flavor:'El primer paso hacia la leyenda.',
    stat(h) { return `${h.quests_done || 0} misiones completadas en total`; },
  },
  {
    id:'misiones', sala:2, icon:'⚔️', name:'Sala de Misiones', req:0,
    color:'#b91c1c', link:'quests', ambient:'embers',
    desc:'Las misiones se graban en piedra. Cada tarea es un paso hacia la grandeza.',
    flavor:'El deber llama. El héroe responde.',
    stat(h) { return `Racha actual: ${h.streak || 0} días`; },
  },
  {
    id:'forja', sala:3, icon:'🔥', name:'La Forja', req:0,
    color:'#b45309', link:'smithy', ambient:'forge',
    desc:'El herrero arcano forja armas con el metal de tus logros.',
    flavor:'El fuego no forja el metal — forja al forjador.',
    stat(h) { return `Nivel héroe: ${h._level || 1}`; },
  },
  {
    id:'biblioteca', sala:4, icon:'📚', name:'La Biblioteca', req:1,
    color:'#7c3aed', link:'spells', ambient:'sparkle',
    bonus:{ type:'gold', label:'+50 monedas', icon:'🪙' },
    desc:'Pergaminos milenarios guardan hechizos olvidados. El saber es poder.',
    flavor:'Cada hechizo aprendido es una cadena rota.',
    stat(h) { return `Hechizos lanzados: ${h.spells_cast || 0}`; },
  },
  {
    id:'jardin', sala:5, icon:'🌿', name:'El Jardín Secreto', req:2,
    color:'#15803d', link:'pets', ambient:'mist',
    bonus:{ type:'drop_rate', label:'+5% drop 48h', icon:'🍀' },
    desc:'Criaturas mágicas descansan en esta arboleda eterna.',
    flavor:'La naturaleza recuerda lo que los hombres olvidan.',
    stat(h) { return `Mascotas: ${typeof pets !== 'undefined' ? pets.length : 0}`; },
  },
  {
    id:'tesoro', sala:6, icon:'🏺', name:'Cámara del Tesoro', req:3,
    color:'#92400e', link:'shop', ambient:'glitter',
    bonus:{ type:'gold_bonus', label:'+100 monedas', icon:'🪙' },
    desc:'Riquezas inimaginables aguardan al héroe que persiste.',
    flavor:'El oro no crea héroes. Los héroes crean oro.',
    stat(h) { return `Oro acumulado: ${Math.floor((h.gold_earned || 0))}🪙`; },
  },
  {
    id:'observatorio', sala:7, icon:'🔮', name:'El Observatorio', req:4,
    color:'#1d4ed8', link:'stats', ambient:'stars',
    bonus:{ type:'xp_bonus', label:'+10% XP 72h', icon:'✨' },
    desc:'Las constelaciones revelan los patrones ocultos de tu progreso.',
    flavor:'El que mira las estrellas nunca pierde el norte.',
    stat(h) { return `XP total: ${(h.xp_total || 0).toLocaleString()}`; },
  },
  {
    id:'arena', sala:8, icon:'👹', name:'Arena del Boss', req:6,
    color:'#991b1b', link:null, ambient:'lightning',
    bonus:{ type:'boss_dmg', label:'+1 mat. crafteo raro', icon:'⚔️' },
    desc:'El coloseo donde se libran las batallas más épicas de la mazmorra.',
    flavor:'Los jefes no temen a los fuertes — temen a los constantes.',
    stat(h) { return `Jefes derrotados: ${h.bosses_killed || 0}`; },
  },
  {
    id:'santuario', sala:9, icon:'🌌', name:'Santuario Cósmico', req:10,
    color:'#6d28d9', link:'character', ambient:'cosmic',
    bonus:{ type:'prestige', label:'Título "Ascendido" + aura dorada', icon:'⭐' },
    desc:'Solo los héroes más tenaces llegan hasta aquí. El cosmos te contempla.',
    flavor:'Al final de cada dungeon hay un nuevo comienzo.',
    stat(h) { return `Semanas productivas: ${h.productive_weeks || 0}`; },
  },
];

/* Umbrales sala → semanas productivas requeridas */
const ROOM_THRESHOLDS = [0,0,0,1,2,3,4,6,10];

/* Requisitos semanales */
const WEEK_REQ = { quests:10, xp:300 };

/* ── Utilidades de semana ────────────────────────────────── */
function _weekKey(d = new Date()) {
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const w = Math.ceil(((d - jan4) / 86400000 + jan4.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(w).padStart(2,'0')}`;
}

function _getWeekData() {
  try {
    const raw = hero.week_data;
    return (raw && typeof raw === 'object') ? raw : (typeof raw === 'string' ? JSON.parse(raw) : {});
  } catch { return {}; }
}

function _getUnlockedRooms() {
  return hero.unlocked_rooms || 3;
}

/* ── Tracking semanal ────────────────────────────────────── */
function trackWeekQuest() {
  if (!hero) return;
  const wd  = _getWeekData();
  const key = _weekKey();
  if (wd.key !== key) { wd.key = key; wd.quests = 0; wd.xp = 0; wd.streak_ok = true; }
  wd.quests = (wd.quests || 0) + 1;
  hero.week_data = wd;
  saveHero({ week_data: wd });
}

function trackWeekXP(amount) {
  if (!hero) return;
  const wd  = _getWeekData();
  const key = _weekKey();
  if (wd.key !== key) { wd.key = key; wd.quests = 0; wd.xp = 0; wd.streak_ok = true; }
  wd.xp = (wd.xp || 0) + amount;
  hero.week_data = wd;
  saveHero({ week_data: wd });
}

function markWeekStreakBroken() {
  if (!hero) return;
  const wd  = _getWeekData();
  const key = _weekKey();
  if (wd.key !== key) { wd.key = key; wd.quests = 0; wd.xp = 0; wd.streak_ok = false; }
  else wd.streak_ok = false;
  hero.week_data = wd;
  saveHero({ week_data: wd });
}

/* Llamado al iniciar la app — evalúa si la semana anterior fue productiva */
async function checkWeeklyDungeonProgress() {
  if (!hero) return;
  const wd  = _getWeekData();
  const now = _weekKey();
  if (!wd.key || wd.key === now) return; // misma semana o primer acceso

  /* Semana anterior terminó */
  const success = (wd.quests || 0) >= WEEK_REQ.quests
               && (wd.xp     || 0) >= WEEK_REQ.xp
               && wd.streak_ok !== false;

  const prevWeeks = hero.productive_weeks || 0;
  const newWeeks  = success ? prevWeeks + 1 : prevWeeks;

  /* Verificar si se desbloquea una sala nueva */
  const prevUnlocked = hero.unlocked_rooms || 3;
  let   newUnlocked  = prevUnlocked;
  for (let i = prevUnlocked; i < DUNGEON_ROOMS.length; i++) {
    if (newWeeks >= ROOM_THRESHOLDS[i]) newUnlocked = i + 1;
    else break;
  }

  /* Reiniciar semana */
  const freshWD = { key:now, quests:0, xp:0, streak_ok:true };

  const patch = { week_data: freshWD };
  if (success) patch.productive_weeks = newWeeks;
  if (newUnlocked > prevUnlocked) {
    patch.unlocked_rooms = newUnlocked;
    const notifs = Array.isArray(hero.room_notif) ? [...hero.room_notif] : [];
    for (let i = prevUnlocked; i < newUnlocked; i++) notifs.push(DUNGEON_ROOMS[i].sala);
    patch.room_notif = notifs;
  }

  Object.assign(hero, patch);
  await saveHero(patch);

  if (success) {
    toast('🏰', `¡Semana productiva #${newWeeks}! ${newUnlocked > prevUnlocked ? '¡Nueva sala desbloqueada!' : ''}`);
  }

  /* Mostrar notificaciones de salas nuevas */
  _showRoomUnlockNotifs();
}

function _showRoomUnlockNotifs() {
  const notifs = Array.isArray(hero.room_notif) ? hero.room_notif : [];
  if (!notifs.length) return;
  const sala   = notifs[0];
  const room   = DUNGEON_ROOMS[sala - 1];
  if (!room) return;

  _showRoomUnlockModal(room, () => {
    const remaining = notifs.slice(1);
    hero.room_notif = remaining;
    saveHero({ room_notif: remaining });
    if (remaining.length) setTimeout(_showRoomUnlockNotifs, 400);
  });
}

function _showRoomUnlockModal(room, cb) {
  const existing = document.getElementById('roomUnlockModal');
  if (existing) existing.remove();

  window._dungeonRoomDismiss = cb;

  const modal = document.createElement('div');
  modal.id = 'roomUnlockModal';
  modal.className = 'room-unlock-overlay';
  modal.innerHTML = `
    <div class="room-unlock-card" style="--rc:${room.color}">
      <div class="room-unlock-bg" style="background-image:url('images/dungeon_sala${room.sala}.png')"></div>
      <div class="room-unlock-content">
        <div class="room-unlock-label">✨ ¡Nueva Sala Descubierta!</div>
        <div class="room-unlock-icon">${room.icon}</div>
        <div class="room-unlock-name">${room.name}</div>
        <div class="room-unlock-flavor">${room.flavor}</div>
        ${room.bonus ? `<div class="room-unlock-bonus">${room.bonus.icon} ${room.bonus.label}</div>` : ''}
        <button class="btn room-unlock-btn" onclick="document.getElementById('roomUnlockModal').remove();const _fn=window._dungeonRoomDismiss;window._dungeonRoomDismiss=null;if(_fn)_fn();">
          ¡Explorar!
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('room-unlock-visible'));
}

/* ── getDungeonBonus (mismas keys, ahora por salas) ─────── */
function getDungeonBonus(type) {
  const rooms = _getUnlockedRooms();
  switch (type) {
    case 'xp':       return rooms >= 7 ? 1.10 : 1;   // Observatorio
    case 'mana':     return rooms >= 4 ? 0.90 : 1;   // Biblioteca: -10% coste maná
    case 'gold':     return rooms >= 6 ? 1.03 : 1;   // Cámara del Tesoro
    case 'pet_xp':   return rooms >= 5 ? 1.05 : 1;   // Jardín Secreto
    case 'drop_rate':return rooms >= 5 ? 1.05 : 1;   // Jardín Secreto
    case 'boss_dmg': return rooms >= 8 ? 1.15 : 1;   // Arena del Boss
    default:         return 1;
  }
}

/* ── Render principal ────────────────────────────────────── */
function renderDungeonGrows() {
  const el = document.getElementById('dungeonGrowsContent');
  if (!el || !hero) return;

  _applyPendingRoomBonuses();

  const unlocked = _getUnlockedRooms();
  const weeks    = hero.productive_weeks || 0;
  const wd       = _getWeekData();
  const wQuests  = wd.quests || 0;
  const wXP      = wd.xp    || 0;
  const wStreak  = wd.streak_ok !== false;

  /* Siguiente sala */
  const nextRoom  = DUNGEON_ROOMS[unlocked];
  const nextReq   = nextRoom ? ROOM_THRESHOLDS[unlocked] : null;
  const weeksLeft = nextReq !== null ? Math.max(0, nextReq - weeks) : 0;

  el.innerHTML = `
    ${_renderWeekProgress(wQuests, wXP, wStreak, unlocked, weeks, nextRoom, weeksLeft)}
    <div class="dg-rooms-grid">
      ${DUNGEON_ROOMS.map((r, i) => _renderRoom(r, i < unlocked)).join('')}
    </div>`;

  /* Animaciones de entrada */
  requestAnimationFrame(() => {
    el.querySelectorAll('.dg-room').forEach((c, i) =>
      setTimeout(() => c.classList.add('dg-room-in'), i * 60));
  });
}

function _renderWeekProgress(q, xp, streak, unlocked, weeks, nextRoom, weeksLeft) {
  const qPct  = Math.min(100, Math.round(q   / WEEK_REQ.quests * 100));
  const xpPct = Math.min(100, Math.round(xp  / WEEK_REQ.xp    * 100));
  const qOk   = q   >= WEEK_REQ.quests;
  const xpOk  = xp  >= WEEK_REQ.xp;
  const allOk = qOk && xpOk && streak;
  return `
    <div class="dg-week-panel ${allOk ? 'dg-week-all-ok' : ''}">
      <div class="dg-week-title">📅 Semana actual${allOk ? ' ✅ ¡Semana productiva!' : ''}</div>
      <div class="dg-week-row">
        <div class="dg-week-cond ${qOk?'ok':''}">
          <span>${qOk?'✅':'⬜'} Misiones</span>
          <div class="dg-week-bar"><div class="dg-week-fill" style="width:${qPct}%"></div></div>
          <span>${q}/${WEEK_REQ.quests}</span>
        </div>
        <div class="dg-week-cond ${xpOk?'ok':''}">
          <span>${xpOk?'✅':'⬜'} XP</span>
          <div class="dg-week-bar"><div class="dg-week-fill" style="width:${xpPct}%"></div></div>
          <span>${xp}/${WEEK_REQ.xp}</span>
        </div>
        <div class="dg-week-cond ${streak?'ok':'fail'}">
          <span>${streak?'✅':'❌'} Racha</span>
          <div class="dg-week-bar"><div class="dg-week-fill" style="width:${streak?100:0}%"></div></div>
          <span>${streak?'Intacta':'Rota'}</span>
        </div>
      </div>
      <div class="dg-week-footer">
        <span>🏰 Semanas productivas: <strong>${weeks}</strong></span>
        ${nextRoom ? `<span style="color:var(--text3)">Siguiente: ${nextRoom.icon} ${nextRoom.name} en ${weeksLeft === 0 ? 'esta semana' : weeksLeft + ' semana' + (weeksLeft > 1 ? 's' : '')}</span>` : '<span style="color:#fbbf24">🌟 ¡Todo desbloqueado!</span>'}
      </div>
    </div>`;
}

function _renderRoom(r, isOpen) {
  const imgBg = `linear-gradient(180deg,rgba(0,0,0,.2) 0%,rgba(0,0,0,.72) 100%),url('images/dungeon_sala${r.sala}.png') center/cover no-repeat`;
  const glow  = `radial-gradient(circle at 50% 0%, color-mix(in srgb,${r.color} 40%,transparent) 0%, transparent 70%)`;

  const statText = isOpen && typeof hero !== 'undefined' ? r.stat(hero) : '';
  const ambientEl = _ambientHTML(r.ambient, isOpen);

  if (isOpen) {
    return `
      <div class="dg-room dg-room-open dg-ambient-${r.ambient}"
           style="--rc:${r.color};background:${imgBg}"
           ${r.link ? `onclick="switchView('${r.link}')" title="Ir a ${r.name}"` : ''}>
        <div class="dg-room-glow" style="background:${glow}"></div>
        ${ambientEl}
        <div class="dg-room-body">
          <div class="dg-room-header">
            <span class="dg-room-icon">${r.icon}</span>
            <span class="dg-room-name">${r.name}</span>
            ${r.bonus ? `<span class="dg-room-badge" title="${r.bonus.label}">${r.bonus.icon}</span>` : ''}
          </div>
          <div class="dg-room-desc">${r.desc}</div>
          <div class="dg-room-stat">${statText}</div>
        </div>
        ${r.link ? `<div class="dg-room-enter">Entrar →</div>` : ''}
      </div>`;
  }

  /* Sala bloqueada */
  const weeks    = hero.productive_weeks || 0;
  const reqWeeks = ROOM_THRESHOLDS[r.sala - 1];
  const pct      = Math.min(100, Math.round(weeks / reqWeeks * 100));
  const isNext   = r.sala === (hero.unlocked_rooms || 3) + 1;
  return `
    <div class="dg-room dg-room-locked ${isNext ? 'dg-room-next' : ''}" style="--rc:${r.color}">
      <div class="dg-room-locked-bg" style="background-image:url('images/dungeon_sala${r.sala}.png')"></div>
      <div class="dg-room-body">
        <div class="dg-room-header">
          <span class="dg-room-icon">🔒</span>
          <span class="dg-room-name">${r.name}</span>
        </div>
        <div class="dg-room-desc" style="opacity:.6">${r.flavor}</div>
        ${isNext ? `
          <div class="dg-room-unlock-req">
            <div class="dg-week-bar" style="margin-top:8px">
              <div class="dg-week-fill" style="width:${pct}%;background:${r.color}"></div>
            </div>
            <div style="font-size:10px;color:var(--text3);margin-top:4px">${weeks}/${reqWeeks} semanas productivas</div>
          </div>` : `<div class="dg-room-stat" style="opacity:.5">🔒 ${reqWeeks} semanas productivas</div>`}
        ${r.bonus ? `<div class="dg-room-bonus-preview" style="opacity:.5">${r.bonus.icon} Al desbloquear: ${r.bonus.label}</div>` : ''}
      </div>
    </div>`;
}

/* Partículas/efectos ambient por tipo de sala */
function _ambientHTML(type, isOpen) {
  if (!isOpen) return '';
  switch (type) {
    case 'embers':
      return `<div class="dg-particles" aria-hidden="true">${Array.from({length:6},(_,i)=>`<span class="dg-ember" style="--i:${i}"></span>`).join('')}</div>`;
    case 'forge':
      return `<div class="dg-particles" aria-hidden="true">${Array.from({length:8},(_,i)=>`<span class="dg-spark" style="--i:${i}"></span>`).join('')}</div>`;
    case 'sparkle':
      return `<div class="dg-particles" aria-hidden="true">${Array.from({length:7},(_,i)=>`<span class="dg-sparkle" style="--i:${i}"></span>`).join('')}</div>`;
    case 'mist':
      return `<div class="dg-mist" aria-hidden="true"><span></span><span></span></div>`;
    case 'glitter':
      return `<div class="dg-particles" aria-hidden="true">${Array.from({length:8},(_,i)=>`<span class="dg-glitter" style="--i:${i}"></span>`).join('')}</div>`;
    case 'stars':
      return `<div class="dg-particles" aria-hidden="true">${Array.from({length:10},(_,i)=>`<span class="dg-star" style="--i:${i}"></span>`).join('')}</div>`;
    case 'lightning':
      return `<div class="dg-particles" aria-hidden="true"><span class="dg-lightning"></span></div>`;
    case 'cosmic':
      return `<div class="dg-particles" aria-hidden="true">${Array.from({length:12},(_,i)=>`<span class="dg-cosmic" style="--i:${i}"></span>`).join('')}</div>`;
    default: return '';
  }
}

/* Aplica bonuses pendientes que aún no se entregaron */
function _applyPendingRoomBonuses() {
  /* Los bonuses de oro se aplican automáticamente al desbloquear desde _showRoomUnlockModal */
  /* Aquí sólo los de efecto persistente (XP/drop_rate) ya están en getDungeonBonus() */
}
