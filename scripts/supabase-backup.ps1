param(
  [string]$DatabaseUrl = $env:DUNGEON_SUPABASE_DB_URL,
  [string]$OutputDir = "tmp\backups",
  [string]$DockerImage = "postgres:17-alpine",
  [string]$DockerNetwork = ""
)

$ErrorActionPreference = "Stop"

if (-not $DatabaseUrl) { $DatabaseUrl = $env:SUPABASE_DB_URL }
if (-not $DatabaseUrl) {
  Write-Error "Falta DUNGEON_SUPABASE_DB_URL o SUPABASE_DB_URL."
  exit 1
}

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$targetDir = Join-Path $root $OutputDir
New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = Join-Path $targetDir "dungeon-supabase-$stamp.dump"
$hashPath = "$backupPath.sha256"

$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
if ($pgDump) {
  & $pgDump.Source --format=custom --no-owner --no-acl --file $backupPath $DatabaseUrl
  if ($LASTEXITCODE -ne 0) {
    Write-Error "pg_dump fallo."
    exit 1
  }
} else {
  $docker = Get-Command docker -ErrorAction SilentlyContinue
  if (-not $docker) {
    Write-Error "No encuentro pg_dump ni Docker. Instala PostgreSQL tools o Docker Desktop."
    exit 1
  }
  $mountDir = (Resolve-Path $targetDir).Path
  $fileName = [System.IO.Path]::GetFileName($backupPath)
  $dockerArgs = @("run", "--rm")
  if ($DockerNetwork) { $dockerArgs += @("--network", $DockerNetwork) }
  $dockerArgs += @("-v", "${mountDir}:/backups", $DockerImage, "pg_dump", "--format=custom", "--no-owner", "--no-acl", "--file", "/backups/$fileName", $DatabaseUrl)
  & $docker.Source @dockerArgs
  if ($LASTEXITCODE -ne 0) {
    Write-Error "pg_dump via Docker fallo."
    exit 1
  }
}

$hash = Get-FileHash -Algorithm SHA256 -Path $backupPath
"$($hash.Hash)  $([System.IO.Path]::GetFileName($backupPath))" | Set-Content -Encoding ascii -Path $hashPath

Write-Host "[OK] Backup: $backupPath"
Write-Host "[OK] SHA256: $hashPath"
Write-Output "[OK] Backup: $backupPath"
Write-Output "[OK] SHA256: $hashPath"
