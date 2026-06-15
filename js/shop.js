/* GOLD + TIENDA DEL GREMIO */
function getGold()       { return parseInt(localStorage.getItem('dungeon-gold') || '0'); }
function setGold(n)      { localStorage.setItem('dungeon-gold', Math.max(0, n)); renderGold(); }
function addGold(n)      { setGold(getGold() + n); }
function spendGold(n)    { if (getGold() < n) { toast('💸', 'Oro insuficiente.'); return false; } addGold(-n); return true; }

function renderGold() {
  document.querySelectorAll('.gold-display').forEach(el => { el.textContent = `🪙 ${getGold()}`; });
}

function openShop() { renderShopItems(); renderGold(); openModal('shopModal'); }

function renderShopItems() {
  const el = document.getElementById('shopItems');
  if (!el) return;
  const gold = getGold();
  el.innerHTML = SHOP_ITEMS.map(item => `
    <div class="shop-item">
      <span class="shop-icon">${item.icon}</span>
      <div class="shop-info">
        <div class="shop-name">${item.name}</div>
        <div class="shop-desc">${item.desc}</div>
      </div>
      <button class="shop-buy-btn ${gold < item.cost ? 'shop-buy-disabled' : ''}"
        onclick="buyItem('${item.id}',${item.cost})" ${gold < item.cost ? 'disabled' : ''}>
        🪙 ${item.cost}
      </button>
    </div>`).join('');
}

async function buyItem(id, cost) {
  if (!spendGold(cost)) return;
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
