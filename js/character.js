'use strict';

const CLASS_LABELS = {
  guerrero: { name: 'Guerrero', icon: '⚔️', bonus: '+10% XP épicas' },
  mago:     { name: 'Mago',     icon: '🧙', bonus: '+10% todo XP' },
  picaro:   { name: 'Pícaro',   icon: '🗡️', bonus: '+10% XP encargos' },
  clerigo:  { name: 'Clérigo',  icon: '✝️', bonus: 'HP con búsquedas' },
  arquero:  { name: 'Arquero',  icon: '🏹', bonus: '+10% XP crónicas' },
  fundador: { name: 'Fundador', icon: '🚀', bonus: 'Caótico' },
};
const RACE_LABELS = {
  humano: { name: 'Humano', icon: '🧑', bonus: '+10% XP' },
  elfo:   { name: 'Elfo',   icon: '🧝', bonus: '+5min focus' },
  enano:  { name: 'Enano',  icon: '⛏️', bonus: '+10 HP' },
  orco:   { name: 'Orco',   icon: '💪', bonus: 'Perdona 1 día' },
};

/* ── Selección visual de clase / raza (auto-save) ──────────── */
async function selectHeroClass(cls) {
  const inp = document.getElementById('charEditClass');
  if (inp) inp.value = cls;
  document.querySelectorAll('.chr-class-pill').forEach(el =>
    el.classList.toggle('chr-selected', el.dataset.cls === cls));
  _charPreviewPortrait();
  await saveHero({ hero_class: cls });
  renderHeroUI();
  if (typeof applyClassTheme === 'function') applyClassTheme();
}

async function selectHeroRace(race) {
  const inp = document.getElementById('charEditRace');
  if (inp) inp.value = race;
  heroRace = race;
  document.querySelectorAll('.chr-race-pill').forEach(el =>
    el.classList.toggle('chr-selected', el.dataset.race === race));
  _charPreviewPortrait();
  await saveHero({ race });
}

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

/* ── Slots de equipo (legacy — se mantienen para compatibilidad) */
function _cspWeaponSlotHtml(label, icon, weapon) {
  if (!weapon) return `
    <div class="csp-eq-slot" onclick="switchView('inventory')" title="Equipar desde inventario">
      <span class="csp-eq-slot-icon">${icon}</span>
      <span class="csp-eq-slot-label">${label}</span>
      <span class="csp-eq-slot-hint">Vacío</span>
    </div>`;
  const slugMap  = { daga: 'dagas' };
  const def  = WEAPON_DEFS.find(d => d.key === weapon.weapon_key) || { icon };
  const tier = WEAPON_TIERS[weapon.tier] || { color: '#9ca3af', label: weapon.tier };
  const img  = `images/arma_${slugMap[weapon.weapon_key] || weapon.weapon_key}_${weapon.tier}.png`;
  const glow = (weapon.tier === 'legendario' || weapon.tier === 'mitico') ? 'anim-pulse-glow' : '';
  return `
    <div class="csp-eq-slot csp-equipped ${glow}" style="--wc:${tier.color}"
         onclick="unequipWeapon('${weapon.id}')" title="Click para desequipar">
      <img src="${img}" class="csp-eq-slot-img" alt=""
           onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
      <span class="csp-eq-slot-icon" style="display:none">${def.icon}</span>
      <span class="csp-eq-slot-name">${escHtml(weapon.name)}</span>
      <span class="csp-eq-slot-tier" style="color:${tier.color}">${tier.label}</span>
      <span class="csp-eq-slot-label">${label}</span>
    </div>`;
}

function _cspArmorSlotHtml(slotKey, label, icon) {
  const equipped = (typeof weapons !== 'undefined' ? weapons : [])
    .find(w => w.is_equipped && w.slot === slotKey);
  if (!equipped) return `
    <div class="csp-eq-slot" onclick="switchView('smithy')" title="Forjar o comprar">
      <span class="csp-eq-slot-icon">${icon}</span>
      <span class="csp-eq-slot-label">${label}</span>
    </div>`;
  const tier     = WEAPON_TIERS[equipped.tier] || { color: '#9ca3af', label: equipped.tier };
  const img      = `images/arma_${equipped.weapon_key}_${equipped.tier}.png`;
  const armorDef = typeof ARMOR_DEFS !== 'undefined'
    ? ARMOR_DEFS.find(d => d.key === equipped.weapon_key) : null;
  const statLine = armorDef
    ? (armorDef.statKey === 'hpMax'
        ? `+${armorDef.statBase[equipped.tier] || 0} HP`
        : `+${Math.round((armorDef.statBase[equipped.tier] || 0) * 100)}%`)
    : '';
  const glow = (equipped.tier === 'legendario' || equipped.tier === 'mitico') ? 'anim-pulse-glow' : '';
  return `
    <div class="csp-eq-slot csp-equipped ${glow}" style="--wc:${tier.color}"
         onclick="unequipWeapon('${equipped.id}')" title="Click para desequipar">
      <img src="${img}" class="csp-eq-slot-img" alt=""
           onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
      <span class="csp-eq-slot-icon" style="display:none">${icon}</span>
      ${statLine ? `<span class="csp-eq-slot-tier" style="color:${tier.color}">${statLine}</span>` : ''}
      <span class="csp-eq-slot-label">${label}</span>
    </div>`;
}

/* ── Grid de inventario ──────────────────────────────────────── */
function _cspInvGridHtml() {
  const bag = (typeof weapons !== 'undefined' ? weapons : []).filter(w => !w.is_equipped);
  const inv = typeof inventory !== 'undefined' ? inventory : [];
  const cells = [];

  bag.forEach(w => {
    const def  = WEAPON_DEFS.find(d => d.key === w.weapon_key) || { icon: '⚔️' };
    const tier = WEAPON_TIERS[w.tier] || { color: '#9ca3af' };
    const img  = `images/arma_${w.weapon_key}_${w.tier}.png`;
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
      <img src="images/char_${cls}_${race}.png" class="char-portrait-img" alt=""
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
    <img src="images/char_${cls}_${race}.png" class="char-portrait-img" alt=""
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
    <div class="char-portrait-emoji" style="display:none">${hero.avatar || '🧙'}</div>`;
}

/* ── Helpers Chronicle B ─────────────────────────────────────── */
function _chrAttrCardHtml(key, icon, name, eff) {
  const val    = hero[key] || 0;
  const canAdd = (hero.attr_points || 0) > 0;
  return `
    <div class="chr-attr-card">
      <div class="chr-attr-top-row">
        <span class="chr-attr-val">${val}</span>
        <span class="chr-attr-ico">${icon}</span>
      </div>
      <div class="chr-attr-name">${name}</div>
      <div class="chr-attr-eff">${eff}</div>
      <button class="chr-attr-plus" ${canAdd ? '' : 'disabled'}
              onclick="assignAttrPoint('${key}')" aria-label="+1 ${name}">+</button>
    </div>`;
}

function _chrEqRowHtml(slotKey, label, icon, weapon, fallbackView) {
  if (!weapon) return `
    <div class="chr-eq-row" onclick="switchView('${fallbackView}')" title="Equipar">
      <span class="chr-eq-icon">${icon}</span>
      <div class="chr-eq-info">
        <div class="chr-eq-vacant">Vacío</div>
        <div class="chr-eq-slot-lbl">${label}</div>
      </div>
    </div>`;
  const def  = WEAPON_DEFS.find(d => d.key === weapon.weapon_key) || { icon };
  const tier = WEAPON_TIERS[weapon.tier] || { color: '#9ca3af', label: weapon.tier };
  const glow = (weapon.tier === 'legendario' || weapon.tier === 'mitico') ? 'anim-pulse-glow' : '';
  return `
    <div class="chr-eq-row chr-eq-filled ${glow}" onclick="unequipWeapon('${weapon.id}')" title="Click para desequipar">
      <span class="chr-eq-icon">${def.icon}</span>
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
  if (!eq) return `
    <div class="chr-eq-row" onclick="switchView('smithy')" title="Forjar o comprar">
      <span class="chr-eq-icon">${icon}</span>
      <div class="chr-eq-info">
        <div class="chr-eq-vacant">Vacío</div>
        <div class="chr-eq-slot-lbl">${label}</div>
      </div>
    </div>`;
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
      <span class="chr-eq-icon">${icon}</span>
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
          <img src="images/char_${cls}_${race}.png" class="char-portrait-img" alt=""
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
        <div class="chr-qs"><span class="chr-qs-v">🪙 ${gold.toLocaleString()}</span><span class="chr-qs-l">Oro</span></div>
        <div class="chr-qs"><span class="chr-qs-v">🔥 ${hero.streak || 0}</span><span class="chr-qs-l">Racha</span></div>
        <div class="chr-qs"><span class="chr-qs-v">✅ ${hero.quests_done || 0}</span><span class="chr-qs-l">Misiones</span></div>
        <div class="chr-qs"><span class="chr-qs-v">🏆 ${hero.longest_streak || 0}</span><span class="chr-qs-l">Mejor racha</span></div>
      </div>

      <div id="heroScoreWidget" class="hero-score-widget" style="margin-top:8px"></div>
    </div>

    <!-- COLUMNA CENTRO: Atributos + Clase + Clases Secretas -->
    <div class="chr-col-center">

      <div class="chr-section">
        <div class="chr-section-hd">Atributos ${ptsBadge}</div>
        <div class="chr-attr-grid">
          ${_chrAttrCardHtml('str',   '💪', 'Fuerza',       '+1% XP épicas')}
          ${_chrAttrCardHtml('intel', '🧠', 'Intelecto',    '+1% XP encargos')}
          ${_chrAttrCardHtml('agi',   '🏃', 'Agilidad',     '+1% Oro')}
          ${_chrAttrCardHtml('con',   '❤️', 'Constitución', '+2 HP máx')}
          ${_chrAttrCardHtml('lck',   '🍀', 'Suerte',       '+1 botín /5')}
        </div>
      </div>

      <div class="chr-section">
        <div class="chr-section-hd">Clase del héroe</div>
        <div class="chr-class-grid">
          ${Object.entries(CLASS_LABELS).map(([k, d]) => `
            <div class="chr-class-pill${k === cls ? ' chr-selected' : ''}" data-cls="${k}" onclick="selectHeroClass('${k}')">
              <span class="chr-pill-icon">${d.icon}</span>
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
          ${Object.entries(RACE_LABELS).map(([k, d]) => `
            <div class="chr-race-pill${k === race ? ' chr-selected' : ''}" data-race="${k}" onclick="selectHeroRace('${k}')">
              <span class="chr-pill-icon">${d.icon}</span>
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
      </div>` : ''}

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
              <div class="chr-mastery-icon">${node.icon}</div>
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
  await saveHero({ hero_class: key });
  if (typeof applyClassTheme === 'function') applyClassTheme();
  toast(def?.icon || '🔮', `¡Adoptaste la clase ${def?.name || key}!`);
  renderHeroUI();
  renderCharacterSheet();
}

/* ── saveCharacterSheet (clase + raza, por compatibilidad) ─────── */
async function saveCharacterSheet() {
  const cls  = document.getElementById('charEditClass')?.value;
  const race = document.getElementById('charEditRace')?.value;
  if (cls)  { await saveHero({ hero_class: cls }); if (typeof applyClassTheme === 'function') applyClassTheme(); }
  if (race) { heroRace = race; await saveHero({ race }); }
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
