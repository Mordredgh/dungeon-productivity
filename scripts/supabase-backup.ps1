param(
  [string]$DatabaseUrl = $env:DUNGEON_SUPABASE_DB_URL,
  [string]$OutputDir = "tmp\backups"
)

$ErrorActionPreference = "Stop"

if (-not $DatabaseUrl) { $DatabaseUrl = $env:SUPABASE_DB_URL }
if (-not $DatabaseUrl) {
  Write-Error "Falta DUNGEON_SUPABASE_DB_URL o SUPABASE_DB_URL."
  exit 1
}

$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDump) {
  Write-Error "No encuentro pg_dump en PATH. Instala PostgreSQL tools o agrega pg_dump al PATH."
  exit 1
}

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$targetDir = Join-Path $root $OutputDir
New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = Join-Path $targetDir "dungeon-supabase-$stamp.dump"
$hashPath = "$backupPath.sha256"

& $pgDump.Source --format=custom --no-owner --no-acl --file $backupPath $DatabaseUrl
if ($LASTEXITCODE -ne 0) {
  Write-Error "pg_dump fallo."
  exit 1
}

$hash = Get-FileHash -Algorithm SHA256 -Path $backupPath
"$($hash.Hash)  $([System.IO.Path]::GetFileName($backupPath))" | Set-Content -Encoding ascii -Path $hashPath

Write-Host "[OK] Backup: $backupPath"
Write-Host "[OK] SHA256: $hashPath"
