'use strict';

const CLASS_LABELS = {
  guerrero: { name: 'Guerrero', icon: '⚔️' }, mago: { name: 'Mago', icon: '🧙' },
  picaro:   { name: 'Pícaro',   icon: '🗡️' }, clerigo: { name: 'Clérigo', icon: '✝️' },
  arquero:  { name: 'Arquero',  icon: '🏹' }, fundador: { name: 'Fundador Caótico', icon: '🚀' }
};
const RACE_LABELS = {
  humano: 'Humano', elfo: 'Elfo', enano: 'Enano', orco: 'Orco'
};

function _charPortraitHtml() {
  const cls = hero.hero_class || 'guerrero';
  const race = heroRace || hero.race || 'humano';
  const url = `${CDN}dungeon/avatar_${cls}_${race}.png`;
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
  const img = `${CDN}dungeon/weapon_${weapon.weapon_key}_${weapon.tier}.png`;
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
        </div>
      </div>

      <div>
        <div class="char-section">
          <div class="char-section-title">⚔️ Equipamiento</div>
          <div class="char-equip-grid">
            ${_charEquipSlotHtml('Arma principal', '⚔️', mainHand)}
            ${_charEquipSlotHtml('Arma secundaria', '🗡️', offHand)}
            ${_charLockedSlotHtml('Pecho', '👕')}
            ${_charLockedSlotHtml('Casco', '🪖')}
            ${_charLockedSlotHtml('Accesorio I', '💍')}
            ${_charLockedSlotHtml('Accesorio II', '💍')}
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
          <button class="btn btn-primary" onclick="saveCharacterSheet()">Guardar cambios</button>
        </div>
      </div>
    </div>`;

  document.getElementById('charEditClass').value = cls;
  document.getElementById('charEditRace').value  = race;
}

function _charPreviewPortrait() {
  const cls  = document.getElementById('charEditClass').value;
  const race = document.getElementById('charEditRace').value;
  const ring = document.querySelector('.char-portrait-ring');
  if (!ring) return;
  ring.innerHTML = `
    <img src="${CDN}dungeon/avatar_${cls}_${race}.png" class="char-portrait-img" alt=""
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
    <div class="char-portrait-emoji" style="display:none">${hero.avatar || '🧙'}</div>`;
}

async function saveCharacterSheet() {
  const name = document.getElementById('charEditName').value.trim();
  if (!name) { toast('⚠️', 'El héroe necesita un nombre.'); return; }
  const cls  = document.getElementById('charEditClass').value;
  heroRace   = document.getElementById('charEditRace').value;
  guildName  = document.getElementById('charEditGuild').value.trim();
  webhookUrl = document.getElementById('charEditWebhook').value.trim();
  const hpMaxBonus = heroRace === 'enano' ? 110 : 100;
  await saveHero({ name, hero_class: cls, race: heroRace, hp_max: hpMaxBonus, guild_name: guildName, webhook_url: webhookUrl });
  renderHeroUI();
  toast('🧙', 'Perfil actualizado.');
}
