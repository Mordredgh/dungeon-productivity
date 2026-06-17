'use strict';

/* ── RULETA DEL DUNGEON ─────────────────────────────────────────
   Disponible una vez cada 3 días.
   12 sectores con premios: XP, Oro, HP, fragmentos de hechizo.
   ─────────────────────────────────────────────────────────── */

const RULETA_COOLDOWN_DAYS = 3;
const RULETA_PRIZES = [
  { label: '+100 XP',   icon: '⭐', effect: 'xp',    val: 100  },
  { label: '+50 Oro',   icon: '🪙', effect: 'gold',  val: 50   },
  { label: '+20 HP',    icon: '💚', effect: 'hp',    val: 20   },
  { label: '+200 XP',   icon: '💫', effect: 'xp',    val: 200  },
  { label: '+30 Oro',   icon: '🥇', effect: 'gold',  val: 30   },
  { label: '+40 HP',    icon: '❤️', effect: 'hp',    val: 40   },
  { label: '×2 XP 1h', icon: '⚡', effect: 'double', val: 1   },
  { label: '+75 Oro',   icon: '💎', effect: 'gold',  val: 75   },
  { label: '+5 frags',  icon: '🔮', effect: 'frags', val: 5    },
  { label: '+150 XP',   icon: '🌟', effect: 'xp',    val: 150  },
  { label: '+60 HP',    icon: '🏥', effect: 'hp',    val: 60   },
  { label: '+500 XP',   icon: '👑', effect: 'xp',    val: 500  },
];

function isRuletaAvailable() {
  const last = parseInt(localStorage.getItem('dungeon-ruleta-last') || '0');
  return Date.now() - last >= RULETA_COOLDOWN_DAYS * 86400000;
}

function openRuleta() {
  if (!isRuletaAvailable()) {
    const last = parseInt(localStorage.getItem('dungeon-ruleta-last') || '0');
    const msLeft = (RULETA_COOLDOWN_DAYS * 86400000) - (Date.now() - last);
    const hoursLeft = Math.ceil(msLeft / 3600000);
    toast('⏳', `La Ruleta estará disponible en ${hoursLeft}h.`);
    return;
  }
  renderRuletaWheel();
  openModal('ruletaModal');
}

function renderRuletaWheel() {
  const canvas = document.getElementById('ruletaCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = 280, CX = 140, CY = 140, R = 130;
  canvas.width = canvas.height = W;
  const n = RULETA_PRIZES.length;
  const arc = (2 * Math.PI) / n;

  const COLORS = ['#312e81','#1e3a5f','#3b1f6e','#0f3460','#2d1b69','#1a1a4e',
                  '#293462','#1b2a4a','#3a1c71','#16213e','#0d3b56','#1c1c5e'];

  for (let i = 0; i < n; i++) {
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.arc(CX, CY, R, i * arc - Math.PI / 2, (i + 1) * arc - Math.PI / 2);
    ctx.closePath();
    ctx.fillStyle = COLORS[i % COLORS.length];
    ctx.fill();
    ctx.strokeStyle = 'rgba(137,180,250,.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate((i + 0.5) * arc - Math.PI / 2);
    ctx.textAlign = 'right';
    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#cdd6f4';
    ctx.fillText(RULETA_PRIZES[i].icon, R - 8, 4);
    ctx.font = 'bold 9px sans-serif';
    ctx.fillStyle = '#a6adc8';
    ctx.fillText(RULETA_PRIZES[i].label, R - 26, 4);
    ctx.restore();
  }

  // Center circle
  ctx.beginPath();
  ctx.arc(CX, CY, 20, 0, Math.PI * 2);
  ctx.fillStyle = '#1e1e2e';
  ctx.fill();
  ctx.strokeStyle = '#89b4fa';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#89b4fa';
  ctx.fillText('🎯', CX, CY + 5);
}

let _ruletaSpinning = false;

function spinRuleta() {
  if (_ruletaSpinning) return;
  if (!isRuletaAvailable()) { openRuleta(); return; }
  _ruletaSpinning = true;
  localStorage.setItem('dungeon-ruleta-last', String(Date.now()));

  const prizeIdx = Math.floor(Math.random() * RULETA_PRIZES.length);
  const canvas   = document.getElementById('ruletaCanvas');
  const n        = RULETA_PRIZES.length;
  const arc      = 360 / n;
  const targetDeg = 360 - (prizeIdx * arc + arc / 2) + 360 * 5;
  let currentDeg = 0;
  const startTime = Date.now();
  const duration  = 3500;

  function easeOut(t) { return 1 - Math.pow(1 - t, 4); }

  function frame() {
    const elapsed = Date.now() - startTime;
    const t = Math.min(elapsed / duration, 1);
    currentDeg = easeOut(t) * targetDeg;
    if (canvas) canvas.style.transform = `rotate(${currentDeg}deg)`;

    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      _ruletaSpinning = false;
      applyRuletaPrize(prizeIdx);
    }
  }
  requestAnimationFrame(frame);
}

async function applyRuletaPrize(idx) {
  const prize = RULETA_PRIZES[idx];
  document.getElementById('ruletaResult').innerHTML =
    `<div style="text-align:center;padding:16px">
       <div style="font-size:36px">${prize.icon}</div>
       <div style="font-size:18px;font-weight:700;color:var(--accent);margin:8px 0">${prize.label}</div>
     </div>`;

  switch (prize.effect) {
    case 'xp':     await addXP(prize.val, 'side', null); break;
    case 'gold':   if (typeof addGold === 'function') addGold(prize.val); break;
    case 'hp':     if (hero) { const newHp = Math.min(hero.hp_max||100,(hero.hp||100)+prize.val); hero.hp=newHp; await saveHero({hp:newHp}); renderHeroUI(); } break;
    case 'double': xpMultiplier=2; xpMultiplierEnd=Date.now()+3600000; break;
    case 'frags': {
      const fragKey = 'spell_' + SPELL_FRAGMENT_KEYS[Math.floor(Math.random()*SPELL_FRAGMENT_KEYS.length)];
      if (typeof addToInventory === 'function') await addToInventory(fragKey, prize.val);
      break;
    }
  }
  toast(prize.icon, `¡Ruleta! ${prize.label}`);
  renderHeroUI();
}
