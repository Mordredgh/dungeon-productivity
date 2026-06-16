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
  while (lvl < 10 && totalXP >= xpForLevel(lvl)) lvl++;
  return (_lvlCache[totalXP] = Math.min(lvl, 10));
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
  return bonus;
}

async function addXP(amount, type, sourceEl) {
  if (xpMultiplierEnd && Date.now() > xpMultiplierEnd) { xpMultiplier = 1; xpMultiplierEnd = 0; }
  let finalXP = Math.round(amount * classXPBonus(type || 'side') * xpMultiplier);

  const prevLevel = calcLevel(hero.xp_total || 0);
  const newTotal = (hero.xp_total || 0) + finalXP;
  const newLevel = calcLevel(newTotal);

  await saveHero({ xp_total: newTotal, level: newLevel });
  if (sourceEl) spawnParticle(`+${finalXP} XP`, sourceEl);

  if (newLevel > prevLevel) {
    showLevelUp(newLevel);
    checkAchievements();
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
  const today = new Date().toDateString();
  const lastDay = hero.last_active ? new Date(hero.last_active).toDateString() : null;
  if (lastDay === today) return;

  const yesterday = new Date(Date.now() - 86400000).toDateString();
  let newStreak = lastDay === yesterday ? (hero.streak || 0) + 1 : 1;
  const longest = Math.max(newStreak, hero.longest_streak || 0);

  let newHp = hero.hp || 100;
  if (lastDay && lastDay !== yesterday) {
    if (hero.amulet) {
      hero.amulet = false; saveHero({ amulet: false });
      toast('🧿', '¡Amuleto de Protección absorbió el daño del día sin actividad!');
    } else {
      newHp = Math.max(10, newHp - 10);
      toast('💔', 'Perdiste HP por días sin actividad.');
    }
  }

  await saveHero({ streak: newStreak, longest_streak: longest, last_active: new Date().toISOString(), hp: newHp });
  renderHeroUI();
  checkAchievements();
}
