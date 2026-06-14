/* SUPABASE */
async function initDB() {
  db = supabase.createClient(SUPA_URL, SUPA_KEY);
  await loadHero();
  await loadQuests();
  await loadPomodoros();
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
  const xpAmt = doubleXP ? POM_XP * 2 : POM_XP;
  await addXP(xpAmt, 'pom', null);
  if (doubleXP) toast('🧠', `¡Mente de Acero! +${xpAmt} XP del pomodoro.`);
  const patch = { pomodoros_done: (hero.pomodoros_done || 0) + 1 };
  await saveHero(patch);
  checkAchievements();
  renderStats();
}
