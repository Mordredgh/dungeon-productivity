'use strict';

/* ── GOOGLE CALENDAR INTEGRATION ────────────────────────────
   Flujo implícito (response_type=token) — sin client_secret.
   ─────────────────────────────────────────────────────────── */

const GOOGLE_CAL_SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

let calPreviewEvents = [];
let _calToken = null;

function connectGoogleCal() {
  const params = new URLSearchParams({
    client_id:     GOOGLE_CLIENT_ID,
    redirect_uri:  GOOGLE_REDIRECT_URI,
    response_type: 'token',
    scope:         GOOGLE_CAL_SCOPES,
    state:         'cal',
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function handleGoogleCalCallback() {
  const hash  = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const token = hash.get('access_token');
  const state = hash.get('state');
  if (!token || state !== 'cal') return;

  history.replaceState({}, '', window.location.pathname);

  const expiry = Date.now() + parseInt(hash.get('expires_in') || '3600') * 1000;
  _calToken = token;
  await saveHero({ cal_access_token: token, cal_token_expiry: expiry });
  toast('📅', '¡Google Calendar conectado!');
  await fetchCalendarEvents();
  renderCalendarWidget();
}

function _calGetToken() {
  if (_calToken) return _calToken;
  if (hero?.cal_access_token && Date.now() < (hero.cal_token_expiry || 0)) {
    _calToken = hero.cal_access_token;
    return _calToken;
  }
  return null;
}

async function fetchCalendarEvents() {
  const token = _calGetToken();
  if (!token) return;

  const now     = new Date().toISOString();
  const in7days = new Date(Date.now() + 7 * 86400000).toISOString();
  const url     = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(now)}&timeMax=${encodeURIComponent(in7days)}&singleEvents=true&orderBy=startTime&maxResults=20`;

  try {
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (resp.status === 401) {
      _calToken = null;
      await saveHero({ cal_access_token: null, cal_token_expiry: 0 });
      renderCalendarWidget();
      return;
    }
    if (!resp.ok) return;
    const data = await resp.json();
    calPreviewEvents = (data.items || []).filter(e => e.status !== 'cancelled');
    renderCalendarWidget();
  } catch (e) {
    console.warn('Google Calendar fetch error:', e);
  }
}

async function importCalEvent(idx) {
  const ev = calPreviewEvents[idx];
  if (!ev || !hero) return;

  const start    = ev.start?.date || ev.start?.dateTime?.split('T')[0] || null;
  const deadline = start && start >= new Date().toISOString().split('T')[0] ? start : null;

  await addQuest({
    name:     ev.summary || 'Evento de Google Calendar',
    notes:    ev.description || '',
    type:     'side',
    priority: 'normal',
    deadline,
    hero_id:  hero.id,
  });
  toast('📅', `Importado: ${ev.summary}`);
}

function renderCalendarWidget() {
  const el = document.getElementById('calWidgetContent');
  if (!el) return;

  const token = _calGetToken();
  if (!token) {
    el.innerHTML = `
      <div class="integration-connect">
        <div class="integration-icon">📅</div>
        <div class="integration-title">Google Calendar</div>
        <div class="integration-desc">Importa eventos de los próximos 7 días como misiones en tu Dungeon.</div>
        <button class="btn btn-primary" onclick="connectGoogleCal()">Conectar Calendar</button>
      </div>`;
    return;
  }

  el.innerHTML = `
    <div class="cal-header">
      <span style="font-size:13px;font-weight:600">📅 Próximos 7 días</span>
      <div style="display:flex;gap:6px">
        <button class="btn btn-ghost" style="font-size:11px;padding:3px 10px" onclick="fetchCalendarEvents()">🔄</button>
        <button class="btn btn-ghost" style="font-size:11px;padding:3px 10px;color:var(--red)" onclick="disconnectGoogleCal()">Desconectar</button>
      </div>
    </div>
    ${calPreviewEvents.length
      ? `<div class="cal-event-list">
          ${calPreviewEvents.map((ev, i) => {
            const date = ev.start?.date || ev.start?.dateTime?.split('T')[0] || '';
            return `
              <div class="cal-event-row">
                <div class="cal-event-info">
                  <div class="cal-event-name">${escHtml(ev.summary || 'Sin título')}</div>
                  <div class="cal-event-date">${date}</div>
                </div>
                <button class="btn btn-ghost" style="font-size:11px;padding:3px 8px;white-space:nowrap" onclick="importCalEvent(${i})">+ Misión</button>
              </div>`;
          }).join('')}
         </div>`
      : `<div style="color:var(--text3);font-size:12px;padding:8px 0">
           No hay eventos próximos.
           <button class="btn btn-ghost" style="font-size:11px;padding:2px 8px;margin-left:6px" onclick="fetchCalendarEvents()">Cargar</button>
         </div>`}`;
}

async function disconnectGoogleCal() {
  _calToken = null;
  await saveHero({ cal_access_token: null, cal_token_expiry: 0 });
  calPreviewEvents = [];
  renderCalendarWidget();
}
