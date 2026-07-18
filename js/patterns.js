'use strict';

const _TYPE_LABEL = { main: 'épicas', side: 'encargos', daily: 'búsquedas', weekly: 'crónicas' };

function _buildPatternsLocal() {
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

  if (!recent.length && !recentPoms.length) return ['Sin datos suficientes en los últimos 30 días todavía.'];

  const lines = [];
  const bestDay = Object.entries(byWeekday).sort((a, b) => b[1] - a[1])[0];
  if (bestDay) lines.push(`Tu día más productivo es ${bestDay[0]}, con ${bestDay[1]} misión${bestDay[1] > 1 ? 'es' : ''} completadas.`);
  const bestType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];
  if (bestType) lines.push(`Predominan las ${_TYPE_LABEL[bestType[0]] || bestType[0]} (${bestType[1]} de ${recent.length} misiones).`);
  const peakHour = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0];
  if (peakHour) lines.push(`Tu hora pico de enfoque es las ${peakHour[0]}:00h (${peakHour[1]} pomodoros ahí).`);
  lines.push(`Racha actual: ${hero?.streak || 0} días · ${recent.length} misiones completadas en 30 días.`);
  return lines;
}

function generatePatternAnalysis() {
  if (!hero) return;
  const today = new Date().toISOString().split('T')[0];
  const text = _buildPatternsLocal().join('\n');
  hero.patterns_text = text; hero.patterns_date = today;
  saveHero({ patterns_text: text, patterns_date: today });
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

/* ── REPORTE MENSUAL — calculado localmente, sin IA ──── */
function _buildMonthlyLocal() {
  const now   = new Date();
  const since = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const until = new Date(now.getFullYear(), now.getMonth(), 1);
  const recent     = quests.filter(q => q.done && q.done_at && new Date(q.done_at) >= since && new Date(q.done_at) < until);
  const recentPoms = pomodoros.filter(p => p.started_at && new Date(p.started_at) >= since && new Date(p.started_at) < until);
  const pomMins    = recentPoms.reduce((s, p) => s + (p.duration_min || 25), 0);

  let achDates = {};
  try { achDates = JSON.parse(hero.achievement_dates || '{}'); } catch {}
  const monthStr = since.toISOString().slice(0, 7);
  const newAchs  = Object.values(achDates).filter(d => d && d.startsWith(monthStr)).length;
  const byType   = recent.reduce((a, q) => { a[q.type] = (a[q.type] || 0) + 1; return a; }, {});
  const typeLines = Object.entries(byType).map(([t, c]) => `${_TYPE_LABEL[t] || t}: ${c}`).join(', ') || 'sin misiones registradas';

  return [
    `${recent.length} misiones completadas el mes pasado.`,
    `${recentPoms.length} pomodoros · ${(pomMins / 60).toFixed(1)} horas de foco.`,
    `Nivel actual ${hero._level || 1}, racha de ${hero.streak || 0} días.`,
    `${newAchs} logro${newAchs === 1 ? '' : 's'} nuevo${newAchs === 1 ? '' : 's'} desbloqueado${newAchs === 1 ? '' : 's'} este mes.`,
    `Por tipo: ${typeLines}.`,
  ];
}

function generateMonthlyReport() {
  if (!hero) return;
  const now      = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;
  const text = _buildMonthlyLocal().join('\n');
  hero.monthly_report_text = text; hero.monthly_report_date = monthKey;
  saveHero({ monthly_report_text: text, monthly_report_date: monthKey });
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
