'use strict';

const ONBOARDING_STEPS = [
  { icon:'⚔️', title:'Elige tu primer rumbo', text:'Crea o abre una misión. Cada acción real alimenta tu aventura.', view:'quests', label:'Ver misiones' },
  { icon:'🐾', title:'Encuentra un compañero', text:'Las mascotas combaten, exploran y descansan. Una expedición las ocupa.', view:'pets', label:'Abrir mascotas' },
  { icon:'✦', title:'Especializa a tu héroe', text:'El árbol, la raza y tu doctrina crean un build propio.', view:'character', tab:'skills', label:'Ver habilidades' },
  { icon:'🗺️', title:'El mundo responde', text:'Usa puntos de acción en el mapa para orientar tu siguiente recompensa.', view:'map', label:'Abrir mapa' },
];
function _onboardingKey() { return `dungeon-onboarding-${hero?.id || 'guest'}`; }
function openOnboarding(step = 0) {
  const current = Math.max(0, Math.min(ONBOARDING_STEPS.length - 1, step));
  let modal = document.getElementById('onboardingModal');
  if (!modal) { modal = document.createElement('div'); modal.id = 'onboardingModal'; modal.className = 'onboarding-overlay'; document.body.appendChild(modal); }
  const item = ONBOARDING_STEPS[current];
  modal.innerHTML = `<section class="onboarding-card" role="dialog" aria-modal="true" aria-label="Guía de Arcanum"><button class="onboarding-close" onclick="closeOnboarding()" aria-label="Cerrar guía">×</button><div class="onboarding-count">${current + 1} / ${ONBOARDING_STEPS.length}</div><div class="onboarding-icon">${item.icon}</div><h2>${item.title}</h2><p>${item.text}</p><div class="onboarding-progress">${ONBOARDING_STEPS.map((_, index) => `<i class="${index <= current ? 'active' : ''}"></i>`).join('')}</div><div class="onboarding-actions"><button class="btn btn-ghost" onclick="${current ? `openOnboarding(${current - 1})` : 'closeOnboarding()'}">${current ? 'Atrás' : 'Ahora no'}</button><button class="btn btn-primary" onclick="onboardingGo(${current})">${current === ONBOARDING_STEPS.length - 1 ? 'Comenzar' : item.label}</button></div></section>`;
  modal.classList.add('is-open');
}
function onboardingGo(step) {
  const item = ONBOARDING_STEPS[step];
  if (item.view) switchView(item.view);
  if (item.tab && typeof switchCharTab === 'function') switchCharTab(item.tab);
  if (step >= ONBOARDING_STEPS.length - 1) closeOnboarding(true); else openOnboarding(step + 1);
}
function closeOnboarding(done = false) { const modal = document.getElementById('onboardingModal'); if (modal) modal.remove(); if (done) localStorage.setItem(_onboardingKey(), 'done'); }
function showOnboardingIfNeeded() { if (hero && !localStorage.getItem(_onboardingKey())) setTimeout(() => openOnboarding(), 900); }
