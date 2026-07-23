const assert = require('node:assert/strict');
const fs = require('node:fs');

// Signup: beta tester debe poder crear su propia cuenta (antes solo login/reset).
const authJs = fs.readFileSync('js/auth.js', 'utf8');
assert.match(authJs, /db\.auth\.signUp\(/);
assert.match(authJs, /function toggleSignupMode/);

const indexHtml = fs.readFileSync('index.html', 'utf8');
assert.match(indexHtml, /id="loginSignupToggle"/);
assert.match(indexHtml, /id="loginConfirmPassword"/);

// Botón de feedback de beta debe ser accesible siempre, no solo enterrado en
// Character Hub → Preferencias.
assert.match(indexHtml, /id="betaFeedbackFab"/);
assert.match(indexHtml, /onclick="openBetaFeedback\(\)"/);

// Ayuda contextual de hábitos: botón en el separador + auto-open la primera
// vez que aparece un hábito negativo (mismo problema real que confundió a Gerardo).
assert.match(indexHtml, /id="habitHelpModal"/);
const viewsJs = fs.readFileSync('js/views.js', 'utf8');
assert.match(viewsJs, /openModal\('habitHelpModal'\)/);
assert.match(viewsJs, /dungeon-habit-help-seen/);

console.log('Contrato de onboarding beta (signup + feedback FAB + ayuda de hábitos) OK');
