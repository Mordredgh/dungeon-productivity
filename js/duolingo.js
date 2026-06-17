'use strict';

/* ── INTEGRACIÓN DUOLINGO ─────────────────────────────────────
   Proxy via Edge Function duolingo-proxy (Supabase Aglaya).
   Fetch diario de XP ganado → convierte a recompensas Arcanum.
   Ratio: 10 XP Duolingo = 1 XP Arcanum (máx 200 XP/día).
   ─────────────────────────────────────────────────────────── */

const DUOLINGO_XP_RATIO  = 0.1;  // Duolingo XP → Arcanum XP
const DUOLINGO_MAX_XP    = 200;  // max diario en Arcanum

function getDuoUsername() {
  return localStorage.getItem('dungeon-duolingo-user') || '';
}
function setDuoUsername(u) {
  localStorage.setItem('dungeon-duolingo-user', u.trim());
}
function getDuoLastSync() {
  return localStorage.getItem('dungeon-duolingo-sync') || '';
}

async function syncDuolingo() {
  const username = getDuoUsername();
  if (!username) {
    toast('⚠️', 'Ingresa tu username de Duolingo primero.');
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  if (getDuoLastSync() === today) {
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

    localStorage.setItem('dungeon-duolingo-sync', today);
    localStorage.setItem('dungeon-duolingo-data', JSON.stringify({ duoXP, arcXP, streak, syncedAt: today }));

    if (arcXP > 0) {
      await addXP(arcXP, 'side', null);
      toast('🦜', `Duolingo: ${duoXP} XP → +${arcXP} XP en Arcanum · Racha: ${streak}🔥`);
    } else {
      toast('🦜', `Duolingo sincronizado · Sin XP hoy · Racha: ${streak}🔥`);
    }

    renderDuolingoWidget();
  } catch (e) {
    toast('❌', `Error Duolingo: ${e.message}`);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '🔄 Sincronizar'; }
  }
}

function renderDuolingoWidget() {
  const el = document.getElementById('duoWidgetContent');
  if (!el) return;

  const username = getDuoUsername();
  const cached   = JSON.parse(localStorage.getItem('dungeon-duolingo-data') || 'null');
  const today    = new Date().toISOString().split('T')[0];
  const synced   = getDuoLastSync() === today;

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
        <button class="btn btn-ghost" onclick="setDuoUsername(document.getElementById('duoUsernameInput').value);renderDuolingoWidget();toast('💾','Username guardado.')">Guardar</button>
      </div>
      ${cached ? `
        <div class="duo-stats">
          <div class="duo-stat"><span class="duo-stat-val">${cached.duoXP}</span><span class="duo-stat-lbl">XP Duolingo hoy</span></div>
          <div class="duo-stat"><span class="duo-stat-val" style="color:var(--accent)">${cached.arcXP}</span><span class="duo-stat-lbl">XP Arcanum</span></div>
          <div class="duo-stat"><span class="duo-stat-val" style="color:var(--orange)">${cached.streak}🔥</span><span class="duo-stat-lbl">Racha</span></div>
        </div>` : `<p style="font-size:12px;color:var(--text3);margin:8px 0">Sincroniza para ver tu progreso</p>`}
      <button class="btn btn-primary" id="duoSyncBtn" onclick="syncDuolingo()" style="width:100%;margin-top:8px"
        ${!username ? 'disabled' : ''}>🔄 Sincronizar Duolingo</button>
      <p style="font-size:10px;color:var(--text3);margin-top:6px;text-align:center">
        ${DUOLINGO_XP_RATIO * 10} XP Duo = 1 XP Arcanum · máx ${DUOLINGO_MAX_XP} XP/día
      </p>
    </div>`;
}
