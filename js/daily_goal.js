'use strict';

/* ── META DIARIA DE XP ─────────────────────────────────────────
   Barra de progreso hacia un objetivo configurable (default 300 XP/día).
   Persiste xp ganado hoy en hero.daily_goal_xp y hero.daily_goal_date.
   ─────────────────────────────────────────────────────────── */

const DEFAULT_DAILY_GOAL = 300;

function getDailyGoal() {
  return hero?.daily_goal || DEFAULT_DAILY_GOAL;
}

function getDailyGoalToday() {
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  if (hero?.daily_goal_date !== today) return 0;
  return hero?.daily_goal_xp || 0;
}

async function addDailyGoalXP(amount) {
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const current = getDailyGoalToday();
  const newAmt = current + amount;
  const goal = getDailyGoal();
  await saveHero({ daily_goal_xp: newAmt, daily_goal_date: today });
  renderDailyGoalBar();
  if (current < goal && newAmt >= goal) {
    toast('🎯', `¡Meta diaria alcanzada! ${newAmt} XP`);
  }
}

function renderDailyGoalBar() {
  const bar = document.getElementById('dailyGoalBar');
  const fill = document.getElementById('dgbFill');
  const text = document.getElementById('dgbText');
  if (!bar || !fill || !text) return;
  const earned = getDailyGoalToday();
  const goal   = getDailyGoal();
  if (goal <= 0) { bar.style.display = 'none'; return; }
  bar.style.display = 'block';
  const pct = Math.min(100, Math.round((earned / goal) * 100));
  fill.style.width = pct + '%';
  text.textContent = `${earned} / ${goal} XP`;
  if (pct >= 100) {
    fill.style.background = 'linear-gradient(90deg, #4ade80, #22d3ee)';
    text.style.color = '#4ade80';
  } else {
    fill.style.background = 'linear-gradient(90deg, var(--accent), #c4b5fd)';
    text.style.color = '';
  }
}
