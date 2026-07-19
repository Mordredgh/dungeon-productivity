param([string]$msg = "chore: update")

$COOLIFY_URL = "http://195.26.247.101:8000"
$APP_UUID    = "c55fjfme7f49eeob1surogue"
$TOKEN       = $env:COOLIFY_DUNGEON_TOKEN

function Write-GzipCopy([string]$Path) {
    $source = [System.IO.File]::OpenRead($Path)
    $target = [System.IO.File]::Create("$Path.gz")
    $gzip = [System.IO.Compression.GzipStream]::new($target, [System.IO.Compression.CompressionLevel]::Optimal)
    try { $source.CopyTo($gzip) }
    finally { $gzip.Dispose(); $target.Dispose(); $source.Dispose() }
}

if (-not $TOKEN) {
    Write-Error "Falta COOLIFY_DUNGEON_TOKEN. Corre: [System.Environment]::SetEnvironmentVariable('COOLIFY_DUNGEON_TOKEN','<token>','User')"
    exit 1
}

# 1. Bump SW cache version
$swPath = Join-Path $PSScriptRoot "sw.js"
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
$sw = [System.IO.File]::ReadAllText($swPath, $utf8NoBom)
if ($sw -match "dungeon-v(\d+)") {
    $old = [int]$Matches[1]; $new = $old + 1
    $sw = $sw -replace "dungeon-v$old", "dungeon-v$new"
    [System.IO.File]::WriteAllText($swPath, $sw, $utf8NoBom)
    Write-Host "SW: v$old -> v$new"
}

# 1.5 Precomprimir texto actual. nginx sirve estos .gz cuando el navegador
# acepta gzip, evitando compresión costosa por solicitud y archivos desfasados.
@("index.html") + @(Get-ChildItem (Join-Path $PSScriptRoot "css") -Filter *.css | ForEach-Object FullName) + @(Get-ChildItem (Join-Path $PSScriptRoot "js") -Filter *.js | ForEach-Object FullName) | ForEach-Object {
    $path = if ([System.IO.Path]::IsPathRooted($_)) { $_ } else { Join-Path $PSScriptRoot $_ }
    Write-GzipCopy $path
}

# 2. Git add / commit / push
git -C $PSScriptRoot add -A
git -C $PSScriptRoot commit -m $msg
git -C $PSScriptRoot push origin main
if ($LASTEXITCODE -ne 0) { Write-Error "git push fallo"; exit 1 }

# 3. Coolify deploy (rebuild desde git)
$headers = @{ "Authorization" = "Bearer $TOKEN"; "Content-Type" = "application/json" }
Write-Host "Triggering Coolify deploy..."
try {
    $res = Invoke-RestMethod -Method POST -Uri "$COOLIFY_URL/api/v1/deploy?uuid=$APP_UUID&force=false" -Headers $headers
    Write-Host "Deploy triggered: $($res | ConvertTo-Json -Compress)"
} catch {
    Write-Warning "Deploy call falló: $_"
}

# 4. Esperar build y luego restart
Write-Host "Esperando 40s para que termine el build..."
Start-Sleep -Seconds 40

Write-Host "Restarting container..."
try {
    $r = Invoke-RestMethod -Method GET -Uri "$COOLIFY_URL/api/v1/applications/$APP_UUID/restart" -Headers $headers
    Write-Host "Restart OK: $($r | ConvertTo-Json -Compress)"
} catch {
    Write-Warning "Restart call falló (puede ser normal si el deploy ya levantó el container): $_"
}

Write-Host "Deploy completo. dungeon.mordredgh.com debería estar actualizado."
