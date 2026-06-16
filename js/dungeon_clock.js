'use strict';

/* ── RELOJ DEL DUNGEON — Ciclo día/noche ─────────────────────
   Actualiza data-tod en <html> cada minuto.
   Bonificaciones pasivas por momento del día.
   ─────────────────────────────────────────────────────────── */

const TOD_DEFS = {
  dawn:      { icon:'🌅', name:'Alba',        h:[5,7],   xpMult:1.05, goldMult:1.0,  desc:'+5% XP — el sol asciende' },
  morning:   { icon:'🌄', name:'Mañana',      h:[7,12],  xpMult:1.10, goldMult:1.0,  desc:'+10% XP — hora de máxima energía' },
  afternoon: { icon:'☀️', name:'Mediodía',    h:[12,17], xpMult:1.0,  goldMult:1.0,  desc:'Sin bonificación' },
  dusk:      { icon:'🌇', name:'Ocaso',       h:[17,20], xpMult:1.0,  goldMult:1.10, desc:'+10% Oro — mercaderes al anochecer' },
  evening:   { icon:'🌆', name:'Noche',       h:[20,23], xpMult:1.0,  goldMult:1.15, desc:'+15% Oro — gremio cierra cuentas' },
  midnight:  { icon:'🌙', name:'Medianoche',  h:[23,5],  xpMult:1.0,  goldMult:1.20, desc:'+20% Oro — mercado negro activo' },
};

function getDungeonTOD() {
  const h = new Date().getHours();
  if (h >= 5  && h < 7)  return 'dawn';
  if (h >= 7  && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 20) return 'dusk';
  if (h >= 20 && h < 23) return 'evening';
  return 'midnight';
}

function getTODBonus() {
  return TOD_DEFS[getDungeonTOD()] || TOD_DEFS.afternoon;
}

function updateDungeonClock() {
  const tod = getDungeonTOD();
  const def = TOD_DEFS[tod];
  document.documentElement.dataset.tod = tod;

  const chip = document.getElementById('dungeonClockChip');
  if (!chip) return;

  const hasBonus = def.xpMult > 1 || def.goldMult > 1;
  chip.innerHTML = `${def.icon} <span class="clock-name">${def.name}</span>`;
  chip.title     = def.desc;
  chip.classList.toggle('clock-bonus', hasBonus);
}
