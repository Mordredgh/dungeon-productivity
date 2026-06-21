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

/* ── Selección visual de clase / raza ────────────────────── */
function selectHeroClass(cls) {
  const inp = document.getElementById('charEditClass');
  if (inp) inp.value = cls;
  document.querySelectorAll('.csp-class-card').forEach(el =>
    el.classList.toggle('csp-selected', el.dataset.cls === cls));
  _charPreviewPortrait();
}

function selectHeroRace(race) {
  const inp = document.getElementById('charEditRace');
  if (inp) inp.value = race;
  document.querySelectorAll('.csp-race-card').forEach(el =>
    el.classList.toggle('csp-selected', el.dataset.race === race));
  _charPreviewPortrait();
}

function _cspToggleNightmare() {
  const cb = document.getElementById('charEditNightmare');
  if (!cb) return;
  cb.checked = !cb.checked;
  const tog = document.querySelector('.csp-toggle');
  if (tog) tog.classList.toggle('csp-on', cb.checked);
}

/* ── Atributos ───────────────────────────────────────────── */
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

/* ── Slots de equipo ─────────────────────────────────────── */
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
  const img  = `${CDN}dungeon/arma_${slugMap[weapon.weapon_key] || weapon.weapon_key}_${weapon.tier}.png`;
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
  const img      = `${CDN}dungeon/arma_${equipped.weapon_key}_${equipped.tier}.png`;
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

/* ── Grid de inventario ──────────────────────────────────── */
function _cspInvGridHtml() {
  const bag = (typeof weapons !== 'undefined' ? weapons : []).filter(w => !w.is_equipped);
  const inv = typeof inventory !== 'undefined' ? inventory : [];
  const cells = [];

  bag.forEach(w => {
    const def  = WEAPON_DEFS.find(d => d.key === w.weapon_key) || { icon: '⚔️' };
    const tier = WEAPON_TIERS[w.tier] || { color: '#9ca3af' };
    const img  = `${CDN}dungeon/arma_${w.weapon_key}_${w.tier}.png`;
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

/* ── Clases secretas (sin cambios) ──────────────────────── */
function _charSecretClassesHtml() {
  const defs = typeof SECRET_CLASS_DEFS !== 'undefined' ? SECRET_CLASS_DEFS : [];
  if (!defs.length) return '';
  const unlocked = (() => { try { return JSON.parse(hero.secret_classes || '[]'); } catch { return []; } })();
  const prog = typeof getSecretProgress === 'function' ? getSecretProgress() : {};

  const progressFor = key => {
    if (key === 'crononauta')     return `${prog.midnight_total || 0}/100 misiones de madrugada`;
    if (key === 'paladin')        return `${prog.health_total || 0}/50 misiones de salud`;
    if (key === 'nigromante')     return `${prog.hp_zeros || 0}/3 veces al mínimo HP`;
    if (key === 'titan')          return `${prog.total_active_days || 0}/500 días activos`;
    if (key === 'druida')         return `${prog.midnight_streak || 0}/30 días madrugada consecutivos`;
    if (key === 'estrella-caida') {
      const base = ['crononauta', 'paladin', 'nigromante', 'titan', 'druida'];
      return `${base.filter(k => unlocked.includes(k)).length}/5 clases secretas`;
    }
    return '';
  };

  const cards = defs.map(d => {
    const isUnlocked  = unlocked.includes(d.key);
    const portraitUrl = `${CDN}dungeon/${d.portrait}`;
    const progText    = progressFor(d.key);
    const barPct = (() => {
      const k = d.key;
      if (k === 'crononauta')     return Math.min(100, Math.round((prog.midnight_total || 0) / 100 * 100));
      if (k === 'paladin')        return Math.min(100, Math.round((prog.health_total || 0) / 50 * 100));
      if (k === 'nigromante')     return Math.min(100, Math.round((prog.hp_zeros || 0) / 3 * 100));
      if (k === 'titan')          return Math.min(100, Math.round((prog.total_active_days || 0) / 500 * 100));
      if (k === 'druida')         return Math.min(100, Math.round((prog.midnight_streak || 0) / 30 * 100));
      if (k === 'estrella-caida') {
        const base = ['crononauta', 'paladin', 'nigromante', 'titan', 'druida'];
        return Math.round(base.filter(x => unlocked.includes(x)).length / 5 * 100);
      }
      return 0;
    })();
    return `
      <div class="secret-class-card ${isUnlocked ? 'secret-unlocked' : 'secret-locked'}">
        <div class="secret-class-portrait">
          ${isUnlocked
            ? `<img src="${portraitUrl}" class="secret-portrait-img" alt="${escHtml(d.name)}"
                    onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
               <div class="secret-portrait-emoji" style="display:none">${d.icon}</div>`
            : `<div class="secret-portrait-emoji secret-portrait-mystery">?</div>`}
        </div>
        <div class="secret-class-info">
          <div class="secret-class-name">${isUnlocked ? escHtml(d.name) : '??? Clase Secreta ???'}</div>
          ${isUnlocked
            ? `<div class="secret-class-bonus">✨ ${escHtml(d.bonus)}</div>
               <button class="btn btn-primary" style="margin-top:6px;font-size:11px;padding:4px 12px"
                 onclick="adoptSecretClass('${d.key}')">Adoptar Clase</button>`
            : `<div class="secret-class-cond">${escHtml(d.condition)}</div>
               <div class="secret-class-prog-bar"><div class="secret-class-prog-fill" style="width:${barPct}%"></div></div>
               <div class="secret-class-prog-txt">${escHtml(progText)}</div>`}
        </div>
      </div>`;
  }).join('');

  return `
    <div class="csp-section">
      <div class="csp-section-hd"><span class="csp-section-hd-icon">🔮</span>Clases Secretas</div>
      <div style="padding:14px 18px">
        <p style="font-size:12px;color:var(--text3);margin:0 0 12px">Completa condiciones especiales para desbloquear clases únicas.</p>
        <div class="secret-classes-grid">${cards}</div>
      </div>
    </div>`;
}

/* ── Retrato ─────────────────────────────────────────────── */
function _charPortraitHtml() {
  const cls  = hero.hero_class || 'guerrero';
  const race = heroRace || hero.race || 'humano';
  return `
    <div class="char-portrait-ring">
      <img src="${CDN}dungeon/char_${cls}_${race}.png" class="char-portrait-img" alt=""
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
    <img src="${CDN}dungeon/char_${cls}_${race}.png" class="char-portrait-img" alt=""
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
    <div class="char-portrait-emoji" style="display:none">${hero.avatar || '🧙'}</div>`;
}

/* ── renderCharacterSheet ─────────────────────────────────── */
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

  const xpPrev = xpForLevel(lvl - 1);
  const xpNext = xpForLevel(lvl);
  const xpPct  = Math.min(100, Math.round(((hero.xp_total || 0) - xpPrev) / Math.max(1, xpNext - xpPrev) * 100));
  const hpPct  = Math.round(((hero.hp || 0) / Math.max(1, hero.hp_max || 100)) * 100);

  const clsDef  = CLASS_LABELS[cls]  || { name: cls,  icon: '⚔️', bonus: '' };
  const raceDef = RACE_LABELS[race]  || { name: race, icon: '🧑', bonus: '' };

  const ptsBadge = (hero.attr_points || 0) > 0
    ? `<span class="csp-attr-hd-pts">${hero.attr_points} pto${(hero.attr_points || 0) === 1 ? '' : 's'}</span>`
    : '';

  const hist = (() => { try { return JSON.parse(hero.level_history || '[]'); } catch { return []; } })();
  const histRows = hist.length
    ? [...hist].reverse().slice(0, 12).map(e =>
        `<div class="csp-hist-row"><span class="csp-hist-lvl">Nivel ${e.level}</span><span class="csp-hist-date">${e.date || ''}</span></div>`
      ).join('')
    : `<p style="color:var(--text3);font-size:12px;margin:6px 0">Sube de nivel para registrar el historial.</p>`;

  el.innerHTML = `<div class="csp-layout">

    <!-- IDENTITY -->
    <div class="csp-identity">
      <div class="csp-identity-top">
        <div class="csp-portrait-wrap">${_charPortraitHtml()}</div>
        <div class="csp-identity-info">
          <h2 class="csp-hero-name">${escHtml(hero.name || 'Héroe')}</h2>
          <div class="csp-hero-title">Nivel ${lvl} &middot; ${title}</div>
          <div class="csp-badges">
            <span class="csp-badge csp-badge--class">${clsDef.icon} ${clsDef.name}</span>
            <span class="csp-badge csp-badge--race">${raceDef.icon} ${raceDef.name}</span>
            ${(hero.prestige || 0) > 0
              ? `<span class="csp-badge" style="color:var(--gold);border-color:rgba(249,226,175,.3);background:rgba(249,226,175,.07)">⭐ ×${hero.prestige}</span>`
              : ''}
          </div>
          <div class="csp-bars">
            <div class="csp-bar-row">
              <span class="csp-bar-lbl">XP</span>
              <div class="csp-bar-track"><div class="csp-bar-fill csp-bar-fill--xp" style="width:${xpPct}%"></div></div>
              <span class="csp-bar-val">${(hero.xp_total || 0).toLocaleString()}</span>
            </div>
            <div class="csp-bar-row">
              <span class="csp-bar-lbl">HP</span>
              <div class="csp-bar-track"><div class="csp-bar-fill csp-bar-fill--hp" style="width:${hpPct}%"></div></div>
              <span class="csp-bar-val">${hero.hp || 0}/${hero.hp_max || 100}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="csp-quick-stats">
        <div class="csp-qstat">
          <span class="csp-qstat-val">🪙 ${gold.toLocaleString()}</span>
          <span class="csp-qstat-lbl">Oro</span>
        </div>
        <div class="csp-qstat">
          <span class="csp-qstat-val">🔥 ${hero.streak || 0}</span>
          <span class="csp-qstat-lbl">Racha</span>
        </div>
        <div class="csp-qstat">
          <span class="csp-qstat-val">🏆 ${hero.longest_streak || 0}</span>
          <span class="csp-qstat-lbl">Mejor</span>
        </div>
        <div class="csp-qstat">
          <span class="csp-qstat-val">✅ ${hero.quests_done || 0}</span>
          <span class="csp-qstat-lbl">Misiones</span>
        </div>
      </div>
      <div id="heroScoreWidget" class="hero-score-widget" style="margin-top:12px"></div>
    </div>

    <!-- CLASE -->
    <div class="csp-section">
      <div class="csp-section-hd"><span class="csp-section-hd-icon">⚔️</span>Clase del Héroe</div>
      <div class="csp-class-picker">
        ${Object.entries(CLASS_LABELS).map(([k, d]) => `
          <div class="csp-class-card${k === cls ? ' csp-selected' : ''}" data-cls="${k}" onclick="selectHeroClass('${k}')">
            <div class="csp-class-icon">${d.icon}</div>
            <div class="csp-class-name">${d.name}</div>
            <div class="csp-class-bonus">${d.bonus || ''}</div>
          </div>`).join('')}
      </div>
      <input type="hidden" id="charEditClass" value="${cls}">
    </div>

    <!-- RAZA -->
    <div class="csp-section">
      <div class="csp-section-hd"><span class="csp-section-hd-icon">🧬</span>Raza</div>
      <div class="csp-race-picker">
        ${Object.entries(RACE_LABELS).map(([k, d]) => `
          <div class="csp-race-card${k === race ? ' csp-selected' : ''}" data-race="${k}" onclick="selectHeroRace('${k}')">
            <div class="csp-race-icon">${d.icon}</div>
            <div class="csp-race-name">${d.name}</div>
            <div class="csp-race-bonus">${d.bonus || ''}</div>
          </div>`).join('')}
      </div>
      <input type="hidden" id="charEditRace" value="${race}">
    </div>

    <!-- ATRIBUTOS -->
    <div class="csp-section">
      <div class="csp-section-hd"><span class="csp-section-hd-icon">📊</span>Atributos${ptsBadge}</div>
      <div class="csp-attr-list">
        ${_cspAttrRowHtml('str',   '💪', 'Fuerza',       '+1% XP épicas')}
        ${_cspAttrRowHtml('intel', '🧠', 'Intelecto',    '+1% XP encargos')}
        ${_cspAttrRowHtml('agi',   '🏃', 'Agilidad',     '+1% Oro')}
        ${_cspAttrRowHtml('con',   '❤️', 'Constitución', '+2 HP máx')}
        ${_cspAttrRowHtml('lck',   '🍀', 'Suerte',       '+1 botín c/5 pts')}
      </div>
    </div>

    <!-- EQUIPO -->
    <div class="csp-section">
      <div class="csp-section-hd"><span class="csp-section-hd-icon">🗡️</span>Equipo</div>
      <div class="csp-equip-body">
        <div class="csp-equip-sublbl">Armas</div>
        <div class="csp-weapon-row">
          ${_cspWeaponSlotHtml('Arma principal',  '⚔️', mainHand)}
          ${_cspWeaponSlotHtml('Arma secundaria', '🗡️', offHand)}
        </div>
        <div class="csp-equip-sublbl">Armadura</div>
        <div class="csp-armor-row">
          ${_cspArmorSlotHtml('head',  'Casco',   '⛑️')}
          ${_cspArmorSlotHtml('body',  'Pecho',   '🧱')}
          ${_cspArmorSlotHtml('hands', 'Guantes', '🧤')}
          ${_cspArmorSlotHtml('legs',  'Grebas',  '🦵')}
          ${_cspArmorSlotHtml('feet',  'Botas',   '👢')}
        </div>
      </div>
    </div>

    <!-- MOCHILA -->
    <div class="csp-section">
      <div class="csp-section-hd" style="justify-content:space-between">
        <span style="display:flex;align-items:center;gap:8px">
          <span class="csp-section-hd-icon">🎒</span>Mochila
        </span>
        <button onclick="switchView('inventory')"
                style="font-size:10px;background:none;border:1px solid var(--border);border-radius:6px;padding:3px 10px;color:var(--text2);cursor:pointer;font-family:var(--font-body)">
          Ver todo
        </button>
      </div>
      <div class="csp-inv-wrap">${_cspInvGridHtml()}</div>
    </div>

    <!-- CONFIGURACIÓN -->
    <div class="csp-section">
      <div class="csp-section-hd"><span class="csp-section-hd-icon">📝</span>Configuración</div>
      <div class="csp-config-body">
        <div class="csp-form-field">
          <label class="csp-form-lbl" for="charEditName">Nombre del héroe</label>
          <input class="csp-form-input" id="charEditName" type="text" value="${escHtml(hero.name || '')}">
        </div>
        <div class="csp-form-field">
          <label class="csp-form-lbl" for="charEditGuild">Nombre del gremio</label>
          <input class="csp-form-input" id="charEditGuild" type="text"
                 placeholder="Gremio del Caos Productivo" value="${escHtml(guildName || '')}">
        </div>
        <div class="csp-form-field">
          <label class="csp-form-lbl" for="charEditWebhook">Webhook al subir de nivel</label>
          <input class="csp-form-input" id="charEditWebhook" type="url"
                 placeholder="https://n8n.tudominio.com/webhook/..." value="${escHtml(webhookUrl || '')}">
        </div>
        <div class="csp-nightmare-row" onclick="_cspToggleNightmare()">
          <span style="font-size:20px;flex-shrink:0">🔥</span>
          <span class="csp-nightmare-text">Modo Pesadilla — fallar una Daily duele el doble, pero XP y oro también son el doble</span>
          <div class="csp-toggle${hero.nightmare_mode ? ' csp-on' : ''}"></div>
          <input type="checkbox" id="charEditNightmare" ${hero.nightmare_mode ? 'checked' : ''} style="display:none">
        </div>
        <button class="csp-save-btn" onclick="saveCharacterSheet()">Guardar cambios</button>
      </div>
    </div>

    <!-- HISTORIAL DE NIVELES -->
    <div class="csp-section">
      <div class="csp-section-hd"><span class="csp-section-hd-icon">📅</span>Historial de Niveles</div>
      ${(hero.prestige || 0) > 0
        ? `<div class="csp-prestige-badge">⭐ Ascensiones: ${hero.prestige} · Bonus XP global: +${hero.prestige * 5}%</div>`
        : ''}
      <div class="csp-hist-body">${histRows}</div>
      ${canPrestige()
        ? `<button class="csp-prestige-btn" onclick="doPrestige()">⭐ Ascender — Reiniciar en Nivel 1 con +5% XP</button>`
        : ''}
    </div>

    <!-- CARNET -->
    <div class="csp-section">
      <div class="csp-section-hd"><span class="csp-section-hd-icon">🪪</span>Carnet de Héroe</div>
      <div class="csp-config-body">
        <p style="font-size:12px;color:var(--text2);margin:0">Exporta tu ficha de personaje como imagen PNG.</p>
        <button class="csp-save-btn" onclick="generateHeroCard()">⬇️ Descargar Carnet PNG</button>
      </div>
    </div>

    ${_charSecretClassesHtml()}

  </div>`;

  if (typeof renderHeroScoreWidget === 'function') renderHeroScoreWidget();
}

/* ── adoptSecretClass ────────────────────────────────────── */
async function adoptSecretClass(key) {
  if (!hero) return;
  const unlocked = (() => { try { return JSON.parse(hero.secret_classes || '[]'); } catch { return []; } })();
  if (!unlocked.includes(key)) { toast('🔒', 'Primero debes desbloquear esa clase.'); return; }
  const def = (typeof SECRET_CLASS_DEFS !== 'undefined' ? SECRET_CLASS_DEFS : []).find(d => d.key === key);
  await saveHero({ hero_class: key });
  applyClassTheme();
  toast(def?.icon || '🔮', `¡Adoptaste la clase ${def?.name || key}!`);
  renderHeroUI();
  renderCharacterSheet();
}

/* ── saveCharacterSheet ──────────────────────────────────── */
async function saveCharacterSheet() {
  const name = document.getElementById('charEditName').value.trim();
  if (!name) { toast('⚠️', 'El héroe necesita un nombre.'); return; }
  const cls        = document.getElementById('charEditClass').value;
  heroRace         = document.getElementById('charEditRace').value;
  guildName        = document.getElementById('charEditGuild').value.trim();
  webhookUrl       = document.getElementById('charEditWebhook').value.trim();
  const nightmareMode = document.getElementById('charEditNightmare').checked;
  const hpMaxBonus    = heroRace === 'enano' ? 110 : 100;
  await saveHero({
    name, hero_class: cls, race: heroRace,
    hp_max: hpMaxBonus, guild_name: guildName,
    webhook_url: webhookUrl, nightmare_mode: nightmareMode,
  });
  renderHeroUI();
  toast('🧙', 'Perfil actualizado.');
}
