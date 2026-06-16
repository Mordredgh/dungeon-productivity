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
  const table   = DROP_TABLE[priority] || DROP_TABLE.normal;
  const fragQty = Math.floor(Math.random() * (table.max - table.min + 1)) + table.min;
  const potQty  = Math.max(1, Math.ceil(fragQty / 2));

  const fragKey = SPELL_FRAGMENT_KEYS[Math.floor(Math.random() * SPELL_FRAGMENT_KEYS.length)];
  const petKey  = PET_POTION_KEYS[Math.floor(Math.random() * PET_POTION_KEYS.length)];
  const pet     = PET_DEFS.find(p => p.key === petKey);

  return [
    { type: 'spell_fragment', key: 'spell_' + fragKey,       display: spellFragLabel(fragKey),          qty: fragQty },
    { type: 'pet_potion',     key: 'pet_potion_' + petKey,   display: `Poción de ${pet?.name || petKey}`, qty: potQty  },
  ];
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

async function grantLoot(loots, goldAmt) {
  if (!loots) return;
  const items = Array.isArray(loots) ? loots : [loots];
  for (const loot of items) await addInvItem(loot.key, loot.type, loot.qty);
  showLootPopup(items, goldAmt || 0);
  if (typeof renderSpells === 'function') renderSpells();
}

function showLootPopup(items, goldAmt) {
  const old = document.getElementById('lootPopup');
  if (old) old.remove();

  const goldRow = goldAmt > 0 ? `
    <div class="loot-popup-row">
      <span class="loot-popup-gold-icon">🪙</span>
      <div class="loot-popup-name">Oro</div>
      <div class="loot-popup-qty">+${goldAmt}</div>
    </div>` : '';

  const rows = items.map(loot => {
    const imgUrl = CDN + 'dungeon/' + loot.key + '.png';
    return `
      <div class="loot-popup-row">
        <img src="${imgUrl}" class="loot-popup-img" alt="" onerror="this.style.display='none'">
        <div class="loot-popup-name">${escHtml(loot.display)}</div>
        <div class="loot-popup-qty">+${loot.qty}</div>
      </div>`;
  }).join('');

  const div = document.createElement('div');
  div.id = 'lootPopup';
  div.className = 'loot-popup';
  div.innerHTML = `
    <div class="loot-popup-title">🎁 ¡Botín obtenido!</div>
    ${goldRow}${rows}`;
  document.body.appendChild(div);
  setTimeout(() => div.classList.add('visible'), 30);
  setTimeout(() => { div.classList.remove('visible'); setTimeout(() => div.remove(), 400); }, 4000);
}
