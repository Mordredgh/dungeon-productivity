'use strict';
/* ============================================================
   ORACLE — Oráculo Arcano (extracted from events.js)
   ============================================================ */

   ORÁCULO ARCANO — OpenClaw via proxy
   ============================================================ */
let _oracleLoaded = false;

function openOracle() {
  document.getElementById('oraclePanel').classList.add('open');
  document.getElementById('oracleOverlay').classList.add('open');
  if (!_oracleLoaded) _loadOracleHistory();
}

function closeOracle() {
  document.getElementById('oraclePanel').classList.remove('open');
  document.getElementById('oracleOverlay').classList.remove('open');
}

function _buildOracleContext(userText) {
  const today      = new Date().toISOString().split('T')[0];
  const pending    = quests.filter(q => !q.done).slice(0, 15);
  const todayPoms  = pomodoros.filter(p => p.started_at && p.started_at.startsWith(today)).length;
  const todayDone  = quests.filter(q => q.done && q.done_at && q.done_at.startsWith(today)).length;
  const typeMap    = { main:'épica', side:'encargo', daily:'búsqueda', weekly:'crónica' };

  const questLines = pending.length
    ? pending.map(q =>
        `- [${typeMap[q.type] || q.type}] ${q.name}` +
        (q.priority && q.priority !== 'normal' && q.priority !== 'comun' ? ` [${(RARITY_LABELS||{})[q.priority]||q.priority}]` : '') +
        (q.deadline ? ` (deadline: ${q.deadline})` : '')
      ).join('\n')
    : '- (ninguna pendiente)';

  return `[CONTEXTO DEL HÉROE - ${new Date().toLocaleDateString('es-MX')}]
Nivel ${hero ? hero.level : '?'} | Racha: ${hero ? (hero.streak || 0) : 0} días | HP: ${hero ? hero.hp : 100}/${hero ? hero.max_hp : 100}
Hoy: ${todayDone} misiones completadas · ${todayPoms} pomodoros
Misiones pendientes (${pending.length}):
${questLines}
[FIN CONTEXTO]

${userText}`;
}

function _oracleAppend(role, text) {
  const msgs = document.getElementById('oracleMsgs');
  const el   = document.createElement('div');
  el.className = 'oracle-msg ' + role;
  el.textContent = text;
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
  return el;
}

function _oracleAddActions(replyText) {
  const msgs = document.getElementById('oracleMsgs');
  const wrap = document.createElement('div');
  wrap.className = 'oracle-msg-actions';

  const btn = document.createElement('button');
  btn.className   = 'oracle-action-btn';
  btn.textContent = '➕ Crear misión';
  const suggestion = replyText.split('\n')[0].replace(/^[-*•#>\s]+/, '').trim().slice(0, 150);
  btn.addEventListener('click', () => _oracleCreateQuest(suggestion));
  wrap.appendChild(btn);

  msgs.appendChild(wrap);
  msgs.scrollTop = msgs.scrollHeight;
}

function _oracleCreateQuest(suggestion) {
  closeOracle();
  switchView('quests');
  openModal('quickAddModal');
  setTimeout(() => {
    const input = document.getElementById('qName');
    if (input) { input.value = suggestion; input.focus(); input.select(); }
  }, 50);
  toast('➕', 'Edita el nombre y pulsa Crear Misión');
}

async function _loadOracleHistory() {
  const loading = document.getElementById('oracleLoading');
  const msgs    = document.getElementById('oracleMsgs');
  try {
    const r    = await fetch('/openclaw/history');
    const data = await r.json();
    if (loading) loading.remove();
    _oracleLoaded = true;
    const items = (data.items || []).slice(-20);
    if (!items.length) {
      const ph = document.createElement('div');
      ph.className   = 'oracle-loading';
      ph.textContent = '🔮 El oráculo aguarda tu primera consulta...';
      msgs.appendChild(ph);
      return;
    }
    items.forEach(item => {
      let text = typeof item.content === 'string'
        ? item.content
        : (Array.isArray(item.content) ? item.content.filter(b => b.type === 'text').map(b => b.text).join('') : '');
      if (!text) return;
      _oracleAppend(item.role === 'user' ? 'user' : 'assistant', text);
    });
    msgs.scrollTop = msgs.scrollHeight;
  } catch {
    if (loading) loading.textContent = '⚠️ No se pudo conectar con el oráculo.';
  }
}

async function oracleSend() {
  const input   = document.getElementById('oracleInput');
  const sendBtn = document.getElementById('oracleSend');
  const text    = (input.value || '').trim();
  if (!text || sendBtn.disabled) return;

  input.value      = '';
  input.disabled   = true;
  sendBtn.disabled = true;

  _oracleAppend('user', text);
  const thinkEl = _oracleAppend('thinking', '🔮 El oráculo medita...');

  try {
    const r    = await fetch('/openclaw/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: _buildOracleContext(text) })
    });
    thinkEl.remove();
    const data  = await r.json();
    const reply = data.reply || '⚠️ Sin respuesta del oráculo.';
    _oracleAppend('assistant', reply);
    _oracleAddActions(reply);
  } catch {
    thinkEl.remove();
    _oracleAppend('assistant', '⚠️ Error al consultar el oráculo.');
  } finally {
    input.disabled   = false;
    sendBtn.disabled = false;
    input.focus();
  }
}

const _ORACLE_QUICK_PROMPTS = {
  plan:     'Planea mi día de hoy priorizando mis misiones. Dame un plan de acción concreto con orden de ataque.',
  priority: '¿Cuál de mis misiones pendientes debo atacar primero ahora mismo y por qué?',
  summary:  'Dame un resumen motivacional de lo que logré hoy y qué me falta para mañana.'
};

function oracleQuickPrompt(type) {
  const text = _ORACLE_QUICK_PROMPTS[type];
  if (!text) return;
  openOracle();
  const input = document.getElementById('oracleInput');
  if (input) { input.value = text; input.focus(); }
}

function oracleQuestAdvice(questId) {
  const q = quests.find(x => x.id === questId);
  if (!q) return;
  const typeMap = { main:'épica', side:'encargo', daily:'búsqueda', weekly:'crónica' };
  const parts = [
    `¿Cómo abordo esta misión: "${q.name}"?`,
    `Tipo: ${typeMap[q.type] || q.type}`,
    q.priority && q.priority !== 'normal' && q.priority !== 'comun' ? `Rareza: ${(RARITY_LABELS||{})[q.priority]||q.priority}` : '',
    q.deadline ? `Deadline: ${q.deadline}` : '',
    q.notes ? `Notas: ${q.notes.slice(0, 200)}` : ''
  ].filter(Boolean).join(' | ');
  openOracle();
  const input = document.getElementById('oracleInput');
  if (input) { input.value = parts; input.focus(); }
}

/* ============================================================
   RETROSPECTIVA SEMANAL (domingos 8pm)
   ============================================================ */
function _weekNumber(d) {
  const jan1 = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
}

function _weekDates() {
  const arr = [];
  for (let i = 6; i >= 0; i--) arr.push(new Date(Date.now() - i * 86400000).toISOString().split('T')[0]);
  return arr;
}

function checkWeeklyRetro() {
  const now = new Date();
  if (now.getDay() !== 0 || now.getHours() < 20) return;
  const key = `dungeon-retro-${now.getFullYear()}-${_weekNumber(now)}`;
  if (localStorage.getItem(key)) return;
  localStorage.setItem(key, '1');
  showWeeklyRetro();
}

function showWeeklyRetro() {
  const dates    = _weekDates();
  const wQuests  = quests.filter(q => q.done && q.done_at && dates.some(d => q.done_at.startsWith(d)));
  const wPoms    = pomodoros.filter(p => p.started_at && dates.some(d => p.started_at.startsWith(d)));
  const wXP      = wQuests.reduce((s, q) => s + (XP_TABLE[q.type] || 50), 0);
  const dayCount = Object.fromEntries(dates.map(d => [d, quests.filter(q => q.done && q.done_at?.startsWith(d)).length]));
  const best     = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0];
  const bestLbl  = best ? new Date(best[0] + 'T12:00').toLocaleDateString('es-MX', { weekday:'long' }) : '-';
  const maxC     = Math.max(...Object.values(dayCount), 1);

  const el = document.getElementById('retroContent');
  if (!el) return;
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="retro-stat"><span class="retro-stat-num" style="color:var(--green)">${wQuests.length}</span><span class="retro-stat-lbl">misiones</span></div>
      <div class="retro-stat"><span class="retro-stat-num" style="color:var(--gold)">${wXP}</span><span class="retro-stat-lbl">XP ganado</span></div>
      <div class="retro-stat"><span class="retro-stat-num" style="color:var(--blue)">${wPoms.length}</span><span class="retro-stat-lbl">pomodoros</span></div>
      <div class="retro-stat"><span class="retro-stat-num" style="color:var(--accent);font-size:16px">${bestLbl}</span><span class="retro-stat-lbl">mejor día</span></div>
    </div>
    <div class="mini-bar-chart">${dates.map(d => `
      <div class="mini-bar-wrap">
        <div class="mini-bar" style="height:${Math.max(2, Math.round((dayCount[d]/maxC)*60))}px;background:var(--accent)"></div>
        <div class="mini-bar-label">${new Date(d+'T12:00').toLocaleDateString('es',{weekday:'narrow'})}</div>
      </div>`).join('')}</div>`;
  openModal('retroModal');
}

function oracleWeeklyReview() {
  const dates   = _weekDates();
  const wQuests = quests.filter(q => q.done && q.done_at && dates.some(d => q.done_at.startsWith(d)));
  const wPoms   = pomodoros.filter(p => p.started_at && dates.some(d => p.started_at.startsWith(d)));
  const wXP     = wQuests.reduce((s, q) => s + (XP_TABLE[q.type] || 50), 0);
  const byType  = ['main','side','daily','weekly'].map(t => `${t}: ${wQuests.filter(q=>q.type===t).length}`).join(', ');
  const pending = quests.filter(q => !q.done).slice(0, 8).map(q => `- ${q.name}`).join('\n');

  const prompt = `Retrospectiva semanal del dungeon:
• Misiones completadas: ${wQuests.length} (${byType})
• XP ganado: ${wXP} | Pomodoros: ${wPoms.length}
Misiones pendientes para la próxima semana:
${pending || '(ninguna)'}

Dame una reflexión honesta: qué funcionó, qué mejorar, y 3 objetivos concretos para la próxima semana.`;

  openOracle();
  const input = document.getElementById('oracleInput');
  if (input) { input.value = prompt; input.focus(); }
}

/* ============================================================
   MORNING BRIEFING + DEADLINE ALERTS
   ============================================================ */
async function _oracleAutoSend(text) {
  openOracle();
  if (!_oracleLoaded) await _loadOracleHistory();
  _oracleAppend('user', text);
  const thinkEl = _oracleAppend('thinking', '🔮 El oráculo medita...');
  try {
    const r = await fetch('/openclaw/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: _buildOracleContext(text) })
    });
    thinkEl.remove();
    const data = await r.json();
    const reply = data.reply || '⚠️ Sin respuesta.';
    _oracleAppend('assistant', reply);
    _oracleAddActions(reply);
  } catch {
    thinkEl.remove();
    _oracleAppend('assistant', '⚠️ Error al contactar el oráculo.');
  }
}

function checkMorningBriefing() {
  const today = new Date().toISOString().split('T')[0];
  if (localStorage.getItem('dungeon-briefing-' + today)) return;
  localStorage.setItem('dungeon-briefing-' + today, '1');
  setTimeout(() => {
    const todayQ   = quests.filter(q => !q.done && (q.deadline === today || q.type === 'daily'));
    const miticas = quests.filter(q => !q.done && q.priority === 'mitico');
    const msg = `${todayQ.length} misiones hoy${miticas.length ? ` · ${miticas.length} míticas` : ''}`;
    toastAction('🌅', msg, 'Briefing →', () => {
      _oracleAutoSend('Buenos días. Briefing de hoy en 3 líneas: mis prioridades más urgentes, algo que no debo olvidar, y una motivación corta.');
    }, 10000);
  }, 2500);
}

function checkDeadlineAlerts() {
  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const alertKey = 'dungeon-alerts-' + today;
  if (localStorage.getItem(alertKey)) return;
  const due = quests.filter(q => !q.done && q.deadline === tomorrow);
  if (!due.length) return;
  localStorage.setItem(alertKey, '1');
  setTimeout(() => {
    due.slice(0, 3).forEach((q, i) => {
      setTimeout(() => toast('⏰', `Vence mañana: "${q.name}"`, 6000), i * 900);
    });
    if (due.length > 3) setTimeout(() => toast('⏰', `+${due.length - 3} misiones más vencen mañana`, 5000), 3 * 900);
  }, 5000);
}

document.getElementById('oracleBtn').addEventListener('click', openOracle);
document.getElementById('oracleSend').addEventListener('click', oracleSend);
document.getElementById('oracleInput').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); oracleSend(); }
});

/* ============================================================
