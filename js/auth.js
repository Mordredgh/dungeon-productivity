'use strict';

/* ── AUTENTICACIÓN (Supabase Auth) ──────────────────────────
   Único usuario autorizado: gerardosilvar16@gmail.com
   db ya está creado en db.js antes de que este módulo corra.
   ─────────────────────────────────────────────────────────── */

function toggleLoginPw() {
  const inp = document.getElementById('loginPassword');
  const btn = document.getElementById('loginPwToggle');
  if (inp.type === 'password') { inp.type = 'text';     btn.textContent = '🙈'; }
  else                         { inp.type = 'password'; btn.textContent = '👁️'; }
}

let _authMode = 'login'; // 'login' | 'signup'

function _setAuthBtnLoading(btn, text) {
  btn.replaceChildren();
  const spin = document.createElement('span');
  spin.className = 'login-spinner';
  btn.append(spin, document.createTextNode(' ' + text));
}
function _setAuthBtnLabel(btn, text) {
  btn.replaceChildren();
  const span = document.createElement('span');
  span.textContent = text;
  const shine = document.createElement('div');
  shine.className = 'login-btn-shine';
  btn.append(span, shine);
}

function toggleSignupMode() {
  _authMode = _authMode === 'login' ? 'signup' : 'login';
  const isSignup = _authMode === 'signup';
  document.getElementById('loginConfirmField').hidden = !isSignup;
  document.getElementById('loginRecoveryBtn').hidden = isSignup;
  _setAuthBtnLabel(document.getElementById('loginBtn'), isSignup ? '✨ Crear cuenta de Héroe' : '⚔️ Entrar al Dungeon');
  document.getElementById('loginSignupToggle').textContent = isSignup ? '¿Ya tienes cuenta? Entrar' : '¿No tienes cuenta? Crear una';
  document.getElementById('loginError').textContent = '';
}
window.toggleSignupMode = toggleSignupMode;

function doAuthSubmit() {
  return _authMode === 'signup' ? doSignup() : doLogin();
}
window.doAuthSubmit = doAuthSubmit;

async function doSignup() {
  const email    = (document.getElementById('loginEmail').value    || '').trim();
  const password =  document.getElementById('loginPassword').value || '';
  const confirm  =  document.getElementById('loginConfirmPassword').value || '';
  const errEl    =  document.getElementById('loginError');
  const btn      =  document.getElementById('loginBtn');

  if (!email || !password) { errEl.textContent = 'Completa todos los campos.'; return; }
  if (password.length < 8) { errEl.textContent = 'Usa al menos 8 caracteres en la contraseña.'; return; }
  if (password !== confirm) { errEl.textContent = 'Las contraseñas no coinciden.'; return; }

  errEl.textContent = '';
  btn.disabled = true;
  _setAuthBtnLoading(btn, 'Creando cuenta...');

  const { data, error } = await db.auth.signUp({ email, password });

  if (error) {
    errEl.textContent = /already registered|already exists/i.test(error.message || '')
      ? 'Ya existe una cuenta con ese correo. Inicia sesión.'
      : (error.message || 'No se pudo crear la cuenta. Verifica el correo e inténtalo de nuevo.');
    btn.disabled = false;
    _setAuthBtnLabel(btn, '✨ Crear cuenta de Héroe');
    return;
  }

  if (data.session) {
    document.getElementById('loginOverlay').classList.add('login-fade-out');
    setTimeout(async () => {
      document.getElementById('loginOverlay').style.display = 'none';
      await bootApp();
    }, 400);
  } else {
    btn.disabled = false;
    _setAuthBtnLabel(btn, '✨ Crear cuenta de Héroe');
    toggleSignupMode();
    document.getElementById('loginError').textContent = 'Cuenta creada. Revisa tu correo para confirmarla antes de entrar.';
  }
}
window.doSignup = doSignup;

async function doLogin() {
  const email    = (document.getElementById('loginEmail').value    || '').trim();
  const password =  document.getElementById('loginPassword').value || '';
  const errEl    =  document.getElementById('loginError');
  const btn      =  document.getElementById('loginBtn');

  if (!email || !password) { errEl.textContent = 'Completa todos los campos.'; return; }

  errEl.textContent = '';
  btn.disabled      = true;
  btn.innerHTML     = '<span class="login-spinner"></span> Entrando...';

  const { error } = await db.auth.signInWithPassword({ email, password });

  if (error) {
    errEl.textContent = 'Credenciales incorrectas. Verifica tu email y contraseña.';
    btn.disabled  = false;
    btn.innerHTML = '⚔️ Entrar al Dungeon';
    // shake animation
    const card = document.querySelector('.login-card');
    card.classList.add('login-shake');
    setTimeout(() => card.classList.remove('login-shake'), 500);
    return;
  }

  // Login exitoso — esconder overlay y arrancar app
  document.getElementById('loginOverlay').classList.add('login-fade-out');
  setTimeout(async () => {
    document.getElementById('loginOverlay').style.display = 'none';
    await bootApp();
  }, 400);
}

async function requestPasswordReset() {
  const email = (document.getElementById('loginEmail')?.value || '').trim();
  const errEl = document.getElementById('loginError');
  if (!email) { errEl.textContent = 'Escribe tu correo para enviarte el enlace de recuperación.'; return; }
  const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/?recovery=1' });
  errEl.textContent = error
    ? 'No se pudo enviar el enlace. Revisa el correo e inténtalo de nuevo.'
    : 'Si tu cuenta existe, recibirás un enlace para restablecer tu contraseña.';
}
window.requestPasswordReset = requestPasswordReset;

function showPasswordRecovery() {
  const panel = document.getElementById('loginRecoveryPanel');
  if (!panel) return;
  panel.hidden = false;
  document.getElementById('loginPassword')?.closest('.login-field')?.setAttribute('hidden', '');
  document.getElementById('loginBtn')?.setAttribute('hidden', '');
  document.querySelector('.login-recovery')?.setAttribute('hidden', '');
  document.getElementById('loginError').textContent = 'Enlace válido. Define una contraseña nueva.';
  document.getElementById('recoveryPassword')?.focus();
}

async function completePasswordRecovery() {
  const password = document.getElementById('recoveryPassword')?.value || '';
  const errEl = document.getElementById('loginError');
  if (password.length < 8) { errEl.textContent = 'Usa al menos 8 caracteres.'; return; }
  const { error } = await db.auth.updateUser({ password });
  if (error) { errEl.textContent = 'No se pudo actualizar la contraseña. Solicita un enlace nuevo.'; return; }
  errEl.textContent = 'Contraseña actualizada. Entrando al Dungeon…';
  document.getElementById('loginOverlay').classList.add('login-fade-out');
  setTimeout(async () => { document.getElementById('loginOverlay').style.display = 'none'; await bootApp(); }, 400);
}
window.completePasswordRecovery = completePasswordRecovery;

if (new URLSearchParams(window.location.search).get('recovery') === '1') {
  setTimeout(showPasswordRecovery, 0);
}
db.auth.onAuthStateChange((event) => { if (event === 'PASSWORD_RECOVERY') showPasswordRecovery(); });

async function doLogout() {
  if (!confirm('¿Cerrar sesión del Dungeon?')) return;
  await db.auth.signOut();
  window.location.reload();
}

// Enter en email → foco en password; Enter en password → login
document.getElementById('loginEmail').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('loginPassword').focus();
});
document.getElementById('loginPassword').addEventListener('keydown', e => {
  if (e.key === 'Enter') doAuthSubmit();
});
document.getElementById('loginConfirmPassword')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') doAuthSubmit();
});
