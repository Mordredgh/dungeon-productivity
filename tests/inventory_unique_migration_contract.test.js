const assert = require('node:assert/strict');
const fs = require('node:fs');

const migration = fs.readFileSync('supabase/migrations/20260721_inventory_unique_delivery.sql', 'utf8');

assert.match(migration, /partition by hero_id,\s*item_key/i, 'la migración fusiona duplicados por héroe y objeto');
assert.match(migration, /sum\(coalesce\(quantity,\s*0\)\)/i, 'la migración conserva cantidades al fusionar');
assert.match(migration, /delete from public\.dungeon_inventory/i, 'la migración elimina filas duplicadas sobrantes');
assert.match(migration, /create unique index if not exists dungeon_inventory_hero_item_key_uidx/i, 'existe índice único para on_conflict=hero_id,item_key');

console.log('inventory unique migration contract: OK');
