'use strict';

function _buildPatternsPrompt() {
  const since = new Date(Date.now() - 29 * 86400000);
  const recent = quests.filter(q => q.done && q.done_at && new Date(q.done_at) >= since);
  const recentPoms = pomodoros.filter(p => p.started_at && new Date(p.started_at) >= since);

  const byWeekday = {};
  recent.forEach(q => {
    const wd = new Date(q.done_at).toLocaleDateString('es-MX', { weekday: 'long' });
    byWeekday[wd] = (byWeekday[wd] || 0) + 1;
  });
  const byType = {};
  recent.forEach(q => { byType[q.type] = (byType[q.type] || 0) + 1; });
  const byHour = {};
  recentPoms.forEach(p => {
    const h = new Date(p.started_at).getHours();
    byHour[h] = (byHour[h] || 0) + 1;
  });

  const weekdayLines = Object.entries(byWeekday).sort((a, b) => b[1] - a[1]).map(([d, c]) => `${d}: ${c}`).join(', ') || '(sin datos)';
  const typeLines    = Object.entries(byType).map(([t, c]) => `${t}: ${c}`).join(', ') || '(sin datos)';
  const peakHour     = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0];

  return `Eres un analista de productividad. Con estos datos reales de los últimos 30 días de un usuario, detecta 2-3 patrones útiles y concretos (no genéricos). Responde en frases cortas y directas, sin relleno ni saludos, una por línea.

Misiones completadas por día de la semana: ${weekdayLines}
Misiones completadas por tipo: ${typeLines}
Hora pico de pomodoros: ${peakHour ? `${peakHour[0]}:00 (${peakHour[1]} pomodoros)` : '(sin datos)'}
Total misiones completadas (30d): ${recent.length}
Racha actual: ${hero?.streak || 0} días`;
}

async function generatePatternAnalysis(force) {
  if (!hero) return;
  const today = new Date().toISOString().split('T')[0];
  if (!force && hero.patterns_date === today && hero.patterns_text) { renderPatterns(); return; }

  const el = document.getElementById('patternsContent');
  if (el) el.innerHTML = `<div style="color:var(--text3);font-size:12px">🔮 Analizando tus últimos 30 días...</div>`;

  let text = '';
  try {
    const r = await fetch('/openclaw/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: _buildPatternsPrompt() })
    });
    const data = await r.json();
    text = (data.reply || '').trim();
  } catch {}

  if (!text) {
    if (el) el.innerHTML = `<div style="color:var(--text3);font-size:12px">⚠️ No se pudo generar el análisis. Intenta de nuevo.</div>`;
    return;
  }

  hero.patterns_text = text; hero.patterns_date = today;
  await saveHero({ patterns_text: text, patterns_date: today });
  renderPatterns();
}

function checkWeeklyPatternAnalysis() {
  if (!hero) return;
  const today = new Date().toISOString().split('T')[0];
  if (hero.patterns_date === today) return;
  const isMonday = new Date().getDay() === 1;
  if (!isMonday) return;
  generatePatternAnalysis(true);
}

/* ── REPORTE MENSUAL ─────────────────────────────────── */
function _buildMonthlyPrompt() {
  const now   = new Date();
  const since = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const until = new Date(now.getFullYear(), now.getMonth(), 1);
  const recent     = quests.filter(q => q.done && q.done_at && new Date(q.done_at) >= since && new Date(q.done_at) < until);
  const recentPoms = pomodoros.filter(p => p.started_at && new Date(p.started_at) >= since && new Date(p.started_at) < until);
  const pomMins    = recentPoms.reduce((s, p) => s + (p.duration_min || 25), 0);

  let achDates = {};
  try { achDates = JSON.parse(hero.achievement_dates || '{}'); } catch {}
  const monthStr  = since.toISOString().slice(0, 7);
  const newAchs   = Object.values(achDates).filter(d => d && d.startsWith(monthStr)).length;
  const typeLines = Object.entries(recent.reduce((a, q) => { a[q.type] = (a[q.type] || 0) + 1; return a; }, {}))
    .map(([t, c]) => `${t}:${c}`).join(', ') || '(sin datos)';

  return `Eres un analista de productividad. Genera un reporte mensual motivador pero honesto en 4-5 puntos clave. Datos del mes pasado:
- Misiones completadas: ${recent.length}
- Pomodoros: ${recentPoms.length} (${(pomMins / 60).toFixed(1)} horas de foco)
- Nivel actual: ${hero._level || 1}, Racha: ${hero.streak || 0} días
- Logros nuevos este mes: ${newAchs}
- Por tipo: ${typeLines}
Responde directo, sin saludos, una línea por punto.`;
}

async function generateMonthlyReport(force) {
  if (!hero) return;
  const now      = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;
  if (!force && hero.monthly_report_date === monthKey && hero.monthly_report_text) { renderMonthlyReport(); return; }

  const el = document.getElementById('monthlyReportContent');
  if (el) el.innerHTML = `<div style="color:var(--text3);font-size:12px">📊 Generando reporte mensual...</div>`;

  let text = '';
  try {
    const r    = await fetch('/openclaw/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: _buildMonthlyPrompt() }) });
    const data = await r.json();
    text = (data.reply || '').trim();
  } catch {}

  if (!text) { if (el) el.innerHTML = `<div style="color:var(--text3);font-size:12px">⚠️ No se pudo generar el reporte.</div>`; return; }

  hero.monthly_report_text = text; hero.monthly_report_date = monthKey;
  await saveHero({ monthly_report_text: text, monthly_report_date: monthKey });
  renderMonthlyReport();
}

function checkMonthlyReport() {
  if (!hero || new Date().getDate() !== 1) return;
  const now      = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;
  if (hero.monthly_report_date !== monthKey) generateMonthlyReport();
}

function renderMonthlyReport() {
  const el = document.getElementById('monthlyReportContent');
  if (!el) return;
  if (!hero?.monthly_report_text) {
    el.innerHTML = `<div style="color:var(--text3);font-size:12px">Sin reporte todavía. Se genera el 1° de cada mes.</div>`;
    return;
  }
  el.innerHTML = hero.monthly_report_text.split('\n').filter(Boolean).map(line =>
    `<div class="pattern-line">📊 ${escHtml(line.replace(/^[-*•]\s*/, ''))}</div>`
  ).join('');
}

function renderPatterns() {
  const el = document.getElementById('patternsContent');
  if (!el || !hero) return;
  if (!hero.patterns_text) {
    el.innerHTML = `<div style="color:var(--text3);font-size:12px">Sin análisis todavía.</div>`;
    return;
  }
  el.innerHTML = hero.patterns_text.split('\n').filter(Boolean).map(line =>
    `<div class="pattern-line">🔹 ${escHtml(line.replace(/^[-*•]\s*/, ''))}</div>`
  ).join('');
}
