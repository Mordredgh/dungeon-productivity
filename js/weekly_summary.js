'use strict';

/* ── RESUMEN SEMANAL ───────────────────────────────────────────
   Los lunes muestra modal con stats de la semana pasada.
   Gate: localStorage 'dungeon-weekly-summary-YYYY-WW'
   ─────────────────────────────────────────────────────────── */

function _getISOWeek(date) {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

function _weekKey(date) {
  const d = date || new Date();
  return `${d.getFullYear()}-W${String(_getISOWeek(d)).padStart(2,'0')}`;
}

async function checkWeeklySummary() {
  const now = new Date();
  if (now.getDay() !== 1) return; // solo lunes
  const key = 'dungeon-ws-' + _weekKey(now);
  if (localStorage.getItem(key)) return;
  localStorage.setItem(key, '1');

  // Calcular stats de la semana pasada
  const prevMonday = new Date(now);
  prevMonday.setDate(now.getDate() - 7);
  const prevSunday = new Date(now);
  prevSunday.setDate(now.getDate() - 1);
  prevSunday.setHours(23,59,59,999);

  // Fetch quests completed last week
  const { data: doneQuests } = await db.from('dungeon_quests')
    .select('xp_reward,type,completed_at')
    .eq('hero_id', hero.hero_id)
    .eq('done', true)
    .gte('completed_at', prevMonday.toISOString())
    .lte('completed_at', prevSunday.toISOString());

  // Fetch pomodoros last week
  const { data: poms } = await db.from('dungeon_pomodoros')
    .select('duration_min')
    .eq('hero_id', hero.hero_id)
    .gte('started_at', prevMonday.toISOString())
    .lte('started_at', prevSunday.toISOString());

  const questCount = doneQuests?.length || 0;
  const xpEarned   = doneQuests?.reduce((s,q) => s + (q.xp_reward||0), 0) || 0;
  const pomMins    = poms?.reduce((s,p) => s + (p.duration_min||25), 0) || 0;
  const pomHours   = Math.round(pomMins / 60 * 10) / 10;
  const streak     = hero?.streak || 0;

  const body = document.getElementById('weeklySummaryBody');
  if (body) {
    body.innerHTML = `
      <p style="text-align:center;color:var(--text2);font-size:13px;margin:0 0 20px">
        Semana ${_weekKey(prevMonday)} · Tu rendimiento en resumen
      </p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
        <div class="stat-card-mini"><div class="scm-val">${questCount}</div><div class="scm-lbl">Misiones</div></div>
        <div class="stat-card-mini"><div class="scm-val" style="color:var(--accent)">${xpEarned.toLocaleString()}</div><div class="scm-lbl">XP ganado</div></div>
        <div class="stat-card-mini"><div class="scm-val" style="color:var(--orange)">${streak}🔥</div><div class="scm-lbl">Racha actual</div></div>
        <div class="stat-card-mini"><div class="scm-val" style="color:var(--teal)">${pomHours}h</div><div class="scm-lbl">Foco (Poms)</div></div>
      </div>
      ${questCount === 0 ? '<p style="text-align:center;color:var(--text3);font-size:12px">Semana tranquila — ¡esta semana lo retomas!</p>' : ''}
    `;
  }
  openModal('weeklySummaryModal');
}

/* Mini stat card CSS (append inline) */
const _wsCss = `.stat-card-mini{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:14px;text-align:center}.scm-val{font-size:22px;font-weight:700;font-family:var(--font-head)}.scm-lbl{font-size:11px;color:var(--text2);margin-top:2px}`;
if (!document.getElementById('_wsCss')) { const s=document.createElement('style'); s.id='_wsCss'; s.textContent=_wsCss; document.head.appendChild(s); }
