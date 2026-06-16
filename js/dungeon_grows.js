'use strict';

/* ── EL DUNGEON CRECE CONTIGO ────────────────────────────────
   Habitaciones del Dungeon que se desbloquean al subir de nivel.
   Sin arte externo: usa gradientes CSS y emojis.
   ─────────────────────────────────────────────────────────── */

const DUNGEON_ROOMS = [
  { id:'taberna',    level:1,  icon:'🍺', name:'Taberna del Héroe',      desc:'Tu cuartel general. Aquí se aceptan misiones y se comparte el fuego de la hoguera.',                        color:'#c2410c', link:'quests' },
  { id:'herrero',    level:2,  icon:'⚒️', name:'Herrería Arcana',        desc:'El herrero forja armas legendarias. Cada golpe del martillo resuena en toda la mazmorra.',                   color:'#b45309', link:'smithy' },
  { id:'biblioteca', level:3,  icon:'📚', name:'Biblioteca del Conocimiento', desc:'Pergaminos milenarios guardan hechizos olvidados. El conocimiento es poder.',                          color:'#7c3aed', link:'spells' },
  { id:'establo',    level:4,  icon:'🐾', name:'Establo de Mascotas',    desc:'Criaturas mágicas descansan aquí. Incuba huevos y entrena compañeros de batalla.',                          color:'#15803d', link:'pets' },
  { id:'salon',      level:5,  icon:'📊', name:'Sala del Trono',         desc:'Las estadísticas de tus conquistas adornan estas paredes. El poder de los datos.',                          color:'#1d4ed8', link:'stats' },
  { id:'oraculo',    level:6,  icon:'🔮', name:'Torre del Oráculo',      desc:'El espíritu de OpenClaw habita esta torre. Sus visiones guían al héroe en la oscuridad.',                   color:'#6d28d9', link:'oracle' },
  { id:'tesoreria',  level:7,  icon:'💰', name:'Tesorería Real',         desc:'Oro, gemas y reliquias. La riqueza de un héroe se mide por lo que ha ganado en batalla.',                   color:'#b45309', link:'shop' },
  { id:'sala_jefe',  level:8,  icon:'👹', name:'Sala del Jefe Semanal',  desc:'Aquí se libran las batallas más épicas. El jefe semanal espera para ser derrotado.',                       color:'#991b1b', link:null },
  { id:'cripta',     level:9,  icon:'💀', name:'Cripta del Olvido',      desc:'Las misiones completadas yacen aquí como trofeos. Historia de un héroe que no se rindió.',                  color:'#374151', link:'history' },
  { id:'trono',      level:10, icon:'👑', name:'Sala del Señor del Caos','desc':'Solo el héroe de nivel máximo puede reclamar este trono. Aquí comienza la leyenda eterna.', color:'#92400e', link:null },
];

function renderDungeonGrows() {
  const el = document.getElementById('dungeonGrowsContent');
  if (!el || !hero) return;

  const lvl = hero._level || 1;
  const unlocked = DUNGEON_ROOMS.filter(r => r.level <= lvl).length;

  el.innerHTML = `
    <div class="dg-header">
      <div class="dg-progress-text">Habitaciones desbloqueadas: <strong>${unlocked} / ${DUNGEON_ROOMS.length}</strong></div>
      <div class="dg-progress-bar"><div class="dg-progress-fill" style="width:${Math.round(unlocked/DUNGEON_ROOMS.length*100)}%"></div></div>
    </div>
    <div class="dg-grid">
      ${DUNGEON_ROOMS.map(r => {
        const open = lvl >= r.level;
        return `
          <div class="dg-room ${open ? 'dg-room-open' : 'dg-room-locked'}"
               style="--rc:${r.color}"
               ${open && r.link ? `onclick="switchView('${r.link}')" title="Ir a ${r.name}"` : ''}>
            <div class="dg-room-glow"></div>
            <div class="dg-room-icon">${open ? r.icon : '🔒'}</div>
            <div class="dg-room-name">${open ? r.name : `Nivel ${r.level} requerido`}</div>
            <div class="dg-room-desc">${open ? r.desc : 'Sigue subiendo de nivel para desbloquear esta habitación.'}</div>
            ${!open ? `<div class="dg-room-lock-lvl">Nivel ${r.level}</div>` : ''}
          </div>`;
      }).join('')}
    </div>`;
}
