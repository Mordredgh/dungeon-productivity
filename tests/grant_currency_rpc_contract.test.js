const assert = require('node:assert/strict');
const fs = require('node:fs');
const migration = fs.readFileSync('supabase/migrations/20260722_grant_currency_and_streak_rpcs.sql', 'utf8');

// grant_dungeon_currency reemplaza los updates directos de addXP/addGold/setGold
// bloqueados por dungeon_block_client_economy_update.
assert.match(migration, /create or replace function public\.grant_dungeon_currency/);
assert.match(migration, /security definer/);
// XP topada [0,5000] y oro [-5000,5000] — negativo permitido para gastar.
assert.match(migration, /least\(greatest\(coalesce\(p_xp,0\), 0\), 5000\)/);
assert.match(migration, /greatest\(least\(coalesce\(p_gold,0\), 5000\), -5000\)/);
// El resultado final de oro nunca queda negativo.
assert.match(migration, /greatest\(0, coalesce\(v_hero\.gold, 0\) \+ v_gold_delta\)/);
// Solo se audita en el ledger cuando el neto es positivo (gastos no son "recompensa").
assert.match(migration, /if v_xp > 0 or v_gold_delta > 0 then/);
assert.match(migration, /insert into public\.dungeon_reward_ledger/);

// adjust_dungeon_streak reemplaza el update directo de streak en el evento "racha mística".
assert.match(migration, /create or replace function public\.adjust_dungeon_streak/);
assert.match(migration, /greatest\(least\(coalesce\(p_delta,0\), 5\), -5\)/);
assert.match(migration, /greatest\(0, coalesce\(v_hero\.streak, 0\) \+ v_delta\)/);

// El cliente debe llamar la RPC, no escribir xp_total/gold/level/streak directo.
const heroJs = fs.readFileSync('js/hero.js', 'utf8');
assert.match(heroJs, /db\.rpc\('grant_dungeon_currency'/);
assert.doesNotMatch(heroJs, /saveHero\(\{\s*xp_total/);

const shopJs = fs.readFileSync('js/shop.js', 'utf8');
assert.match(shopJs, /db\.rpc\('grant_dungeon_currency'/);

const rpgJs = fs.readFileSync('js/rpg.js', 'utf8');
assert.match(rpgJs, /db\.rpc\('adjust_dungeon_streak'/);
assert.doesNotMatch(rpgJs, /saveHero\(\{streak:ns\}\)/);

console.log('Contrato de grant_dungeon_currency / adjust_dungeon_streak OK');
