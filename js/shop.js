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
  // Mejora permanente: Pacto del Mercader +10% oro
  const upgradeBonus = n > 0 && typeof hasGoldUpgrade === 'function' && hasGoldUpgrade('gold_boost') ? 1.10 : 1;
  // Maestría: Fortuna Eterna +2%/rango
  const masteryGoldMult = n > 0 && typeof getMasteryBonus === 'function' ? 1 + getMasteryBonus('fortuna') : 1;
  const doctrineGoldMult = n > 0 && typeof getPrestigeDoctrineBonus === 'function' ? 1 + getPrestigeDoctrineBonus('gold') : 1;
  const salaGoldMult = n > 0 && typeof getSalaBonus === 'function' ? 1 + getSalaBonus('gold') : 1;
  const equipmentResonanceMult = n > 0 && typeof getEquipmentResonanceBonus === 'function' ? 1 + getEquipmentResonanceBonus('gold') : 1;
  setGold(getGold() + Math.round(n * bonus * agiBonus * starBonus * upgradeBonus * masteryGoldMult * doctrineGoldMult * salaGoldMult * equipmentResonanceMult));
}
function spendGold(n) { if (getGold() < n) { toast('💸', 'Oro insuficiente.'); return false; } addGold(-n); return true; }

function renderGold() {
  const g = getGold();
  document.querySelectorAll('.gold-display').forEach(el => { el.textContent = `🪙 ${g}`; });
  const inv = document.getElementById('invGoldAmt');
  if (inv) inv.textContent = g.toLocaleString();
}

let shopCategory = 'consumible';

function _cancelInventoryPurchase(goldBefore) {
  // addGold() aplica multiplicadores de recompensa; un reembolso debe devolver
  // exactamente el saldo previo, nunca conceder oro adicional.
  setGold(goldBefore);
  toast('⚠️', 'Compra cancelada: el objeto no se guardó. Tu oro fue devuelto.');
  renderShopItems();
  if (typeof renderInventory === 'function') renderInventory();
}

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

function _shopOwnedText(item) {
  if (item.id.startsWith('egg_'))  return getInvCount('pet_egg_' + item.id.slice(4));
  if (item.id.startsWith('frag_')) return getInvCount('spell_' + item.id.slice(5));
  if (item.id.startsWith('pot_'))  return getInvCount('pet_potion_' + item.id.slice(4));
  if (item.id.startsWith('food_')) return getInvCount('pet_food_' + item.id.slice(5));
  if ((item.id.startsWith('weapon_') || item.id.startsWith('armor_')) && typeof weapons !== 'undefined') {
    return weapons.filter(w => w.weapon_key === item.weaponKey && w.tier === (item.tier || 'comun')).length;
  }
  return null;
}
function _shopDailyOffer() {
  const day = new Date().toISOString().slice(0, 10);
  const pool = SHOP_ITEMS.filter(item => !['mejoras','marcos'].includes(item.category));
  if (!pool.length) return null;
  const seed = [...day].reduce((total, char) => total + char.charCodeAt(0), 0);
  const item = pool[seed % pool.length];
  return { id:item.id, discount:20, cost:Math.max(1, Math.round(item.cost * .8)) };
}
function _weeklyBlueprintOffer() {
  const week = `${new Date().getFullYear()}-${Math.floor((Date.now() - new Date(new Date().getFullYear(),0,1)) / 604800000)}`;
  const catalog = (typeof SALA_FURNITURE !== 'undefined' ? SALA_FURNITURE : []).filter(item => !item.legacy && item.price > 0);
  if (!catalog.length) return null;
  const seed = Array.from(week).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const furniture = catalog[seed % catalog.length];
  return { week, furniture, cost:Math.max(250, Math.round(furniture.price * .28)) };
}
function _weeklyBlueprintOwned(id) {
  try { const data = typeof _getWeekData === 'function' ? _getWeekData() : JSON.parse(hero?.week_data || '{}'); return (data.sala_blueprints || []).includes(id); } catch { return false; }
}
async function buyWeeklyBlueprint(id, cost) {
  const offer = _weeklyBlueprintOffer();
  if (!offer || offer.furniture.id !== id || _weeklyBlueprintOwned(id)) return;
  if (!spendGold(cost)) return;
  const data = typeof _getWeekData === 'function' ? _getWeekData() : (() => { try { return JSON.parse(hero.week_data || '{}'); } catch { return {}; } })();
  data.sala_blueprints = Array.from(new Set([...(data.sala_blueprints || []), id]));
  hero.week_data = data;
  await saveHero({ week_data:data });
  toast('Plano', `Plano de ${offer.furniture.name} adquirido. Ya puedes comprarlo en Sala.`);
  renderShopItems();
}
window.buyWeeklyBlueprint = buyWeeklyBlueprint;

function renderShopItems() {
  const el = document.getElementById('shopItems');
  if (!el) return;
  const gold = getGold();
  const dailyOffer = _shopDailyOffer();
  const weeklyBlueprint = _weeklyBlueprintOffer();

  const cats = [
    { id: 'consumible', label: '⚗️ Consumibles' },
    { id: 'armas',      label: '⚔️ Armas'       },
    { id: 'armaduras',  label: '🛡️ Armaduras'  },
    { id: 'egg',        label: '🥚 Huevos'       },
    { id: 'fragment',   label: '✨ Fragmentos'   },
    { id: 'potion',     label: '🧪 Pociones'     },
    { id: 'alimento',   label: '🍖 Alimento'     },
    { id: 'mejoras',    label: '📈 Mejoras'      },
    { id: 'marcos',     label: '🖼️ Marcos'      },
  ];

  const tabs = `<div class="rpg-shop-tabs">${cats.map(c =>
    `<button class="rpg-shop-tab ${shopCategory === c.id ? 'active' : ''}"
       onclick="shopCategory='${c.id}';renderShopItems()">${c.label}</button>`
  ).join('')}</div>`;

  const activeBuffs = [
    hero?.potion_exp > Date.now() ? '⚗️ XP doble activo' : '',
    hero?.gold_rush_exp > Date.now() ? '🪙 Oro doble activo' : '',
    hero?.boss_shield ? '🛡️ Escudo de jefe listo' : '',
  ].filter(Boolean);
  const merchantHeader = `<section class="merchant-ledger"><div><span>GREMIO DE MERCADERES</span><h3>Mercado Arcano</h3><p>${activeBuffs.length ? activeBuffs.join(' · ') : 'Invierte oro en una decisión útil, no en ruido.'}</p></div><div class="merchant-ledger-gold"><b>🪙 ${gold.toLocaleString()}</b><small>oro disponible</small></div></section>${weeklyBlueprint ? `<section class="weekly-blueprint"><img src="images/${weeklyBlueprint.furniture.img}" alt=""><div><span>PLANO ROTATIVO DE LA SEMANA</span><b>${weeklyBlueprint.furniture.name}</b><small>Desbloquea su compra en tu Sala Personal.</small></div>${_weeklyBlueprintOwned(weeklyBlueprint.furniture.id) ? '<em>Plano adquirido</em>' : `<button onclick="buyWeeklyBlueprint('${weeklyBlueprint.furniture.id}',${weeklyBlueprint.cost})" ${gold < weeklyBlueprint.cost ? 'disabled' : ''}>${weeklyBlueprint.cost.toLocaleString()} oro</button>`}</section>` : ''}`;

  if (shopCategory === 'mejoras') { el.innerHTML = merchantHeader + tabs + _renderGoldUpgrades(); return; }
  if (shopCategory === 'marcos')  { el.innerHTML = merchantHeader + tabs + _renderAvatarFrames(); return; }

  const items = SHOP_ITEMS.filter(i => i.category === shopCategory);

  const cards = items.map(item => {
    const offer = dailyOffer?.id === item.id ? dailyOffer : null;
    const finalCost = offer ? offer.cost : item.cost;
    const canBuy  = gold >= finalCost;
    const rarity  = item.rarity || _shopRarity(item.cost);
    const imgHtml = item.img
      ? `<img src="images/${item.img}" alt="" onerror="this.src='${CDN}dungeon/${item.img}';this.onerror=null">`
      : `<span class="rpg-item-emoji">${item.icon || '📦'}</span>`;
    const qtyBadge = item.qty ? `<div class="rpg-item-qty-badge">×${item.qty}</div>` : '';
    const owned = _shopOwnedText(item);
    const ownedBadge = owned !== null ? `<div class="merchant-owned">Tienes ×${owned}</div>` : '';
    return `
    <div class="rpg-shop-card rpg-rarity-${rarity}">
      <div class="rpg-rarity-tag" style="color:${_RARITY_COLOR[rarity]}">${_RARITY_LABEL[rarity]}</div>
      <div class="rpg-item-visual">${imgHtml}${qtyBadge}</div>
      <div class="rpg-shop-item-name">${escHtml(item.name)}</div>
      <div class="rpg-shop-item-desc">${escHtml(item.desc)}</div>
      ${ownedBadge}
      <button class="rpg-buy-btn" onclick="buyItem('${item.id}',${finalCost})" ${canBuy ? '' : 'disabled'}>
        🪙 ${item.cost}
      </button>
    </div>`;
  }).join('');

  el.innerHTML = merchantHeader + tabs + `<div class="rpg-shop-grid">${cards || '<p style="color:var(--text3);padding:24px;text-align:center">Sin artículos en esta categoría</p>'}</div>`;
}

/* ── Mejoras permanentes (compra única, no consumibles) ──── */
function _renderGoldUpgrades() {
  const gold = getGold();
  const cards = GOLD_UPGRADES.map(u => {
    const owned   = hasGoldUpgrade(u.id);
    const locked  = u.reqUpgrade && !hasGoldUpgrade(u.reqUpgrade);
    const canBuy  = !owned && !locked && gold >= u.cost;
    return `
    <div class="rpg-shop-card rpg-rarity-legendary">
      <div class="rpg-rarity-tag" style="color:${_RARITY_COLOR.legendary}">PERMANENTE</div>
      <div class="rpg-item-visual"><img src="images/${u.img}.webp" class="rpg-item-art" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"><span class="rpg-item-emoji" style="display:none">${u.icon}</span></div>
      <div class="rpg-shop-item-name">${escHtml(u.name)}</div>
      <div class="rpg-shop-item-desc">${escHtml(u.desc)}</div>
      <button class="rpg-buy-btn" onclick="buyGoldUpgrade('${u.id}')" ${canBuy ? '' : 'disabled'}>
        ${owned ? '✅ Adquirida' : locked ? '🔒 Requiere mejora previa' : '🪙 ' + u.cost.toLocaleString()}
      </button>
    </div>`;
  }).join('');
  return `<div class="rpg-shop-grid">${cards}</div>`;
}
async function buyGoldUpgrade(id) {
  const u = GOLD_UPGRADES.find(x => x.id === id);
  if (!u || hasGoldUpgrade(id)) return;
  if (u.reqUpgrade && !hasGoldUpgrade(u.reqUpgrade)) { toast('🔒', 'Necesitas la mejora previa primero.'); return; }
  if (!spendGold(u.cost)) return;
  const owned = (() => { try { return JSON.parse(hero.gold_upgrades || '[]'); } catch { return []; } })();
  owned.push(id);
  hero.gold_upgrades = JSON.stringify(owned);
  await db.from('dungeon_heroes').update({ gold_upgrades: hero.gold_upgrades }).eq('id', hero.id);
  toast(u.icon, `¡${u.name} adquirida permanentemente!`);
  renderShopItems();
}

/* ── Marcos de avatar (cosmético, no afecta balance) ───────── */
function _renderAvatarFrames() {
  const gold = getGold();
  const owned = (() => { try { return JSON.parse(hero.owned_frames || '[]'); } catch { return []; } })();
  const cards = AVATAR_FRAMES.map(f => {
    const isOwned   = owned.includes(f.id);
    const isEquipped = hero.equipped_frame === f.id;
    const canBuy    = !isOwned && gold >= f.cost;
    return `
    <div class="rpg-shop-card rpg-rarity-epic">
      <div class="rpg-rarity-tag" style="color:${_RARITY_COLOR.epic}">COSMÉTICO</div>
      <div class="rpg-item-visual"><img src="images/${f.img}.webp" class="rpg-item-art" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"><span class="rpg-item-emoji" style="display:none">${f.icon}</span></div>
      <div class="rpg-shop-item-name">${escHtml(f.name)}</div>
      <button class="rpg-buy-btn" onclick="${isOwned ? `equipAvatarFrame('${f.id}')` : `buyAvatarFrame('${f.id}')`}" ${!isOwned && !canBuy ? 'disabled' : ''}>
        ${isEquipped ? '✅ Equipado' : isOwned ? '👕 Equipar' : '🪙 ' + f.cost.toLocaleString()}
      </button>
    </div>`;
  }).join('');
  return `<div class="rpg-shop-grid">${cards}</div>`;
}
async function buyAvatarFrame(id) {
  const f = AVATAR_FRAMES.find(x => x.id === id);
  if (!f) return;
  const owned = (() => { try { return JSON.parse(hero.owned_frames || '[]'); } catch { return []; } })();
  if (owned.includes(id)) return;
  if (!spendGold(f.cost)) return;
  owned.push(id);
  hero.owned_frames = JSON.stringify(owned);
  hero.equipped_frame = id;
  await db.from('dungeon_heroes').update({ owned_frames: hero.owned_frames, equipped_frame: id }).eq('id', hero.id);
  toast(f.icon, `¡${f.name} adquirido y equipado!`);
  renderShopItems();
  renderHeroUI();
}
async function equipAvatarFrame(id) {
  hero.equipped_frame = id;
  await saveHero({ equipped_frame: id });
  renderShopItems();
  renderHeroUI();
}

const pendingStorePurchases = new Set();

async function buyItem(id) {
  const item = SHOP_ITEMS.find(i => i.id === id);
  if (!item || pendingStorePurchases.has(id)) return;
  pendingStorePurchases.add(id);
  const requestKey = `dungeon-shop-request:${id}`;
  const requestId = sessionStorage.getItem(requestKey) || crypto.randomUUID();
  sessionStorage.setItem(requestKey, requestId);
  try {
  const { data, error } = await rpcWithRetry('purchase_dungeon_item', {
    p_item_id: id,
    p_request_id: requestId
  }, { pendingKey: `shop:${requestId}` });
  if (error) { toast('✦', error.message || 'No se pudo completar la compra.'); return; }
  const receipt = Array.isArray(data) ? data[0] : data;
  if (!receipt) { toast('✦', 'La tienda no devolvió un recibo válido.'); return; }

  sessionStorage.removeItem(requestKey);
  // Sin optimismo local: oro e inventario se recargan desde Supabase.
  await Promise.all([
    typeof loadHero === 'function' ? loadHero() : Promise.resolve(),
    typeof loadInventory === 'function' ? loadInventory() : Promise.resolve(),
    typeof loadWeapons === 'function' ? loadWeapons() : Promise.resolve()
  ]);
  if (typeof renderHeroUI === 'function') renderHeroUI();
  if (typeof renderPets === 'function') renderPets();
  if (typeof renderActivePet === 'function') renderActivePet();
  if (typeof renderQuestList === 'function') renderQuestList();
  if (typeof renderSpells === 'function') renderSpells();
  if (typeof renderInventory === 'function') renderInventory();
  renderShopItems();
  toast('✦', `${item.name} adquirido y guardado.`);
  } finally {
    pendingStorePurchases.delete(id);
  }
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
