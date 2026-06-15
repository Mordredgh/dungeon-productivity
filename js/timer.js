/* TIMER */
function startTimer() {
  if (timer.running) { pauseTimer(); return; }
  timer.running = true;
  document.getElementById('startBtn').textContent = '⏸';
  timer.interval = setInterval(tickTimer, 1000);
}

function pauseTimer() {
  timer.running = false;
  clearInterval(timer.interval);
  document.getElementById('startBtn').textContent = '▶';
}

function resetTimer() {
  pauseTimer();
  timer.seconds = timer.duration * 60;
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

function advancePhase() {
  pauseTimer();
  playBeep(timer.phase === 'focus' ? 'complete' : 'start');

  if (timer.phase === 'focus') {
    savePom();
    timer.pomsDone++;
    updatePomDots();
    const isLong = timer.pomsDone % 4 === 0;
    timer.phase = 'break';
    timer.seconds = (isLong ? 15 : breakDuration) * 60;
    document.getElementById('timerPhase').textContent = isLong ? '☕ Descanso largo' : '☕ Descanso';
    toast('🍅', isLong ? '¡4 pomodoros! Descanso largo 15 min.' : '¡Pomodoro listo! Descansa 5 min.');
    sendNotif('🍅 Pomodoro completado', isLong ? 'Descanso largo: 15 min' : 'Descanso: 5 min');
  } else {
    timer.phase = 'focus';
    timer.seconds = timer.duration * 60;
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
