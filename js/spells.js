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

/* SPELLS — sistema de fragmentos + coste de maná */
const SPELL_DEFS = [
  {
    id: 'frenzy', icon: '⚡', name: 'Frenesí Arcano', mana: 40,
    desc: 'XP x2 durante 1 hora', color: '#a855f7',
    cast() {
      xpMultiplier = 2; xpMultiplierEnd = Date.now() + 3600000;
      toast('⚡', '¡Frenesí Arcano! XP x2 por 1 hora.');
    }
  },
  {
    id: 'speed', icon: '💨', name: 'Velocidad', mana: 15,
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
    id: 'berserker', icon: '🔥', name: 'Berserker', mana: 25,
    desc: 'XP x1.5 durante 25 min', color: '#fb7185',
    cast() {
      xpMultiplier = 1.5; xpMultiplierEnd = Date.now() + 25 * 60 * 1000;
      toast('🔥', '¡Berserker! XP x1.5 por 25 minutos.');
    }
  },
  {
    id: 'shield', icon: '🛡️', name: 'Escudo Arcano', mana: 20,
    desc: 'Recupera 25 HP al instante', color: '#4ade80',
    cast() {
      if (!hero) return;
      const newHp = Math.min(hero.hp_max || 100, (hero.hp || 0) + 25);
      hero.hp = newHp; saveHero({ hp: newHp }); renderHeroUI();
      toast('🛡️', '¡Escudo Arcano! +25 HP recuperado.');
    }
  },
  {
    id: 'modo-berserker', icon: '🧨', name: 'Modo Berserker', mana: 50,
    desc: 'XP x2 durante 90 min', color: '#f97316',
    cast() {
      xpMultiplier = 2; xpMultiplierEnd = Date.now() + 90 * 60 * 1000;
      toast('🧨', '¡Modo Berserker! XP x2 durante 90 minutos.');
    }
  },
  {
    id: 'healing', icon: '🌿', name: 'Curación Mayor', mana: 30,
    desc: 'Restaura 50 HP al instante', color: '#86efac',
    cast() {
      if (!hero) return;
      const newHp = Math.min(hero.hp_max || 100, (hero.hp || 0) + 50);
      hero.hp = newHp; saveHero({ hp: newHp }); renderHeroUI();
      toast('🌿', '¡Curación Mayor! +50 HP recuperado.');
    }
  },
  {
    id: 'mente-acero', icon: '🔷', name: 'Mente de Acero', mana: 35,
    desc: '+200 XP instantáneos', color: '#60a5fa',
    cast() {
      if (!hero) return;
      addXP(200, 'side', null);
      toast('🔷', '¡Mente de Acero! +200 XP.');
    }
  },
  {
    id: 'rayo-arcano', icon: '⚡', name: 'Rayo Arcano', mana: 20,
    desc: 'Inflige 25 de daño directo al jefe activo', color: '#fbbf24',
    cast() { if (typeof damageBoss==='function') damageBoss(25); toast('⚡', '¡Rayo Arcano! -25 HP al jefe.'); }
  },
  {
    id: 'bola-fuego', icon: '🔥', name: 'Bola de Fuego', mana: 30,
    desc: 'Inflige 40 de daño directo al jefe activo', color: '#f97316',
    cast() { if (typeof damageBoss==='function') damageBoss(40); toast('🔥', '¡Bola de Fuego! -40 HP al jefe.'); }
  },
  {
    id: 'maldicion-abismal', icon: '🌑', name: 'Maldición Abisal', mana: 25,
    desc: 'Inflige 35 de daño directo al jefe activo', color: '#7c3aed',
    cast() { if (typeof damageBoss==='function') damageBoss(35); toast('🌑', '¡Maldición Abisal! -35 HP al jefe.'); }
  },
  {
    id: 'tormenta-hielo', icon: '❄️', name: 'Tormenta de Hielo', mana: 40,
    desc: 'Inflige 60 de daño directo al jefe activo', color: '#93c5fd',
    cast() { if (typeof damageBoss==='function') damageBoss(60); toast('❄️', '¡Tormenta de Hielo! -60 HP al jefe.'); }
  },
  {
    id: 'furia-dragon', icon: '🐉', name: 'Furia del Dragón', mana: 60,
    desc: 'Inflige 100 de daño directo al jefe activo', color: '#ef4444',
    cast() { if (typeof damageBoss==='function') damageBoss(100); toast('🐉', '¡Furia del Dragón! -100 HP al jefe.'); }
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
  const manaCost = spell.mana ? Math.floor(spell.mana * (typeof getDungeonBonus==='function' ? getDungeonBonus('mana') : 1)) : 0;
  if (manaCost && (hero.mana || 0) < manaCost) {
    toast('💧', `Maná insuficiente (necesitas ${manaCost}, tienes ${hero.mana || 0}).`);
    return;
  }
  const ok = await consumeInvItem('spell_' + spellId, cost);
  if (!ok) { toast('❌', 'No se pudo consumir los fragmentos.'); return; }
  if (manaCost) {
    hero.mana = (hero.mana || 0) - manaCost;
    saveHero({ mana: hero.mana });
    if (typeof renderHeroUI === 'function') renderHeroUI();
  }
  spell.cast();
  saveHero({ spells_cast: (hero.spells_cast || 0) + 1 });
  renderSpells();
  updateSpellBadge();
  checkAchievements();
  document.dispatchEvent(new CustomEvent('dungeon:spellcast'));
}

function openSpellsModal() {
  openModal('spellsModal');
  renderSpells();
}

function renderSpells() {
  const el = document.getElementById('spellsList');
  if (!el) return;
  const curMana = hero ? (hero.mana || 0) : 0;
  el.innerHTML = `<div class="spell-orbs-grid">${SPELL_DEFS.map(s => {
    const cost     = SPELL_FRAG_COST[s.id] || 10;
    const have     = getInvCount('spell_' + s.id);
    const hasFrags = have >= cost;
    const hasMana  = !s.mana || curMana >= s.mana;
    const ready    = hasFrags && hasMana;
    const clr      = s.color || '#a855f7';
    const imgUrl   = 'images/spell_' + s.id + '.png';
    const manaBadge = s.mana
      ? `<div class="spell-orb-mana ${hasMana ? '' : 'spell-mana-low'}">💧${s.mana}</div>`
      : '';
    return `<button class="spell-orb ${ready ? '' : 'cd'}" onclick="castSpell('${s.id}')"
        title="${escHtml(s.name)}: ${escHtml(s.desc)} | ${cost} frags · ${s.mana || 0} maná"
        style="--spell-clr:${clr}">
      <img src="${imgUrl}" class="spell-orb-img" alt="${escHtml(s.name)}"
           onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
      <div class="spell-orb-icon" style="display:none">${s.icon}</div>
      <div class="spell-orb-name">${escHtml(s.name)}</div>
      <div class="spell-orb-frags ${hasFrags ? 'spell-orb-ready' : 'spell-orb-cd'}">${have}/${cost}</div>
      ${manaBadge}
    </button>`;
  }).join('')}</div>`;
}

/* ACHIEVEMENTS */
function checkAchievements() {
  if (!hero) return;
  let unlocked;
  try { unlocked = JSON.parse(hero.achievements || '[]'); } catch { unlocked = []; }
  let dates;
  try { dates = JSON.parse(hero.achievement_dates || '{}'); } catch { dates = {}; }
  let changed = false;
  for (const a of ACHIEVEMENT_DEFS) {
    if (!unlocked.includes(a.id) && a.cond(hero)) {
      unlocked.push(a.id);
      dates[a.id] = new Date().toISOString().split('T')[0];
      changed = true;
      if (a.hidden) {
        toast('🔮', `¡Logro secreto descubierto: ${a.name}!`);
        if (typeof addGold === 'function') addGold(50);
      } else {
        toast('🏆', `¡Logro desbloqueado: ${a.name}!`);
      }
    }
  }
  if (changed) {
    saveHero({ achievements: JSON.stringify(unlocked), achievement_dates: JSON.stringify(dates) });
    hero.achievements = JSON.stringify(unlocked);
    hero.achievement_dates = JSON.stringify(dates);
    renderAchievements();
  }
}

const ACH_CATS = [
  { name: '⚔️ Combate',    ids: ['first_quest','ten_quests','fifty_quests','centurion','quest_200','quest_500'] },
  { name: '📈 Progresión', ids: ['first_level','level_five','level_ten','level_fifteen','level_twenty','thousand_xp','xp_5k','xp_25k'] },
  { name: '🍅 Pomodoro',   ids: ['first_pom','ten_poms','pom_25','pom_50','pom_100','pom_250','maratonista'] },
  { name: '🔥 Rachas',     ids: ['streak_3','streak_7','streak_14','streak_30','streak_60','streak_100','unstoppable','semana_perfecta'] },
  { name: '⭐ Épicas',     ids: ['first_main','five_main','main_25','boss_slayer'] },
  { name: '✨ Magia',      ids: ['spell_cast','master_spell'] },
  { name: '❤️ Salud',      ids: ['full_hp','healer'] },
  { name: '🪙 Oro',        ids: ['gold_500','gold_2000','gold_10k'] },
  { name: '🌟 Especiales', ids: ['collector','daily_5','weekly_done','pom_streak_4','nightowl','earlybird'] },
  { name: '🔮 Secretos',  ids: ['h_madrugador','h_nocturno','h_maldito','h_dia_gloria','h_renacido','h_domingo','h_equilibrio','h_atributos','h_racha21','h_xp10k','h_ultimo_seg','h_triple_main','h_zona_legend','h_pom_dia','h_habito10'] },
];

function renderAchievements() {
  const el = document.getElementById('achievementsGrid');
  if (!el) return;
  let unlocked;
  try { unlocked = JSON.parse(hero ? hero.achievements || '[]' : '[]'); } catch { unlocked = []; }

  const achById = {};
  ACHIEVEMENT_DEFS.forEach(a => achById[a.id] = a);

  let dates2;
  try { dates2 = JSON.parse(hero ? hero.achievement_dates || '{}' : '{}'); } catch { dates2 = {}; }

  const renderCard = a => {
    if (!a) return '';
    const ok      = unlocked.includes(a.id);
    const dateStr = ok && dates2[a.id] ? dates2[a.id] : null;
    const mystery = a.hidden && !ok;
    const icon    = mystery ? '🔒' : a.icon;
    const name    = mystery ? '???' : escHtml(a.name);
    const desc    = ok ? a.desc : (mystery ? 'Logro secreto — ¡descúbrelo!' : '???');
    return `<div class="achievement-card ${ok ? 'unlocked' : 'locked'} ${mystery ? 'ach-mystery' : ''}">
      <div class="achievement-icon">${icon}</div>
      <div class="achievement-info">
        <div class="achievement-name">${name}</div>
        <div class="achievement-desc">${desc}</div>
        ${ok ? `<div class="achievement-date">✅${dateStr ? ' ' + dateStr : ''}</div>` : ''}
      </div>
    </div>`;
  };

  const knownIds  = new Set(ACH_CATS.flatMap(c => c.ids));
  const extraAchs = ACHIEVEMENT_DEFS.filter(a => !knownIds.has(a.id));

  // Secret achievements counter banner
  const secretDefs  = ACHIEVEMENT_DEFS.filter(a => a.hidden);
  const secretFound = secretDefs.filter(a => unlocked.includes(a.id)).length;
  const secretBanner = secretDefs.length
    ? `<div class="ach-secret-banner">🔮 ${secretFound} / ${secretDefs.length} secretos descubiertos</div>`
    : '';

  el.innerHTML = secretBanner + ACH_CATS.map(cat => {
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
  if (typeof animPageItems === 'function') animPageItems('.achievement-card', el);
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
