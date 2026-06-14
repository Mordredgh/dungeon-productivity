/* AUDIO */
let audioCtx;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playBeep(type) {
  try {
    const ctx = getAudioCtx();
    const notes = type === 'complete' ? [523, 659, 784] : [784, 659, 523];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq; osc.type = 'sine';
      const t = ctx.currentTime + i * 0.15;
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.start(t); osc.stop(t + 0.3);
    });
  } catch {}
}

function playXpSound() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(); osc.stop(ctx.currentTime + 0.25);
  } catch {}
}

/* NOTIFICATIONS */
let notifEnabled = false;

async function requestNotifPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') await Notification.requestPermission();
  notifEnabled = Notification.permission === 'granted';
}

function sendNotif(title, body) {
  if (!notifEnabled || Notification.permission !== 'granted') return;
  try { new Notification(title, { body }); } catch {}
}

/* SPELLS */
const SPELL_DEFS = [
  {
    id: 'frenzy', icon: '⚡', name: 'Frenesí Arcano',
    desc: 'Dobla XP por 1 hora', cd: 3 * 24 * 3600 * 1000,
    cast() {
      xpMultiplier = 2; xpMultiplierEnd = Date.now() + 3600000;
      toast('⚡', '¡Frenesí Arcano! XP x2 por 1 hora.');
    }
  },
  {
    id: 'wisdom', icon: '🧙', name: 'Sabiduría',
    desc: 'Auto-completa todas las misiones diarias', cd: 24 * 3600 * 1000,
    async cast() {
      const dailies = quests.filter(q => q.type === 'daily' && !q.done);
      for (const q of dailies) await completeQuest(q.id, null);
      toast('🧙', `¡Sabiduría! ${dailies.length} misiones diarias completadas.`);
    }
  },
  {
    id: 'speed', icon: '💨', name: 'Velocidad',
    desc: 'Próximo pomodoro dura 10 min con XP completo', cd: 2 * 24 * 3600 * 1000,
    cast() {
      if (timer.running) { toast('⚠️', 'Pausa el pomodoro primero.'); return; }
      timer.duration = 10; timer.seconds = 600;
      document.querySelectorAll('.dur-btn').forEach(b => b.classList.remove('active'));
      updateTimerUI();
      toast('💨', '¡Velocidad! Próximo pomodoro: 10 min con XP completo.');
    }
  }
];

function castSpell(spellId) {
  const spell = SPELL_DEFS.find(s => s.id === spellId);
  if (!spell) return;
  const lastCast = spellState[spellId] || 0;
  if (Date.now() - lastCast < spell.cd) { toast('❌', `${spell.name} en cooldown.`); return; }
  spell.cast();
  spellState[spellId] = Date.now();
  saveHero({ spells: JSON.stringify(spellState), spells_cast: (hero.spells_cast || 0) + 1 });
  renderSpells();
  updateSpellBadge();
  checkAchievements();
  document.dispatchEvent(new CustomEvent('dungeon:spellcast'));
}

function renderSpells() {
  const el = document.getElementById('spellsList');
  el.innerHTML = SPELL_DEFS.map(s => {
    const lastCast = spellState[s.id] || 0;
    const elapsed = Date.now() - lastCast;
    const onCD = elapsed < s.cd;
    const cdLeft = onCD ? formatCDTime(s.cd - elapsed) : null;
    return `<div class="spell-card ${onCD ? 'cd' : ''}">
      <div class="spell-icon">${s.icon}</div>
      <div class="spell-info">
        <div class="spell-name">${s.name}</div>
        <div class="spell-desc">${s.desc}</div>
        ${onCD ? `<div class="spell-cd">CD: ${cdLeft}</div>` : ''}
      </div>
      <button class="spell-cast-btn" ${onCD ? 'disabled' : ''} onclick="castSpell('${s.id}')">
        ${onCD ? '⏳' : 'Lanzar'}
      </button>
    </div>`;
  }).join('');
}

function formatCDTime(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/* ACHIEVEMENTS */
function checkAchievements() {
  if (!hero) return;
  let unlocked;
  try { unlocked = JSON.parse(hero.achievements || '[]'); } catch { unlocked = []; }
  let changed = false;
  for (const a of ACHIEVEMENT_DEFS) {
    if (!unlocked.includes(a.id) && a.cond(hero)) {
      unlocked.push(a.id);
      changed = true;
      toast('🏆', `¡Logro desbloqueado: ${a.name}!`);
    }
  }
  if (changed) {
    saveHero({ achievements: JSON.stringify(unlocked) });
    hero.achievements = JSON.stringify(unlocked);
    renderAchievements();
  }
}

const ACH_CATS = [
  { name: '⚔️ Combate',    ids: ['first_quest','ten_quests','fifty_quests','centurion'] },
  { name: '📈 Progresión', ids: ['first_level','level_five','level_ten','thousand_xp'] },
  { name: '🍅 Pomodoro',   ids: ['first_pom','ten_poms','maratonista'] },
  { name: '🔥 Rachas',     ids: ['streak_3','streak_7','streak_30','unstoppable','semana_perfecta'] },
  { name: '⭐ Épicas',     ids: ['first_main','five_main','boss_slayer'] },
  { name: '✨ Magia',      ids: ['spell_cast','master_spell'] },
  { name: '❤️ Salud',      ids: ['full_hp','healer'] },
  { name: '🌟 Especiales', ids: ['collector'] },
];

function renderAchievements() {
  const el = document.getElementById('achievementsGrid');
  if (!el) return;
  let unlocked;
  try { unlocked = JSON.parse(hero ? hero.achievements || '[]' : '[]'); } catch { unlocked = []; }

  const achById = {};
  ACHIEVEMENT_DEFS.forEach(a => achById[a.id] = a);

  const renderCard = a => {
    if (!a) return '';
    const ok = unlocked.includes(a.id);
    return `<div class="achievement-card ${ok ? 'unlocked' : 'locked'}">
      <div class="achievement-icon">${a.icon}</div>
      <div class="achievement-info">
        <div class="achievement-name">${a.name}</div>
        <div class="achievement-desc">${ok ? a.desc : '???'}</div>
        ${ok ? `<div style="font-size:10px;color:var(--green);margin-top:4px">✅</div>` : ''}
      </div>
    </div>`;
  };

  const knownIds = new Set(ACH_CATS.flatMap(c => c.ids));
  const extraAchs = ACHIEVEMENT_DEFS.filter(a => !knownIds.has(a.id));

  el.innerHTML = ACH_CATS.map(cat => {
    const cards = cat.ids.map(id => renderCard(achById[id])).filter(Boolean);
    if (!cards.length) return '';
    return `<div class="ach-cat-section">
      <div class="ach-cat-header">${cat.name}</div>
      <div class="ach-cat-grid">${cards.join('')}</div>
    </div>`;
  }).join('') + (extraAchs.length ? `<div class="ach-cat-section">
    <div class="ach-cat-header">🎖️ Otros</div>
    <div class="ach-cat-grid">${extraAchs.map(renderCard).join('')}</div>
  </div>` : '');
}

/* RANDOM EVENTS */
function scheduleRandomEvent() {
  const delay = 5 * 60 * 1000 + Math.random() * 10 * 60 * 1000;
  setTimeout(triggerRandomEvent, delay);
}

function triggerRandomEvent() {
  if (Math.random() > 0.4) { scheduleRandomEvent(); return; }
  const ev = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
  showEventBanner(ev);
  if (ev.bonus > 0) addXP(ev.bonus, 'side', null);
  if (ev.doubleXP) { xpMultiplier = 2; xpMultiplierEnd = Date.now() + 30 * 60 * 1000; updateSpellBadge(); }
  scheduleRandomEvent();
}

function showEventBanner(ev) {
  const old = document.getElementById('eventBanner');
  if (old) old.remove();
  const div = document.createElement('div');
  div.id = 'eventBanner';
  div.className = 'event-banner';
  div.innerHTML = `<div class="event-banner-title">${ev.title}</div><div class="event-banner-text">${ev.text}</div>`;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 8000);
}
