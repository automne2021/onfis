#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Run ONFIS Newman API integration tests.

.DESCRIPTION
    Seeds test data (if --seed flag is passed), then runs the entire
    Postman/Newman collection against the specified environment.

.PARAMETER Environment
    Target environment. Must be "local" (default) or "production".
    WARNING: never run performance tests against production.

.PARAMETER Seed
    If present, runs seed-test-data.js before the test suite.

.PARAMETER Reporters
    Newman reporters to use. Default: "cli,htmlextra,json"

.EXAMPLE
    .\tests\run-api-tests.ps1
    .\tests\run-api-tests.ps1 -Environment local -Seed
    .\tests\run-api-tests.ps1 -Environment production
#>
param(
    [ValidateSet("local", "production")]
    [string]$Environment = "local",

    [switch]$Seed,

    [string]$Reporters = "cli,htmlextra,json"
)

$ErrorActionPreference = "Stop"
$RootDir   = Split-Path -Parent $PSScriptRoot
$ResultsDir = Join-Path $PSScriptRoot "results"

# ── Ensure results directory exists ─────────────────────────────────────────
if (-not (Test-Path $ResultsDir)) {
    New-Item -ItemType Directory -Path $ResultsDir | Out-Null
}

Write-Host ""
Write-Host "══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ONFIS Newman API Integration Tests" -ForegroundColor Cyan
Write-Host "  Environment: $Environment" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ── Check Newman is installed ────────────────────────────────────────────────
if (-not (Get-Command newman -ErrorAction SilentlyContinue)) {
    Write-Host "[!] Newman not found. Installing globally..." -ForegroundColor Yellow
    npm install -g newman newman-reporter-htmlextra
}

# ── Seed test data if requested ─────────────────────────────────────────────
if ($Seed) {
    Write-Host "[1/2] Seeding test data..." -ForegroundColor Yellow
    Push-Location $RootDir
    node tests/setup/seed-test-data.js
    Pop-Location
    Write-Host ""
}

# ── Run Newman ───────────────────────────────────────────────────────────────
$Timestamp  = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$HtmlReport = Join-Path $ResultsDir "api-report-$Timestamp.html"
$JsonReport = Join-Path $ResultsDir "api-report-$Timestamp.json"
$EnvFile    = Join-Path $PSScriptRoot "api\environments\$Environment.json"
$Collection = Join-Path $PSScriptRoot "api\onfis-collection.json"

$reporterArgs = @(
    "--reporters", $Reporters,
    "--reporter-htmlextra-export", $HtmlReport,
    "--reporter-json-export",      $JsonReport
)

Write-Host "[2/2] Running collection..." -ForegroundColor Yellow
Write-Host "      Collection:  $Collection"
Write-Host "      Environment: $EnvFile"
Write-Host "      HTML report: $HtmlReport"
Write-Host ""

# Newman's htmlextra reporter writes a Node.js DEP0176 deprecation warning to
# stderr at initialisation time.  With $ErrorActionPreference = "Stop" that
# would throw a NativeCommandError and kill Newman before any request runs.
# Suppress it locally and rely on $LASTEXITCODE for pass/fail detection.
$prevEAP = $ErrorActionPreference
$ErrorActionPreference = "Continue"
& newman run $Collection `
    --environment $EnvFile `
    --color on `
    @reporterArgs
$exitCode = $LASTEXITCODE
$ErrorActionPreference = $prevEAP

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "[PASS]  All API tests passed!" -ForegroundColor Green
} else {
    Write-Host "[FAIL]  Some API tests failed (exit code $exitCode)." -ForegroundColor Red
}

Write-Host "[RPT]  HTML report: $HtmlReport"
Write-Host ""
exit $exitCode
