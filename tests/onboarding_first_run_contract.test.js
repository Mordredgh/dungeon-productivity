const assert = require('node:assert/strict');
const fs = require('node:fs');
const onboardingJs = fs.readFileSync('js/onboarding.js', 'utf8');

// Bug 1: closeOnboarding() solo guardaba el flag con done=true, y eso solo
// ocurría al completar los 5 pasos. La × y "Ahora no" llamaban
// closeOnboarding() sin argumento, así que descartar la guía no persistía y
// reaparecía en cada carga. Ahora cerrar siempre cuenta como vista.
assert.doesNotMatch(onboardingJs, /function closeOnboarding\(done/);
assert.match(onboardingJs, /function closeOnboarding\(\)[^]*localStorage\.setItem\(_onboardingKey\(\), 'done'\)/);
assert.doesNotMatch(onboardingJs, /closeOnboarding\(true\)/);

// Bug 2: el modal de identidad inicial (prestige-choice-overlay, z-index 12000)
// tapaba la guía (onboarding-overlay, z-index 10050) en el primer arranque de
// un héroe nuevo. La guía debe esperar a que la raza esté sellada y el modal
// cerrado, con espera acotada para no dejar un timer infinito.
assert.match(onboardingJs, /!hero\.race \|\| document\.getElementById\('initialIdentityModal'\)/);
assert.match(onboardingJs, /waited < \d+/);

console.log('Contrato de onboarding en primer arranque OK');
