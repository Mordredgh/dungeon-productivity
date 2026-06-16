'use strict';

/* ── PUSH NOTIFICATIONS (Web Push + VAPID) ───────────────────
   Flujo:
   1. Usuario activa notificaciones → subscribeToPush()
   2. Suscripción se guarda en dungeon_push_subscriptions
   3. Eventos del juego llaman dungeonPush(title, body)
   4. La Edge Function send-push envía el push real
   ─────────────────────────────────────────────────────────── */

const VAPID_PUBLIC_KEY = 'BEaYhse8leKsQniLSS9AiCNG3lt4Xz7H_swtNZAHKaJ_rUbIQTHt28pJBqv15yue4MRStrzB3yAa82jg2DoKGNU';

function _urlB64ToUint8(b64) {
  const pad = '='.repeat((4 - b64.length % 4) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    toast('🔔', 'Tu navegador no soporta push notifications.'); return false;
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: _urlB64ToUint8(VAPID_PUBLIC_KEY),
      });
    }
    if (hero && sub) {
      await db.from('dungeon_push_subscriptions').upsert(
        { hero_id: hero.hero_id, subscription: JSON.stringify(sub), updated_at: new Date().toISOString() },
        { onConflict: 'hero_id' }
      );
    }
    toast('🔔', '¡Push activado! Recibirás alertas aunque la app esté cerrada.');
    return true;
  } catch(e) {
    console.warn('Push subscribe:', e);
    toast('⚠️', 'No se pudo activar push: ' + (e.message || e));
    return false;
  }
}

async function unsubscribeFromPush() {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    if (hero) await db.from('dungeon_push_subscriptions').delete().eq('hero_id', hero.hero_id);
    toast('🔕', 'Push notifications desactivadas.');
  } catch(e) { console.warn('Push unsub:', e); }
}

async function isPushSubscribed() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch { return false; }
}

async function dungeonPush(title, body, url = '/') {
  if (!hero) return;
  try {
    await fetch(`${SUPA_URL}/functions/v1/send-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPA_KEY}` },
      body: JSON.stringify({ hero_id: hero.hero_id, title, body, url }),
    });
  } catch(e) { console.warn('dungeonPush:', e); }
}

async function initPush() {
  if (Notification.permission !== 'granted') return;
  const subbed = await isPushSubscribed();
  if (!subbed) await subscribeToPush();
}
