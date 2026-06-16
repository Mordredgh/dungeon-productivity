/* ============================================================
   RPG SYSTEMS: Weather · Boss · Events · Class Skills · Diary · Prophecy
   ============================================================ */

/* ── WEATHER ─────────────────────────────────────────────── */
function calcTodayWeather() {
  if (!hero) return 'clear';
  const today   = new Date().toISOString().split('T')[0];
  const overdue = quests.filter(q => !q.done && q.deadline && q.deadline < today).length;
  const hp      = (hero.hp || 100) / (hero.hp_max || 100);
  const streak  = hero.streak || 0;
  const dow     = new Date().getDay(); // 0=Sunday
  if (overdue >= 5)              return 'storm';
  if (dow === 0 && hp > 0.5)    return 'eclipse';
  if (streak >= 7 && hp > 0.75) return 'rainbow';
  if (overdue === 0 && hp > 0.6) return 'clear';
  return 'fog';
}
function getTodayWeather() {
  const key = 'dungeon-weather-' + new Date().toISOString().split('T')[0];
  let w = localStorage.getItem(key);
  if (!w) { w = calcTodayWeather(); localStorage.setItem(key, w); }
  return w;
}
function renderWeather() {
  const el = document.getElementById('weatherDisplay');
  if (!el) return;
  const w  = getTodayWeather();
  const wd = WEATHER_TYPES[w] || WEATHER_TYPES.clear;
  el.textContent = wd.icon;
  el.title = `${wd.name}: ${wd.desc}`;
  // Storm: -5 HP on open (once per day)
  if (w === 'storm' && hero) {
    const skey = 'dungeon-storm-dmg-' + new Date().toISOString().split('T')[0];
    if (!localStorage.getItem(skey)) {
      localStorage.setItem(skey, '1');
      const newHp = Math.max(10, (hero.hp || 100) - 5);
      if (newHp < hero.hp) {
        hero.hp = newHp; saveHero({ hp: newHp }); renderHeroUI();
        setTimeout(() => toast('⛈️', 'La Tormenta ataca: -5 HP'), 1500);
      }
    }
  }
}

/* ── WEEKLY BOSS ──────────────────────────────────────────── */
function _bossWeekKey() {
  const d    = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `dungeon-boss-${d.getFullYear()}-${week}`;
}
function getBossState() {
  const key    = _bossWeekKey();
  const stored = localStorage.getItem(key);
  if (stored) return JSON.parse(stored);

  // Seasonal boss check
  const now   = new Date();
  const month = now.getMonth();
  const day   = now.getDate();
  const seasonal = BOSS_DEFS.find(b => b.seasonal &&
    b.seasonal.month === month &&
    day >= b.seasonal.dayStart &&
    day <= b.seasonal.dayEnd);

  let boss, bossMaxHp;
  if (seasonal) {
    boss = seasonal;
    bossMaxHp = boss.hp;
  } else {
    const pending      = quests.filter(q => !q.done && q.type !== 'daily');
    const regularBosses = BOSS_DEFS.filter(b => !b.seasonal);
    const d    = new Date();
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
    boss = regularBosses[week % regularBosses.length];
    bossMaxHp = Math.min(Math.max(pending.length * 20, 60), 400);
  }

  const state = { hp: bossMaxHp, maxHp: bossMaxHp, name: boss.name, bossKey: boss.key, defeated: false };
  localStorage.setItem(key, JSON.stringify(state));
  return state;
}
function saveBossState(s) { localStorage.setItem(_bossWeekKey(), JSON.stringify(s)); }

function damageBoss(dmg) {
  const state = getBossState();
  if (state.defeated) return;
  const weather = getTodayWeather();
  const finalDmg = weather === 'storm' ? dmg * 2 : dmg;
  state.hp = Math.max(0, state.hp - finalDmg);
  if (state.hp === 0 && !state.defeated) {
    state.defeated = true;
    saveBossState(state);
    setTimeout(async () => {
      addGold(150);
      await addXP(250, 'main', null);
      toast('🏆', `¡${state.name} DERROTADO! +150🪙 +250 XP`);
      updateBossBanner();
    }, 800);
    return;
  }
  saveBossState(state);
  updateBossBanner();
}

/* ── RANDOM EVENTS ────────────────────────────────────────── */
function checkRandomEvent() {
  const today = new Date().toISOString().split('T')[0];
  const key   = 'dungeon-event-' + today;
  if (localStorage.getItem(key)) return;
  if (Math.random() > 0.25) return;
  localStorage.setItem(key, '1');
  const ev = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
  setTimeout(() => showEventModal(ev), 3500);
}
function showEventModal(ev) {
  document.getElementById('eventIcon').textContent  = ev.icon;
  document.getElementById('eventTitle').textContent = ev.title;
  document.getElementById('eventDesc').textContent  = ev.desc;
  document.getElementById('eventChoices').innerHTML = ev.choices.map((c, i) =>
    `<button class="btn btn-primary" style="flex:1;min-width:120px" onclick="resolveEvent('${ev.id}','${c.effect}',${i})">${c.label}</button>`
  ).join('');
  openModal('eventModal');
}
async function resolveEvent(evId, effect) {
  closeModal('eventModal');
  if (effect === 'none') return;
  const today = new Date().toISOString().split('T')[0];
  if (effect === 'xp100')     { await addXP(100, 'main', null); toast('⚡', '+100 XP del mercader.'); }
  if (effect === 'gold80')    { addGold(80); toast('💰', '+80🪙 encontrados.'); }
  if (effect === 'doubleNext'){ localStorage.setItem('dungeon-double-next', '1'); toast('✨', '¡Próxima misión con 2× XP y oro!'); }
  if (effect === 'streak1')   { const ns = (hero.streak||0)+1; await saveHero({streak:ns}); hero.streak=ns; renderHeroUI(); toast('🔮', '+1 día de racha mística.'); }
  if (effect === 'hp20')      { const h = Math.min((hero.hp||100)+20, hero.hp_max||100); hero.hp=h; await saveHero({hp:h}); renderHeroUI(); toast('🍺', '+20 HP en la taberna.'); }
  if (effect === 'bossHP50')  { const s=getBossState(); s.hp=Math.min(s.hp+50,s.maxHp); saveBossState(s); updateBossBanner(); toast('🐉', '¡El Jefe absorbe poder dracónico! +50 HP de boss.'); }
  if (effect === 'mainBonus') { localStorage.setItem('dungeon-main-bonus-'+today, '20'); toast('📜', 'Las misiones principales dan +20 XP hoy.'); }
  if (effect === 'curse')     { localStorage.setItem('dungeon-curse-'+today, '2'); toast('💀', '¡Maldición activa! Completa 2 misiones o pierdes HP.'); }
  if (effect === 'potion')    { localStorage.setItem('dungeon-potion-exp', Date.now()+30*60*1000); toast('⚡', '¡2× XP por 30 minutos!'); }
  if (effect === 'revive')    {
    const overdue = quests.filter(q=>!q.done&&q.deadline&&q.deadline<today);
    if (overdue.length) {
      const q = overdue[0];
      await db.from('dungeon_quests').update({deadline:today}).eq('id',q.id);
      q.deadline = today; renderQuestList();
      toast('👻', `"${q.name}" revivida a hoy.`);
    } else { toast('👻', 'No hay misiones vencidas que revivir.'); }
  }
}

/* ── CLASS SKILLS ─────────────────────────────────────────── */
function getSkillUsed() {
  return localStorage.getItem('dungeon-skill-' + new Date().toISOString().split('T')[0]) === '1';
}
function markSkillUsed() {
  localStorage.setItem('dungeon-skill-' + new Date().toISOString().split('T')[0], '1');
}
function renderClassSkillBtn() {
  const el = document.getElementById('classSkillBtn');
  if (!el || !hero) return;
  const skill = CLASS_SKILLS[hero.hero_class];
  if (!skill) { el.style.display = 'none'; return; }
  const used = getSkillUsed();
  el.style.display = '';
  el.innerHTML = `${skill.icon} ${skill.name}${used ? ' <span style="opacity:.5;font-size:11px">(mañana)</span>' : ''}`;
  el.disabled = used;
  el.title = skill.desc + (used ? ' — Disponible mañana.' : '');
}
async function useClassSkill() {
  if (!hero || getSkillUsed()) { toast('⏳', 'Habilidad en cooldown. Disponible mañana.'); return; }
  const cls = hero.hero_class;
  markSkillUsed();
  renderClassSkillBtn();
  if (cls === 'mago') {
    localStorage.setItem('dungeon-transmute-next', '1');
    toast('🔮', 'Transmutación lista: próxima side/daily da XP de épica.');
  } else if (cls === 'guerrero') {
    localStorage.setItem('dungeon-berserker-exp', Date.now() + 30*60*1000);
    toast('⚡', '¡Berserker activado! 2× XP por 30 minutos.');
  } else if (cls === 'clerigo') {
    const today   = new Date().toISOString().split('T')[0];
    const overdue = quests.filter(q => !q.done && q.deadline && q.deadline < today);
    if (!overdue.length) { toast('✝️', 'No hay misiones vencidas que resucitar.'); markSkillUsed(); return; }
    const q = overdue[0];
    await db.from('dungeon_quests').update({ deadline: today }).eq('id', q.id);
    q.deadline = today; renderQuestList();
    toast('✝️', `¡"${q.name}" resucitada a hoy sin penalización!`);
  } else if (cls === 'picaro') {
    const daily = quests.find(q => !q.done && q.type === 'daily');
    if (!daily) { toast('🗡️', 'No hay dailies pendientes.'); return; }
    await completeQuest(daily.id, null);
    toast('🗡️', `¡Golpe en las Sombras! "${daily.name}" completada.`);
  } else if (cls === 'arquero') {
    localStorage.setItem('dungeon-arrow-rain', '1');
    toast('🏹', 'Lluvia de Flechas lista: próxima semanal da 3× XP.');
  } else if (cls === 'fundador') {
    localStorage.setItem('dungeon-strategic-count', '5');
    toast('🚀', 'Visión Estratégica: +25% XP en las próximas 5 misiones.');
  }
}

/* ── DIARY ────────────────────────────────────────────────── */
function generateDiaryEntry() {
  if (!hero) return;
  const today = new Date().toISOString().split('T')[0];
  if (localStorage.getItem('dungeon-diary-' + today)) return;
  const done = quests.filter(q => q.done && q.done_at?.startsWith(today));
  if (!done.length) return;
  const xpEarned  = done.reduce((s, q) => s + (XP_TABLE[q.type] || 25), 0);
  const mainDone  = done.filter(q => q.type === 'main');
  const names     = done.slice(0, 3).map(q => `"${q.name}"`).join(', ');
  const title     = TITLES[Math.min((hero.level || 1) - 1, TITLES.length - 1)];
  const templates = [
    `Día ${today} — El héroe ${hero.name}, ${title}, se alzó al amanecer y antes de que la luna tomara su lugar había conquistado ${done.length} desafío${done.length > 1 ? 's' : ''}: ${names}. El gremio registró ${xpEarned} puntos de gloria en los pergaminos eternos.`,
    `Crónica del ${today}: Los anales del gremio registran que ${hero.name} se enfrentó hoy a ${done.length} prueba${done.length > 1 ? 's' : ''}${mainDone.length ? `, incluida la épica hazaña "${mainDone[0].name}"` : ''}. Con ${xpEarned} XP acumulados y una racha de ${hero.streak || 0} días, el reino se mantiene en pie.`,
    `${today} — Quedará escrito en los anales: el nivel ${hero.level} ${hero.hero_class || 'héroe'} conocido como ${hero.name} completó ${done.length} misión${done.length > 1 ? 'es' : ''} con honor. Su determinación inspira a todo el gremio. XP ganados: ${xpEarned}.`,
  ];
  const entry = templates[Math.floor(Math.random() * templates.length)];
  const diary = JSON.parse(localStorage.getItem('dungeon-diary') || '[]');
  diary.unshift({ date: today, text: entry, xp: xpEarned, count: done.length });
  if (diary.length > 60) diary.pop();
  localStorage.setItem('dungeon-diary', JSON.stringify(diary));
  localStorage.setItem('dungeon-diary-' + today, '1');
}
function renderDiary() {
  const el = document.getElementById('diaryContent');
  if (!el) return;
  const diary = JSON.parse(localStorage.getItem('dungeon-diary') || '[]');
  if (!diary.length) {
    el.innerHTML = '<div class="empty-state" style="padding:24px"><div class="empty-state-icon">📖</div><p>El diario está vacío. Completa misiones para que el escribano registre tus hazañas.</p></div>';
    return;
  }
  el.innerHTML = diary.map(e => `
    <div class="diary-entry">
      <div class="diary-meta">${e.date} · ${e.count} misión${e.count > 1 ? 'es' : ''} · ${e.xp} XP</div>
      <div class="diary-text">${escHtml(e.text)}</div>
    </div>`).join('');
}
function openDiary() { generateDiaryEntry(); renderDiary(); openModal('diaryModal'); }

/* ── PROPHECY ─────────────────────────────────────────────── */
function _weekNum() {
  const d = new Date(); const jan1 = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
}
function getProphecyKey() { return `dungeon-prophecy-${new Date().getFullYear()}-${_weekNum()}`; }
function checkAndGenerateProphecy() {
  const key = getProphecyKey();
  if (localStorage.getItem(key) || !hero || !quests.length) return;
  const mains  = Math.max(quests.filter(q => !q.done && q.type === 'main').length, 1);
  const streak = Math.max((hero.streak || 0) + 3, 3);
  const tmpl   = PROPHECY_TEMPLATES[_weekNum() % PROPHECY_TEMPLATES.length];
  localStorage.setItem(key, tmpl(mains, streak));
  renderProphecy();
}
function renderProphecy() {
  const el = document.getElementById('prophecyText');
  if (!el) return;
  const text = localStorage.getItem(getProphecyKey());
  if (text) { el.textContent = text; el.closest('.prophecy-section')?.classList.remove('hidden'); }
}

/* ── INIT (called from main.js) ───────────────────────────── */
function initRPGSystems() {
  renderGold();
  renderWeather();
  updateBossBanner();
  renderFamiliar();
  renderClassSkillBtn();
  checkRandomEvent();
  checkAndGenerateProphecy();
  renderProphecy();
}
