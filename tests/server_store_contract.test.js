const assert = require('node:assert/strict');
const fs = require('node:fs');

const migration = fs.readFileSync('supabase/migrations/20260719_server_store_atomic.sql', 'utf8');
const salaMigration = fs.readFileSync('supabase/migrations/20260719_server_sala_purchase.sql', 'utf8');
const shop = fs.readFileSync('js/shop.js', 'utf8');
const weapons = fs.readFileSync('js/weapons.js', 'utf8');
const sala = fs.readFileSync('js/sala_personal.js', 'utf8');

assert.match(migration, /create table if not exists public\.dungeon_shop_catalog/i);
assert.match(migration, /create table if not exists public\.dungeon_purchase_receipts/i);
assert.match(migration, /create or replace function public\.purchase_dungeon_item/i);
assert.match(migration, /unique \(hero_id, request_id\)/i);
assert.match(migration, /for update/i);
assert.match(migration, /create or replace function public\.forge_dungeon_weapon/i);
const buyItem = shop.slice(shop.indexOf('async function buyItem'), shop.indexOf('function getPotionMult'));
assert.match(buyItem, /rpc\('purchase_dungeon_item'/);
assert.doesNotMatch(buyItem, /spendGold\(/);
assert.match(weapons, /rpc\('forge_dungeon_weapon'/);
assert.match(salaMigration, /create table if not exists public\.dungeon_sala_catalog/i);
assert.match(salaMigration, /create or replace function public\.purchase_sala_furniture/i);
assert.match(salaMigration, /for update/i);
assert.match(sala, /rpc\('purchase_sala_furniture'/);
assert.doesNotMatch(sala.slice(sala.indexOf('async function buySalaFurniture'), sala.indexOf('function salaSelectFurniture')), /spendGold\(/);

console.log('server store contract: ok');
