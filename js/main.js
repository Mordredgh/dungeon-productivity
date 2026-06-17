/* BOOT */
(async () => {
  // db ya existe (creado en db.js al cargar el script)
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    document.getElementById('loginOverlay').style.display = 'flex';
    return; // bootApp() se llama desde auth.js cuando el login es exitoso
  }
  await bootApp();
})();

async function bootApp() {
  const savedTheme = localStorage.getItem('dungeon-theme');
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  updateTimerUI();
  document.getElementById('timerPhase').textContent = 'Listo';
  if (Notification.permission === 'granted') notifEnabled = true;
  await initDB();
  if (typeof initPush === 'function') initPush();
  await handleSpotifyCallback();
  renderSpotifyWidget();
  loadRealWeather();
  updateDungeonClock();
  setInterval(updateDungeonClock, 60 * 1000);
  if (typeof handleGoogleFitCallback === 'function') await handleGoogleFitCallback();
  if (typeof handleGoogleCalCallback === 'function') await handleGoogleCalCallback();
  if (typeof syncGoogleFitSteps      === 'function') syncGoogleFitSteps();
  if (typeof renderFitWidget         === 'function') renderFitWidget();
  if (typeof renderCalendarWidget    === 'function') renderCalendarWidget();
  if (typeof renderDuolingoWidget    === 'function') renderDuolingoWidget();
  if (typeof renderNightmareModeBtn  === 'function') renderNightmareModeBtn();
  if (typeof renderComboChip         === 'function') renderComboChip();
  await migrateRarity();
  await resetDailyQuests();
  await resetRepeatQuests();
  await checkOverdueHP();
  if (typeof checkWagerExpiry === 'function') await checkWagerExpiry();
  updatePomGoalUI();
  restoreTimerState();
  checkStreakDanger();
  initPWA();
  setInterval(renderSpells, 2 * 60 * 1000);
  setInterval(checkStreakDanger, 30 * 60 * 1000);
  showWelcomeScreen();
  initParticles();
  checkConnection();
  setInterval(checkConnection, 5 * 60 * 1000);
  initRPGSystems();
  checkDailySummary();
  checkWeeklyRetro();
  checkMorningBriefing();
  if (typeof checkMorningReview    === 'function') checkMorningReview();
  if (typeof renderDailyGoalBar    === 'function') renderDailyGoalBar();
  if (typeof checkWeeklySummary    === 'function') checkWeeklySummary();
  checkDeadlineAlerts();
  checkNightlyDiary();
  checkProphecyVerdict();
  if (typeof checkWeeklyPatternAnalysis === 'function') checkWeeklyPatternAnalysis();
  setInterval(() => {
    checkDailySummary(); checkWeeklyRetro(); checkDeadlineAlerts(); checkNightlyDiary(); checkProphecyVerdict();
    if (typeof checkWeeklyPatternAnalysis === 'function') checkWeeklyPatternAnalysis();
  }, 60 * 60 * 1000);
  updateFocusTodayChip();
}
