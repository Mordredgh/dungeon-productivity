'use strict';

let weapons = [];

async function loadWeapons() {
  if (!hero) return;
  const { data } = await db.from('dungeon_weapons').select('*')
    .eq('hero_id', hero.id).order('obtained_at', { ascending: false });
  weapons = data || [];
}

function getWeaponBonus(stat) {
  return weapons.filter(w => w.is_equipped).reduce((sum, w) => {
    const ad = typeof ARMOR_DEFS !== 'undefined' ? ARMOR_DEFS.find(d => d.key === w.weapon_key) : null;
    if (ad) return ad.statKey === stat ? sum + (ad.statBase[w.tier] || 0) : sum;
    return sum + (WEAPON_TIERS[w.tier]?.[stat] || 0);
  }, 0);
}

async function addWeapon(weaponKey, tier, readyAt) {
  const def     = WEAPON_DEFS.find(d => d.key === weaponKey);
  const tierDef = WEAPON_TIERS[tier];
  if (!def || !tierDef) return null;
  const name = `${def.name} ${tierDef.label}`;
  const { data } = await db.from('dungeon_weapons').insert({
    hero_id: hero.id, weapon_key: weaponKey, tier, name,
    is_equipped: false, obtained_at: new Date().toISOString(),
    ready_at: readyAt || null
  }).select().single();
  if (data) weapons.push(data);
  return data;
}

function isForging(w) { return w.ready_at && new Date(w.ready_at) > new Date(); }

async function equipWeapon(id) {
  const w = weapons.find(x => x.id === id);
  if (!w) return;
  if (isForging(w)) { toast('⏳', 'Esta arma todavía se está forjando.'); return; }
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
  const sources = weapons.filter(w => w.weapon_key === weaponKey && w.tier === recipe.from && !w.is_equipped && !isForging(w));
  if (sources.length < recipe.count) {
    const def = WEAPON_DEFS.find(d => d.key === weaponKey);
    toast('⚒️', `Necesitas ${recipe.count}× ${def?.name} ${WEAPON_TIERS[recipe.from]?.label}.`);
    return;
  }
  const toDelete = sources.slice(0, recipe.count).map(w => w.id);
  const { error } = await db.from('dungeon_weapons').delete().in('id', toDelete);
  if (error) { toast('❌', 'Error al forjar.'); return; }
  weapons = weapons.filter(w => !toDelete.includes(w.id));
  const cooldownMs = FORGE_COOLDOWN_MS[targetTier];
  const readyAt = cooldownMs ? new Date(Date.now() + cooldownMs).toISOString() : null;
  const newW = await addWeapon(weaponKey, targetTier, readyAt);
  if (newW) {
    if (readyAt) toast('⏳', `${newW.name} en forja. Estará lista en ${cooldownMs >= 86400000 * 2 ? '3 días' : '24 horas'}.`);
    else toast('⚒️', `¡${newW.name} forjada! ${WEAPON_TIERS[targetTier]?.xpBonus ? `+${Math.round(WEAPON_TIERS[targetTier].xpBonus*100)}% XP` : ''}`);
  }
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

  const forgingLabel = w => {
    const ms = new Date(w.ready_at) - new Date();
    const h  = Math.ceil(ms / 3600000);
    return h > 24 ? `⏳ Listo en ${Math.ceil(h / 24)}d` : `⏳ Listo en ${h}h`;
  };

  const weaponCard = w => {
    const def  = WEAPON_DEFS.find(d => d.key === w.weapon_key) || { icon:'⚔️' };
    const tier = WEAPON_TIERS[w.tier] || { color:'#9ca3af', label:w.tier };
    const img  = CDN + 'dungeon/arma_' + w.weapon_key + '_' + w.tier + '.png';
    const forging = isForging(w);
    const stats = [
      tier.xpBonus  ? `✨ +${Math.round(tier.xpBonus*100)}% XP`   : '',
      tier.goldBonus? `🪙 +${Math.round(tier.goldBonus*100)}% Oro` : '',
    ].filter(Boolean).join(' · ');
    const glow = !forging && (w.tier === 'legendario' || w.tier === 'mitico') ? 'anim-pulse-glow' : '';
    return `
      <div class="inv-weapon-card ${w.is_equipped ? 'inv-weapon-equipped' : ''} ${forging ? 'inv-weapon-forging' : ''} ${glow}" style="--wc:${tier.color}">
        <img src="${img}" class="inv-weapon-img" alt="${escHtml(w.name)}" style="${forging ? 'opacity:.4;filter:grayscale(1)' : ''}"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="inv-weapon-emoji" style="display:none">${def.icon}</div>
        <div class="inv-weapon-info">
          <div class="inv-weapon-name">${escHtml(w.name)}</div>
          <span class="inv-tier-badge" style="color:${tier.color};border-color:${tier.color}40;background:${tier.color}18">${tier.label}</span>
          ${forging ? `<div class="inv-weapon-stats" style="color:var(--gold)">${forgingLabel(w)}</div>` : stats ? `<div class="inv-weapon-stats">${stats}</div>` : ''}
          ${w.slot ? `<div class="inv-weapon-slot">${w.slot==='main_hand'?'⚔️ Mano principal':'🛡️ Mano secundaria'}</div>` : ''}
          ${(() => {
            const maxSlots = (typeof RUNE_SOCKET_COUNT !== 'undefined' ? RUNE_SOCKET_COUNT[w.tier] : 0) || 0;
            if (!maxSlots) return '<div class="inv-rune-row" style="color:var(--text3);font-size:10px">Sin ranuras de runa</div>';
            const filled = w.rune_slots ? JSON.parse(w.rune_slots) : [];
            const runeArr = typeof runes !== 'undefined' ? runes : [];
            const slots = Array.from({length: maxSlots}, (_, i) => {
              const rid = filled[i];
              const r   = rid ? runeArr.find(x => x.id === rid) : null;
              const d   = r && typeof RUNE_DEFS !== 'undefined' ? RUNE_DEFS[r.rune_type] : null;
              return `<span class="inv-rune-slot${d?' inv-rune-filled':''}" style="${d?`--rc:${d.color}`:'--rc:#4b5563'}" title="${d?d.name+' · '+d.desc:'Ranura vacía — engasta en Runas'}">${d?d.icon:'◇'}</span>`;
            }).join('');
            return `<div class="inv-rune-row">💎 ${slots}</div>`;
          })()}
        </div>
        <button class="inv-eq-btn ${w.is_equipped?'inv-eq-active':''}" ${forging ? 'disabled' : ''}
          onclick="${w.is_equipped?`unequipWeapon('${w.id}')`:`equipWeapon('${w.id}')`}">
          ${forging ? '⏳' : w.is_equipped?'Desequipar':'Equipar'}
        </button>
      </div>`;
  };

  const itemRow = (i, labelFn) => {
    const _iKey = i.item_key
      .replace(/^pet_food_/,    'pet_alimento_')
      .replace(/^pet_potion_/,  'pet_pocion_');
    const img = CDN + 'dungeon/' + _iKey + '.png';
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
  weapons.filter(w => !w.is_equipped && !isForging(w)).forEach(w => {
    const k = w.weapon_key + '|' + w.tier;
    byKeyTier[k] = (byKeyTier[k] || 0) + 1;
  });

  const tierOrder = ['raro','epico','legendario','mitico'];

  const armorKeys = typeof ARMOR_DEFS !== 'undefined' ? ARMOR_DEFS.map(d => d.key) : [];
  const weaponOnlyDefs = WEAPON_DEFS.filter(d => !armorKeys.includes(d.key));
  const armorDefs = WEAPON_DEFS.filter(d => armorKeys.includes(d.key));

  const buildRecipeRow = def => {
    let out = '';
    const ad = typeof ARMOR_DEFS !== 'undefined' ? ARMOR_DEFS.find(d => d.key === def.key) : null;
    tierOrder.forEach(targetTier => {
      const recipe  = CRAFT_RECIPES[targetTier];
      if (!recipe) return;
      const have    = byKeyTier[def.key + '|' + recipe.from] || 0;
      const canCraft= have >= recipe.count;
      const srcT    = WEAPON_TIERS[recipe.from];
      const dstT    = WEAPON_TIERS[targetTier];
      const img     = CDN + 'dungeon/arma_' + def.key + '_' + targetTier + '.png';
      let stats = '';
      if (ad) {
        const val = ad.statBase[targetTier] || 0;
        stats = ad.statKey === 'hpMax'
          ? `❤️ +${val} HP máx`
          : `${ad.statKey === 'xpBonus' ? '✨' : '🪙'} +${Math.round(val*100)}% ${ad.statKey === 'xpBonus' ? 'XP' : 'Oro'}`;
      } else {
        stats = [
          dstT.xpBonus  ? `✨ +${Math.round(dstT.xpBonus*100)}% XP`   : '',
          dstT.goldBonus? `🪙 +${Math.round(dstT.goldBonus*100)}% Oro` : '',
          dstT.hpMax    ? `❤️ +${dstT.hpMax} HP máx`                   : '',
        ].filter(Boolean).join(' · ');
      }
      const glow = (canCraft && (targetTier === 'legendario' || targetTier === 'mitico')) ? 'anim-pulse-glow' : '';
      out += `
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
            ${(() => { const s = (typeof RUNE_SOCKET_COUNT!=='undefined'?RUNE_SOCKET_COUNT[targetTier]:0)||0; return s ? `<div class="smithy-rune-slots">💎 ${Array(s).fill('◇').join(' ')} ${s} ranura${s>1?'s':''} de runa</div>` : ''; })()}
          </div>
          <button class="smithy-btn ${canCraft?'':'smithy-btn-locked'}"
            onclick="craftWeapon('${def.key}','${targetTier}')" ${canCraft?'':'disabled'}>
            ${canCraft?'⚒️ Forjar':'🔒'}
          </button>
        </div>`;
    });
    return out;
  };

  let rows = weaponOnlyDefs.map(buildRecipeRow).join('');
  const armorRows = armorDefs.map(buildRecipeRow).join('');

  const forgingNow = weapons.filter(w => isForging(w));
  let forgingHtml = '';
  if (forgingNow.length) {
    forgingHtml = `<div class="smithy-forging-queue">
      <div class="smithy-forging-title">🔥 En la Forja (${forgingNow.length})</div>
      ${forgingNow.map(w => {
        const ms   = new Date(w.ready_at) - new Date();
        const h    = Math.floor(ms / 3600000);
        const m    = Math.floor((ms % 3600000) / 60000);
        const tier = WEAPON_TIERS[w.tier] || {};
        return `<div class="smithy-forging-item">
          <span class="smithy-forging-name" style="color:${tier.color || 'var(--text2)'}">${escHtml(w.name)}</span>
          <span class="smithy-forging-timer">${h > 0 ? h + 'h ' : ''}${m}m restantes</span>
        </div>`;
      }).join('')}
    </div>`;
  }

  const bagCount = weapons.filter(w => !w.is_equipped).length;
  el.innerHTML = `
    <div class="smithy-header">
      <p class="smithy-desc">Combina piezas del mismo tipo para forjar versiones más poderosas.<br>
      Los ítems equipados no se pueden usar en recetas.</p>
      ${!bagCount ? `<div class="inv-empty">Sin armas ni armaduras en la mochila.
        <button class="btn btn-ghost" style="padding:3px 10px;font-size:12px" onclick="switchView('shop')">Comprar en Tienda</button>
      </div>` : ''}
    </div>
    ${forgingHtml}
    ${rows ? `<div class="smithy-section-title">⚔️ Armas</div><div class="smithy-recipes">${rows}</div>` : ''}
    ${armorRows ? `<div class="smithy-section-title" style="margin-top:18px">🛡️ Armaduras</div><div class="smithy-recipes">${armorRows}</div>` : ''}
    ${typeof RUNE_DEFS !== 'undefined' ? _renderRuneCrafting() : ''}
  `;
}

function _renderRuneCrafting() {
  const cost = typeof RUNE_FRAG_COST !== 'undefined' ? RUNE_FRAG_COST : 5;
  const rows = Object.entries(RUNE_DEFS).map(([type, def]) => {
    const have     = typeof getInvCount === 'function' ? getInvCount('rune_frag_' + type) : 0;
    const canCraft = have >= cost;
    return `
      <div class="smithy-recipe ${canCraft ? 'smithy-ready' : 'smithy-locked'}">
        <img src="images/${def.fragImg}.png" class="smithy-img" alt="" style="--wc:${def.color}"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="smithy-emoji" style="display:none">${def.icon}</div>
        <div class="smithy-info">
          <div class="smithy-name">${def.name}
            <span class="inv-tier-badge" style="color:${def.color};border-color:${def.color}40;background:${def.color}18">Runa</span>
          </div>
          <div class="smithy-req">
            <span style="color:var(--text2)">${cost}× Fragmento</span>
            <span class="smithy-have ${canCraft ? 'smithy-have-ok' : 'smithy-have-no'}">tienes ${have}</span>
          </div>
          <div class="smithy-stats">${def.desc}</div>
        </div>
        <button class="smithy-btn ${canCraft ? '' : 'smithy-btn-locked'}"
          onclick="craftRune('${type}')" ${canCraft ? '' : 'disabled'}>
          ${canCraft ? '⚒️ Forjar' : '🔒'}
        </button>
      </div>`;
  }).join('');
  return `<div class="smithy-section-title" style="margin-top:18px">💎 Runas (${cost} fragmentos c/u)</div>
          <div class="smithy-recipes">${rows}</div>`;
}
