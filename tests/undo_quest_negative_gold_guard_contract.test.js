const assert = require('node:assert/strict');
const fs = require('node:fs');
const migration = fs.readFileSync('supabase/migrations/20260722_undo_quest_negative_gold_guard.sql', 'utf8');

// Bug real: gastar el oro otorgado antes de deshacer dentro de los 6s clampeaba la
// deuda a 0 en vez de bloquear (item gratis + misión reusable). Debe lanzar excepción
// si el refund dejaría el oro negativo, nunca clampear silenciosamente.
assert.match(migration, /v_new_gold := coalesce\(v_hero\.gold, 0\) - v_reward\.gold_awarded/);
assert.match(migration, /if v_new_gold < 0 then/);
assert.match(migration, /raise exception 'No se puede deshacer: ya gastaste el oro obtenido de esta mision\.'/);

// quests_done solo se decrementa si la misión original SÍ lo había incrementado
// (complete_dungeon_quest no cuenta hábitos negativos).
assert.match(migration, /v_negative_habit := v_quest\.type = 'habit' and lower\(coalesce\(v_quest\.tags, ''\)\) like '%habit-%'/);
assert.match(migration, /quests_done = greatest\(0, coalesce\(v_hero\.quests_done, 0\) - case when v_negative_habit then 0 else 1 end\)/);

console.log('Contrato de guardia de oro negativo en undo_dungeon_quest OK');
