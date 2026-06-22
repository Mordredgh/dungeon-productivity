'use strict';
/* ============================================================
   DUNGEON EFFECTS — Batch 1/2/3 premium visual effects
   ============================================================ */

/* ── BATCH 2: Click Spark ─────────────────────────────────── */
function createClickSpark(x, y, color) {
  color = color || '#a855f7';
  const S = 110;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  c.style.cssText = `position:fixed;left:${x - S/2}px;top:${y - S/2}px;pointer-events:none;z-index:9999;`;
  document.body.appendChild(c);
  const ctx = c.getContext('2d');
  const N = 16;
  const pts = Array.from({length: N}, (_, i) => {
    const a = (Math.PI * 2 / N) * i + (Math.random() - .5) * .45;
    const sp = 2.8 + Math.random() * 3.5;
    return { x: S/2, y: S/2, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp, alpha: 1, r: 1.6 + Math.random()*2 };
  });
  let f = 0;
  (function tick() {
    ctx.clearRect(0, 0, S, S);
    pts.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.14;
      p.alpha -= 0.042;
      if (p.alpha <= 0) return;
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (++f < 30) requestAnimationFrame(tick);
    else c.remove();
  })();
}

document.addEventListener('click', e => {
  const slot = e.target.closest('.inv-slot');
  if (slot) {
    const col = getComputedStyle(slot).getPropertyValue('--inv-color').trim() || '#a855f7';
    createClickSpark(e.clientX, e.clientY, col);
    return;
  }
  if (e.target.closest('.quest-check, [onclick*="completeQuest"], .rm-continue, .spell-use-btn')) {
    createClickSpark(e.clientX, e.clientY, '#facc15');
  }
});

/* ── BATCH 2: Glare Hover on inventory slots ──────────────── */
{
  let raf = null, mx = 0, my = 0;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = null;
      document.querySelectorAll('.inv-slot').forEach(sl => {
        const r = sl.getBoundingClientRect();
        if (mx >= r.left && mx <= r.right && my >= r.top && my <= r.bottom) {
          sl.style.setProperty('--gx', ((mx - r.left) / r.width * 100).toFixed(1) + '%');
          sl.style.setProperty('--gy', ((my - r.top) / r.height * 100).toFixed(1) + '%');
          sl.dataset.glare = '1';
        } else if (sl.dataset.glare) {
          delete sl.dataset.glare;
        }
      });
    });
  });
}

/* ── BATCH 2: Count Up with spring easing ─────────────────── */
function countUpSpring(el, target, ms) {
  ms = ms || 900;
  const start = Date.now();
  const from = parseInt(el.textContent) || 0;
  (function tick() {
    const elapsed = Date.now() - start;
    const t = Math.min(elapsed / ms, 1);
    // expo ease-out: feels snappy
    const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    el.textContent = Math.round(from + (target - from) * eased);
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = target;
  })();
}
window.countUpSpring = countUpSpring;

/* ── BATCH 3: Dot Field background ────────────────────────── */
function initDotField() {
  if (document.getElementById('_dungeon-dots')) return;
  const c = document.createElement('canvas');
  c.id = '_dungeon-dots';
  c.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:.22;';
  document.body.insertBefore(c, document.body.firstChild);
  const ctx = c.getContext('2d');
  const COLS = ['#a855f7', '#7c3aed', '#818cf8', '#60a5fa', '#e2e8f0'];
  let W, H, dots;

  function resize() {
    W = c.width = window.innerWidth;
    H = c.height = window.innerHeight;
    const N = Math.min(Math.floor(W * H / 13000), 85);
    dots = Array.from({length: N}, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: .7 + Math.random() * 1.4,
      vx: (Math.random() - .5) * .22,
      vy: (Math.random() - .5) * .22,
      a: .12 + Math.random() * .52,
      col: COLS[Math.floor(Math.random() * COLS.length)]
    }));
  }

  resize();
  window.addEventListener('resize', resize);

  let lt = 0;
  (function draw(ts) {
    requestAnimationFrame(draw);
    if (ts - lt < 33) return;
    lt = ts;
    ctx.clearRect(0, 0, W, H);
    dots.forEach(d => {
      d.x += d.vx; d.y += d.vy;
      if (d.x < 0) d.x = W; if (d.x > W) d.x = 0;
      if (d.y < 0) d.y = H; if (d.y > H) d.y = 0;
      ctx.globalAlpha = d.a;
      ctx.fillStyle = d.col;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  })();
}

/* ── BATCH 3: Plasma Wave on boss cards ───────────────────── */
const _plasmaRAFs = new Map();

function initPlasmaWave(canvas) {
  if (!canvas || _plasmaRAFs.has(canvas)) return;
  const ctx = canvas.getContext('2d');
  let t = 0, raf = null;

  (function draw() {
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    if (!W || !H) { raf = requestAnimationFrame(draw); return; }
    canvas.width = W; canvas.height = H;
    ctx.clearRect(0, 0, W, H);

    for (let layer = 0; layer < 3; layer++) {
      const baseHue = 255 + layer * 28;
      const hShift  = Math.sin(t * .7 + layer) * 18;
      const amp     = H * (.20 + layer * .065);
      const freq    = .014 - layer * .003;
      const yBase   = H * (.28 + layer * .24);
      const speed   = t * (1 + layer * .38);

      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 2) {
        const y = yBase
          + Math.sin(x * freq + speed) * amp
          + Math.sin(x * freq * 2.2 + speed * 1.45) * amp * .34;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, `hsla(${baseHue + hShift},80%,62%,.55)`);
      grad.addColorStop(.6, `hsla(${baseHue + 35 + hShift},70%,40%,.18)`);
      grad.addColorStop(1, `hsla(${baseHue + 60},60%,30%,.02)`);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    t += 0.022;
    raf = requestAnimationFrame(draw);
  })();

  _plasmaRAFs.set(canvas, () => cancelAnimationFrame(raf));
}

function destroyPlasmaWaves() {
  _plasmaRAFs.forEach(fn => fn());
  _plasmaRAFs.clear();
}

window.createClickSpark   = createClickSpark;
window.initDotField       = initDotField;
window.initPlasmaWave     = initPlasmaWave;
window.destroyPlasmaWaves = destroyPlasmaWaves;

// Auto-init dot field
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDotField);
} else {
  setTimeout(initDotField, 0);
}

/* ═══════════════════════════════════════════════════════════
   BATCH 4 — Catalog effects
   ═══════════════════════════════════════════════════════════ */

/* ── HyperText Scramble ────────────────────────────────────── */
const _CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';
function hyperScramble(el, opts) {
  opts = opts || {};
  const text  = opts.text || el.textContent;
  const speed = opts.speed || 28;
  const runs  = opts.runs || 3;
  el.classList.add('hyper-text');
  const chars = text.split('');
  let revealed = 0;
  el.innerHTML = chars.map(c => `<span>${c}</span>`).join('');
  const spans = el.querySelectorAll('span');
  let frame = 0;
  const interval = setInterval(() => {
    spans.forEach((sp, i) => {
      if (i < revealed) { sp.textContent = chars[i]; sp.classList.remove('scrambling'); return; }
      sp.textContent = _CHARS[Math.floor(Math.random() * _CHARS.length)];
      sp.classList.add('scrambling');
    });
    if (frame++ % runs === 0 && revealed < chars.length) revealed++;
    if (revealed >= chars.length) {
      clearInterval(interval);
      spans.forEach((sp, i) => { sp.textContent = chars[i]; sp.classList.remove('scrambling'); });
    }
  }, speed);
}
window.hyperScramble = hyperScramble;

/* ── Typewriter ────────────────────────────────────────────── */
function typeWriter(el, text, speed, onDone) {
  speed = speed || 38;
  el.textContent = '';
  el.classList.add('typewriter-cursor');
  let i = 0;
  const t = setInterval(() => {
    el.textContent += text[i++];
    if (i >= text.length) { clearInterval(t); el.classList.remove('typewriter-cursor'); if (onDone) onDone(); }
  }, speed);
  return { stop: () => clearInterval(t) };
}
window.typeWriter = typeWriter;

/* ── Morphing Text ─────────────────────────────────────────── */
function morphingText(el, words, interval) {
  interval = interval || 2800;
  let idx = 0;
  function next() {
    idx = (idx + 1) % words.length;
    el.classList.add('reveal-blur');
    el.textContent = words[idx];
    el.addEventListener('animationend', () => el.classList.remove('reveal-blur'), { once: true });
  }
  el.textContent = words[0];
  const t = setInterval(next, interval);
  return { stop: () => clearInterval(t) };
}
window.morphingText = morphingText;

/* ── Cursor Trail ──────────────────────────────────────────── */
function initCursorTrail() {
  if (document.getElementById('_cursor-trail')) return;
  const c = document.createElement('canvas');
  c.id = '_cursor-trail';
  c.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9998;';
  document.body.appendChild(c);
  const ctx = c.getContext('2d');
  c.width  = window.innerWidth;
  c.height = window.innerHeight;
  window.addEventListener('resize', () => { c.width = window.innerWidth; c.height = window.innerHeight; });

  const trail = [];
  const MAX = 18;
  let mx = -999, my = -999;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  (function draw() {
    requestAnimationFrame(draw);
    ctx.clearRect(0, 0, c.width, c.height);
    trail.push({ x: mx, y: my, a: .55 });
    if (trail.length > MAX) trail.shift();
    trail.forEach((p, i) => {
      p.a -= .028;
      if (p.a <= 0) return;
      const r = (i / MAX) * 4.5;
      ctx.globalAlpha = p.a * (i / MAX);
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  })();
}

/* ── Spotlight Hero (cursor tracks radial light on sidebar) ── */
function initSpotlightHero() {
  const target = document.querySelector('.sidebar') || document.getElementById('main');
  if (!target) return;
  target.classList.add('spotlight-hero');
  target.addEventListener('mousemove', e => {
    const r = target.getBoundingClientRect();
    target.style.setProperty('--sx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
    target.style.setProperty('--sy', ((e.clientY - r.top)  / r.height * 100).toFixed(1) + '%');
  });
  target.addEventListener('mouseleave', () => {
    target.style.setProperty('--sx', '50%');
    target.style.setProperty('--sy', '50%');
  });
}

/* ── 3D Tilt on boss cards ─────────────────────────────────── */
function initTiltCards() {
  document.addEventListener('mousemove', e => {
    document.querySelectorAll('.bcard:not(.bcard-empty):not(.bcard-defeated)').forEach(card => {
      const r = card.getBoundingClientRect();
      const mx2 = e.clientX - r.left, my2 = e.clientY - r.top;
      if (mx2 < 0 || my2 < 0 || mx2 > r.width || my2 > r.height) {
        card.style.transform = '';
        return;
      }
      const rx = ((my2 / r.height) - .5) * -10;
      const ry = ((mx2 / r.width)  - .5) * 10;
      card.style.transform = `perspective(500px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.015)`;
    });
  });
  document.addEventListener('mouseleave', () => {
    document.querySelectorAll('.bcard').forEach(c => c.style.transform = '');
  });
}

/* ── Magic Card Spotlight on boss cards ────────────────────── */
function initMagicSpotlight() {
  document.addEventListener('mousemove', e => {
    document.querySelectorAll('.bcard:not(.bcard-empty)').forEach(card => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (x >= 0 && y >= 0 && x <= r.width && y <= r.height) {
        const px = (x / r.width * 100).toFixed(1), py = (y / r.height * 100).toFixed(1);
        card.style.setProperty('--mx', px + '%');
        card.style.setProperty('--my', py + '%');
        card.dataset.spotlight = '1';
      } else if (card.dataset.spotlight) {
        delete card.dataset.spotlight;
        card.style.removeProperty('--mx');
        card.style.removeProperty('--my');
      }
    });
  });
}

/* ── Material Ripple ───────────────────────────────────────── */
function addRipple(el) {
  el.classList.add('ripple-btn');
  el.addEventListener('click', e => {
    const r = el.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2;
    const wave = document.createElement('span');
    wave.className = 'ripple-wave';
    wave.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size/2}px;top:${e.clientY - r.top - size/2}px;`;
    el.appendChild(wave);
    wave.addEventListener('animationend', () => wave.remove());
  });
}

/* ── Magnetic Button ───────────────────────────────────────── */
function initMagnetic() {
  document.querySelectorAll('.magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width / 2) * .28;
      const dy = (e.clientY - r.top - r.height / 2) * .28;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
}

/* ── Glitch Text trigger ───────────────────────────────────── */
function triggerGlitch(el) {
  if (!el.dataset.text) el.dataset.text = el.textContent;
  el.classList.add('glitch-active');
  setTimeout(() => el.classList.remove('glitch-active'), 500);
}
window.triggerGlitch = triggerGlitch;

/* ── Confetti Cannon ───────────────────────────────────────── */
function confettiCannon(originX, originY) {
  originX = originX || window.innerWidth / 2;
  originY = originY || window.innerHeight / 2;
  const c = document.createElement('canvas');
  c.className = 'confetti-canvas';
  c.width = window.innerWidth;
  c.height = window.innerHeight;
  document.body.appendChild(c);
  const ctx = c.getContext('2d');
  const COLORS = ['#a855f7','#818cf8','#60a5fa','#34d399','#facc15','#fb7185','#f97316'];
  const N = 80;
  const particles = Array.from({ length: N }, () => {
    const a = Math.random() * Math.PI * 2;
    const sp = 4 + Math.random() * 8;
    return {
      x: originX, y: originY,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3,
      col: COLORS[Math.floor(Math.random() * COLORS.length)],
      r: 3 + Math.random() * 3,
      rot: Math.random() * 360,
      rv: (Math.random() - .5) * 8,
      alpha: 1
    };
  });
  let frame = 0;
  (function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.22;
      p.vx *= 0.98;
      p.rot += p.rv;
      p.alpha -= 0.018;
      if (p.alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.col;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
      ctx.restore();
    });
    if (++frame < 90) requestAnimationFrame(draw);
    else c.remove();
  })();
}
window.confettiCannon = confettiCannon;

/* ── Flickering Grid canvas ────────────────────────────────── */
function initFlickerGrid(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const SIZE = 16, GAP = 3;
  let W, H, cols, rows;
  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    cols = Math.ceil(W / (SIZE + GAP));
    rows = Math.ceil(H / (SIZE + GAP));
  }
  resize();
  new ResizeObserver(resize).observe(canvas);
  const cells = () => Array.from({ length: cols * rows }, () => Math.random());
  let grid = cells();
  setInterval(() => {
    const n = Math.floor(cols * rows * .08);
    for (let i = 0; i < n; i++) grid[Math.floor(Math.random() * grid.length)] = Math.random();
  }, 80);
  let lt = 0;
  (function draw(ts) {
    requestAnimationFrame(draw);
    if (ts - lt < 80) return;
    lt = ts;
    ctx.clearRect(0, 0, W, H);
    grid.forEach((a, i) => {
      if (a < .1) return;
      const col = i % cols, row = Math.floor(i / cols);
      ctx.globalAlpha = a * .55;
      ctx.fillStyle = '#818cf8';
      ctx.fillRect(col * (SIZE + GAP), row * (SIZE + GAP), SIZE, SIZE);
    });
    ctx.globalAlpha = 1;
  })();
}
window.initFlickerGrid = initFlickerGrid;

/* ── Number Ticker (rolling digits) ───────────────────────── */
function numberTicker(el, from, to, ms) {
  ms = ms || 800;
  const start = Date.now();
  (function tick() {
    const t = Math.min((Date.now() - start) / ms, 1);
    const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    const val = Math.round(from + (to - from) * eased);
    el.textContent = val.toLocaleString();
    if (t < 1) requestAnimationFrame(tick);
  })();
}
window.numberTicker = numberTicker;

/* ── Expanding card toggle ─────────────────────────────────── */
function toggleExpand(el) {
  el.closest('.expand-card').classList.toggle('open');
}
window.toggleExpand = toggleExpand;

/* ── Meteor shower ─────────────────────────────────────────── */
function spawnMeteor() {
  const m = document.createElement('div');
  m.style.cssText = `
    position:fixed;
    width:1px;height:${50 + Math.random()*80}px;
    background:linear-gradient(to bottom,rgba(255,255,255,.85),transparent);
    top:${-100 + Math.random()*40}px;
    left:${Math.random()*100}vw;
    transform:rotate(-45deg);
    pointer-events:none;
    z-index:1;
    opacity:0;
    transition:opacity .1s;
  `;
  document.body.appendChild(m);
  requestAnimationFrame(() => { m.style.opacity = '1'; });
  const dur = 600 + Math.random() * 600;
  const dist = 400 + Math.random() * 300;
  m.animate([
    { transform: 'rotate(-45deg) translateY(0)',      opacity: 1 },
    { transform: `rotate(-45deg) translateY(${dist}px)`, opacity: 0 }
  ], { duration: dur, easing: 'linear', fill: 'forwards' }).onfinish = () => m.remove();
}
function initMeteors() {
  function loop() {
    spawnMeteor();
    setTimeout(loop, 1800 + Math.random() * 3000);
  }
  setTimeout(loop, 2000);
}

/* ── Magic Spotlight CSS variable for boss card inner glow ─── */
/* Injected via initMagicSpotlight() — add CSS rule dynamically */
(function injectMagicCSS() {
  const s = document.createElement('style');
  s.textContent = `.bcard[data-spotlight='1']::before{background:radial-gradient(circle at var(--mx,50%) var(--my,50%),rgba(255,255,255,.08) 0%,transparent 55%)!important;}`;
  document.head.appendChild(s);
})();

/* ── Auto-wire on DOMContentLoaded ─────────────────────────── */
function _initBatch4() {
  initTiltCards();
  initMagicSpotlight();
  initSpotlightHero();
  initMeteors();
  initCursorTrail();
  initMagnetic();
  // Ripple on primary/secondary buttons
  document.querySelectorAll('.btn-primary, .btn-secondary, .btn-danger').forEach(addRipple);
  // Stagger on quest list
  const ql = document.getElementById('questList');
  if (ql) ql.classList.add('stagger-list');
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _initBatch4);
} else {
  setTimeout(_initBatch4, 50);
}

window.hyperScramble    = hyperScramble;
window.typeWriter       = typeWriter;
window.morphingText     = morphingText;
window.addRipple        = addRipple;
window.confettiCannon   = confettiCannon;
window.initFlickerGrid  = initFlickerGrid;
window.numberTicker     = numberTicker;
window.initCursorTrail  = initCursorTrail;
