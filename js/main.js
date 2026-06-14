/* BOOT */
(async () => {
  const savedTheme = localStorage.getItem('dungeon-theme');
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  updateTimerUI();
  document.getElementById('timerPhase').textContent = 'Listo';
  await initDB();
  await resetDailyQuests();
  await checkOverdueHP();
  restoreTimerState();
  checkStreakDanger();
  initPWA();
  initKanbanDrag();
  setInterval(renderSpells, 30000);
  setInterval(updateSpellBadge, 60000);
  setInterval(checkStreakDanger, 30 * 60 * 1000);
  showWelcomeScreen();
  initParticles();
  checkConnection();
  setInterval(checkConnection, 5 * 60 * 1000);
})();
</script>
</body>
</html>