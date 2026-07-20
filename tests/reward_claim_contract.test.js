const assert = require('node:assert/strict');
const fs = require('node:fs');
const migration = fs.readFileSync('supabase/migrations/20260719_server_reward_claims.sql', 'utf8');
assert.match(migration, /dungeon_reward_claims/);
assert.match(migration, /unique \(hero_id, source, reward_key\)/);
assert.match(migration, /claim_dungeon_reward/);
assert.match(migration, /for update/i);
assert.match(migration, /dungeon_level_for_xp/);
console.log('Contrato de recompensas autoritativas OK');
