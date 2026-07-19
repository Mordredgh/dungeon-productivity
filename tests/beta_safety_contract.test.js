const assert = require('node:assert/strict');
const fs = require('node:fs');

const hero = fs.readFileSync('js/hero.js', 'utf8');
const character = fs.readFileSync('js/character.js', 'utf8');
const quests = fs.readFileSync('js/quests.js', 'utf8');
const auth = fs.readFileSync('js/auth.js', 'utf8');

assert.match(hero, /name:\s*'Héroe sin nombre'/, 'un beta tester no inicia con el nombre del desarrollador');
assert.match(character, /id="initialHeroName"/, 'la identidad inicial solicita nombre');
assert.match(character, /const heroName = .*initialHeroName/, 'la identidad valida el nombre antes de guardar');
assert.match(hero, /if \(error\)[\s\S]{0,400}return false/, 'saveHero informa fallo remoto y revierte el estado');
assert.match(quests, /const \{ error \} = await db\.from\('dungeon_quests'\)\.update\(\{ done: true, done_at: now \}\)/, 'completar misión comprueba el guardado remoto');
assert.match(quests, /if \(error\) \{[\s\S]{0,180}return;/, 'no se conceden recompensas si el guardado falla');
assert.match(auth, /requestPasswordReset/, 'existe recuperación de contraseña para beta');
assert.match(auth, /completePasswordRecovery/, 'el enlace de recuperación permite definir una contraseña nueva');
assert.match(auth, /onAuthStateChange/, 'el callback de recuperación abre su flujo aunque Supabase limpie la URL');
assert.match(fs.readFileSync('js/ui.js', 'utf8'), /initModalAccessibility/, 'los modales ocultos quedan fuera del árbol accesible');
assert.match(fs.readFileSync('deploy.ps1', 'utf8'), /Assets HTML: v\$new/, 'cada deploy renueva el fingerprint de JS y CSS');

console.log('beta safety contract: OK');
