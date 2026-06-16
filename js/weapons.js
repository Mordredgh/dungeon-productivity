'use strict';

let weapons = [];

async function loadWeapons() {
  if (!hero) return;
  const { data } = await db.from('dungeon_weapons').select('*')
    .eq('hero_id', hero.id).order('obtained_at', { ascending: false });
  weapons = data || [];
}

function getWeaponXPBonus() {
  return weapons.filter(w => w.is_equipped)
    .reduce((sum, w) => sum + (WEAPON_TIERS[w.tier]?.xpBonus || 0), 0);
}
function getWeaponGoldBonus() {
  return weapons.filter(w => w.is_equipped)
    .reduce((sum, w) => sum + (WEAPON_TIERS[w.tier]?.goldBonus || 0), 0);
}

async function addWeapon(weaponKey, tier) {
  const def     = WEAPON_DEFS.find(d => d.key === weaponKey);
  const tierDef = WEAPON_TIERS[tier];
  if (!def || !tierDef) return null;
  const name = `${def.name} ${tierDef.label}`;
  const { data } = await db.from('dungeon_weapons').insert({
    hero_id: hero.id, weapon_key: weaponKey, tier, name,
    is_equipped: false, obtained_at: new Date().toISOString()
  }).select().single();
  if (data) weapons.push(data);
  return data;
}

async function equipWeapon(id) {
  const w = weapons.find(x => x.id === id);
  if (!w) return;
  const def = WEAPON_DEFS.find(d => d.key === w.weapon_key);
  const slot = def?.slot || 'main_hand';
  const current = weapons.find(x => x.is_equipped && x.slot === slot && x.id !== id);
  if (current) {
    await db.from('dungeon_weapons').update({ is_equipped: false, slot: null }).eq('id', current.id);
    current.is_equipped = false; current.slot = null;
  }
  await db.from('dungeon_weapons').update({ is_equipped: true, slot }).eq('id', id);
  w.is_equipped = true; w.slot = slot;
  toast('⚔️', `${w.name} equipada.`);
  renderInventory(); renderSmithy();
}

async function unequipWeapon(id) {
  const w = weapons.find(x => x.id === id);
  if (!w) return;
  await db.from('dungeon_weapons').update({ is_equipped: false, slot: null }).eq('id', id);
  w.is_equipped = false; w.slot = null;
  toast('🎒', `${w.name} desequipada.`);
  renderInventory(); renderSmithy();
}

async function craftWeapon(weaponKey, targetTier) {
  const recipe = CRAFT_RECIPES[targetTier];
  if (!recipe) return;
  const sources = weapons.filter(w => w.weapon_key === weaponKey && w.tier === recipe.from && !w.is_equipped);
  if (sources.length < recipe.count) {
    const def = WEAPON_DEFS.find(d => d.key === weaponKey);
    toast('⚒️', `Necesitas ${recipe.count}× ${def?.name} ${WEAPON_TIERS[recipe.from]?.label}.`);
    return;
  }
  const toDelete = sources.slice(0, recipe.count).map(w => w.id);
  const { error } = await db.from('dungeon_weapons').delete().in('id', toDelete);
  if (error) { toast('❌', 'Error al forjar.'); return; }
  weapons = weapons.filter(w => !toDelete.includes(w.id));
  const newW = await addWeapon(weaponKey, targetTier);
  if (newW) toast('⚒️', `¡${newW.name} forjada! ${WEAPON_TIERS[targetTier]?.xpBonus ? `+${Math.round(WEAPON_TIERS[targetTier].xpBonus*100)}% XP` : ''}`);
  renderInventory(); renderSmithy();
}

/* ── INVENTORY VIEW ─────────────────────────────────────── */
function renderInventory() {
  const el = document.getElementById('inventoryView');
  if (!el) return;

  const gold       = typeof getGold === 'function' ? getGold() : 0;
  const inv        = typeof inventory !== 'undefined' ? inventory : [];
  const fragments  = inv.filter(i => i.item_type === 'spell_fragment');
  const potions    = inv.filter(i => i.item_type === 'pet_potion');
  const consumables= inv.filter(i => !['spell_fragment','pet_potion','pet_egg'].includes(i.item_type));
  const eggs       = inv.filter(i => i.item_type === 'pet_egg');
  const equipped   = weapons.filter(w => w.is_equipped);
  const bag        = weapons.filter(w => !w.is_equipped);

  const weaponCard = w => {
    const def  = WEAPON_DEFS.find(d => d.key === w.weapon_key) || { icon:'⚔️' };
    const tier = WEAPON_TIERS[w.tier] || { color:'#9ca3af', label:w.tier };
    const img  = CDN + 'dungeon/weapon_' + w.weapon_key + '_' + w.tier + '.png';
    const stats = [
      tier.xpBonus  ? `✨ +${Math.round(tier.xpBonus*100)}% XP`   : '',
      tier.goldBonus? `🪙 +${Math.round(tier.goldBonus*100)}% Oro` : '',
    ].filter(Boolean).join(' · ');
    const glow = (w.tier === 'legendario' || w.tier === 'mitico') ? 'anim-pulse-glow' : '';
    return `
      <div class="inv-weapon-card ${w.is_equipped ? 'inv-weapon-equipped' : ''} ${glow}" style="--wc:${tier.color}">
        <img src="${img}" class="inv-weapon-img" alt="${escHtml(w.name)}"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="inv-weapon-emoji" style="display:none">${def.icon}</div>
        <div class="inv-weapon-info">
          <div class="inv-weapon-name">${escHtml(w.name)}</div>
          <span class="inv-tier-badge" style="color:${tier.color};border-color:${tier.color}40;background:${tier.color}18">${tier.label}</span>
          ${stats ? `<div class="inv-weapon-stats">${stats}</div>` : ''}
          ${w.slot ? `<div class="inv-weapon-slot">${w.slot==='main_hand'?'⚔️ Mano principal':'🛡️ Mano secundaria'}</div>` : ''}
        </div>
        <button class="inv-eq-btn ${w.is_equipped?'inv-eq-active':''}"
          onclick="${w.is_equipped?`unequipWeapon('${w.id}')`:`equipWeapon('${w.id}')`}">
          ${w.is_equipped?'Desequipar':'Equipar'}
        </button>
      </div>`;
  };

  const itemRow = (i, labelFn) => {
    const img = CDN + 'dungeon/' + i.item_key + '.png';
    return `
      <div class="inv-item-row">
        <img src="${img}" class="inv-item-img" alt=""
             onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
        <span style="display:none;font-size:18px">📦</span>
        <span class="inv-item-name">${escHtml(labelFn(i))}</span>
        <span class="inv-item-qty">×${i.quantity}</span>
      </div>`;
  };

  const fragLabel = i => typeof spellFragLabel==='function' ? spellFragLabel(i.item_key.replace('spell_','')) : i.item_key;
  const potLabel  = i => { const p = (typeof PET_DEFS!=='undefined'?PET_DEFS:[]).find(p=>p.key===i.item_key.replace('pet_potion_','')); return p?`Poción de ${p.name}`:i.item_key; };
  const eggLabel  = i => { const p = (typeof PET_DEFS!=='undefined'?PET_DEFS:[]).find(p=>p.key===i.item_key.replace('pet_egg_','')); return p?`Huevo de ${p.name}`:i.item_key; };

  const section = (title, content) => `
    <div class="inv-section">
      <div class="inv-section-title">${title}</div>
      ${content}
    </div>`;

  const empty = `<div class="inv-empty">Vacío</div>`;

  el.innerHTML = `
    <div class="inv-gold-banner">
      <span style="font-size:28px">🪙</span>
      <div>
        <div class="inv-gold-amt" id="invGoldAmt">${gold.toLocaleString()}</div>
        <div class="inv-gold-lbl">Oro disponible</div>
      </div>
      <button class="btn btn-primary" style="margin-left:auto;padding:7px 18px;font-size:12px"
        onclick="switchView('shop')">🏪 Ir a la Tienda</button>
    </div>

    ${section('⚔️ Armas Equipadas',
      equipped.length ? `<div class="inv-weapons-list">${equipped.map(weaponCard).join('')}</div>` : empty)}

    ${bag.length ? section('🎒 Mochila — Armas',
      `<div class="inv-weapons-list">${bag.map(weaponCard).join('')}</div>
       <button class="btn btn-ghost" style="font-size:12px;margin-top:8px" onclick="switchView('smithy')">⚒️ Ir al Herrero</button>`) : ''}

    ${fragments.length ? section('✨ Fragmentos de Hechizo',
      `<div class="inv-items-grid">${fragments.map(i=>itemRow(i,fragLabel)).join('')}</div>`) : ''}

    ${potions.length ? section('🧪 Pociones de Mascota',
      `<div class="inv-items-grid">${potions.map(i=>itemRow(i,potLabel)).join('')}</div>`) : ''}

    ${eggs.length ? section('🥚 Huevos',
      `<div class="inv-items-grid">${eggs.map(i=>itemRow(i,eggLabel)).join('')}</div>`) : ''}

    ${consumables.length ? section('⚗️ Consumibles',
      `<div class="inv-items-grid">${consumables.map(i=>itemRow(i,i2=>i2.item_key)).join('')}</div>`) : ''}

    ${!weapons.length && !inv.length ? `<div class="inv-empty" style="margin-top:40px;font-size:15px">
      <div style="font-size:48px;margin-bottom:12px">🎒</div>
      Tu mochila está vacía.<br>
      <button class="btn btn-primary" style="margin-top:12px" onclick="switchView('shop')">🏪 Ir a la Tienda</button>
    </div>` : ''}
  `;
}

/* ── SMITHY VIEW ─────────────────────────────────────────── */
function renderSmithy() {
  const el = document.getElementById('smithyView');
  if (!el) return;

  const byKeyTier = {};
  weapons.filter(w => !w.is_equipped).forEach(w => {
    const k = w.weapon_key + '|' + w.tier;
    byKeyTier[k] = (byKeyTier[k] || 0) + 1;
  });

  const tierOrder = ['raro','epico','legendario','mitico'];

  let rows = '';
  WEAPON_DEFS.forEach(def => {
    tierOrder.forEach(targetTier => {
      const recipe  = CRAFT_RECIPES[targetTier];
      if (!recipe) return;
      const have    = byKeyTier[def.key + '|' + recipe.from] || 0;
      const canCraft= have >= recipe.count;
      const srcT    = WEAPON_TIERS[recipe.from];
      const dstT    = WEAPON_TIERS[targetTier];
      const img     = CDN + 'dungeon/weapon_' + def.key + '_' + targetTier + '.png';
      const stats   = [
        dstT.xpBonus  ? `✨ +${Math.round(dstT.xpBonus*100)}% XP`   : '',
        dstT.goldBonus? `🪙 +${Math.round(dstT.goldBonus*100)}% Oro` : '',
        dstT.hpMax    ? `❤️ +${dstT.hpMax} HP máx`                   : '',
      ].filter(Boolean).join(' · ');

      const glow = (canCraft && (targetTier === 'legendario' || targetTier === 'mitico')) ? 'anim-pulse-glow' : '';
      rows += `
        <div class="smithy-recipe ${canCraft?'smithy-ready':'smithy-locked'}">
          <img src="${img}" class="smithy-img ${glow}" style="--wc:${dstT.color}" alt=""
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div class="smithy-emoji" style="display:none">${def.icon}</div>
          <div class="smithy-info">
            <div class="smithy-name">${def.name}
              <span class="inv-tier-badge" style="color:${dstT.color};border-color:${dstT.color}40;background:${dstT.color}18">${dstT.label}</span>
            </div>
            <div class="smithy-req">
              <span style="color:${srcT.color}">${recipe.count}× ${def.name} ${srcT.label}</span>
              <span class="smithy-have ${canCraft?'smithy-have-ok':'smithy-have-no'}">tienes ${have}</span>
            </div>
            ${stats ? `<div class="smithy-stats">${stats}</div>` : ''}
          </div>
          <button class="smithy-btn ${canCraft?'':'smithy-btn-locked'}"
            onclick="craftWeapon('${def.key}','${targetTier}')" ${canCraft?'':'disabled'}>
            ${canCraft?'⚒️ Forjar':'🔒'}
          </button>
        </div>`;
    });
  });

  const bagCount = weapons.filter(w => !w.is_equipped).length;
  el.innerHTML = `
    <div class="smithy-header">
      <p class="smithy-desc">Combina armas del mismo tipo para forjar versiones más poderosas.<br>
      Las armas equipadas no se pueden usar en recetas.</p>
      ${!bagCount ? `<div class="inv-empty">Sin armas en la mochila.
        <button class="btn btn-ghost" style="padding:3px 10px;font-size:12px" onclick="switchView('shop')">Comprar en Tienda</button>
      </div>` : ''}
    </div>
    <div class="smithy-recipes">${rows}</div>
  `;
}
