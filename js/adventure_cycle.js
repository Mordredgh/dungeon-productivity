'use strict';

/* Centro de mando diario: reúne sistemas existentes en una ruta jugable. */
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
  return `<section class="adv-cycle">
    <header class="adv-cycle-head"><div><span>BRÚJULA DEL DÍA</span><h3>Tu aventura de hoy</h3></div><div class="adv-cycle-date">${new Date().toLocaleDateString('es-MX',{weekday:'short',day:'numeric',month:'short'})}</div></header>
    <div class="adv-cycle-main"><div class="adv-main-icon">${quest?.type === 'main' ? '⚔️' : quest?.type === 'side' ? '🗡️' : '🧭'}</div><div><span>Próximo paso recomendado</span><b>${questCopy}</b><small>${cycle.faction ? `Rumbo: ${escHtml(cycle.faction.name)} · bonus activo` : 'Elige una facción para orientar tus recompensas.'}</small></div>${quest ? `<button onclick="adventureFocusQuest('${quest.id}')">Empezar</button>` : `<button onclick="document.getElementById('addQuestBtn')?.click()">Crear misión</button>`}</div>
    <div class="adv-cycle-grid"><button onclick="switchView('character');switchCharTab('bestiary')"><span>🐉</span><b>${bossCopy}</b><small>Campaña de jefe</small></button><button onclick="switchView('pets');switchPetsTab('garden')"><span>🐾</span><b>${expeditionCopy}</b><small>Jardín y compañeros</small></button><button onclick="switchView('factions')"><span>✦</span><b>${cycle.dailyDone}/${cycle.daily.length + cycle.dailyDone} búsquedas</b><small>${riskCopy}</small></button></div>
  </section>`;
}

function adventureFocusQuest(id) {
  const target = document.querySelector(`.quest-item[data-qid="${id}"]`) || document.querySelector(`[data-quest-id="${id}"]`);
  if (target) { target.scrollIntoView({ behavior:'smooth', block:'center' }); target.classList.add('adv-quest-focus'); setTimeout(() => target.classList.remove('adv-quest-focus'), 1500); }
  else toast('🧭', 'La misión recomendada está filtrada. Cambia a “Todas” para verla.');
}
