const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('js/hero.js', 'utf8') + '\n;globalThis.__progressionTest = { getHeroProgression, getClassChangeQuote, buildClassReset };';
const context = {
  hero: {
    race: 'humano', hero_class: 'guerrero', skill_points: 1,
    skill_tree: JSON.stringify({ golpe_critico:true, resistencia:true, __doctrine:'mercader' }),
  },
  window: {}, document: {}, console, Math, Date,
};
vm.runInNewContext(source, context);

const api = context.__progressionTest;
const initial = api.getHeroProgression();
assert.equal(initial.raceLocked, true, 'una raza existente queda bloqueada');
assert.equal(api.getClassChangeQuote('mago', 1000).free, true, 'el primer cambio de clase es gratuito');

const reset = api.buildClassReset({ classFreeChangeUsed:true, classChangeCooldownUntil:1000 + 604800000 });
assert.equal(reset.refunded, 2, 'se reembolsan sólo habilidades reales');
assert.equal(reset.skillPoints, 3, 'los puntos no gastados se conservan');
assert.equal(reset.tree.__doctrine, 'mercader', 'la doctrina de prestigio no se borra');
assert.equal(reset.tree.__progression.classFreeChangeUsed, true);
context.hero.skill_tree = JSON.stringify(reset.tree);
assert.equal(api.getClassChangeQuote('mago', 1001).allowed, false, 'el enfriamiento bloquea cambios oportunistas');
console.log('progression rules: OK');
