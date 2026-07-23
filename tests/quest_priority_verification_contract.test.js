const assert = require('node:assert/strict');
const fs = require('node:fs');
const migration = fs.readFileSync('supabase/migrations/20260722_quest_priority_and_pomodoro_verification.sql', 'utf8');

// Tope diario server-side por rareza — antes solo vivía en el cliente (quests.js),
// evitable llamando la RPC directo.
assert.match(migration, /v_prio_cap := case v_quest\.priority/);
assert.match(migration, /when 'epico' then 3/);
assert.match(migration, /when 'legendario' then 1/);
assert.match(migration, /when 'mitico' then 1/);
assert.match(migration, /raise exception 'Tope diario de misiones % alcanzado/);

// Prioridad ahora escala XP/oro, no solo cantidad de botín.
assert.match(migration, /v_prio_mult := case v_quest\.priority/);
assert.match(migration, /when 'mitico' then 2\.0/);
assert.match(migration, /v_xp := round\(v_xp \* v_prio_mult\)/);

// Recompensa completa solo con Pomodoro real vinculado ese día; 50% si no.
assert.match(migration, /v_verified := coalesce\(v_quest\.tags,''\) like '%pom-ok-' \|\| to_char\(v_now,'YYYY-MM-DD'\) \|\| '%'/);
assert.match(migration, /v_xp := greatest\(1, round\(v_xp \* 0\.5\)\)/);

// El cliente debe capear también client-side (mensaje amigable) y tagear el pomodoro.
const questsJs = fs.readFileSync('js/quests.js', 'utf8');
assert.match(questsJs, /PRIORITY_DAILY_CAP/);
assert.match(questsJs, /priorityCapReached/);

const dbJs = fs.readFileSync('js/db.js', 'utf8');
assert.match(dbJs, /#pom-ok-/);
assert.match(dbJs, /timer\.activeQuest/);

const uiJs = fs.readFileSync('js/ui.js', 'utf8');
assert.match(uiJs, /timer\.activeQuest = id/);
assert.match(uiJs, /timer\.running/);

console.log('Contrato de tope de prioridad + verificacion de pomodoro OK');
