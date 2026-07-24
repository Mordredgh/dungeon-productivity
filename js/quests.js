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
  updateBossBanner();
  toast('⚔️', `Misión creada: ${q.name}`);
  showContratoEffect(q.name);
}

const _completingQuestIds = new Set();
async function completeQuest(id, el) {
  const q = quests.find(x => x.id === id);
  if (!q || q.done) return;
  // Guard contra doble envío (doble tap, red lenta, o el auto-complete de
  // subtareas disparando junto con un click manual) — sin esto, dos llamadas
  // concurrentes mandan el mismo p_quest_id al RPC y la segunda choca contra
  // la constraint única de dungeon_reward_ledger (409) sin aplicar nada.
  if (_completingQuestIds.has(id)) return;
  _completingQuestIds.add(id);
  try {
    return await _completeQuestInner(id, el, q);
  } finally {
    _completingQuestIds.delete(id);
  }
}

// Tope diario por rareza — evita marcar todo como Épico/Legendario/Mítico
// para inflar botín sin límite. Común/Normal quedan libres a propósito.
const PRIORITY_DAILY_CAP   = { epico: 3, legendario: 1, mitico: 1 };
const PRIORITY_CAP_LABEL   = { epico: 'Épicas', legendario: 'Legendarias', mitico: 'Míticas' };
function priorityCapReached(q) {
  const cap = PRIORITY_DAILY_CAP[q.priority];
  if (cap == null) return false;
  const today = new Date().toISOString().split('T')[0];
  const doneToday = quests.filter(x =>
    x.priority === q.priority && x.done && x.done_at && x.done_at.startsWith(today)
  ).length;
  if (doneToday < cap) return false;
  toast('🚫', `Ya completaste el máximo de misiones ${PRIORITY_CAP_LABEL[q.priority]} hoy (${cap}).`);
  return true;
}

async function _completeQuestInner(id, el, q) {
  if (priorityCapReached(q)) return;

  // Ensure streak is up-to-date even if app was left open overnight
  if (typeof checkDailyStreak === 'function') await checkDailyStreak();

  // Habits use their own simpler flow
  if (q.type === 'habit') {
    if (typeof completeHabitQuest === 'function') await completeHabitQuest(q);
    return;
  }

  const { data: rewards, error } = await db.rpc('complete_dungeon_quest', { p_quest_id: id });
  const reward = Array.isArray(rewards) ? rewards[0] : rewards;
  if (error || !reward) {
    console.error('complete_dungeon_quest', error);
    toast('⚠️', rpcErrorMessage(error, 'No se pudo completar la misión. Tu recompensa no fue aplicada.'));
    return;
  }
  q.done = true;
  q.done_at = reward.done_at;
  const xpAmt = Number(reward.xp_awarded || 0);
  const goldAmt = Number(reward.gold_awarded || 0);
  Object.assign(hero, {
    xp_total: Number(reward.xp_total || hero.xp_total || 0),
    gold: Number(reward.gold || hero.gold || 0),
    level: Number(reward.level || hero.level || 1),
    quests_done: Number(reward.quests_done || hero.quests_done || 0),
    main_done: Number(reward.main_done || hero.main_done || 0),
  });
  deriveHero();
  renderHeroUI();
  renderGold();
  if (typeof recordRewardLedger === 'function') recordRewardLedger({ quest:q.name, type:q.type, xp:xpAmt, gold:goldAmt, server:true });
  if (typeof spawnGoldParticle === 'function') spawnGoldParticle(goldAmt, el);
  // Runas solo dropean de bosses (ver rpg.js damageBoss)

  // Apuesta del Dungeon — si ganaste a tiempo, recuperas el doble
  if (typeof resolveWagerWin === 'function') resolveWagerWin(q);

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

  if (typeof getMapExpeditionBonus === 'function') {
    const expeditionHeal = getMapExpeditionBonus(q, 'recovery');
    if (expeditionHeal && hero) {
      const newHp = Math.min((hero.hp || 0) + expeditionHeal, hero.hp_max || 100);
      hero.hp = newHp;
      await saveHero({ hp: newHp });
      setTimeout(() => toast('🛡️', `Refugio de expedición: +${expeditionHeal} HP`), 400);
    }
  }

  if (typeof trackWeekQuest === 'function') trackWeekQuest();

  // Secret class progress tracking
  if (typeof getSecretProgress === 'function') {
    const _sp = getSecretProgress();
    const _hour = new Date().getHours();
    if (_hour >= 0 && _hour < 5) {
      _sp.midnight_total = (_sp.midnight_total || 0) + 1;
      const _today = new Date().toISOString().split('T')[0];
      const _lastDate = _sp.midnight_last_date;
      if (_lastDate) {
        const _diff = Math.round((new Date(_today) - new Date(_lastDate)) / 86400000);
        _sp.midnight_streak = _diff === 1 ? (_sp.midnight_streak || 0) + 1 : 1;
      } else { _sp.midnight_streak = 1; }
      _sp.midnight_last_date = _today;
    }
    const _tags = Array.isArray(q.tags) ? q.tags
      : (typeof q.tags === 'string' && q.tags ? q.tags.split(',').map(t => t.trim()) : []);
    if (_tags.some(t => t.toLowerCase() === 'salud')) {
      _sp.health_total = (_sp.health_total || 0) + 1;
    }
    await saveSecretProgress(_sp);
    checkSecretClassUnlocks();
  }

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

  // Reward modal — aparece 700ms después del toast de completada
  if (typeof rollLoot === 'function') {
    const _gold = goldAmt, _xp = xpAmt, _name = q.name, _type = q.type;
    setTimeout(async () => {
      const loots = rollLoot(q.priority || 'normal');
      if (!undoUsed) await grantLoot(loots, _gold, _xp, _name, _type, true);
    }, 700);
  }

  // Registrar combo después de completar
  if (typeof registerCombo === 'function') registerCombo();

  // Escudos de Misión — 3 del mismo tipo seguidas activa escudo de racha
  _checkMissionShield(q.type);

  checkAchievements();

  // Loot drop animation
  if (typeof spawnLootDrop === 'function') {
    spawnLootDrop(xpAmt, goldAmt, q.rarity || 'common');
  }
  // Daily goal tracking
  if (typeof addDailyGoalXP === 'function') {
    addDailyGoalXP(xpAmt);
  }

  // Drops de materiales para sets de clases secretas
  if (typeof trySecretMatDrop === 'function') await trySecretMatDrop(q);

  // Progreso de serie de misiones exclusivas de Facción
  if (typeof checkFactionExclusiveProgress === 'function') await checkFactionExclusiveProgress(id);
  if (typeof addActivePetBond === 'function') addActivePetBond(1);

  renderQuestList();
  renderHistory();
  renderStats();
  updateBossBanner();
  if (typeof generateDiaryEntry === 'function') generateDiaryEntry();
}

async function undoComplete() {
  if (!lastCompletedUndo) return;
  const { id } = lastCompletedUndo;
  const q = quests.find(x => x.id === id);
  if (!q) return;
  const { data: reverted, error } = await db.rpc('undo_dungeon_quest', { p_quest_id: id });
  const state = Array.isArray(reverted) ? reverted[0] : reverted;
  if (error || !state) {
    toast('⚠️', rpcErrorMessage(error, 'No se pudo revertir la misión. El progreso se mantiene.'));
    return;
  }
  q.done = false; q.done_at = null;
  Object.assign(hero, {
    xp_total: Number(state.xp_total || 0), gold: Number(state.gold || 0),
    level: Number(state.level || 1), quests_done: Number(state.quests_done || 0),
    main_done: Number(state.main_done || 0),
  });
  deriveHero();
  renderGold();
  lastCompletedUndo = null;
  toast('↩️', 'Misión revertida');
  renderQuestList(); renderHeroUI(); renderStats(); updateBossBanner();
}

async function deleteQuest(id) {
  await db.from('dungeon_quests').delete().eq('id', id);
  quests = quests.filter(x => x.id !== id);
  closeModal('editQuestModal');
  renderQuestList();
  updateBossBanner();
  toast('🗑️', 'Misión eliminada');
}

async function updateQuest(id, patch) {
  const { error } = await db.from('dungeon_quests').update(patch).eq('id', id);
  if (error) { toast('⚠️', 'No se pudo guardar la misión. Inténtalo otra vez.'); return false; }
  const q = quests.find(x => x.id === id);
  if (q) Object.assign(q, patch);
  closeModal('editQuestModal');
  renderQuestList();
  updateBossBanner();
  toast('✏️', 'Misión actualizada');
  return true;
}

/* ── ESCUDOS DE MISIÓN ──────────────────────────────────────────
   3 misiones del mismo tipo seguidas → escudo de racha.       */
async function _checkMissionShield(type) {
  if (!hero || !type) return;
  let hist; try { hist = JSON.parse(localStorage.getItem('dungeon-type-history') || '[]'); } catch { hist = []; }
  hist.push(type);
  const recent = hist.slice(-3);
  localStorage.setItem('dungeon-type-history', JSON.stringify(hist.slice(-20)));
  if (recent.length === 3 && recent.every(t => t === type)) {
    if (!hero.streak_shield) {
      hero.streak_shield = true;
      await saveHero({ streak_shield: true });
      const typeLabels = { main:'épicas', side:'encargos', daily:'búsquedas', weekly:'crónicas' };
      toast('🛡️', `¡Escudo de Misión! 3 ${typeLabels[type]||type} seguidas. Tu racha está protegida.`);
      localStorage.setItem('dungeon-type-history', '[]');
    }
  }
}


/* ── Tag-based class XP bonus ──────────────────────────────────
   Misiones cuyo tag coincide con la especialidad de la clase
   reciben un multiplicador de XP adicional.
   ─────────────────────────────────────────────────────────── */
function _getTagClassBonus(q) {
  if (!hero || !q.tags) return 1;
  const tags = q.tags.toLowerCase();
  const cls  = hero.hero_class || '';
  const MAP = {
    guerrero: { mult: 2.0, keys: ['ejercicio', 'gym', 'deporte', 'fitness', 'entrena', 'fisico', 'físico'] },
    mago:     { mult: 2.0, keys: ['estudio', 'lectura', 'aprender', 'mental', 'focus', 'leer', 'curso'] },
    clerigo:  { mult: 2.0, keys: ['salud', 'meditacion', 'meditación', 'meditar', 'yoga', 'descanso', 'dormir'] },
    picaro:   { mult: 1.5, keys: ['dinero', 'negocio', 'venta', 'cliente', 'money', 'cobrar', 'ingreso'] },
    arquero:  { mult: 1.5, keys: ['habito', 'hábito', 'habit', 'rutina', 'diario', 'consistencia'] },
    fundador: { mult: 1.3, keys: ['meta', 'objetivo', 'proyecto', 'startup', 'emprender', 'lanzar'] },
  };
  const bonus = MAP[cls];
  if (!bonus) return 1;
  return bonus.keys.some(k => tags.includes(k)) ? bonus.mult : 1;
}
