/* UI */
function generateSubtasks() {
  const prefix = (document.getElementById('subtaskPrefix').value.trim()) || 'Ítem';
  const count  = Math.min(100, Math.max(1, parseInt(document.getElementById('subtaskCount').value) || 0));
  if (!count) { toast('⚠️', 'Escribe un número de subtareas'); return; }
  const notesEl = document.getElementById('editQNotes');
  const existing = notesEl.value.trimEnd();
  const items = Array.from({ length: count }, (_, i) => `- [ ] ${prefix} ${i + 1}`).join('\n');
  notesEl.value = existing ? existing + '\n' + items : items;
}

function openEditQuest(id) {
  const q = quests.find(x => x.id === id);
  if (!q) return;
  document.getElementById('editQuestId').value     = id;
  document.getElementById('editQName').value       = q.name;
  document.getElementById('editQType').value       = q.type;
  const validRarities = ['mitico','legendario','epico','normal','comun'];
  document.getElementById('editQPriority').value   = validRarities.includes(q.priority) ? q.priority : 'normal';
  document.getElementById('editQDeadline').value   = q.deadline || '';
  document.getElementById('editQNotes').value      = q.notes || '';
  document.getElementById('editQTags').value       = q.tags || '';
  // Show reminder time field for habits
  const habitReminderGroup = document.getElementById('habitReminderGroup');
  const reminderInp = document.getElementById('editQReminderTime');
  if (habitReminderGroup) habitReminderGroup.style.display = q.type === 'habit' ? '' : 'none';
  if (reminderInp) {
    const m = (q.tags || '').match(/reminder-(\d{1,2}:\d{2})/i);
    reminderInp.value = m ? m[1].padStart(5, '0') : '';
  }
  document.getElementById('editQEstTime').value    = q.est_time || '';
  document.getElementById('editQRepeat').value     = q.repeat_days || '';
  document.getElementById('editQStartDate').value  = q.quest_start_date || '';
  document.getElementById('editQDependsOn').value  = q.depends_on || '';
  if (typeof populateGoalSelect === 'function') populateGoalSelect(q.goal_id || '');
  const zoneEl = document.getElementById('editQZone');
  if (zoneEl) {
    const tagStr = q.tags || '';
    if (/\bestudio\b/i.test(tagStr)) zoneEl.value = 'estudio';
    else if (/\bejercicio\b/i.test(tagStr)) zoneEl.value = 'ejercicio';
    else zoneEl.value = '';
  }
  openModal('editQuestModal');
}

async function doImportCSV() {
  const text = document.getElementById('importCsvText').value.trim();
  if (!text || !hero) return;
  const validTypes = ['main','side','daily','weekly'];
  const validPrio  = ['mitico','legendario','epico','normal','comun'];
  let count = 0;
  for (const line of text.split('\n').map(l=>l.trim()).filter(Boolean)) {
    const [name, tipo, prioridad, deadline] = line.split(',').map(s => s.trim());
    if (!name) continue;
    await addQuest({
      name,
      type:     validTypes.includes(tipo) ? tipo : 'side',
      priority: validPrio.includes(prioridad) ? prioridad : 'normal',
      deadline: deadline || null,
      hero_id:  hero.id
    });
    count++;
  }
  closeModal('importModal');
  document.getElementById('importCsvText').value = '';
  toast('📊', `${count} misiones importadas desde CSV.`);
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
  const dynTitle = typeof getDynamicTitle === 'function' && hero ? getDynamicTitle(hero) : TITLES[Math.min(lvl - 1, TITLES.length - 1)];
  document.getElementById('luLevel').textContent = `Nivel ${lvl}`;
  document.getElementById('luTitle').textContent = dynTitle;
  document.getElementById('luDesc').textContent  = `¡Has ascendido a ${dynTitle}!`;

  // Perks list
  const perksEl = document.getElementById('luPerks');
  if (perksEl) {
    const perks = ['✨ +1 punto de atributo disponible'];
    if (lvl % 10 === 0) perks.push(`🏆 ¡Hito alcanzado! Nivel ${lvl}`);
    if (lvl === 50)     perks.push('⭐ ¡Nivel máximo! Ya puedes Ascender en tu hoja de personaje.');
    if ((hero?.prestige || 0) > 0) perks.push(`⭐×${hero.prestige} Bonus de Ascensión activo: +${hero.prestige * 5}% XP`);
    perksEl.innerHTML = perks.map((p, i) =>
      `<div class="levelup-perk" style="animation-delay:${i * 0.12}s">${escHtml(p)}</div>`
    ).join('');
  }

  // Floating stars
  const starsEl = document.getElementById('luStars');
  if (starsEl) {
    starsEl.innerHTML = '';
    const icons = ['⭐','✨','💫','🌟'];
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('div');
      s.className = 'levelup-star';
      s.textContent = icons[i % 4];
      s.style.cssText = `left:${(Math.random()*86+5).toFixed(1)}%;top:${(Math.random()*70+15).toFixed(1)}%;animation-delay:${(Math.random()*0.9).toFixed(2)}s;animation-duration:${(1.2+Math.random()*0.8).toFixed(2)}s`;
      starsEl.appendChild(s);
    }
  }

  openModal('levelupModal');
  playLevelUpSound();
  spawnLevelUpParticles();
  spawnConfetti();
  // Auto-cierre en 6s
  setTimeout(() => {
    const m = document.getElementById('levelupModal');
    if (m && m.classList.contains('open')) closeModal('levelupModal');
  }, 6000);
}

function toast(icon, msg, duration) {
  const container = document.getElementById('toastContainer');
  const div = document.createElement('div');
  div.className = 'toast';
  div.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-msg">${escHtml(msg)}</span>`;
  container.appendChild(div);
  setTimeout(() => div.remove(), duration || 4000);
}

function toastAction(icon, msg, btnText, fn, duration) {
  const container = document.getElementById('toastContainer');
  const div = document.createElement('div');
  div.className = 'toast toast-action';
  div.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-msg">${escHtml(msg)}</span><button class="toast-btn">${escHtml(btnText)}</button>`;
  div.querySelector('.toast-btn').addEventListener('click', () => { fn(); div.remove(); });
  container.appendChild(div);
  setTimeout(() => div.remove(), duration || 9000);
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

function spawnHPParticle(amount, el) {
  const heal = amount > 0;
  const div  = document.createElement('div');
  div.className = `particle particle-hp ${heal ? 'particle-heal' : 'particle-dmg'}`;
  div.textContent = (heal ? '+' : '') + amount + ' HP';
  const rect = el ? el.getBoundingClientRect() : { left: window.innerWidth/2, top: window.innerHeight/2 };
  div.style.left = (rect.left + 10) + 'px';
  div.style.top  = rect.top + 'px';
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 950);
}

function spawnGoldParticle(amount, el) {
  const div = document.createElement('div');
  div.className = 'particle particle-gold';
  div.textContent = '+' + amount + ' 🪙';
  const rect = el ? el.getBoundingClientRect() : { left: window.innerWidth/2, top: window.innerHeight/2 };
  div.style.left = (rect.left + 10) + 'px';
  div.style.top  = rect.top + 'px';
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 950);
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


function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
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
const CHAR_HUB_TABS = { 'skill-tree':'skills', 'runes':'runes', 'bestiary':'bestiary', 'smithy':'smithy' };

function switchView(v) {
  if (v === 'oracle') { if (typeof openOracle === 'function') openOracle(); return; }
  // Redirect hub sub-views to character view with the right tab
  if (CHAR_HUB_TABS[v]) { switchCharTab(CHAR_HUB_TABS[v]); v = 'character'; }
  document.querySelectorAll('.view-tab, .sidebar-item').forEach(t => t.classList.toggle('active', t.dataset.view === v));
  document.querySelectorAll('.view').forEach(el => {
    const active = el.id === `view-${v}`;
    el.classList.toggle('active', active);
    if (active) el.style.setProperty('--view-bg-url', `url(${CDN}dungeon/fondo_${v}.png)`);
  });
  const charHub = document.getElementById('charHubTabs');
  if (charHub) charHub.style.display = v === 'character' ? 'flex' : 'none';
  if (v === 'stats')        renderStats();
  if (v === 'achievements') renderAchievements();
  if (v === 'history')      { historyPage = 1; renderHistory(); }
  if (v === 'calendar')     renderCalendar();
  if (v !== 'pets' && typeof cleanupGarden === 'function') cleanupGarden();
  if (v === 'pets')         { renderPets(); switchPetsTab('list'); }
  if (v === 'shop')         renderShopView();
  if (v === 'inventory')    { if (typeof renderInventory==='function') renderInventory(); }
  if (v === 'character')    { if (typeof renderCharacterSheet==='function') renderCharacterSheet(); }
  if (v === 'goals')        { if (typeof renderGoals==='function')        renderGoals(); }
  if (v === 'dungeon-grows'){ if (typeof renderDungeonGrows==='function') renderDungeonGrows(); }
  if (v === 'zones')        { if (typeof renderZones==='function')        renderZones(); }
  if (v === 'worldmap')     { if (typeof renderWorldMap==='function')     renderWorldMap(); }
  if (v === 'integrations') { renderIntegrations(); }
  // Mobile nav: highlight "Más" button when active view isn't a primary tab
  const moreBtn = document.getElementById('mobileNavMoreBtn');
  if (moreBtn) {
    const primaryViews = ['quests', 'character', 'stats'];
    moreBtn.classList.toggle('mobile-nav-more-active', !primaryViews.includes(v));
  }
}

function openMobileMore() {
  document.getElementById('mobileNavMoreOverlay')?.classList.add('open');
  document.getElementById('mobileNavMoreSheet')?.classList.add('open');
}
function closeMobileMore() {
  document.getElementById('mobileNavMoreOverlay')?.classList.remove('open');
  document.getElementById('mobileNavMoreSheet')?.classList.remove('open');
}

function switchCharTab(tab) {
  // If character view isn't active yet, activate it first
  if (!document.getElementById('view-character')?.classList.contains('active')) {
    document.querySelectorAll('.view-tab, .sidebar-item').forEach(t => t.classList.toggle('active', t.dataset.view === 'character'));
    document.querySelectorAll('.view').forEach(el => el.classList.toggle('active', el.id === 'view-character'));
  }
  document.querySelectorAll('.char-tab').forEach(t => t.classList.toggle('active', t.dataset.ctab === tab));
  document.querySelectorAll('.char-tab-panel').forEach(p => p.classList.toggle('active', p.id === `ctab-${tab}`));
  // Render the appropriate content
  if (tab === 'sheet')    { if (typeof renderCharacterSheet==='function') renderCharacterSheet(); }
  if (tab === 'skills')   { if (typeof renderSkillTree==='function')      renderSkillTree(); }
  if (tab === 'runes')    { if (typeof renderRunePanel==='function')      renderRunePanel(); }
  if (tab === 'bestiary')       { if (typeof renderBestiary==='function')      renderBestiary(); }
  if (tab === 'smithy')         { if (typeof renderSmithy==='function')        renderSmithy(); }
  if (tab === 'sala-personal')  { if (typeof renderSalaPersonal==='function')  renderSalaPersonal(); }
  // Set sub-tab background image
  const charView = document.getElementById('view-character');
  const tabFondo = { sheet:'character', skills:'skills', runes:'runes', bestiary:'bestiary', smithy:'smithy' };
  if (charView && tabFondo[tab]) charView.style.setProperty('--view-bg-url', `url(${CDN}dungeon/fondo_${tabFondo[tab]}.png)`);
}

function renderIntegrations() {
  if (typeof renderFitWidget  === 'function') renderFitWidget();
  if (typeof renderCalendarWidget === 'function') renderCalendarWidget();
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
  if (key === 'C') toggleCompact();
  if (key === 'F') toggleFocusMode();
  if (key === 'S') toggleSidebar();
  if (key === 'B') { bulkMode ? exitBulkMode() : enterBulkMode(); }
  if (e.key === '?') { e.preventDefault(); openModal('shortcutsModal'); }
  if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
  if (key === '1') switchView('quests');
  if (key === '2') switchView('character');
  if (key === '3') switchView('stats');
  if (key === '4') switchView('achievements');
  if (key === '5') switchView('history');
});
