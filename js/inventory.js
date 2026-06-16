'use strict';
/* ============================================================
   INVENTORY — fragmentos de hechizo + pociones de mascota
   ============================================================ */

let inventory = [];   // cache local: [{ item_key, item_type, quantity }]

async function loadInventory() {
  if (!hero) return;
  const { data } = await db.from('dungeon_inventory').select('*').eq('hero_id', hero.id);
  inventory = data || [];
}

function getInvCount(key) {
  const row = inventory.find(r => r.item_key === key);
  return row ? (row.quantity || 0) : 0;
}

async function addInvItem(key, type, qty) {
  if (!hero || qty <= 0) return;
  const existing = inventory.find(r => r.item_key === key);
  const newQty = (existing ? existing.quantity : 0) + qty;

  const { error } = await db.from('dungeon_inventory').upsert(
    { hero_id: hero.id, item_key: key, item_type: type, quantity: newQty, updated_at: new Date().toISOString() },
    { onConflict: 'hero_id,item_key' }
  );
  if (!error) {
    if (existing) existing.quantity = newQty;
    else inventory.push({ hero_id: hero.id, item_key: key, item_type: type, quantity: newQty });
  }
}

async function consumeInvItem(key, qty) {
  if (!hero) return false;
  const existing = inventory.find(r => r.item_key === key);
  if (!existing || existing.quantity < qty) return false;
  const newQty = existing.quantity - qty;

  const { error } = await db.from('dungeon_inventory').upsert(
    { hero_id: hero.id, item_key: key, item_type: existing.item_type, quantity: newQty, updated_at: new Date().toISOString() },
    { onConflict: 'hero_id,item_key' }
  );
  if (!error) { existing.quantity = newQty; return true; }
  return false;
}

/* ── Drop de botín al completar misión ─────────────────── */
function rollLoot(priority) {
  const table = DROP_TABLE[priority] || DROP_TABLE.normal;
  if (Math.random() > table.chance) return null;
  const qty = Math.floor(Math.random() * (table.max - table.min + 1)) + table.min;

  if (Math.random() < 0.6) {
    const key = SPELL_FRAGMENT_KEYS[Math.floor(Math.random() * SPELL_FRAGMENT_KEYS.length)];
    return { type: 'spell_fragment', key: 'spell_' + key, display: spellFragLabel(key), qty };
  } else {
    const key = PET_POTION_KEYS[Math.floor(Math.random() * PET_POTION_KEYS.length)];
    const pet = PET_DEFS.find(p => p.key === key);
    return { type: 'pet_potion', key: 'pet_potion_' + key, display: `Poción de ${pet?.name || key}`, qty };
  }
}

function spellFragLabel(spellKey) {
  const labels = {
    frenzy: 'Fragmento de Frenesí', speed: 'Pluma de Velocidad',
    berserker: 'Colmillo de Berserker', shield: 'Fragmento de Escudo',
    'modo-berserker': 'Esencia Berserker', healing: 'Hierba de Curación',
    'mente-acero': 'Cristal de Mente de Acero',
  };
  return labels[spellKey] || spellKey;
}

async function grantLoot(loot) {
  if (!loot) return;
  await addInvItem(loot.key, loot.type, loot.qty);
  showLootPopup(loot);
  if (typeof renderSpells === 'function') renderSpells();
}

function showLootPopup(loot) {
  const old = document.getElementById('lootPopup');
  if (old) old.remove();

  const imgKey = loot.type === 'spell_fragment'
    ? loot.key.replace('spell_', 'spell_') + '.png'
    : loot.key + '.png';
  const imgUrl = CDN + 'dungeon/' + imgKey;

  const div = document.createElement('div');
  div.id = 'lootPopup';
  div.className = 'loot-popup';
  div.innerHTML = `
    <div class="loot-popup-inner">
      <img src="${imgUrl}" class="loot-popup-img" alt="" onerror="this.style.display='none'">
      <div>
        <div class="loot-popup-title">¡Botín obtenido!</div>
        <div class="loot-popup-name">${escHtml(loot.display)}</div>
        <div class="loot-popup-qty">+${loot.qty}</div>
      </div>
    </div>`;
  document.body.appendChild(div);
  setTimeout(() => div.classList.add('visible'), 30);
  setTimeout(() => { div.classList.remove('visible'); setTimeout(() => div.remove(), 400); }, 3500);
}
