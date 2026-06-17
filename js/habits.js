'use strict';

/* ── HÁBITOS BIDIRECCIONALES +/- ───────────────────────────────
   type = 'habit' en dungeon_quests.
   Positivo (por defecto): completar = +20 XP +8 oro +5 HP
   Negativo (tags contiene 'habit-'): activar = -8 HP
   Se resetean diariamente igual que dailies.
   ─────────────────────────────────────────────────────────── */

const HABIT_XP     = 20;
const HABIT_GOLD   = 8;
const HABIT_HP_POS = 5;
const HABIT_HP_NEG = 8;

function isHabitNegative(q) {
  return (q.tags || '').toLowerCase().includes('habit-');
}

async function completeHabitQuest(q) {
  if (!q || q.done || !hero) return;
  const now = new Date().toISOString();
  await db.from('dungeon_quests').update({ done: true, done_at: now }).eq('id', q.id);
  q.done = true; q.done_at = now;

  const isNeg = isHabitNegative(q);

  if (!isNeg) {
    await addXP(HABIT_XP, 'side', null);
    if (typeof addGold === 'function') addGold(HABIT_GOLD);
    const newHp = Math.min(hero.hp_max || 100, (hero.hp || 100) + HABIT_HP_POS);
    hero.hp = newHp;
    await saveHero({ hp: newHp, quests_done: (hero.quests_done || 0) + 1 });
    toast('✅', `Hábito cumplido · +${HABIT_XP} XP · +${HABIT_HP_POS} HP`);
  } else {
    const newHp = Math.max(10, (hero.hp || 100) - HABIT_HP_NEG);
    hero.hp = newHp;
    await saveHero({ hp: newHp });
    toast('⛔', `Hábito negativo ocurrió · -${HABIT_HP_NEG} HP`);
  }

  renderHeroUI();
  renderQuestList();
  checkAchievements();
  if (typeof registerCombo === 'function' && !isNeg) registerCombo();
}

function renderHabitItem(q) {
  const isNeg  = isHabitNegative(q);
  const dir    = isNeg ? 'neg' : 'pos';
  const icon   = isNeg ? '⛔' : '✅';
  const label  = isNeg ? 'Negativo' : 'Positivo';
  const btnLbl = isNeg ? '✗ Ocurrió' : '✓ Hecho';
  const effect = isNeg ? `-${HABIT_HP_NEG} HP` : `+${HABIT_HP_POS} HP · +${HABIT_XP} XP`;

  return `<div class="quest-item habit-item habit-${dir} ${q.done ? 'done' : ''}" data-qid="${q.id}">
    <div class="habit-icon">${icon}</div>
    <div class="quest-body" onclick="openEditModal('${q.id}')">
      <div class="quest-name">${escHtml(q.name)}</div>
      <div class="quest-meta">
        <span class="quest-type-badge habit-badge-${dir}">${label}</span>
        <span style="font-size:10px;color:var(--text3)">${effect}</span>
      </div>
    </div>
    <div class="quest-actions">
      ${!q.done
        ? `<button class="complete-btn habit-btn-${dir}" onclick="completeHabitQuest(quests.find(x=>x.id==='${q.id}'))" title="${btnLbl}">${isNeg ? '✗' : '✓'}</button>`
        : `<span class="habit-done-mark">${isNeg ? '⚠️' : '🏅'}</span>`}
    </div>
  </div>`;
}
