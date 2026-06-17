'use strict';

/* ── SISTEMA DE COMBOS ─────────────────────────────────────────
   Completar misiones en ráfaga activa multiplicador de XP.
   Ventana: 15 min entre completaciones para mantener el combo.
   ─────────────────────────────────────────────────────────── */

const COMBO_WINDOW_MS = 15 * 60 * 1000;
const _COMBO_TIERS = [
  { min: 4, mult: 1.5,  label: '⚡ COMBO LEGENDARIO!' },
  { min: 3, mult: 1.25, label: '🔥🔥 Combo x3'        },
  { min: 2, mult: 1.1,  label: '🔥 Combo x2'          },
];

let _comboCount  = parseInt(localStorage.getItem('dungeon-combo-count') || '0');
let _comboLastAt = parseInt(localStorage.getItem('dungeon-combo-last')  || '0');

function registerCombo() {
  const now = Date.now();
  _comboCount  = now - _comboLastAt > COMBO_WINDOW_MS ? 1 : Math.min(_comboCount + 1, 8);
  _comboLastAt = now;
  localStorage.setItem('dungeon-combo-count', String(_comboCount));
  localStorage.setItem('dungeon-combo-last',  String(_comboLastAt));

  const tier = _COMBO_TIERS.find(t => _comboCount >= t.min);
  if (tier) {
    const bonus = Math.round((tier.mult - 1) * 100);
    toast(tier.label[0], `${tier.label} · +${bonus}% XP`);
  }
  renderComboChip();
}

function getComboMult() {
  if (Date.now() - _comboLastAt > COMBO_WINDOW_MS) return 1;
  return _COMBO_TIERS.find(t => _comboCount >= t.min)?.mult ?? 1;
}

function renderComboChip() {
  const el = document.getElementById('comboChip');
  if (!el) return;
  const active = Date.now() - _comboLastAt <= COMBO_WINDOW_MS;
  const tier   = active ? _COMBO_TIERS.find(t => _comboCount >= t.min) : null;
  el.style.display = tier ? 'inline-flex' : 'none';
  if (tier) {
    el.textContent   = `${tier.label} ×${_comboCount}`;
    el.dataset.tier  = String(tier.min);
  }
}

// Refresh chip every minute to expire naturally
setInterval(renderComboChip, 60000);
