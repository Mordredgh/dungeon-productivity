'use strict';
/* ============================================================
   GOLD + TIENDA DEL GREMIO
   ============================================================ */
function getGold()  { return hero ? (hero.gold || 0) : 0; }
function setGold(n) { const g = Math.max(0, Math.round(n)); if (hero) { hero.gold = g; saveHero({ gold: g }); } renderGold(); }
function addGold(n) {
  const bonus    = n > 0 && typeof getDungeonBonus === 'function' ? getDungeonBonus('gold') : 1;
  const agiBonus = n > 0 && hero?.agi ? 1 + hero.agi * 0.01 : 1;
  // Bono de set Estrella Caída: +10% a todo el oro ganado
  const starBonus = n > 0 && typeof isSecretSetComplete === 'function' && isSecretSetComplete('estrella-caida') ? 1.10 : 1;
  setGold(getGold() + Math.round(n * bonus * agiBonus * starBonus));
}
function spendGold(n) { if (getGold() < n) { toast('💸', 'Oro insuficiente.'); return false; } addGold(-n); return true; }

function renderGold() {
  const g = getGold();
  document.querySelectorAll('.gold-display').forEach(el => { el.textContent = `🪙 ${g}`; });
  const inv = document.getElementById('invGoldAmt');
  if (inv) inv.textContent = g.toLocaleString();
}

let shopCategory = 'consumible';

function openShop() { switchView('shop'); }

function renderShopView() {
  shopCategory = shopCategory || 'consumible';
  renderShopItems();
  renderGold();
}

function _shopRarity(cost) {
  if (cost >= 1000) return 'legendary';
  if (cost >= 500)  return 'epic';
  if (cost >= 200)  return 'rare';
  if (cost >= 80)   return 'uncommon';
  return 'common';
}
const _RARITY_LABEL = { common:'COMÚN', uncommon:'POCO COMÚN', rare:'RARO', epic:'ÉPICO', legendary:'LEGENDARIO' };
const _RARITY_COLOR = { common:'#6e7280', uncommon:'#4ade80', rare:'#60a5fa', epic:'#c084fc', legendary:'#f9e2af' };

function renderShopItems() {
  const el = document.getElementById('shopItems');
  if (!el) return;
  const gold = getGold();

  const cats = [
    { id: 'consumible', label: '⚗️ Consumibles' },
    { id: 'armas',      label: '⚔️ Armas'       },
    { id: 'armaduras',  label: '🛡️ Armaduras'  },
    { id: 'egg',        label: '🥚 Huevos'       },
    { id: 'fragment',   label: '✨ Fragmentos'   },
    { id: 'potion',     label: '🧪 Pociones'     },
    { id: 'alimento',   label: '🍖 Alimento'     },
  ];

  const tabs = `<div class="rpg-shop-tabs">${cats.map(c =>
    `<button class="rpg-shop-tab ${shopCategory === c.id ? 'active' : ''}"
       onclick="shopCategory='${c.id}';renderShopItems()">${c.label}</button>`
  ).join('')}</div>`;

  const items = SHOP_ITEMS.filter(i => i.category === shopCategory);

  const cards = items.map(item => {
    const canBuy  = gold >= item.cost;
    const rarity  = item.rarity || _shopRarity(item.cost);
    const imgHtml = item.img
      ? `<img src="images/${item.img}" alt="" onerror="this.src='${CDN}dungeon/${item.img}';this.onerror=null">`
      : `<span class="rpg-item-emoji">${item.icon || '📦'}</span>`;
    const qtyBadge = item.qty ? `<div class="rpg-item-qty-badge">×${item.qty}</div>` : '';
    return `
    <div class="rpg-shop-card rpg-rarity-${rarity}">
      <div class="rpg-rarity-tag" style="color:${_RARITY_COLOR[rarity]}">${_RARITY_LABEL[rarity]}</div>
      <div class="rpg-item-visual">${imgHtml}${qtyBadge}</div>
      <div class="rpg-shop-item-name">${escHtml(item.name)}</div>
      <div class="rpg-shop-item-desc">${escHtml(item.desc)}</div>
      <button class="rpg-buy-btn" onclick="buyItem('${item.id}',${item.cost})" ${canBuy ? '' : 'disabled'}>
        🪙 ${item.cost}
      </button>
    </div>`;
  }).join('');

  el.innerHTML = tabs + `<div class="rpg-shop-grid">${cards || '<p style="color:var(--text3);padding:24px;text-align:center">Sin artículos en esta categoría</p>'}</div>`;
}

async function buyItem(id, cost) {
  if (!spendGold(cost)) return;
  const item = SHOP_ITEMS.find(i => i.id === id);
  if (!item) return;

  /* ── Consumibles clásicos ───────────────────────── */
  if (id === 'potion') {
    const _pexp = Date.now() + 30 * 60 * 1000;
    if (hero) { hero.potion_exp = _pexp; saveHero({ potion_exp: _pexp }); }
    toast('⚗️', '¡Poción activada! 2× XP por 30 minutos.');
  } else if (id === 'scroll') {
    const pending = quests.filter(q => !q.done && q.deadline).sort((a, b) => a.deadline.localeCompare(b.deadline));
    if (!pending.length) { toast('📜', 'No hay misiones con fecha límite.'); addGold(cost); return; }
    const q = pending[0];
    const d = new Date(q.deadline); d.setDate(d.getDate() + 1);
    const nd = d.toISOString().split('T')[0];
    await db.from('dungeon_quests').update({ deadline: nd }).eq('id', q.id);
    q.deadline = nd; renderQuestList();
    toast('📜', `"${q.name}" +1 día de plazo.`);
  } else if (id === 'amulet') {
    if (hero) { hero.amulet = true; saveHero({ amulet: true }); }
    toast('🧿', '¡Amuleto equipado! Bloquea la próxima pérdida de HP.');
  } else if (id === 'xpstone') {
    await addXP(150, 'side', null);
    toast('💠', '+150 XP de sabiduría antigua.');
  } else if (id === 'revival') {
    const newHp = hero.hp_max || 100;
    hero.hp = newHp; await saveHero({ hp: newHp }); renderHeroUI();
    toast('💊', '¡HP restaurada al máximo!');

  /* ── Nuevos consumibles ───────────────────────────── */
  } else if (id === 'hp_minor') {
    const newHp = Math.min((hero.hp || 100) + 25, hero.hp_max || 100);
    hero.hp = newHp; await saveHero({ hp: newHp }); renderHeroUI();
    toast('🧪', '¡+25 HP recuperados!');

  } else if (id === 'gold_rush') {
    const exp = Date.now() + 3600000;
    await saveHero({ gold_rush_exp: exp });
    toast('💰', '¡2× Oro activo durante 1 hora!');

  } else if (id === 'boss_shield') {
    await saveHero({ boss_shield: true });
    toast('🛡️', '¡Escudo Anti-Boss equipado! Bloquea la penalización semanal.');

  } else if (id === 'xp_scroll_sm') {
    await addXP(75, 'side', null);
    toast('📜', '+75 XP del pergamino de poder.');

  /* ── Huevos de mascota ──────────────────────────── */
  } else if (id.startsWith('egg_')) {
    const petKey = id.replace('egg_', '');
    await addInvItem('pet_egg_' + petKey, 'pet_egg', 1);
    toast('🥚', `¡Huevo de ${item.name} adquirido! Ve a Mascotas para eclosionarlo.`);

  /* ── Fragmentos de hechizo ──────────────────────── */
  } else if (id.startsWith('frag_')) {
    const spellKey = id.replace('frag_', '');
    const qty = item.qty || 5;
    await addInvItem('spell_' + spellKey, 'spell_fragment', qty);
    if (typeof renderSpells === 'function') renderSpells();
    toast('✨', `+${qty} fragmentos de ${item.name}.`);

  /* ── Pociones de mascota ────────────────────────── */
  } else if (id.startsWith('pot_')) {
    const petKey = id.replace('pot_', '');
    await addInvItem('pet_potion_' + petKey, 'pet_potion', 1);
    toast('🧪', `+1 Poción de ${item.name}.`);

  /* ── Alimento de mascota ────────────────────────── */
  } else if (id.startsWith('food_')) {
    const petKey = id.replace('food_', '');
    await addInvItem('pet_food_' + petKey, 'pet_food', 1);
    if (typeof renderPets === 'function') renderPets();
    if (typeof renderActivePet === 'function') renderActivePet();
    toast('🍖', `Alimento adquirido. Ve a Mascotas → montura para dárselo.`);

  /* ── Armas y Armaduras ───────────────────────────── */
  } else if ((id.startsWith('weapon_') || id.startsWith('armor_')) && item.weaponKey) {
    if (typeof addWeapon === 'function') {
      await addWeapon(item.weaponKey, item.tier || 'comun');
      toast(item.icon, `${item.name} obtenida. Ve al Inventario.`);
    }
  }

  renderShopItems();
  if (typeof renderInventory === 'function') renderInventory();
}

function getPotionMult() {
  return hero && (hero.potion_exp || 0) > Date.now() ? 2 : 1;
}
function getGoldMult() {
  const w = localStorage.getItem('dungeon-weather-' + new Date().toISOString().split('T')[0]);
  const weatherMult = w ? (WEATHER_TYPES[w]?.goldMult || 1) : 1;
  const agiMult = 1 + ((hero?.agi || 0) * 0.01);
  return weatherMult * agiMult;
}
function getWeatherXPMult() {
  const w = localStorage.getItem('dungeon-weather-' + new Date().toISOString().split('T')[0]);
  return w ? (WEATHER_TYPES[w]?.xpMult || 1) : 1;
}
