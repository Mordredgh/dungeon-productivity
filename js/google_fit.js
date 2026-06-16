'use strict';

/* ── GOOGLE FIT INTEGRATION ──────────────────────────────────
   OAuth2 PKCE flow → Google Fitness API.
   Steps del día → XP bonus diario.
   SETUP: En config.js define GOOGLE_CLIENT_ID con tu client ID
   de Google Cloud Console (API Fitness habilitada, redirect URI
   = https://dungeon.mordredgh.com/).
   ─────────────────────────────────────────────────────────── */

const GOOGLE_FIT_SCOPES = 'https://www.googleapis.com/auth/fitness.activity.read';

let fitSteps      = 0;
let fitSynced     = false;

function _fitRandomStr(len) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  return Array.from(crypto.getRandomValues(new Uint8Array(len)), b => chars[b % chars.length]).join('');
}

async function _fitChallenge(verifier) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

async function connectGoogleFit() {
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'TU_GOOGLE_CLIENT_ID') {
    toast('⚠️', 'Configura GOOGLE_CLIENT_ID en config.js para usar Google Fit.');
    return;
  }
  const verifier  = _fitRandomStr(64);
  const challenge = await _fitChallenge(verifier);
  localStorage.setItem('fit-pkce-verifier', verifier);

  const params = new URLSearchParams({
    client_id:             GOOGLE_CLIENT_ID,
    redirect_uri:          GOOGLE_REDIRECT_URI,
    response_type:         'code',
    scope:                 GOOGLE_FIT_SCOPES,
    code_challenge:        challenge,
    code_challenge_method: 'S256',
    access_type:           'offline',
    prompt:                'consent',
    state:                 'fit',
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function handleGoogleFitCallback() {
  const params   = new URLSearchParams(window.location.search);
  const code     = params.get('code');
  const state    = params.get('state');
  if (!code || state !== 'fit') return;

  history.replaceState({}, '', window.location.pathname);

  const verifier = localStorage.getItem('fit-pkce-verifier');
  if (!verifier) return;

  const body = new URLSearchParams({
    code, client_id: GOOGLE_CLIENT_ID, redirect_uri: GOOGLE_REDIRECT_URI,
    grant_type: 'authorization_code', code_verifier: verifier,
  });
  const resp = await fetch('https://oauth2.googleapis.com/token', { method:'POST', body });
  if (!resp.ok) return;
  const tokens = await resp.json();
  localStorage.removeItem('fit-pkce-verifier');

  await saveHero({
    fit_access_token:  tokens.access_token,
    fit_refresh_token: tokens.refresh_token || hero.fit_refresh_token,
    fit_token_expiry:  Date.now() + (tokens.expires_in || 3600) * 1000,
  });
  toast('💪', '¡Google Fit conectado! Pasos sincronizados diariamente.');
  await syncGoogleFitSteps();
  renderFitWidget();
}

async function _fitEnsureToken() {
  if (!hero?.fit_access_token) return null;
  if (Date.now() < (hero.fit_token_expiry || 0) - 60000) return hero.fit_access_token;
  if (!hero.fit_refresh_token) return null;

  const body = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID, grant_type: 'refresh_token',
    refresh_token: hero.fit_refresh_token,
  });
  const resp = await fetch('https://oauth2.googleapis.com/token', { method:'POST', body });
  if (!resp.ok) return null;
  const tokens = await resp.json();
  await saveHero({
    fit_access_token: tokens.access_token,
    fit_token_expiry: Date.now() + (tokens.expires_in || 3600) * 1000,
  });
  return tokens.access_token;
}

async function syncGoogleFitSteps() {
  const today = new Date().toISOString().split('T')[0];
  const lastSync = localStorage.getItem('fit-sync-date');
  if (lastSync === today && fitSynced) return;

  const token = await _fitEnsureToken();
  if (!token) return;

  const startMs = new Date(today + 'T00:00:00').getTime();
  const endMs   = Date.now();

  const body = {
    aggregateBy: [{ dataTypeName: 'com.google.step_count.delta' }],
    bucketByTime: { durationMillis: endMs - startMs },
    startTimeMillis: startMs,
    endTimeMillis: endMs,
  };

  const resp = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) return;

  const data = await resp.json();
  fitSteps = 0;
  data.bucket?.forEach(b => b.dataset?.forEach(ds => ds.point?.forEach(p =>
    p.value?.forEach(v => { fitSteps += v.intVal || 0; })
  )));

  localStorage.setItem('fit-sync-date', today);
  fitSynced = true;

  await _applyFitXP(today);
  renderFitWidget();
}

async function _applyFitXP(today) {
  const key = 'fit-xp-date';
  if (localStorage.getItem(key) === today) return;
  localStorage.setItem(key, today);

  let bonus = 0;
  if (fitSteps >= 10000) bonus = 80;
  else if (fitSteps >= 7500) bonus = 50;
  else if (fitSteps >= 5000) bonus = 30;
  else if (fitSteps >= 2500) bonus = 15;

  if (bonus > 0) {
    await addXP(bonus, 'side', null);
    toast('💪', `¡${fitSteps.toLocaleString()} pasos hoy! +${bonus} XP`);
  }
}

function renderFitWidget() {
  const el = document.getElementById('fitWidgetContent');
  if (!el) return;

  const connected = !!(hero?.fit_access_token);
  const today     = new Date().toISOString().split('T')[0];
  const synced    = localStorage.getItem('fit-sync-date') === today;

  if (!connected) {
    el.innerHTML = `
      <div class="integration-connect">
        <div class="integration-icon">💪</div>
        <div class="integration-title">Google Fit</div>
        <div class="integration-desc">Sincroniza tus pasos diarios para ganar XP. 10,000 pasos = +80 XP.</div>
        <button class="btn btn-primary" onclick="connectGoogleFit()">Conectar Google Fit</button>
      </div>`;
    return;
  }

  const pct = Math.min(100, Math.round((fitSteps / 10000) * 100));
  el.innerHTML = `
    <div class="fit-connected">
      <div class="fit-steps-num">${fitSynced ? fitSteps.toLocaleString() : '—'}</div>
      <div class="fit-steps-label">pasos hoy</div>
      <div class="fit-bar-wrap">
        <div class="fit-bar-fill" style="width:${pct}%"></div>
        <span class="fit-bar-goal">10,000</span>
      </div>
      <div class="fit-milestones">
        ${[2500,5000,7500,10000].map(n=>`<span class="fit-ms ${fitSteps>=n?'fit-ms-done':''}">+${n>=10000?80:n>=7500?50:n>=5000?30:15}XP</span>`).join('')}
      </div>
      <button class="btn btn-ghost" style="margin-top:8px;font-size:11px" onclick="syncGoogleFitSteps()">🔄 Sincronizar</button>
    </div>`;
}
