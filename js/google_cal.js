'use strict';

const GOOGLE_CAL_SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

let calPreviewEvents = [];
let _calToken = null;

async function connectGoogleCal() {
  const verifier  = _gRandStr(64);
  const challenge = await _gChallenge(verifier);
  localStorage.setItem('cal-pkce-v', verifier);
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID, redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code', scope: GOOGLE_CAL_SCOPES,
    code_challenge: challenge, code_challenge_method: 'S256',
    access_type: 'offline', prompt: 'consent', state: 'cal',
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function handleGoogleCalCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (!code || params.get('state') !== 'cal') return;
  history.replaceState({}, '', window.location.pathname);

  const verifier = localStorage.getItem('cal-pkce-v');
  if (!verifier) return;
  localStorage.removeItem('cal-pkce-v');

  const body = new URLSearchParams({
    code, client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: GOOGLE_REDIRECT_URI, grant_type: 'authorization_code',
    code_verifier: verifier,
  });
  const resp = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body });
  if (!resp.ok) { toast('⚠️', 'Error al conectar Google Calendar.'); return; }
  const t = await resp.json();
  _calToken = t.access_token;
  await saveHero({
    cal_access_token:  t.access_token,
    cal_refresh_token: t.refresh_token || hero.cal_refresh_token,
    cal_token_expiry:  Date.now() + (t.expires_in || 3600) * 1000,
  });
  toast('📅', '¡Google Calendar conectado!');
  await fetchCalendarEvents();
  renderCalendarWidget();
}

async function _calEnsureToken() {
  if (_calToken && Date.now() < (hero?.cal_token_expiry || 0) - 60000) return _calToken;
  if (!hero?.cal_refresh_token) return hero?.cal_access_token || null;
  const body = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET,
    grant_type: 'refresh_token', refresh_token: hero.cal_refresh_token,
  });
  const resp = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body });
  if (!resp.ok) return null;
  const t = await resp.json();
  _calToken = t.access_token;
  await saveHero({ cal_access_token: t.access_token, cal_token_expiry: Date.now() + (t.expires_in || 3600) * 1000 });
  return _calToken;
}

async function fetchCalendarEvents() {
  const token = await _calEnsureToken();
  if (!token) return;
  const now     = new Date().toISOString();
  const in7days = new Date(Date.now() + 7 * 86400000).toISOString();
  try {
    const resp = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(now)}&timeMax=${encodeURIComponent(in7days)}&singleEvents=true&orderBy=startTime&maxResults=20`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!resp.ok) return;
    const data = await resp.json();
    calPreviewEvents = (data.items || []).filter(e => e.status !== 'cancelled');
    renderCalendarWidget();
  } catch(e) { console.warn('Cal fetch:', e); }
}

async function importCalEvent(idx) {
  const ev = calPreviewEvents[idx];
  if (!ev || !hero) return;
  const start    = ev.start?.date || ev.start?.dateTime?.split('T')[0] || null;
  const deadline = start && start >= new Date().toISOString().split('T')[0] ? start : null;
  await addQuest({ name: ev.summary || 'Evento Calendar', notes: ev.description || '', type: 'side', priority: 'normal', deadline, hero_id: hero.id });
  toast('📅', `Importado: ${ev.summary}`);
}

function renderCalendarWidget() {
  const el = document.getElementById('calWidgetContent');
  if (!el) return;
  const connected = !!(hero?.cal_refresh_token || hero?.cal_access_token);
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
      <span style="font-size:13px;font-weight:600">📅 Próximos 7 días</span>
      <div style="display:flex;gap:6px">
        <button class="btn btn-ghost" style="font-size:11px;padding:3px 10px" onclick="fetchCalendarEvents()">🔄</button>
        <button class="btn btn-ghost" style="font-size:11px;padding:3px 10px;color:var(--red)" onclick="disconnectGoogleCal()">Desconectar</button>
      </div>
    </div>
    ${calPreviewEvents.length
      ? `<div class="cal-event-list">${calPreviewEvents.map((ev,i)=>{
          const date = ev.start?.date || ev.start?.dateTime?.split('T')[0] || '';
          return `<div class="cal-event-row">
            <div class="cal-event-info">
              <div class="cal-event-name">${escHtml(ev.summary||'Sin título')}</div>
              <div class="cal-event-date">${date}</div>
            </div>
            <button class="btn btn-ghost" style="font-size:11px;padding:3px 8px;white-space:nowrap" onclick="importCalEvent(${i})">+ Misión</button>
          </div>`;}).join('')}</div>`
      : `<div style="color:var(--text3);font-size:12px;padding:8px 0">Sin eventos próximos. <button class="btn btn-ghost" style="font-size:11px;padding:2px 8px" onclick="fetchCalendarEvents()">Cargar</button></div>`}`;
}

async function disconnectGoogleCal() {
  _calToken = null;
  await saveHero({ cal_access_token: null, cal_refresh_token: null, cal_token_expiry: 0 });
  calPreviewEvents = [];
  renderCalendarWidget();
}
