$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
Push-Location $root
try {
  $files = Get-ChildItem -File "tests\*.test.js" | ForEach-Object { $_.FullName }
  if (-not $files) {
    Write-Error "No encontre tests/*.test.js"
    exit 1
  }
  node --test $files
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Smoke beta fallo."
    exit 1
  }
  Write-Host "[OK] Smoke beta local completo."
} finally {
  Pop-Location
}
