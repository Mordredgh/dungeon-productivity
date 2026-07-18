'use strict';

/* ── ZONAS DEL DUNGEON ──────────────────────────────────────────
   Cada zona agrupa misiones por tipo o tag.
   Completar misiones en una zona acumula XP de zona → rang escalado.
   Rango otorga bonus de XP en esa zona (apilable con reputación por tag).
   ─────────────────────────────────────────────────────────── */

const ZONES = [
  { id:'ciudadela', name:'Ciudadela',        icon:'🏰', color:'#a78bfa',
    desc:'Misiones principales del Dungeon',
    match: q => q.type === 'main',
    thresholds:[120,400,800,1400] },
  { id:'campo',     name:'Campo de Batalla', icon:'⚔️', color:'#fb923c',
    desc:'Misiones secundarias y expediciones',
    match: q => q.type === 'side',
    thresholds:[100,350,700,1200] },
  { id:'torre',     name:'Torre del Saber',  icon:'📚', color:'#60a5fa',
    desc:'Estudio, lectura y aprendizaje',
    match: q => !!(q.tags||'').match(/\b(estudio|lectura|aprender|libro|curso|clase)\b/i),
    thresholds:[80,250,500,900] },
  { id:'fortaleza', name:'Fortaleza',         icon:'🏋️', color:'#4ade80',
    desc:'Ejercicio, salud y bienestar',
    match: q => !!(q.tags||'').match(/\b(ejercicio|salud|gym|correr|deporte|fit|entreno)\b/i),
    thresholds:[80,250,500,900] },
  { id:'jardin',    name:'Jardín Arcano',     icon:'🌿', color:'#34d399',
    desc:'Hábitos positivos sostenidos',
    match: q => q.type === 'habit' && typeof isHabitNegative === 'function' && !isHabitNegative(q),
    thresholds:[50,150,350,700] },
  { id:'cripta',    name:'Cripta',            icon:'🌑', color:'#94a3b8',
    desc:'Tentaciones evitadas con éxito',
    match: q => q.type === 'habit' && typeof isHabitNegative === 'function' && isHabitNegative(q),
    thresholds:[30,100,250,500] },
];

const _ZR_NAMES   = ['Forastero','Conocido','Aliado','Campeón','Leyenda'];
const _ZR_BONUSES = [0, 0.05, 0.10, 0.15, 0.25];
const _ZR_COLORS  = ['var(--text3)','#60a5fa','#a78bfa','#fb923c','#facc15'];

function calcZoneXP() {
  const out = {};
  ZONES.forEach(z => { out[z.id] = 0; });
  (quests || []).forEach(q => {
    if (!q.done) return;
    const xp = (typeof XP_TABLE !== 'undefined' ? XP_TABLE[q.type] : null) || 50;
    const z = ZONES.find(z => z.match(q));
    if (z) out[z.id] += xp;
  });
  return out;
}

function _zoneRankInfo(zone, xp) {
  const rankIdx     = zone.thresholds.filter(t => xp >= t).length;
  const prevThr     = rankIdx > 0 ? zone.thresholds[rankIdx - 1] : 0;
  const nextThr     = rankIdx < zone.thresholds.length ? zone.thresholds[rankIdx] : null;
  const segPct      = nextThr ? Math.min(100, Math.round(((xp - prevThr) / (nextThr - prevThr)) * 100)) : 100;
  return { rankIdx, rankName: _ZR_NAMES[rankIdx], bonus: _ZR_BONUSES[rankIdx],
           color: _ZR_COLORS[rankIdx], nextThr, segPct };
}

function getZoneBonus(q) {
  const z = ZONES.find(z => z.match(q));
  if (!z) return 0;
  const xpByZone = calcZoneXP();
  let bonus = _zoneRankInfo(z, xpByZone[z.id] || 0).bonus;
  // World map action point boost (+15% XP, 2h)
  try {
    const mb = JSON.parse(localStorage.getItem('dungeon-map-bonus-' + z.id) || 'null');
    if (mb && mb.expires > Date.now()) bonus += 0.15;
  } catch {}
  return bonus;
}

function renderZones() {
  const el = document.getElementById('zonesView');
  if (!el) return;
  const xpByZone = calcZoneXP();

  el.innerHTML = `
    <div style="padding:0 16px 6px">
      <p style="font-size:12px;color:var(--text3);margin:0">Completa misiones para ganar reputación y desbloquear bonuses de XP por zona.</p>
    </div>
    <div class="zones-grid">
      ${ZONES.map(z => {
        const xp = xpByZone[z.id] || 0;
        const { rankIdx, rankName, bonus, color, nextThr, segPct } = _zoneRankInfo(z, xp);
        const bonusStr = bonus > 0 ? `+${Math.round(bonus * 100)}% XP` : '';
        const nextMsg  = nextThr
          ? `Siguiente: ${_ZR_NAMES[rankIdx + 1]} — ${nextThr - xp} XP restantes`
          : '⭐ Rango máximo';
        return `
        <div class="zone-card" style="--zc:${z.color}">
          <div class="zone-card-top">
            <img src="images/map_${z.id}.webp" class="zone-icon-img" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
            <span class="zone-icon" style="display:none">${z.icon}</span>
            <div style="flex:1;min-width:0">
              <div class="zone-name">${z.name}</div>
              <div class="zone-desc">${z.desc}</div>
            </div>
            <div class="zone-rank-lbl" style="color:${color}">${rankName}</div>
          </div>
          <div class="zone-xp-row">
            <span style="font-size:10px;color:var(--text3)">${xp} XP</span>
            ${bonusStr ? `<span class="zone-bonus-chip">${bonusStr}</span>` : ''}
          </div>
          <div class="zone-bar-bg">
            <div class="zone-bar-fill" style="width:${segPct}%;background:${z.color}"></div>
          </div>
          <div class="zone-next-msg">${nextMsg}</div>
        </div>`;
      }).join('')}
    </div>`;
}

/* ── MISIONES ALEATORIAS DE ZONA (1/día) ─────────────────────
   Cada zona tiene un pool de misiones concretas y accionables que,
   al completarse, cuentan para la reputación de esa zona (mismo
   type/tags que exige zone.match). Dedup por localStorage — sin
   columna nueva en hero. ─────────────────────────────────── */
const ZONE_QUEST_TEMPLATES = {
  ciudadela: [
    { name: 'Avanza 1 hora en tu proyecto más importante', type: 'main' },
    { name: 'Termina algo que llevas posponiendo',          type: 'main' },
    { name: 'Da un paso grande hacia tu meta de la semana',  type: 'main' },
  ],
  campo: [
    { name: 'Resuelve un pendiente administrativo (pago, trámite, mensaje)', type: 'side' },
    { name: 'Ordena tu bandeja de entrada',                                  type: 'side' },
    { name: 'Responde los mensajes pendientes de hoy',                      type: 'side' },
  ],
  torre: [
    { name: 'Lee 20 minutos de un libro',        type: 'side', tags: '#lectura' },
    { name: 'Avanza un módulo de tu curso',       type: 'side', tags: '#curso' },
    { name: 'Aprende algo nuevo de tu área',      type: 'side', tags: '#aprender' },
  ],
  fortaleza: [
    { name: 'Haz 20 minutos de ejercicio',              type: 'side', tags: '#ejercicio' },
    { name: 'Sal a caminar o correr 15 minutos',        type: 'side', tags: '#correr' },
    { name: 'Revisa tu salud: agua, comida, descanso',  type: 'side', tags: '#salud' },
  ],
  jardin: [
    { name: 'Bebe suficiente agua hoy',            type: 'habit' },
    { name: 'Duerme temprano esta noche',          type: 'habit' },
    { name: 'Medita o respira profundo 5 minutos', type: 'habit' },
  ],
  cripta: [
    { name: 'Evita redes sociales 1 hora antes de dormir', type: 'habit', tags: 'habit-' },
    { name: 'No proscrastines tu tarea más importante hoy', type: 'habit', tags: 'habit-' },
    { name: 'Evita snacks después de las 9pm',              type: 'habit', tags: 'habit-' },
  ],
};

async function checkZoneRandomQuest() {
  if (!hero) return;
  const today = new Date().toISOString().split('T')[0];
  const key = 'dungeon-zone-quest-' + today;
  if (localStorage.getItem(key)) return;
  localStorage.setItem(key, '1');

  const zoneIds = Object.keys(ZONE_QUEST_TEMPLATES);
  const zoneId  = zoneIds[Math.floor(Math.random() * zoneIds.length)];
  const pool    = ZONE_QUEST_TEMPLATES[zoneId];
  const tpl     = pool[Math.floor(Math.random() * pool.length)];
  const z       = ZONES.find(zz => zz.id === zoneId);

  const { data } = await db.from('dungeon_quests').insert({
    name: tpl.name, type: tpl.type, tags: tpl.tags || '', priority: 'normal',
    hero_id: hero.id, created_at: new Date().toISOString(), done: false,
  }).select().single();

  if (data) {
    quests.unshift(data);
    renderQuestList();
    toast(z?.icon || '🗺️', `${z?.name || 'Zona'}: nueva misión — "${tpl.name}"`);
  }
}
