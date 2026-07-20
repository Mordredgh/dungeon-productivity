const fs = require('fs');
const assert = require('assert');
const db = fs.readFileSync('js/db.js','utf8');
assert.match(db, /async function rpcWithRetry/);
assert.match(db, /dungeon:pending:/);
for (const file of ['js/shop.js','js/weapons.js','js/sala_personal.js','js/boss_battle.js','js/challenges.js','js/factions.js','js/events.js']) {
  const source = fs.readFileSync(file,'utf8');
  assert.match(source, /rpcWithRetry\(/, `${file} debe usar RPC resiliente`);
}
console.log('retry_contract OK');
