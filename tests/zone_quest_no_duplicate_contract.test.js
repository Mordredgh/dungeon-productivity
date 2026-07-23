const assert = require('node:assert/strict');
const fs = require('node:fs');
const zonesJs = fs.readFileSync('js/zones.js', 'utf8');

// checkZoneRandomQuest() creó una misión de hábito nueva cada día sin borrar la
// anterior (v312) — como resetDailyQuests() revive habit/daily marcadas como
// "no hecha" para siempre, se duplicaba y quedaba resucitando marcada. El fix
// exige: (1) etiquetar cada inserción con 'zona-auto', y (2) borrar CUALQUIER
// fila zona-auto previa ANTES de insertar la del día — nunca deben coexistir dos.
assert.match(zonesJs, /async function _clearStaleZoneQuests/);
assert.match(zonesJs, /tags \|\| ''\)\.includes\('zona-auto'\)/);
assert.match(zonesJs, /await db\.from\('dungeon_quests'\)\.delete\(\)\.in\('id', staleIds\)/);

// El orden importa: checkZoneRandomQuest debe llamar la limpieza ANTES del
// insert de la misión nueva, no después — si no, coexisten las dos.
const fnBody = zonesJs.slice(zonesJs.indexOf('async function checkZoneRandomQuest'));
const clearIdx  = fnBody.indexOf('_clearStaleZoneQuests()');
const insertIdx = fnBody.indexOf("db.from('dungeon_quests').insert(");
assert.ok(clearIdx > -1 && insertIdx > -1, 'faltan las llamadas esperadas dentro de checkZoneRandomQuest');
assert.ok(clearIdx < insertIdx, '_clearStaleZoneQuests() debe correr antes del insert, o la duplicación puede volver');

// Cada inserción debe llevar la etiqueta para que la próxima limpieza la encuentre.
assert.match(zonesJs, /const tags\s*=\s*`\$\{tpl\.tags \|\| ''\} zona-auto`/);

console.log('Contrato de no-duplicado de misión de zona OK');
