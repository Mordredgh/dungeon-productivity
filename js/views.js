const RARITY_LABELS = { mitico:'Mítico', legendario:'Legendario', epico:'Épico', normal:'Normal', comun:'Común' };

/* RENDER */
function renderAll() {
  renderHeroUI();
  renderQuestList();
  renderSpells();
  renderAchievements();
  renderHistory();
  renderStats();
  updateBossBanner();
  if (typeof renderActivePet === 'function') renderActivePet();
}

function renderHeroUI() {
  if (!hero) return;

  const avatarBtn = document.getElementById('heroAvatarBtn');
  const lvlBadge  = document.getElementById('avatarLevelBadge');
  const lvl = hero._level || 1;

  // Avatar image (CDN) with emoji fallback
  const cls  = hero.hero_class || 'guerrero';
  const race = (typeof heroRace !== 'undefined' ? heroRace : null) || hero.race || 'humano';
  const avatarImgUrl = `${CDN}dungeon/avatar_${cls}_${race}.png`;
  let avatarVisual = avatarBtn.querySelector('.hero-avatar-img, .hero-avatar-emoji');
  const needRebuild = !avatarVisual || avatarVisual.dataset.cls !== cls || avatarVisual.dataset.race !== race;
  if (needRebuild) {
    const img = Object.assign(document.createElement('img'), {
      className: 'hero-avatar-img', src: avatarImgUrl, alt: hero.avatar || '🧙'
    });
    img.dataset.cls = cls; img.dataset.race = race;
    img.onerror = function() {
      const sp = Object.assign(document.createElement('span'), {
        className: 'hero-avatar-emoji', textContent: hero.avatar || '🧙'
      });
      sp.dataset.cls = cls; sp.dataset.race = race;
      this.replaceWith(sp);
    };
    const old = avatarBtn.querySelector('.hero-avatar-img, .hero-avatar-emoji') || avatarBtn.firstChild;
    if (old) avatarBtn.replaceChild(img, old); else avatarBtn.insertBefore(img, avatarBtn.firstChild);
  } else if (avatarVisual.classList.contains('hero-avatar-emoji')) {
    avatarVisual.textContent = hero.avatar || '🧙';
  }
  if (lvlBadge) lvlBadge.textContent = lvl;

  // Avatar ring by class
  avatarBtn.className = 'hero-avatar-btn avatar-class-' + (hero.hero_class || 'guerrero');

  document.getElementById('heroName').textContent = hero.name || 'Héroe';
  const title = TITLES[Math.min(lvl - 1, TITLES.length - 1)];
  document.getElementById('heroTitle').textContent = `Nv.${lvl} · ${title}`;
  document.getElementById('statLevel').textContent = lvl;
  document.getElementById('statStreak').textContent = hero.streak || 0;
  document.getElementById('statTotalXP').textContent = (hero.xp_total || 0).toLocaleString();

  const bestStreak = hero.longest_streak || 0;
  const stBest = document.getElementById('statBestStreak');
  if (stBest) stBest.textContent = bestStreak;

  const xpPrev   = xpForLevel(lvl - 1);
  const xpNext   = xpForLevel(lvl);
  const xpCur    = (hero.xp_total || 0) - xpPrev;
  const xpNeeded = xpNext - xpPrev;
  const pct      = Math.min(100, Math.round((xpCur / xpNeeded) * 100));
  document.getElementById('xpLabel').textContent = `XP ${xpCur.toLocaleString()} / ${xpNeeded.toLocaleString()} (${pct}%)`;
  const fill = document.getElementById('xpBarFill');
  fill.style.width = pct + '%';
  let pctEl = fill.querySelector('.xp-bar-pct');
  if (!pctEl) { pctEl = document.createElement('div'); pctEl.className = 'xp-bar-pct'; fill.appendChild(pctEl); }
  pctEl.textContent = pct + '%';

  const hp    = hero.hp || 100;
  const hpMax = hero.hp_max || 100;
  const hpPct = Math.round((hp / hpMax) * 100);
  document.getElementById('hpLabel').textContent = `${hp} / ${hpMax}`;
  const hpFill = document.getElementById('hpBarFill');
  hpFill.style.width = hpPct + '%';
  hpFill.classList.toggle('hp-critical', hpPct < 25);
  hpFill.classList.toggle('hp-warning',  hpPct >= 25 && hpPct < 50);

  // Actualizar mobile hero button en header
  const mhbAvatar    = document.getElementById('mhbAvatar');
  const mhbNavAvatar = document.getElementById('mhbNavAvatar');
  const mhbName      = document.getElementById('mhbName');
  const mhbHpFill    = document.getElementById('mhbHpFill');
  const mhbLevel     = document.getElementById('mhbLevel');
  if (mhbAvatar)    mhbAvatar.textContent    = hero.avatar || '🧙';
  if (mhbNavAvatar) mhbNavAvatar.textContent = hero.avatar || '🧙';
  if (mhbName)      mhbName.textContent      = hero.name   || 'Héroe';
  if (mhbHpFill)    mhbHpFill.style.width    = hpPct + '%';
  if (mhbLevel)     mhbLevel.textContent     = 'Nv ' + (hero.level || 1);
  // Modo Furia — HP < 20%
  document.body.classList.toggle('fury-mode', hpPct < 20);

  // HP danger text
  let hpDanger = document.getElementById('hpDangerText');
  if (hpPct < 25) {
    if (!hpDanger) {
      hpDanger = document.createElement('span');
      hpDanger.id = 'hpDangerText';
      hpDanger.className = 'hp-danger-text';
      hpDanger.textContent = ' ⚠️';
      document.getElementById('hpLabel').appendChild(hpDanger);
    }
  } else if (hpDanger) hpDanger.remove();

  // Guild name
  const gnd = document.getElementById('guildNameDisplay');
  if (gnd) gnd.textContent = guildName || '';

  const stLvl = document.getElementById('st-level');
  if (stLvl) stLvl.textContent = lvl;
  const stXP = document.getElementById('st-total-xp');
  if (stXP) stXP.textContent = (hero.xp_total || 0).toLocaleString();
}

function renderQuestList() {
  const el = document.getElementById('questList');
  if (!el) return;

  const search = (document.getElementById('searchBox').value || '').toLowerCase();
  const today  = new Date().toISOString().split('T')[0];
  const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  // Misiones bloqueadas por dependencia
  const doneNames = new Set(quests.filter(q => q.done).map(q => q.name));
  const blockedIds = new Set(
    quests.filter(q => !q.done && q.depends_on && !doneNames.has(q.depends_on)).map(q => q.id)
  );

  let filtered = quests.filter(q => {
    if (!q) return false;
    if (q.type === 'habit') return false; // hábitos van en sección separada
    if (activeFilter === 'today') {
      if (q.done) return false;
      if (!(q.deadline === today || q.type === 'daily')) return false;
    } else if (activeFilter === 'mitico') { if (q.priority !== 'mitico') return false; }
    else if (activeFilter !== 'all' && q.type !== activeFilter) return false;
    if (search && !q.name.toLowerCase().includes(search)) return false;
    if (tagFilter) {
      const tags = (q.tags || '').toLowerCase();
      if (!tags.includes(tagFilter.toLowerCase())) return false;
    }
    if (dateFilter === 'today'   && !(q.deadline === today)) return false;
    if (dateFilter === 'week'    && !(q.deadline && q.deadline <= weekEnd && q.deadline >= today)) return false;
    if (dateFilter === 'overdue' && !(q.deadline && q.deadline < today && !q.done)) return false;
    if (dateFilter === 'nodate'  && q.deadline) return false;
    return true;
  });

  // Update filter tab counts
  const counts = { all: quests.filter(q=>!q.done).length, today: 0, main: 0, side: 0, daily: 0, weekly: 0, mitico: 0 };
  quests.filter(q=>!q.done).forEach(q => {
    if (counts[q.type] !== undefined) counts[q.type]++;
    if (q.priority === 'mitico') counts.mitico++;
    if (q.deadline === today || q.type === 'daily') counts.today++;
  });
  const tabLabels = { all:'Todas', today:'📅 Hoy', main:'⚔️ Épicas', side:'🗡️ Encargos', daily:'🌅 Búsquedas', weekly:'📜 Crónicas', mitico:'💎 Mítico' };
  Object.entries(counts).forEach(([key, n]) => {
    const tb = document.getElementById('ft-' + key);
    if (tb) tb.textContent = `${tabLabels[key]} (${n})`;
  });

  filtered.sort((a, b) => {
    if (sortMode === 'priority') {
      const p = { mitico: 0, legendario: 1, epico: 2, normal: 3, comun: 4 };
      return (p[a.priority] ?? 3) - (p[b.priority] ?? 3);
    }
    if (sortMode === 'deadline') {
      if (!a.deadline) return 1; if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    }
    if (sortMode === 'xp') return (XP_TABLE[b.type] || 0) - (XP_TABLE[a.type] || 0);
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const allPending = filtered.filter(q => !q.done);
  const pinned  = allPending.filter(q => q.is_pinned);
  const pending = allPending.filter(q => !q.is_pinned);
  const done    = filtered.filter(q => q.done);

  if (!allPending.length && !done.length) {
    el.innerHTML = `<div class="empty-state">
      <svg width="80" height="80" viewBox="0 0 80 80" style="margin-bottom:14px;opacity:.4">
        <rect x="10" y="30" width="60" height="40" rx="6" fill="none" stroke="currentColor" stroke-width="2"/>
        <rect x="25" y="20" width="30" height="12" rx="3" fill="none" stroke="currentColor" stroke-width="2"/>
        <line x1="30" y1="46" x2="50" y2="46" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <line x1="30" y1="55" x2="45" y2="55" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <circle cx="60" cy="15" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
        <line x1="60" y1="11" x2="60" y2="19" stroke="currentColor" stroke-width="2"/>
        <line x1="56" y1="15" x2="64" y2="15" stroke="currentColor" stroke-width="2"/>
      </svg>
      <h3>Sin misiones</h3>
      <p>Añade tu primera misión en el panel derecho</p>
    </div>`;
    updateDailyProgress();
    return;
  }

  // Group pending by type with separators
  const typeOrder = ['mitico', 'main', 'weekly', 'side', 'daily'];
  const typeLabelsGroup = { mitico:'💎 Míticas', main:'⚔️ Misiones Épicas', weekly:'📜 Crónicas Semanales', side:'🗡️ Encargos', daily:'🌅 Búsquedas Diarias' };
  let html = '';

  if (pinned.length) {
    html += `<div class="type-separator">📌 Ancladas<span>${pinned.length}</span></div>`;
    html += pinned.map(q => renderQuestItem(q, blockedIds.has(q.id))).join('');
  }

  if (activeFilter === 'all') {
    typeOrder.forEach(type => {
      let group;
      if (type === 'mitico') group = pending.filter(q => q.priority === 'mitico');
      else group = pending.filter(q => q.type === type && q.priority !== 'mitico');
      if (!group.length) return;
      html += `<div class="type-separator">${typeLabelsGroup[type]}<span>${group.length}</span></div>`;
      html += group.map(q => renderQuestItem(q, blockedIds.has(q.id))).join('');
    });
    // Hábitos al final
    const habits = quests.filter(q => q.type === 'habit');
    if (habits.length && typeof renderHabitItem === 'function') {
      html += `<div class="type-separator">⚡ Hábitos<span>${habits.filter(h=>!h.done).length}</span></div>`;
      html += habits.map(q => renderHabitItem(q)).join('');
    }
  } else {
    html = pending.map(q => renderQuestItem(q, blockedIds.has(q.id))).join('');
  }

  el.innerHTML = html;
  initSwipeToComplete();
  updateDailyProgress();
}

function formatRelativeDate(dateStr) {
  if (!dateStr) return '';
  const today = new Date(); today.setHours(0,0,0,0);
  const d     = new Date(dateStr + 'T00:00:00');
  const diff  = Math.round((d - today) / 86400000);
  if (diff === 0)  return '📅 Vence hoy';
  if (diff === 1)  return '📅 Vence mañana';
  if (diff === -1) return '⚠️ Venció ayer';
  if (diff > 1 && diff < 8) return `📅 En ${diff} días`;
  if (diff < 0)   return `⚠️ Hace ${Math.abs(diff)} días`;
  return `📅 ${dateStr}`;
}

function renderQuestItem(q, blocked = false) {
  const xp   = calcQuestXP(q);
  const diff = getQuestDifficulty(q.id);
  const today    = new Date().toISOString().split('T')[0];
  const isOverdue = q.deadline && !q.done && q.deadline < today;
  const typeLabels = { main: '⚔️ Épica', side: '🗡️ Encargo', daily: '🌅 Búsqueda', weekly: '📜 Crónica' };
  const diffEmoji = { easy: '🟢', normal: '', hard: '🔴' };
  const diffLabel = { easy: ' Fácil', normal: '', hard: ' Difícil' };

  // Parse subtasks from notes: lines starting with "- [ ]" or "- [x]"
  let notesHtml = '';
  let subtasksHtml = '';
  let subtaskProgressHtml = '';
  if (q.notes) {
    const lines = q.notes.split('\n');
    const subtaskLines = lines.filter(l => /^- \[[ x]\]/.test(l));
    const otherLines   = lines.filter(l => !/^- \[[ x]\]/.test(l));
    if (subtaskLines.length) {
      const doneCount  = subtaskLines.filter(l => l.startsWith('- [x]')).length;
      const totalCount = subtaskLines.length;
      const subPct = Math.round((doneCount / totalCount) * 100);
      subtaskProgressHtml = `<span class="subtask-progress">
        ${doneCount}/${totalCount} ✓
        <div class="subtask-mini-bar"><div class="subtask-mini-fill" style="width:${subPct}%"></div></div>
      </span>`;
      subtasksHtml = `<div class="subtask-list">` + subtaskLines.map((l, i) => {
        const done = l.startsWith('- [x]');
        const text = l.replace(/^- \[[ x]\] /, '');
        return `<div class="subtask-row ${done ? 'subtask-done' : ''}" onclick="toggleSubtask('${q.id}', ${i}, ${done})">
          <div class="subtask-check">${done ? '✓' : ''}</div>
          <span class="subtask-text">${escHtml(text)}</span>
        </div>`;
      }).join('') + `</div>`;
    }
    const rawNotes = otherLines.join('\n').trim();
    if (rawNotes) {
      const MAX = 90;
      const truncated = rawNotes.length > MAX;
      const display = truncated ? rawNotes.slice(0, MAX) + '...' : rawNotes;
      notesHtml = `<div class="quest-notes" id="notes-${q.id}">${escHtml(display)}${truncated ? `<button class="expand-notes-btn" onclick="expandNotes(event,'${q.id}',${JSON.stringify(rawNotes).replace(/'/g,'\\'+'\'')})"> ver más</button>` : ''}</div>`;
    }
  }

  // Tags & estimated time from quest record
  const tags    = (q.tags || '').trim();
  const estTime = q.est_time || '';
  const repeat  = q.repeat_days || 0;
  const startDate = q.quest_start_date || '';
  const depName = q.depends_on || '';
  const todayStr = new Date().toISOString().split('T')[0];
  const isScheduled = startDate && startDate > todayStr;
  const isLocked    = depName && !quests.find(x => x.name === depName && x.done);

  const tagsHtml = tags ? tags.split(' ').filter(t=>t.startsWith('#')).map(t =>
    `<span class="tag-badge" onclick="setTagFilter('${escHtml(t)}')">${escHtml(t)}</span>`).join('') : '';
  const estHtml       = estTime   ? `<span class="esttime-badge">⏱ ${estTime}m</span>` : '';
  const repeatHtml    = repeat    ? `<span class="repeat-badge">🔄 c/${repeat}d</span>` : '';
  const scheduledHtml = isScheduled ? `<span class="scheduled-badge">📅 desde ${startDate}</span>` : '';
  const lockHtml      = isLocked  ? `<span class="locked-badge">🔒 Req: ${escHtml(depName)}</span>` : '';
  const wagerHtml      = q.wager && !q.wager.resolved ? `<span class="wager-badge">🪙 ${q.wager.gold} en juego</span>` : '';
  const isDoubleNada    = hero && hero.doublenada_quest_id === q.id;
  const doubleNadaHtml  = isDoubleNada ? `<span class="wager-badge">🎲 Doble o Nada activo</span>` : '';

  const isPinned = !!q.is_pinned;
  const isBlocked = blocked || isLocked;
  return `<div class="quest-item ${q.done ? 'done' : ''} ${isBlocked ? 'quest-blocked' : ''} ${isOverdue ? 'quest-overdue' : ''} ${isPinned ? 'pinned' : ''}" data-type="${q.type}" data-priority="${q.priority || 'normal'}" data-qid="${q.id}"
    draggable="true"
    ondragstart="draggedQuestId='${q.id}';event.dataTransfer.effectAllowed='move';this.classList.add('dragging')"
    ondragend="this.classList.remove('dragging')"
    ondragover="event.preventDefault();this.classList.add('drag-over')"
    ondragleave="this.classList.remove('drag-over')"
    ondrop="event.preventDefault();this.classList.remove('drag-over');reorderQuest('${q.id}')">
    ${bulkMode ? `<input type="checkbox" class="bulk-check" ${bulkSelected.has(q.id)?'checked':''} onclick="event.stopPropagation();toggleBulkSelect('${q.id}')">` : '<span class="drag-handle">⠿</span>'}
    <div class="quest-check" onclick="completeQuest('${q.id}', this)">${q.done ? '✓' : ''}</div>
    <div class="quest-body">
      <div class="quest-name">${escHtml(q.name)}${diff !== 'normal' ? ` <span style="font-size:10px">${diffEmoji[diff]}${diffLabel[diff]}</span>` : ''}</div>
      <div class="quest-meta">
        <span class="badge badge-type-${q.type}">${typeLabels[q.type] || q.type}</span>
        ${q.priority ? `<span class="badge badge-rarity-${q.priority}">${RARITY_LABELS[q.priority] || q.priority}</span>` : ''}
        ${q.deadline ? `<span class="deadline-badge ${isOverdue ? 'overdue' : ''}">${formatRelativeDate(q.deadline)}</span>` : ''}
        <span class="xp-reward">+${xp} XP</span>
        ${subtaskProgressHtml}
        ${estHtml}
        ${repeatHtml}
        ${scheduledHtml}
        ${lockHtml}
        ${wagerHtml}
        ${doubleNadaHtml}
        ${tagsHtml}
        ${!q.done ? `<select style="font-size:10px;padding:1px 4px;height:18px" onchange="setQuestDifficulty('${q.id}',this.value)" onclick="event.stopPropagation()">
          <option value="easy" ${diff==='easy'?'selected':''}>Fácil</option>
          <option value="normal" ${diff==='normal'?'selected':''}>Normal</option>
          <option value="hard" ${diff==='hard'?'selected':''}>Difícil</option>
        </select>` : ''}
      </div>
      ${notesHtml}
      ${subtasksHtml}
    </div>
    <div class="quest-actions">
      ${!q.done ? `<button class="quest-action-btn" onclick="setActiveQuest('${q.id}')" title="Vincular a pomodoro">🍅</button>` : ''}
      ${!q.done ? `<button class="quest-action-btn" onclick="event.stopPropagation();togglePin('${q.id}')" title="${isPinned ? 'Desanclar' : 'Anclar'}">📌</button>` : ''}
      ${!q.done ? `<button class="quest-action-btn" onclick="event.stopPropagation();oracleQuestAdvice('${q.id}')" title="Pedir consejo al Oráculo">🔮</button>` : ''}
      ${!q.done && !q.wager ? `<button class="quest-action-btn" onclick="event.stopPropagation();openWagerModal('${q.id}')" title="Apostar oro a esta misión">🪙</button>` : ''}
      ${!q.done && q.est_time && !isDoubleNada && (!hero || hero.doublenada_date !== new Date().toISOString().split('T')[0]) ? `<button class="quest-action-btn" onclick="event.stopPropagation();activateDoubleOrNothing('${q.id}')" title="Doble o Nada (1/día)">🎲</button>` : ''}
      <button class="quest-action-btn" onclick="openEditQuest('${q.id}')" title="Editar">✏️</button>
    </div>
  </div>`;
}

async function toggleSubtask(questId, lineIndex, isDone) {
  const q = quests.find(x => x.id === questId);
  if (!q || !q.notes) return;
  const lines = q.notes.split('\n');
  const subtaskLines = lines.reduce((acc, l, i) => { if (/^- \[[ x]\]/.test(l)) acc.push(i); return acc; }, []);
  const targetLineIdx = subtaskLines[lineIndex];
  if (targetLineIdx === undefined) return;
  lines[targetLineIdx] = isDone
    ? lines[targetLineIdx].replace('- [x]', '- [ ]')
    : lines[targetLineIdx].replace('- [ ]', '- [x]');
  const newNotes = lines.join('\n');
  // Silent save — no toast, no modal close
  await db.from('dungeon_quests').update({ notes: newNotes }).eq('id', q.id);
  q.notes = newNotes;
  renderQuestList();
  // Auto-complete when last subtask is checked
  if (!isDone && !q.done) {
    const remaining = newNotes.split('\n').filter(l => l.startsWith('- [ ]')).length;
    if (remaining === 0) setTimeout(() => completeQuest(questId, null), 350);
  }
}

let questOrder = [];
function reorderQuest(targetId) {
  if (!draggedQuestId || draggedQuestId === targetId) return;
  const fromIdx = quests.findIndex(q => q.id === draggedQuestId);
  const toIdx = quests.findIndex(q => q.id === targetId);
  if (fromIdx === -1 || toIdx === -1) return;
  const [moved] = quests.splice(fromIdx, 1);
  quests.splice(toIdx, 0, moved);
  renderQuestList();
  draggedQuestId = null;
}


function renderMissionsChart() {
  const el = document.getElementById('missionsChart30');
  if (!el) return;
  const today = new Date().toISOString().split('T')[0];
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d    = new Date(Date.now() - i * 86400000);
    const dStr = d.toISOString().split('T')[0];
    const cnt  = quests.filter(q => q.done && q.done_at && q.done_at.startsWith(dStr)).length;
    const showLabel = (i % 7 === 0) || i === 0;
    days.push({ dStr, cnt, label: showLabel ? d.toLocaleDateString('es', { day:'numeric', month:'short' }) : '' });
  }
  const max = Math.max(...days.map(d => d.cnt), 1);
  el.innerHTML = `<div class="bc30-inner">${days.map(d => `
    <div class="bc30-col">
      <div class="bc30-bar ${d.dStr === today ? 'today' : ''}"
           style="height:${Math.max(3, Math.round((d.cnt / max) * 72))}px"
           title="${d.dStr}: ${d.cnt} misiones"></div>
      <div class="bc30-lbl">${d.label}</div>
    </div>`).join('')}</div>`;
}

function calcHeroIndex() {
  if (!hero) return { total: 0, streakScore: 0, activityScore: 0, healthScore: 0, pomScore: 0, achScore: 0 };
  const last7 = new Date(Date.now() - 6 * 86400000); last7.setHours(0, 0, 0, 0);
  const done7 = quests.filter(q => q.done && q.done_at && new Date(q.done_at) >= last7).length;
  const poms7 = pomodoros.filter(p => p.started_at && new Date(p.started_at) >= last7).length;
  const streakScore   = Math.min((hero.streak || 0) / 30, 1) * 100;
  const activityScore = Math.min(done7 / 10, 1) * 100;
  const healthScore   = ((hero.hp || 0) / (hero.hp_max || 100)) * 100;
  const pomScore      = Math.min(poms7 / 10, 1) * 100;
  let unlocked = []; try { unlocked = JSON.parse(hero.achievements || '[]'); } catch {}
  const achScore = ACHIEVEMENT_DEFS.length ? (unlocked.length / ACHIEVEMENT_DEFS.length) * 100 : 0;
  const total = Math.round(streakScore * 0.25 + activityScore * 0.25 + healthScore * 0.2 + pomScore * 0.15 + achScore * 0.15);
  return { total, streakScore, activityScore, healthScore, pomScore, achScore };
}

function renderHeroIndex() {
  const el = document.getElementById('heroIndexContent');
  if (!el || !hero) return;
  const idx   = calcHeroIndex();
  const color = idx.total >= 75 ? 'var(--green)' : idx.total >= 50 ? 'var(--gold)' : idx.total >= 25 ? 'var(--orange)' : 'var(--red)';
  const label = idx.total >= 75 ? 'Imparable' : idx.total >= 50 ? 'En forma' : idx.total >= 25 ? 'Flaqueando' : 'En crisis';
  const rows  = [
    ['🔥 Racha', idx.streakScore], ['⚔️ Actividad (7d)', idx.activityScore],
    ['❤️ Salud', idx.healthScore], ['🍅 Pomodoro (7d)', idx.pomScore], ['🏆 Logros', idx.achScore]
  ];
  el.innerHTML = `
    <div class="hero-index-head">
      <div class="hero-index-num" style="color:${color}">${idx.total}</div>
      <div>
        <div class="hero-index-label" style="color:${color}">${label}</div>
        <div class="hero-index-sub">Tu score general · mantenlo alto</div>
      </div>
    </div>
    <div class="hero-index-bars">
      ${rows.map(([lbl, val]) => `
        <div class="hero-index-row">
          <span>${lbl}</span>
          <div class="hero-index-bar-bg"><div class="hero-index-bar-fill" style="width:${Math.round(val)}%"></div></div>
        </div>`).join('')}
    </div>`;
}

function renderMastery() {
  const el = document.getElementById('masteryContent');
  if (!el) return;
  const typeInfo = { main:'⚔️ Épicas', side:'🗡️ Encargos', daily:'🌅 Búsquedas', weekly:'📜 Crónicas' };
  el.innerHTML = Object.entries(typeInfo).map(([type, label]) => {
    const count   = quests.filter(q => q.done && q.type === type).length;
    const lvl     = Math.floor(count / 10) + 1;
    const pct     = Math.round((count % 10) * 10);
    return `
      <div class="hero-index-row" style="margin-bottom:6px">
        <span style="width:90px">${label}</span>
        <div class="hero-index-bar-bg"><div class="hero-index-bar-fill" style="width:${pct}%"></div></div>
        <span style="font-size:10px;color:var(--text2);white-space:nowrap">Nv.${lvl} · ${count}</span>
      </div>`;
  }).join('');
}

function renderPomHeatmap() {
  const el = document.getElementById('pomHeatmapGrid');
  if (!el) return;
  const now = new Date();
  const days = 7;
  const hours = 24;
  // Count pomodoros per day+hour
  const grid = {};
  pomodoros.forEach(p => {
    if (!p.started_at) return;
    const d = new Date(p.started_at);
    const dayOffset = Math.floor((now - d) / 86400000);
    if (dayOffset >= days) return;
    const h = d.getHours();
    const key = `${dayOffset},${h}`;
    grid[key] = (grid[key] || 0) + 1;
  });
  const maxVal = Math.max(...Object.values(grid), 1);
  const dayNames = ['Hoy','Ayer','2d','3d','4d','5d','6d'];
  let html = '<div class="pom-hm-wrap">';
  // Header row: horas clave
  html += '<div class="pom-hm-row pom-hm-head"><span class="pom-hm-day-lbl"></span>';
  [0,3,6,9,12,15,18,21].forEach(h => { html += `<span class="pom-hm-h-lbl">${h}h</span>`; });
  html += '</div>';
  for (let d = 0; d < days; d++) {
    html += `<div class="pom-hm-row"><span class="pom-hm-day-lbl">${dayNames[d]}</span>`;
    for (let h = 0; h < hours; h++) {
      const cnt = grid[`${d},${h}`] || 0;
      const pct = Math.round((cnt / maxVal) * 100);
      html += `<div class="pom-hm-cell" data-pct="${pct}" title="${dayNames[d]} ${h}:00 — ${cnt} pom${cnt!==1?'s':''}"></div>`;
    }
    html += '</div>';
  }
  html += '</div>';
  el.innerHTML = html;
}

function renderStats() {
  renderHeroIndex();
  if (typeof renderReputation === 'function') renderReputation();
  renderMastery();
  if (typeof renderPatterns === 'function') renderPatterns();
  renderXPChart();
  renderTypeDist();
  renderMissionsChart();
  renderHeatmap();
  renderPomHeatmap();
  renderHourlyChart();
  renderWeekComparison();
  renderAvgTime();
  renderWeekdayChart();
  if (!hero) return;

  const setText = (id, val) => { const el=document.getElementById(id); if(el) el.textContent=val; };

  setText('st-completed',  hero.quests_done || 0);
  setText('st-pomodoros',  hero.pomodoros_done || 0);
  setText('statsStreak',   hero.streak || 0);
  setText('st-total-xp',  (hero.xp_total || 0).toLocaleString());
  setText('st-level',      hero._level || 1);

  // Days in dungeon
  const created = hero.created_at ? new Date(hero.created_at) : new Date();
  const daysDiff = Math.max(0, Math.round((Date.now() - created.getTime()) / 86400000));
  setText('st-days-dungeon', daysDiff);

  // Total focus time
  const totalMins = (hero.pomodoros_done || 0) * 25;
  setText('st-focus-time', `${Math.floor(totalMins/60)}h ${totalMins%60}m`);

  // Top 3 quests
  const nameCounts = {};
  quests.filter(q => q.done).forEach(q => { nameCounts[q.name] = (nameCounts[q.name] || 0) + 1; });
  const topEl = document.getElementById('topQuestsContent');
  if (topEl) {
    const top3 = Object.entries(nameCounts).sort((a,b)=>b[1]-a[1]).slice(0,3);
    topEl.innerHTML = top3.length
      ? top3.map(([name,cnt],i) => `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border)">
          <span>${['🥇','🥈','🥉'][i]} ${escHtml(name)}</span>
          <span style="color:var(--gold);font-weight:600">${cnt}x</span></div>`).join('')
      : '<div style="color:var(--text3)">Completa misiones para ver tus favoritas</div>';
  }

  // Oráculo
  renderOraculo();
}

function renderOraculo() {
  const el = document.getElementById('oraculoText');
  if (!el || !hero) return;
  const streak    = hero.streak || 0;
  const completed = hero.quests_done || 0;
  const hp        = hero.hp || 100;
  const hpMax     = hero.hp_max || 100;
  const lvl       = hero._level || 1;

  let phrase = 'El oráculo observa tu jornada en silencio...';
  if (hp / hpMax < 0.25) phrase = '⚠️ "El oráculo ve sombras densas sobre tu salud. El dungeon te cobra tributo, héroe. Descansa o sucumbirás."';
  else if (streak >= 30)  phrase = '🌟 "Treinta soles has caminado sin descanso. Eres ya una leyenda que los libros del gremio recordarán por siglos."';
  else if (streak >= 14)  phrase = '🔥 "Dos semanas de fuego imparable. El oráculo no ve rival en el horizonte que pueda detenerte."';
  else if (streak >= 7)   phrase = '⚔️ "Siete días de batalla sin derrota. Los dioses del caos productivo te observan con respeto."';
  else if (streak >= 3)   phrase = '💪 "Tu racha crece como la magia en el aire. Continúa y el gremio te coronará."';
  else if (completed >= 100) phrase = '👑 "Cien monstruos caídos. Eres el azote del dungeon. Pocos alcanzan este honor, héroe."';
  else if (completed >= 50) phrase = '🏆 "Cincuenta victorias graban tu nombre en el muro de los campeones. El oráculo inclina su cabeza."';
  else if (lvl >= 8)      phrase = '🌙 "Tu nivel trasciende lo mortal. El oráculo apenas puede mirarte a los ojos sin deslumbrarse."';
  else if (lvl >= 5)      phrase = '✨ "Nivel ' + lvl + '. El oráculo sonríe — estás en el camino de los grandes."';
  else if (streak === 0)  phrase = '🌅 "El oráculo te invita a comenzar hoy. Una sola misión completada rompe el silencio del dungeon."';
  else phrase = `🔮 "Día ${streak} de tu jornada. El oráculo ve potencial brillando en ti, héroe. No lo desperdicies."`;

  el.textContent = phrase;
}

function renderXPChart() {
  const el = document.getElementById('xpChart');
  if (!el) return;
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dStr = d.toISOString().split('T')[0];
    const dayXP = quests.filter(q => q.done && q.done_at && q.done_at.startsWith(dStr))
      .reduce((sum, q) => sum + (XP_TABLE[q.type] || 50), 0);
    days.push({ label: d.toLocaleDateString('es', { weekday: 'short' }), xp: dayXP });
  }
  const maxXP = Math.max(...days.map(d => d.xp), 1);
  el.innerHTML = days.map(d => `
    <div class="mini-bar-wrap">
      <div class="mini-bar" style="height:${Math.round((d.xp / maxXP) * 70)}px" title="${d.xp} XP"></div>
      <div class="mini-bar-label">${d.label}</div>
    </div>
  `).join('');
}

function renderTypeDist() {
  const el = document.getElementById('typeDist');
  if (!el) return;
  const types = ['main', 'side', 'daily', 'weekly'];
  const labels = { main: '⭐ Princ.', side: '🗡️ Secun.', daily: '🌅 Diaria', weekly: '📅 Semanal' };
  const colors = { main: 'var(--gold)', side: 'var(--accent2)', daily: 'var(--green)', weekly: 'var(--blue)' };
  const counts = {};
  types.forEach(t => counts[t] = quests.filter(q => q.type === t && q.done).length);
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  el.innerHTML = types.map(t => `
    <div class="dist-row">
      <span class="dist-label">${labels[t]}</span>
      <div class="dist-bar-bg">
        <div class="dist-bar" style="width:${Math.round((counts[t]/total)*100)}%;background:${colors[t]}"></div>
      </div>
      <span class="dist-count">${counts[t]}</span>
    </div>
  `).join('');
}


function updateBossBanner() {
  // Delegated to rpg.js — called after that script loads
  if (typeof getBossState === 'function') {
    const banner = document.getElementById('bossBanner');
    if (!banner) return;
    const state = getBossState();
    banner.style.display = 'flex';
    if (state.defeated) {
      banner.innerHTML = `<div class="boss-defeated">🏆 ¡${escHtml(state.name)} DERROTADO! Semana conquistada.</div>`;
    } else {
      const pct      = Math.round((state.hp / state.maxHp) * 100);
      const hpColor  = pct > 60 ? '#fb7185' : pct > 30 ? '#facc15' : '#4ade80';
      const bossImgHtml = state.bossKey
        ? `<img src="${CDN}dungeon/boss_${state.bossKey}.png" class="boss-img" alt="${escHtml(state.name)}"
               onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
           <div class="boss-icon" style="display:none">👹</div>`
        : `<div class="boss-icon">👹</div>`;
      const lowHp = pct <= 30 ? 'anim-pulse-danger' : '';
      banner.innerHTML = `
        <div class="boss-icon-wrap ${lowHp}">${bossImgHtml}</div>
        <div class="boss-info" style="flex:1;min-width:0">
          <div class="boss-label">⚔️ Jefe Semanal — ¡Atácalo completando misiones!</div>
          <div class="boss-name">${escHtml(state.name)}</div>
          <div style="display:flex;align-items:center;gap:10px;margin-top:6px">
            <div style="flex:1;height:14px;background:rgba(255,255,255,.15);border-radius:7px;overflow:hidden;border:1px solid rgba(255,255,255,.2)">
              <div style="width:${pct}%;height:100%;background:${hpColor};border-radius:7px"></div>
            </div>
            <span style="font-size:12px;font-weight:700;color:#fff;white-space:nowrap">❤️ ${state.hp}/${state.maxHp}</span>
          </div>
        </div>`;
    }
  }
  // Weekly quests progress banner
  const weeklies    = quests.filter(q => q.type === 'weekly');
  const weeklyDone  = weeklies.filter(q => q.done).length;
  const weeklyTotal = weeklies.length;
  const wb = document.getElementById('weeklyBanner');
  if (wb && weeklyTotal > 0) {
    const pending = weeklies.find(q => !q.done);
    wb.style.display = 'flex';
    document.getElementById('weeklyBannerName').textContent = pending ? pending.name : '¡Todas completadas!';
    document.getElementById('weeklyBossFill').style.width = Math.round((weeklyDone / weeklyTotal) * 100) + '%';
    document.getElementById('weeklyBannerMeta').textContent = `${weeklyDone}/${weeklyTotal}`;
  } else if (wb) wb.style.display = 'none';
}

function updateDailyProgress() {
  const today   = new Date().toISOString().split('T')[0];
  const dailies = quests.filter(q => q.type === 'daily');
  const done    = dailies.filter(q => q.done && q.done_at && q.done_at.startsWith(today)).length;
  const total   = dailies.length;
  const wrap = document.getElementById('dailyProgressWrap');
  if (!wrap) return;
  if (!total) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'flex';
  document.getElementById('dailyProgressLabel').textContent = `${done}/${total} búsquedas diarias`;
  document.getElementById('dailyProgressFill').style.width = Math.round((done / total) * 100) + '%';
}

/* ── Hourly distribution chart ─────────────────── */
function renderHourlyChart() {
  const el = document.getElementById('hourlyChart');
  if (!el) return;
  const counts = Array(24).fill(0);
  quests.forEach(q => {
    if (q.done && q.done_at) counts[new Date(q.done_at).getHours()]++;
  });
  const max  = Math.max(...counts, 1);
  const peak = counts.indexOf(Math.max(...counts));
  el.innerHTML = `<div class="hourly-bars">` +
    counts.map((c, h) => `
      <div class="hourly-col" title="${h}:00 — ${c} misiones">
        <div class="hourly-bar" style="height:${Math.round((c/max)*50)}px;background:${h===peak&&c>0?'var(--accent)':'var(--bg4)'}"></div>
        <div class="hourly-label">${h%6===0?h+'h':''}</div>
      </div>`).join('') + `</div>` +
    (counts[peak] ? `<div style="font-size:11px;color:var(--text2);text-align:center;margin-top:4px">Pico: ${peak}:00h (${counts[peak]})</div>` : '<div style="font-size:11px;color:var(--text3);text-align:center">Completa misiones para ver tu horario</div>');
}

/* ── Week comparison ────────────────────────────── */
function renderWeekComparison() {
  const el = document.getElementById('weekCompare');
  if (!el) return;
  const now      = Date.now();
  const wkStart  = now - 7  * 86400000;
  const pwkStart = now - 14 * 86400000;
  const thisWeek = quests.filter(q => q.done && q.done_at && new Date(q.done_at).getTime() >= wkStart).length;
  const lastWeek = quests.filter(q => q.done && q.done_at && new Date(q.done_at).getTime() >= pwkStart && new Date(q.done_at).getTime() < wkStart).length;
  const diff = thisWeek - lastWeek;
  const pct  = lastWeek > 0 ? Math.round(Math.abs(diff / lastWeek) * 100) : (thisWeek > 0 ? 100 : 0);
  const arrow = diff > 0 ? '▲' : diff < 0 ? '▼' : '→';
  const color = diff > 0 ? 'var(--green)' : diff < 0 ? 'var(--red)' : 'var(--text2)';
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between"><span style="color:var(--text2)">Esta semana</span><strong style="color:var(--accent)">${thisWeek}</strong></div>
    <div style="display:flex;justify-content:space-between"><span style="color:var(--text2)">Semana anterior</span><strong>${lastWeek}</strong></div>
    <div style="text-align:center;font-size:16px;font-weight:700;color:${color};margin-top:4px">${arrow} ${pct}%${diff!==0?(diff>0?' más':' menos'):' igual'}</div>`;
}

/* ── XP por día de la semana (histórico) ───────── */
function renderWeekdayChart() {
  const el = document.getElementById('weekdayChart');
  if (!el) return;
  const days = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const xpByDay = Array(7).fill(0);
  quests.forEach(q => {
    if (q.done && q.done_at) xpByDay[new Date(q.done_at).getDay()] += XP_TABLE[q.type] || 50;
  });
  const max = Math.max(...xpByDay, 1);
  const peak = xpByDay.indexOf(Math.max(...xpByDay));
  el.innerHTML = `<div class="hourly-bars">` +
    xpByDay.map((xp, i) => `
      <div class="hourly-col" title="${days[i]}: ${xp} XP">
        <div class="hourly-bar" style="height:${Math.round((xp/max)*50)}px;background:${i===peak&&xp>0?'var(--accent)':'var(--bg4)'}"></div>
        <div class="hourly-label">${days[i]}</div>
      </div>`).join('') + `</div>` +
    (xpByDay[peak] > 0
      ? `<div style="font-size:11px;color:var(--text2);text-align:center;margin-top:4px">Más productivo: ${days[peak]} (${xpByDay[peak]} XP)</div>`
      : `<div style="font-size:11px;color:var(--text3);text-align:center">Completa misiones para ver tu patrón semanal</div>`);
}

/* ── Average time per quest ─────────────────────── */
function renderAvgTime() {
  const el = document.getElementById('avgTimeContent');
  if (!el || !hero) return;
  const done = hero.quests_done || 0;
  const poms = hero.pomodoros_done || 0;
  const avgP = done > 0 ? (poms / done).toFixed(1) : '—';
  const avgM = done > 0 ? Math.round((poms * 25) / done) : 0;
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between"><span style="color:var(--text2)">Pomodoros totales</span><strong style="color:var(--blue)">${poms}</strong></div>
    <div style="display:flex;justify-content:space-between"><span style="color:var(--text2)">Misiones completadas</span><strong style="color:var(--green)">${done}</strong></div>
    <div style="display:flex;justify-content:space-between"><span style="color:var(--text2)">Prom. poms / misión</span><strong style="color:var(--accent)">${avgP}</strong></div>
    ${avgM ? `<div style="display:flex;justify-content:space-between"><span style="color:var(--text2)">Prom. minutos / misión</span><strong style="color:var(--gold)">${avgM}m</strong></div>` : ''}`;
}
