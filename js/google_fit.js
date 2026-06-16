'use strict';

const GOOGLE_FIT_SCOPES = 'https://www.googleapis.com/auth/fitness.activity.read';

let fitSteps  = 0;
let fitSynced = false;
let _fitToken = null;

function _gRandStr(len) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  return Array.from(crypto.getRandomValues(new Uint8Array(len)), b => chars[b % chars.length]).join('');
}
async function _gChallenge(v) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v));
  return btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

async function connectGoogleFit() {
  const verifier  = _gRandStr(64);
  const challenge = await _gChallenge(verifier);
  localStorage.setItem('fit-pkce-v', verifier);
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID, redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code', scope: GOOGLE_FIT_SCOPES,
    code_challenge: challenge, code_challenge_method: 'S256',
    access_type: 'offline', prompt: 'consent', state: 'fit',
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function handleGoogleFitCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (!code || params.get('state') !== 'fit') return;
  history.replaceState({}, '', window.location.pathname);

  const verifier = localStorage.getItem('fit-pkce-v');
  if (!verifier) return;
  localStorage.removeItem('fit-pkce-v');

  const { data: { session } } = await db.auth.getSession();
  const authToken = session?.access_token || SUPA_KEY;
  const resp = await fetch(`${SUPA_URL}/functions/v1/google-oauth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
    body: JSON.stringify({ action: 'exchange', code, redirect_uri: GOOGLE_REDIRECT_URI, code_verifier: verifier }),
  });
  if (!resp.ok) { toast('⚠️', 'Error al conectar Google Fit.'); return; }
  const t = await resp.json();
  _fitToken = t.access_token;
  await saveHero({
    fit_access_token:  t.access_token,
    fit_refresh_token: t.refresh_token || hero.fit_refresh_token,
    fit_token_expiry:  Date.now() + (t.expires_in || 3600) * 1000,
  });
  toast('💪', '¡Google Fit conectado!');
  await syncGoogleFitSteps();
  renderFitWidget();
}

async function _fitEnsureToken() {
  if (_fitToken && Date.now() < (hero?.fit_token_expiry || 0) - 60000) return _fitToken;
  if (!hero?.fit_refresh_token) return hero?.fit_access_token || null;
  const { data: { session } } = await db.auth.getSession();
  const authToken = session?.access_token || SUPA_KEY;
  const resp = await fetch(`${SUPA_URL}/functions/v1/google-oauth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
    body: JSON.stringify({ action: 'refresh', refresh_token: hero.fit_refresh_token }),
  });
  if (!resp.ok) return null;
  const t = await resp.json();
  _fitToken = t.access_token;
  await saveHero({ fit_access_token: t.access_token, fit_token_expiry: Date.now() + (t.expires_in || 3600) * 1000 });
  return _fitToken;
}

async function syncGoogleFitSteps() {
  const token = await _fitEnsureToken();
  if (!token) return;
  const today = new Date().toISOString().split('T')[0];
  if (localStorage.getItem('fit-sync-date') === today && fitSynced) return;

  try {
    const startMs = new Date(today + 'T00:00:00').getTime();
    const resp = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aggregateBy: [{ dataTypeName: 'com.google.step_count.delta' }],
        bucketByTime: { durationMillis: Date.now() - startMs },
        startTimeMillis: startMs, endTimeMillis: Date.now(),
      }),
    });
    if (!resp.ok) return;
    const data = await resp.json();
    fitSteps = 0;
    data.bucket?.forEach(b => b.dataset?.forEach(ds => ds.point?.forEach(p =>
      p.value?.forEach(v => { fitSteps += v.intVal || 0; }))));
    localStorage.setItem('fit-sync-date', today);
    fitSynced = true;
    await _applyFitXP(today);
    renderFitWidget();
  } catch(e) { console.warn('Fit sync:', e); }
}

async function _applyFitXP(today) {
  if (localStorage.getItem('fit-xp-date') === today) return;
  localStorage.setItem('fit-xp-date', today);
  const bonus = fitSteps >= 10000 ? 80 : fitSteps >= 7500 ? 50 : fitSteps >= 5000 ? 30 : fitSteps >= 2500 ? 15 : 0;
  if (bonus > 0) { await addXP(bonus, 'side', null); toast('💪', `¡${fitSteps.toLocaleString()} pasos! +${bonus} XP`); }
}

function renderFitWidget() {
  const el = document.getElementById('fitWidgetContent');
  if (!el) return;
  const connected = !!(hero?.fit_refresh_token || hero?.fit_access_token);
  const pct = Math.min(100, Math.round((fitSteps / 10000) * 100));
  if (!connected) {
    el.innerHTML = `
      <div class="integration-connect">
        <div class="integration-icon">💪</div>
        <div class="integration-title">Google Fit</div>
        <div class="integration-desc">Sincroniza tus pasos diarios para ganar XP.<br>10,000 pasos = +80 XP.</div>
        <button class="btn btn-primary" onclick="connectGoogleFit()">Conectar Google Fit</button>
      </div>`;
    return;
  }
  const today  = new Date().toISOString().split('T')[0];
  const synced = localStorage.getItem('fit-sync-date') === today;
  el.innerHTML = `
    <div class="fit-connected">
      <div class="fit-steps-num">${synced ? fitSteps.toLocaleString() : '—'}</div>
      <div class="fit-steps-label">pasos hoy</div>
      <div class="fit-bar-wrap"><div class="fit-bar-fill" style="width:${pct}%"></div><span class="fit-bar-goal">10k</span></div>
      <div class="fit-milestones">
        ${[2500,5000,7500,10000].map(n=>`<span class="fit-ms ${fitSteps>=n?'fit-ms-done':''}">${n>=10000?'+80':n>=7500?'+50':n>=5000?'+30':'+15'} XP</span>`).join('')}
      </div>
      <div style="display:flex;gap:8px;margin-top:10px;justify-content:center">
        <button class="btn btn-ghost" style="font-size:11px;padding:3px 10px" onclick="syncGoogleFitSteps()">🔄 Sync</button>
        <button class="btn btn-ghost" style="font-size:11px;padding:3px 10px;color:var(--red)" onclick="disconnectGoogleFit()">Desconectar</button>
      </div>
    </div>`;
}

async function disconnectGoogleFit() {
  _fitToken = null;
  await saveHero({ fit_access_token: null, fit_refresh_token: null, fit_token_expiry: 0 });
  renderFitWidget();
}
