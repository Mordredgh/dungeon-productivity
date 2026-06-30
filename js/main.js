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
  await handleGoogleFitCallback();
  syncGoogleFitSteps();
  renderFitWidget();
  renderDuolingoWidget();
  renderNightmareModeBtn();
  renderComboChip();
  await migrateRarity();
  await resetDailyQuests();
  await resetRepeatQuests();
  await checkOverdueHP();
  await checkWagerExpiry();
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
}
