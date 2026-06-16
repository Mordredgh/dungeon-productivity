'use strict';

/* ── GOOGLE FIT INTEGRATION ──────────────────────────────────
   Flujo implícito (response_type=token) — sin client_secret.
   Token válido 1 hora; el usuario reconecta cuando expira.
   ─────────────────────────────────────────────────────────── */

const GOOGLE_FIT_SCOPES = 'https://www.googleapis.com/auth/fitness.activity.read';

let fitSteps  = 0;
let fitSynced = false;
let _fitToken = null;

function connectGoogleFit() {
  const params = new URLSearchParams({
    client_id:     GOOGLE_CLIENT_ID,
    redirect_uri:  GOOGLE_REDIRECT_URI,
    response_type: 'token',
    scope:         GOOGLE_FIT_SCOPES,
    state:         'fit',
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function handleGoogleFitCallback() {
  /* El token llega en el hash: #access_token=xxx&state=fit&expires_in=3600 */
  const hash  = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const token = hash.get('access_token');
  const state = hash.get('state');
  if (!token || state !== 'fit') return;

  history.replaceState({}, '', window.location.pathname);

  const expiry = Date.now() + parseInt(hash.get('expires_in') || '3600') * 1000;
  _fitToken = token;
  await saveHero({ fit_access_token: token, fit_token_expiry: expiry });
  toast('💪', '¡Google Fit conectado!');
  await syncGoogleFitSteps();
  renderFitWidget();
}

function _fitGetToken() {
  if (_fitToken) return _fitToken;
  if (hero?.fit_access_token && Date.now() < (hero.fit_token_expiry || 0)) {
    _fitToken = hero.fit_access_token;
    return _fitToken;
  }
  return null;
}

async function syncGoogleFitSteps() {
  const token = _fitGetToken();
  if (!token) return;

  const today    = new Date().toISOString().split('T')[0];
  const lastSync = localStorage.getItem('fit-sync-date');
  if (lastSync === today && fitSynced) return;

  const startMs = new Date(today + 'T00:00:00').getTime();
  const endMs   = Date.now();

  try {
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

    if (resp.status === 401) {
      /* Token expirado — limpiar y pedir reconexión */
      _fitToken = null;
      await saveHero({ fit_access_token: null, fit_token_expiry: 0 });
      renderFitWidget();
      return;
    }
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
  } catch (e) {
    console.warn('Google Fit sync error:', e);
  }
}

async function _applyFitXP(today) {
  const key = 'fit-xp-date';
  if (localStorage.getItem(key) === today) return;
  localStorage.setItem(key, today);

  let bonus = 0;
  if      (fitSteps >= 10000) bonus = 80;
  else if (fitSteps >= 7500)  bonus = 50;
  else if (fitSteps >= 5000)  bonus = 30;
  else if (fitSteps >= 2500)  bonus = 15;

  if (bonus > 0) {
    await addXP(bonus, 'side', null);
    toast('💪', `¡${fitSteps.toLocaleString()} pasos hoy! +${bonus} XP`);
  }
}

function renderFitWidget() {
  const el = document.getElementById('fitWidgetContent');
  if (!el) return;

  const token     = _fitGetToken();
  const connected = !!token;
  const today     = new Date().toISOString().split('T')[0];
  const synced    = localStorage.getItem('fit-sync-date') === today;
  const pct       = connected ? Math.min(100, Math.round((fitSteps / 10000) * 100)) : 0;

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

  el.innerHTML = `
    <div class="fit-connected">
      <div class="fit-steps-num">${synced ? fitSteps.toLocaleString() : '—'}</div>
      <div class="fit-steps-label">pasos hoy</div>
      <div class="fit-bar-wrap">
        <div class="fit-bar-fill" style="width:${pct}%"></div>
        <span class="fit-bar-goal">10k</span>
      </div>
      <div class="fit-milestones">
        ${[2500,5000,7500,10000].map(n=>`
          <span class="fit-ms ${fitSteps>=n?'fit-ms-done':''}">
            +${n>=10000?80:n>=7500?50:n>=5000?30:15}XP
          </span>`).join('')}
      </div>
      <div style="display:flex;gap:8px;margin-top:10px;justify-content:center">
        <button class="btn btn-ghost" style="font-size:11px;padding:3px 10px" onclick="syncGoogleFitSteps()">🔄 Sincronizar</button>
        <button class="btn btn-ghost" style="font-size:11px;padding:3px 10px;color:var(--red)" onclick="disconnectGoogleFit()">Desconectar</button>
      </div>
    </div>`;
}

async function disconnectGoogleFit() {
  _fitToken = null;
  await saveHero({ fit_access_token: null, fit_token_expiry: 0 });
  renderFitWidget();
}
