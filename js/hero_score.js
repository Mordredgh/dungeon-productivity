'use strict';

/* ── ÍNDICE DEL HÉROE (0-100) ────────────────────────────────
   Score compuesto que resume el estado actual del héroe.
   Mostrado en la Hoja de Personaje.
   ─────────────────────────────────────────────────────────── */

const HERO_SCORE_TIERS = [
  { min:90, label:'Legendario', color:'#f59e0b', icon:'👑' },
  { min:70, label:'Épico',      color:'#a855f7', icon:'💜' },
  { min:50, label:'Raro',       color:'#3b82f6', icon:'💙' },
  { min:30, label:'Normal',     color:'#22c55e', icon:'💚' },
  { min: 0, label:'Común',      color:'#6b7280', icon:'🩶' },
];

function calcHeroScore() {
  if (!hero) return 0;
  let score = 0;

  // 1. Racha — 25 pts (cada día de racha vale 5, tope 5)
  score += Math.min((hero.streak || 0) * 5, 25);

  // 2. Nivel — 20 pts (cada nivel vale 2, tope 10)
  const lvl = hero._level || 1;
  score += Math.min(lvl * 2, 20);

  // 3. HP actual — 15 pts
  const hpRatio = Math.min((hero.hp || 0) / (hero.hp_max || 100), 1);
  score += Math.round(hpRatio * 15);

  // 4. Misiones completadas hoy — 20 pts (5 pts por misión, tope 4)
  const today = new Date().toISOString().split('T')[0];
  const doneToday = (typeof quests !== 'undefined' ? quests : [])
    .filter(q => q.done && q.done_at?.startsWith(today)).length;
  score += Math.min(doneToday * 5, 20);

  // 5. Actividad últimos 7 días — 20 pts
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const done7   = (typeof quests !== 'undefined' ? quests : [])
    .filter(q => q.done && (q.done_at || '').split('T')[0] >= weekAgo).length;
  score += Math.min(Math.round((done7 / 7) * 20), 20);

  return Math.min(Math.round(score), 100);
}

function getHeroScoreTier(score) {
  return HERO_SCORE_TIERS.find(t => score >= t.min) || HERO_SCORE_TIERS.at(-1);
}

function renderHeroScoreWidget() {
  const el = document.getElementById('heroScoreWidget');
  if (!el) return;
  const score = calcHeroScore();
  const tier  = getHeroScoreTier(score);
  const arc   = Math.round((score / 100) * 283); // circunferencia ~283 para r=45
  el.innerHTML = `
    <div class="hs-wrap">
      <svg class="hs-ring" viewBox="0 0 100 100">
        <circle class="hs-ring-bg" cx="50" cy="50" r="45"/>
        <circle class="hs-ring-fill" cx="50" cy="50" r="45"
          stroke="${tier.color}"
          stroke-dasharray="${arc} 283"
          stroke-dashoffset="0"/>
      </svg>
      <div class="hs-center">
        <div class="hs-num">${score}</div>
        <div class="hs-icon">${tier.icon}</div>
      </div>
    </div>
    <div class="hs-label" style="color:${tier.color}">${tier.label}</div>
    <div class="hs-breakdown">
      <span title="Racha">🔥 ${Math.min((hero?.streak||0)*5,25)}pts</span>
      <span title="Nivel">⭐ ${Math.min((hero?._level||1)*2,20)}pts</span>
      <span title="HP">❤️ ${Math.round(Math.min((hero?.hp||0)/(hero?.hp_max||100),1)*15)}pts</span>
      <span title="Hoy">⚔️ ${Math.min(((typeof quests!=='undefined'?quests:[]).filter(q=>q.done&&q.done_at?.startsWith(new Date().toISOString().split('T')[0])).length)*5,20)}pts</span>
    </div>`;
}
