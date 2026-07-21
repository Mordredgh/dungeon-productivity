const assert = require('node:assert/strict');
const fs = require('node:fs');

const views = fs.readFileSync('js/views.js', 'utf8');

assert.match(
  views,
  /const habits = quests\.filter\(q => q\.type === 'habit' && !q\.done\)/,
  'la sección de hábitos sólo debe renderizar hábitos pendientes'
);
assert.doesNotMatch(
  views,
  /const habits = quests\.filter\(q => q\.type === 'habit'\);\s*if \(habits\.length/,
  'no debe renderizar hábitos completados/tachados dentro de la lista pendiente'
);

console.log('habit done hidden contract: OK');
