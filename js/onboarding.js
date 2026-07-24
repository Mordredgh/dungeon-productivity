'use strict';

const ONBOARDING_STEPS = [
  { art:'quest_main.webp', title:'Elige tu primer rumbo', text:'Crea o abre una misión. Cada acción real alimenta tu aventura.', view:'quests', label:'Ver misiones' },
  { art:'nav_mascotas.webp', title:'Encuentra un compañero', text:'Las mascotas combaten, exploran y descansan. Una expedición las ocupa.', view:'pets', label:'Abrir mascotas' },
  { art:'nav_habilidades.webp', title:'Especializa a tu héroe', text:'El árbol, la raza y tu doctrina crean un build propio.', view:'character', tab:'skills', label:'Ver habilidades' },
  { art:'nav_sala.webp', title:'Haz crecer tu santuario', text:'Mejora salas, compra muebles con oro y activa una resonancia para definir tu build.', view:'character', tab:'sala', label:'Abrir santuario' },
  { art:'nav_mundo.webp', title:'El mundo responde', text:'Usa puntos de acción en el mapa para orientar tu siguiente recompensa.', view:'map', label:'Abrir mapa' },
];
function _onboardingKey() { return `dungeon-onboarding-${hero?.id || 'guest'}`; }
function openOnboarding(step = 0) {
  const current = Math.max(0, Math.min(ONBOARDING_STEPS.length - 1, step));
  let modal = document.getElementById('onboardingModal');
  if (!modal) { modal = document.createElement('div'); modal.id = 'onboardingModal'; modal.className = 'onboarding-overlay'; document.body.appendChild(modal); }
  const item = ONBOARDING_STEPS[current];
  modal.innerHTML = `<section class="onboarding-card" role="dialog" aria-modal="true" aria-label="Guía de Arcanum"><button class="onboarding-close" onclick="closeOnboarding()" aria-label="Cerrar guía">×</button><div class="onboarding-count">${current + 1} / ${ONBOARDING_STEPS.length}</div><img class="onboarding-art" src="images/${item.art}" alt="" aria-hidden="true"><h2>${item.title}</h2><p>${item.text}</p><div class="onboarding-progress">${ONBOARDING_STEPS.map((_, index) => `<i class="${index <= current ? 'active' : ''}"></i>`).join('')}</div><div class="onboarding-actions"><button class="btn btn-ghost" onclick="${current ? `openOnboarding(${current - 1})` : 'closeOnboarding()'}">${current ? 'Atrás' : 'Ahora no'}</button><button class="btn btn-primary" onclick="onboardingGo(${current})">${current === ONBOARDING_STEPS.length - 1 ? 'Comenzar' : item.label}</button></div></section>`;
  modal.classList.add('is-open');
}
function onboardingGo(step) {
  const item = ONBOARDING_STEPS[step];
  if (item.view) switchView(item.view);
  if (item.tab && typeof switchCharTab === 'function') switchCharTab(item.tab);
  if (step >= ONBOARDING_STEPS.length - 1) closeOnboarding(); else openOnboarding(step + 1);
}
/* Cerrar cuenta como visto aunque no se completen los 5 pasos: antes solo se
   guardaba el flag al terminar la guía, así que descartarla con la × o con
   "Ahora no" la hacía reaparecer en cada carga hasta completarla. */
function closeOnboarding() { const modal = document.getElementById('onboardingModal'); if (modal) modal.remove(); localStorage.setItem(_onboardingKey(), 'done'); }
function showOnboardingIfNeeded(waited = 0) {
  if (!hero || localStorage.getItem(_onboardingKey())) return;
  /* El "Primer Juramento" (identidad inicial) es obligatorio y vive en un
     overlay con z-index mayor, así que la guía se abriría por detrás y sus
     botones cambiarían de vista sin que el héroe nuevo lo vea. Espera a que
     el héroe tenga raza sellada y el modal de identidad esté cerrado. */
  if (!hero.race || document.getElementById('initialIdentityModal')) {
    if (waited < 120000) setTimeout(() => showOnboardingIfNeeded(waited + 1200), 1200);
    return;
  }
  setTimeout(() => openOnboarding(), 900);
}
