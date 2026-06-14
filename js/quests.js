/* QUESTS */
async function loadQuests() {
  const { data } = await db.from('dungeon_quests').select('*').order('created_at', { ascending: false });
  quests = data || [];
  try { localStorage.setItem('dungeon-cache-quests', JSON.stringify(quests)); } catch {}
}

async function addQuest(q) {
  const { data, error } = await db.from('dungeon_quests').insert(q).select().single();
  if (error || !data) {
    console.error('addQuest error:', error?.message, error?.details, error?.hint, error?.code, JSON.stringify(error));
    toast('❌', `Error ${error?.code}: ${error?.message || 'sin datos'}`);
    return;
  }
  quests.unshift(data);
  renderQuestList();
  renderKanban();
  updateBossBanner();
  toast('⚔️', `Misión creada: ${q.name}`);
  showContratoEffect(q.name);
}

async function completeQuest(id, el) {
  const q = quests.find(x => x.id === id);
  if (!q || q.done) return;

  const now = new Date().toISOString();
  await db.from('dungeon_quests').update({ done: true, done_at: now }).eq('id', id);
  q.done = true; q.done_at = now;

  const xpAmt = calcQuestXP(q);
  await addXP(xpAmt, q.type, el);

  if (q.type === 'daily' && hero.hero_class === 'clerigo') {
    const newHp = Math.min(hero.hp + 10, hero.hp_max);
    await saveHero({ hp: newHp });
  }

  const patch = { quests_done: (hero.quests_done || 0) + 1 };
  if (q.type === 'main') patch.main_done = (hero.main_done || 0) + 1;
  await saveHero(patch);

  // Undo state
  lastCompletedUndo = { id, xpAmt, q: { ...q } };
  let undoUsed = false;
  const undoTimeout = setTimeout(() => { if (!undoUsed) lastCompletedUndo = null; }, 5500);

  const msg = COMPLETIONS[Math.floor(Math.random() * COMPLETIONS.length)];
  const container = document.getElementById('toastContainer');
  const div = document.createElement('div');
  div.className = 'toast';
  div.innerHTML = `<span class="toast-icon">✅</span><span class="toast-msg">${escHtml(msg)}</span><span class="toast-undo-btn" id="undoBtn">Deshacer</span>`;
  container.appendChild(div);
  div.querySelector('#undoBtn').addEventListener('click', async () => {
    undoUsed = true;
    clearTimeout(undoTimeout);
    div.remove();
    await undoComplete();
  });
  setTimeout(() => { if (div.parentNode) div.remove(); }, 5000);

  checkAchievements();
  renderQuestList();
  renderKanban();
  renderHistory();
  renderStats();
  updateBossBanner();
}

async function undoComplete() {
  if (!lastCompletedUndo) return;
  const { id, xpAmt } = lastCompletedUndo;
  const q = quests.find(x => x.id === id);
  if (!q) return;
  await db.from('dungeon_quests').update({ done: false, done_at: null }).eq('id', id);
  q.done = false; q.done_at = null;
  const newTotal = Math.max(0, (hero.xp_total || 0) - xpAmt);
  const newLevel = calcLevel(newTotal);
  const patch = {
    xp_total: newTotal, level: newLevel,
    quests_done: Math.max(0, (hero.quests_done || 0) - 1)
  };
  if (q.type === 'main') patch.main_done = Math.max(0, (hero.main_done || 0) - 1);
  await saveHero(patch);
  lastCompletedUndo = null;
  toast('↩️', 'Misión revertida');
  renderQuestList(); renderKanban(); renderHeroUI(); renderStats(); updateBossBanner();
}

async function deleteQuest(id) {
  await db.from('dungeon_quests').delete().eq('id', id);
  quests = quests.filter(x => x.id !== id);
  closeModal('editQuestModal');
  renderQuestList();
  renderKanban();
  updateBossBanner();
  toast('🗑️', 'Misión eliminada');
}

async function updateQuest(id, patch) {
  await db.from('dungeon_quests').update(patch).eq('id', id);
  const q = quests.find(x => x.id === id);
  if (q) Object.assign(q, patch);
  closeModal('editQuestModal');
  renderQuestList();
  renderKanban();
  updateBossBanner();
  toast('✏️', 'Misión actualizada');
}
