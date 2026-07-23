const assert = require('node:assert/strict');
const fs = require('node:fs');

// hero.hero_id no existe — hero es una fila de dungeon_heroes, su PK es hero.id.
// push.js y weekly_summary.js usaban hero.hero_id (undefined), rompiendo el filtro
// hero_id en las queries (push subscription y stats semanales, ambos silenciosamente
// vacíos para todos los usuarios, no solo testers nuevos).
for (const file of ['js/push.js', 'js/weekly_summary.js']) {
  const src = fs.readFileSync(file, 'utf8');
  assert.doesNotMatch(src, /hero\.hero_id/, `${file} no debe usar hero.hero_id`);
}

console.log('Contrato hero.id (no hero.hero_id) OK');
