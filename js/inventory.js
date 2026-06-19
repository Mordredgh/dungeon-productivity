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
  const lckBonus     = Math.floor((hero?.lck || 0) / 5);
  const runeDropMult = typeof getRuneBonus === 'function' ? (1 + getRuneBonus('drop_rate')) : 1;
  const fragQty = Math.round((Math.floor(Math.random() * (table.max - table.min + 1)) + table.min + lckBonus) * runeDropMult);
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

async function grantLoot(loots, goldAmt, xpAmt, questName, questType) {
  if (!loots) return;
  const items = Array.isArray(loots) ? loots : [loots];
  if (goldAmt) addGold(goldAmt);
  showRewardModal(questName, questType, xpAmt || 0, goldAmt || 0, items);
  await Promise.all(items.map(l => addInvItem(l.key, l.type, l.qty)));
  if (typeof renderSpells === 'function') renderSpells();
}

function showRewardModal(questName, questType, xpAmt, goldAmt, items) {
  const typeLabels = { main:'⭐ Principal', side:'🗡️ Secundaria', daily:'🌅 Diaria', weekly:'📅 Semanal' };
  document.getElementById('rmQuestName').textContent = questName || 'Misión Completada';
  document.getElementById('rmQuestType').textContent = typeLabels[questType] || questType || '';

  const delay = 0.6;
  document.getElementById('rmItemRows').innerHTML = items.map((loot, i) => {
    const imgUrl = CDN + 'dungeon/' + loot.key + '.png';
    return `
      <div class="rm-reward-row" style="animation-delay:${delay + i * 0.18}s">
        <img src="${imgUrl}" class="rm-item-img" alt=""
             onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
        <span class="rm-icon" style="display:none">🎁</span>
        <div class="rm-label">${escHtml(loot.display)}</div>
        <div class="rm-qty-wrap"><span class="rm-qty" data-target="${loot.qty}">0</span></div>
      </div>`;
  }).join('');

  document.getElementById('rmXpAmt').dataset.target   = xpAmt;
  document.getElementById('rmXpAmt').textContent      = '0';
  document.getElementById('rmGoldAmt').dataset.target = goldAmt;
  document.getElementById('rmGoldAmt').textContent    = '0';

  openModal('rewardModal');

  setTimeout(() => {
    document.querySelectorAll('#rewardModal [data-target]').forEach(el => {
      _rmCountUp(el, parseInt(el.dataset.target) || 0, 750);
    });
    _rmSpawnSparkles();
  }, 350);
}

function _rmCountUp(el, target, ms) {
  const start = Date.now();
  const tick = () => {
    const p = Math.min((Date.now() - start) / ms, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(eased * target);
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = target;
  };
  requestAnimationFrame(tick);
}

/* ── Visual Inventory Grid ──────────────────────────── */
function _invItemMeta(key) {
  if (key.startsWith('spell_')) {
    const id  = key.slice(6); // remove 'spell_'
    const def = (typeof SPELL_DEFS !== 'undefined' ? SPELL_DEFS : []).find(s => s.id === id);
    const cost = (typeof SPELL_FRAG_COST !== 'undefined' ? SPELL_FRAG_COST : {})[id] || 10;
    return def
      ? { name: def.name, icon: def.icon, color: def.color, desc: def.desc, cat: 'spell', cost, spellId: id }
      : { name: key, icon: '🔮', color: '#a855f7', desc: '', cat: 'spell', cost, spellId: id };
  }
  if (key.startsWith('pet_potion_')) {
    const petKey = key.slice(11);
    const pet = (typeof PET_DEFS !== 'undefined' ? PET_DEFS : []).find(p => p.key === petKey);
    return { name: `Poción: ${pet?.name || petKey}`, icon: pet?.icon || '🧪', color: '#4ade80',
             desc: `Poción especial para ${pet?.name || 'mascota'}. Úsala en la vista de Mascotas.`,
             cat: 'pet_potion', cost: 0, spellId: null };
  }
  return { name: key, icon: '🎁', color: '#94a3b8', desc: '', cat: 'misc', cost: 0, spellId: null };
}

function renderInventory() {
  const el = document.getElementById('inventoryView');
  if (!el) return;

  const spells  = inventory.filter(r => r.item_key.startsWith('spell_')      && r.quantity > 0);
  const potions = inventory.filter(r => r.item_key.startsWith('pet_potion_') && r.quantity > 0);
  const misc    = inventory.filter(r => !r.item_key.startsWith('spell_') && !r.item_key.startsWith('pet_potion_') && r.quantity > 0);
  const COLS = 5;

  function renderSlot(item) {
    const meta = _invItemMeta(item.item_key);
    const shortName = meta.name.split(' ').slice(-2).join(' ');
    return `<button class="inv-slot" onclick="showInvItemDetail('${escHtml(item.item_key)}')"
        title="${escHtml(meta.name)}" style="--inv-color:${meta.color}">
      <div class="inv-slot-inner">
        <img src="${CDN}dungeon/${item.item_key}.png" class="inv-slot-img" alt=""
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="inv-slot-emoji" style="display:none">${meta.icon}</div>
        <div class="inv-slot-qty">×${item.quantity}</div>
      </div>
      <div class="inv-slot-name">${escHtml(shortName)}</div>
    </button>`;
  }

  function renderCat(title, items) {
    if (!items.length) return '';
    const padded = [...items];
    while (padded.length % COLS !== 0) padded.push(null);
    const slots = padded.map(it => it
      ? renderSlot(it)
      : `<div class="inv-slot inv-empty"></div>`
    ).join('');
    return `<div class="inv-cat-header">${title}</div><div class="inv-grid">${slots}</div>`;
  }

  const totalTypes = spells.length + potions.length + misc.length;
  const totalQty   = inventory.reduce((s, r) => s + (r.quantity || 0), 0);

  el.innerHTML = totalTypes === 0
    ? `<div class="empty-state">🎒 El inventario está vacío.<br><small>Completa misiones y pomodoros para obtener fragmentos y pociones.</small></div>`
    : `<div class="inv-summary">🎒 ${totalTypes} tipos · ${totalQty.toLocaleString()} items en total</div>
       ${renderCat('🔮 Fragmentos de Hechizo', spells)}
       ${renderCat('🧪 Pociones de Mascota', potions)}
       ${renderCat('🎁 Consumibles', misc)}`;
}

function showInvItemDetail(key) {
  const item = inventory.find(r => r.item_key === key);
  if (!item) return;
  const meta = _invItemMeta(key);

  document.getElementById('invDetailTitle').textContent = meta.name;
  const img   = document.getElementById('invDetailImg');
  const emoji = document.getElementById('invDetailEmoji');
  img.src = `${CDN}dungeon/${key}.png`;
  img.style.display = 'block';
  emoji.style.display = 'none';
  emoji.textContent = meta.icon;
  img.onerror = () => { img.style.display = 'none'; emoji.style.display = 'flex'; };

  document.getElementById('invDetailDesc').textContent = meta.desc || '—';
  document.getElementById('invDetailQty').textContent  = `Cantidad: ×${item.quantity}`;

  const costEl = document.getElementById('invDetailCost');
  costEl.style.display = meta.cat === 'spell' && meta.cost ? 'block' : 'none';
  costEl.textContent = `Coste para conjurar: ${meta.cost} fragmentos`;

  const useBtn = document.getElementById('invDetailUseBtn');
  useBtn.style.display = '';
  if (meta.cat === 'spell') {
    useBtn.textContent = `⚡ Conjurar (${meta.cost} frags)`;
    useBtn.disabled = item.quantity < meta.cost;
    useBtn.onclick = () => { closeModal('invDetailModal'); castSpell(meta.spellId); };
  } else if (meta.cat === 'pet_potion') {
    useBtn.textContent = '🐾 Ir a Mascotas';
    useBtn.disabled = false;
    useBtn.onclick = () => { closeModal('invDetailModal'); switchView('pets'); };
  } else {
    useBtn.style.display = 'none';
  }

  openModal('invDetailModal');
}

function _rmSpawnSparkles() {
  const modal = document.querySelector('.reward-modal');
  if (!modal) return;
  for (let i = 0; i < 14; i++) {
    const s = document.createElement('div');
    s.className = 'rm-sparkle';
    const size = 3 + Math.random() * 4;
    s.style.cssText = `left:${5 + Math.random() * 90}%;width:${size}px;height:${size}px;` +
      `animation-delay:${Math.random() * 1}s;animation-duration:${0.9 + Math.random() * 0.8}s`;
    modal.appendChild(s);
    setTimeout(() => s.remove(), 2200);
  }
}
