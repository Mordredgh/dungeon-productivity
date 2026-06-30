'use strict';
/* ============================================================
   SECRET_SETS — Sets de Clases Secretas (Late-Game)
   Drops de materiales, cola de forja, UI del Herrero.
   ============================================================ */

function _getForgeQueue() {
  try { return JSON.parse(hero?.forge_queue || '[]'); } catch { return []; }
}

async function _saveForgeQueue(q) {
  if (!hero) return;
  hero.forge_queue = JSON.stringify(q);
  await db.from('dungeon_heroes').update({ forge_queue: hero.forge_queue }).eq('id', hero.id);
}

/* _checkSecretMilestone — otorga recompensas al 25/50/75% de materiales */
async function _checkSecretMilestone(classKey) {
  if (!hero) return;
  const matDef = SECRET_MATERIAL_DEFS[classKey];
  if (!matDef) return;
  const count   = getInvCount(matDef.key);
  const prog    = getSecretProgress();
  const granted = prog[`${classKey}_milestones`] || [];
  let   dirty   = false;

  for (const m of SECRET_SET_MILESTONES) {
    if (count >= m.at && !granted.includes(m.at)) {
      granted.push(m.at);
      dirty = true;
      if (m.xp)   await addXP(m.xp, 'main', null);
      if (m.gold) addGold(m.gold);
      const clsName = (typeof SECRET_CLASS_DEFS !== 'undefined' ? SECRET_CLASS_DEFS : []).find(d => d.key === classKey)?.name || classKey;
      toast('🎁', `¡Hito ${m.label} del set de ${clsName}! +${m.xp} XP${m.gold ? ' +' + m.gold + '🪙' : ''}`);
    }
  }
  if (dirty) {
    prog[`${classKey}_milestones`] = granted;
    await saveSecretProgress(prog);
  }
}

/* trySecretMatDrop — llamado al completar cualquier misión (excepto hábitos) */
async function trySecretMatDrop(q) {
  if (!hero) return;
  if ((hero.level || 1) < 40) return;
  const classes = (() => { try { return JSON.parse(hero.secret_classes || '[]'); } catch { return []; } })();
  if (!classes.length) return;

  const now      = new Date();
  const hour     = now.getHours();
  const today    = now.toISOString().split('T')[0];
  const priority = (q.priority || 'normal').toLowerCase();
  const tags     = ((q.tags || '') + ' ' + (q.category || '')).toLowerCase();
  const highPrio = ['epico', 'legendario', 'mitico'].includes(priority);

  const drops = [];
  const prog  = getSecretProgress();
  let   progChanged = false;

  // Crononauta: 8% en misiones completadas entre 00:00–04:00
  if (classes.includes('crononauta') && hour >= 0 && hour < 4) {
    if (Math.random() < 0.08) drops.push('crononauta');
  }

  // Paladín: 12% en misiones de salud Épico o superior
  if (classes.includes('paladin') && highPrio && tags.includes('salud')) {
    if (Math.random() < 0.12) drops.push('paladin');
  }

  // Nigromante: 2% en misiones Legendario/Mítico (ruta alternativa — sin morir)
  if (classes.includes('nigromante') && ['legendario', 'mitico'].includes(priority)) {
    if (Math.random() < 0.02) drops.push('nigromante');
  }

  // Druida: 20% en la primera misión post-medianoche de cada día (1 intento/día)
  if (classes.includes('druida') && hour >= 0 && hour < 6 && prog.druida_attempt_date !== today) {
    prog.druida_attempt_date = today;
    progChanged = true;
    if (Math.random() < 0.20) drops.push('druida');
  }

  // Estrella Caída: 3% en cualquier misión cuando ya tienes las 5 demás clases
  const allFive = ['crononauta', 'paladin', 'nigromante', 'titan', 'druida'].every(k => classes.includes(k));
  if (classes.includes('estrella-caida') && allFive) {
    if (Math.random() < 0.03) drops.push('estrella-caida');
  }

  if (progChanged) await saveSecretProgress(prog);

  for (const classKey of drops) {
    const def = SECRET_MATERIAL_DEFS[classKey];
    if (!def) continue;
    await addInvItem(def.key, 'secret_material', 1);
    toast(def.icon, `¡Material secreto! ${def.name}`);
    await _checkSecretMilestone(classKey);
  }
}

/* craftSecretPiece — forja una pieza del set de clase secreta */
async function craftSecretPiece(classKey, pieceKey) {
  if (!hero) return;
  if ((hero.level || 1) < 40) { toast('🔒', 'Nivel 40 requerido para el Herrero de Clases Secretas.'); return; }

  const classes = (() => { try { return JSON.parse(hero.secret_classes || '[]'); } catch { return []; } })();
  if (!classes.includes(classKey)) { toast('🔒', 'Clase secreta no desbloqueada.'); return; }

  const piece  = SECRET_SET_PIECES.find(p => p.key === pieceKey);
  const matDef = SECRET_MATERIAL_DEFS[classKey];
  const clsDef = (typeof SECRET_CLASS_DEFS !== 'undefined' ? SECRET_CLASS_DEFS : []).find(d => d.key === classKey);
  if (!piece || !matDef) return;

  const iKey = `secret_${classKey}_${pieceKey}`;
  if (getInvCount(iKey) > 0) { toast('✅', 'Ya tienes esta pieza forjada.'); return; }

  const queue = _getForgeQueue();
  const maxQueue = typeof getForgeQueueMax === 'function' ? getForgeQueueMax() : 3;
  if (queue.length >= maxQueue) { toast('⚒️', `Cola llena — máximo ${maxQueue} piezas en espera.`); return; }
  if (queue.find(q => q.classKey === classKey && q.pieceKey === pieceKey)) {
    toast('⏳', 'Esta pieza ya está en la cola de forja.'); return;
  }

  const have = getInvCount(matDef.key);
  if (have < piece.matCost) {
    toast(matDef.icon, `Necesitas ${piece.matCost} ${matDef.name}. Tienes ${have}.`);
    return;
  }
  if (!spendGold(piece.goldCost)) return;

  const ok = await consumeInvItem(matDef.key, piece.matCost);
  if (!ok) { addGold(piece.goldCost); return; }

  const masteryForgeMult = 1 - (typeof getMasteryBonus === 'function' ? getMasteryBonus('persistencia') : 0);
  const readyAt = new Date(Date.now() + piece.forgeHours * 3600000 * masteryForgeMult).toISOString();
  queue.push({ classKey, pieceKey, readyAt });
  await _saveForgeQueue(queue);

  const dur = piece.forgeHours >= 24 ? `${piece.forgeHours / 24}d` : `${piece.forgeHours}h`;
  toast('⚒️', `${piece.name} de ${clsDef?.name || classKey} en forja — lista en ${dur}.`);
  if (typeof renderSmithy === 'function') renderSmithy();
}

/* checkSecretForgeQueue — llamado al boot para recoger piezas ya listas */
async function checkSecretForgeQueue() {
  if (!hero) return;
  const queue = _getForgeQueue();
  if (!queue.length) return;

  const now       = new Date();
  const ready     = queue.filter(q => new Date(q.readyAt) <= now);
  if (!ready.length) return;

  const remaining = queue.filter(q => new Date(q.readyAt) > now);
  await _saveForgeQueue(remaining);

  for (const item of ready) {
    const iKey   = `secret_${item.classKey}_${item.pieceKey}`;
    await addInvItem(iKey, 'secret_armor', 1);
    const piece  = SECRET_SET_PIECES.find(p => p.key === item.pieceKey);
    const clsDef = (typeof SECRET_CLASS_DEFS !== 'undefined' ? SECRET_CLASS_DEFS : []).find(d => d.key === item.classKey);
    toast('⚒️', `¡${piece?.name || item.pieceKey} del set de ${clsDef?.name || item.classKey} lista!`);
    await _checkSecretSetComplete(item.classKey);
  }
}

async function _checkSecretSetComplete(classKey) {
  const allPieces = SECRET_SET_PIECES.every(p => getInvCount(`secret_${classKey}_${p.key}`) > 0);
  if (!allPieces) return;
  const clsDef = (typeof SECRET_CLASS_DEFS !== 'undefined' ? SECRET_CLASS_DEFS : []).find(d => d.key === classKey);
  toast('⭐', `¡Set completo de ${clsDef?.name || classKey}! El bono de set está activo.`);

  // Bono de set Titán: +20% HP máx permanente (se aplica una sola vez)
  if (classKey === 'titan') {
    const prog = getSecretProgress();
    if (!prog.titan_hp_bonus_applied) {
      const newHpMax = Math.round((hero.hp_max || 100) * 1.20);
      await saveHero({ hp_max: newHpMax });
      prog.titan_hp_bonus_applied = true;
      await saveSecretProgress(prog);
      toast('⛰️', `¡Set del Titán! HP máx permanente: ${newHpMax}.`);
    }
  }
}

function isSecretSetComplete(classKey) {
  return SECRET_SET_PIECES.every(p => getInvCount(`secret_${classKey}_${p.key}`) > 0);
}

/* _renderSecretSmithy — sección del Herrero para sets de clases secretas */
function _renderSecretSmithy() {
  if (!hero) return '';
  const level   = hero.level || 1;
  const classes = (() => { try { return JSON.parse(hero.secret_classes || '[]'); } catch { return []; } })();
  if (!classes.length) return '';

  const header = `<div class="smithy-section-title" style="margin-top:18px">🔮 Sets de Clases Secretas</div>`;

  if (level < 40) {
    return header + `<div style="text-align:center;padding:16px 8px;color:var(--text3);font-size:13px">
      🔒 Disponibles en nivel 40. Nivel actual: ${level}
    </div>`;
  }

  const queue = _getForgeQueue();
  const prog  = getSecretProgress();
  const TOTAL = 81;

  const classHtml = classes.map(classKey => {
    const def    = (typeof SECRET_CLASS_DEFS !== 'undefined' ? SECRET_CLASS_DEFS : []).find(d => d.key === classKey);
    const matDef = SECRET_MATERIAL_DEFS[classKey];
    if (!def || !matDef) return '';

    const matCount    = getInvCount(matDef.key);
    const pct         = Math.min(100, Math.round(matCount / TOTAL * 100));
    const setComplete = isSecretSetComplete(classKey);
    const granted     = prog[`${classKey}_milestones`] || [];
    const nextM       = SECRET_SET_MILESTONES.find(m => !granted.includes(m.at) && matCount < m.at);

    const piecesHtml = SECRET_SET_PIECES.map(piece => {
      const iKey    = `secret_${classKey}_${piece.key}`;
      const owned   = getInvCount(iKey) > 0;
      const forging = queue.find(q => q.classKey === classKey && q.pieceKey === piece.key);
      const gold    = typeof getGold === 'function' ? getGold() : 0;
      const canForge= !owned && !forging && matCount >= piece.matCost && gold >= piece.goldCost;

      let statusHtml, btnHtml;
      if (owned) {
        statusHtml = `<span style="color:var(--green)">✅ Forjada</span>`;
        btnHtml    = `<button class="smithy-btn" disabled style="opacity:.4">✅</button>`;
      } else if (forging) {
        const ms = Math.max(0, new Date(forging.readyAt) - new Date());
        const h  = Math.floor(ms / 3600000);
        const m  = Math.floor((ms % 3600000) / 60000);
        statusHtml = `<span style="color:var(--gold)">⏳ ${h > 0 ? h + 'h ' : ''}${m}m restantes</span>`;
        btnHtml    = `<button class="smithy-btn smithy-btn-locked" disabled>⏳</button>`;
      } else {
        const clr  = (matCount < piece.matCost || gold < piece.goldCost) ? 'var(--text3)' : 'var(--text2)';
        statusHtml = `<span style="color:${clr}">${matDef.icon} ${matCount}/${piece.matCost} · 🪙 ${piece.goldCost.toLocaleString()}</span>`;
        btnHtml    = `<button class="smithy-btn ${canForge ? '' : 'smithy-btn-locked'}"
          onclick="craftSecretPiece('${classKey}','${piece.key}')" ${canForge ? '' : 'disabled'}>
          ${canForge ? '⚒️ Forjar' : '🔒'}</button>`;
      }

      const dur = piece.forgeHours >= 24 ? `${piece.forgeHours / 24}d` : `${piece.forgeHours}h`;
      return `
        <div class="smithy-recipe ${owned ? 'smithy-ready' : canForge ? 'smithy-ready' : 'smithy-locked'}">
          <div class="smithy-emoji" style="display:flex">${def.icon}</div>
          <div class="smithy-info">
            <div class="smithy-name">${piece.name} de ${def.name}</div>
            <div class="smithy-req">${statusHtml}</div>
            <div class="smithy-stats" style="font-size:10px;color:var(--text3)">${dur} de forja</div>
          </div>
          ${btnHtml}
        </div>`;
    }).join('');

    return `
      <div style="margin-bottom:22px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">
          <span style="font-size:13px;font-weight:600;color:var(--text)">${def.icon} ${def.name}</span>
          ${setComplete ? '<span style="font-size:11px;color:var(--gold)">⭐ SET COMPLETO</span>' : ''}
        </div>
        <div style="margin-bottom:3px;font-size:11px;color:var(--text3)">
          ${matDef.icon} ${matDef.name}: <strong style="color:var(--text2)">${matCount}</strong> / ${TOTAL}
          ${nextM ? `· Hito ${nextM.label} en ${nextM.at - matCount} más` : ''}
        </div>
        <div style="height:4px;background:var(--bg3);border-radius:2px;margin-bottom:10px;overflow:hidden">
          <div style="height:4px;width:${pct}%;background:${matDef.color};border-radius:2px;transition:width .4s ease"></div>
        </div>
        ${setComplete ? `<div style="font-size:11px;color:var(--text2);margin-bottom:10px;padding:6px 8px;background:${matDef.color}18;border-radius:6px;border-left:2px solid ${matDef.color}40">✨ ${SECRET_SET_BONUSES[classKey] || ''}</div>` : ''}
        <div class="smithy-recipes">${piecesHtml}</div>
      </div>`;
  }).join('');

  return `${header}
    <p style="font-size:12px;color:var(--text3);margin:-6px 0 14px">Equipo del endgame — completa cada set para activar su bono permanente.</p>
    ${classHtml}`;
}
