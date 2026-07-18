'use strict';

/* ── SISTEMA DE RUNAS ────────────────────────────────────────
   Runas caen al completar misiones (baja probabilidad).
   Se engastan en armas equipadas.
   Sockets por tier: común 0, raro 1, épico 2, legendario 3, mítico 3.
   Guardado en dungeon_weapons.rune_slots (jsonb array).
   Inventario de runas: dungeon_runes table.
   ─────────────────────────────────────────────────────────── */

const RUNE_FRAG_COST = 5; // fragmentos para armar 1 runa completa

const RUNE_DEFS = {
  fuerza:     { icon:'⚔️', img:'runa_fuerza',     fragImg:'runa_fragmento_fuerza',     name:'Runa de Fuerza',      desc:'⚔️ +8% XP en épicas',          effect:'epic_xp',    val:0.08, color:'#ef4444' },
  vigor:      { icon:'❤️', img:'runa_vida',        fragImg:'runa_fragmento_vida',       name:'Runa de Vigor',       desc:'❤️ +15 HP máximo',              effect:'hp_max',     val:15,   color:'#f43f5e' },
  celeridad:  { icon:'🏃', img:'runa_velocidad',   fragImg:'runa_fragmento_velocidad',  name:'Runa de Celeridad',   desc:'🏃 +8% Oro en misiones',        effect:'gold',       val:0.08, color:'#f59e0b' },
  sabiduria:  { icon:'📚', img:'runa_arcana',      fragImg:'runa_fragmento_arcana',     name:'Runa de Sabiduría',   desc:'📚 +6% XP en todas',            effect:'all_xp',     val:0.06, color:'#8b5cf6' },
  suerte:     { icon:'🍀', img:'runa_xp',          fragImg:'runa_fragmento_xp',         name:'Runa de Suerte',      desc:'🍀 +10% probabilidad de drop',   effect:'drop_rate',  val:0.10, color:'#22c55e' },
  oscuridad:  { icon:'🌑', img:'runa_sombra',      fragImg:'runa_fragmento_sombra',     name:'Runa de Oscuridad',   desc:'🌑 +12% XP de noche (20-05h)',  effect:'night_xp',   val:0.12, color:'#6b7280' },
  fuego:      { icon:'🔥', img:'runa_mitica',      fragImg:'runa_fragmento_mitica',     name:'Runa de Fuego',       desc:'🔥 +15% daño al Jefe Semanal',  effect:'boss_dmg',   val:0.15, color:'#f97316' },
  proteccion: { icon:'🛡️', img:'runa_proteccion', fragImg:'runa_fragmento_proteccion', name:'Runa de Protección',  desc:'🛡️ +10 HP máximo + -5% daño boss recibido', effect:'shield', val:10, color:'#3b82f6' },
};

const RUNE_SOCKET_COUNT = { comun:0, raro:1, epico:2, legendario:3, mitico:3 };

let runes = [];

async function loadRunes() {
  const { data } = await db.from('dungeon_runes').select('*').eq('hero_id', hero.id);
  runes = data || [];
}

/* Llamado solo desde rpg.js al derrotar un boss — droppea fragmento aleatorio */
async function tryRuneDrop() {
  const keys = Object.keys(RUNE_DEFS);
  const key  = keys[Math.floor(Math.random() * keys.length)];
  const def  = RUNE_DEFS[key];
  const invKey = 'rune_frag_' + key;
  if (typeof addInvItem === 'function') {
    await addInvItem(invKey, 'rune_fragment', 1);
  }
  const have = typeof getInvCount === 'function' ? getInvCount(invKey) : 0;
  toast(def.icon, `✨ ¡Fragmento de ${def.name}! (tienes ${have}/${RUNE_FRAG_COST})`);
}

async function craftRune(type) {
  const def    = RUNE_DEFS[type];
  if (!def) return;
  const invKey = 'rune_frag_' + type;
  const have   = typeof getInvCount === 'function' ? getInvCount(invKey) : 0;
  if (have < RUNE_FRAG_COST) {
    toast('❌', `Necesitas ${RUNE_FRAG_COST} fragmentos de ${def.name} (tienes ${have}).`);
    return;
  }
  const ok = typeof consumeInvItem === 'function' ? await consumeInvItem(invKey, RUNE_FRAG_COST) : false;
  if (!ok) { toast('❌', 'Error al consumir fragmentos.'); return; }
  const { data } = await db.from('dungeon_runes').insert({
    hero_id:   hero.id,
    rune_type: type,
    rune_name: def.name,
    level:     1,
  }).select().single();
  if (data) {
    runes.push(data);
    toast(def.icon, `⚒️ ¡${def.name} forjada! Ve a Runas para engastarla.`);
    if (typeof renderRunePanel === 'function') renderRunePanel();
    if (typeof renderSmithy    === 'function') renderSmithy();
    if (typeof renderInventoryView === 'function') renderInventoryView();
  }
}

async function socketRune(runeId, weaponId) {
  const rune   = runes.find(r => r.id === runeId);
  const weapon = (typeof weapons !== 'undefined' ? weapons : []).find(w => w.id === weaponId);
  if (!rune || !weapon) return;

  const maxSlots = RUNE_SOCKET_COUNT[weapon.tier] || 0;
  if (!maxSlots) { toast('⚠️', 'Esta arma no tiene ranuras para runas.'); return; }

  const slots = (() => { try { return weapon.rune_slots ? JSON.parse(weapon.rune_slots) : []; } catch(e) { return Array.isArray(weapon.rune_slots) ? weapon.rune_slots : []; } })();
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
    const cur = (() => { try { return JSON.parse(weapon.rune_slots); } catch(e) { return Array.isArray(weapon.rune_slots) ? weapon.rune_slots : []; } })();
    const slots = cur.filter(id => id !== runeId);
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
  renderRuneSanctum(el);
  return;

  const equipped = (typeof weapons !== 'undefined' ? weapons : []).filter(w => w.is_equipped);
  const unslotted = runes.filter(r => !r.weapon_id);

  el.innerHTML = `
    <div class="rp-section-hd">⚔️ Armas equipadas</div>
    ${equipped.length
      ? equipped.map(w => {
          const maxSlots = RUNE_SOCKET_COUNT[w.tier] || 0;
          const slots    = (() => { try { return w.rune_slots ? JSON.parse(w.rune_slots) : []; } catch(e) { return []; } })();
          const tier     = WEAPON_TIERS[w.tier] || { color:'#9ca3af' };
          return `
            <div class="rp-weapon-row">
              <div class="rp-weapon-name" style="color:${tier.color}">${escHtml(w.name)}
                <span class="rp-weapon-tier" style="color:${tier.color}">${tier.label || w.tier}</span>
              </div>
              <div class="rp-slots-row">
                ${Array.from({length:maxSlots},(_,i)=>{
                  const rid  = slots[i];
                  const rune = rid ? runes.find(r=>r.id===rid) : null;
                  const def  = rune ? RUNE_DEFS[rune.rune_type] : null;
                  return `<div class="rp-socket ${rune?'rp-socket-filled':''}" style="${def?`--rc:${def.color}`:''}"
                              ${rune?`onclick="unsocketRune('${rid}')" title="Extraer: ${def?.name||''}"`:''}>
                    <div class="rp-socket-gem">${def ? (def.icon || '💎') : ''}</div>
                    ${!rune ? '<div class="rp-socket-empty-icon">◇</div>' : ''}
                  </div>`;
                }).join('')}
                ${maxSlots===0?'<span class="rp-no-slots">Sin ranuras (tier Común)</span>':''}
              </div>
            </div>`;
        }).join('')
      : `<div class="rune-empty">No tienes armas equipadas.</div>`}

    <div class="rp-section-hd" style="margin-top:18px">💎 Runas disponibles (${unslotted.length})</div>
    ${unslotted.length
      ? `<div class="rp-inv-grid">
          ${unslotted.map(r => {
            const def = RUNE_DEFS[r.rune_type] || { icon:'💎', name:r.rune_type, desc:'', color:'#9ca3af' };
            return `
              <div class="rp-rune-card" style="--rc:${def.color}" title="${def.desc}">
                <div class="rp-rune-gem">
                  ${def.img ? `<img src="images/${def.img}.webp" class="rune-img" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span style="display:none">${def.icon}</span>` : `<span>${def.icon}</span>`}
                </div>
                <div class="rp-rune-name">${def.name}</div>
                <div class="rp-rune-eff">${def.desc}</div>
                ${equipped.filter(w=>RUNE_SOCKET_COUNT[w.tier]>0).length
                  ? `<select class="rp-equip-sel" onchange="if(this.value)socketRune('${r.id}',this.value);this.value=''">
                      <option value="">⊕ Engrastar en...</option>
                      ${equipped.filter(w=>RUNE_SOCKET_COUNT[w.tier]>0).map(w=>`<option value="${w.id}">${escHtml(w.name)}</option>`).join('')}
                     </select>`
                  : ''}
              </div>`;
          }).join('')}
         </div>`
      : `<div class="rune-empty">No tienes runas. Derrota jefes, consigue fragmentos y fórjalos en el Herrero.</div>`}

    <div class="rp-section-hd" style="margin-top:18px">🧩 Fragmentos — Forjar en Herrero</div>
    <div class="rp-frags-grid">
      ${Object.entries(RUNE_DEFS).map(([type, def]) => {
        const have  = typeof getInvCount === 'function' ? getInvCount('rune_frag_' + type) : 0;
        const ready = have >= RUNE_FRAG_COST;
        const pct   = Math.min(100, Math.round((have / RUNE_FRAG_COST) * 100));
        return `
          <div class="rp-frag-card ${ready ? 'rp-frag-ready' : ''}" style="--rc:${def.color}" title="${def.name}: ${def.desc}">
            <img src="images/${def.fragImg}.webp" class="rune-frag-img" alt=""
                 onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
            <span class="rune-frag-fallback" style="display:none">${def.icon}</span>
            <div class="rp-frag-bar"><div class="rp-frag-fill" style="width:${pct}%;background:${def.color}"></div></div>
            <div class="rp-frag-count ${ready ? 'rp-frag-ok' : ''}">${have}/${RUNE_FRAG_COST}</div>
            <div class="rp-frag-name">${def.name.replace('Runa de ','').replace('Runa ','')}</div>
          </div>`;
      }).join('')}
    </div>`;
}

function renderRuneSanctum(el) {
  const equipped = (typeof weapons === 'undefined' ? [] : weapons).filter(weapon => weapon.is_equipped);
  const loose = runes.filter(rune => !rune.weapon_id);
  const weaponPanel = weapon => {
    const tier = WEAPON_TIERS[weapon.tier] || { color:'#94a3b8', label:weapon.tier };
    const max = RUNE_SOCKET_COUNT[weapon.tier] || 0;
    const slots = (() => { try { return JSON.parse(weapon.rune_slots || '[]'); } catch { return []; } })();
    return `<article class="rns-weapon" style="--rns:${tier.color}"><div class="rns-weapon-head"><span>⚔️</span><div><b>${escHtml(weapon.name)}</b><small>${tier.label} · ${slots.length}/${max} engastes</small></div></div><div class="rns-sockets">${max ? Array.from({length:max}, (_, index) => { const rune = runes.find(item => item.id === slots[index]); const def = rune && RUNE_DEFS[rune.rune_type]; return rune ? `<button class="rns-socket is-filled" style="--rune:${def.color}" onclick="unsocketRune('${rune.id}')" title="Extraer ${escHtml(def.name)}">${def.icon}</button>` : `<span class="rns-socket">◇</span>`; }).join('') : '<span class="rns-no-socket">Esta pieza aún no admite runas</span>'}</div></article>`;
  };
  const runeCard = rune => { const def = RUNE_DEFS[rune.rune_type] || {}; return `<article class="rns-rune" style="--rns:${def.color || '#94a3b8'}"><div class="rns-gem">${def.icon || '💎'}</div><b>${escHtml(def.name || rune.rune_type)}</b><p>${escHtml(def.desc || '')}</p>${equipped.some(weapon => RUNE_SOCKET_COUNT[weapon.tier] > 0) ? `<select onchange="if(this.value)socketRune('${rune.id}',this.value)"><option value="">Elegir arma</option>${equipped.filter(weapon => RUNE_SOCKET_COUNT[weapon.tier] > 0).map(weapon => `<option value="${weapon.id}">${escHtml(weapon.name)}</option>`).join('')}</select>` : ''}</article>`; };
  el.innerHTML = `<section class="rns-shell"><header class="rns-header"><div><span>ALTAR DE ENGASTE</span><h3>Runas y resonancias</h3><p>Une un fragmento de poder a tu arsenal. Extraer una runa nunca la destruye.</p></div><div class="rns-count"><b>✦ ${loose.length}</b><small>runas libres</small></div></header><div class="rns-layout"><section><h4>Armas vinculadas</h4>${equipped.length ? equipped.map(weaponPanel).join('') : '<div class="rns-empty">Equipa un arma con ranuras para iniciar un ritual.</div>'}</section><section class="rns-altar"><div class="rns-circle"><span>✦</span><i></i><i></i><i></i></div><b>Elige una runa</b><p>Su color indica su afinidad.</p></section></div><section class="rns-library"><h4>Runas sin vínculo</h4><div>${loose.length ? loose.map(runeCard).join('') : '<div class="rns-empty">No tienes runas libres. Forja fragmentos en el Herrero.</div>'}</div></section></section>`;
}
