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

  let xpAmt = calcQuestXP(q);

  // XP multipliers from RPG systems
  const today = new Date().toISOString().split('T')[0];
  const potionMult    = typeof getPotionMult    === 'function' ? getPotionMult()    : 1;
  const berserkerExp  = parseInt(localStorage.getItem('dungeon-berserker-exp') || '0');
  const berserkerMult = berserkerExp > Date.now() ? 2 : 1;
  const weatherMult   = typeof getWeatherXPMult === 'function' ? getWeatherXPMult() : 1;
  // famBonus removed — habilidades de mascota reemplazan al familiar

  // Transmutación (mago): next side/daily → 100 XP
  if (localStorage.getItem('dungeon-transmute-next') && (q.type === 'side' || q.type === 'daily')) {
    xpAmt = 100; localStorage.removeItem('dungeon-transmute-next');
  }
  // Lluvia de flechas (arquero): next weekly → 3×
  if (localStorage.getItem('dungeon-arrow-rain') && q.type === 'weekly') {
    xpAmt *= 3; localStorage.removeItem('dungeon-arrow-rain');
  }
  // Visión estratégica (fundador): next 5 quests → +25%
  const stratCount = parseInt(localStorage.getItem('dungeon-strategic-count') || '0');
  if (stratCount > 0) {
    xpAmt = Math.round(xpAmt * 1.25);
    localStorage.setItem('dungeon-strategic-count', stratCount - 1);
  }
  // Double-next event
  if (localStorage.getItem('dungeon-double-next')) {
    xpAmt *= 2; localStorage.removeItem('dungeon-double-next');
  }
  // Main bonus event (+20 XP for main quests today)
  if (q.type === 'main' && localStorage.getItem('dungeon-main-bonus-' + today)) {
    xpAmt += 20;
  }
  // Apply multipliers
  xpAmt = Math.round(xpAmt * potionMult * berserkerMult * weatherMult);

  // Habilidades de mascota activa
  if (typeof getPetEffect === 'function') {
    if (q.type === 'daily') xpAmt += getPetEffect('daily_xp') || 0;
    const allMult = getPetEffect('all_xp');
    if (allMult) {
      xpAmt = Math.round(xpAmt * (1 + allMult));
    } else {
      const epicMult = getPetEffect('epic_xp');
      if (epicMult && (q.priority === 'epico' || q.priority === 'legendario' || q.priority === 'mitico')) {
        xpAmt = Math.round(xpAmt * (1 + epicMult));
      }
    }
    if (q.type === 'side') {
      const sideCrit = getPetEffect('side_crit');
      if (sideCrit && Math.random() < sideCrit) {
        xpAmt *= 2;
        toast('🌑', '¡Golpe Crítico de Pantera! 2× XP');
      }
    }
  }

  await addXP(xpAmt, q.type, el);

  // Gold earned
  const goldBase = GOLD_TABLE ? (GOLD_TABLE[q.type] || 10) : 10;
  const goldMult = typeof getGoldMult === 'function' ? getGoldMult() : 1;
  const goldAmt  = Math.round(goldBase * goldMult * (localStorage.getItem('dungeon-double-next-gold') ? 2 : 1));
  localStorage.removeItem('dungeon-double-next-gold');
  if (typeof addGold === 'function') addGold(goldAmt);

  // Boss damage (non-daily quests hurt the boss more)
  if (typeof damageBoss === 'function') {
    damageBoss(q.type === 'main' ? 40 : q.type === 'weekly' ? 30 : 20);
  }

  // Familiar mood update
  if (typeof renderFamiliar === 'function') setTimeout(renderFamiliar, 400);

  // HP recovery on quest completion (all classes)
  if (q.type === 'main') {
    const petHpBonus = typeof getPetEffect === 'function' ? (getPetEffect('main_hp') || 0) : 0;
    const hpGain = 25 + petHpBonus;
    const newHp = Math.min((hero.hp || 100) + hpGain, hero.hp_max || 100);
    hero.hp = newHp;
    await saveHero({ hp: newHp });
    const hpMsg = petHpBonus ? `¡Misión Principal! +${hpGain} HP (🐾 +${petHpBonus})` : `¡Misión Principal! +25 HP`;
    setTimeout(() => toast('💚', hpMsg), 600);
  } else if (q.type === 'daily') {
    const todayDailies = quests.filter(x => x.type === 'daily' && x.id !== id);
    const allDone = todayDailies.length > 0 && todayDailies.every(x => x.done);
    if (allDone) {
      const newHp = hero.hp_max || 100;
      hero.hp = newHp;
      await saveHero({ hp: newHp });
      setTimeout(() => toast('✨', '¡Todas las dailies completadas! HP al máximo'), 600);
    } else {
      const gain = hero.hero_class === 'clerigo' ? 10 : 5;
      const newHp = Math.min((hero.hp || 100) + gain, hero.hp_max || 100);
      hero.hp = newHp;
      await saveHero({ hp: newHp });
      setTimeout(() => toast('💚', `+${gain} HP`), 600);
    }
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

  // Loot drop — aparece 1.2s después del toast de completada
  if (typeof rollLoot === 'function') {
    const _goldForLoot = goldAmt;
    setTimeout(async () => {
      const loots = rollLoot(q.priority || 'normal');
      await grantLoot(loots, _goldForLoot);
    }, 1200);
  }

  checkAchievements();
  renderQuestList();
  renderKanban();
  renderHistory();
  renderStats();
  updateBossBanner();
  if (typeof generateDiaryEntry === 'function') generateDiaryEntry();
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
