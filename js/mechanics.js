'use strict';

/* ── APUESTA / CONTRATO DEL DUNGEON ──────────────────────────
   Un solo mecanismo cubre ambos conceptos: apuestas oro a una
   misión; si la completas a tiempo recuperas el doble, si vence
   sin completarse lo pierdes (y opcionalmente tu mascota activa
   también arriesga progreso). */
function openWagerModal(questId) {
  document.getElementById('wagerQuestId').value = questId;
  document.getElementById('wagerGoldAmt').value = '';
  document.getElementById('wagerPetPenalty').checked = false;
  openModal('wagerModal');
}

async function confirmWager() {
  const id  = document.getElementById('wagerQuestId').value;
  const amt = parseInt(document.getElementById('wagerGoldAmt').value) || 0;
  const petPenalty = document.getElementById('wagerPetPenalty').checked;
  const q = quests.find(x => x.id === id);
  if (!q || amt <= 0) return;
  const gold = typeof getGold === 'function' ? getGold() : 0;
  if (amt > gold) { toast('⚠️', 'No tienes suficiente oro para esa apuesta.'); return; }

  addGold(-amt);
  const wager = { gold: amt, petPenalty, resolved: false };
  await db.from('dungeon_quests').update({ wager }).eq('id', id);
  q.wager = wager;
  closeModal('wagerModal');
  renderQuestList();
  toast('🪙', `Apostaste ${amt} oro a "${q.name}". Complétala a tiempo para recuperar el doble.`);
}

async function resolveWagerWin(q) {
  if (!q.wager || q.wager.resolved) return;
  const payout = q.wager.gold * 2;
  addGold(payout);
  q.wager = { ...q.wager, resolved: true };
  await db.from('dungeon_quests').update({ wager: q.wager }).eq('id', q.id);
  toast('🪙', `¡Apuesta ganada! +${payout} oro.`);
}

async function checkWagerExpiry() {
  const today = new Date().toISOString().split('T')[0];
  const expired = quests.filter(q => !q.done && q.wager && !q.wager.resolved && q.deadline && q.deadline < today);
  for (const q of expired) {
    q.wager = { ...q.wager, resolved: true };
    await db.from('dungeon_quests').update({ wager: q.wager }).eq('id', q.id);
    toast('💔', `Contrato incumplido: perdiste ${q.wager.gold} oro de "${q.name}".`);
    if (q.wager.petPenalty && typeof pets !== 'undefined') {
      const active = pets.find(p => p.is_active);
      if (active && active.potions_fed > 0) {
        const newFed = Math.max(0, active.potions_fed - 3);
        await db.from('dungeon_pets').update({ potions_fed: newFed }).eq('id', active.id);
        active.potions_fed = newFed;
        toast('🐾', 'Tu mascota perdió parte de su progreso por el contrato incumplido.');
        if (typeof renderActivePet === 'function') renderActivePet();
      }
    }
  }
  if (expired.length) renderQuestList();
}

/* ── DOBLE O NADA ─────────────────────────────────────────── */
async function activateDoubleOrNothing(questId) {
  if (!hero) return;
  const today = new Date().toISOString().split('T')[0];
  if (hero.doublenada_date === today) { toast('⏳', 'Ya usaste Doble o Nada hoy.'); return; }
  const q = quests.find(x => x.id === questId);
  if (!q || !q.est_time) return;
  hero.doublenada_quest_id    = questId;
  hero.doublenada_started_at  = new Date().toISOString();
  hero.doublenada_date        = today;
  await saveHero({ doublenada_quest_id: questId, doublenada_started_at: hero.doublenada_started_at, doublenada_date: today });
  renderQuestList();
  toast('🎲', `¡Doble o Nada activado! Completa "${q.name}" en menos de ${Math.round(q.est_time/2)}min para ganar el doble.`);
}

function resolveDoubleOrNothing(q) {
  if (!hero || hero.doublenada_quest_id !== q.id) return 1;
  hero.doublenada_quest_id = null;
  saveHero({ doublenada_quest_id: null });
  const elapsedMin = (Date.now() - new Date(hero.doublenada_started_at).getTime()) / 60000;
  if (elapsedMin <= (q.est_time || 0) / 2) {
    toast('🎲', '¡Doble o Nada ganado! Recompensas duplicadas.');
    return 2;
  }
  toast('🎲', 'Doble o Nada perdido: no llegaste a la mitad del tiempo estimado. Sin recompensas.');
  return 0;
}

document.getElementById('confirmWagerBtn').addEventListener('click', confirmWager);
