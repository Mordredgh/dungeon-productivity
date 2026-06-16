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

/* SPELLS — sistema de fragmentos (no cooldown por tiempo) */
const SPELL_DEFS = [
  {
    id: 'frenzy', icon: '⚡', name: 'Frenesí Arcano',
    desc: 'XP x2 durante 1 hora', color: '#a855f7',
    cast() {
      xpMultiplier = 2; xpMultiplierEnd = Date.now() + 3600000;
      toast('⚡', '¡Frenesí Arcano! XP x2 por 1 hora.');
    }
  },
  {
    id: 'speed', icon: '💨', name: 'Velocidad',
    desc: 'Próximo pom: 10 min con XP completo', color: '#22d3ee',
    cast() {
      if (timer.running) { toast('⚠️', 'Pausa el pomodoro primero.'); return; }
      timer.duration = 10; timer.seconds = 600;
      document.querySelectorAll('.dur-btn').forEach(b => b.classList.remove('active'));
      updateTimerUI();
      toast('💨', '¡Velocidad! Próximo pom: 10 min con XP completo.');
    }
  },
  {
    id: 'berserker', icon: '🔥', name: 'Berserker',
    desc: 'XP x1.5 durante 25 min', color: '#fb7185',
    cast() {
      xpMultiplier = 1.5; xpMultiplierEnd = Date.now() + 25 * 60 * 1000;
      toast('🔥', '¡Berserker! XP x1.5 por 25 minutos.');
    }
  },
  {
    id: 'shield', icon: '🛡️', name: 'Escudo Arcano',
    desc: 'Recupera 25 HP al instante', color: '#4ade80',
    cast() {
      if (!hero) return;
      const newHp = Math.min(hero.hp_max || 100, (hero.hp || 0) + 25);
      hero.hp = newHp; saveHero({ hp: newHp }); renderHero();
      toast('🛡️', '¡Escudo Arcano! +25 HP recuperado.');
    }
  },
  {
    id: 'modo-berserker', icon: '🧨', name: 'Modo Berserker',
    desc: 'XP x2 en las próximas 3 misiones', color: '#f97316',
    cast() {
      xpMultiplier = 2; xpMultiplierEnd = Date.now() + 90 * 60 * 1000;
      toast('🧨', '¡Modo Berserker! XP x2 en las próximas misiones.');
    }
  },
  {
    id: 'healing', icon: '🌿', name: 'Curación Mayor',
    desc: 'Restaura 50 HP al instante', color: '#86efac',
    cast() {
      if (!hero) return;
      const newHp = Math.min(hero.hp_max || 100, (hero.hp || 0) + 50);
      hero.hp = newHp; saveHero({ hp: newHp }); renderHero();
      toast('🌿', '¡Curación Mayor! +50 HP recuperado.');
    }
  },
  {
    id: 'mente-acero', icon: '🔷', name: 'Mente de Acero',
    desc: '+200 XP instantáneos', color: '#60a5fa',
    cast() {
      if (!hero) return;
      addXP(200, 'side', null);
      toast('🔷', '¡Mente de Acero! +200 XP.');
    }
  },
];

async function castSpell(spellId) {
  const spell = SPELL_DEFS.find(s => s.id === spellId);
  if (!spell) return;
  const cost = SPELL_FRAG_COST[spellId] || 10;
  const have = getInvCount('spell_' + spellId);
  if (have < cost) {
    toast('❌', `Necesitas ${cost} fragmentos de ${spell.name} (tienes ${have}).`);
    return;
  }
  const ok = await consumeInvItem('spell_' + spellId, cost);
  if (!ok) { toast('❌', 'No se pudo consumir los fragmentos.'); return; }
  spell.cast();
  saveHero({ spells_cast: (hero.spells_cast || 0) + 1 });
  renderSpells();
  updateSpellBadge();
  checkAchievements();
  document.dispatchEvent(new CustomEvent('dungeon:spellcast'));
}

function renderSpells() {
  const el = document.getElementById('spellsList');
  if (!el) return;
  el.innerHTML = `<div class="spell-orbs-grid">${SPELL_DEFS.map(s => {
    const cost = SPELL_FRAG_COST[s.id] || 10;
    const have = getInvCount('spell_' + s.id);
    const ready = have >= cost;
    const clr   = s.color || '#a855f7';
    const imgUrl = CDN + 'dungeon/spell_' + s.id + '.png';
    return `<button class="spell-orb ${ready ? '' : 'cd'}" onclick="castSpell('${s.id}')"
        title="${escHtml(s.name)}: ${escHtml(s.desc)} | Coste: ${cost} frags"
        style="--spell-clr:${clr}">
      <img src="${imgUrl}" class="spell-orb-img" alt="${escHtml(s.name)}"
           onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
      <div class="spell-orb-icon" style="display:none">${s.icon}</div>
      <div class="spell-orb-name">${escHtml(s.name)}</div>
      <div class="spell-orb-frags ${ready ? 'spell-orb-ready' : 'spell-orb-cd'}">${have}/${cost}</div>
    </button>`;
  }).join('')}</div>`;
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
  if (typeof showEventModal === 'function') {
    showEventModal(ev);
  } else {
    showEventBanner(ev);
  }
  scheduleRandomEvent();
}

function showEventBanner(ev) {
  const old = document.getElementById('eventBanner');
  if (old) old.remove();
  const div = document.createElement('div');
  div.id = 'eventBanner';
  div.className = 'event-banner';
  div.innerHTML = `<div class="event-banner-title">${ev.title}</div><div class="event-banner-text">${ev.desc || ev.text || ''}</div>`;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 8000);
}
