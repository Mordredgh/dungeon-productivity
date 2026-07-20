const assert = require('node:assert/strict');
const fs = require('node:fs');

const migration = fs.readFileSync('supabase/migrations/20260719_server_boss_state.sql', 'utf8');
const bossFix = fs.readFileSync('supabase/migrations/20260720_boss_damage_applied.sql', 'utf8');
const battle = fs.readFileSync('js/boss_battle.js', 'utf8');

assert.match(migration, /create table if not exists public\.dungeon_boss_actions/i);
assert.match(migration, /unique \(hero_id, request_id\)/i);
assert.match(migration, /create or replace function public\.apply_dungeon_boss_damage/i);
assert.match(migration, /for update/i);
assert.match(migration, /dungeon_boss_rewards/i);
assert.match(bossFix, /damage_applied integer/i);
assert.match(bossFix, /v_damage:=least\(greatest\(1,p_damage\),greatest\(1,ceil\(v_max \* 0\.40\)\),v_hp\)/i);
assert.match(bossFix, /set boss_state=v_state,/i);
assert.doesNotMatch(bossFix, /Daño fuera de rango/);
assert.doesNotMatch(bossFix, /boss_state=v_state::text/i);
assert.match(battle, /(?:rpc|rpcWithRetry)\('apply_dungeon_boss_damage'/);
assert.match(battle, /const updatedBoss = state\[cycle\] \|\| b/);
assert.match(battle, /result\.damage_applied/);
assert.doesNotMatch(battle, /if \(typeof addGold\s+===\s+'function'\) addGold\(gold\)/);

console.log('Contrato de jefe autoritativo OK');
