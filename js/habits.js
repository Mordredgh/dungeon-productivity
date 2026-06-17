'use strict';

/* ── HÁBITOS BIDIRECCIONALES +/- ───────────────────────────────
   type = 'habit' en dungeon_quests.
   Positivo (por defecto): completar = +20 XP +8 oro +5 HP
   Negativo (tags contiene 'habit-'): activar = -8 HP
   Reminder: tags contiene 'reminder-HH:MM' p.ej. 'reminder-07:30'
   Se resetean diariamente igual que dailies.
   ─────────────────────────────────────────────────────────── */

const HABIT_XP     = 20;
const HABIT_GOLD   = 8;
const HABIT_HP_POS = 5;
const HABIT_HP_NEG = 8;

function isHabitNegative(q) {
  return (q.tags || '').toLowerCase().includes('habit-');
}

function getHabitReminderTime(q) {
  const m = (q.tags || '').match(/reminder-(\d{1,2}:\d{2})/i);
  return m ? m[1] : null;
}

/* Check all habit reminders — call on boot and every minute */
function checkHabitReminders() {
  if (!hero || typeof dungeonPush !== 'function') return;
  const now   = new Date();
  const hhmm  = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const today = now.toISOString().split('T')[0];
  quests.filter(q => q.type === 'habit' && !q.done).forEach(q => {
    const rt = getHabitReminderTime(q);
    if (!rt || rt !== hhmm) return;
    const key = `dungeon-habit-reminder-${q.id}-${today}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    const isNeg = isHabitNegative(q);
    dungeonPush(
      isNeg ? `⚠️ Evita: ${q.name}` : `✅ Hábito pendiente: ${q.name}`,
      isNeg ? 'Recuerda no hacer este hábito negativo hoy.' : '¡Es hora de tu hábito! Ábrelo en el Dungeon.',
      '/'
    );
  });
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
  const rt     = getHabitReminderTime(q);
  const reminderBadge = rt ? `<span class="habit-reminder-badge">🔔 ${rt}</span>` : '';

  return `<div class="quest-item habit-item habit-${dir} ${q.done ? 'done' : ''}" data-qid="${q.id}">
    <div class="habit-icon">${icon}</div>
    <div class="quest-body" onclick="openEditModal('${q.id}')">
      <div class="quest-name">${escHtml(q.name)}</div>
      <div class="quest-meta">
        <span class="quest-type-badge habit-badge-${dir}">${label}</span>
        <span style="font-size:10px;color:var(--text3)">${effect}</span>
        ${reminderBadge}
      </div>
    </div>
    <div class="quest-actions">
      <button class="habit-pom-btn" title="Vincular Pomodoro"
        onclick="event.stopPropagation();setActiveQuest('${q.id}')">🍅</button>
      ${!q.done
        ? `<button class="complete-btn habit-btn-${dir}" onclick="completeHabitQuest(quests.find(x=>x.id==='${q.id}'))" title="${btnLbl}">${isNeg ? '✗' : '✓'}</button>`
        : `<span class="habit-done-mark">${isNeg ? '⚠️' : '🏅'}</span>`}
    </div>
  </div>`;
}
