const assert = require('node:assert/strict');
const fs = require('node:fs');

const hero = fs.readFileSync('js/hero.js', 'utf8');
const migration = fs.readFileSync('supabase/migrations/20260721_daily_streak_rpc.sql', 'utf8');

assert.match(migration, /create or replace function public\.touch_dungeon_daily_streak/i, 'la racha diaria debe moverse a RPC');
assert.match(migration, /for update/i, 'la RPC debe bloquear la fila del héroe durante la racha');
assert.match(migration, /set streak\s*=/i, 'la RPC actualiza streak del lado servidor');
assert.match(migration, /grant execute on function public\.touch_dungeon_daily_streak\(\)/i, 'la RPC queda disponible a usuarios autenticados');
assert.match(hero, /(?:rpcWithRetry|db\.rpc)\('touch_dungeon_daily_streak'/, 'checkDailyStreak usa RPC para campos bloqueados');
assert.doesNotMatch(hero, /saveHero\(\{ streak: newStreak, longest_streak: longest, last_active_date: today, hp: newHp \}\)/, 'checkDailyStreak no muta contadores bloqueados directo');

console.log('daily streak RPC contract: OK');
