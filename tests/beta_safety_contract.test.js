const assert = require('node:assert/strict');
const fs = require('node:fs');

const hero = fs.readFileSync('js/hero.js', 'utf8');
const character = fs.readFileSync('js/character.js', 'utf8');
const quests = fs.readFileSync('js/quests.js', 'utf8');
const inventory = fs.readFileSync('js/inventory.js', 'utf8');
const auth = fs.readFileSync('js/auth.js', 'utf8');
const beta = fs.readFileSync('js/beta.js', 'utf8');
const economyMigration = fs.readFileSync('supabase/migrations/20260719_server_authoritative_economy.sql', 'utf8');

assert.match(hero, /name:\s*'Héroe sin nombre'/, 'un beta tester no inicia con el nombre del desarrollador');
assert.match(character, /id="initialHeroName"/, 'la identidad inicial solicita nombre');
assert.match(hero, /db\.auth\.getUser\(\)/, 'cada héroe se vincula al usuario autenticado');
assert.match(hero, /\.eq\('user_id', authUser\.id\)/, 'cargar héroe nunca lee la partida de otro beta tester');
assert.match(hero, /user_id:\s*authUser\.id/, 'la partida nueva conserva a su propietario');
assert.match(character, /const heroName = .*initialHeroName/, 'la identidad valida el nombre antes de guardar');
assert.match(hero, /if \(error\)[\s\S]{0,400}return false/, 'saveHero informa fallo remoto y revierte el estado');
assert.match(quests, /db\.rpc\('complete_dungeon_quest', \{ p_quest_id: id \}\)/, 'completar misión delega recompensa y cierre al servidor');
assert.match(quests, /db\.rpc\('undo_dungeon_quest', \{ p_quest_id: id \}\)/, 'deshacer misión también revierte en el servidor');
assert.match(quests, /if \(error \|\| !reward\) \{[\s\S]{0,230}return;/, 'no se conceden recompensas si el servidor rechaza la operación');
assert.match(inventory, /alreadyAwarded = false/, 'el modal de loot no duplica oro ya acreditado');
assert.match(auth, /requestPasswordReset/, 'existe recuperación de contraseña para beta');
assert.match(auth, /completePasswordRecovery/, 'el enlace de recuperación permite definir una contraseña nueva');
assert.match(auth, /onAuthStateChange/, 'el callback de recuperación abre su flujo aunque Supabase limpie la URL');
assert.match(beta, /dungeon_beta_feedback/, 'beta incorpora un canal persistente de feedback');
assert.match(beta, /dungeon_client_events/, 'beta registra fallos de cliente para diagnóstico');
assert.match(beta, /window\.addEventListener\('error'/, 'los errores no capturados se reportan durante beta');
assert.match(economyMigration, /create table if not exists public\.dungeon_reward_ledger/i, 'la economía conserva un ledger inmutable e idempotente');
assert.match(economyMigration, /create or replace function public\.complete_dungeon_quest/i, 'la recompensa de misión se calcula dentro de Supabase');
assert.match(economyMigration, /security definer/i, 'la operación económica se ejecuta únicamente mediante una función controlada');
assert.match(economyMigration, /unique\s*\(hero_id, source, source_id\)/i, 'el mismo evento de recompensa no puede acreditarse dos veces');
assert.match(fs.readFileSync('js/ui.js', 'utf8'), /initModalAccessibility/, 'los modales ocultos quedan fuera del árbol accesible');
assert.match(fs.readFileSync('deploy.ps1', 'utf8'), /Assets HTML: v\$new/, 'cada deploy renueva el fingerprint de JS y CSS');

console.log('beta safety contract: OK');
