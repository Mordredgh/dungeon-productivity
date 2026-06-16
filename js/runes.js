'use strict';

/* ── SISTEMA DE RUNAS ────────────────────────────────────────
   Runas caen al completar misiones (baja probabilidad).
   Se engastan en armas equipadas.
   Sockets por tier: común 0, raro 1, épico 2, legendario 3, mítico 3.
   Guardado en dungeon_weapons.rune_slots (jsonb array).
   Inventario de runas: dungeon_runes table.
   ─────────────────────────────────────────────────────────── */

const RUNE_DEFS = {
  fuerza:    { icon:'⚔️', name:'Runa de Fuerza',    desc:'⚔️ +8% XP en épicas',         effect:'epic_xp',    val:0.08, color:'#ef4444' },
  vigor:     { icon:'❤️', name:'Runa de Vigor',     desc:'❤️ +15 HP máximo',             effect:'hp_max',     val:15,   color:'#f43f5e' },
  celeridad: { icon:'🏃', name:'Runa de Celeridad', desc:'🏃 +8% Oro en misiones',       effect:'gold',       val:0.08, color:'#f59e0b' },
  sabiduria: { icon:'📚', name:'Runa de Sabiduría', desc:'📚 +6% XP en todas',          effect:'all_xp',     val:0.06, color:'#8b5cf6' },
  suerte:    { icon:'🍀', name:'Runa de Suerte',    desc:'🍀 +10% probabilidad de drop', effect:'drop_rate',  val:0.10, color:'#22c55e' },
  oscuridad: { icon:'🌑', name:'Runa de Oscuridad', desc:'🌑 +12% XP de noche (20-05h)', effect:'night_xp',   val:0.12, color:'#6b7280' },
  fuego:     { icon:'🔥', name:'Runa de Fuego',     desc:'🔥 +15% daño al Jefe Semanal', effect:'boss_dmg',   val:0.15, color:'#f97316' },
};

const RUNE_SOCKET_COUNT = { comun:0, raro:1, epico:2, legendario:3, mitico:3 };

const RUNE_DROP_CHANCE = {
  comun:0.03, normal:0.05, epico:0.10, legendario:0.15, mitico:0.25
};

let runes = [];

async function loadRunes() {
  const { data } = await db.from('dungeon_runes').select('*').eq('hero_id', hero.id);
  runes = data || [];
}

async function tryRuneDrop(questRarity) {
  const chance = RUNE_DROP_CHANCE[questRarity] || 0.03;
  if (Math.random() > chance) return;
  const keys   = Object.keys(RUNE_DEFS);
  const key    = keys[Math.floor(Math.random() * keys.length)];
  const def    = RUNE_DEFS[key];
  const { data } = await db.from('dungeon_runes').insert({
    hero_id:   hero.id,
    rune_type: key,
    rune_name: def.name,
    level:     1,
  }).select().single();
  if (data) {
    runes.push(data);
    setTimeout(() => toast(def.icon, `¡Runa obtenida: ${def.name}!`), 1200);
  }
}

async function socketRune(runeId, weaponId) {
  const rune   = runes.find(r => r.id === runeId);
  const weapon = (typeof weapons !== 'undefined' ? weapons : []).find(w => w.id === weaponId);
  if (!rune || !weapon) return;

  const maxSlots = RUNE_SOCKET_COUNT[weapon.tier] || 0;
  if (!maxSlots) { toast('⚠️', 'Esta arma no tiene ranuras para runas.'); return; }

  const slots = weapon.rune_slots ? JSON.parse(weapon.rune_slots) : [];
  if (slots.length >= maxSlots) { toast('⚠️', 'Ranuras de runa llenas.'); return; }

  slots.push(runeId);
  await db.from('dungeon_weapons').update({ rune_slots: JSON.stringify(slots) }).eq('id', weaponId);
  await db.from('dungeon_runes').update({ weapon_id: weaponId }).eq('id', runeId);
  weapon.rune_slots = JSON.stringify(slots);
  rune.weapon_id    = weaponId;

  const def = RUNE_DEFS[rune.rune_type] || {};
  toast(def.icon || '💎', `${def.name} engastada en ${weapon.name}.`);
  renderRunePanel();
}

async function unsocketRune(runeId) {
  await db.from('dungeon_runes').update({ weapon_id: null }).eq('id', runeId);
  const rune = runes.find(r => r.id === runeId);
  if (!rune) return;
  const weapon = (typeof weapons !== 'undefined' ? weapons : []).find(w => w.id === rune.weapon_id);
  if (weapon && weapon.rune_slots) {
    const slots = JSON.parse(weapon.rune_slots).filter(id => id !== runeId);
    await db.from('dungeon_weapons').update({ rune_slots: JSON.stringify(slots) }).eq('id', weapon.id);
    weapon.rune_slots = JSON.stringify(slots);
  }
  rune.weapon_id = null;
  toast('💎', 'Runa extraída.');
  renderRunePanel();
}

/* Calcula bonus total de runas para hero */
function getRuneBonus(effect) {
  return runes
    .filter(r => r.weapon_id)
    .reduce((sum, r) => {
      const def = RUNE_DEFS[r.rune_type];
      return def && def.effect === effect ? sum + def.val : sum;
    }, 0);
}

function renderRunePanel() {
  const el = document.getElementById('runePanelContent');
  if (!el || !hero) return;

  const equipped = (typeof weapons !== 'undefined' ? weapons : []).filter(w => w.is_equipped);
  const unslotted = runes.filter(r => !r.weapon_id);

  el.innerHTML = `
    <div class="rune-section-title">⚔️ Armas equipadas</div>
    ${equipped.length
      ? equipped.map(w => {
          const maxSlots = RUNE_SOCKET_COUNT[w.tier] || 0;
          const slots    = w.rune_slots ? JSON.parse(w.rune_slots) : [];
          const tier     = WEAPON_TIERS[w.tier] || { color:'#9ca3af' };
          return `
            <div class="rune-weapon-row">
              <div class="rune-weapon-name" style="color:${tier.color}">${escHtml(w.name)}</div>
              <div class="rune-slots-row">
                ${Array.from({length:maxSlots},(_,i)=>{
                  const rid  = slots[i];
                  const rune = rid ? runes.find(r=>r.id===rid) : null;
                  const def  = rune ? RUNE_DEFS[rune.rune_type] : null;
                  return `<div class="rune-slot ${rune?'rune-slot-filled':''}" style="${def?`--rc:${def.color}`:''}"
                              ${rune?`onclick="unsocketRune('${rid}')" title="Click para extraer: ${def?.name||''}"`:''}>
                    ${def ? def.icon : '+'}
                  </div>`;
                }).join('')}
                ${maxSlots===0?'<span style="color:var(--text3);font-size:11px">Sin ranuras (tier Común)</span>':''}
              </div>
            </div>`;
        }).join('')
      : `<div class="rune-empty">No tienes armas equipadas.</div>`}

    <div class="rune-section-title" style="margin-top:16px">💎 Runas en inventario (${unslotted.length})</div>
    ${unslotted.length
      ? `<div class="rune-inv-grid">
          ${unslotted.map(r => {
            const def = RUNE_DEFS[r.rune_type] || { icon:'💎', name:r.rune_type, desc:'', color:'#9ca3af' };
            return `
              <div class="rune-inv-card" style="--rc:${def.color}" title="${def.desc}">
                <div class="rune-inv-icon">${def.icon}</div>
                <div class="rune-inv-name">${def.name}</div>
                <div class="rune-inv-desc">${def.desc}</div>
                ${equipped.length
                  ? `<select class="rune-equip-sel" onchange="if(this.value)socketRune('${r.id}',this.value);this.value=''">
                      <option value="">Engrastar en...</option>
                      ${equipped.filter(w=>RUNE_SOCKET_COUNT[w.tier]>0).map(w=>`<option value="${w.id}">${escHtml(w.name)}</option>`).join('')}
                     </select>`
                  : ''}
              </div>`;
          }).join('')}
         </div>`
      : `<div class="rune-empty">No tienes runas. Completa misiones para obtener runas como botín.</div>`}`;
}
