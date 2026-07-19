'use strict';

/* Centro de mando diario: reúne sistemas existentes en una ruta jugable. */
const WEEKLY_CAMPAIGN_ARCS = [
  { name:'El Asedio de Ceniza', zone:'campo', art:'dungeon_sala3.webp', lore:'Las brasas despiertan bajo el Campo de Batalla.' },
  { name:'Los Ecos de la Cripta', zone:'cripta', art:'dungeon_sala6.webp', lore:'Una voz antigua reclama las promesas incumplidas.' },
  { name:'El Velo de la Torre', zone:'torre', art:'dungeon_sala4.webp', lore:'Los pergaminos perdidos vuelven a escribir el destino.' },
  { name:'La Guardia de la Ciudadela', zone:'ciudadela', art:'dungeon_sala1.webp', lore:'La muralla pide héroes que sostengan el reino.' },
];
function _campaignWeekKey() {
  const date = new Date();
  const start = new Date(date.getFullYear(), 0, 1);
  return `${date.getFullYear()}-${Math.floor((date - start) / 604800000)}`;
}
function _campaignData() {
  const data = typeof _getWeekData === 'function' ? _getWeekData() : (() => { try { return JSON.parse(hero?.week_data || '{}'); } catch { return {}; } })();
  const key = _campaignWeekKey();
  const index = Math.abs(Array.from(key).reduce((sum, char) => sum + char.charCodeAt(0), 0)) % WEEKLY_CAMPAIGN_ARCS.length;
  return { data, key, arc:WEEKLY_CAMPAIGN_ARCS[index], state:data.weekly_campaign?.key === key ? data.weekly_campaign : { key, claimed:false } };
}
function _campaignProgress() {
  const { state } = _campaignData();
  const now = new Date(); const day = (now.getDay() + 6) % 7;
  const monday = new Date(now); monday.setDate(now.getDate() - day); monday.setHours(0,0,0,0);
  const recent = (quests || []).filter(q => q.done && new Date(q.done_at || q.completed_at || 0) >= monday);
  const boss = typeof getMultiBossState === 'function' ? getMultiBossState().weekly : null;
  const marks = [
    { id:'main', label:'Vanguardia', text:'Completa 2 misiones principales reales.', current:recent.filter(q => q.type === 'main').length, target:2 },
    { id:'daily', label:'Suministros', text:'Completa 5 búsquedas diarias reales.', current:recent.filter(q => q.type === 'daily').length, target:5 },
    { id:'boss', label:'Asedio', text:'Derrota al jefe semanal.', current:boss?.defeated ? 1 : 0, target:1 },
  ];
  return { state, marks, complete:marks.every(mark => mark.current >= mark.target) };
}
function getWeeklyCampaignBonus(kind) {
  const progress = _campaignProgress();
  const completedMarks = progress.marks.filter(mark => mark.current >= mark.target).length;
  return kind === 'boss_dmg' && completedMarks >= 2 && !progress.state.claimed ? .10 : 0;
}
async function claimWeeklyCampaign() {
  if (!hero) return;
  const campaign = _campaignData();
  const progress = _campaignProgress();
  if (!progress.complete || campaign.state.claimed) return;
  const data = campaign.data;
  data.weekly_campaign = { key:campaign.key, claimed:true, claimedAt:Date.now(), arc:campaign.arc.name };
  hero.week_data = data;
  await saveHero({ week_data:data });
  await addXP(700, 'main', null);
  if (typeof addGold === 'function') addGold(650);
  if (typeof addInvItem === 'function') await addInvItem('rune_fragment', 'rune_fragment', 3);
  if (typeof addZoneExtXP === 'function') await addZoneExtXP(campaign.arc.zone, 120);
  if (typeof toast === 'function') toast('Campaña', `Campaña concluida: +700 XP, +650 oro, 3 fragmentos y reputación en ${campaign.arc.zone}.`);
  renderAdventureCycle();
}
window.claimWeeklyCampaign = claimWeeklyCampaign;
function getAdventureCycle() {
  const today = new Date().toISOString().slice(0, 10);
  const pending = (quests || []).filter(q => !q.done && q.type !== 'habit');
  const overdue = pending.filter(q => q.deadline && q.deadline < today);
  const priority = { mitico:0, legendario:1, epico:2, normal:3, comun:4 };
  const recommended = [...pending].sort((a, b) => {
    const aDue = a.deadline === today ? -2 : a.is_pinned ? -1 : 0;
    const bDue = b.deadline === today ? -2 : b.is_pinned ? -1 : 0;
    return aDue - bDue || (priority[a.priority] ?? 3) - (priority[b.priority] ?? 3) || new Date(a.created_at) - new Date(b.created_at);
  })[0];
  const daily = pending.filter(q => q.type === 'daily');
  const dailyDone = (quests || []).filter(q => q.type === 'daily' && q.done).length;
  const bossState = typeof getMultiBossState === 'function' ? getMultiBossState() : {};
  const boss = Object.values(bossState || {}).find(entry => entry && entry.hp > 0);
  const trip = typeof _gardenExpedition === 'function' ? _gardenExpedition() : null;
  const focus = typeof getFactionFocus === 'function' ? getFactionFocus() : '';
  const faction = typeof FACTION_DEFS !== 'undefined' ? FACTION_DEFS.find(f => f.id === focus) : null;
  return { today, pending, overdue, recommended, daily, dailyDone, boss, trip, faction };
}

function renderAdventureCycle() {
  const cycle = getAdventureCycle();
  const quest = cycle.recommended;
  const questCopy = quest ? `${escHtml(quest.name)} · ${quest.type === 'main' ? 'Misión épica' : quest.type === 'side' ? 'Encargo' : 'Búsqueda'}` : 'No hay misión pendiente. Crea una meta pequeña para continuar.';
  const bossCopy = cycle.boss ? `${cycle.boss.name || 'Jefe'} · ${Math.max(0, cycle.boss.hp || 0)} HP` : 'No hay jefe activo';
  const expeditionCopy = cycle.trip ? (cycle.trip.endsAt > Date.now() ? 'Expedición de mascota en marcha' : 'Botín de mascota listo') : 'Mascota disponible para explorar';
  const riskCopy = cycle.overdue.length ? `${cycle.overdue.length} misión${cycle.overdue.length > 1 ? 'es' : ''} vencida${cycle.overdue.length > 1 ? 's' : ''}` : 'Sin deudas urgentes';
  const campaign = _campaignData();
  const campaignProgress = _campaignProgress();
  const completedMarks = campaignProgress.marks.filter(mark => mark.current >= mark.target).length;
  const campaignClaim = campaignProgress.complete
    ? (campaignProgress.state.claimed ? '<span class="campaign-complete">Campaña concluida</span>' : '<button class="campaign-claim" onclick="claimWeeklyCampaign()">Reclamar botín de campaña</button>')
    : `<span class="campaign-bonus">${completedMarks >= 2 ? '+10% daño al jefe semanal activo' : `${completedMarks}/3 hitos cumplidos`}</span>`;
  return `<section class="adv-cycle">
    <header class="adv-cycle-head"><div><span>CAMPAÑA SEMANAL</span><h3>${campaign.arc.name}</h3></div><div class="adv-cycle-date">${new Date().toLocaleDateString('es-MX',{weekday:'short',day:'numeric',month:'short'})}</div></header>
    <div class="campaign-panel"><img src="images/${campaign.arc.art}" alt=""><div><p>${campaign.arc.lore}</p><div class="campaign-milestones">${campaignProgress.marks.map(mark => `<div class="campaign-mark${mark.current >= mark.target ? ' is-done' : ''}"><b>${mark.label}</b><span>${mark.current}/${mark.target}</span><small>${mark.text}</small></div>`).join('')}</div></div>${campaignClaim}</div>
    <div class="adv-cycle-main"><div class="adv-main-icon">${quest?.type === 'main' ? '⚔️' : quest?.type === 'side' ? '🗡️' : '🧭'}</div><div><span>Próximo paso recomendado</span><b>${questCopy}</b><small>${cycle.faction ? `Rumbo: ${escHtml(cycle.faction.name)} · bonus activo` : 'Elige una facción para orientar tus recompensas.'}</small></div>${quest ? `<button onclick="adventureFocusQuest('${quest.id}')">Empezar</button>` : `<button onclick="document.getElementById('addQuestBtn')?.click()">Crear misión</button>`}</div>
    <div class="adv-cycle-grid"><button onclick="switchView('character');switchCharTab('bestiary')"><span>🐉</span><b>${bossCopy}</b><small>Campaña de jefe</small></button><button onclick="switchView('pets');switchPetsTab('garden')"><span>🐾</span><b>${expeditionCopy}</b><small>Jardín y compañeros</small></button><button onclick="switchView('factions')"><span>✦</span><b>${cycle.dailyDone}/${cycle.daily.length + cycle.dailyDone} búsquedas</b><small>${riskCopy}</small></button></div>
  </section>`;
}

function adventureFocusQuest(id) {
  const target = document.querySelector(`.quest-item[data-qid="${id}"]`) || document.querySelector(`[data-quest-id="${id}"]`);
  if (target) { target.scrollIntoView({ behavior:'smooth', block:'center' }); target.classList.add('adv-quest-focus'); setTimeout(() => target.classList.remove('adv-quest-focus'), 1500); }
  else toast('🧭', 'La misión recomendada está filtrada. Cambia a “Todas” para verla.');
}
