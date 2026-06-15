/* EVENTS */
document.querySelectorAll('.view-tab').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));

document.querySelectorAll('.filter-tab[data-filter]').forEach(btn => btn.addEventListener('click', () => {
  activeFilter = btn.dataset.filter;
  localStorage.setItem('dungeon-filter', activeFilter);
  document.querySelectorAll('.filter-tab[data-filter]').forEach(b => b.classList.toggle('active', b === btn));
  renderQuestList();
}));

// Restore saved filter
const savedFilter = activeFilter;
const savedFilterBtn = document.querySelector(`.filter-tab[data-filter="${savedFilter}"]`);
if (savedFilterBtn) {
  document.querySelectorAll('.filter-tab[data-filter]').forEach(b => b.classList.toggle('active', b === savedFilterBtn));
}

// History type filter
document.querySelectorAll('.filter-tab[data-hfilter]').forEach(btn => btn.addEventListener('click', () => {
  historyTypeFilter = btn.dataset.hfilter;
  historyPage = 1;
  document.querySelectorAll('.filter-tab[data-hfilter]').forEach(b => b.classList.toggle('active', b === btn));
  renderHistory();
}));

// History search
document.getElementById('historySearch').addEventListener('input', () => { historyPage = 1; renderHistory(); });

document.getElementById('addQuestBtn').addEventListener('click', () => {
  let name = document.getElementById('qName').value.trim();
  if (!name || !hero) { toast('⚠️', 'Escribe el nombre de la misión.'); return; }
  let type = document.getElementById('qType').value;
  const slashMap = { '/daily':'daily', '/main':'main', '/side':'side', '/weekly':'weekly' };
  for (const [cmd, t] of Object.entries(slashMap)) {
    if (name.toLowerCase().startsWith(cmd + ' ')) { type = t; name = name.slice(cmd.length + 1).trim(); break; }
  }
  addQuest({
    name, type,
    priority: document.getElementById('qPriority').value,
    deadline: document.getElementById('qDeadline').value || null,
    notes: document.getElementById('qNotes').value || null,
    hero_id: hero.id
  });
  document.getElementById('qName').value = '';
  document.getElementById('qDeadline').value = '';
  document.getElementById('qNotes').value = '';
});

document.getElementById('qName').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('addQuestBtn').click();
});

document.getElementById('startBtn').addEventListener('click', startTimer);
document.getElementById('resetBtn').addEventListener('click', resetTimer);
document.getElementById('skipBtn').addEventListener('click', skipTimer);

document.querySelectorAll('.dur-btn').forEach(btn => {
  btn.addEventListener('click', () => setTimerDuration(+btn.dataset.min));
});

document.getElementById('themeBtn').addEventListener('click', cycleTheme);
document.getElementById('compactToggle').addEventListener('click', toggleCompact);
document.getElementById('exportBtn').addEventListener('click', exportData);
document.getElementById('importBtn').addEventListener('click', () => openModal('importModal'));
document.getElementById('doImportBtn').addEventListener('click', doImport);

document.getElementById('notifBtn').addEventListener('click', async () => {
  await requestNotifPermission();
  toast('🔔', notifEnabled ? '¡Notificaciones activadas!' : 'Activa permisos en el navegador.');
});

document.getElementById('heroAvatarBtn').addEventListener('click', () => {
  if (!hero) return;
  document.getElementById('editHeroName').value  = hero.name || '';
  document.getElementById('editHeroClass').value = hero.hero_class || 'guerrero';
  document.getElementById('editHeroRace').value  = heroRace;
  document.getElementById('editGuildName').value = guildName;
  document.getElementById('editWebhookUrl').value = webhookUrl;
  renderAvatarGrid();
  openModal('profileModal');
});

document.getElementById('saveProfileBtn').addEventListener('click', async () => {
  const name = document.getElementById('editHeroName').value.trim();
  const cls  = document.getElementById('editHeroClass').value;
  const avatar = hero._pendingAvatar || hero.avatar || '🧙';
  if (!name) return;

  heroRace   = document.getElementById('editHeroRace').value;
  guildName  = document.getElementById('editGuildName').value.trim();
  webhookUrl = document.getElementById('editWebhookUrl').value.trim();
  localStorage.setItem('dungeon-race',    heroRace);
  localStorage.setItem('dungeon-guild',   guildName);
  localStorage.setItem('dungeon-webhook', webhookUrl);

  // Enano race: +10 HP max
  const hpMaxBonus = heroRace === 'enano' ? 110 : 100;
  await saveHero({ name, hero_class: cls, avatar, hp_max: hpMaxBonus });
  closeModal('profileModal');
  renderHeroUI();
  toast('🧙', 'Perfil actualizado.');
});

document.getElementById('saveQuestBtn').addEventListener('click', () => {
  const id      = document.getElementById('editQuestId').value;
  const tags    = document.getElementById('editQTags').value.trim();
  const estTime = document.getElementById('editQEstTime').value.trim();
  const repeat  = document.getElementById('editQRepeat').value.trim();
  const startDate = document.getElementById('editQStartDate').value;
  const deps    = document.getElementById('editQDependsOn').value.trim();
  if (tags)      localStorage.setItem('dungeon-tags-'   + id, tags);      else localStorage.removeItem('dungeon-tags-'   + id);
  if (estTime)   localStorage.setItem('dungeon-esttime-'+ id, estTime);   else localStorage.removeItem('dungeon-esttime-'+ id);
  if (repeat)    localStorage.setItem('dungeon-repeat-' + id, repeat);    else localStorage.removeItem('dungeon-repeat-' + id);
  if (startDate) localStorage.setItem('dungeon-start-'  + id, startDate); else localStorage.removeItem('dungeon-start-'  + id);
  if (deps)      localStorage.setItem('dungeon-deps-'   + id, deps);      else localStorage.removeItem('dungeon-deps-'   + id);
  updateQuest(id, {
    name:     document.getElementById('editQName').value.trim(),
    type:     document.getElementById('editQType').value,
    priority: document.getElementById('editQPriority').value,
    deadline: document.getElementById('editQDeadline').value || null,
    notes:    document.getElementById('editQNotes').value || null
  });
});

document.getElementById('deleteQuestBtn').addEventListener('click', () => {
  const id = document.getElementById('editQuestId').value;
  closeModal('editQuestModal');
  pendingDeleteId = id;
  const q = quests.find(x => x.id === id);
  document.getElementById('deleteConfirmName').textContent = `¿Eliminar "${q ? q.name : 'esta misión'}"?`;
  openModal('deleteConfirmModal');
});

document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
  if (pendingDeleteId) { deleteQuest(pendingDeleteId); pendingDeleteId = null; }
  closeModal('deleteConfirmModal');
});

document.getElementById('duplicateQuestBtn').addEventListener('click', async () => {
  const id = document.getElementById('editQuestId').value;
  const q  = quests.find(x => x.id === id);
  if (!q || !hero) return;
  closeModal('editQuestModal');
  const copy = { name: q.name + ' (copia)', type: q.type, priority: q.priority, notes: q.notes || null, deadline: null, hero_id: hero.id };
  await addQuest(copy);
  toast('📋', `"${q.name}" duplicada.`);
});

document.getElementById('sortSelect').addEventListener('change', e => {
  sortMode = e.target.value;
  localStorage.setItem('dungeon-sort', sortMode);
  renderQuestList();
});

// Restore saved sort
document.getElementById('sortSelect').value = sortMode;

// Debounced search
let _searchTimer;
document.getElementById('searchBox').addEventListener('input', () => {
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(renderQuestList, 200);
});

document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); });
});

document.getElementById('focusBtn').addEventListener('click', toggleFocusMode);
document.getElementById('focusExitBtn').addEventListener('click', toggleFocusMode);
document.getElementById('focusStartBtn').addEventListener('click', () => { startTimer(); syncFocusUI(); });
document.getElementById('focusResetBtn').addEventListener('click', () => { resetTimer(); syncFocusUI(); });
document.getElementById('focusSkipBtn').addEventListener('click', () => { skipTimer(); syncFocusUI(); });

/* ============================================================
   FEATURE 1: PWA — service worker real (sw.js + manifest.json)
   ============================================================ */
function initPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

/* ============================================================
   FEATURE 2: Auto-reset de misiones diarias
   ============================================================ */
async function resetDailyQuests() {
  const today = new Date().toISOString().split('T')[0];
  const toReset = quests.filter(q =>
    q.type === 'daily' && q.done && q.done_at && !q.done_at.startsWith(today)
  );
  for (const q of toReset) {
    await db.from('dungeon_quests').update({ done: false, done_at: null }).eq('id', q.id);
    q.done = false;
    q.done_at = null;
  }
  if (toReset.length) {
    toast('🌅', `${toReset.length} misiones diarias reseteadas para hoy.`);
    renderQuestList();
    renderKanban();
  }
}

/* ============================================================
   FEATURE 4: Indicador visual de hechizo activo
   ============================================================ */
function updateSpellBadge() {
  const badge = document.getElementById('spellActiveBadge');
  if (!badge) return;
  if (xpMultiplier > 1 && xpMultiplierEnd > Date.now()) {
    const remaining = Math.ceil((xpMultiplierEnd - Date.now()) / 60000);
    badge.textContent = `⚡ x2 XP (${remaining}m)`;
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }
}

/* ============================================================
   FEATURE 5: Modo Focus
   ============================================================ */
let focusMode = false;

function toggleFocusMode() {
  focusMode = !focusMode;
  const overlay = document.getElementById('focusOverlay');
  overlay.classList.toggle('active', focusMode);
  if (focusMode) {
    syncFocusUI();
    toast('🎯', 'Modo Focus activado. Espacio para start/pause.');
  }
}

function syncFocusUI() {
  const m = Math.floor(timer.seconds / 60).toString().padStart(2, '0');
  const s = (timer.seconds % 60).toString().padStart(2, '0');
  const focusEl = document.getElementById('focusTimer');
  if (focusEl) focusEl.textContent = `${m}:${s}`;
  const phaseEl = document.getElementById('focusPhase');
  if (phaseEl) phaseEl.textContent = timer.phase === 'focus' ? 'ENFOQUE' : 'DESCANSO';
  const taskEl = document.getElementById('focusTask');
  if (taskEl) {
    const activeQ = quests.find(q => q.id === timer.activeQuest);
    taskEl.textContent = activeQ ? `⚔️ ${activeQ.name}` : 'Sin misión activa';
  }
  const startBtn = document.getElementById('focusStartBtn');
  if (startBtn) startBtn.textContent = timer.running ? '⏸' : '▶';
  const dots = document.querySelectorAll('#focusPomCount .pom-dot');
  const filled = timer.pomsDone % 4;
  dots.forEach((d, i) => d.classList.toggle('done', i < filled));
}

/* ============================================================
   FEATURE 7: HP penalty por misiones vencidas
   ============================================================ */
async function checkOverdueHP() {
  if (!hero) return;
  const today = new Date().toISOString().split('T')[0];
  const overdue = quests.filter(q => !q.done && q.deadline && q.deadline < today);
  if (!overdue.length) return;
  const lastCheck = localStorage.getItem('dungeon-overdue-check');
  if (lastCheck === today) return;
  localStorage.setItem('dungeon-overdue-check', today);
  const penalty = Math.min(overdue.length * 5, 30);
  const newHp = Math.max(10, (hero.hp || 100) - penalty);
  if (newHp < (hero.hp || 100)) {
    await saveHero({ hp: newHp });
    renderHeroUI();
    toast('💔', `${overdue.length} misiones vencidas: -${penalty} HP`);
  }
}

/* ============================================================
   FEATURE 8: Heatmap de actividad
   ============================================================ */
function renderHeatmap() {
  const gridEl = document.getElementById('heatmapGrid');
  const monthsEl = document.getElementById('heatmapMonths');
  if (!gridEl) return;

  const days = 90;
  const xpByDay = {};
  quests.forEach(q => {
    if (q.done && q.done_at) {
      const d = q.done_at.split('T')[0];
      xpByDay[d] = (xpByDay[d] || 0) + (XP_TABLE[q.type] || 50);
    }
  });

  const maxXP = Math.max(...Object.values(xpByDay), 1);
  let html = '';
  let monthHtml = '';
  let lastMonth = '';

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().split('T')[0];
    const xp = xpByDay[key] || 0;
    const level = xp === 0 ? 0 : xp < maxXP * 0.25 ? 1 : xp < maxXP * 0.5 ? 2 : xp < maxXP * 0.75 ? 3 : 4;
    const month = d.toLocaleDateString('es', { month: 'short' });
    if (month !== lastMonth) {
      monthHtml += `<span class="heatmap-month" style="margin-left:${i === days-1 ? 0 : 4}px">${month}</span>`;
      lastMonth = month;
    }
    html += `<div class="heatmap-day" data-level="${level}" title="${key}: ${xp} XP"></div>`;
  }

  gridEl.innerHTML = html;
  if (monthsEl) monthsEl.innerHTML = monthHtml;

  document.querySelectorAll('.heatmap-legend-box[data-level]').forEach(el => {
    const lvl = el.dataset.level;
    const colors = { '1': 'rgba(168,85,247,.3)', '2': 'rgba(168,85,247,.55)', '3': 'rgba(168,85,247,.8)', '4': 'var(--accent)' };
    el.style.background = colors[lvl] || 'var(--bg4)';
  });
}

/* ============================================================
   FEATURE 9: Confetti elaborado en level up
   ============================================================ */
function spawnConfetti() {
  const colors = ['#a855f7','#22d3ee','#4ade80','#fb7185','#f0abfc','#38bdf8','#fbbf24'];
  for (let i = 0; i < 60; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      el.style.cssText = `
        left:${Math.random() * 100}vw;
        top:${-10 + Math.random() * 30}vh;
        background:${colors[Math.floor(Math.random() * colors.length)]};
        --fall-dist:${200 + Math.random() * 400}px;
        --fall-dur:${0.8 + Math.random() * 1}s;
        --rot:${Math.random() > .5 ? '' : '-'}${180 + Math.floor(Math.random() * 360)}deg;
        width:${6 + Math.random() * 8}px;
        height:${6 + Math.random() * 8}px;
        border-radius:${Math.random() > .5 ? '50%' : '2px'};
      `;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2000);
    }, i * 30);
  }
}

/* ============================================================
   FEATURE 10: Sonido de level up (fanfare)
   ============================================================ */
function playLevelUpSound() {
  try {
    const ctx = getAudioCtx();
    const fanfare = [523, 659, 784, 1047, 784, 1047, 1319];
    fanfare.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      const t = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.start(t); osc.stop(t + 0.35);
    });
  } catch {}
}

/* ============================================================
   FEATURE 12: Timer persistente (localStorage)
   ============================================================ */
function saveTimerState() {
  localStorage.setItem('dungeon-timer', JSON.stringify({
    phase: timer.phase,
    endsAt: timer.running ? Date.now() + timer.seconds * 1000 : 0,
    duration: timer.duration,
    pomsDone: timer.pomsDone,
    activeQuest: timer.activeQuest || null
  }));
}

function restoreTimerState() {
  const saved = localStorage.getItem('dungeon-timer');
  if (!saved) return;
  try {
    const s = JSON.parse(saved);
    // Siempre restaurar pomsDone para que los puntos sean correctos
    if (s.pomsDone) {
      timer.pomsDone = s.pomsDone;
      updatePomDots();
    }
    const remaining = s.endsAt ? Math.floor((s.endsAt - Date.now()) / 1000) : 0;
    if (remaining > 0 && remaining < (s.duration || 25) * 60) {
      timer.phase = s.phase;
      timer.seconds = remaining;
      timer.duration = s.duration || 25;
      timer.activeQuest = s.activeQuest || null;
      document.querySelectorAll('.dur-btn').forEach(b => b.classList.toggle('active', +b.dataset.min === timer.duration));
      updateTimerUI();
      document.getElementById('timerPhase').textContent = s.phase === 'break' ? '☕ Descanso (pausado)' : 'Pausado (tenías uno activo)';
      if (s.activeQuest) {
        const q = quests.find(x => x.id === s.activeQuest);
        if (q) document.getElementById('pomTaskLabel').textContent = `⚔️ ${q.name}`;
      }
      toast('⏱️', `Timer restaurado: ${Math.floor(remaining/60)}m restantes.`);
    }
  } catch {}
  localStorage.removeItem('dungeon-timer');
}

/* ============================================================
   FEATURE 13: Dificultad de misiones (localStorage por quest)
   ============================================================ */
const DIFFICULTY_XP = { easy: 0.75, normal: 1, hard: 1.5 };

function getQuestDifficulty(id) {
  const stored = localStorage.getItem(`dungeon-diff-${id}`);
  return stored || 'normal';
}

function setQuestDifficulty(id, diff) {
  localStorage.setItem(`dungeon-diff-${id}`, diff);
  renderQuestList();
}

function calcQuestXP(q) {
  const base = XP_TABLE[q.type] || 50;
  const diff = getQuestDifficulty(q.id);
  return Math.round(base * (DIFFICULTY_XP[diff] || 1));
}

/* ============================================================
   FEATURE 15: Racha en peligro
   ============================================================ */
function checkStreakDanger() {
  if (!hero || !(hero.streak > 0)) return;
  const hour = new Date().getHours();
  if (hour < 17) return;
  const today = new Date().toISOString().split('T')[0];
  const completedToday = quests.some(q => q.done && q.done_at && q.done_at.startsWith(today));
  if (completedToday) return;
  const dismissed = localStorage.getItem('dungeon-streak-danger-dismissed');
  if (dismissed === today) return;
  showStreakDanger();
}

function showStreakDanger() {
  if (document.getElementById('streakDangerBanner')) return;
  const today = new Date().toISOString().split('T')[0];
  const div = document.createElement('div');
  div.id = 'streakDangerBanner';
  div.className = 'streak-danger';
  div.innerHTML = `
    <span class="streak-danger-icon">🔥</span>
    <span class="streak-danger-text">¡Tu racha de <strong>${hero.streak} días</strong> está en peligro! Completa algo antes de medianoche.</span>
    <span class="streak-danger-close" onclick="dismissStreakDanger()">✕</span>
  `;
  document.body.appendChild(div);
}

function dismissStreakDanger() {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem('dungeon-streak-danger-dismissed', today);
  const el = document.getElementById('streakDangerBanner');
  if (el) el.remove();
}

/* ============================================================
   FEATURE 6+14: Subtareas en notas + Drag reorder quests
   Update renderQuestItem para subtareas y drag handle
   ============================================================ */

/* ============================================================
   FEATURE 3: Drag-and-drop Kanban — status change
   ============================================================ */
let draggedQuestId = null;

function initKanbanDrag() {
  document.querySelectorAll('.kanban-cards').forEach(col => {
    col.addEventListener('dragover', e => {
      e.preventDefault();
      col.classList.add('drag-over');
    });
    col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
    col.addEventListener('drop', async e => {
      e.preventDefault();
      col.classList.remove('drag-over');
      if (!draggedQuestId) return;
      const colId = col.id;
      const q = quests.find(x => x.id === draggedQuestId);
      if (!q) return;
      if (colId === 'k-done' && !q.done) {
        await completeQuest(q.id, null);
      } else if (colId === 'k-battle' && q.type !== 'daily') {
        await updateQuest(q.id, { type: 'daily' });
        renderKanban();
      } else if (colId === 'k-pending' && (q.done || q.type === 'daily')) {
        if (q.done) {
          await db.from('dungeon_quests').update({ done: false, done_at: null }).eq('id', q.id);
          q.done = false; q.done_at = null;
        }
        if (q.type === 'daily') {
          await db.from('dungeon_quests').update({ type: 'side' }).eq('id', q.id);
          q.type = 'side';
        }
        renderQuestList(); renderKanban();
      }
      draggedQuestId = null;
    });
  });
}

/* ============================================================
   HISTORY con búsqueda y filtro de tipo
   ============================================================ */
function renderHistory() {
  const el = document.getElementById('historyContent');
  if (!el) return;
  const search = (document.getElementById('historySearch')?.value || '').toLowerCase();
  let done = quests.filter(q => {
    if (!q.done || !q.done_at) return false;
    if (historyTypeFilter !== 'all' && q.type !== historyTypeFilter) return false;
    if (search && !q.name.toLowerCase().includes(search)) return false;
    return true;
  }).sort((a, b) => new Date(b.done_at) - new Date(a.done_at));

  if (!done.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📜</div><h3>Sin historial</h3><p>Completa misiones para verlas aquí</p></div>`;
    return;
  }

  const PAGE_SIZE = 30;
  const visible  = done.slice(0, PAGE_SIZE * historyPage);
  const remaining = done.length - visible.length;

  const grouped = {};
  visible.forEach(q => {
    const d = new Date(q.done_at).toLocaleDateString('es-MX', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(q);
  });
  const typeIcons = { main:'⭐', side:'🗡️', daily:'🌅', weekly:'📜' };
  let html = Object.entries(grouped).map(([date, qs]) => `
    <div class="history-group">
      <div class="history-date">${date} — ${qs.length} misión${qs.length>1?'es':''}</div>
      ${qs.map(q=>`<div class="history-item">
        <span class="history-item-icon">${typeIcons[q.type]||'⚔️'}</span>
        <span class="history-item-name">${escHtml(q.name)}</span>
        <span class="history-item-xp">+${XP_TABLE[q.type]||50} XP</span>
      </div>`).join('')}
    </div>`).join('');

  if (remaining > 0) {
    html += `<button class="load-more-btn" onclick="historyPage++;renderHistory()">📜 Cargar más (${remaining} restantes)</button>`;
  }
  el.innerHTML = html;
}

function resetHistoryPage() { historyPage = 1; }

/* ============================================================
   NUEVOS HECHIZOS
   ============================================================ */
SPELL_DEFS.push(
  {
    id: 'berserker', icon: '🔥', name: 'Modo Berserker',
    desc: '2x XP por 25 min (CD 24h)',
    cd: 24 * 3600 * 1000,
    cast() {
      xpMultiplier = 2; xpMultiplierEnd = Date.now() + 25 * 60 * 1000;
      updateSpellBadge();
      toast('🔥', '¡Modo Berserker! 2x XP por 25 minutos. ¡Arremete!');
    }
  },
  {
    id: 'healing', icon: '💚', name: 'Curación Mayor',
    desc: 'Recupera 20 HP (CD 24h)',
    cd: 24 * 3600 * 1000,
    async cast() {
      const newHp = Math.min((hero.hp || 0) + 20, hero.hp_max || 100);
      await saveHero({ hp: newHp });
      renderHeroUI();
      toast('💚', `¡Curación Mayor! +20 HP recuperados. HP: ${newHp}/${hero.hp_max || 100}`);
    }
  },
  {
    id: 'steelmind', icon: '🧠', name: 'Mente de Acero',
    desc: 'Próximo pomodoro da 2x XP (CD 12h)',
    cd: 12 * 3600 * 1000,
    cast() {
      timer._nextPomDouble = true;
      toast('🧠', '¡Mente de Acero! El próximo pomodoro dará 2x XP.');
    }
  }
);

/* ============================================================
   NUEVOS LOGROS
   ============================================================ */
ACHIEVEMENT_DEFS.push(
  { id: 'centurion',    icon: '💯', name: 'Centurión',    desc: 'Completa 100 misiones',      cond: h => (h._completed||0) >= 100 },
  { id: 'unstoppable',  icon: '⚡', name: 'Imparable',    desc: 'Racha actual de 7+ días',     cond: h => (h.streak||0) >= 7 },
  { id: 'master_spell', icon: '🧙‍♂️', name: 'Archimago',   desc: 'Lanza 10 hechizos',          cond: h => (h._spells_cast||0) >= 10 },
  { id: 'boss_slayer',  icon: '🐉', name: 'Matador de Jefes', desc: 'Completa 10 épicas',      cond: h => (h._main_done||0) >= 10 },
  { id: 'healer',       icon: '💚', name: 'Inmortal',     desc: 'Mantén HP sobre 80%',         cond: h => (h.hp||0) / (h.hp_max||100) >= 0.8 },
  { id: 'collector',    icon: '📚', name: 'Coleccionista', desc: '5+ misiones activas a la vez', cond: () => quests.filter(q=>!q.done).length >= 5 },
  { id: 'maratonista',  icon: '🍅', name: 'Maratonista',  desc: '10 pomodoros en un día',        cond: h => {
    const today = new Date().toISOString().split('T')[0];
    return pomodoros.filter(p => p.started_at && p.started_at.startsWith(today)).length >= 10;
  }}
);

/* ============================================================
   D20 DADO
   ============================================================ */
function rollD20() {
  const btn = document.getElementById('d20Btn');
  const roll = Math.floor(Math.random() * 20) + 1;
  btn.classList.add('d20-rolling');
  setTimeout(() => btn.classList.remove('d20-rolling'), 600);

  let title, text, bonus = 0;
  if (roll <= 3)       { title = `🎲 D20: ${roll} — Fallo Crítico`; text = '¡Los dados te traicionan! Hasta los dioses se ríen de tu suerte hoy.'; }
  else if (roll <= 8)  { title = `🎲 D20: ${roll} — Resultado Mediocre`; text = 'El oráculo frunce el ceño. No es mal resultado... pero pudo ser peor.'; }
  else if (roll <= 13) { title = `🎲 D20: ${roll} — Neutro`; text = 'Las runas son ambiguas. El destino espera tu próxima decisión.'; }
  else if (roll <= 18) { title = `🎲 D20: ${roll} — ¡Éxito!`; text = 'El destino te favorece, héroe. ¡Aprovecha el momento!'; bonus = 15; }
  else if (roll === 19){ title = `🎲 D20: ${roll} — ¡Gran Éxito!`; text = '¡Los bardos cantarán esta tirada esta noche! +25 XP bonus.'; bonus = 25; }
  else                 { title = `🎲 D20: 20 — ¡CRÍTICO LEGENDARIO!`; text = '¡LOS DIOSES TE BENDICEN! Una vez en la vida. +50 XP. ¡Eres imparable!'; bonus = 50; }

  showEventBanner({ title, text, bonus });
  if (bonus > 0) { addXP(bonus, 'side', null); toast('🎲', `D20: ${roll}! +${bonus} XP bonus`); }
  else toast('🎲', `Tiraste ${roll}. ${roll <= 3 ? '💀 Fallo crítico' : roll <= 8 ? 'Resultado mediocre' : 'Neutro'}`);
}

/* ============================================================
   WELCOME SCREEN
   ============================================================ */
const WELCOME_PHRASES = [
  'El destino te llama de vuelta, Héroe...',
  'El gremio te necesita. ¿Estás listo para la batalla?',
  'Los monstruos de la procrastinación tiemblan ante tu llegada.',
  'Bienvenido de regreso, campeón del caos productivo.',
  'La mazmorra despierta. Tu jornada épica comienza ahora.',
  'El oráculo te aguardaba. Que empiece la batalla.',
  'Tus misiones te esperan. El tiempo no perdona, héroe.',
  'El libro de hazañas se abre para ti...',
  'Otra jornada épica comienza. El gremio confía en ti.',
  'El dungeon nunca duerme. Hoy tampoco tú.'
];

function showWelcomeScreen() {
  const screen = document.getElementById('welcomeScreen');
  if (!screen) return;
  const phrase = WELCOME_PHRASES[Math.floor(Math.random() * WELCOME_PHRASES.length)];
  document.getElementById('welcomePhrase').textContent = phrase;
  setTimeout(() => {
    screen.classList.add('hiding');
    setTimeout(() => screen.remove(), 700);
  }, 2200);
}

/* ============================================================
   CANVAS PARTÍCULAS FLOTANTES
   ============================================================ */
function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const isDark = () => !['light','parchment'].includes(document.documentElement.dataset.theme || 'dark');

  particles = Array.from({ length: 20 }, () => ({
    x: Math.random() * (W || 1200),
    y: Math.random() * (H || 800),
    r: Math.random() * 1.4 + 0.4,
    vx: (Math.random() - 0.5) * 0.15,
    vy: (Math.random() - 0.5) * 0.15,
    a: Math.random()
  }));

  const theme = document.documentElement.dataset.theme || 'dark';
  const color = theme === 'parchment' ? '184,134,11' : theme === 'cyber' ? '56,189,248' : '168,85,247';

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      p.a += 0.006;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      const alpha = (Math.sin(p.a) * 0.5 + 0.5) * 0.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color},${alpha})`;
      ctx.fill();
    });
  }
  setInterval(draw, 50);
}

/* ============================================================
   TAG FILTER
   ============================================================ */
function setTagFilter(tag) {
  tagFilter = (tagFilter === tag) ? null : tag;
  renderQuestList();
  if (tagFilter) toast('🏷️', `Filtrando por: ${tag} (click de nuevo para quitar)`);
}

/* ============================================================
   EXPAND NOTES
   ============================================================ */
function expandNotes(evt, questId, fullText) {
  evt.stopPropagation();
  const el = document.getElementById('notes-' + questId);
  if (el) el.innerHTML = escHtml(fullText);
}

/* ============================================================
   EXPORT CSV
   ============================================================ */
function exportCSV() {
  const rows = [['Nombre','Tipo','Prioridad','Estado','Deadline','XP','Completada_en']];
  quests.forEach(q => {
    rows.push([
      '"' + (q.name || '').replace(/"/g,'""') + '"',
      q.type, q.priority || 'normal',
      q.done ? 'Completada' : 'Pendiente',
      q.deadline || '',
      XP_TABLE[q.type] || 50,
      q.done_at ? q.done_at.split('T')[0] : ''
    ]);
  });
  const csv  = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = `dungeon-quests-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  toast('📊', 'CSV exportado.');
}

/* ============================================================
   CMD+K SEARCH
   ============================================================ */
function openCmdk() {
  openModal('cmdkModal');
  setTimeout(() => document.getElementById('cmdkInput').focus(), 50);
}

document.getElementById('cmdkInput').addEventListener('input', function() {
  const q    = this.value.toLowerCase();
  const res  = document.getElementById('cmdkResults');
  if (!q) { res.innerHTML = '<div class="cmdk-empty">Escribe para buscar</div>'; return; }
  const hits = quests.filter(x => x.name.toLowerCase().includes(q) || (x.notes||'').toLowerCase().includes(q)).slice(0, 8);
  if (!hits.length) { res.innerHTML = '<div class="cmdk-empty">Sin resultados</div>'; return; }
  const typeLabels = { main:'⚔️ Épica', side:'🗡️ Encargo', daily:'🌅 Búsqueda', weekly:'📜 Crónica' };
  res.innerHTML = hits.map(h => `
    <div class="cmdk-result-item" onclick="closeModal('cmdkModal');switchView('quests');document.getElementById('searchBox').value='${escHtml(h.name)}';renderQuestList()">
      <span style="font-size:16px">${h.done?'✅':'⚔️'}</span>
      <span class="cmdk-result-name">${escHtml(h.name)}</span>
      <span class="cmdk-result-type">${typeLabels[h.type]||h.type}</span>
    </div>`).join('');
});


/* ============================================================
   REPEAT QUEST AUTO-RESET
   ============================================================ */
async function resetRepeatQuests() {
  const today = new Date().toISOString().split('T')[0];
  const lastCheck = localStorage.getItem('dungeon-repeat-check');
  if (lastCheck === today) return;
  localStorage.setItem('dungeon-repeat-check', today);
  let count = 0;
  for (const q of quests) {
    const repeat = parseInt(localStorage.getItem('dungeon-repeat-' + q.id));
    if (!repeat || !q.done || !q.done_at) continue;
    const daysSince = Math.floor((Date.now() - new Date(q.done_at).getTime()) / 86400000);
    if (daysSince >= repeat) {
      await db.from('dungeon_quests').update({ done: false, done_at: null }).eq('id', q.id);
      q.done = false; q.done_at = null;
      count++;
    }
  }
  if (count) { toast('🔄', `${count} misión(es) repetible(s) restablecida(s).`); renderQuestList(); }
}

/* ============================================================
   POM GOAL UI
   ============================================================ */
function updatePomGoalUI() {
  const today = new Date().toISOString().split('T')[0];
  const todayPoms = pomodoros.filter(p => p.started_at && p.started_at.startsWith(today)).length;
  const pct = Math.min(100, Math.round((todayPoms / pomGoal) * 100));
  const elCur = document.getElementById('pomGoalCurrent');
  const elTgt = document.getElementById('pomGoalTarget');
  const elFill = document.getElementById('pomGoalFill');
  if (elCur) elCur.textContent = todayPoms;
  if (elTgt) elTgt.textContent = pomGoal;
  if (elFill) elFill.style.width = pct + '%';
  if (pct >= 100) toast('🎯', '¡Meta de pomodoros del día cumplida!');
  updateFocusTodayChip();
}

/* ============================================================
   MUSIC TOGGLE
   ============================================================ */
function toggleMusic() {
  const btn = document.getElementById('musicBtn');
  const vol = document.getElementById('musicVolume');
  if (musicAudio) {
    musicAudio.pause(); musicAudio = null;
    btn.style.color = '';
    if (vol) vol.style.display = 'none';
    toast('🎵', 'Música detenida.');
  } else {
    musicAudio = new Audio('https://radio.plaza.one/ogg');
    musicAudio.volume = (vol ? vol.value : 25) / 100;
    musicAudio.play().then(() => {
      btn.style.color = 'var(--green)';
      if (vol) vol.style.display = 'inline-block';
      toast('🎵', 'Música lofi activada. ¡A trabajar, héroe!');
    }).catch(() => {
      musicAudio = null;
      toast('⚠️', 'No se pudo cargar la radio. Verifica tu conexión.');
    });
  }
}

/* ============================================================
   MAP VIEW — Mapa del Dungeon SVG
   ============================================================ */
function renderMapView() {
  const el = document.getElementById('mapContent');
  if (!el) return;
  const types = ['main','side','daily','weekly'];
  const typeInfo = {
    main:   { label:'⚔️ Épicas',    color:'#10b981', icon:'⚔️', x:80,  y:60  },
    side:   { label:'🗡️ Encargos',  color:'#818cf8', icon:'🗡️', x:280, y:60  },
    daily:  { label:'🌅 Búsquedas', color:'#4ade80', icon:'🌅', x:80,  y:220 },
    weekly: { label:'📜 Crónicas',  color:'#38bdf8', icon:'📜', x:280, y:220 }
  };
  const counts = {};
  types.forEach(t => {
    counts[t] = { total: quests.filter(q=>q.type===t).length, done: quests.filter(q=>q.type===t&&q.done).length };
  });
  const W = 420, H = 360;
  let svg = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;font-family:var(--font-body)">
    <defs>
      <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <!-- Connections -->
    <line x1="190" y1="100" x2="250" y2="100" stroke="var(--border)" stroke-width="2" stroke-dasharray="5,5"/>
    <line x1="130" y1="160" x2="130" y2="200" stroke="var(--border)" stroke-width="2" stroke-dasharray="5,5"/>
    <line x1="330" y1="160" x2="330" y2="200" stroke="var(--border)" stroke-width="2" stroke-dasharray="5,5"/>
    <line x1="190" y1="260" x2="250" y2="260" stroke="var(--border)" stroke-width="2" stroke-dasharray="5,5"/>`;

  types.forEach(t => {
    const info = typeInfo[t];
    const cnt  = counts[t];
    const pct  = cnt.total > 0 ? Math.round((cnt.done / cnt.total) * 100) : 0;
    svg += `
    <g transform="translate(${info.x},${info.y})">
      <rect x="-60" y="-45" width="120" height="90" rx="12" fill="var(--card)" stroke="${info.color}" stroke-width="1.5" opacity=".9"/>
      <text x="0" y="-20" text-anchor="middle" font-size="22">${info.icon}</text>
      <text x="0" y="2" text-anchor="middle" font-size="10" fill="var(--text2)">${info.label.replace(/[⚔️🗡️🌅📜]/,'').trim()}</text>
      <text x="0" y="18" text-anchor="middle" font-size="13" fill="${info.color}" font-weight="bold">${cnt.done}/${cnt.total}</text>
      <rect x="-35" y="28" width="70" height="6" rx="3" fill="var(--bg4)"/>
      <rect x="-35" y="28" width="${Math.round(70 * pct / 100)}" height="6" rx="3" fill="${info.color}"/>
    </g>`;
  });

  // Hero in center
  svg += `
    <g transform="translate(${W/2},${H/2})">
      <circle r="28" fill="var(--glass)" stroke="var(--accent)" stroke-width="2"/>
      <text x="0" y="8" text-anchor="middle" font-size="22">${hero ? hero.avatar || '🧙' : '🧙'}</text>
    </g>
  </svg>`;
  el.innerHTML = svg;
}

/* ============================================================
   SWIPE TO COMPLETE (mobile)
   ============================================================ */
function initSwipeToComplete() {
  document.querySelectorAll('.quest-item:not(.done)').forEach(el => {
    let startX, startY;
    el.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });
    el.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dy) > 40 || Math.abs(dx) < 80) return;
      const id = el.dataset.qid;
      if (!id) return;
      if (dx > 80) {
        el.style.transform = 'translateX(60px)';
        el.style.opacity   = '0';
        setTimeout(() => completeQuest(id, el), 200);
      } else if (dx < -80) {
        pendingDeleteId = id;
        const q = quests.find(x => x.id === id);
        document.getElementById('deleteConfirmName').textContent = `¿Eliminar "${q ? q.name : 'esta misión'}"?`;
        openModal('deleteConfirmModal');
      }
    }, { passive: true });
  });
}

/* ============================================================
   CONNECTION INDICATOR
   ============================================================ */
async function checkConnection() {
  const dot = document.getElementById('connDot');
  if (!dot) return;
  try {
    const { error } = await db.from('dungeon_heroes').select('id').limit(1);
    dot.className = error ? 'conn-dot err' : 'conn-dot ok';
    dot.title     = error ? 'Sin conexión a Supabase' : 'Supabase conectado';
  } catch { dot.className = 'conn-dot err'; }
}

/* ============================================================
   EVENT LISTENERS — nuevos botones
   ============================================================ */
document.getElementById('d20Btn').addEventListener('click', rollD20);
document.getElementById('musicBtn').addEventListener('click', toggleMusic);
document.getElementById('csvBtn').addEventListener('click', exportCSV);
document.getElementById('mobileFab').addEventListener('click', () => {
  switchView('quests');
  document.getElementById('qName').focus();
});

// Cmd+K / Ctrl+K
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    openCmdk();
  }
});

/* ============================================================
   FEATURE 8: Spell event listener
   ============================================================ */
document.addEventListener('dungeon:spellcast', renderSpells);

/* ============================================================
   FEATURE 19: Skeleton loading
   ============================================================ */
function showSkeleton() {
  const el = document.getElementById('questList');
  if (!el) return;
  el.innerHTML = Array.from({length:5}, () => `
    <div class="skeleton-item">
      <div class="skeleton-check"></div>
      <div class="skeleton-body">
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
      </div>
    </div>`).join('');
}

/* ============================================================
   FEATURE 22: Sidebar collapse
   ============================================================ */
function toggleSidebar() {
  sidebarCollapsed = !sidebarCollapsed;
  document.getElementById('app').classList.toggle('sidebar-collapsed', sidebarCollapsed);
  const reopenBtn = document.getElementById('sidebarReopenBtn');
  if (reopenBtn) reopenBtn.style.display = sidebarCollapsed ? 'block' : 'none';
  const toggleBtn = document.getElementById('sidebarToggleBtn');
  if (toggleBtn) toggleBtn.textContent = sidebarCollapsed ? '▶' : '◀';
}
document.getElementById('sidebarToggleBtn').addEventListener('click', toggleSidebar);
document.getElementById('sidebarReopenBtn').addEventListener('click', toggleSidebar);

/* ============================================================
   FEATURE 51: Contrato de Gremio visual
   ============================================================ */
function showContratoEffect(name) {
  const el = document.createElement('div');
  el.className = 'contrato-banner';
  el.innerHTML = `<div>📜 <em>Contrato firmado:</em><br><strong>${escHtml(name)}</strong></div>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

/* ============================================================
   FEATURE 58: Bulk actions
   ============================================================ */
function enterBulkMode() {
  bulkMode = true; bulkSelected.clear();
  document.getElementById('bulkBar').style.display = 'flex';
  document.getElementById('bulkToggleBtn').style.background = 'var(--accent)';
  renderQuestList();
}
function exitBulkMode() {
  bulkMode = false; bulkSelected.clear();
  document.getElementById('bulkBar').style.display = 'none';
  document.getElementById('bulkToggleBtn').style.background = '';
  renderQuestList();
}
function toggleBulkSelect(id) {
  if (bulkSelected.has(id)) bulkSelected.delete(id); else bulkSelected.add(id);
  document.getElementById('bulkCount').textContent = `${bulkSelected.size} seleccionada${bulkSelected.size!==1?'s':''}`;
  // update checkbox visual without full re-render
  const el = document.querySelector(`.quest-item[data-qid="${id}"] .bulk-check`);
  if (el) el.checked = bulkSelected.has(id);
}
async function bulkComplete() {
  const ids = [...bulkSelected];
  for (const id of ids) await completeQuest(id, null);
  exitBulkMode();
  toast('✅', `${ids.length} misiones completadas.`);
}
async function bulkDelete() {
  const ids = [...bulkSelected];
  if (!confirm(`¿Eliminar ${ids.length} misiones?`)) return;
  for (const id of ids) await deleteQuest(id);
  exitBulkMode();
}
document.getElementById('bulkToggleBtn').addEventListener('click', () => bulkMode ? exitBulkMode() : enterBulkMode());

/* ============================================================
   FEATURE 63: Calendar view
   ============================================================ */
function renderCalendar() {
  const yr = calDate.getFullYear();
  const mo = calDate.getMonth();
  const title = calDate.toLocaleDateString('es', { month:'long', year:'numeric' });
  document.getElementById('calMonthTitle').textContent = title;

  const firstDay    = new Date(yr, mo, 1).getDay();
  const daysInMonth = new Date(yr, mo + 1, 0).getDate();
  const todayStr    = new Date().toISOString().split('T')[0];

  const questsByDay = {};
  quests.forEach(q => {
    if (!q.deadline) return;
    const d = new Date(q.deadline + 'T00:00:00');
    if (d.getFullYear() === yr && d.getMonth() === mo) {
      const day = d.getDate();
      if (!questsByDay[day]) questsByDay[day] = [];
      questsByDay[day].push(q);
    }
  });

  const dayNames = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  let html = dayNames.map(d => `<div class="cal-header-cell">${d}</div>`).join('');
  for (let i = 0; i < firstDay; i++) html += '<div class="cal-day empty"></div>';

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${yr}-${String(mo+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const qs = questsByDay[day] || [];
    const isToday = dateStr === todayStr;
    html += `<div class="cal-day ${isToday?'today':''} ${qs.length?'has-quests':''}" onclick="showCalDay('${dateStr}')">
      <div class="cal-day-num">${day}</div>
      ${qs.length ? `<div class="cal-dots">${qs.slice(0,4).map(q=>`<div class="cal-dot ${q.done?'done':q.priority==='urgente'?'urgent':''}" title="${escHtml(q.name)}"></div>`).join('')}</div>` : ''}
    </div>`;
  }
  document.getElementById('calGrid').innerHTML = html;
  document.getElementById('calDetail').innerHTML = '';
}

function showCalDay(dateStr) {
  const qs = quests.filter(q => q.deadline === dateStr);
  const label = new Date(dateStr + 'T00:00:00').toLocaleDateString('es', { weekday:'long', day:'numeric', month:'long' });
  const el = document.getElementById('calDetail');
  if (!qs.length) { el.innerHTML = `<div style="color:var(--text3);text-align:center;padding:14px">Sin misiones para ${label}</div>`; return; }
  const typeIcons = { main:'⚔️', side:'🗡️', daily:'🌅', weekly:'📜' };
  el.innerHTML = `<div class="cal-detail-title">${label}</div>` +
    qs.map(q => `<div class="cal-detail-item ${q.done?'done':''}">
      <span>${typeIcons[q.type]||'⚔️'} ${escHtml(q.name)}</span>
      <span style="font-size:10px">${q.done?'✅':q.priority==='urgente'?'🔴':''}</span>
    </div>`).join('');
}

function calPrev() { calDate.setMonth(calDate.getMonth()-1); renderCalendar(); }
function calNext() { calDate.setMonth(calDate.getMonth()+1); renderCalendar(); }

/* ============================================================
   FEATURE 77: Semana perfecta achievement + FEATURE 92 CSV listener
   ============================================================ */
ACHIEVEMENT_DEFS.push(
  { id: 'semana_perfecta', icon: '🌟', name: 'Semana Perfecta',
    desc: 'Completa búsquedas diarias 7 días seguidos',
    cond: () => {
      const completedDays = new Set(quests.filter(q => q.done && q.done_at && q.type === 'daily').map(q => q.done_at.split('T')[0]));
      for (let i = 0; i < 7; i++) {
        const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
        if (!completedDays.has(d)) return false;
      }
      return true;
    }
  }
);

document.getElementById('doImportCsvBtn').addEventListener('click', doImportCSV);

document.getElementById('musicVolume').addEventListener('input', function() {
  if (musicAudio) musicAudio.volume = this.value / 100;
});

document.getElementById('breakDurSelect').addEventListener('change', function() {
  breakDuration = parseInt(this.value);
  localStorage.setItem('dungeon-break-dur', breakDuration);
  toast('☕', `Descanso: ${breakDuration} min`);
});

document.getElementById('pomGoalInput').addEventListener('change', function() {
  pomGoal = Math.max(1, parseInt(this.value) || 8);
  localStorage.setItem('dungeon-pom-goal', pomGoal);
  updatePomGoalUI();
});

document.getElementById('helpBtn').addEventListener('click', () => openModal('shortcutsModal'));

/* ============================================================
   SONIDO AMBIENTAL (Web Audio API)
   ============================================================ */
function _createWhiteNoise(ctx, dest) {
  const bufSize = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf; src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass'; filter.frequency.value = 400; filter.Q.value = 0.5;
  src.connect(filter); filter.connect(dest);
  src.start(); return src;
}

function _createFire(ctx, dest) {
  const bufSize = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf; src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass'; filter.frequency.value = 200; filter.Q.value = 1;
  src.connect(filter); filter.connect(dest);
  src.start(); return src;
}

function _createForest(ctx, dest) {
  const bufSize = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf; src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass'; filter.frequency.value = 800; filter.Q.value = 0.3;
  src.connect(filter); filter.connect(dest);
  src.start(); return src;
}

function startAmbient(type) {
  stopAmbient();
  const ctx = getAudioCtx();
  ambientGainNode = ctx.createGain();
  const vol = parseInt(localStorage.getItem('dungeon-ambient-vol') || '30') / 100;
  ambientGainNode.gain.value = vol;
  ambientGainNode.connect(ctx.destination);
  const volSlider = document.getElementById('ambientVolume');
  if (volSlider) { volSlider.value = vol * 100; volSlider.style.display = 'inline-block'; }
  if (type === 'rain')        ambientNode = _createWhiteNoise(ctx, ambientGainNode);
  else if (type === 'fire')   ambientNode = _createFire(ctx, ambientGainNode);
  else if (type === 'forest') ambientNode = _createForest(ctx, ambientGainNode);
  ambientType = type;
  localStorage.setItem('dungeon-ambient', type);
  const icons = { rain: '🌧️', fire: '🔥', forest: '🌿' };
  const btn = document.getElementById('ambientBtn');
  if (btn) { btn.style.color = 'var(--blue)'; btn.title = `Ambiental: ${type}`; btn.textContent = icons[type] || '🌧️'; }
  const labels = { rain: 'Lluvia activada', fire: 'Fuego activado', forest: 'Bosque activado' };
  toast(icons[type] || '🎵', labels[type] || 'Ambiental activado');
}

function stopAmbient() {
  if (ambientNode) { try { ambientNode.stop(); } catch {} ambientNode = null; }
  if (ambientGainNode) { try { ambientGainNode.disconnect(); } catch {} ambientGainNode = null; }
  ambientType = null;
  localStorage.removeItem('dungeon-ambient');
  const btn = document.getElementById('ambientBtn');
  if (btn) { btn.style.color = ''; btn.title = 'Sonido ambiental'; btn.textContent = '🌧️'; }
  const volSlider = document.getElementById('ambientVolume');
  if (volSlider) volSlider.style.display = 'none';
}

function cycleAmbient() {
  const cycle = [null, 'rain', 'fire', 'forest'];
  const next  = cycle[(cycle.indexOf(ambientType) + 1) % cycle.length];
  const btn   = document.getElementById('ambientBtn');
  if (!next) { stopAmbient(); toast('🔇', 'Ambiental desactivado.'); if (btn) btn.textContent = '🌧️'; }
  else startAmbient(next);
}

document.getElementById('ambientBtn').addEventListener('click', cycleAmbient);

document.getElementById('ambientVolume').addEventListener('input', function() {
  if (ambientGainNode) ambientGainNode.gain.value = this.value / 100;
  localStorage.setItem('dungeon-ambient-vol', this.value);
});

/* More menu toggle */
document.getElementById('moreBtn').addEventListener('click', e => {
  e.stopPropagation();
  document.getElementById('moreMenu').classList.toggle('open');
});
document.addEventListener('click', () => document.getElementById('moreMenu').classList.remove('open'));

/* ============================================================
   FOCUS TODAY CHIP
   ============================================================ */
function updateFocusTodayChip() {
  const el = document.getElementById('focusTodayVal');
  if (!el) return;
  const today = new Date().toISOString().split('T')[0];
  const mins  = pomodoros.filter(p => p.started_at && p.started_at.startsWith(today)).length * 25;
  el.textContent = `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

/* ============================================================
   AUTO-BREAK TOGGLE
   ============================================================ */
function toggleAutoBreak() {
  autoBreak = !autoBreak;
  localStorage.setItem('dungeon-auto-break', autoBreak ? 'true' : 'false');
  const btn = document.getElementById('autoBreakBtn');
  if (btn) { btn.textContent = autoBreak ? 'ON' : 'OFF'; btn.classList.toggle('off', !autoBreak); }
  toast(autoBreak ? '⏩' : '⏸', autoBreak ? 'Auto-descanso activado.' : 'Auto-descanso desactivado.');
}

(function initAutoBreakBtn() {
  const btn = document.getElementById('autoBreakBtn');
  if (!btn) return;
  btn.textContent = autoBreak ? 'ON' : 'OFF';
  btn.classList.toggle('off', !autoBreak);
})();

document.getElementById('autoBreakBtn').addEventListener('click', toggleAutoBreak);

/* ============================================================
   DATE FILTER TABS
   ============================================================ */
document.querySelectorAll('.date-filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    dateFilter = btn.dataset.df;
    document.querySelectorAll('.date-filter-btn').forEach(b => b.classList.toggle('active', b === btn));
    renderQuestList();
  });
});

/* ============================================================
   QUICK NOTES PAD
   ============================================================ */
(function initQuickNotes() {
  const area = document.getElementById('quickNotesArea');
  if (!area) return;
  area.value = localStorage.getItem('dungeon-quick-notes') || '';
  area.addEventListener('input', () => localStorage.setItem('dungeon-quick-notes', area.value));
})();

/* ============================================================
   DAILY SUMMARY TOAST (8pm)
   ============================================================ */
function checkDailySummary() {
  if (new Date().getHours() < 20) return;
  const today = new Date().toISOString().split('T')[0];
  if (localStorage.getItem('dungeon-summary-shown') === today) return;
  localStorage.setItem('dungeon-summary-shown', today);
  const done  = quests.filter(q => q.done && q.done_at && q.done_at.startsWith(today)).length;
  const poms  = pomodoros.filter(p => p.started_at && p.started_at.startsWith(today)).length;
  const xp    = quests.filter(q => q.done && q.done_at && q.done_at.startsWith(today))
                      .reduce((s, q) => s + (XP_TABLE[q.type] || 50), 0);
  toast('📜', `Resumen del día: ${done} misiones · ${poms} pomodoros · +${xp} XP`);
}

/* ============================================================
   PIN QUEST
   ============================================================ */
function togglePin(id) {
  const key = 'dungeon-pin-' + id;
  if (localStorage.getItem(key)) { localStorage.removeItem(key); toast('📌', 'Misión desanclada.'); }
  else { localStorage.setItem(key, '1'); toast('📌', 'Misión anclada al inicio.'); }
  renderQuestList();
}

/* ============================================================
   ORÁCULO ARCANO — OpenClaw via proxy
   ============================================================ */
let _oracleLoaded = false;

function openOracle() {
  document.getElementById('oraclePanel').classList.add('open');
  document.getElementById('oracleOverlay').classList.add('open');
  if (!_oracleLoaded) _loadOracleHistory();
}

function closeOracle() {
  document.getElementById('oraclePanel').classList.remove('open');
  document.getElementById('oracleOverlay').classList.remove('open');
}

function _buildOracleContext(userText) {
  const today      = new Date().toISOString().split('T')[0];
  const pending    = quests.filter(q => !q.done).slice(0, 15);
  const todayPoms  = pomodoros.filter(p => p.started_at && p.started_at.startsWith(today)).length;
  const todayDone  = quests.filter(q => q.done && q.done_at && q.done_at.startsWith(today)).length;
  const typeMap    = { main:'épica', side:'encargo', daily:'búsqueda', weekly:'crónica' };

  const questLines = pending.length
    ? pending.map(q =>
        `- [${typeMap[q.type] || q.type}] ${q.name}` +
        (q.priority === 'urgente' ? ' ⚠️URGENTE' : '') +
        (q.deadline ? ` (deadline: ${q.deadline})` : '')
      ).join('\n')
    : '- (ninguna pendiente)';

  return `[CONTEXTO DEL HÉROE - ${new Date().toLocaleDateString('es-MX')}]
Nivel ${hero ? hero.level : '?'} | Racha: ${hero ? (hero.streak || 0) : 0} días | HP: ${hero ? hero.hp : 100}/${hero ? hero.max_hp : 100}
Hoy: ${todayDone} misiones completadas · ${todayPoms} pomodoros
Misiones pendientes (${pending.length}):
${questLines}
[FIN CONTEXTO]

${userText}`;
}

function _oracleAppend(role, text) {
  const msgs = document.getElementById('oracleMsgs');
  const el   = document.createElement('div');
  el.className = 'oracle-msg ' + role;
  el.textContent = text;
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
  return el;
}

function _oracleAddActions(replyText) {
  const msgs = document.getElementById('oracleMsgs');
  const wrap = document.createElement('div');
  wrap.className = 'oracle-msg-actions';

  const btn = document.createElement('button');
  btn.className   = 'oracle-action-btn';
  btn.textContent = '➕ Crear misión';
  const suggestion = replyText.split('\n')[0].replace(/^[-*•#>\s]+/, '').trim().slice(0, 150);
  btn.addEventListener('click', () => _oracleCreateQuest(suggestion));
  wrap.appendChild(btn);

  msgs.appendChild(wrap);
  msgs.scrollTop = msgs.scrollHeight;
}

function _oracleCreateQuest(suggestion) {
  closeOracle();
  switchView('quests');
  const input = document.getElementById('qName');
  if (input) { input.value = suggestion; input.focus(); input.select(); }
  toast('➕', 'Edita el nombre y pulsa Añadir misión');
}

async function _loadOracleHistory() {
  const loading = document.getElementById('oracleLoading');
  const msgs    = document.getElementById('oracleMsgs');
  try {
    const r    = await fetch('/openclaw/history');
    const data = await r.json();
    if (loading) loading.remove();
    _oracleLoaded = true;
    const items = (data.items || []).slice(-20);
    if (!items.length) {
      const ph = document.createElement('div');
      ph.className   = 'oracle-loading';
      ph.textContent = '🔮 El oráculo aguarda tu primera consulta...';
      msgs.appendChild(ph);
      return;
    }
    items.forEach(item => {
      let text = typeof item.content === 'string'
        ? item.content
        : (Array.isArray(item.content) ? item.content.filter(b => b.type === 'text').map(b => b.text).join('') : '');
      if (!text) return;
      _oracleAppend(item.role === 'user' ? 'user' : 'assistant', text);
    });
    msgs.scrollTop = msgs.scrollHeight;
  } catch {
    if (loading) loading.textContent = '⚠️ No se pudo conectar con el oráculo.';
  }
}

async function oracleSend() {
  const input   = document.getElementById('oracleInput');
  const sendBtn = document.getElementById('oracleSend');
  const text    = (input.value || '').trim();
  if (!text || sendBtn.disabled) return;

  input.value      = '';
  input.disabled   = true;
  sendBtn.disabled = true;

  _oracleAppend('user', text);
  const thinkEl = _oracleAppend('thinking', '🔮 El oráculo medita...');

  try {
    const r    = await fetch('/openclaw/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: _buildOracleContext(text) })
    });
    thinkEl.remove();
    const data  = await r.json();
    const reply = data.reply || '⚠️ Sin respuesta del oráculo.';
    _oracleAppend('assistant', reply);
    _oracleAddActions(reply);
  } catch {
    thinkEl.remove();
    _oracleAppend('assistant', '⚠️ Error al consultar el oráculo.');
  } finally {
    input.disabled   = false;
    sendBtn.disabled = false;
    input.focus();
  }
}

const _ORACLE_QUICK_PROMPTS = {
  plan:     'Planea mi día de hoy priorizando mis misiones. Dame un plan de acción concreto con orden de ataque.',
  priority: '¿Cuál de mis misiones pendientes debo atacar primero ahora mismo y por qué?',
  summary:  'Dame un resumen motivacional de lo que logré hoy y qué me falta para mañana.'
};

function oracleQuickPrompt(type) {
  const text = _ORACLE_QUICK_PROMPTS[type];
  if (!text) return;
  openOracle();
  const input = document.getElementById('oracleInput');
  if (input) { input.value = text; input.focus(); }
}

function oracleQuestAdvice(questId) {
  const q = quests.find(x => x.id === questId);
  if (!q) return;
  const typeMap = { main:'épica', side:'encargo', daily:'búsqueda', weekly:'crónica' };
  const parts = [
    `¿Cómo abordo esta misión: "${q.name}"?`,
    `Tipo: ${typeMap[q.type] || q.type}`,
    q.priority && q.priority !== 'normal' ? `Prioridad: ${q.priority}` : '',
    q.deadline ? `Deadline: ${q.deadline}` : '',
    q.notes ? `Notas: ${q.notes.slice(0, 200)}` : ''
  ].filter(Boolean).join(' | ');
  openOracle();
  const input = document.getElementById('oracleInput');
  if (input) { input.value = parts; input.focus(); }
}

/* ============================================================
   RETROSPECTIVA SEMANAL (domingos 8pm)
   ============================================================ */
function _weekNumber(d) {
  const jan1 = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
}

function _weekDates() {
  const arr = [];
  for (let i = 6; i >= 0; i--) arr.push(new Date(Date.now() - i * 86400000).toISOString().split('T')[0]);
  return arr;
}

function checkWeeklyRetro() {
  const now = new Date();
  if (now.getDay() !== 0 || now.getHours() < 20) return;
  const key = `dungeon-retro-${now.getFullYear()}-${_weekNumber(now)}`;
  if (localStorage.getItem(key)) return;
  localStorage.setItem(key, '1');
  showWeeklyRetro();
}

function showWeeklyRetro() {
  const dates    = _weekDates();
  const wQuests  = quests.filter(q => q.done && q.done_at && dates.some(d => q.done_at.startsWith(d)));
  const wPoms    = pomodoros.filter(p => p.started_at && dates.some(d => p.started_at.startsWith(d)));
  const wXP      = wQuests.reduce((s, q) => s + (XP_TABLE[q.type] || 50), 0);
  const dayCount = Object.fromEntries(dates.map(d => [d, quests.filter(q => q.done && q.done_at?.startsWith(d)).length]));
  const best     = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0];
  const bestLbl  = best ? new Date(best[0] + 'T12:00').toLocaleDateString('es-MX', { weekday:'long' }) : '-';
  const maxC     = Math.max(...Object.values(dayCount), 1);

  const el = document.getElementById('retroContent');
  if (!el) return;
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="retro-stat"><span class="retro-stat-num" style="color:var(--green)">${wQuests.length}</span><span class="retro-stat-lbl">misiones</span></div>
      <div class="retro-stat"><span class="retro-stat-num" style="color:var(--gold)">${wXP}</span><span class="retro-stat-lbl">XP ganado</span></div>
      <div class="retro-stat"><span class="retro-stat-num" style="color:var(--blue)">${wPoms.length}</span><span class="retro-stat-lbl">pomodoros</span></div>
      <div class="retro-stat"><span class="retro-stat-num" style="color:var(--accent);font-size:16px">${bestLbl}</span><span class="retro-stat-lbl">mejor día</span></div>
    </div>
    <div class="mini-bar-chart">${dates.map(d => `
      <div class="mini-bar-wrap">
        <div class="mini-bar" style="height:${Math.max(2, Math.round((dayCount[d]/maxC)*60))}px;background:var(--accent)"></div>
        <div class="mini-bar-label">${new Date(d+'T12:00').toLocaleDateString('es',{weekday:'narrow'})}</div>
      </div>`).join('')}</div>`;
  openModal('retroModal');
}

function oracleWeeklyReview() {
  const dates   = _weekDates();
  const wQuests = quests.filter(q => q.done && q.done_at && dates.some(d => q.done_at.startsWith(d)));
  const wPoms   = pomodoros.filter(p => p.started_at && dates.some(d => p.started_at.startsWith(d)));
  const wXP     = wQuests.reduce((s, q) => s + (XP_TABLE[q.type] || 50), 0);
  const byType  = ['main','side','daily','weekly'].map(t => `${t}: ${wQuests.filter(q=>q.type===t).length}`).join(', ');
  const pending = quests.filter(q => !q.done).slice(0, 8).map(q => `- ${q.name}`).join('\n');

  const prompt = `Retrospectiva semanal del dungeon:
• Misiones completadas: ${wQuests.length} (${byType})
• XP ganado: ${wXP} | Pomodoros: ${wPoms.length}
Misiones pendientes para la próxima semana:
${pending || '(ninguna)'}

Dame una reflexión honesta: qué funcionó, qué mejorar, y 3 objetivos concretos para la próxima semana.`;

  openOracle();
  const input = document.getElementById('oracleInput');
  if (input) { input.value = prompt; input.focus(); }
}

document.getElementById('oracleBtn').addEventListener('click', openOracle);
document.getElementById('oracleSend').addEventListener('click', oracleSend);
document.getElementById('oracleInput').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); oracleSend(); }
});
