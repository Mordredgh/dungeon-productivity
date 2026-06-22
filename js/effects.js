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
