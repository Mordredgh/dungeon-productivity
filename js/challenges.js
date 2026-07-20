'use strict';

/* ── RETOS DE 30 DÍAS ───────────────────────────────────────────
   Persistido en hero.challenges (JSON array en Supabase).
   ─────────────────────────────────────────────────────────── */

const CHALLENGE_DEFS = [
  { id:'quest30',   icon:'⚔️', img:'logro_centurion.webp', name:'El Mes del Guerrero',     desc:'Completa 30 misiones en 30 días',               target:30,   type:'quests',      reward:{ xp:500,  gold:200 } },
  { id:'streak30',  icon:'🔥', img:'logro_eterno.webp', name:'La Racha Eterna',          desc:'Mantén tu racha activa durante 30 días',        target:30,   type:'streak',      reward:{ xp:800,  gold:300 } },
  { id:'pom30',     icon:'🍅', img:'logro_maratonista.webp', name:'El Maratonista del Tiempo',desc:'Completa 30 pomodoros',                         target:30,   type:'pomodoros',   reward:{ xp:400,  gold:150 } },
  { id:'main10',    icon:'⭐', img:'logro_leyenda.webp', name:'Héroe de Leyenda',          desc:'Completa 10 misiones épicas',                   target:10,   type:'main_quests', reward:{ xp:600,  gold:250 } },
  { id:'habit30',   icon:'✅', img:'logro_forjado-hierro.webp', name:'Maestro de Hábitos',       desc:'Completa hábitos positivos 20 veces',           target:20,   type:'habits',      reward:{ xp:350,  gold:120 } },
  { id:'xp5000',    icon:'💠', img:'logro_maestro-poder.webp', name:'Tesoro de Poder',          desc:'Gana 5000 XP en este reto',                     target:5000, type:'xp',          reward:{ xp:1000, gold:400 } },
  { id:'boss3',     icon:'🐉', img:'logro_boss_slayer.webp', name:'Cazador de Jefes',         desc:'Derrota al jefe semanal 3 veces',               target:3,    type:'boss_kills',  reward:{ xp:750,  gold:350 } },
  { id:'daily50',   icon:'🌅', img:'logro_daily_5.webp', name:'Rutinario Legendario',     desc:'Completa 50 búsquedas diarias',                 target:50,   type:'dailies',     reward:{ xp:450,  gold:180 } },
];

function _getChallenges() {
  if (!hero) return [];
  try { return JSON.parse(hero.challenges || '[]'); } catch { return []; }
}

async function _saveChallenges(arr) {
  hero.challenges = JSON.stringify(arr);
  await saveHero({ challenges: hero.challenges });
}

function getActiveChallenges()    { return _getChallenges().filter(c => !c.completed); }
function getCompletedChallenges() { return _getChallenges().filter(c => c.completed); }

async function startChallenge(defId) {
  const def = CHALLENGE_DEFS.find(d => d.id === defId);
  if (!def || !hero) return;
  const arr = _getChallenges();
  if (arr.find(c => c.id === defId)) { toast('⚠️', 'Ya tienes este reto activo.'); return; }
  arr.push({ id: defId, started_at: new Date().toISOString(), progress: 0, completed: false, rewarded: false,
             xp_at_start: def.type === 'xp' ? (hero?.xp_total || 0) : undefined });
  await _saveChallenges(arr);
  toast(def.icon, `¡Reto iniciado: ${def.name}!`);
  renderChallenges();
}

async function updateChallengeProgress() {
  if (!hero) return;
  const arr = _getChallenges();
  let changed = false;
  const today = new Date().toISOString().split('T')[0];

  for (const c of arr) {
    if (c.completed) continue;
    const def = CHALLENGE_DEFS.find(d => d.id === c.id);
    if (!def) continue;

    const startDate = c.started_at ? c.started_at.split('T')[0] : today;
    let progress = 0;

    if (def.type === 'quests') {
      progress = quests.filter(q => q.done && q.done_at && q.done_at >= c.started_at).length;
    } else if (def.type === 'streak') {
      progress = hero.streak || 0;
    } else if (def.type === 'pomodoros') {
      progress = pomodoros.filter(p => p.started_at && p.started_at >= c.started_at).length;
    } else if (def.type === 'main_quests') {
      progress = quests.filter(q => q.done && q.type === 'main' && q.done_at && q.done_at >= c.started_at).length;
    } else if (def.type === 'habits') {
      progress = quests.filter(q => q.done && q.type === 'habit' && !((q.tags||'').includes('habit-')) && q.done_at && q.done_at >= c.started_at).length;
    } else if (def.type === 'xp') {
      const xpAtStart = c.xp_at_start || 0;
      progress = Math.max(0, (hero.xp_total || 0) - xpAtStart);
    } else if (def.type === 'boss_kills') {
      progress = c.boss_kills || 0;
    } else if (def.type === 'dailies') {
      progress = quests.filter(q => q.done && q.type === 'daily' && q.done_at && q.done_at >= c.started_at).length;
    }

    if (progress !== c.progress) { c.progress = progress; changed = true; }

    if (progress >= def.target && !c.completed) {
      c.completed = true; changed = true;
      toast(def.icon, `¡Reto completado: ${def.name}! +${def.reward.xp} XP +${def.reward.gold}🪙`);
      if (typeof dungeonPush === 'function') dungeonPush(`${def.icon} ¡Reto completado!`, def.name);
    }
  }

  if (changed) await _saveChallenges(arr);
}

async function trackBossKill() {
  const arr = _getChallenges();
  let changed = false;
  for (const c of arr) {
    if (c.completed) continue;
    const def = CHALLENGE_DEFS.find(d => d.id === c.id);
    if (!def || def.type !== 'boss_kills') continue;
    c.boss_kills = (c.boss_kills || 0) + 1;
    if (c.boss_kills >= def.target && !c.completed) {
      c.completed = true;
      toast(def.icon, `¡Reto completado: ${def.name}! +${def.reward.xp} XP +${def.reward.gold}🪙`);
    }
    changed = true;
  }
  if (changed) { await _saveChallenges(arr); await updateChallengeProgress(); renderChallenges(); }
}

async function claimChallengeReward(defId) {
  const arr = _getChallenges();
  const c = arr.find(x => x.id === defId);
  const def = CHALLENGE_DEFS.find(d => d.id === defId);
  if (!c || !def || !c.completed || c.rewarded) return;
  const { data, error } = await db.rpc('claim_dungeon_reward', { p_source:'challenge', p_reward_key:defId });
  if (error) { toast('⚠️', error.message || 'No se pudo reclamar la recompensa.'); return; }
  const reward = Array.isArray(data) ? data[0] : data;
  c.rewarded = true;
  await _saveChallenges(arr);
  Object.assign(hero, { xp_total:reward.xp_total, gold:reward.gold, level:reward.level });
  toast(def.icon, `¡Recompensa reclamada! +${reward.xp_awarded} XP · +${reward.gold_awarded}🪙`);
  renderChallenges();
}

async function abandonChallenge(defId) {
  const arr = _getChallenges().filter(c => c.id !== defId);
  await _saveChallenges(arr);
  toast('🗑️', 'Reto abandonado.');
  renderChallenges();
}

function renderChallenges() {
  const el = document.getElementById('challengesContent');
  if (!el) return;

  const active    = _getChallenges();
  const activeIds = new Set(active.map(c => c.id));

  const available = CHALLENGE_DEFS.filter(d => !activeIds.has(d.id));

  let html = '';

  if (active.length) {
    html += `<div class="ch-section-title">⚔️ Retos Activos</div>`;
    html += active.map(c => {
      const def = CHALLENGE_DEFS.find(d => d.id === c.id);
      if (!def) return '';
      const pct = Math.min(100, Math.round((c.progress / def.target) * 100));
      const days = c.started_at ? Math.floor((Date.now() - new Date(c.started_at).getTime()) / 86400000) : 0;
      return `
        <div class="ch-card ${c.completed ? 'ch-done' : ''}">
          <div class="ch-header">
            <span class="ch-icon"><img src="images/${def.img}" alt="" loading="lazy" decoding="async" onerror="this.parentElement.textContent='${def.icon}'"></span>
            <div class="ch-info">
              <div class="ch-name">${escHtml(def.name)}</div>
              <div class="ch-desc">${escHtml(def.desc)}</div>
            </div>
            <div class="ch-days">${days}d</div>
          </div>
          <div class="ch-progress-bar"><div class="ch-progress-fill" style="width:${pct}%"></div></div>
          <div class="ch-footer">
            <span class="ch-progress-text">${c.progress} / ${def.target} (${pct}%)</span>
            <span class="ch-reward">+${def.reward.xp}XP +${def.reward.gold}🪙</span>
            ${c.completed && !c.rewarded
              ? `<button class="btn btn-primary ch-claim-btn" onclick="claimChallengeReward('${def.id}')">🎁 Reclamar</button>`
              : c.completed
              ? `<span class="ch-claimed">✅ Reclamado</span>`
              : `<button class="btn btn-ghost ch-abandon-btn" onclick="abandonChallenge('${def.id}')">✕</button>`}
          </div>
        </div>`;
    }).join('');
  }

  if (available.length) {
    html += `<div class="ch-section-title" style="margin-top:18px">📋 Disponibles</div>`;
    html += available.map(def => `
      <div class="ch-card ch-available">
        <div class="ch-header">
          <span class="ch-icon"><img src="images/${def.img}" alt="" loading="lazy" decoding="async" onerror="this.parentElement.textContent='${def.icon}'"></span>
          <div class="ch-info">
            <div class="ch-name">${escHtml(def.name)}</div>
            <div class="ch-desc">${escHtml(def.desc)}</div>
          </div>
          <div class="ch-reward-badge">+${def.reward.xp}XP</div>
        </div>
        <button class="btn btn-primary ch-start-btn" onclick="startChallenge('${def.id}')">⚔️ Iniciar Reto</button>
      </div>`).join('');
  }

  if (!html) html = '<div class="empty-state"><div class="empty-state-icon">🏆</div><p>Todos los retos completados. ¡Leyenda!</p></div>';
  el.innerHTML = html;
}

function openChallengesModal() {
  updateChallengeProgress().then(() => {
    renderChallenges();
    openModal('challengesModal');
  });
}
