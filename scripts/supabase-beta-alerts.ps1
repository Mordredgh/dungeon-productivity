param(
  [string]$SupabaseUrl = $env:DUNGEON_SUPABASE_URL,
  [string]$ServiceRoleKey = $env:DUNGEON_SUPABASE_SERVICE_ROLE_KEY
)

$ErrorActionPreference = "Stop"

if (-not $SupabaseUrl) { $SupabaseUrl = $env:SUPABASE_URL }
if (-not $ServiceRoleKey) { $ServiceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY }
if (-not $SupabaseUrl -or -not $ServiceRoleKey) {
  Write-Error "Faltan DUNGEON_SUPABASE_URL y DUNGEON_SUPABASE_SERVICE_ROLE_KEY."
  exit 1
}

$SupabaseUrl = $SupabaseUrl.TrimEnd("/")
$headers = @{
  "apikey" = $ServiceRoleKey
  "Authorization" = "Bearer $ServiceRoleKey"
  "Content-Type" = "application/json"
}

$uri = "$SupabaseUrl/rest/v1/rpc/scan_dungeon_beta_alerts"
$alerts = Invoke-RestMethod -Method POST -Uri $uri -Headers $headers -Body "{}"
if ($alerts.Count -gt 0) {
  $alerts | ConvertTo-Json -Depth 5
  exit 2
}

Write-Host "[OK] Sin alertas beta abiertas."
