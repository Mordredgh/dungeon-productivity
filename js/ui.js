/* UI */
function openEditQuest(id) {
  const q = quests.find(x => x.id === id);
  if (!q) return;
  document.getElementById('editQuestId').value   = id;
  document.getElementById('editQName').value     = q.name;
  document.getElementById('editQType').value     = q.type;
  document.getElementById('editQPriority').value = q.priority || 'normal';
  document.getElementById('editQDeadline').value = q.deadline || '';
  document.getElementById('editQNotes').value    = q.notes || '';
  document.getElementById('editQTags').value     = localStorage.getItem('dungeon-tags-' + id) || '';
  document.getElementById('editQEstTime').value  = localStorage.getItem('dungeon-esttime-' + id) || '';
  openModal('editQuestModal');
}

function setActiveQuest(id) {
  const q = quests.find(x => x.id === id);
  if (!q) return;
  document.getElementById('pomTaskLabel').textContent = `⚔️ ${q.name}`;
  toast('🍅', `Pomodoro vinculado: ${q.name}`);
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function showLevelUp(lvl) {
  document.getElementById('luLevel').textContent = `Nivel ${lvl}`;
  document.getElementById('luTitle').textContent = TITLES[Math.min(lvl - 1, TITLES.length - 1)];
  document.getElementById('luDesc').textContent = `¡Has ascendido a ${TITLES[Math.min(lvl - 1, TITLES.length - 1)]}!`;
  openModal('levelupModal');
  playLevelUpSound();
  spawnLevelUpParticles();
  spawnConfetti();
}

function toast(icon, msg, duration) {
  const container = document.getElementById('toastContainer');
  const div = document.createElement('div');
  div.className = 'toast';
  div.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-msg">${escHtml(msg)}</span>`;
  container.appendChild(div);
  setTimeout(() => div.remove(), duration || 4000);
}

function spawnParticle(text, sourceEl) {
  playXpSound();
  const rect = sourceEl ? sourceEl.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2 };
  const el = document.createElement('div');
  el.className = 'particle';
  el.textContent = text;
  el.style.left = (rect.left + 10) + 'px';
  el.style.top = rect.top + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

function spawnLevelUpParticles() {
  const emojis = ['⭐','✨','🌟','💫','🎉','🏆'];
  for (let i = 0; i < 12; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'particle';
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      el.style.left = Math.random() * window.innerWidth + 'px';
      el.style.top = Math.random() * window.innerHeight * 0.7 + 'px';
      el.style.fontSize = '24px';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 900);
    }, i * 80);
  }
}

function applyTemplate(idx) {
  const t = QUEST_TEMPLATES[idx];
  if (!t || !hero) return;
  t.quests.forEach(name => addQuest({ name, type: 'daily', priority: 'normal', hero_id: hero.id }));
  toast('📦', `Plantilla "${t.name}" aplicada.`);
}

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* THEME */
function cycleTheme() {
  const cur  = document.documentElement.dataset.theme || 'dark';
  const next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
  document.documentElement.dataset.theme = next;
  localStorage.setItem('dungeon-theme', next);
  toast('🎨', `Tema: ${THEME_NAMES[next] || next}`);
}

/* AVATAR */
function renderAvatarGrid() {
  const el = document.getElementById('avatarGrid');
  if (!el) return;
  el.innerHTML = AVATARS.map(a =>
    `<div class="avatar-opt ${hero && hero.avatar === a ? 'selected' : ''}" onclick="selectAvatar('${a}')">${a}</div>`
  ).join('');
}

function selectAvatar(a) {
  document.querySelectorAll('.avatar-opt').forEach(el => el.classList.toggle('selected', el.textContent === a));
  if (hero) hero._pendingAvatar = a;
}

/* EXPORT / IMPORT */
function exportData() {
  const data = { hero, quests, exported_at: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `dungeon-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  toast('📤', 'Datos exportados.');
}

async function doImport() {
  const text = document.getElementById('importText').value.trim();
  const type = document.getElementById('importType').value;
  if (!text || !hero) return;
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  for (const name of lines) await addQuest({ name, type, priority: 'normal', hero_id: hero.id });
  closeModal('importModal');
  document.getElementById('importText').value = '';
  toast('📥', `${lines.length} misiones importadas.`);
}

/* VIEW NAV */
function switchView(v) {
  document.querySelectorAll('.view-tab').forEach(t => t.classList.toggle('active', t.dataset.view === v));
  document.querySelectorAll('.view').forEach(el => el.classList.toggle('active', el.id === `view-${v}`));
  if (v === 'stats') renderStats();
  if (v === 'achievements') renderAchievements();
  if (v === 'history') renderHistory();
  if (v === 'map') renderMapView();
}

function toggleCompact() {
  compact = !compact;
  document.getElementById('app').dataset.compact = compact;
  toast('⊟', compact ? 'Modo compacto ON' : 'Modo compacto OFF');
}

/* KEYBOARD */
document.addEventListener('keydown', e => {
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  const key = e.key.toUpperCase();
  if (e.key === ' ') { e.preventDefault(); startTimer(); }
  if (key === 'N') { e.preventDefault(); document.getElementById('qName').focus(); }
  if (key === 'R') resetTimer();
  if (key === 'T') cycleTheme();
  if (key === 'C') toggleCompact();
  if (key === 'F') toggleFocusMode();
  if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
  if (key === '1') switchView('quests');
  if (key === '2') switchView('kanban');
  if (key === '3') switchView('stats');
  if (key === '4') switchView('achievements');
  if (key === '5') switchView('history');
});
