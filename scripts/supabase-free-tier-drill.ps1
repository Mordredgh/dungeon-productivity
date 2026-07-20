param(
  [string]$DatabaseUrl = $env:DUNGEON_SUPABASE_DB_URL,
  [string]$RestoreDatabaseUrl = $env:DUNGEON_SUPABASE_RESTORE_TEST_DB_URL
)

$ErrorActionPreference = "Stop"

$backupOutput = & "$PSScriptRoot\supabase-backup.ps1" -DatabaseUrl $DatabaseUrl
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
$backupOutput | Write-Host

$backupLine = $backupOutput | Where-Object { $_ -match "\[OK\] Backup:" } | Select-Object -Last 1
$backupPath = ($backupLine -replace "^\[OK\] Backup:\s*", "").Trim()
if (-not $backupPath) {
  Write-Error "No pude localizar el backup generado."
  exit 1
}

if ($RestoreDatabaseUrl) {
  & "$PSScriptRoot\supabase-restore-test.ps1" -BackupPath $backupPath -RestoreDatabaseUrl $RestoreDatabaseUrl -IUnderstandThisIsTemporary
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
  Write-Host "[SKIP] Restore temporal omitido: falta DUNGEON_SUPABASE_RESTORE_TEST_DB_URL."
}

Write-Host "[OK] Drill Free Tier completado."
