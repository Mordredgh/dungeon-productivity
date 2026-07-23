/* SUPABASE — cliente creado al cargar el script para que auth.js lo use antes de initDB() */
/* RPC resiliente: reintenta fallos transitorios y deja una marca recuperable. */
async function rpcWithRetry(name, args, options = {}) {
  const attempts = Math.max(1, Math.min(3, Number(options.attempts || 3)));
  const pendingKey = options.pendingKey ? `dungeon:pending:${options.pendingKey}` : null;
  if (pendingKey) sessionStorage.setItem(pendingKey, JSON.stringify({ name, at: Date.now() }));
  let last = { data: null, error: new Error('No se pudo contactar al servidor') };
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try { last = await db.rpc(name, args); } catch (error) { last = { data: null, error }; }
    if (!last.error) {
      if (pendingKey) sessionStorage.removeItem(pendingKey);
      return last;
    }
    const status = Number(last.error.status || 0);
    if (status >= 400 && status < 500 && status !== 408 && status !== 429) break;
    if (attempt + 1 < attempts) await new Promise(resolve => setTimeout(resolve, 350 * (attempt + 1)));
  }
  return last;
}
window.rpcWithRetry = rpcWithRetry;
db = supabase.createClient(SUPA_URL, SUPA_KEY);

async function initDB() {
  // db ya creado arriba

  // Show cached data instantly while Supabase loads
  try {
    const ch = localStorage.getItem('dungeon-cache-hero');
    const cq = localStorage.getItem('dungeon-cache-quests');
    if (ch) { hero = JSON.parse(ch); deriveHero(); renderHeroUI(); }
    if (cq) { quests = JSON.parse(cq); renderQuestList(); }
  } catch {}

  if (!quests.length) showSkeleton();
  await Promise.all([loadHero(), loadQuests(), loadPomodoros()]);

  /* Hero + misiones son el camino crítico. Inventario, mascotas, metas y
     runas sólo se necesitan al abrir sus vistas; no deben retrasar el primer
     render del tablero. La segunda pasada refresca las vistas al terminar. */
  renderAll();
  const hydrateSecondaryData = () => Promise.all([
    loadInventory(),
    loadPets(),
    typeof loadWeapons === 'function' ? loadWeapons() : Promise.resolve(),
    typeof loadGoals === 'function' ? loadGoals() : Promise.resolve(),
    typeof loadRunes === 'function' ? loadRunes() : Promise.resolve(),
  ]).then(() => renderAll()).catch(error => console.warn('[Dungeon] hidratación secundaria', error));
  if ('requestIdleCallback' in window) window.requestIdleCallback(hydrateSecondaryData, { timeout: 1800 });
  else setTimeout(hydrateSecondaryData, 250);

  scheduleRandomEvent();
  checkDailyStreak();
  if (typeof checkWeeklyDungeonProgress === 'function') checkWeeklyDungeonProgress();
  if (typeof _showRoomUnlockNotifs      === 'function') setTimeout(_showRoomUnlockNotifs, 2000);
}

/* POMODORO */
async function loadPomodoros() {
  const { data } = await db.from('dungeon_pomodoros').select('*').order('started_at', { ascending: false }).limit(50);
  pomodoros = data || [];
}

async function savePom() {
  if (!timer.serverPomSession) return false;
  const { data: rows, error } = await db.rpc('complete_dungeon_pomodoro', { p_session_id: timer.serverPomSession });
  const reward = Array.isArray(rows) ? rows[0] : rows;
  if (error || !reward) { toast('⚠️', 'No se pudo validar el pomodoro. El progreso se mantiene.'); return false; }
  timer.serverPomSession = null;
  const rec = { id: reward.id, hero_id: hero.id, duration: reward.duration, completed: true, started_at: reward.started_at };
  pomodoros.unshift(rec);
  Object.assign(hero, { xp_total:Number(reward.xp_total || hero.xp_total), gold:Number(reward.gold || hero.gold), pomodoros_done:Number(reward.pomodoros_done || hero.pomodoros_done) });
  deriveHero(); renderGold(); renderHeroUI();

  // Pomodoro real y verificado en servidor vinculado a una misión activa:
  // marca la misión como "verificada hoy" para que complete_dungeon_quest
  // pague recompensa completa en vez del 50% de honor-system por defecto.
  if (timer.activeQuest) {
    const linkedQ = quests.find(x => x.id === timer.activeQuest);
    if (linkedQ) {
      const today   = new Date().toISOString().split('T')[0];
      const newTags = (linkedQ.tags || '').replace(/#pom-ok-\d{4}-\d{2}-\d{2}/g, '').trim() + ` #pom-ok-${today}`;
      await db.from('dungeon_quests').update({ tags: newTags }).eq('id', linkedQ.id);
      linkedQ.tags = newTags;
      toast('🍅', `"${linkedQ.name}" verificada — recompensa completa al marcarla.`);
    }
  }

  if (Number(reward.gold_awarded || 0) > 0) {
    const cycleNum = Math.floor(Number(reward.pomodoros_done) / 4);
    const goldAmt = Number(reward.gold_awarded);

    if (typeof damageBoss === 'function') damageBoss(20);

    const hasDropSystem = typeof rollLoot === 'function' && typeof grantLoot === 'function';
    const dropRoll = Math.random() < 0.40; // 40% de chance de items

    if (hasDropSystem && dropRoll) {
      const loots = rollLoot('normal');
      await grantLoot(loots, goldAmt, 0, `🍅 Ciclo #${cycleNum} completado`, '🍅 Ciclo Pomodoro');
    } else {
      if (typeof addGold === 'function') {
        addGold(goldAmt);
        const el = document.getElementById('heroGold');
        if (typeof spawnGoldParticle === 'function') spawnGoldParticle(goldAmt, el);
      }
      setTimeout(() => toast('🍅', `¡Ciclo #${cycleNum} completado! +${goldAmt}🪙 · El Jefe recibe 20 de daño.`), 300);
    }
  }

  checkAchievements();
  renderStats();
  updatePomGoalUI();
  return true;
}
