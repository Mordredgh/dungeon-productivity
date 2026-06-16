'use strict';

/* ── PKCE helpers ─────────────────────────────────────────── */
function _spotifyRandomString(len) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  let out = '';
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length];
  return out;
}

async function _spotifyChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/* ── AUTH ─────────────────────────────────────────────────── */
async function connectSpotify() {
  const verifier = _spotifyRandomString(64);
  sessionStorage.setItem('spotify_verifier', verifier);
  const challenge = await _spotifyChallenge(verifier);
  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: SPOTIFY_REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope: SPOTIFY_SCOPES
  });
  window.location.href = 'https://accounts.spotify.com/authorize?' + params.toString();
}

async function handleSpotifyCallback() {
  const url  = new URL(window.location.href);
  const code = url.searchParams.get('code');
  if (!code) return;
  url.searchParams.delete('code');
  url.searchParams.delete('state');
  window.history.replaceState({}, '', url.pathname + (url.search || ''));

  const verifier = sessionStorage.getItem('spotify_verifier');
  sessionStorage.removeItem('spotify_verifier');
  if (!verifier || !hero) return;

  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code', code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
        client_id: SPOTIFY_CLIENT_ID,
        code_verifier: verifier
      })
    });
    const data = await res.json();
    if (!data.access_token) { toast('⚠️', 'No se pudo conectar Spotify.'); return; }
    spotifyAccessToken = data.access_token;
    spotifyTokenExpiry  = Date.now() + data.expires_in * 1000;
    if (data.refresh_token) {
      hero.spotify_refresh_token = data.refresh_token;
      await saveHero({ spotify_refresh_token: data.refresh_token });
    }
    toast('🎵', '¡Spotify conectado!');
    renderSpotifyWidget();
  } catch { toast('⚠️', 'No se pudo conectar Spotify.'); }
}

async function _spotifyRefresh() {
  if (!hero || !hero.spotify_refresh_token) return false;
  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: hero.spotify_refresh_token,
        client_id: SPOTIFY_CLIENT_ID
      })
    });
    const data = await res.json();
    if (!data.access_token) return false;
    spotifyAccessToken = data.access_token;
    spotifyTokenExpiry  = Date.now() + data.expires_in * 1000;
    if (data.refresh_token) {
      hero.spotify_refresh_token = data.refresh_token;
      await saveHero({ spotify_refresh_token: data.refresh_token });
    }
    return true;
  } catch { return false; }
}

async function _spotifyEnsureToken() {
  if (spotifyAccessToken && Date.now() < spotifyTokenExpiry - 5000) return true;
  return await _spotifyRefresh();
}

function disconnectSpotify() {
  spotifyAccessToken = null; spotifyTokenExpiry = 0;
  if (hero) { hero.spotify_refresh_token = null; saveHero({ spotify_refresh_token: null }); }
  toast('🎵', 'Spotify desconectado.');
  renderSpotifyWidget();
}

/* ── API ──────────────────────────────────────────────────── */
async function _spotifyApi(method, path, body) {
  if (!await _spotifyEnsureToken()) return null;
  const res = await fetch('https://api.spotify.com/v1' + path, {
    method,
    headers: {
      'Authorization': 'Bearer ' + spotifyAccessToken,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (res.status === 401) {
    if (await _spotifyRefresh()) return _spotifyApi(method, path, body);
    return null;
  }
  if (res.status === 404) { toast('🎵', 'Abre Spotify en algún dispositivo primero.'); return null; }
  if (!res.ok) return null;
  try { return await res.json(); } catch { return {}; }
}

/* ── CONTROLS ─────────────────────────────────────────────── */
async function spotifyToggle() {
  const state = await _spotifyApi('GET', '/me/player');
  if (state && state.is_playing) await _spotifyApi('PUT', '/me/player/pause');
  else if (state && state.item)  await _spotifyApi('PUT', '/me/player/play');
  else await _spotifyApi('PUT', '/me/player/play', { context_uri: SPOTIFY_PLAYLIST_URI });
  setTimeout(renderSpotifyWidget, 600);
}
async function spotifyNext() { await _spotifyApi('POST', '/me/player/next'); setTimeout(renderSpotifyWidget, 600); }
async function spotifyPrev() { await _spotifyApi('POST', '/me/player/previous'); setTimeout(renderSpotifyWidget, 600); }

async function spotifyVolume(delta) {
  const state = await _spotifyApi('GET', '/me/player');
  const cur   = state?.device?.volume_percent ?? 50;
  const next  = Math.max(0, Math.min(100, cur + delta));
  await _spotifyApi('PUT', `/me/player/volume?volume_percent=${next}`);
}

/* ── RENDER ───────────────────────────────────────────────── */
async function renderSpotifyWidget() {
  const el = document.getElementById('spotifyPlayer');
  if (!el) return;
  if (!hero || !hero.spotify_refresh_token) {
    el.innerHTML = `<button class="spotify-connect-btn" onclick="connectSpotify()">🎵 Conectar Spotify</button>`;
    return;
  }
  const state = await _spotifyApi('GET', '/me/player');
  const track = state?.item ? `${state.item.name} — ${state.item.artists.map(a => a.name).join(', ')}` : 'Sin reproducción activa';
  el.innerHTML = `
    <div class="spotify-track" title="${escHtml(track)}">${escHtml(track)}</div>
    <div class="spotify-controls">
      <button class="spotify-btn" onclick="spotifyVolume(-10)" title="Bajar volumen">🔉</button>
      <button class="spotify-btn" onclick="spotifyPrev()" title="Anterior">⏮</button>
      <button class="spotify-btn spotify-play" onclick="spotifyToggle()" title="Reproducir/Pausar">${state?.is_playing ? '⏸' : '▶'}</button>
      <button class="spotify-btn" onclick="spotifyNext()" title="Siguiente">⏭</button>
      <button class="spotify-btn" onclick="spotifyVolume(10)" title="Subir volumen">🔊</button>
    </div>
    <button class="spotify-btn" style="width:100%;font-size:10px;opacity:.6" onclick="disconnectSpotify()">Desconectar</button>`;
}
