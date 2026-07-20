param(
  [string]$DockerImage = "postgres:16-alpine"
)

$ErrorActionPreference = "Stop"

$docker = Get-Command docker -ErrorAction SilentlyContinue
if (-not $docker) {
  Write-Error "Docker no esta disponible."
  exit 1
}

$id = [Guid]::NewGuid().ToString("N").Substring(0, 10)
$network = "dungeon-drill-$id"
$source = "dungeon-drill-source-$id"
$target = "dungeon-drill-target-$id"
$password = "local-drill-only"
$dbName = "dungeon_drill"
$backupDir = "tmp\backups"

function Wait-Postgres([string]$ContainerName) {
  for ($i = 0; $i -lt 40; $i++) {
    & $docker.Source exec $ContainerName pg_isready -U postgres -d $dbName | Out-Null
    if ($LASTEXITCODE -eq 0) { return }
    Start-Sleep -Seconds 1
  }
  Write-Error "Postgres temporal no arranco: $ContainerName"
  exit 1
}

try {
  & $docker.Source network create $network | Out-Null
  & $docker.Source run -d --name $source --network $network -e "POSTGRES_PASSWORD=$password" -e "POSTGRES_DB=$dbName" $DockerImage | Out-Null
  & $docker.Source run -d --name $target --network $network -e "POSTGRES_PASSWORD=$password" -e "POSTGRES_DB=$dbName" $DockerImage | Out-Null

  Wait-Postgres $source
  Wait-Postgres $target

  & $docker.Source exec $source psql -U postgres -d $dbName -v ON_ERROR_STOP=1 -c "create table beta_restore_probe(id int primary key, label text not null); insert into beta_restore_probe values (1, 'ok'), (2, 'ok');" | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "No pude preparar datos de prueba." }

  $sourceUrl = "postgresql://postgres:$password@${source}:5432/$dbName"
  $targetUrl = "postgresql://postgres:$password@${target}:5432/$dbName"
  $backupOutput = & "$PSScriptRoot\supabase-backup.ps1" -DatabaseUrl $sourceUrl -OutputDir $backupDir -DockerImage $DockerImage -DockerNetwork $network
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  $backupLine = $backupOutput | Where-Object { $_ -match "\[OK\] Backup:" } | Select-Object -Last 1
  $backupPath = ($backupLine -replace "^\[OK\] Backup:\s*", "").Trim()
  if (-not $backupPath) {
    $root = Resolve-Path (Join-Path $PSScriptRoot "..")
    $backupSearchDir = Join-Path $root $backupDir
    $latestDump = Get-ChildItem -Path $backupSearchDir -Filter "dungeon-supabase-*.dump" -ErrorAction SilentlyContinue |
      Sort-Object LastWriteTime -Descending |
      Select-Object -First 1
    if ($latestDump) { $backupPath = $latestDump.FullName }
  }
  if (-not $backupPath) { throw "No pude localizar el dump generado." }

  & "$PSScriptRoot\supabase-restore-test.ps1" -BackupPath $backupPath -RestoreDatabaseUrl $targetUrl -IUnderstandThisIsTemporary -DockerImage $DockerImage -DockerNetwork $network
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  $count = & $docker.Source exec $target psql -U postgres -d $dbName -t -A -c "select count(*) from beta_restore_probe;"
  if (($count | Select-Object -Last 1).Trim() -ne "2") {
    Write-Error "Restore incompleto: beta_restore_probe no tiene 2 filas."
    exit 1
  }

  Write-Host "[OK] Drill local Free Tier completo: dump legible y restore validado."
} finally {
  & $docker.Source rm -f $source $target 2>$null | Out-Null
  & $docker.Source network rm $network 2>$null | Out-Null
}
