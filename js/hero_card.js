/* ── CARNET DE HÉROE — exportable PNG via Canvas ─────────── */

const CARD_W = 600;
const CARD_H = 340;

function _cardRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function _cardBar(ctx, x, y, w, h, pct, colorFill, colorBg) {
  ctx.fillStyle = colorBg;
  _cardRoundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = colorFill;
  _cardRoundRect(ctx, x, y, Math.max(h, w * Math.min(1, pct)), h, h / 2);
  ctx.fill();
}

async function generateHeroCard() {
  if (!hero) { toast('⚠️', 'No hay héroe cargado.'); return; }

  const canvas = document.createElement('canvas');
  canvas.width  = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');

  const cls     = hero.hero_class || 'guerrero';
  const level   = hero.level  || 1;
  const xpTotal = hero.xp_total || 0;
  const xpNeeds = xpForLevel(level + 1) - xpForLevel(level);
  const xpHave  = xpTotal - xpForLevel(level);
  const xpPct   = xpNeeds > 0 ? xpHave / xpNeeds : 1;
  const hp      = hero.hp     || 100;
  const hpMax   = hero.hp_max || 100;
  const streak  = hero.streak || 0;
  const title   = typeof getDynamicTitle === 'function' ? getDynamicTitle(hero) : (TITLES[level - 1] || 'Aventurero');

  const CLASS_ICONS = { guerrero:'⚔️', mago:'🔮', picaro:'🗡️', clerigo:'✝️', arquero:'🏹', monje:'🥋' };
  const RACE_ICONS  = { humano:'👤', elfo:'🧝', enano:'⛏️', orco:'💪', semielfo:'🌗', gnomo:'🔧' };

  const clsIcon  = CLASS_ICONS[cls]  || '⚔️';
  const raceIcon = RACE_ICONS[hero.race || 'humano'] || '👤';
  const avatarEm = hero.avatar || clsIcon;

  /* Background */
  const bgGrad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  bgGrad.addColorStop(0, '#1a1625');
  bgGrad.addColorStop(1, '#0f0c1a');
  ctx.fillStyle = bgGrad;
  _cardRoundRect(ctx, 0, 0, CARD_W, CARD_H, 16);
  ctx.fill();

  /* Accent glow top-left */
  const glowGrad = ctx.createRadialGradient(80, 60, 0, 80, 60, 180);
  const ACCENT = { guerrero:'#f97316', mago:'#a855f7', picaro:'#22d3ee', clerigo:'#facc15', arquero:'#4ade80', monje:'#fb7185' };
  const accentColor = ACCENT[cls] || '#a855f7';
  glowGrad.addColorStop(0, accentColor + '22');
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  _cardRoundRect(ctx, 0, 0, CARD_W, CARD_H, 16);
  ctx.fill();

  /* Border */
  ctx.strokeStyle = accentColor + '55';
  ctx.lineWidth   = 1.5;
  _cardRoundRect(ctx, 1, 1, CARD_W - 2, CARD_H - 2, 15);
  ctx.stroke();

  /* Avatar circle */
  ctx.save();
  ctx.beginPath();
  ctx.arc(76, 76, 44, 0, Math.PI * 2);
  ctx.fillStyle = '#2a2040';
  ctx.fill();
  ctx.strokeStyle = accentColor + '88';
  ctx.lineWidth   = 2;
  ctx.stroke();
  ctx.restore();

  ctx.font      = '38px serif';
  ctx.textAlign = 'center';
  ctx.fillText(avatarEm, 76, 90);

  /* Hero name */
  ctx.fillStyle = '#f1f5f9';
  ctx.font      = 'bold 22px "Georgia", serif';
  ctx.textAlign = 'left';
  ctx.fillText(hero.name || 'Héroe', 136, 60);

  /* Title */
  ctx.fillStyle = accentColor;
  ctx.font      = '13px "Georgia", serif';
  ctx.fillText(title, 136, 80);

  /* Class + Race row */
  ctx.fillStyle = '#94a3b8';
  ctx.font      = '12px sans-serif';
  ctx.fillText(`${clsIcon} ${cls.charAt(0).toUpperCase() + cls.slice(1)}   ${raceIcon} ${(hero.race || 'Humano').charAt(0).toUpperCase() + (hero.race || 'humano').slice(1)}`, 136, 100);

  /* Level badge */
  ctx.fillStyle = accentColor;
  ctx.font      = 'bold 13px sans-serif';
  ctx.fillText(`Nivel ${level}`, 136, 118);
  if ((hero.prestige || 0) > 0) {
    ctx.fillStyle = '#facc15';
    ctx.fillText(` ⭐×${hero.prestige}`, 136 + ctx.measureText(`Nivel ${level}`).width + 4, 118);
  }

  /* HP bar */
  const barX = 28, barY = 148, barW = 270, barH = 12;
  ctx.fillStyle = '#64748b';
  ctx.font      = '11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`❤️ HP  ${hp}/${hpMax}`, barX, barY - 4);
  _cardBar(ctx, barX, barY, barW, barH, hp / hpMax, '#f87171', '#2d2040');

  /* XP bar */
  const xpBarY = barY + 30;
  ctx.fillStyle = '#64748b';
  ctx.fillText(`⭐ XP  ${xpHave}/${xpNeeds}`, barX, xpBarY - 4);
  _cardBar(ctx, barX, xpBarY, barW, barH, xpPct, accentColor, '#2d2040');

  /* Divider */
  ctx.strokeStyle = '#ffffff14';
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(316, 24); ctx.lineTo(316, CARD_H - 24); ctx.stroke();

  /* Stats header */
  ctx.fillStyle = '#94a3b8';
  ctx.font      = '10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ATRIBUTOS', 334, 46);

  const STATS = [
    { key:'str',   icon:'💪', label:'FUE' },
    { key:'intel', icon:'📖', label:'INT' },
    { key:'dex',   icon:'🎯', label:'DES' },
    { key:'con',   icon:'🛡️', label:'CON' },
    { key:'wis',   icon:'🌿', label:'SAB' },
    { key:'cha',   icon:'✨', label:'CAR' },
  ];

  STATS.forEach((s, i) => {
    const col  = i % 2;
    const row  = Math.floor(i / 2);
    const sx   = 334 + col * 130;
    const sy   = 68 + row * 50;
    const val  = hero[s.key] || 0;

    ctx.fillStyle = '#1e1830';
    _cardRoundRect(ctx, sx, sy, 118, 38, 8);
    ctx.fill();
    ctx.strokeStyle = '#ffffff0e';
    ctx.lineWidth   = 1;
    ctx.stroke();

    ctx.font      = '16px serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(s.icon, sx + 8, sy + 26);

    ctx.font      = 'bold 18px sans-serif';
    ctx.fillStyle = val >= 10 ? accentColor : '#e2e8f0';
    ctx.textAlign = 'right';
    ctx.fillText(val, sx + 110, sy + 26);

    ctx.font      = '9px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';
    ctx.fillText(s.label, sx + 32, sy + 14);
  });

  /* Bottom strip */
  const bY = CARD_H - 52;
  ctx.strokeStyle = '#ffffff10';
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(24, bY); ctx.lineTo(CARD_W - 24, bY); ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font      = '11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`🔥 Racha: ${streak} días`, 28, bY + 18);
  ctx.fillText(`🏆 Misiones: ${hero.quests_done || 0}`, 28, bY + 34);

  if (hero.guild_name) {
    ctx.fillStyle = '#a78bfa';
    ctx.textAlign = 'center';
    ctx.fillText(`⚜️ ${hero.guild_name}`, CARD_W / 2, bY + 18);
  }

  const today = new Date().toLocaleDateString('es-MX', { year:'numeric', month:'short', day:'numeric' });
  ctx.fillStyle = '#475569';
  ctx.font      = '10px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`Arcanum · ${today}`, CARD_W - 28, bY + 18);
  ctx.fillText('dungeon.mordredgh.com', CARD_W - 28, bY + 34);

  /* Download */
  const url  = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href     = url;
  link.download = `carnet_${(hero.name || 'heroe').replace(/\s+/g, '_')}_lv${level}.png`;
  link.click();
  toast('🪪', '¡Carnet descargado!');
}
