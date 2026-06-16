'use strict';

const REPUTATION_THRESHOLD = 500;
const REPUTATION_BONUS     = 0.10;

function calcReputationByTag() {
  const byTag = {};
  quests.forEach(q => {
    if (!q.done || !q.tags) return;
    const xp = XP_TABLE[q.type] || 50;
    q.tags.split(' ').filter(t => t.startsWith('#')).forEach(tag => {
      byTag[tag] = (byTag[tag] || 0) + xp;
    });
  });
  return byTag;
}

function getReputationBonus(tagsStr) {
  if (!tagsStr) return 0;
  const byTag = calcReputationByTag();
  const tags = tagsStr.split(' ').filter(t => t.startsWith('#'));
  return tags.some(t => (byTag[t] || 0) >= REPUTATION_THRESHOLD) ? REPUTATION_BONUS : 0;
}

function renderReputation() {
  const el = document.getElementById('reputationContent');
  if (!el) return;
  const byTag = calcReputationByTag();
  const entries = Object.entries(byTag).sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (!entries.length) {
    el.innerHTML = `<div style="color:var(--text3);font-size:12px">Agrega tags (#trabajo, #salud...) a tus misiones para ver tu reputación por área.</div>`;
    return;
  }
  el.innerHTML = entries.map(([tag, xp]) => {
    const pct = Math.min(100, Math.round((xp / REPUTATION_THRESHOLD) * 100));
    const unlocked = xp >= REPUTATION_THRESHOLD;
    return `
      <div class="hero-index-row" style="margin-bottom:6px">
        <span style="width:90px">${escHtml(tag)}</span>
        <div class="hero-index-bar-bg"><div class="hero-index-bar-fill" style="width:${pct}%"></div></div>
        <span style="font-size:10px;color:${unlocked ? 'var(--green)' : 'var(--text3)'};white-space:nowrap">${unlocked ? '🔓 +10% XP' : `${xp}/${REPUTATION_THRESHOLD}`}</span>
      </div>`;
  }).join('');
}
