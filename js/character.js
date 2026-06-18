'use strict';

const CLASS_LABELS = {
  guerrero: { name: 'Guerrero', icon: '⚔️' }, mago: { name: 'Mago', icon: '🧙' },
  picaro:   { name: 'Pícaro',   icon: '🗡️' }, clerigo: { name: 'Clérigo', icon: '✝️' },
  arquero:  { name: 'Arquero',  icon: '🏹' }, fundador: { name: 'Fundador Caótico', icon: '🚀' }
};
const RACE_LABELS = {
  humano: 'Humano', elfo: 'Elfo', enano: 'Enano', orco: 'Orco'
};

function _charAttrRowHtml(key, label, effect) {
  const val = hero[key] || 0;
  const canAdd = (hero.attr_points || 0) > 0;
  return `
    <div class="char-attr-row">
      <div class="char-attr-info">
        <span class="char-attr-label">${label}</span>
        <span class="char-attr-effect">${effect}</span>
      </div>
      <span class="char-attr-val">${val}</span>
      <button class="char-attr-btn" ${canAdd ? '' : 'disabled'} onclick="assignAttrPoint('${key}')">+</button>
    </div>`;
}

async function assignAttrPoint(key) {
  if (!hero || !(hero.attr_points > 0)) return;
  hero[key] = (hero[key] || 0) + 1;
  hero.attr_points -= 1;
  const patch = { [key]: hero[key], attr_points: hero.attr_points };
  if (key === 'con') {
    hero.hp_max = (hero.hp_max || 100) + 2;
    hero.hp = Math.min((hero.hp || 0) + 2, hero.hp_max);
    patch.hp_max = hero.hp_max; patch.hp = hero.hp;
  }
  await saveHero(patch);
  renderHeroUI();
  renderCharacterSheet();
}

function _charPortraitHtml() {
  const cls = hero.hero_class || 'guerrero';
  const race = heroRace || hero.race || 'humano';
  const url = `${CDN}dungeon/char_${cls}_${race}.png`;
  return `
    <div class="char-portrait-ring">
      <img src="${url}" class="char-portrait-img" alt=""
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div class="char-portrait-emoji" style="display:none">${hero.avatar || '🧙'}</div>
    </div>`;
}

function _charEquipSlotHtml(label, icon, weapon) {
  if (!weapon) {
    return `
      <div class="char-slot" onclick="switchView('inventory')" title="Equipar desde el Inventario">
        <span class="char-slot-icon">${icon}</span>
        <span class="char-slot-label">${label}</span>
      </div>`;
  }
  const def = WEAPON_DEFS.find(d => d.key === weapon.weapon_key) || { icon };
  const tier = WEAPON_TIERS[weapon.tier] || { color: '#9ca3af', label: weapon.tier };
  const _wSlug = { daga:'dagas' };
  const img = `${CDN}dungeon/arma_${_wSlug[weapon.weapon_key] || weapon.weapon_key}_${weapon.tier}.png`;
  const glow = (weapon.tier === 'legendario' || weapon.tier === 'mitico') ? 'anim-pulse-glow' : '';
  return `
    <div class="char-slot ${glow}" style="--wc:${tier.color};border-color:${tier.color}55" onclick="unequipWeapon('${weapon.id}')" title="Click para desequipar">
      <img src="${img}" class="char-slot-img" alt=""
           onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
      <span class="char-slot-icon" style="display:none">${def.icon}</span>
      <span class="char-slot-name" style="color:${tier.color}">${escHtml(weapon.name)}</span>
      <span class="char-slot-label">${label}</span>
    </div>`;
}

function _charLockedSlotHtml(label, icon) {
  return `
    <div class="char-slot char-slot-locked" title="Próximamente">
      <span class="char-slot-icon">🔒</span>
      <span class="char-slot-label">${label}</span>
    </div>`;
}

function _charArmorSlotHtml(slotKey, label, icon) {
  const equipped = (typeof weapons !== 'undefined' ? weapons : [])
    .find(w => w.is_equipped && w.slot === slotKey);
  if (!equipped) {
    return `
      <div class="char-slot" onclick="switchView('smithy')" title="Forjar o comprar en Tienda">
        <span class="char-slot-icon">${icon}</span>
        <span class="char-slot-label">${label}</span>
      </div>`;
  }
  const tier = WEAPON_TIERS[equipped.tier] || { color:'#9ca3af', label:equipped.tier };
  const img  = `${CDN}dungeon/arma_${equipped.weapon_key}_${equipped.tier}.png`;
  const armorDef = typeof ARMOR_DEFS !== 'undefined' ? ARMOR_DEFS.find(d => d.key === equipped.weapon_key) : null;
  const statLine = armorDef
    ? (armorDef.statKey === 'hpMax'
        ? `+${armorDef.statBase[equipped.tier] || 0} HP máx`
        : `+${Math.round((armorDef.statBase[equipped.tier] || 0) * 100)}% ${armorDef.statKey === 'xpBonus' ? 'XP' : 'Oro'}`)
    : '';
  const glow = (equipped.tier === 'legendario' || equipped.tier === 'mitico') ? 'anim-pulse-glow' : '';
  return `
    <div class="char-slot ${glow}" style="--wc:${tier.color};border-color:${tier.color}55" onclick="unequipWeapon('${equipped.id}')" title="Click para desequipar">
      <img src="${img}" class="char-slot-img" alt=""
           onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
      <span class="char-slot-icon" style="display:none">${icon}</span>
      <span class="char-slot-name" style="color:${tier.color}">${escHtml(equipped.name)}</span>
      ${statLine ? `<span class="char-slot-stat">${statLine}</span>` : ''}
      <span class="char-slot-label">${label}</span>
    </div>`;
}

function _charSecretClassesHtml() {
  const defs = typeof SECRET_CLASS_DEFS !== 'undefined' ? SECRET_CLASS_DEFS : [];
  if (!defs.length) return '';
  const unlocked = (() => { try { return JSON.parse(hero.secret_classes || '[]'); } catch { return []; } })();
  const prog = typeof getSecretProgress === 'function' ? getSecretProgress() : {};

  const progressFor = key => {
    if (key === 'crononauta')    return `${prog.midnight_total || 0}/100 misiones de madrugada`;
    if (key === 'paladin')       return `${prog.health_total || 0}/50 misiones de salud`;
    if (key === 'nigromante')    return `${prog.hp_zeros || 0}/3 veces al mínimo HP`;
    if (key === 'titan')         return `${prog.total_active_days || 0}/500 días activos`;
    if (key === 'druida')        return `${prog.midnight_streak || 0}/30 días madrugada consecutivos`;
    if (key === 'estrella-caida'){
      const base = ['crononauta','paladin','nigromante','titan','druida'];
      return `${base.filter(k => unlocked.includes(k)).length}/5 clases secretas`;
    }
    return '';
  };

  const cards = defs.map(d => {
    const isUnlocked = unlocked.includes(d.key);
    const portraitUrl = `${CDN}dungeon/${d.portrait}`;
    const progText = progressFor(d.key);
    const barPct = (() => {
      const k = d.key;
      if (k === 'crononauta')    return Math.min(100, Math.round((prog.midnight_total||0)/100*100));
      if (k === 'paladin')       return Math.min(100, Math.round((prog.health_total||0)/50*100));
      if (k === 'nigromante')    return Math.min(100, Math.round((prog.hp_zeros||0)/3*100));
      if (k === 'titan')         return Math.min(100, Math.round((prog.total_active_days||0)/500*100));
      if (k === 'druida')        return Math.min(100, Math.round((prog.midnight_streak||0)/30*100));
      if (k === 'estrella-caida'){
        const base=['crononauta','paladin','nigromante','titan','druida'];
        return Math.round(base.filter(x=>unlocked.includes(x)).length/5*100);
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

  return `<div class="char-section">
    <div class="char-section-title">🔮 Clases Secretas</div>
    <p style="font-size:12px;color:var(--text3);margin:0 0 12px">Completa condiciones especiales para desbloquear clases únicas.</p>
    <div class="secret-classes-grid">${cards}</div>
  </div>`;
}

function _charInvMiniHtml() {
  const bag = (typeof weapons !== 'undefined' ? weapons : []).filter(w => !w.is_equipped);
  const inv = typeof inventory !== 'undefined' ? inventory : [];
  if (!bag.length && !inv.length) return `<div class="inv-empty">Mochila vacía.</div>`;

  const weaponRow = w => {
    const def  = WEAPON_DEFS.find(d => d.key === w.weapon_key) || { icon: '⚔️' };
    const tier = WEAPON_TIERS[w.tier] || { color: '#9ca3af', label: w.tier };
    const img  = `${CDN}dungeon/weapon_${w.weapon_key}_${w.tier}.png`;
    return `
      <div class="inv-weapon-card" style="--wc:${tier.color}">
        <img src="${img}" class="inv-weapon-img" alt=""
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="inv-weapon-emoji" style="display:none">${def.icon}</div>
        <div class="inv-weapon-info">
          <div class="inv-weapon-name">${escHtml(w.name)}</div>
          <span class="inv-tier-badge" style="color:${tier.color};border-color:${tier.color}40;background:${tier.color}18">${tier.label}</span>
        </div>
        <button class="inv-eq-btn" onclick="equipWeapon('${w.id}')">Equipar</button>
      </div>`;
  };

  const typeLabels = { spell_fragment: '✨ Fragmentos', pet_potion: '🧪 Pociones', pet_egg: '🥚 Huevos' };
  const counts = {};
  inv.forEach(i => {
    const key = Object.keys(typeLabels).find(t => i.item_type === t) || 'other';
    counts[key] = (counts[key] || 0) + (i.quantity || 1);
  });
  const summaryRow = (key, qty) => `
    <div class="inv-item-row">
      <span style="font-size:18px">${key === 'other' ? '📦' : typeLabels[key].split(' ')[0]}</span>
      <span class="inv-item-name">${key === 'other' ? 'Consumibles' : typeLabels[key].split(' ').slice(1).join(' ')}</span>
      <span class="inv-item-qty">×${qty}</span>
    </div>`;

  return `<div class="char-inv-mini">${bag.map(weaponRow).join('')}${Object.entries(counts).map(([k, q]) => summaryRow(k, q)).join('')}</div>`;
}

function renderCharacterSheet() {
  const el = document.getElementById('characterSheet');
  if (!el || !hero) return;

  const lvl    = hero._level || 1;
  const title  = TITLES[Math.min(lvl - 1, TITLES.length - 1)];
  const cls    = hero.hero_class || 'guerrero';
  const race   = heroRace || hero.race || 'humano';
  const equipped = (typeof weapons !== 'undefined' ? weapons : []).filter(w => w.is_equipped);
  const mainHand = equipped.find(w => w.slot === 'main_hand');
  const offHand  = equipped.find(w => w.slot === 'off_hand');
  const gold     = typeof getGold === 'function' ? getGold() : 0;

  const xpPrev = xpForLevel(lvl - 1);
  const xpNext = xpForLevel(lvl);
  const xpPct  = Math.min(100, Math.round(((hero.xp_total || 0) - xpPrev) / (xpNext - xpPrev) * 100));
  const hpPct  = Math.round(((hero.hp || 0) / (hero.hp_max || 100)) * 100);

  el.innerHTML = `
    <div class="char-grid">
      <div>
        <div class="char-portrait-card">
          ${_charPortraitHtml()}
          <div class="char-name">${escHtml(hero.name || 'Héroe')}</div>
          <div class="char-title">Nv.${lvl} · ${title}</div>
          <div class="char-badges">
            <span class="char-badge">${CLASS_LABELS[cls]?.icon || '⚔️'} ${CLASS_LABELS[cls]?.name || cls}</span>
            <span class="char-badge">${RACE_LABELS[race] || race}</span>
          </div>
          <div class="char-bar-wrap">
            <div class="char-bar-label"><span>XP</span><span>${(hero.xp_total||0).toLocaleString()}</span></div>
            <div class="xp-bar sb-bar"><div class="xp-bar-fill" style="width:${xpPct}%"></div></div>
          </div>
          <div class="char-bar-wrap">
            <div class="char-bar-label"><span>HP</span><span>${hero.hp||0}/${hero.hp_max||100}</span></div>
            <div class="hp-bar sb-bar"><div class="hp-bar-fill" style="width:${hpPct}%"></div></div>
          </div>
          <div class="char-stats-grid">
            <div class="char-stat-card"><div class="char-stat-val">🪙 ${gold.toLocaleString()}</div><div class="char-stat-lbl">Oro</div></div>
            <div class="char-stat-card"><div class="char-stat-val">🔥 ${hero.streak||0}</div><div class="char-stat-lbl">Racha</div></div>
            <div class="char-stat-card"><div class="char-stat-val">🏆 ${hero.longest_streak||0}</div><div class="char-stat-lbl">Mejor racha</div></div>
            <div class="char-stat-card"><div class="char-stat-val">✅ ${hero.quests_done||0}</div><div class="char-stat-lbl">Misiones</div></div>
          </div>
          <div id="heroScoreWidget" class="hero-score-widget"></div>
        </div>
      </div>

      <div>
        <div class="char-section">
          <div class="char-section-title" style="display:flex;justify-content:space-between;align-items:center">
            <span>📊 Atributos</span>
            <span style="color:var(--gold);font-size:11px">${hero.attr_points || 0} punto${(hero.attr_points||0)===1?'':'s'} disponible${(hero.attr_points||0)===1?'':'s'}</span>
          </div>
          <div class="char-attr-grid">
            ${_charAttrRowHtml('str',  '💪 Fuerza',    '+1% XP en Épicas')}
            ${_charAttrRowHtml('intel','🧠 Intelecto', '+1% XP en Encargos/Búsquedas')}
            ${_charAttrRowHtml('agi',  '🏃 Agilidad',  '+1% Oro')}
            ${_charAttrRowHtml('con',  '❤️ Constitución', '+2 HP máx')}
            ${_charAttrRowHtml('lck',  '🍀 Suerte',    '+1 botín cada 5 puntos')}
          </div>
        </div>

        <div class="char-section">
          <div class="char-section-title">⚔️ Armas</div>
          <div class="char-equip-grid">
            ${_charEquipSlotHtml('Arma principal', '⚔️', mainHand)}
            ${_charEquipSlotHtml('Arma secundaria', '🗡️', offHand)}
          </div>
        </div>

        <div class="char-section">
          <div class="char-section-title">🛡️ Armadura</div>
          <div class="char-equip-grid char-armor-grid">
            ${_charArmorSlotHtml('body',  'Pecho',   '🧱')}
            ${_charArmorSlotHtml('head',  'Casco',   '⛑️')}
            ${_charArmorSlotHtml('feet',  'Botas',   '👢')}
            ${_charArmorSlotHtml('hands', 'Guantes', '🧤')}
            ${_charArmorSlotHtml('legs',  'Grebas',  '🦵')}
          </div>
        </div>

        <div class="char-section">
          <div class="char-section-title" style="display:flex;justify-content:space-between;align-items:center">
            <span>🎒 Mochila</span>
            <button class="btn btn-ghost" style="padding:4px 12px;font-size:11px" onclick="switchView('inventory')">Ver inventario completo</button>
          </div>
          ${_charInvMiniHtml()}
        </div>

        <div class="char-section">
          <div class="char-section-title">📝 Editar Héroe</div>
          <div class="form-group">
            <label class="form-label">Nombre del héroe</label>
            <input class="form-input" id="charEditName" type="text" value="${escHtml(hero.name || '')}">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Clase</label>
              <select class="form-input" id="charEditClass" onchange="_charPreviewPortrait()">
                <option value="guerrero">⚔️ Guerrero (+10% XP épicas)</option>
                <option value="mago">🧙 Mago (+10% todo XP)</option>
                <option value="picaro">🗡️ Pícaro (+10% XP encargos)</option>
                <option value="clerigo">✝️ Clérigo (HP con búsquedas)</option>
                <option value="arquero">🏹 Arquero (+10% XP crónicas)</option>
                <option value="fundador">🚀 Fundador Caótico</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Raza</label>
              <select class="form-input" id="charEditRace" onchange="_charPreviewPortrait()">
                <option value="humano">🧑 Humano (+10% todo XP)</option>
                <option value="elfo">🧝 Elfo (+5min focus)</option>
                <option value="enano">⛏️ Enano (+10 HP máx)</option>
                <option value="orco">💪 Orco (racha perdona 1 día)</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Nombre del Gremio</label>
            <input class="form-input" id="charEditGuild" type="text" placeholder="Ej: Gremio del Caos Productivo" value="${escHtml(guildName || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Webhook al subir de nivel (URL)</label>
            <input class="form-input" id="charEditWebhook" type="url" placeholder="https://n8n.tudominio.com/webhook/..." value="${escHtml(webhookUrl || '')}">
          </div>
          <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text2);cursor:pointer;margin-bottom:14px">
            <input type="checkbox" id="charEditNightmare" ${hero.nightmare_mode ? 'checked' : ''}>
            🔥 Modo Pesadilla — fallar una Daily duele el doble, pero XP y oro también son el doble
          </label>
          <button class="btn btn-primary" onclick="saveCharacterSheet()">Guardar cambios</button>
        </div>

        ${(() => {
          const hist = (() => { try { return JSON.parse(hero.level_history || '[]'); } catch { return []; } })();
          const histRows = hist.length
            ? [...hist].reverse().slice(0, 15).map(e =>
                `<div class="char-hist-row"><span class="char-hist-lvl">Nivel ${e.level}</span><span class="char-hist-date">${e.date || ''}</span></div>`
              ).join('')
            : '<div style="color:var(--text3);font-size:12px">Sube de nivel para registrar el historial.</div>';
          const prestigeBtn = canPrestige()
            ? `<button class="btn btn-primary" style="margin-top:10px;background:linear-gradient(90deg,#f59e0b,#a855f7)" onclick="doPrestige()">⭐ Ascender — Reiniciar en Nivel 1 con +5% XP</button>`
            : '';
          const prestigeBadge = (hero.prestige || 0) > 0
            ? `<div style="margin-bottom:8px;font-size:12px;color:var(--gold)">⭐ Ascensiones: ${hero.prestige} · Bonus XP: +${hero.prestige * 5}%</div>`
            : '';
          return `<div class="char-section">
            <div class="char-section-title">📅 Historial de Niveles</div>
            ${prestigeBadge}
            <div class="char-hist-list">${histRows}</div>
            ${prestigeBtn}
          </div>`;
        })()}

        <div class="char-section">
          <div class="char-section-title">🪪 Carnet de Héroe</div>
          <p style="font-size:12px;color:var(--text2);margin:0 0 12px">Exporta tu ficha de personaje como imagen PNG.</p>
          <button class="btn btn-primary" onclick="generateHeroCard()" style="width:100%">⬇️ Descargar Carnet PNG</button>
        </div>

        ${_charSecretClassesHtml()}

      </div>
    </div>`;

  document.getElementById('charEditClass').value = cls;
  document.getElementById('charEditRace').value  = race;
  if (typeof renderHeroScoreWidget === 'function') renderHeroScoreWidget();
}

function _charPreviewPortrait() {
  const cls  = document.getElementById('charEditClass').value;
  const race = document.getElementById('charEditRace').value;
  const ring = document.querySelector('.char-portrait-ring');
  if (!ring) return;
  ring.innerHTML = `
    <img src="${CDN}dungeon/char_${cls}_${race}.png" class="char-portrait-img" alt=""
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
    <div class="char-portrait-emoji" style="display:none">${hero.avatar || '🧙'}</div>`;
}

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

async function saveCharacterSheet() {
  const name = document.getElementById('charEditName').value.trim();
  if (!name) { toast('⚠️', 'El héroe necesita un nombre.'); return; }
  const cls  = document.getElementById('charEditClass').value;
  heroRace   = document.getElementById('charEditRace').value;
  guildName  = document.getElementById('charEditGuild').value.trim();
  webhookUrl = document.getElementById('charEditWebhook').value.trim();
  const nightmareMode = document.getElementById('charEditNightmare').checked;
  const hpMaxBonus = heroRace === 'enano' ? 110 : 100;
  await saveHero({ name, hero_class: cls, race: heroRace, hp_max: hpMaxBonus, guild_name: guildName, webhook_url: webhookUrl, nightmare_mode: nightmareMode });
  renderHeroUI();
  toast('🧙', 'Perfil actualizado.');
}
