const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = file => fs.readFileSync(file, 'utf8');
const store = read('supabase/migrations/20260719_server_store_atomic.sql');
const boss = read('supabase/migrations/20260719_server_boss_state.sql');
const rewards = read('supabase/migrations/20260719_server_reward_claims.sql');
const lock = read('supabase/migrations/20260719_lock_economy_columns.sql');
const checklist = read('docs/BETA_TESTING_CHECKLIST.md');

for (const sql of [store, boss, rewards]) assert.match(sql, /auth\.uid\(\) is null/i);
assert.match(store, /unique \(hero_id, request_id\)/);
assert.match(boss, /unique \(hero_id, request_id\)/);
assert.match(rewards, /unique \(hero_id, source, reward_key\)/);
assert.match(lock, /dungeon_block_client_economy_update/);
assert.match(checklist, /Cuenta A.*B/i);
assert.match(checklist, /Doble clic/i);
assert.match(checklist, /Desconectar red/i);
assert.match(checklist, /Reporte de beta/i);

console.log('Contrato de beta e aislamiento OK');
