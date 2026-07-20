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
}

function Test-RestEndpoint([string]$Name, [string]$Path) {
  $uri = "$SupabaseUrl/rest/v1/$Path"
  try {
    Invoke-RestMethod -Method GET -Uri $uri -Headers $headers | Out-Null
    Write-Host "[OK] $Name"
  } catch {
    Write-Error "[FAIL] $Name: $($_.Exception.Message)"
    exit 1
  }
}

Test-RestEndpoint "eventos cliente" "dungeon_client_events?select=id&limit=1"
Test-RestEndpoint "feedback beta" "dungeon_beta_feedback?select=id&limit=1"
Test-RestEndpoint "vista monitoreo 24h" "dungeon_beta_monitoring_24h?select=bucket,kind,events,http_errors,server_errors&limit=1"

Write-Host "[OK] Preflight Supabase beta completo."
