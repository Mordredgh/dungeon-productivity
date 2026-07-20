const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = file => fs.readFileSync(file, 'utf8');
const monitoring = read('supabase/migrations/20260719_beta_monitoring.sql');
const preflight = read('scripts/supabase-beta-preflight.ps1');
const backup = read('scripts/supabase-backup.ps1');
const alertsScript = read('scripts/supabase-beta-alerts.ps1');
const smoke = read('scripts/beta-local-smoke.ps1');
const alertsMigration = read('supabase/migrations/20260720_beta_alerts.sql');
const runbook = read('docs/BETA_RELEASE_RUNBOOK.md');
const supabaseDocs = read('docs/SUPABASE_MONITORING.md');

assert.match(monitoring, /grant select on public\.dungeon_beta_monitoring_24h to service_role/i);
assert.match(preflight, /dungeon_client_events/);
assert.match(preflight, /dungeon_beta_feedback/);
assert.match(preflight, /dungeon_beta_monitoring_24h/);
assert.match(backup, /pg_dump/);
assert.match(backup, /Get-FileHash/);
assert.match(alertsMigration, /create table if not exists public\.dungeon_beta_alerts/i);
assert.match(alertsMigration, /alter table public\.dungeon_beta_feedback add column if not exists status/i);
assert.match(alertsMigration, /scan_dungeon_beta_alerts/i);
assert.match(alertsMigration, /grant execute on function public\.scan_dungeon_beta_alerts\(\) to service_role/i);
assert.match(alertsMigration, /cron\.schedule\(\s*'dungeon-beta-alert-scan'/i);
assert.match(alertsScript, /scan_dungeon_beta_alerts/);
assert.match(smoke, /node --test/);
assert.match(runbook, /supabase-backup\.ps1/);
assert.match(runbook, /supabase-beta-preflight\.ps1/);
assert.match(runbook, /supabase-beta-alerts\.ps1/);
assert.match(supabaseDocs, /service_role/);

console.log('beta infra contract OK');
