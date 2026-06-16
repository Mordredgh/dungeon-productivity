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
