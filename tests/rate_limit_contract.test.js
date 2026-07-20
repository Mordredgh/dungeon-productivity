const fs = require('fs');
const assert = require('assert');
const migration = fs.readFileSync('supabase/migrations/20260719_rpc_rate_limits.sql','utf8');
assert.match(migration, /dungeon_rpc_rate_limits/);
assert.match(migration, /assert_dungeon_rpc_rate_limit/);
for (const name of ['purchase','forge','sala_purchase','boss_attack','reward_claim']) assert.match(migration, new RegExp(`'${name}'`));
console.log('rate_limit_contract OK');
