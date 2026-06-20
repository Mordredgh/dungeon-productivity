'use strict';

async function loadGoals() {
  if (!hero) return;
  const { data } = await db.from('dungeon_goals').select('*').eq('hero_id', hero.id).order('created_at', { ascending: false });
  goals = data || [];
}

function _goalProgress(goal) {
  const linked = quests.filter(q => q.goal_id === goal.id);
  const done   = linked.filter(q => q.done).length;
  const pct    = linked.length ? Math.round((done / linked.length) * 100) : 0;
  return { linked: linked.length, done, pct };
}

function openGoalModal(id) {
  const goal = id ? goals.find(g => g.id === id) : null;
  document.getElementById('editGoalId').value    = goal ? goal.id : '';
  document.getElementById('editGoalName').value  = goal ? goal.name : '';
  document.getElementById('editGoalDate').value  = goal ? (goal.target_date || '') : '';
  document.getElementById('editGoalNotes').value = goal ? (goal.notes || '') : '';
  document.getElementById('deleteGoalBtn').style.display = goal ? '' : 'none';
  openModal('goalModal');
}

async function saveGoal() {
  const id   = document.getElementById('editGoalId').value;
  const name = document.getElementById('editGoalName').value.trim();
  if (!name || !hero) return;
  const patch = {
    name,
    target_date: document.getElementById('editGoalDate').value || null,
    notes: document.getElementById('editGoalNotes').value.trim()
  };
  if (id) {
    await db.from('dungeon_goals').update(patch).eq('id', id);
    const g = goals.find(x => x.id === id);
    if (g) Object.assign(g, patch);
  } else {
    const { data } = await db.from('dungeon_goals').insert({ ...patch, hero_id: hero.id }).select().single();
    if (data) goals.unshift(data);
  }
  closeModal('goalModal');
  renderGoals();
  toast('🎯', 'Meta guardada.');
}

async function deleteGoal() {
  const id = document.getElementById('editGoalId').value;
  if (!id) return;
  await db.from('dungeon_goals').delete().eq('id', id);
  await db.from('dungeon_quests').update({ goal_id: null }).eq('goal_id', id);
  quests.forEach(q => { if (q.goal_id === id) q.goal_id = null; });
  goals = goals.filter(g => g.id !== id);
  closeModal('goalModal');
  renderGoals();
  toast('🗑️', 'Meta eliminada.');
}

function populateGoalSelect(selectedId) {
  const sel = document.getElementById('editQGoal');
  if (!sel) return;
  sel.innerHTML = '<option value="">Sin meta</option>' +
    goals.map(g => `<option value="${g.id}" ${g.id === selectedId ? 'selected' : ''}>${escHtml(g.name)}</option>`).join('');
}

function renderGoals() {
  const el = document.getElementById('goalsContent');
  if (!el) return;
  if (!goals.length) {
    el.innerHTML = `<div class="empty-state">
      <h3>Sin metas todavía</h3>
      <p>Crea una meta grande y vincula misiones para llevar el progreso.</p>
    </div>`;
    return;
  }
  el.innerHTML = `<div class="goals-grid">${goals.map(g => {
    const prog = _goalProgress(g);
    const overdue = g.target_date && g.target_date < new Date().toISOString().split('T')[0] && prog.pct < 100;
    return `
      <div class="goal-card ${g.done ? 'goal-done' : ''}" onclick="openGoalModal('${g.id}')">
        <div class="goal-card-name">${escHtml(g.name)}</div>
        ${g.target_date ? `<div class="goal-card-date ${overdue ? 'goal-overdue' : ''}">📅 ${g.target_date}</div>` : ''}
        <div class="goal-progress-wrap">
          <div class="goal-progress-bg"><div class="goal-progress-fill" style="width:${prog.pct}%"></div></div>
          <span class="goal-progress-label">${prog.pct}%</span>
        </div>
        <div class="goal-card-meta">${prog.done}/${prog.linked} misiones vinculadas</div>
        ${g.notes ? `<div class="goal-card-notes">${escHtml(g.notes)}</div>` : ''}
      </div>`;
  }).join('')}</div>`;
  if (typeof animPageItems === 'function') animPageItems('.goal-card', el);
}

document.getElementById('saveGoalBtn').addEventListener('click', saveGoal);
document.getElementById('deleteGoalBtn').addEventListener('click', deleteGoal);
