param(
  [Parameter(Mandatory = $true)][string]$BackupPath,
  [string]$RestoreDatabaseUrl = $env:DUNGEON_SUPABASE_RESTORE_TEST_DB_URL,
  [switch]$IUnderstandThisIsTemporary,
  [string]$DockerImage = "postgres:16-alpine"
)

$ErrorActionPreference = "Stop"

if (-not $RestoreDatabaseUrl) {
  Write-Error "Falta DUNGEON_SUPABASE_RESTORE_TEST_DB_URL. Usa una base temporal, nunca produccion."
  exit 1
}
if (-not $IUnderstandThisIsTemporary) {
  Write-Error "Agrega -IUnderstandThisIsTemporary para confirmar que el destino es temporal."
  exit 1
}
if ($RestoreDatabaseUrl -match "xibmopqlgjbcypxixnri|stdedxhxxoyostymldqn") {
  Write-Error "Destino bloqueado: parece una base conocida de produccion/compartida."
  exit 1
}

$resolvedBackup = Resolve-Path $BackupPath
$backupDir = Split-Path $resolvedBackup -Parent
$backupFile = Split-Path $resolvedBackup -Leaf

function Invoke-PgRestore([string[]]$LocalArgs, [string[]]$DockerArgs) {
  $pgRestore = Get-Command pg_restore -ErrorAction SilentlyContinue
  if ($pgRestore) {
    & $pgRestore.Source @LocalArgs
    return $LASTEXITCODE
  }

  $docker = Get-Command docker -ErrorAction SilentlyContinue
  if (-not $docker) {
    Write-Error "No encuentro pg_restore ni Docker. Instala PostgreSQL tools o Docker Desktop."
    exit 1
  }
  & $docker.Source run --rm -v "${backupDir}:/backups" $DockerImage pg_restore @DockerArgs
  return $LASTEXITCODE
}

$listExit = Invoke-PgRestore @("--list", $resolvedBackup.Path) @("--list", "/backups/$backupFile")
if ($listExit -ne 0) {
  Write-Error "El dump no es legible por pg_restore."
  exit 1
}

$restoreExit = Invoke-PgRestore @("--clean", "--if-exists", "--no-owner", "--no-acl", "--dbname", $RestoreDatabaseUrl, $resolvedBackup.Path) @("--clean", "--if-exists", "--no-owner", "--no-acl", "--dbname", $RestoreDatabaseUrl, "/backups/$backupFile")
if ($restoreExit -ne 0) {
  Write-Error "La restauracion de prueba fallo."
  exit 1
}

Write-Host "[OK] Restore de prueba completado en base temporal."
