/* SUPABASE — cliente creado al cargar el script para que auth.js lo use antes de initDB() */
db = supabase.createClient(SUPA_URL, SUPA_KEY);

async function initDB() {
  // db ya creado arriba

  // Show cached data instantly while Supabase loads
  try {
    const ch = localStorage.getItem('dungeon-cache-hero');
    const cq = localStorage.getItem('dungeon-cache-quests');
    if (ch) { hero = JSON.parse(ch); deriveHero(); renderHeroUI(); }
    if (cq) { quests = JSON.parse(cq); renderQuestList(); }
  } catch {}

  if (!quests.length) showSkeleton();
  await Promise.all([loadHero(), loadQuests(), loadPomodoros()]);
  await loadInventory();
  await loadPets();
  if (typeof loadWeapons === 'function') await loadWeapons();
  if (typeof loadGoals  === 'function') await loadGoals();
  if (typeof loadRunes  === 'function') await loadRunes();
  renderAll();
  scheduleRandomEvent();
  checkDailyStreak();
}

/* POMODORO */
async function loadPomodoros() {
  const { data } = await db.from('dungeon_pomodoros').select('*').order('started_at', { ascending: false }).limit(50);
  pomodoros = data || [];
}

async function savePom() {
  const doubleXP = timer._nextPomDouble;
  timer._nextPomDouble = false;
  const rec = { hero_id: hero.id, duration: timer.duration, completed: true, started_at: new Date().toISOString() };
  const { data } = await db.from('dungeon_pomodoros').insert(rec).select().single();
  pomodoros.unshift(data);

  const petPomBonus = typeof getPetEffect === 'function' ? (getPetEffect('pom_xp') || 0) : 0;
  const xpAmt = (doubleXP ? POM_XP * 2 : POM_XP) + petPomBonus;
  await addXP(xpAmt, 'pom', null);
  if (doubleXP) toast('🧠', `¡Mente de Acero! +${xpAmt} XP del pomodoro.`);

  const newTotal = (hero.pomodoros_done || 0) + 1;
  await saveHero({ pomodoros_done: newTotal });

  // Cada 4 pomodoros = ciclo completo → oro + drops + daño al jefe
  if (newTotal % 4 === 0) {
    const cycleNum = Math.floor(newTotal / 4);
    const goldAmt  = 30;

    if (typeof damageBoss === 'function') damageBoss(20);

    const hasDropSystem = typeof rollLoot === 'function' && typeof grantLoot === 'function';
    const dropRoll = Math.random() < 0.40; // 40% de chance de items

    if (hasDropSystem && dropRoll) {
      const loots = rollLoot('normal');
      await grantLoot(loots, goldAmt, 0, `🍅 Ciclo #${cycleNum} completado`, '🍅 Ciclo Pomodoro');
    } else {
      if (typeof addGold === 'function') {
        addGold(goldAmt);
        const el = document.getElementById('heroGold');
        if (typeof spawnGoldParticle === 'function') spawnGoldParticle(goldAmt, el);
      }
      setTimeout(() => toast('🍅', `¡Ciclo #${cycleNum} completado! +${goldAmt}🪙 · El Jefe recibe 20 de daño.`), 300);
    }
  }

  checkAchievements();
  renderStats();
  updatePomGoalUI();
}
