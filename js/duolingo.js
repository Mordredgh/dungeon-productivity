'use strict';

/* ── INTEGRACIÓN DUOLINGO ─────────────────────────────────────
   Proxy via Edge Function duolingo-proxy (Supabase Aglaya).
   Fetch diario de XP ganado → convierte a recompensas Arcanum.
   Ratio: 10 XP Duolingo = 1 XP Arcanum (máx 200 XP/día).
   Todo persiste en dungeon_heroes (no localStorage).
   ─────────────────────────────────────────────────────────── */

const DUOLINGO_XP_RATIO  = 0.1;
const DUOLINGO_MAX_XP    = 200;

function _duoToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getDuoUsername() { return hero?.duo_username || ''; }

async function setDuoUsername(u) {
  await saveHero({ duo_username: u.trim() });
}

async function syncDuolingo() {
  const username = getDuoUsername();
  if (!username) {
    toast('⚠️', 'Ingresa tu username de Duolingo primero.');
    return;
  }

  const today = _duoToday();
  if (hero?.duo_sync_date === today) {
    toast('⏳', 'Ya sincronizaste Duolingo hoy.');
    return;
  }

  const btn = document.getElementById('duoSyncBtn');
  if (btn) { btn.disabled = true; btn.textContent = '🔄 Sincronizando...'; }

  try {
    const res = await fetch(`${SUPA_URL}/functions/v1/duolingo-proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPA_KEY}` },
      body: JSON.stringify({ username })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    const duoXP  = data.todayXp || 0;
    const arcXP  = Math.min(DUOLINGO_MAX_XP, Math.round(duoXP * DUOLINGO_XP_RATIO));
    const streak = data.streak || 0;

    await saveHero({
      duo_sync_date: today,
      duo_today_xp:  duoXP,
      duo_streak:    streak,
    });

    if (arcXP > 0 && hero?.duo_xp_date !== today) {
      await saveHero({ duo_xp_date: today });
      await addXP(arcXP, 'side', null);
      toast('🦜', `Duolingo: ${duoXP} XP → +${arcXP} XP en Arcanum · Racha: ${streak}🔥`);
    } else {
      toast('🦜', `Duolingo sincronizado · ${duoXP > 0 ? duoXP + ' XP hoy' : 'Sin XP hoy'} · Racha: ${streak}🔥`);
    }

    renderDuolingoWidget();
  } catch (e) {
    toast('❌', `Error Duolingo: ${e.message}`);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '🔄 Sincronizar Duolingo'; }
  }
}

function renderDuolingoWidget() {
  const el = document.getElementById('duoWidgetContent');
  if (!el) return;

  const username = getDuoUsername();
  const today    = _duoToday();
  const synced   = hero?.duo_sync_date === today;
  const duoXP    = hero?.duo_today_xp  || 0;
  const arcXP    = Math.min(DUOLINGO_MAX_XP, Math.round(duoXP * DUOLINGO_XP_RATIO));
  const streak   = hero?.duo_streak    || 0;

  el.innerHTML = `
    <div class="duo-widget">
      <div class="duo-header">
        <span class="duo-logo">🦜</span>
        <span class="duo-title">Duolingo</span>
        ${synced ? '<span class="duo-synced-badge">✅ Sincronizado hoy</span>' : ''}
      </div>
      <div class="duo-field-row">
        <input class="form-input duo-input" id="duoUsernameInput" type="text"
          placeholder="Tu username de Duolingo" value="${escHtml(username)}">
        <button class="btn btn-ghost" onclick="setDuoUsername(document.getElementById('duoUsernameInput').value).then(()=>{renderDuolingoWidget();toast('💾','Username guardado.')})">Guardar</button>
      </div>
      ${synced ? `
        <div class="duo-stats">
          <div class="duo-stat"><span class="duo-stat-val">${duoXP}</span><span class="duo-stat-lbl">XP Duolingo hoy</span></div>
          <div class="duo-stat"><span class="duo-stat-val" style="color:var(--accent)">${arcXP}</span><span class="duo-stat-lbl">XP Arcanum</span></div>
          <div class="duo-stat"><span class="duo-stat-val" style="color:var(--orange)">${streak}🔥</span><span class="duo-stat-lbl">Racha</span></div>
        </div>` : `<p style="font-size:12px;color:var(--text3);margin:8px 0">Sincroniza para ver tu progreso</p>`}
      <button class="btn btn-primary" id="duoSyncBtn" onclick="syncDuolingo()" style="width:100%;margin-top:8px"
        ${!username ? 'disabled' : ''}>🔄 Sincronizar Duolingo</button>
      <p style="font-size:10px;color:var(--text3);margin-top:6px;text-align:center">
        ${DUOLINGO_XP_RATIO * 10} XP Duo = 1 XP Arcanum · máx ${DUOLINGO_MAX_XP} XP/día
      </p>
    </div>`;
}
