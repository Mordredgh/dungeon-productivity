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
  if (e.key === 'Enter') doLogin();
});
