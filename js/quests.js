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

async function completeQuest(id, el) {
  const q = quests.find(x => x.id === id);
  if (!q || q.done) return;

  // Habits use their own simpler flow
  if (q.type === 'habit') {
    if (typeof completeHabitQuest === 'function') await completeHabitQuest(q);
    return;
  }

  const now = new Date().toISOString();
  await db.from('dungeon_quests').update({ done: true, done_at: now }).eq('id', id);
  q.done = true; q.done_at = now;

  let xpAmt = calcQuestXP(q);

  // XP multipliers from RPG systems
  const today = new Date().toISOString().split('T')[0];
  const potionMult    = typeof getPotionMult    === 'function' ? getPotionMult()    : 1;
  const berserkerExp  = hero ? (hero.berserker_exp || 0) : 0;
  const berserkerMult = berserkerExp > Date.now() ? 2 : 1;
  const weatherMult   = typeof getWeatherXPMult === 'function' ? getWeatherXPMult() : 1;
  // famBonus removed — habilidades de mascota reemplazan al familiar

  // Transmutación (mago): next side/daily → 100 XP
  if (hero && hero.transmute_next && (q.type === 'side' || q.type === 'daily')) {
    xpAmt = 100; hero.transmute_next = false; saveHero({ transmute_next: false });
  }
  // Lluvia de flechas (arquero): next weekly → 3×
  if (hero && hero.arrow_rain && q.type === 'weekly') {
    xpAmt *= 3; hero.arrow_rain = false; saveHero({ arrow_rain: false });
  }
  // Visión estratégica (fundador): next 5 quests → +25%
  const stratCount = hero ? (hero.strategic_count || 0) : 0;
  if (stratCount > 0) {
    xpAmt = Math.round(xpAmt * 1.25);
    hero.strategic_count = stratCount - 1; saveHero({ strategic_count: stratCount - 1 });
  }
  // Double-next event
  if (hero && hero.double_next) {
    xpAmt *= 2; hero.double_next = false; saveHero({ double_next: false });
  }
  // Main bonus event (+20 XP for main quests today)
  if (q.type === 'main' && hero && hero.main_bonus_date === today) {
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

  // Reputación por área (tags) — bonus de XP si superaste el umbral
  if (typeof getReputationBonus === 'function') {
    xpAmt = Math.round(xpAmt * (1 + getReputationBonus(q.tags)));
  }

  // Zona del Dungeon — bonus por rango en la zona de esta misión
  if (typeof getZoneBonus === 'function') {
    xpAmt = Math.round(xpAmt * (1 + getZoneBonus(q)));
  }

  // Doble o Nada — multiplica (o anula) XP y oro de esta misión
  const doubleNadaMult = typeof resolveDoubleOrNothing === 'function' ? resolveDoubleOrNothing(q) : 1;
  xpAmt = Math.round(xpAmt * doubleNadaMult);

  // Modo Pesadilla — doble XP y oro
  if (hero && hero.nightmare_mode) xpAmt *= 2;

  // Sistema de Combos — ráfaga activa multiplicador
  if (typeof getComboMult === 'function') xpAmt = Math.round(xpAmt * getComboMult());

  // Modo Furia — HP < 20% → +50% XP
  if (hero) {
    const hpPct = (hero.hp || 0) / (hero.hp_max || 100);
    if (hpPct < 0.2) xpAmt = Math.round(xpAmt * 1.5);
  }

  await addXP(xpAmt, q.type, el);

  // Gold earned
  const goldBase = GOLD_TABLE ? (GOLD_TABLE[q.type] || 10) : 10;
  const goldMult = typeof getGoldMult === 'function' ? getGoldMult() : 1;
  const todGoldMult    = typeof getTODBonus === 'function' ? getTODBonus().goldMult : 1;
  const skillGoldMult  = typeof getSkillTreeGoldBonus === 'function' ? (1 + getSkillTreeGoldBonus()) : 1;
  const runeGoldMult   = typeof getRuneBonus === 'function' ? (1 + getRuneBonus('gold')) : 1;
  const weaponGoldMult  = typeof getWeaponGoldBonus === 'function' ? (1 + getWeaponGoldBonus()) : 1;
  const mountSpdMult   = typeof getPetMountStat   === 'function' ? (1 + getPetMountStat('spd') / 100) : 1;
  const goldRushMult   = (hero && (hero.gold_rush_exp || 0) > Date.now()) ? 2 : 1;
  let goldAmt  = Math.round(goldBase * goldMult * doubleNadaMult * todGoldMult * skillGoldMult * runeGoldMult * weaponGoldMult * goldRushMult * mountSpdMult);
  if (hero && hero.nightmare_mode) goldAmt *= 2;
  if (typeof addGold === 'function') {
    addGold(goldAmt);
    if (typeof spawnGoldParticle === 'function') spawnGoldParticle(goldAmt, el);
  }
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

  const patch = { quests_done: (hero.quests_done || 0) + 1 };
  if (q.type === 'main') patch.main_done = (hero.main_done || 0) + 1;
  await saveHero(patch);

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
      await grantLoot(loots, _gold, _xp, _name, _type);
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

  renderQuestList();
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
  await db.from('dungeon_quests').update(patch).eq('id', id);
  const q = quests.find(x => x.id === id);
  if (q) Object.assign(q, patch);
  closeModal('editQuestModal');
  renderQuestList();
  updateBossBanner();
  toast('✏️', 'Misión actualizada');
}

/* ── ESCUDOS DE MISIÓN ──────────────────────────────────────────
   3 misiones del mismo tipo seguidas → escudo de racha.       */
async function _checkMissionShield(type) {
  if (!hero || !type) return;
  const hist = JSON.parse(localStorage.getItem('dungeon-type-history') || '[]');
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
