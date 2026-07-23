const assert = require('node:assert/strict');
const fs = require('node:fs');
const migration = fs.readFileSync('supabase/migrations/20260723_rate_limit_grant_currency_craft_rune.sql', 'utf8');

// grant_dungeon_currency y craft_dungeon_rune no tenian freno de frecuencia
// (cada llamada topada en monto, pero sin limite de cuantas veces por minuto).
// Con testers reales en beta cerrada, alguien podia llamarlas cientos de veces
// por segundo. Se agregan al whitelist de assert_dungeon_rpc_rate_limit.
assert.match(migration, /p_rpc_name not in \(.*'grant_currency'.*'craft_rune'.*\)/);

assert.match(migration, /create or replace function public\.grant_dungeon_currency/i);
assert.match(migration, /perform public\.assert_dungeon_rpc_rate_limit\('grant_currency', 30, 60\)/);

assert.match(migration, /create or replace function public\.craft_dungeon_rune/i);
assert.match(migration, /perform public\.assert_dungeon_rpc_rate_limit\('craft_rune', 20, 60\)/);

console.log('Contrato de rate limit en grant_dungeon_currency / craft_dungeon_rune OK');
