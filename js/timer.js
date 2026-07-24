/* TIMER */
// Sin esto, vincular el Pomodoro a una misión era un paso manual extra que
// nadie recordaba hacer — la mayoría de los pomodoros corrían "sin misión
// activa" y perdían el bono de 100% XP/oro sin que el usuario supiera por qué.
const _POM_AUTO_LINK_PRIORITY = { mitico: 5, legendario: 4, epico: 3, normal: 2, comun: 1 };
function _autoLinkTopQuestToPomodoro() {
  if (timer.activeQuest || typeof quests === 'undefined' || !Array.isArray(quests)) return;
  const today = new Date().toISOString().split('T')[0];
  const candidates = quests.filter(q =>
    !q.done && q.type !== 'habit' && (q.deadline === today || q.type === 'daily')
  );
  if (!candidates.length) return;
  candidates.sort((a, b) => (_POM_AUTO_LINK_PRIORITY[b.priority] || 0) - (_POM_AUTO_LINK_PRIORITY[a.priority] || 0));
  if (typeof setActiveQuest === 'function') setActiveQuest(candidates[0].id);
}

async function startTimer() {
  if (timer.running) { pauseTimer(); return; }
  if (timer.phase === 'focus' && !timer.serverPomSession) {
    _autoLinkTopQuestToPomodoro();
    const { data, error } = await db.rpc('start_dungeon_pomodoro', { p_duration: timer.duration });
    if (error || !data) { toast('⚠️', rpcErrorMessage(error, 'No se pudo iniciar el pomodoro seguro. Inténtalo de nuevo.')); return; }
    timer.serverPomSession = data;
  }
  timer.running = true;
  document.getElementById('startBtn').textContent = '⏸';
  timer.interval = setInterval(tickTimer, 1000);
}

function pauseTimer() {
  timer.running = false;
  clearInterval(timer.interval);
  document.getElementById('startBtn').textContent = '▶';
}

function _focusSeconds() {
  const elfoBonus = (typeof heroRace !== 'undefined' && heroRace === 'elfo') ? 5 : 0;
  return (timer.duration + elfoBonus) * 60;
}

function resetTimer() {
  pauseTimer();
  timer.seconds = _focusSeconds();
  timer.phase = 'focus';
  document.getElementById('timerPhase').textContent = 'Listo';
  updateTimerUI();
}

function skipTimer() { pauseTimer(); advancePhase(); }

function tickTimer() {
  timer.seconds--;
  if (timer.seconds <= 0) { advancePhase(); return; }
  updateTimerUI();
}

async function advancePhase() {
  pauseTimer();
  playBeep(timer.phase === 'focus' ? 'complete' : 'start');

  if (timer.phase === 'focus') {
    if (!await savePom()) { timer.seconds = 0; updateTimerUI(); return; }
    timer.pomsDone++;
    updatePomDots();
    const isLong = timer.pomsDone % 4 === 0;
    timer.phase = 'break';
    timer.seconds = (isLong ? 15 : breakDuration) * 60;
    document.getElementById('timerPhase').textContent = isLong ? '☕ Descanso largo' : '☕ Descanso';
    toast('🍅', isLong ? '¡4 pomodoros! Descanso largo 15 min.' : '¡Pomodoro listo! Descansa 5 min.');
    sendNotif('🍅 Pomodoro completado', isLong ? 'Descanso largo: 15 min' : 'Descanso: 5 min');
    if (typeof addMana === 'function') addMana(20);
    if (Math.random() < 0.20 && typeof triggerRandomEvent === 'function') setTimeout(triggerRandomEvent, 1500);
    if (autoBreak) setTimeout(() => startTimer(), 700);
  } else {
    timer.phase = 'focus';
    timer.seconds = _focusSeconds();
    document.getElementById('timerPhase').textContent = '⚡ ¡A trabajar!';
    toast('⚡', '¡De vuelta al combate!');
    sendNotif('⚡ ¡A trabajar!', 'Nuevo pomodoro comenzando.');
  }
  updateTimerUI();
  saveTimerState();
}

function updateTimerUI() {
  const m = Math.floor(timer.seconds / 60).toString().padStart(2, '0');
  const s = (timer.seconds % 60).toString().padStart(2, '0');
  const timeStr = `${m}:${s}`;
  document.getElementById('timerDisplay').textContent = timeStr;

  const isBreak = timer.phase === 'break';
  const breakDur = timer.pomsDone % 4 === 0 && timer.pomsDone > 0 ? 900 : 300;
  const total = isBreak ? breakDur : timer.duration * 60;
  const pct = Math.max(0, timer.seconds) / total;
  const circ = 2 * Math.PI * 60;
  document.getElementById('timerRing').style.strokeDashoffset = circ * (1 - pct);
  document.getElementById('timerRing').style.stroke = isBreak ? 'var(--green)' : 'var(--accent)';

  if (focusMode) syncFocusUI();
  if (timer.running) saveTimerState();
  document.title = timer.running ? `${timeStr} ⚔️ Dungeon` : '⚔️ Dungeon Productivity';
}

function setTimerDuration(min) {
  if (timer.running) return;
  timer.duration = min;
  timer.seconds = min * 60;
  document.querySelectorAll('.dur-btn').forEach(b => b.classList.toggle('active', +b.dataset.min === min));
  document.getElementById('timerPhase').textContent = 'Listo';
  updateTimerUI();
}

function updatePomDots() {
  const dots = document.querySelectorAll('.pom-dot');
  const filled = timer.pomsDone % 4 || (timer.pomsDone > 0 && timer.pomsDone % 4 === 0 ? 4 : 0);
  dots.forEach((d, i) => d.classList.toggle('done', i < filled));
}
