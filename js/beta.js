/* BETA — feedback y telemetría mínima, nunca bloquean el juego. */
let _betaLastEventAt = 0;

async function recordBetaEvent(kind, detail = {}) {
  if (!hero?.id || !window.db) return;
  const now = Date.now();
  if (now - _betaLastEventAt < 4000) return;
  _betaLastEventAt = now;
  const message = String(detail.message || detail.reason || kind).slice(0, 500);
  try {
    await db.from('dungeon_client_events').insert({
      hero_id: hero.id,
      kind: String(kind).slice(0, 48),
      message,
      page: `${location.pathname}${location.hash}`.slice(0, 180),
      http_status: Number.isFinite(Number(detail.status ?? detail.http_status))
        ? Number(detail.status ?? detail.http_status)
        : null,
      meta: { ...detail, message: undefined, reason: undefined, at: now },
    });
  } catch (error) {
    console.warn('No se pudo registrar el evento beta.', error);
  }
}

function openBetaFeedback() {
  document.getElementById('betaFeedbackModal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'betaFeedbackModal';
  modal.className = 'modal active beta-feedback-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'betaFeedbackTitle');
  modal.innerHTML = `
    <div class="modal-content beta-feedback-card">
      <button type="button" class="modal-close" aria-label="Cerrar" onclick="closeBetaFeedback()">×</button>
      <span class="beta-kicker">BETA TESTER</span>
      <h2 id="betaFeedbackTitle">Comparte lo que encontraste</h2>
      <p>Describe el error o mejora. Incluimos la vista actual, nunca tu contraseña.</p>
      <label for="betaFeedbackType">Tipo</label>
      <select id="betaFeedbackType"><option value="bug">Error</option><option value="ux">UX / diseño</option><option value="balance">Balance</option><option value="idea">Idea</option></select>
      <label for="betaFeedbackText">Detalle</label>
      <textarea id="betaFeedbackText" maxlength="2000" minlength="10" placeholder="Qué pasó, qué esperabas y cómo repetirlo."></textarea>
      <div class="beta-feedback-actions"><button type="button" class="btn btn-ghost" onclick="closeBetaFeedback()">Cancelar</button><button type="button" class="btn btn-primary" onclick="submitBetaFeedback()">Enviar reporte</button></div>
    </div>`;
  document.body.appendChild(modal);
  document.getElementById('betaFeedbackText')?.focus();
}

function closeBetaFeedback() { document.getElementById('betaFeedbackModal')?.remove(); }

async function submitBetaFeedback() {
  const text = (document.getElementById('betaFeedbackText')?.value || '').trim();
  const category = document.getElementById('betaFeedbackType')?.value || 'bug';
  if (text.length < 10) { toast('Aviso', 'Escribe al menos 10 caracteres para que podamos reproducirlo.'); return; }
  if (!hero?.id) { toast('Aviso', 'Tu héroe todavía no está listo. Inténtalo de nuevo en un momento.'); return; }
  const { error } = await db.from('dungeon_beta_feedback').insert({
    hero_id: hero.id,
    category,
    message: text,
    page: `${location.pathname}${location.hash}`.slice(0, 180),
  });
  if (error) { toast('Aviso', 'No pudimos enviar el reporte. Revisa tu conexión e inténtalo otra vez.'); return; }
  closeBetaFeedback();
  toast('Recibido', 'Gracias. Tu reporte ya llegó al tablero de beta.');
}

function betaFeedbackRow() {
  return `<div class="chr-config-row" onclick="openBetaFeedback()"><span class="chr-config-row-icon">Reporte</span><span class="chr-config-row-lbl">Enviar feedback de beta</span><span class="chr-config-row-hint">Error, balance o mejora</span></div>`;
}

window.openBetaFeedback = openBetaFeedback;
window.closeBetaFeedback = closeBetaFeedback;
window.submitBetaFeedback = submitBetaFeedback;

window.addEventListener('error', event => {
  recordBetaEvent('window_error', { message: event.message, source: event.filename, line: event.lineno });
});
window.addEventListener('unhandledrejection', event => {
  recordBetaEvent('unhandled_rejection', { reason: String(event.reason?.message || event.reason || 'unknown') });
});
