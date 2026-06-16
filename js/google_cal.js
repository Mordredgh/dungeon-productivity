'use strict';

/* ── GOOGLE CALENDAR INTEGRATION ────────────────────────────
   OAuth2 PKCE flow → Google Calendar API.
   Importa eventos de los próximos 7 días como misiones.
   SETUP: Mismo GOOGLE_CLIENT_ID de config.js con scope Calendar.
   ─────────────────────────────────────────────────────────── */

const GOOGLE_CAL_SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

async function connectGoogleCal() {
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'TU_GOOGLE_CLIENT_ID') {
    toast('⚠️', 'Configura GOOGLE_CLIENT_ID en config.js para usar Google Calendar.');
    return;
  }
  const verifier  = _fitRandomStr(64);
  const challenge = await _fitChallenge(verifier);
  localStorage.setItem('cal-pkce-verifier', verifier);

  const params = new URLSearchParams({
    client_id:             GOOGLE_CLIENT_ID,
    redirect_uri:          GOOGLE_REDIRECT_URI,
    response_type:         'code',
    scope:                 GOOGLE_CAL_SCOPES,
    code_challenge:        challenge,
    code_challenge_method: 'S256',
    access_type:           'offline',
    prompt:                'consent',
    state:                 'cal',
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function handleGoogleCalCallback() {
  const params = new URLSearchParams(window.location.search);
  const code   = params.get('code');
  const state  = params.get('state');
  if (!code || state !== 'cal') return;

  history.replaceState({}, '', window.location.pathname);
  const verifier = localStorage.getItem('cal-pkce-verifier');
  if (!verifier) return;

  const body = new URLSearchParams({
    code, client_id: GOOGLE_CLIENT_ID, redirect_uri: GOOGLE_REDIRECT_URI,
    grant_type: 'authorization_code', code_verifier: verifier,
  });
  const resp = await fetch('https://oauth2.googleapis.com/token', { method:'POST', body });
  if (!resp.ok) return;
  const tokens = await resp.json();
  localStorage.removeItem('cal-pkce-verifier');

  await saveHero({
    cal_access_token:  tokens.access_token,
    cal_refresh_token: tokens.refresh_token || hero.cal_refresh_token,
    cal_token_expiry:  Date.now() + (tokens.expires_in || 3600) * 1000,
  });
  toast('📅', '¡Google Calendar conectado!');
  renderCalendarWidget();
}

async function _calEnsureToken() {
  if (!hero?.cal_access_token) return null;
  if (Date.now() < (hero.cal_token_expiry || 0) - 60000) return hero.cal_access_token;
  if (!hero.cal_refresh_token) return null;

  const body = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID, grant_type: 'refresh_token',
    refresh_token: hero.cal_refresh_token,
  });
  const resp = await fetch('https://oauth2.googleapis.com/token', { method:'POST', body });
  if (!resp.ok) return null;
  const tokens = await resp.json();
  await saveHero({ cal_access_token: tokens.access_token, cal_token_expiry: Date.now() + (tokens.expires_in||3600)*1000 });
  return tokens.access_token;
}

let calPreviewEvents = [];

async function fetchCalendarEvents() {
  const token = await _calEnsureToken();
  if (!token) return;

  const now     = new Date().toISOString();
  const in7days = new Date(Date.now() + 7 * 86400000).toISOString();
  const url     = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&timeMax=${in7days}&singleEvents=true&orderBy=startTime&maxResults=20`;

  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!resp.ok) return;
  const data = await resp.json();
  calPreviewEvents = (data.items || []).filter(e => e.status !== 'cancelled');
  renderCalendarWidget();
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

  const connected = !!(hero?.cal_access_token);
  if (!connected) {
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
      <span style="font-size:12px;color:var(--text2)">Próximos 7 días</span>
      <button class="btn btn-ghost" style="font-size:11px;padding:3px 10px" onclick="fetchCalendarEvents()">🔄 Actualizar</button>
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
                <button class="btn btn-ghost" style="font-size:11px;padding:3px 8px;white-space:nowrap" onclick="importCalEvent(${i})">+ Importar</button>
              </div>`;
          }).join('')}
         </div>`
      : `<div style="color:var(--text3);font-size:12px;padding:8px 0">No hay eventos en los próximos 7 días. <button class="btn btn-ghost" style="font-size:11px;padding:2px 8px" onclick="fetchCalendarEvents()">Cargar</button></div>`}`;
}
