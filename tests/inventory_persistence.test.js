/* Prueba de regresión: Supabase sin índice compuesto rechaza el upsert.
   El inventario debe caer a insert/update y nunca simular una entrega. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('js/inventory.js', 'utf8') + '\n;globalThis.__inventoryTest = { addInvItem, consumeInvItem, getInvCount, shouldFallbackInventoryWrite };';
const calls = [];
const db = {
  from(table) {
    assert.equal(table, 'dungeon_inventory');
    return {
      upsert: async () => ({ error: { status: 400, message: 'on conflict target has no unique or exclusion constraint' } }),
      insert: async row => { calls.push(row); return { error: null }; },
      update: row => ({
        eq: () => ({ eq: async () => { calls.push(row); return { error: null }; } }),
      }),
    };
  },
};
const context = { hero: { id: 'hero-test' }, inventory: [], db, console };
vm.runInNewContext(source, context);

(async () => {
  const result = await context.__inventoryTest.addInvItem('pet_food_pantera-sombra', 'pet_food', 1);
  assert.equal(result.ok, true);
  assert.equal(context.__inventoryTest.shouldFallbackInventoryWrite({ status:400, message:'Bad Request' }), true);
  assert.equal(context.__inventoryTest.getInvCount('pet_food_pantera-sombra'), 1);
  assert.equal(calls[0].item_key, 'pet_food_pantera-sombra');
  assert.equal(await context.__inventoryTest.consumeInvItem('pet_food_pantera-sombra', 1), true);
  assert.equal(context.__inventoryTest.getInvCount('pet_food_pantera-sombra'), 0);
  console.log('inventory persistence fallback: OK');
})().catch(error => { console.error(error); process.exitCode = 1; });
