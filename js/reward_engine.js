'use strict';

/* Evita economía rota y conserva una explicación corta de cada recompensa. */
const REWARD_CAPS = { xp: 4, gold: 3 };
function balanceReward(kind, base, proposed) {
  const safeBase = Math.max(1, Number(base) || 1);
  const cap = REWARD_CAPS[kind] || 3;
  const limit = Math.round(safeBase * cap);
  const amount = Math.max(0, Math.min(Math.round(proposed || 0), limit));
  return { amount, capped: proposed > limit, multiplier: +(amount / safeBase).toFixed(2), limit };
}
function recordRewardLedger(entry) {
  if (!hero) return;
  const key = `dungeon-reward-ledger-${hero.id}`;
  let rows = []; try { rows = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
  rows.unshift({ ...entry, at: Date.now() });
  localStorage.setItem(key, JSON.stringify(rows.slice(0, 25)));
}
function lastRewardSummary() {
  if (!hero) return null;
  try { return JSON.parse(localStorage.getItem(`dungeon-reward-ledger-${hero.id}`) || '[]')[0] || null; } catch { return null; }
}
