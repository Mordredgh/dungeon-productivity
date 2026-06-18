/* ============================================================
   RPG SYSTEMS: Weather · Boss · Events · Class Skills · Diary · Prophecy
   ============================================================ */

/* ── EVENTOS ESTACIONALES ───────────────────────────────── */
function getSeasonalEvent() {
  const d = new Date();
  const m = d.getMonth(), dy = d.getDate();
  // Prioridad: festividades especiales primero
  for (const ev of SEASONAL_EVENTS) {
    if (ev.month !== null) {
      if (ev.month === m && dy >= ev.dayStart && dy <= ev.dayEnd) return ev;
    } else if (ev.season && ev.season(d)) {
      return ev;
    }
  }
  return null;
}

function getSeasonalXPMult() {
  const ev = getSeasonalEvent();
  return ev ? 1 + ev.xpBonus : 1;
}

function renderSeasonalBanner() {
  // Seasonal event now shows in the effects bar — trigger a re-render
  if (typeof renderEffectsBar === 'function') renderEffectsBar();
}

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

/* ── SISTEMA DE JEFES MÚLTIPLES (v69) ────────────────────────
   3 jefes simultáneos: diario / semanal / mensual
   Rareza define el ciclo: comun+raro=diario, epico+legendario=semanal, mitico+cataclismo=mensual
   ─────────────────────────────────────────────────────────── */
const BOSS_CYCLE_RARITIES = {
  daily:   ['comun', 'raro'],
  weekly:  ['epico', 'legendario'],
  monthly: ['mitico', 'cataclismo'],
};
// HP calibrado para ser vencible en su ciclo con ~150-200 daño/día
const BOSS_CYCLE_HP = {
  comun:80, raro:150, epico:600, legendario:1000, mitico:2500, cataclismo:4200,
};
const BOSS_DEFEAT_REWARDS = {
  comun:      { gold:40,   xp:80   },
  raro:       { gold:80,   xp:160  },
  epico:      { gold:180,  xp:400  },
  legendario: { gold:300,  xp:700  },
  mitico:     { gold:700,  xp:1800 },
  cataclismo: { gold:1500, xp:4000 },
};
const BOSS_CYCLE_LABELS = { daily:'Diario', weekly:'Semanal', monthly:'Mensual' };
const BOSS_CYCLE_ICONS  = { daily:'☀️', weekly:'📅', monthly:'🌙' };

function _bossPeriodKey(cycle) {
  const d = new Date();
  if (cycle === 'daily') return d.toISOString().split('T')[0];
  if (cycle === 'weekly') {
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const w    = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${w}`;
  }
  return `${d.getFullYear()}-${d.getMonth() + 1}`;
}

function _selectBossForCycle(cycle, periodKey) {
  const rarities = BOSS_CYCLE_RARITIES[cycle] || [];
  const pool     = (typeof BOSS_DEFS !== 'undefined' ? BOSS_DEFS : [])
    .filter(b => rarities.includes(b.rarity) && !b.seasonal);
  if (!pool.length) return null;
  const seed = periodKey.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return pool[seed % pool.length];
}

function _applyBossPenalty(cycle, boss) {
  if (!hero) return;
  const hpLoss  = { daily:5, weekly:10, monthly:20 }[cycle] || 5;
  const goldPct = { daily:0, weekly:0.05, monthly:0.08 }[cycle] || 0;
  const newHp   = Math.max(10, (hero.hp || 100) - hpLoss);
  hero.hp = newHp; saveHero({ hp: newHp });
  const goldLoss = Math.floor((hero.gold || 0) * goldPct);
  if (goldLoss > 0 && typeof addGold === 'function') addGold(-goldLoss);
  if (typeof renderHeroUI === 'function') renderHeroUI();
  toast('💀', `${escHtml(boss.name)} escapó (${BOSS_CYCLE_LABELS[cycle]}). -${hpLoss} HP${goldLoss ? ` · -${goldLoss}🪙` : ''}`);
}

function getMultiBossState() {
  let saved = null;
  if (hero && hero.boss_state) {
    try {
      const raw = typeof hero.boss_state === 'string' ? JSON.parse(hero.boss_state) : hero.boss_state;
      if (raw && typeof raw === 'object' && ('daily' in raw || 'weekly' in raw || 'monthly' in raw)) saved = raw;
    } catch {}
  }

  const state   = saved ? { ...saved } : {};
  let   changed = false;
  const cycles  = ['daily', 'weekly', 'monthly'];

  cycles.forEach(cycle => {
    const periodKey = _bossPeriodKey(cycle);
    const existing  = state[cycle];
    if (existing && existing.periodKey !== periodKey) {
      if (!existing.defeated) setTimeout(() => _applyBossPenalty(cycle, existing), 600);
    }
    if (!existing || existing.periodKey !== periodKey) {
      const def = _selectBossForCycle(cycle, periodKey);
      if (def) {
        const hp = BOSS_CYCLE_HP[def.rarity] || 100;
        state[cycle] = { key:def.key, name:def.name, rarity:def.rarity, hp, maxHp:hp, defeated:false, periodKey };
        changed = true;
      }
    }
  });

  if (changed || !saved) {
    if (hero) hero.boss_state = state;
    if (typeof saveHero === 'function') saveHero({ boss_state: state });
  }
  return state;
}

function saveMultiBossState(state) {
  if (hero) { hero.boss_state = state; saveHero({ boss_state: state }); }
}

// Compat: getBossState() devuelve el boss semanal (usado por bestiary/bestiary)
function getBossState() { return getMultiBossState().weekly || {}; }
function saveBossState(s) { /* deprecated — usa saveMultiBossState */ }

function damageBoss(dmg) {
  const state   = getMultiBossState();
  const weather = getTodayWeather();
  const petMult = typeof getPetEffect === 'function' ? (getPetEffect('boss_dmg') || 1) : 1;
  const finalDmg = (weather === 'storm' ? dmg * 2 : dmg) * petMult;
  let changed   = false;

  ['daily','weekly','monthly'].forEach(cycle => {
    const b = state[cycle];
    if (!b || b.defeated) return;
    b.hp = Math.max(0, b.hp - finalDmg);
    changed = true;
    if (b.hp === 0) {
      b.defeated = true;
      const reward = BOSS_DEFEAT_REWARDS[b.rarity] || { gold:50, xp:100 };
      setTimeout(async () => {
        addGold(reward.gold);
        await addXP(reward.xp, 'main', null);
        toast('🏆', `¡${escHtml(b.name)} DERROTADO! +${reward.gold}🪙 +${reward.xp} XP`);
        if (typeof dungeonPush === 'function') dungeonPush('🏆 ¡Jefe Derrotado!', `${b.name} venció. +${reward.gold}🪙 +${reward.xp} XP`);
        if (typeof recordBossDefeat === 'function') recordBossDefeat(b.key);
        updateBossBanner();
      }, 800);
    }
  });

  if (changed) saveMultiBossState(state);
  updateBossBanner();
}

function checkBossDeadline() {
  // Deprecated wrapper — la lógica de penalidad está en getMultiBossState()
  getMultiBossState();
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
  if (effect === 'doubleNext') { if (hero) { hero.double_next = true; saveHero({ double_next: true }); } toast('✨', '¡Próxima misión con 2× XP!'); }
  if (effect === 'streak1')   { const ns = (hero.streak||0)+1; await saveHero({streak:ns}); hero.streak=ns; renderHeroUI(); toast('🔮', '+1 día de racha mística.'); }
  if (effect === 'hp20')      { const h = Math.min((hero.hp||100)+20, hero.hp_max||100); hero.hp=h; await saveHero({hp:h}); renderHeroUI(); toast('🍺', '+20 HP en la taberna.'); }
  if (effect === 'bossHP50')  { const s=getBossState(); s.hp=Math.min(s.hp+50,s.maxHp); saveBossState(s); updateBossBanner(); toast('🐉', '¡El Jefe absorbe poder dracónico! +50 HP de boss.'); }
  if (effect === 'mainBonus') { if (hero) { hero.main_bonus_date = today; saveHero({ main_bonus_date: today }); } toast('📜', 'Las misiones principales dan +20 XP hoy.'); }
  if (effect === 'curse')     { if (hero) { hero.curse_date = today; saveHero({ curse_date: today }); } toast('💀', '¡Maldición activa! Completa 2 misiones o pierdes HP.'); }
  if (effect === 'potion')    { const _e = Date.now()+30*60*1000; if (hero) { hero.potion_exp = _e; saveHero({ potion_exp: _e }); } toast('⚡', '¡2× XP por 30 minutos!'); }
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

/* ── MANÁ ─────────────────────────────────────────────────── */
const MANA_SKILL_COST = 60;

function addMana(n) {
  if (!hero) return;
  const newMana = Math.min((hero.mana || 0) + n, hero.mana_max || 100);
  hero.mana = newMana;
  saveHero({ mana: newMana });
  if (typeof renderHeroUI === 'function') renderHeroUI();
}

/* ── CLASS SKILLS ─────────────────────────────────────────── */
function renderClassSkillBtn() {
  const el = document.getElementById('classSkillBtn');
  if (!el || !hero) return;
  const mana = hero.mana || 0;
  const canUse = mana >= MANA_SKILL_COST;
  el.style.opacity = canUse ? '1' : '0.5';
  el.title = canUse ? 'Usar habilidad de clase' : `Necesitas ${MANA_SKILL_COST} maná (tienes ${mana})`;
}
async function useClassSkill() {
  if (!hero) return;
  const mana = hero.mana || 0;
  if (mana < MANA_SKILL_COST) {
    toast('💙', `Maná insuficiente (${mana}/${hero.mana_max||100}). Completa hábitos (+10) y pomodoros (+20).`);
    return;
  }
  // Consume mana
  hero.mana = mana - MANA_SKILL_COST;
  saveHero({ mana: hero.mana });
  renderClassSkillBtn();
  if (typeof renderHeroUI === 'function') renderHeroUI();
  const cls = hero.hero_class;
  if (cls === 'mago') {
    if (hero) { hero.transmute_next = true; saveHero({ transmute_next: true }); }
    toast('🔮', 'Transmutación lista: próxima side/daily da XP de épica.');
  } else if (cls === 'guerrero') {
    const _be = Date.now() + 30*60*1000;
    if (hero) { hero.berserker_exp = _be; saveHero({ berserker_exp: _be }); }
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
    if (hero) { hero.arrow_rain = true; saveHero({ arrow_rain: true }); }
    toast('🏹', 'Lluvia de Flechas lista: próxima semanal da 3× XP.');
  } else if (cls === 'fundador') {
    if (hero) { hero.strategic_count = 5; saveHero({ strategic_count: 5 }); }
    toast('🚀', 'Visión Estratégica: +25% XP en las próximas 5 misiones.');
  }
}

/* ── DIARY ────────────────────────────────────────────────── */
function generateDiaryEntry() {
  if (!hero) return;
  const today = new Date().toISOString().split('T')[0];
  if (hero && hero.diary_date === today) return;
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
  const diary = Array.isArray(hero?.diary) ? hero.diary : [];
  diary.unshift({ date: today, text: entry, xp: xpEarned, count: done.length });
  if (diary.length > 60) diary.pop();
  if (hero) { hero.diary = diary; hero.diary_date = today; saveHero({ diary, diary_date: today }); }
}
let _diaryTab = 'entries';
function switchDiaryTab(tab) {
  _diaryTab = tab;
  document.querySelectorAll('.diary-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.getElementById('diaryEntries').style.display = tab === 'entries' ? '' : 'none';
  document.getElementById('diaryStats').style.display   = tab === 'stats'   ? '' : 'none';
  if (tab === 'stats') renderDiaryStats();
}

function renderDiaryStats() {
  const el = document.getElementById('diaryStats');
  if (!el || !hero) return;
  const diary = Array.isArray(hero.diary) ? hero.diary : [];

  // Summary numbers
  const totalXP     = diary.reduce((s, e) => s + (e.xp || 0), 0);
  const totalQuests = diary.reduce((s, e) => s + (e.count || 0), 0);
  const avgPerDay   = diary.length ? (totalQuests / diary.length).toFixed(1) : 0;
  const bestDay     = diary.reduce((best, e) => (e.count > (best?.count || 0) ? e : best), null);

  // Streak calendar: last 30 days
  const activeDates = new Set(diary.map(e => e.date));
  const today = new Date(); today.setHours(0,0,0,0);
  let calHtml = '<div class="diary-cal">';
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    const entry = diary.find(e => e.date === ds);
    const intensity = entry ? Math.min(4, Math.ceil(entry.count / 2)) : 0;
    const label = entry ? `${ds}: ${entry.count} misiones, ${entry.xp} XP` : ds;
    calHtml += `<div class="diary-cal-cell lvl-${intensity}" title="${label}"></div>`;
  }
  calHtml += '</div>';

  // XP bar chart last 7 days
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    const entry = diary.find(e => e.date === ds);
    last7.push({ ds, xp: entry?.xp || 0, label: ['D','L','M','X','J','V','S'][d.getDay()] });
  }
  const maxXP = Math.max(...last7.map(d => d.xp), 1);
  const chartHtml = `<div class="diary-xp-chart">${last7.map(d =>
    `<div class="diary-xp-col">
      <div class="diary-xp-bar-wrap"><div class="diary-xp-bar-fill" style="height:${Math.round((d.xp/maxXP)*60)}px" title="${d.xp} XP"></div></div>
      <div class="diary-xp-label">${d.label}</div>
    </div>`).join('')}</div>`;

  el.innerHTML = `
    <div class="diary-stats-grid">
      <div class="diary-stat-card"><div class="diary-stat-num">${diary.length}</div><div class="diary-stat-lbl">días registrados</div></div>
      <div class="diary-stat-card"><div class="diary-stat-num">${totalXP.toLocaleString()}</div><div class="diary-stat-lbl">XP total</div></div>
      <div class="diary-stat-card"><div class="diary-stat-num">${totalQuests}</div><div class="diary-stat-lbl">misiones totales</div></div>
      <div class="diary-stat-card"><div class="diary-stat-num">${avgPerDay}</div><div class="diary-stat-lbl">misiones/día</div></div>
    </div>
    ${bestDay ? `<div style="font-size:11px;color:var(--text3);margin-bottom:8px">🏆 Mejor día: <b style="color:var(--gold)">${bestDay.date}</b> — ${bestDay.count} misiones · ${bestDay.xp} XP</div>` : ''}
    <div style="font-size:10px;color:var(--text3);margin-bottom:4px">Actividad últimos 30 días</div>
    ${calHtml}
    <div style="font-size:10px;color:var(--text3);margin:12px 0 4px">XP últimos 7 días</div>
    ${chartHtml}`;
}

function renderDiary() {
  const el = document.getElementById('diaryContent');
  if (!el) return;

  // Tab bar (inject once)
  if (!el.querySelector('.diary-tab-bar')) {
    el.innerHTML = `
      <div class="diary-tab-bar">
        <button class="diary-tab-btn active" data-tab="entries" onclick="switchDiaryTab('entries')">📖 Entradas</button>
        <button class="diary-tab-btn" data-tab="stats" onclick="switchDiaryTab('stats')">📊 Estadísticas</button>
      </div>
      <div id="diaryEntries" style="display:flex;flex-direction:column;gap:12px;padding:4px 0 8px"></div>
      <div id="diaryStats" style="display:none;padding:4px 0 8px"></div>`;
  }

  const entriesEl = document.getElementById('diaryEntries');
  if (!entriesEl) return;
  const diary = hero && Array.isArray(hero.diary) ? hero.diary : [];
  if (!diary.length) {
    entriesEl.innerHTML = '<div class="empty-state" style="padding:24px"><div class="empty-state-icon">📖</div><p>El diario está vacío. Completa misiones para que el escribano registre tus hazañas.</p></div>';
    return;
  }
  entriesEl.innerHTML = diary.map(e => `
    <div class="diary-entry">
      <div class="diary-meta">${e.date} · ${e.count} misión${e.count > 1 ? 'es' : ''} · ${e.xp} XP</div>
      <div class="diary-text">${escHtml(e.text)}</div>
    </div>`).join('');
  if (_diaryTab === 'stats') renderDiaryStats();
}
async function generateDiaryEntryAI() {
  if (!hero) return;
  const today = new Date().toISOString().split('T')[0];
  if (hero.diary_date === today) return;
  const done = quests.filter(q => q.done && q.done_at?.startsWith(today));
  if (!done.length) return;
  const xpEarned = done.reduce((s, q) => s + (XP_TABLE[q.type] || 25), 0);
  const names    = done.map(q => q.name).join(', ');
  const title    = TITLES[Math.min((hero._level || hero.level || 1) - 1, TITLES.length - 1)];
  const prompt = `Escribe una entrada de diario corta (máximo 4 líneas) en primera persona, en voz del héroe "${hero.name}" (${title}, clase ${hero.hero_class || 'aventurero'}), narrando su día como una crónica de fantasía medieval.
Misiones completadas hoy: ${names}.
XP ganado: ${xpEarned}. Racha actual: ${hero.streak || 0} días.
Tono épico pero breve. Responde solo con el texto de la entrada, sin encabezados ni markdown.`;

  let text = '';
  try {
    const r = await fetch('/openclaw/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: prompt })
    });
    const data = await r.json();
    text = (data.reply || '').trim();
  } catch {}

  if (!text) { generateDiaryEntry(); return; }

  const diary = Array.isArray(hero.diary) ? hero.diary : [];
  diary.unshift({ date: today, text, xp: xpEarned, count: done.length });
  if (diary.length > 60) diary.pop();
  hero.diary = diary; hero.diary_date = today;
  await saveHero({ diary, diary_date: today });
  renderDiary();
}

function checkNightlyDiary() {
  if (!hero || new Date().getHours() < 21) return;
  generateDiaryEntryAI();
}

function openDiary() { renderDiary(); openModal('diaryModal'); checkNightlyDiary(); }

/* ── PROPHECY ─────────────────────────────────────────────── */
function _weekNum() {
  const d = new Date(); const jan1 = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
}
function getProphecyKey() { return `dungeon-prophecy-${new Date().getFullYear()}-${_weekNum()}`; }
function checkAndGenerateProphecy() {
  if (!hero || !quests.length) return;
  const week = getProphecyKey();
  let existing = null;
  if (hero.prophecy) { try { const p = JSON.parse(hero.prophecy); if (p.week === week) existing = p.text; } catch {} }
  if (existing) return;

  // Pick up to 3 real pending missions to embed in prophecy
  const pending = quests.filter(q => !q.done);
  const mainQ   = pending.filter(q => q.type === 'main').slice(0, 1);
  const sideQ   = pending.filter(q => q.type === 'side').slice(0, 2);
  const chosen  = [...mainQ, ...sideQ].slice(0, 3);
  const missionNames = chosen.map(q => `"${q.name}"`);

  let text;
  if (missionNames.length >= 2) {
    const streak = Math.max((hero.streak || 0) + 3, 3);
    text = `El Oráculo ha visto esta semana. Las estrellas señalan las batallas que definirán tu destino: ${missionNames.join(', ')}. Quien las conquiste antes del domingo y mantenga una racha de ${streak} días será coronado campeón del gremio.`;
  } else {
    const mains  = Math.max(pending.filter(q => q.type === 'main').length, 1);
    const streak = Math.max((hero.streak || 0) + 3, 3);
    const tmpl   = PROPHECY_TEMPLATES[_weekNum() % PROPHECY_TEMPLATES.length];
    text = tmpl(mains, streak);
  }

  // Store mission IDs for tracking
  const prophecyMissionIds = chosen.map(q => q.id);
  hero.prophecy = JSON.stringify({ week, text, missionIds: prophecyMissionIds });
  saveHero({ prophecy: hero.prophecy });
  renderProphecy();
}
function renderProphecy() {
  const el  = document.getElementById('prophecyText');
  const vEl = document.getElementById('prophecyVerdict');
  if (!el || !hero || !hero.prophecy) return;
  try {
    const p = JSON.parse(hero.prophecy);
    if (p.week === getProphecyKey()) {
      el.textContent = `"${p.text}"`;
      if (vEl) vEl.textContent = p.verdict ? `⚖️ ${p.verdict}` : '';
    }
  } catch {}
}

function checkProphecyVerdict() {
  if (!hero || !hero.prophecy) return;
  const now = new Date();
  if (now.getDay() !== 0 || now.getHours() < 20) return;
  let p; try { p = JSON.parse(hero.prophecy); } catch { return; }
  if (p.week !== getProphecyKey() || p.verdict) return;
  _evaluateProphecy(p);
}

async function _evaluateProphecy(p) {
  const dates   = typeof _weekDates === 'function' ? _weekDates() : [];
  const wQuests = quests.filter(q => q.done && q.done_at && dates.some(d => q.done_at.startsWith(d)));
  const wXP     = wQuests.reduce((s, q) => s + (XP_TABLE[q.type] || 50), 0);
  const prompt = `Esta fue la profecía de la semana: "${p.text}"
Datos reales de la semana: ${wQuests.length} misiones completadas, ${wXP} XP ganado, racha actual de ${hero.streak || 0} días.
¿Se cumplió la profecía? Responde en 1-2 frases breves, tono místico de oráculo, con un veredicto claro al inicio (Cumplida / Incumplida / Parcial).`;

  let verdict = '';
  try {
    const r = await fetch('/openclaw/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: prompt })
    });
    const data = await r.json();
    verdict = (data.reply || '').trim();
  } catch {}
  if (!verdict) return;

  p.verdict = verdict;
  hero.prophecy = JSON.stringify(p);
  await saveHero({ prophecy: hero.prophecy });
  renderProphecy();
}

/* ── INIT (called from main.js) ───────────────────────────── */

/* ── BOSS WEEKLY PENALTY ──────────────────────────────── */
function checkBossDeadline() {
  if (!hero) return;
  const now = new Date();
  if (now.getDay() !== 0 || now.getHours() < 22) return;
  const state = getBossState();
  if (state.defeated) return;
  const key = 'dungeon-boss-penalty-' + _bossWeekKey();
  if (localStorage.getItem(key)) return;
  localStorage.setItem(key, '1');

  if (hero.boss_shield) {
    hero.boss_shield = false; saveHero({ boss_shield: false });
    toast('🛡️', 'Escudo Anti-Boss absorbio la penalizacion. ' + state.name + ' huye.');
    if (typeof dungeonPush === 'function') dungeonPush('Escudo activado', state.name + ' fue bloqueado por tu escudo.');
    return;
  }
  const hpLoss  = Math.max(5, Math.round((state.hp / state.maxHp) * 25));
  const newHp   = Math.max(10, (hero.hp || 100) - hpLoss);
  const goldLoss = Math.floor((hero.gold || 0) * 0.08);
  hero.hp = newHp; saveHero({ hp: newHp });
  if (goldLoss > 0 && typeof addGold === 'function') addGold(-goldLoss);
  renderHeroUI();
  toast('🐉', state.name + ' escapó esta semana! -' + hpLoss + ' HP' + (goldLoss ? ' · -' + goldLoss + '🪙' : ''));
  if (typeof dungeonPush === 'function') dungeonPush('El Jefe escapó', state.name + ' sobrevivió. -' + hpLoss + ' HP.');
}

function initRPGSystems() {
  renderGold();
  renderWeather();
  updateBossBanner();
  renderFamiliar();
  renderClassSkillBtn();
  checkRandomEvent();
  checkAndGenerateProphecy();
  renderProphecy();
  checkBossDeadline();
}
