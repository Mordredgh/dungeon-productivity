const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = file => fs.readFileSync(file, 'utf8');
const monitoring = read('supabase/migrations/20260719_beta_monitoring.sql');
const preflight = read('scripts/supabase-beta-preflight.ps1');
const backup = read('scripts/supabase-backup.ps1');
const smoke = read('scripts/beta-local-smoke.ps1');
const runbook = read('docs/BETA_RELEASE_RUNBOOK.md');
const supabaseDocs = read('docs/SUPABASE_MONITORING.md');

assert.match(monitoring, /grant select on public\.dungeon_beta_monitoring_24h to service_role/i);
assert.match(preflight, /dungeon_client_events/);
assert.match(preflight, /dungeon_beta_feedback/);
assert.match(preflight, /dungeon_beta_monitoring_24h/);
assert.match(backup, /pg_dump/);
assert.match(backup, /Get-FileHash/);
assert.match(smoke, /node --test/);
assert.match(runbook, /supabase-backup\.ps1/);
assert.match(runbook, /supabase-beta-preflight\.ps1/);
assert.match(supabaseDocs, /service_role/);

console.log('beta infra contract OK');
