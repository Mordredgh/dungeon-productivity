/* BOOT: un fallo de red no debe dejar la pantalla en un estado muerto. */
async function _bootGuard(label, action) {
  try { return await action(); }
  catch (error) { console.error(`[Dungeon] ${label}`, error); return null; }
}
(async () => {
  const result = await _bootGuard('sesión', () => db.auth.getSession());
  const session = result?.data?.session;
  if (!session) {
    document.getElementById('loginOverlay').style.display = 'flex';
    return;
  }
  await _bootGuard('aplicación', bootApp);
})();

async function bootApp() {
  const savedTheme = localStorage.getItem('dungeon-theme');
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  updateTimerUI();
  document.getElementById('timerPhase').textContent = 'Listo';
  if (Notification.permission === 'granted') notifEnabled = true;
  const initialized = await _bootGuard('carga inicial', initDB);
  if (initialized === null) {
    toast('Red', 'No se pudo cargar tu partida. Revisa la conexión y vuelve a intentar.');
    return;
  }
  if (typeof initPush === 'function') initPush();
  loadRealWeather();
  updateDungeonClock();
  setInterval(updateDungeonClock, 60 * 1000);
  await handleGoogleFitCallback();
  syncGoogleFitSteps();
  renderFitWidget();
  renderNightmareModeBtn();
  renderComboChip();
  await migrateRarity();
  await resetDailyQuests();
  await resetRepeatQuests();
  await checkOverdueHP();
  await checkWagerExpiry();
  if (typeof checkDailySpecialQuest === 'function') await checkDailySpecialQuest();
  if (typeof checkZoneRandomQuest === 'function') await checkZoneRandomQuest();
  if (typeof checkStreakRewards === 'function') await checkStreakRewards();
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
  checkMorningReview();
  renderDailyGoalBar();
  checkWeeklySummary();
  checkDeadlineAlerts();
  checkNightlyDiary();
  checkProphecyVerdict();
  checkWeeklyPatternAnalysis();
  checkMonthlyReport();
  checkHabitReminders();
  checkGoldNudge();
  updateChallengeProgress();
  setInterval(() => {
    checkDailySummary(); checkWeeklyRetro(); checkDeadlineAlerts(); checkNightlyDiary(); checkProphecyVerdict();
    checkWeeklyPatternAnalysis();
    checkHabitReminders();
    checkBossDeadline();
    checkWagerExpiry();
  }, 60 * 1000); // every minute for habit reminders
  setInterval(updateChallengeProgress, 15 * 60 * 1000);
  updateFocusTodayChip();
  if (typeof checkSecretForgeQueue === 'function') await checkSecretForgeQueue();
  if (typeof animBootSequence === 'function') animBootSequence();
  if (typeof showOnboardingIfNeeded === 'function') showOnboardingIfNeeded();
  if (typeof initPerformanceUX === 'function') initPerformanceUX();
}
