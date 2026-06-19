/* HERO */
async function loadHero() {
  const { data } = await db.from('dungeon_heroes').select('*').limit(1);
  if (data && data.length) {
    hero = data[0];
  } else {
    const { data: nh } = await db.from('dungeon_heroes').insert({
      name: 'Gerardo el Emprendedor', hero_class: 'fundador', avatar: '🧙',
      xp: 0, xp_total: 0, level: 1, hp: 100, hp_max: 100,
      streak: 0, longest_streak: 0, achievements: '[]', spells: '{}'
    }).select().single();
    hero = nh;
  }
  deriveHero();
  // Init global state from hero record
  heroRace   = hero.race        || 'humano';
  guildName  = hero.guild_name  || '';
  webhookUrl = hero.webhook_url || '';
  // One-time gold migration from localStorage
  const _localGold = parseInt(localStorage.getItem('dungeon-gold') || '0');
  if (_localGold > 0 && !(hero.gold > 0)) {
    hero.gold = _localGold;
    saveHero({ gold: _localGold });
  }
  localStorage.removeItem('dungeon-gold');
  try { localStorage.setItem('dungeon-cache-hero', JSON.stringify(hero)); } catch {}
  applyClassTheme();
}

function applyClassTheme() {
  if (!hero) return;
  document.documentElement.dataset.heroClass = hero.hero_class || 'guerrero';
}

function deriveHero() {
  hero._level = calcLevel(hero.xp_total || 0);
  hero._completed = hero.quests_done || 0;
  hero._pomodoros = hero.pomodoros_done || 0;
  hero._main_done = hero.main_done || 0;
  hero._spells_cast = hero.spells_cast || 0;
  try { spellState = JSON.parse(hero.spells || '{}'); } catch { spellState = {}; }
}

async function saveHero(patch) {
  Object.assign(hero, patch);
  deriveHero();
  await db.from('dungeon_heroes').update(patch).eq('id', hero.id);
}

const _lvlCache = {};
function calcLevel(totalXP) {
  if (_lvlCache[totalXP] !== undefined) return _lvlCache[totalXP];
  let lvl = 1;
  while (lvl < 50 && totalXP >= xpForLevel(lvl)) lvl++;
  return (_lvlCache[totalXP] = Math.min(lvl, 50));
}

function canPrestige() { return !!hero && (hero._level || 1) >= 50; }

async function doPrestige() {
  if (!canPrestige()) return;
  const newPrestige = (hero.prestige || 0) + 1;
  Object.keys(_lvlCache).forEach(k => delete _lvlCache[k]);
  await saveHero({ prestige: newPrestige, xp_total: 0, level: 1 });
  toast('⭐', `¡Ascensión ${newPrestige}! +${newPrestige * 5}% XP permanente. Nivel reiniciado.`);
  spawnConfetti();
  renderHeroUI();
  if (typeof renderCharacterSheet === 'function') renderCharacterSheet();
}

function xpForLevel(lvl) {
  if (lvl <= 0) return 0;
  let total = 0;
  for (let i = 1; i <= lvl; i++) total += Math.round(LEVEL_BASE * Math.pow(LEVEL_SCALE, i - 1));
  return total;
}

function classXPBonus(type) {
  const cls = hero ? (hero.hero_class || 'guerrero') : 'guerrero';
  let bonus = 1;
  if (cls === 'mago') bonus = 1.1;
  else if (cls === 'guerrero' && type === 'main') bonus = 1.1;
  else if (cls === 'picaro' && type === 'side') bonus = 1.1;
  else if (cls === 'arquero' && type === 'weekly') bonus = 1.1;
  else if (cls === 'clerigo' && type === 'daily') bonus = 1.05;
  else if (cls === 'fundador') bonus = 1.05;
  const race = heroRace || 'humano';
  if (race === 'humano') bonus *= 1.1;
  if (hero) {
    if (type === 'main' && hero.str)   bonus *= 1 + hero.str * 0.01;
    if ((type === 'side' || type === 'daily') && hero.intel) bonus *= 1 + hero.intel * 0.01;
    if (hero.prestige) bonus *= 1 + hero.prestige * 0.05;
  }
  return bonus;
}

async function addXP(amount, type, sourceEl) {
  if (xpMultiplierEnd && Date.now() > xpMultiplierEnd) { xpMultiplier = 1; xpMultiplierEnd = 0; }
  const todMult    = typeof getTODBonus  === 'function' ? getTODBonus().xpMult : 1;
  const skillMult  = typeof getSkillTreeXPBonus === 'function' ? (1 + getSkillTreeXPBonus(type || 'side')) : 1;
  const runeMult   = typeof getRuneBonus === 'function' ? (1 + getRuneBonus('all_xp')) : 1;
  const weaponMult   = typeof getWeaponXPBonus  === 'function' ? (1 + getWeaponXPBonus()) : 1;
  const mountAtkMult   = typeof getPetMountStat    === 'function' ? (1 + getPetMountStat('atk') / 100) : 1;
  const seasonalMult   = typeof getSeasonalXPMult  === 'function' ? getSeasonalXPMult() : 1;
  const dungeonXPMult = typeof getDungeonBonus==='function' ? getDungeonBonus('xp') : 1;
  const h = new Date().getHours();
  const nightRuneMult = (typeof getRuneBonus==='function' && (h >= 20 || h < 5)) ? (1 + getRuneBonus('night_xp')) : 1;
  let finalXP = Math.round(amount * classXPBonus(type || 'side') * xpMultiplier * todMult * skillMult * runeMult * weaponMult * mountAtkMult * seasonalMult * dungeonXPMult * nightRuneMult);

  const prevLevel = calcLevel(hero.xp_total || 0);
  const newTotal = (hero.xp_total || 0) + finalXP;
  const newLevel = calcLevel(newTotal);

  await saveHero({ xp_total: newTotal, level: newLevel });
  if (sourceEl) spawnParticle(`+${finalXP} XP`, sourceEl);

  if (newLevel > prevLevel) {
    const gainedPoints = newLevel - prevLevel;
    hero.attr_points = (hero.attr_points || 0) + gainedPoints;
    const hist = JSON.parse(hero.level_history || '[]');
    hist.push({ level: newLevel, date: new Date().toISOString().split('T')[0], xp_total: newTotal });
    saveHero({ attr_points: hero.attr_points, level_history: JSON.stringify(hist) });
    showLevelUp(newLevel);
    checkAchievements();
    if (typeof dungeonPush === 'function') dungeonPush('⭐ ¡Subiste de nivel!', `${hero.name} alcanzó el nivel ${newLevel}. El dungeon tiembla.`);
    if (webhookUrl) {
      fetch(webhookUrl, { method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ hero: hero.name, newLevel, oldLevel: prevLevel, timestamp: new Date().toISOString() })
      }).catch(() => {});
    }
  }
  renderHeroUI();
}

/* STREAK */
async function checkDailyStreak() {
  if (!hero) return;
  const today = new Date().toISOString().split('T')[0];
  const lastDay = hero.last_active_date || null;
  if (lastDay === today) return;

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  let newStreak = lastDay === yesterday ? (hero.streak || 0) + 1 : 1;
  const longest = Math.max(newStreak, hero.longest_streak || 0);

  let newHp = hero.hp || 100;
  if (lastDay && lastDay !== yesterday) {
    if (hero.amulet) {
      hero.amulet = false; saveHero({ amulet: false });
      toast('🧿', '¡Amuleto de Protección absorbió el daño del día sin actividad!');
    } else {
      newHp = Math.max(10, newHp - 10);
      if (typeof spawnHPParticle === 'function') {
        const el = document.getElementById('heroHp');
        spawnHPParticle(-10, el);
      }
      toast('💔', 'Perdiste HP por días sin actividad.');
    }
  }

  await saveHero({ streak: newStreak, longest_streak: longest, last_active_date: today, hp: newHp });
  renderHeroUI();
  checkAchievements();
  if (newStreak > 1 && typeof damageBoss === 'function') {
    const dmg = Math.min(newStreak * 2, 30);
    damageBoss(dmg);
    toast('🔥', `¡Racha ×${newStreak}! El jefe recibe ${dmg} de daño.`);
  }

  // Track total active days for Titán secret class
  const _prog = getSecretProgress();
  _prog.total_active_days = (_prog.total_active_days || 0) + 1;
  if (newHp <= 10) _prog.hp_zeros = (_prog.hp_zeros || 0) + 1;
  await saveSecretProgress(_prog);
  checkSecretClassUnlocks();
}

/* ── CLASES SECRETAS ─────────────────────────────────────── */
function getSecretProgress() {
  try { return JSON.parse(hero.secret_progress || '{}'); } catch { return {}; }
}

async function saveSecretProgress(prog) {
  hero.secret_progress = JSON.stringify(prog);
  await db.from('dungeon_heroes').update({ secret_progress: hero.secret_progress }).eq('id', hero.id);
}

async function checkSecretClassUnlocks() {
  if (!hero) return;
  const prog = getSecretProgress();
  const classes = (() => { try { return JSON.parse(hero.secret_classes || '[]'); } catch { return []; } })();

  const conds = {
    'crononauta':    (prog.midnight_total || 0) >= 100,
    'paladin':       (prog.health_total || 0) >= 50,
    'nigromante':    (prog.hp_zeros || 0) >= 3,
    'titan':         (prog.total_active_days || 0) >= 500,
    'druida':        (prog.midnight_streak || 0) >= 30,
    'estrella-caida':['crononauta','paladin','nigromante','titan','druida'].every(k => classes.includes(k)),
  };

  const newOnes = Object.entries(conds)
    .filter(([k, met]) => met && !classes.includes(k))
    .map(([k]) => k);
  if (!newOnes.length) return;

  const updated = [...classes, ...newOnes];
  hero.secret_classes = JSON.stringify(updated);
  await db.from('dungeon_heroes').update({ secret_classes: hero.secret_classes }).eq('id', hero.id);

  const defs = typeof SECRET_CLASS_DEFS !== 'undefined' ? SECRET_CLASS_DEFS : [];
  newOnes.forEach(k => {
    const d = defs.find(x => x.key === k);
    toast(d?.icon || '🔓', `¡Clase Secreta desbloqueada: ${d?.name || k}!`);
    if (typeof dungeonPush === 'function') dungeonPush('🔓 Clase Secreta', `${d?.name || k} desbloqueada. Ve a tu personaje para adoptarla.`);
  });
  if (typeof renderCharacterSheet === 'function') renderCharacterSheet();
}

/* addHP — helper global para modificar HP y rastrear mínimos */
async function addHP(amount) {
  if (!hero) return;
  const runeHpMax = typeof getRuneBonus === 'function' ? getRuneBonus('hp_max') : 0;
  const newHp = Math.max(0, Math.min((hero.hp || 0) + amount, (hero.hp_max || 100) + runeHpMax));
  await saveHero({ hp: newHp });
  renderHeroUI();
  if (amount < 0 && newHp <= 10) {
    const _prog = getSecretProgress();
    _prog.hp_zeros = (_prog.hp_zeros || 0) + 1;
    await saveSecretProgress(_prog);
    checkSecretClassUnlocks();
  }
}
