'use strict';

const CLASS_LABELS = {
  guerrero: { name: 'Guerrero', icon: '⚔️', bonus: '+10% XP épicas',   img: 'clase_guerrero' },
  mago:     { name: 'Mago',     icon: '🧙', bonus: '+10% todo XP',      img: 'clase_mago' },
  picaro:   { name: 'Pícaro',   icon: '🗡️', bonus: '+10% XP encargos', img: 'clase_picaro' },
  clerigo:  { name: 'Clérigo',  icon: '✝️', bonus: 'HP con búsquedas', img: 'clase_clerigo' },
  arquero:  { name: 'Arquero',  icon: '🏹', bonus: '+10% XP crónicas', img: 'clase_arquero' },
  fundador: { name: 'Fundador', icon: '🚀', bonus: 'Caótico',          img: 'clase_fundador' },
};
const RACE_LABELS = {
  humano: { name: 'Humano', icon: '🧑', bonus: '+10% XP',        img: 'raza_humano' },
  elfo:   { name: 'Elfo',   icon: '🧝', bonus: '+5min focus',    img: 'raza_elfo' },
  enano:  { name: 'Enano',  icon: '⛏️', bonus: '+10 HP',         img: 'raza_enano' },
  orco:   { name: 'Orco',   icon: '💪', bonus: 'Perdona 1 día',  img: 'raza_orco' },
};

/* ── Selección visual de clase / raza (auto-save) ──────────── */
async function selectHeroClass(cls) {
  requestHeroClassChange(cls, CLASS_LABELS[cls]?.name || cls);
}

async function selectHeroRace(race) {
  if (!RACE_LABELS[race]) return;
  const current = heroRace || hero.race || 'humano';
  if (race === current) return;
  if (getHeroProgression().raceLocked) {
    toast('🔒', 'Tu raza está sellada. Alcanza nivel 50 y haz Prestigio para renacer bajo otra.');
    return;
  }
  const inp = document.getElementById('charEditRace');
  if (inp) inp.value = race;
  heroRace = race;
  document.querySelectorAll('.chr-race-pill').forEach(el =>
    el.classList.toggle('chr-selected', el.dataset.race === race));
  _charPreviewPortrait();
  const tree = (() => { try { return JSON.parse(hero.skill_tree || '{}'); } catch { return {}; } })();
  tree.__progression = { ...getHeroProgression(), raceLocked:true };
  await saveHero({ race, skill_tree:JSON.stringify(tree) });
  toast('✨', `${RACE_LABELS[race].name} elegida. Tu raza queda sellada hasta el próximo Prestigio.`);
}

function showRaceLockedMessage() {
  toast('🔒', 'Raza sellada: alcanza nivel 50 y realiza Prestigio para elegir otra.');
}

function requestHeroClassChange(cls, label) {
  if (!hero || cls === hero.hero_class) return;
  const quote = getClassChangeQuote(cls);
  if (!quote.allowed) {
    if (quote.reason === 'cooldown') toast('⏳', `Cambio de clase disponible en ${_formatCooldown(quote.until)}.`);
    return;
  }
  document.getElementById('classChangeModal')?.remove();
  const learned = Object.entries((() => { try { return JSON.parse(hero.skill_tree || '{}'); } catch { return {}; } })())
    .filter(([id, learned]) => !id.startsWith('__') && learned === true).length;
  const price = quote.free ? 'Gratis · cambio único' : `${CLASS_CHANGE_GOLD_COST.toLocaleString()} oro`;
  const modal = document.createElement('div');
  modal.className = 'prestige-choice-overlay';
  modal.id = 'classChangeModal';
  modal.innerHTML = `<section class="prestige-choice-card progression-confirm" role="dialog" aria-modal="true" aria-label="Confirmar cambio de clase">
    <span>JURAMENTO DE CLASE</span><h2>${escHtml(label)}</h2>
    <p><b>${price}</b>. Recibirás ${learned} punto${learned === 1 ? '' : 's'} reembolsado${learned === 1 ? '' : 's'} del árbol actual. El siguiente cambio queda bloqueado durante 7 días.</p>
    <div class="progression-summary"><span>Se conserva: raza, nivel, XP, oro, equipo, logros, mascotas y colecciones.</span><span>Se reinicia: sólo el árbol de habilidades de clase.</span></div>
    <div class="progression-confirm-actions"><button type="button" class="btn btn-ghost" onclick="document.getElementById('classChangeModal').remove()">Cancelar</button><button type="button" class="btn btn-primary" onclick="confirmHeroClassChange('${cls}')">Cambiar clase</button></div>
  </section>`;
  document.body.appendChild(modal);
}

async function confirmHeroClassChange(cls) {
  const quote = getClassChangeQuote(cls);
  if (!quote.allowed) { document.getElementById('classChangeModal')?.remove(); return; }
  if (!quote.free && (typeof getGold !== 'function' || getGold() < quote.cost)) {
    toast('💸', `Necesitas ${quote.cost.toLocaleString()} oro para cambiar de clase.`);
    return;
  }
  const progression = { ...getHeroProgression(), classFreeChangeUsed:true, classChangeCooldownUntil:Date.now() + CLASS_CHANGE_COOLDOWN_MS };
  const reset = buildClassReset(progression);
  if (!quote.free) setGold(getGold() - quote.cost);
  await saveHero({ hero_class:cls, skill_tree:JSON.stringify(reset.tree), skill_points:reset.skillPoints });
  document.getElementById('classChangeModal')?.remove();
  const inp = document.getElementById('charEditClass');
  if (inp) inp.value = cls;
  _charPreviewPortrait();
  if (typeof applyClassTheme === 'function') applyClassTheme();
  toast('⚔️', `Clase cambiada. ${reset.refunded} punto${reset.refunded === 1 ? '' : 's'} del árbol reembolsado${reset.refunded === 1 ? '' : 's'}.`);
  renderHeroUI();
  renderCharacterSheet();
}
window.confirmHeroClassChange = confirmHeroClassChange;

let _initialIdentity = { race:null, heroClass:null };
function openInitialIdentitySelection() {
  if (!hero || hero.race || getHeroProgression().raceLocked || document.getElementById('initialIdentityModal')) return;
  _initialIdentity = { race:null, heroClass:hero.hero_class || 'guerrero' };
  const modal = document.createElement('div');
  modal.className = 'prestige-choice-overlay';
  modal.id = 'initialIdentityModal';
  modal.innerHTML = `<section class="prestige-choice-card progression-confirm" role="dialog" aria-modal="true" aria-label="Elige identidad de héroe">
    <span>PRIMER JURAMENTO</span><h2>Forja tu identidad</h2><p>Elige una clase y una raza. La clase podrá cambiarse una vez gratis; la raza quedará sellada hasta Prestigio en nivel 50.</p>
    <label class="progression-subhead" for="initialHeroName">Nombre del héroe</label><input id="initialHeroName" class="form-input" maxlength="40" placeholder="Ej: Aria la Valiente" autocomplete="nickname">
    <h3 class="progression-subhead">Clase</h3><div class="progression-identity-grid">${Object.entries(CLASS_LABELS).map(([id, def]) => `<button type="button" data-initial-class="${id}" onclick="chooseInitialClass('${id}')"><img src="images/${def.img}.webp" alt=""><b>${def.name}</b><small>${def.bonus || ''}</small></button>`).join('')}</div>
    <h3 class="progression-subhead">Raza</h3><div class="progression-identity-grid">${Object.entries(RACE_LABELS).map(([id, def]) => `<button type="button" data-initial-race="${id}" onclick="chooseInitialRace('${id}')"><img src="images/${def.img}.webp" alt=""><b>${def.name}</b><small>${def.bonus || ''}</small></button>`).join('')}</div>
    <div class="progression-confirm-actions"><button type="button" class="btn btn-primary" onclick="confirmInitialIdentity()">Comenzar aventura</button></div>
  </section>`;
  document.body.appendChild(modal);
  chooseInitialClass(_initialIdentity.heroClass);
}
function chooseInitialClass(heroClass) {
  if (!CLASS_LABELS[heroClass]) return;
  _initialIdentity.heroClass = heroClass;
  document.querySelectorAll('#initialIdentityModal [data-initial-class]').forEach(el => el.classList.toggle('progression-picked', el.dataset.initialClass === heroClass));
}
function chooseInitialRace(race) {
  if (!RACE_LABELS[race]) return;
  _initialIdentity.race = race;
  document.querySelectorAll('#initialIdentityModal [data-initial-race]').forEach(el => el.classList.toggle('progression-picked', el.dataset.initialRace === race));
}
async function confirmInitialIdentity() {
  const { race, heroClass } = _initialIdentity;
  if (!RACE_LABELS[race]) { toast('🔒', 'Elige una raza para comenzar.'); return; }
  const heroName = (document.getElementById('initialHeroName')?.value || '').trim();
  if (heroName.length < 2) { toast('✍️', 'Escribe un nombre para tu héroe.'); return; }
  const tree = (() => { try { return JSON.parse(hero.skill_tree || '{}'); } catch { return {}; } })();
  tree.__progression = { ...getHeroProgression(), raceLocked:true };
  const saved = await saveHero({ name:heroName, race, hero_class:heroClass, skill_tree:JSON.stringify(tree) });
  if (!saved) return;
  heroRace = race;
  document.getElementById('initialIdentityModal')?.remove();
  if (typeof applyClassTheme === 'function') applyClassTheme();
  toast('✨', `${RACE_LABELS[race].name} ${CLASS_LABELS[heroClass].name}: tu aventura comienza.`);
  renderHeroUI();
  renderCharacterSheet();
}
window.openInitialIdentitySelection = openInitialIdentitySelection;
window.chooseInitialClass = chooseInitialClass;
window.chooseInitialRace = chooseInitialRace;
window.confirmInitialIdentity = confirmInitialIdentity;

function _cspToggleNightmare() {
  const cb = document.getElementById('charEditNightmare');
  if (!cb) return;
  cb.checked = !cb.checked;
  const tog = document.querySelector('.csp-toggle');
  if (tog) tog.classList.toggle('csp-on', cb.checked);
}

/* ── Atributos (legacy helper, usado por assignAttrPoint) ──── */
function _cspAttrRowHtml(key, icon, name, eff) {
  const val    = hero[key] || 0;
  const canAdd = (hero.attr_points || 0) > 0;
  const pct    = Math.min(100, val * 5);
  return `
    <div class="csp-attr-item">
      <span class="csp-attr-emoji">${icon}</span>
      <div class="csp-attr-mid">
        <div class="csp-attr-top">
          <span class="csp-attr-name">${name}</span>
          <span class="csp-attr-eff">${eff}</span>
        </div>
        <div class="csp-attr-track"><div class="csp-attr-bar" style="width:${pct}%"></div></div>
      </div>
      <span class="csp-attr-num">${val}</span>
      <button class="csp-attr-plus" ${canAdd ? '' : 'disabled'} onclick="assignAttrPoint('${key}')">+</button>
    </div>`;
}

async function assignAttrPoint(key) {
  if (!hero || !(hero.attr_points > 0)) return;
  hero[key] = (hero[key] || 0) + 1;
  hero.attr_points -= 1;
  const patch = { [key]: hero[key], attr_points: hero.attr_points };
  if (key === 'con') {
    hero.hp_max = (hero.hp_max || 100) + 2;
    hero.hp     = Math.min((hero.hp || 0) + 2, hero.hp_max);
    patch.hp_max = hero.hp_max;
    patch.hp     = hero.hp;
  }
  await saveHero(patch);
  renderHeroUI();
  renderCharacterSheet();
}

/* ── Grid de inventario ──────────────────────────────────────── */
function _cspInvGridHtml() {
  const bag = (typeof weapons !== 'undefined' ? weapons : []).filter(w => !w.is_equipped);
  const inv = typeof inventory !== 'undefined' ? inventory : [];
  const cells = [];

  bag.forEach(w => {
    const def  = WEAPON_DEFS.find(d => d.key === w.weapon_key) || { icon: '⚔️' };
    const tier = WEAPON_TIERS[w.tier] || { color: '#9ca3af' };
    const img  = `images/arma_${w.weapon_key}_${w.tier}.webp`;
    cells.push(`
      <div class="csp-inv-cell csp-weapon-cell" style="--wc:${tier.color}"
           onclick="equipWeapon('${w.id}')" title="${escHtml(w.name)} · ${tier.label} — Click para equipar">
        <img src="${img}" class="csp-inv-cell-img" alt=""
             onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
        <span style="display:none;font-size:18px">${def.icon}</span>
        <span class="csp-inv-cell-lbl">${escHtml(w.name.slice(0, 10))}</span>
      </div>`);
  });

  const itemIcons = { spell_fragment: '✨', pet_potion: '🧪', pet_egg: '🥚' };
  const grouped = {};
  inv.forEach(i => {
    const k = i.item_type || 'other';
    grouped[k] = (grouped[k] || 0) + (i.quantity || 1);
  });
  Object.entries(grouped).forEach(([k, qty]) => {
    const icon = itemIcons[k] || '📦';
    const lbl  = k === 'spell_fragment' ? 'Frag.' : k === 'pet_potion' ? 'Poción' : k === 'pet_egg' ? 'Huevo' : 'Item';
    cells.push(`
      <div class="csp-inv-cell" title="${lbl} ×${qty}">
        <span class="csp-inv-cell-icon">${icon}</span>
        <span class="csp-inv-cell-lbl">${lbl}</span>
        <span class="csp-inv-cell-qty">×${qty}</span>
      </div>`);
  });

  if (!cells.length)
    return `<p style="color:var(--text3);font-size:12px;text-align:center;padding:12px 0;margin:0">Mochila vacía.</p>`;

  const padded = Math.ceil(cells.length / 6) * 6;
  for (let i = cells.length; i < padded; i++)
    cells.push(`<div class="csp-inv-cell csp-empty"></div>`);

  return `<div class="csp-inv-grid">${cells.join('')}</div>`;
}

/* ── Clases secretas — siluetas (sin revelar condiciones) ────── */
function _charSecretClassesHtml() {
  const defs = typeof SECRET_CLASS_DEFS !== 'undefined' ? SECRET_CLASS_DEFS : [];
  if (!defs.length) return '';
  const unlocked = (() => { try { return JSON.parse(hero.secret_classes || '[]'); } catch { return []; } })();

  const cards = defs.map(d => {
    const isUnlocked  = unlocked.includes(d.key);
    const portraitUrl = `images/${d.portrait}`;
    if (!isUnlocked) {
      return `<div class="chr-secret-card chr-secret-locked" title="Clase secreta — aún no desbloqueada">
                <span class="chr-secret-mystery">?</span>
              </div>`;
    }
    return `
      <div class="chr-secret-card chr-secret-unlocked" title="${escHtml(d.name)} — ${escHtml(d.bonus)}">
        <img src="${portraitUrl}" alt="${escHtml(d.name)}"
             onerror="this.style.display='none'">
        <div class="chr-secret-overlay">
          <div class="chr-secret-name">${escHtml(d.name)}</div>
        </div>
        <button class="chr-secret-adopt" onclick="adoptSecretClass('${d.key}')">Adoptar</button>
      </div>`;
  }).join('');

  return `
    <div class="chr-section">
      <div class="chr-section-hd">Clases secretas</div>
      <div class="chr-secret-section">
        <div class="chr-secret-grid">${cards}</div>
      </div>
    </div>`;
}

/* ── Retrato ─────────────────────────────────────────────────── */
function _charPortraitHtml() {
  const cls  = hero.hero_class || 'guerrero';
  const race = heroRace || hero.race || 'humano';
  return `
    <div class="char-portrait-ring">
      <img src="images/char_${cls}_${race}.webp" class="char-portrait-img" alt=""
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div class="char-portrait-emoji" style="display:none">${hero.avatar || '🧙'}</div>
    </div>`;
}

function _charPreviewPortrait() {
  const cls  = document.getElementById('charEditClass')?.value || hero.hero_class || 'guerrero';
  const race = document.getElementById('charEditRace')?.value  || heroRace || 'humano';
  const ring = document.querySelector('.char-portrait-ring');
  if (!ring) return;
  ring.innerHTML = `
    <img src="images/char_${cls}_${race}.webp" class="char-portrait-img" alt=""
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
    <div class="char-portrait-emoji" style="display:none">${hero.avatar || '🧙'}</div>`;
}

/* ── Helpers Chronicle B ─────────────────────────────────────── */
function _chrAttrCardHtml(key, icon, name, eff, img) {
  const val    = hero[key] || 0;
  const canAdd = (hero.attr_points || 0) > 0;
  return `
    <div class="chr-attr-card">
      <div class="chr-attr-top-row">
        <span class="chr-attr-val">${val}</span>
        ${img
          ? `<img src="images/${img}.webp" class="chr-attr-ico-img" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"><span class="chr-attr-ico" style="display:none">${icon}</span>`
          : `<span class="chr-attr-ico">${icon}</span>`}
      </div>
      <div class="chr-attr-name">${name}</div>
      <div class="chr-attr-eff">${eff}</div>
      <button class="chr-attr-plus" ${canAdd ? '' : 'disabled'}
              onclick="assignAttrPoint('${key}')" aria-label="+1 ${name}">+</button>
    </div>`;
}

/* ── Avatar en capas (lite): badges de equipo sobre el retrato ── */
function _chrPortraitBadgesHtml(equipped) {
  const armorSlots = ['head', 'body', 'hands', 'legs', 'feet'];
  const armorPieces = (typeof weapons !== 'undefined' ? weapons : [])
    .filter(w => w.is_equipped && armorSlots.includes(w.slot));
  const mainHand = equipped.find(w => w.slot === 'main_hand');
  const badges = [];
  if (mainHand) {
    const img = `images/arma_${mainHand.weapon_key}_${mainHand.tier}.webp`;
    badges.push(`<img src="${img}" class="chr-portrait-badge chr-badge-weapon" alt="" title="${escHtml(mainHand.name)}" onerror="this.style.display='none'">`);
  }
  if (armorPieces.length) {
    const tierOrder = Object.keys(WEAPON_TIERS);
    const best = armorPieces.reduce((a, b) => (tierOrder.indexOf(b.tier) > tierOrder.indexOf(a.tier) ? b : a));
    const img = `images/arma_${best.weapon_key}_${best.tier}.webp`;
    badges.push(`<img src="${img}" class="chr-portrait-badge chr-badge-armor" alt="" title="${escHtml(best.name)}" onerror="this.style.display='none'">`);
  }
  return badges.join('');
}

function _chrEqRowHtml(slotKey, label, icon, weapon, fallbackView) {
  if (!weapon) {
    const slotImg = { main_hand: 'slot_arma-principal', off_hand: 'slot_arma-secundaria' }[slotKey];
    return `
    <div class="chr-eq-row" onclick="switchView('${fallbackView}')" title="Equipar">
      <img src="images/${slotImg}.webp" class="chr-eq-slot-img" alt=""
           onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
      <span class="chr-eq-icon" style="display:none">${icon}</span>
      <div class="chr-eq-info">
        <div class="chr-eq-vacant">Vacío</div>
        <div class="chr-eq-slot-lbl">${label}</div>
      </div>
    </div>`;
  }
  const def  = WEAPON_DEFS.find(d => d.key === weapon.weapon_key) || { icon };
  const tier = WEAPON_TIERS[weapon.tier] || { color: '#9ca3af', label: weapon.tier };
  const glow = (weapon.tier === 'legendario' || weapon.tier === 'mitico') ? 'anim-pulse-glow' : '';
  return `
    <div class="chr-eq-row chr-eq-filled ${glow}" onclick="unequipWeapon('${weapon.id}')" title="Click para desequipar">
      <img src="images/arma_${weapon.weapon_key}_${weapon.tier}.webp" class="chr-eq-item-img" alt=""
           onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
      <span class="chr-eq-icon" style="display:none">${def.icon}</span>
      <div class="chr-eq-info">
        <div class="chr-eq-name">${escHtml(weapon.name)}</div>
        <div class="chr-eq-tier" style="color:${tier.color}">${tier.label}</div>
      </div>
      <div class="chr-eq-slot-lbl">${label}</div>
    </div>`;
}

function _chrArmorRowHtml(slotKey, label, icon) {
  const eq = (typeof weapons !== 'undefined' ? weapons : [])
    .find(w => w.is_equipped && w.slot === slotKey);
  if (!eq) {
    const slotImg = { head: 'slot_casco', body: 'slot_pecho', hands: 'slot_guantes', legs: 'slot_grebas', feet: 'slot_botas' }[slotKey];
    return `
    <div class="chr-eq-row" onclick="switchView('smithy')" title="Forjar o comprar">
      <img src="images/${slotImg}.webp" class="chr-eq-slot-img" alt=""
           onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
      <span class="chr-eq-icon" style="display:none">${icon}</span>
      <div class="chr-eq-info">
        <div class="chr-eq-vacant">Vacío</div>
        <div class="chr-eq-slot-lbl">${label}</div>
      </div>
    </div>`;
  }
  const tier     = WEAPON_TIERS[eq.tier] || { color: '#9ca3af', label: eq.tier };
  const armorDef = typeof ARMOR_DEFS !== 'undefined'
    ? ARMOR_DEFS.find(d => d.key === eq.weapon_key) : null;
  const statLine = armorDef
    ? (armorDef.statKey === 'hpMax'
        ? `+${armorDef.statBase[eq.tier] || 0} HP`
        : `+${Math.round((armorDef.statBase[eq.tier] || 0) * 100)}%`)
    : '';
  const glow = (eq.tier === 'legendario' || eq.tier === 'mitico') ? 'anim-pulse-glow' : '';
  return `
    <div class="chr-eq-row chr-eq-filled ${glow}" onclick="unequipWeapon('${eq.id}')" title="Click para desequipar">
      <img src="images/arma_${eq.weapon_key}_${eq.tier}.webp" class="chr-eq-item-img" alt=""
           onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
      <span class="chr-eq-icon" style="display:none">${icon}</span>
      <div class="chr-eq-info">
        <div class="chr-eq-name">${escHtml(eq.name)}</div>
        <div class="chr-eq-tier" style="color:${tier.color}">${statLine || tier.label}</div>
      </div>
      <div class="chr-eq-slot-lbl">${label}</div>
    </div>`;
}

/* ── renderCharacterSheet — Chronicle B (3 columnas) ─────────── */
function renderCharacterSheet() {
  const el = document.getElementById('characterSheet');
  if (!el || !hero) return;

  const lvl      = hero._level || 1;
  const title    = TITLES[Math.min(lvl - 1, TITLES.length - 1)];
  const cls      = hero.hero_class || 'guerrero';
  const race     = heroRace || hero.race || 'humano';
  const equipped = (typeof weapons !== 'undefined' ? weapons : []).filter(w => w.is_equipped);
  const mainHand = equipped.find(w => w.slot === 'main_hand');
  const offHand  = equipped.find(w => w.slot === 'off_hand');
  const gold     = typeof getGold === 'function' ? getGold() : 0;
  const xpPrev   = xpForLevel(lvl - 1);
  const xpNext   = xpForLevel(lvl);
  const xpPct    = Math.min(100, Math.round(((hero.xp_total || 0) - xpPrev) / Math.max(1, xpNext - xpPrev) * 100));
  const hpPct    = Math.round(((hero.hp || 0) / Math.max(1, hero.hp_max || 100)) * 100);
  const ptsBadge = (hero.attr_points || 0) > 0
    ? `<span class="chr-pts-badge">${hero.attr_points} pts</span>`
    : '';
  const hist = Array.isArray(hero.level_history) ? hero.level_history : (() => { try { return JSON.parse(hero.level_history || '[]'); } catch { return []; } })();

  el.innerHTML = `<div class="chr-layout">

    <!-- COLUMNA IZQUIERDA: Retrato + Vitales -->
    <div class="chr-col-left">

      <div class="chr-portrait-card">
        <div class="char-portrait-ring">
          <img src="images/char_${cls}_${race}.webp" class="char-portrait-img" alt=""
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div class="char-portrait-emoji" style="display:none">${hero.avatar || '🧙'}</div>
        </div>
        <div class="chr-portrait-overlay">
          <div class="chr-hero-name">${escHtml(hero.name || 'Héroe')}</div>
          <div class="chr-hero-sub">Nivel ${lvl} · ${title}${(hero.prestige || 0) > 0
            ? ` <span class="chr-prestige-pill">⭐×${hero.prestige}</span>` : ''}</div>
        </div>
      </div>

      <div class="chr-vitals">
        <div class="chr-bar-row">
          <span class="chr-bar-lbl">HP</span>
          <div class="chr-bar-track"><div class="chr-bar-fill chr-bar-hp" style="width:${hpPct}%"></div></div>
          <span class="chr-bar-val">${hero.hp || 0}/${hero.hp_max || 100}</span>
        </div>
        <div class="chr-bar-row">
          <span class="chr-bar-lbl">XP</span>
          <div class="chr-bar-track"><div class="chr-bar-fill chr-bar-xp" style="width:${xpPct}%"></div></div>
          <span class="chr-bar-val">${xpPct}%</span>
        </div>
      </div>

      <div class="chr-quickstats">
        <div class="chr-qs"><span class="chr-qs-v"><img src="images/stat_gold.webp" alt="">${gold.toLocaleString()}</span><span class="chr-qs-l">Oro</span></div>
        <div class="chr-qs"><span class="chr-qs-v"><img src="images/stat_streak.webp" alt="">${hero.streak || 0}</span><span class="chr-qs-l">Racha</span></div>
        <div class="chr-qs"><span class="chr-qs-v"><img src="images/stat_missions.webp" alt="">${hero.quests_done || 0}</span><span class="chr-qs-l">Misiones</span></div>
        <div class="chr-qs"><span class="chr-qs-v"><img src="images/stat_record.webp" alt="">${hero.longest_streak || 0}</span><span class="chr-qs-l">Mejor racha</span></div>
      </div>

      <div id="heroScoreWidget" class="hero-score-widget" style="margin-top:8px"></div>
    </div>

    <!-- COLUMNA CENTRO: Atributos + Clase + Clases Secretas -->
    <div class="chr-col-center">

      <div class="chr-section">
        <div class="chr-section-hd">Atributos ${ptsBadge}</div>
        <div class="chr-attr-grid">
          ${_chrAttrCardHtml('str',   '💪', 'Fuerza',       '+1% XP épicas',   'attr_fuerza')}
          ${_chrAttrCardHtml('intel', '🧠', 'Intelecto',    '+1% XP encargos', 'attr_intelecto')}
          ${_chrAttrCardHtml('agi',   '🏃', 'Agilidad',     '+1% Oro',         'attr_agilidad')}
          ${_chrAttrCardHtml('con',   '❤️', 'Constitución', '+2 HP máx',       'attr_constitucion')}
          ${_chrAttrCardHtml('lck',   '🍀', 'Suerte',       '+1 botín /5',     'attr_suerte')}
        </div>
      </div>

      <div class="chr-section">
        <div class="chr-section-hd">Clase del héroe</div>
        <div class="chr-class-grid">
          ${Object.entries(CLASS_LABELS).map(([k, d]) => `
            <div class="chr-class-pill${k === cls ? ' chr-selected' : ''}" data-cls="${k}" onclick="selectHeroClass('${k}')">
              <img src="images/${d.img}.webp" class="chr-pill-icon-img" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"><span class="chr-pill-icon" style="display:none">${d.icon}</span>
              <span class="chr-pill-name">${d.name}</span>
              <span class="chr-pill-bonus">${d.bonus || ''}</span>
            </div>`).join('')}
        </div>
        <input type="hidden" id="charEditClass" value="${cls}">
      </div>

      ${_charSecretClassesHtml()}

    </div>

    <!-- COLUMNA DERECHA: Equipo + Raza + Historial + Carnet -->
    <div class="chr-col-right">

      <div class="chr-section">
        <div class="chr-section-hd">Equipo</div>
        <div class="chr-eq-list">
          ${_chrEqRowHtml('main_hand', 'Arma principal',  '⚔️', mainHand, 'inventory')}
          ${_chrEqRowHtml('off_hand',  'Arma secundaria', '🗡️', offHand,  'inventory')}
          ${_chrArmorRowHtml('head',  'Casco',   '⛑️')}
          ${_chrArmorRowHtml('body',  'Pecho',   '🧱')}
          ${_chrArmorRowHtml('hands', 'Guantes', '🧤')}
          ${_chrArmorRowHtml('legs',  'Grebas',  '🦵')}
          ${_chrArmorRowHtml('feet',  'Botas',   '👢')}
        </div>
      </div>

      <div class="chr-section">
        <div class="chr-section-hd">Raza</div>
        <div class="chr-race-grid">
          ${getHeroProgression().raceLocked ? '<span class="chr-race-lock">🔒 Sellada hasta Prestigio Nv. 50</span>' : '<span class="chr-race-lock chr-race-open">Elige una raza; esta decisión será permanente.</span>'}
          ${Object.entries(RACE_LABELS).map(([k, d]) => `
            <div class="chr-race-pill${k === race ? ' chr-selected' : ''}${getHeroProgression().raceLocked && k !== race ? ' chr-locked' : ''}" data-race="${k}" onclick="${getHeroProgression().raceLocked ? 'showRaceLockedMessage()' : `selectHeroRace('${k}')`}">
              <img src="images/${d.img}.webp" class="chr-pill-icon-img" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"><span class="chr-pill-icon" style="display:none">${d.icon}</span>
              <span class="chr-pill-name">${d.name}</span>
            </div>`).join('')}
        </div>
        <input type="hidden" id="charEditRace" value="${race}">
      </div>

      ${hist.length ? `
      <div class="chr-section">
        <div class="chr-section-hd">Historial de nivel</div>
        <div class="chr-hist-list">
          ${[...hist].reverse().slice(0, 8).map(e =>
            `<div class="chr-hist-row">
               <span class="chr-hist-lv">Nv ${e.level}</span>
               <span class="chr-hist-dt">${e.date || ''}</span>
             </div>`).join('')}
        </div>
        ${canPrestige()
          ? `<button class="chr-prestige-btn" onclick="doPrestige()">⭐ Ascender</button>`
          : ''}
      </div>` : (canPrestige() ? `<div class="chr-section"><div class="chr-section-hd">Ascensión disponible</div><button class="chr-prestige-btn" onclick="doPrestige()">⭐ Alcanzaste Nv. 50 · Ascender</button></div>` : '')}

      ${(hero.prestige || 0) > 0 || (hero.mastery_points || 0) > 0 ? `
      <div class="chr-section">
        <div class="chr-section-hd">🌟 Árbol de Maestría — ${hero.mastery_points || 0} punto${(hero.mastery_points || 0) === 1 ? '' : 's'} disponible${(hero.mastery_points || 0) === 1 ? '' : 's'}</div>
        <div class="chr-mastery-grid">
          ${MASTERY_TREE.map(node => {
            const rank = getMasteryRank(node.id);
            const maxed = rank >= node.maxRank;
            const canSpend = !maxed && (hero.mastery_points || 0) > 0;
            return `
            <div class="chr-mastery-node${maxed ? ' chr-mastery-maxed' : ''}">
              <div class="chr-mastery-icon"><img src="images/${node.img}.webp" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"><span style="display:none">${node.icon}</span></div>
              <div class="chr-mastery-name">${escHtml(node.name)} <span class="chr-mastery-rank">${rank}/${node.maxRank}</span></div>
              <div class="chr-mastery-desc">${escHtml(node.desc)}</div>
              <button class="chr-mastery-btn" onclick="spendMasteryPoint('${node.id}')" ${canSpend ? '' : 'disabled'}>
                ${maxed ? '✅ Máximo' : '+1 punto'}
              </button>
            </div>`;
          }).join('')}
        </div>
      </div>` : ''}

      <div class="chr-section">
        <div class="chr-section-hd">Carnet del héroe</div>
        <button class="chr-dl-btn" onclick="generateHeroCard()">⬇ Descargar PNG</button>
      </div>

    </div>

  </div>`;

  if (typeof renderHeroScoreWidget === 'function') renderHeroScoreWidget();
}

/* ── adoptSecretClass ─────────────────────────────────────────── */
async function adoptSecretClass(key) {
  if (!hero) return;
  const unlocked = (() => { try { return JSON.parse(hero.secret_classes || '[]'); } catch { return []; } })();
  if (!unlocked.includes(key)) { toast('🔒', 'Primero debes desbloquear esa clase.'); return; }
  const def = (typeof SECRET_CLASS_DEFS !== 'undefined' ? SECRET_CLASS_DEFS : []).find(d => d.key === key);
  requestHeroClassChange(key, def?.name || key);
}

/* ── saveCharacterSheet (clase + raza, por compatibilidad) ─────── */
async function saveCharacterSheet() {
  const cls  = document.getElementById('charEditClass')?.value;
  const race = document.getElementById('charEditRace')?.value;
  if (cls && cls !== hero.hero_class) requestHeroClassChange(cls, CLASS_LABELS[cls]?.name || cls);
  if (race && race !== (heroRace || hero.race)) await selectHeroRace(race);
  renderHeroUI();
}

/* ── Vista de Configuración ───────────────────────────────────── */
function renderConfigView() {
  const el = document.getElementById('configViewContent');
  if (!el || !hero) return;

  el.innerHTML = `
    <div class="chr-config-view">
      <div class="chr-config-hd">⚙️ Configuración</div>
      <div class="chr-config-card">
        <div class="chr-config-field">
          <label class="chr-config-lbl" for="charEditName">Nombre del héroe</label>
          <input class="chr-config-input" id="charEditName" type="text" value="${escHtml(hero.name || '')}">
        </div>
        <div class="chr-config-field">
          <label class="chr-config-lbl" for="charEditGuild">Nombre del gremio</label>
          <input class="chr-config-input" id="charEditGuild" type="text"
                 placeholder="Gremio del Caos Productivo"
                 value="${escHtml(hero.guild_name || guildName || '')}">
        </div>
        <div class="chr-config-field">
          <label class="chr-config-lbl" for="charEditWebhook">Webhook al subir de nivel</label>
          <input class="chr-config-input" id="charEditWebhook" type="url"
                 placeholder="https://n8n.tudominio.com/webhook/..."
                 value="${escHtml(hero.webhook_url || webhookUrl || '')}">
        </div>
        <div class="chr-nightmare-row" onclick="_cspToggleNightmare()">
          <span style="font-size:20px;flex-shrink:0">🔥</span>
          <span class="chr-nightmare-text">Modo Pesadilla — fallar una Daily duele el doble, pero XP y oro también son el doble</span>
          <div class="csp-toggle${hero.nightmare_mode ? ' csp-on' : ''}"></div>
          <input type="checkbox" id="charEditNightmare" ${hero.nightmare_mode ? 'checked' : ''} style="display:none">
        </div>
        <div style="padding:14px 16px;border-bottom:1px solid var(--border)">
          <button class="chr-config-save" onclick="saveConfigView()">Guardar cambios</button>
        </div>
        <div style="padding:14px 16px">
          <p style="font-size:12px;color:var(--text2);margin:0 0 10px">Exporta tu ficha de personaje como imagen PNG.</p>
          <button class="chr-dl-btn" style="width:100%;margin:0" onclick="generateHeroCard()">⬇ Descargar Carnet PNG</button>
        </div>
      </div>

      <div class="chr-config-card" style="margin-top:14px">
        <div class="chr-config-section-hd">Preferencias</div>
        <div class="chr-config-row" onclick="toggleCompact()">
          <span class="chr-config-row-icon">⊟</span>
          <span class="chr-config-row-lbl">Modo compacto</span>
          <span class="chr-config-row-hint">Reduce el espaciado de las misiones</span>
        </div>
        <div class="chr-config-row" onclick="document.getElementById('notifBtn').click()">
          <span class="chr-config-row-icon">🔔</span>
          <span class="chr-config-row-lbl">Notificaciones</span>
          <span class="chr-config-row-hint">Habilitar alertas del navegador</span>
        </div>
        ${typeof betaFeedbackRow === 'function' ? betaFeedbackRow() : ''}
      </div>

      <div class="chr-config-card" style="margin-top:14px">
        <div class="chr-config-section-hd">Datos</div>
        <div class="chr-config-row" onclick="openModal('importModal')">
          <span class="chr-config-row-icon">📥</span>
          <span class="chr-config-row-lbl">Importar</span>
          <span class="chr-config-row-hint">Restaurar desde JSON</span>
        </div>
        <div class="chr-config-row" onclick="exportData()">
          <span class="chr-config-row-icon">📤</span>
          <span class="chr-config-row-lbl">Exportar JSON</span>
          <span class="chr-config-row-hint">Copia de seguridad completa</span>
        </div>
        <div class="chr-config-row" onclick="exportCSV()">
          <span class="chr-config-row-icon">📊</span>
          <span class="chr-config-row-lbl">Exportar CSV</span>
          <span class="chr-config-row-hint">Tabla de misiones para Excel</span>
        </div>
      </div>
    </div>`;
}

async function saveConfigView() {
  const name = document.getElementById('charEditName')?.value.trim();
  if (!name) { toast('⚠️', 'El héroe necesita un nombre.'); return; }
  guildName  = document.getElementById('charEditGuild')?.value.trim() || '';
  webhookUrl = document.getElementById('charEditWebhook')?.value.trim() || '';
  const nightmareMode = document.getElementById('charEditNightmare')?.checked || false;
  const hpMaxBonus    = (heroRace || hero.race || 'humano') === 'enano' ? 110 : 100;
  await saveHero({
    name, guild_name: guildName, webhook_url: webhookUrl,
    nightmare_mode: nightmareMode, hp_max: hpMaxBonus,
  });
  renderHeroUI();
  toast('🧙', 'Configuración guardada.');
}
