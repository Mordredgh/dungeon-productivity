/* FAMILIAR / COMPAÑERO */
const FAMILIAR_MOODS = {
  excited: { label:'¡Emocionado!', color:'var(--gold)',   xpBonus:10, desc:'Racha larga + misiones completadas hoy' },
  happy:   { label:'Feliz',        color:'var(--green)',  xpBonus:5,  desc:'Misiones completadas hoy'               },
  content: { label:'Contento',     color:'var(--blue)',   xpBonus:0,  desc:'Activo y listo para la aventura'        },
  neutral: { label:'Dormitando',   color:'var(--text3)',  xpBonus:0,  desc:'Completa una misión para despertarlo'   },
  sad:     { label:'Triste',       color:'var(--red)',    xpBonus:0,  desc:'HP baja — necesita que te cuides'       },
};

function getFamiliarMood() {
  if (!hero) return 'neutral';
  const today = new Date().toISOString().split('T')[0];
  const done  = quests.filter(q => q.done && q.done_at?.startsWith(today)).length;
  if ((hero.streak || 0) >= 7 && done >= 3) return 'excited';
  if (done >= 3)                             return 'happy';
  if (done > 0)                              return 'content';
  if ((hero.hp || 100) < 40)                return 'sad';
  return 'neutral';
}

function getFamiliarXPBonus() {
  return FAMILIAR_MOODS[getFamiliarMood()]?.xpBonus || 0;
}

function renderFamiliar() {
  const el = document.getElementById('familiarWidget');
  if (!el || !hero) return;
  const fam  = FAMILIARS[hero.hero_class] || { emoji:'🐾', name:'Espíritu Guardián' };
  const mood = getFamiliarMood();
  const md   = FAMILIAR_MOODS[mood];
  el.innerHTML = `
    <div class="familiar-pet">${fam.emoji}</div>
    <div class="familiar-body">
      <div class="familiar-name">${fam.name}</div>
      <div class="familiar-mood" style="color:${md.color}">${md.label}</div>
      ${md.xpBonus ? `<div class="familiar-bonus">+${md.xpBonus} XP por misión</div>` : ''}
    </div>`;
}
