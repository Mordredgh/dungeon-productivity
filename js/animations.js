'use strict';
/* ── Arcanum GSAP Animations ─────────────────────────────────
   Requiere GSAP 3 cargado antes que este archivo.
   Todos los helpers son globales (vanilla JS sin módulos).
──────────────────────────────────────────────────────────── */

gsap.defaults({ ease: 'power2.out', duration: 0.35 });

/* ────────────────────────────────────────────────────────────
   SELECTORES POR VISTA — qué elementos staggerear al entrar
──────────────────────────────────────────────────────────── */
const _ANIM_VIEW_SELECTORS = {
  quests:          '.quest-item, .boss-banner',
  stats:           '.stat-block, .pom-stat, .heatmap-row, .analytics-block, .hero-score-card, .pattern-card',
  achievements:    '.achievement-card',
  history:         '.quest-item, .history-item',
  shop:            '.shop-section, .shop-item-row, .shop-cat-header',
  inventory:       '.inv-section, .inv-weapon-card',
  pets:            '.pet-card',
  goals:           '.goal-card',
  integrations:    '.integration-card, .integration-connect, .intg-widget',
  'dungeon-grows': '.grows-room, .dg-week-row, .dg-room',
  character:       '.char-stat-card, .char-attr-row, .char-section-title',
  zones:           '.zone-card, .zone-item',
  worldmap:        '.wmap-zone, .map-location',
  smithy:          '.smithy-recipe',
};

/* ────────────────────────────────────────────────────────────
   TRANSICIÓN DE VISTAS
──────────────────────────────────────────────────────────── */
function animViewOut(el, cb) {
  if (!el || typeof gsap === 'undefined') { cb && cb(); return; }
  gsap.to(el, {
    opacity: 0, y: 10, duration: 0.16, ease: 'power2.in',
    onComplete: () => { gsap.set(el, { clearProps: 'opacity,y' }); cb && cb(); }
  });
}

function animViewIn(el, viewId) {
  if (!el || typeof gsap === 'undefined') return;
  gsap.fromTo(el, { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.28 });

  const sel = _ANIM_VIEW_SELECTORS[viewId];
  if (!sel) return;
  // Pequeño delay para que el innerHTML de la vista ya esté renderizado
  requestAnimationFrame(() => {
    const kids = el.querySelectorAll(sel);
    if (!kids.length) return;
    gsap.fromTo(kids,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, stagger: 0.045, duration: 0.3, delay: 0.06,
        clearProps: 'transform,opacity' }
    );
  });
}

/* ────────────────────────────────────────────────────────────
   STAGGER GENÉRICO (llamado desde render functions)
──────────────────────────────────────────────────────────── */
function animPageItems(selector, parent) {
  if (typeof gsap === 'undefined') return;
  const root = parent || document;
  const els  = root.querySelectorAll(selector);
  if (!els.length) return;
  gsap.fromTo(els,
    { opacity: 0, y: 14 },
    { opacity: 1, y: 0, stagger: 0.05, duration: 0.28, clearProps: 'transform,opacity' }
  );
}

/* ────────────────────────────────────────────────────────────
   TOASTS
──────────────────────────────────────────────────────────── */
function animToastIn(el) {
  if (!el || typeof gsap === 'undefined') return;
  gsap.fromTo(el, { x: 56, opacity: 0 }, { x: 0, opacity: 1, duration: 0.32, ease: 'back.out(1.5)' });
}
function animToastOut(el, cb) {
  if (!el || typeof gsap === 'undefined') { cb && cb(); return; }
  gsap.to(el, { x: 56, opacity: 0, duration: 0.22, ease: 'power2.in', onComplete: cb });
}

/* ────────────────────────────────────────────────────────────
   QUEST COMPLETADA
──────────────────────────────────────────────────────────── */
function animQuestComplete(el, cb) {
  if (!el || typeof gsap === 'undefined') { cb && cb(); return; }
  const tl = gsap.timeline({ onComplete: cb });
  tl.to(el,  { backgroundColor: 'rgba(74,222,128,0.18)', duration: 0.1 })
    .to(el,  { x: 80, opacity: 0, duration: 0.32, ease: 'power3.in' }, '+=0.06')
    .to(el,  { height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0,
               overflow: 'hidden', duration: 0.22, ease: 'power2.inOut' });
}

/* ────────────────────────────────────────────────────────────
   BARRAS XP / HP / MANA
──────────────────────────────────────────────────────────── */
let _animPrevHpPct = 100;

function animXPBar(fillEl, pct) {
  if (!fillEl || typeof gsap === 'undefined') { fillEl && (fillEl.style.width = pct + '%'); return; }
  gsap.to(fillEl, { width: pct + '%', duration: 0.65, ease: 'power2.out' });
}

function animHPBar(fillEl, pct) {
  if (!fillEl || typeof gsap === 'undefined') { fillEl && (fillEl.style.width = pct + '%'); return; }
  const isDamage = pct < _animPrevHpPct;
  if (isDamage) {
    const tl = gsap.timeline();
    tl.to(fillEl, { backgroundColor: '#ef4444', duration: 0.08 })
      .to(fillEl, { width: pct + '%', duration: 0.5, ease: 'power2.out' }, 0.08)
      .to(fillEl, { backgroundColor: '', duration: 0.35, clearProps: 'backgroundColor' }, 0.3);
  } else {
    gsap.to(fillEl, { width: pct + '%', duration: 0.5 });
  }
  _animPrevHpPct = pct;
}

function animManaBar(fillEl, pct) {
  if (!fillEl || typeof gsap === 'undefined') { fillEl && (fillEl.style.width = pct + '%'); return; }
  gsap.to(fillEl, { width: pct + '%', duration: 0.55, ease: 'power2.out' });
}

/* ────────────────────────────────────────────────────────────
   BOSS BANNERS
──────────────────────────────────────────────────────────── */
function animBossCards() {
  if (typeof gsap === 'undefined') return;
  const cards = document.querySelectorAll('#bossGrid .boss-banner, #bossGrid > *');
  if (!cards.length) return;
  gsap.fromTo(cards,
    { opacity: 0, y: 28, scale: 0.96 },
    { opacity: 1, y: 0, scale: 1, stagger: 0.1, duration: 0.5,
      ease: 'power3.out', delay: 0.05 }
  );
}

/* ────────────────────────────────────────────────────────────
   LEVEL UP MODAL
──────────────────────────────────────────────────────────── */
function animLevelUpModal() {
  if (typeof gsap === 'undefined') return;
  const overlay = document.getElementById('levelupModal');
  if (!overlay) return;

  const box   = overlay.querySelector('.modal-box, .levelup-box, .levelup-content');
  const lvlEl = overlay.querySelector('#luLevel');
  const title = overlay.querySelector('#luTitle');
  const desc  = overlay.querySelector('#luDesc');
  const perks = overlay.querySelectorAll('.levelup-perk');
  const stars = overlay.querySelectorAll('.levelup-star');

  const tl = gsap.timeline();
  tl.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'none' });
  if (box)   tl.fromTo(box,   { scale: 0.6,  opacity: 0 }, { scale: 1, opacity: 1, duration: 0.42, ease: 'back.out(1.6)' }, 0.05);
  if (lvlEl) tl.fromTo(lvlEl, { scale: 0.2,  opacity: 0 }, { scale: 1, opacity: 1, duration: 0.55, ease: 'elastic.out(1, 0.4)' }, 0.18);
  if (title) tl.fromTo(title, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 }, 0.44);
  if (desc)  tl.fromTo(desc,  { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25 }, 0.54);
  if (perks.length) tl.fromTo(perks, { y: 12, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 0.25 }, 0.6);
  if (stars.length) tl.fromTo(stars,
    { scale: 0, opacity: 0, rotation: 'random(-180,180)' },
    { scale: 1, opacity: 1, rotation: 0, stagger: { each: 0.04, from: 'random' }, duration: 0.4, ease: 'back.out(1.8)' },
    0.12);
}

/* ────────────────────────────────────────────────────────────
   MODALES GENÉRICOS
──────────────────────────────────────────────────────────── */
function animModalOpen(id) {
  if (typeof gsap === 'undefined') return;
  const overlay = document.getElementById(id);
  if (!overlay) return;
  const box = overlay.querySelector(
    '.modal-box, .modal-content, .edit-modal, .quick-create-box, .shortcuts-box'
  );
  gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: 'none' });
  if (box) gsap.fromTo(box, { scale: 0.92, y: 14, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.28, ease: 'back.out(1.3)' });
}

function animModalClose(id, cb) {
  if (typeof gsap === 'undefined') { cb && cb(); return; }
  const overlay = document.getElementById(id);
  if (!overlay) { cb && cb(); return; }
  const box = overlay.querySelector(
    '.modal-box, .modal-content, .edit-modal, .quick-create-box, .shortcuts-box'
  );
  const tl = gsap.timeline({ onComplete: cb });
  if (box) tl.to(box, { scale: 0.92, y: 8, opacity: 0, duration: 0.18, ease: 'power2.in' });
  tl.to(overlay, { opacity: 0, duration: 0.14, ease: 'none' }, box ? '-=0.06' : 0);
}

/* ────────────────────────────────────────────────────────────
   TABS PERSONAJE
──────────────────────────────────────────────────────────── */
function animCharTabIn(panelEl) {
  if (!panelEl || typeof gsap === 'undefined') return;
  gsap.fromTo(panelEl, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.22 });
  // Stagger children genérico
  const kids = panelEl.querySelectorAll(
    '.char-stat-card, .char-attr-row, .skill-node, .rune-card, ' +
    '.bestiary-entry, .smithy-recipe, .inv-weapon-card, .sala-picker-item'
  );
  if (kids.length) {
    gsap.fromTo(kids,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, stagger: 0.04, duration: 0.25, delay: 0.05, clearProps: 'transform,opacity' }
    );
  }
}

/* ────────────────────────────────────────────────────────────
   MOBILE BOTTOM SHEET
──────────────────────────────────────────────────────────── */
function animMobileSheetOpen() {
  if (typeof gsap === 'undefined') return;
  const overlay = document.getElementById('mobileNavMoreOverlay');
  const sheet   = document.getElementById('mobileNavMoreSheet');
  if (overlay) gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.2 });
  if (sheet)   gsap.fromTo(sheet,   { y: '100%' }, { y: '0%', duration: 0.38, ease: 'power3.out' });
}

function animMobileSheetClose(cb) {
  if (typeof gsap === 'undefined') { cb && cb(); return; }
  const overlay = document.getElementById('mobileNavMoreOverlay');
  const sheet   = document.getElementById('mobileNavMoreSheet');
  const tl = gsap.timeline({ onComplete: cb });
  if (sheet)   tl.to(sheet,   { y: '100%', duration: 0.28, ease: 'power3.in' });
  if (overlay) tl.to(overlay, { opacity: 0, duration: 0.18 }, '-=0.1');
}

/* ────────────────────────────────────────────────────────────
   SALA PERSONAL
──────────────────────────────────────────────────────────── */
function animSalaItems() {
  if (typeof gsap === 'undefined') return;
  const items = document.querySelectorAll('#salaRoom .sala-item');
  if (!items.length) return;
  gsap.fromTo(items,
    { scale: 1.12, opacity: 0 },
    { scale: 1, opacity: 1, stagger: 0.06, duration: 0.35, ease: 'back.out(1.5)' }
  );
}

function animSalaItemSelect(el) {
  if (!el || typeof gsap === 'undefined') return;
  gsap.fromTo(el, { scale: 0.93 }, { scale: 1, duration: 0.22, ease: 'back.out(2)' });
}

/* ────────────────────────────────────────────────────────────
   BOOT SEQUENCE
──────────────────────────────────────────────────────────── */
function animBootSequence() {
  if (typeof gsap === 'undefined') return;
  const tl = gsap.timeline({ delay: 0.2 });

  const topBar   = document.querySelector('.top-bar');
  const sidebar  = document.querySelector('.sidebar');
  const avatar   = document.querySelector('.hero-avatar-btn');
  const heroName = document.getElementById('heroName');
  const heroTitle= document.getElementById('heroTitle');
  const xpWrap   = document.querySelector('.xp-bar-wrap, .xp-bar');
  const hpWrap   = document.querySelector('.hp-bar-wrap, .hp-bar');
  const manaWrap = document.querySelector('.mana-bar-wrap, .mana-bar');
  const navItems = document.querySelectorAll('.sidebar-item');
  const viewTabs = document.querySelectorAll('.view-tab');

  if (topBar)    tl.from(topBar,    { y: -36, opacity: 0, duration: 0.4, clearProps: 'all' },                   0);
  if (sidebar)   tl.from(sidebar,   { x: -32, opacity: 0, duration: 0.45, ease: 'power3.out', clearProps: 'all' }, 0.05);
  if (avatar)    tl.from(avatar,    { scale: 0.5, opacity: 0, duration: 0.5, ease: 'back.out(1.7)', clearProps: 'all' }, 0.2);
  if (heroName)  tl.from(heroName,  { x: -14, opacity: 0, duration: 0.3, clearProps: 'all' },                   0.35);
  if (heroTitle) tl.from(heroTitle, { x: -10, opacity: 0, duration: 0.28, clearProps: 'all' },                  0.4);
  if (xpWrap)    tl.from(xpWrap,    { scaleX: 0, transformOrigin: 'left', opacity: 0, duration: 0.4, clearProps: 'all' }, 0.42);
  if (hpWrap)    tl.from(hpWrap,    { scaleX: 0, transformOrigin: 'left', opacity: 0, duration: 0.38, clearProps: 'all' }, 0.47);
  if (manaWrap)  tl.from(manaWrap,  { scaleX: 0, transformOrigin: 'left', opacity: 0, duration: 0.36, clearProps: 'all' }, 0.51);
  if (navItems.length) tl.from(navItems, { x: -16, opacity: 0, stagger: 0.04, duration: 0.3, clearProps: 'all' }, 0.28);
  if (viewTabs.length) tl.from(viewTabs, { y: -12, opacity: 0, stagger: 0.04, duration: 0.3, clearProps: 'all' }, 0.22);

  // Boss banners y quests con delay extra (su render termina después del boot)
  tl.call(() => {
    animBossCards();
    animPageItems('.quest-item');
  }, [], 0.7);
}
