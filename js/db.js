/* SUPABASE */
async function initDB() {
  db = supabase.createClient(SUPA_URL, SUPA_KEY);

  // Show cached data instantly while Supabase loads
  try {
    const ch = localStorage.getItem('dungeon-cache-hero');
    const cq = localStorage.getItem('dungeon-cache-quests');
    if (ch) { hero = JSON.parse(ch); deriveHero(); renderHeroUI(); }
    if (cq) { quests = JSON.parse(cq); renderQuestList(); renderKanban(); }
  } catch {}

  if (!quests.length) showSkeleton();
  await Promise.all([loadHero(), loadQuests(), loadPomodoros()]);
  await loadInventory();
  await loadPets();
  if (typeof loadWeapons === 'function') await loadWeapons();
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
  const patch = { pomodoros_done: (hero.pomodoros_done || 0) + 1 };
  await saveHero(patch);
  checkAchievements();
  renderStats();
  updatePomGoalUI();
}
