const assert = require('node:assert/strict');
const fs = require('node:fs');

const migration = fs.readFileSync('supabase/migrations/20260719_server_boss_state.sql', 'utf8');
const battle = fs.readFileSync('js/boss_battle.js', 'utf8');

assert.match(migration, /create table if not exists public\.dungeon_boss_actions/i);
assert.match(migration, /unique \(hero_id, request_id\)/i);
assert.match(migration, /create or replace function public\.apply_dungeon_boss_damage/i);
assert.match(migration, /for update/i);
assert.match(migration, /dungeon_boss_rewards/i);
assert.match(battle, /rpc\('apply_dungeon_boss_damage'/);
assert.doesNotMatch(battle, /if \(typeof addGold\s+===\s+'function'\) addGold\(gold\)/);

console.log('Contrato de jefe autoritativo OK');
