'use strict';
/* ============================================================
   GOLD + TIENDA DEL GREMIO
   ============================================================ */
function getGold()    { return parseInt(localStorage.getItem('dungeon-gold') || '0'); }
function setGold(n)   { localStorage.setItem('dungeon-gold', Math.max(0, n)); renderGold(); }
function addGold(n)   { setGold(getGold() + n); }
function spendGold(n) { if (getGold() < n) { toast('💸', 'Oro insuficiente.'); return false; } addGold(-n); return true; }

function renderGold() {
  document.querySelectorAll('.gold-display').forEach(el => { el.textContent = `🪙 ${getGold()}`; });
}

let shopCategory = 'consumible';

function openShop() {
  shopCategory = 'consumible';
  renderShopItems();
  renderGold();
  openModal('shopModal');
}

function renderShopItems() {
  const el = document.getElementById('shopItems');
  if (!el) return;
  const gold = getGold();

  const cats = [
    { id: 'consumible', label: '⚗️ Consumibles' },
    { id: 'egg',        label: '🥚 Huevos' },
    { id: 'fragment',   label: '✨ Fragmentos' },
    { id: 'potion',     label: '🧪 Pociones' },
  ];

  const tabs = `<div class="shop-tabs">${cats.map(c =>
    `<button class="shop-tab ${shopCategory === c.id ? 'active' : ''}"
       onclick="shopCategory='${c.id}';renderShopItems()">${c.label}</button>`
  ).join('')}</div>`;

  const items = SHOP_ITEMS.filter(i => i.category === shopCategory);

  const rows = items.map(item => {
    const canBuy = gold >= item.cost;
    const imgHtml = item.img
      ? `<img src="${CDN}dungeon/${item.img}" class="shop-item-img" alt="" onerror="this.style.display='none'">`
      : `<span class="shop-icon">${item.icon || '📦'}</span>`;
    const extraLabel = item.qty ? `<span class="shop-item-qty">×${item.qty}</span>` : '';
    return `
    <div class="shop-item">
      <div class="shop-item-visual">${imgHtml}${extraLabel}</div>
      <div class="shop-info">
        <div class="shop-name">${escHtml(item.name)}</div>
        <div class="shop-desc">${escHtml(item.desc)}</div>
      </div>
      <button class="shop-buy-btn ${canBuy ? '' : 'shop-buy-disabled'}"
        onclick="buyItem('${item.id}',${item.cost})" ${canBuy ? '' : 'disabled'}>
        🪙 ${item.cost}
      </button>
    </div>`;
  }).join('');

  el.innerHTML = tabs + `<div class="shop-rows">${rows || '<p style="color:var(--text3);padding:16px;text-align:center">Sin artículos</p>'}</div>`;
}

async function buyItem(id, cost) {
  if (!spendGold(cost)) return;
  const item = SHOP_ITEMS.find(i => i.id === id);
  if (!item) return;

  /* ── Consumibles clásicos ───────────────────────── */
  if (id === 'potion') {
    localStorage.setItem('dungeon-potion-exp', Date.now() + 30 * 60 * 1000);
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
    localStorage.setItem('dungeon-amulet', '1');
    toast('🧿', '¡Amuleto equipado! Bloquea la próxima pérdida de HP.');
  } else if (id === 'xpstone') {
    await addXP(150, 'side', null);
    toast('💠', '+150 XP de sabiduría antigua.');
  } else if (id === 'revival') {
    const newHp = hero.hp_max || 100;
    hero.hp = newHp; await saveHero({ hp: newHp }); renderHeroUI();
    toast('💊', '¡HP restaurada al máximo!');

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
  }

  renderShopItems();
}

function getPotionMult() {
  const exp = parseInt(localStorage.getItem('dungeon-potion-exp') || '0');
  return exp > Date.now() ? 2 : 1;
}
function getGoldMult() {
  const w = localStorage.getItem('dungeon-weather-' + new Date().toISOString().split('T')[0]);
  return w ? (WEATHER_TYPES[w]?.goldMult || 1) : 1;
}
function getWeatherXPMult() {
  const w = localStorage.getItem('dungeon-weather-' + new Date().toISOString().split('T')[0]);
  return w ? (WEATHER_TYPES[w]?.xpMult || 1) : 1;
}
