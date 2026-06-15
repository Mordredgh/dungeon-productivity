/* BOOT */
(async () => {
  const savedTheme = localStorage.getItem('dungeon-theme');
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  updateTimerUI();
  document.getElementById('timerPhase').textContent = 'Listo';
  if (Notification.permission === 'granted') notifEnabled = true;
  await initDB();
  await resetDailyQuests();
  await resetRepeatQuests();
  await checkOverdueHP();
  updatePomGoalUI();
  restoreTimerState();
  checkStreakDanger();
  initPWA();
  initKanbanDrag();
  setInterval(renderSpells, 2 * 60 * 1000);
  setInterval(checkStreakDanger, 30 * 60 * 1000);
  showWelcomeScreen();
  initParticles();
  checkConnection();
  setInterval(checkConnection, 5 * 60 * 1000);
})();