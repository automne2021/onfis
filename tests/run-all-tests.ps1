#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Run all ONFIS tests: unit → API integration → performance.

.DESCRIPTION
    Orchestrates the full test suite in the recommended order:
      1. JUnit unit tests (no infrastructure required)
      2. Newman API integration tests (requires local stack)
      3. k6 HTTP + WebSocket load tests (requires local stack)

.PARAMETER SkipUnit
    Skip JUnit unit tests.

.PARAMETER SkipApi
    Skip Newman API tests.

.PARAMETER SkipPerf
    Skip k6 performance tests (default: performance skipped unless -IncludePerf).

.PARAMETER IncludePerf
    Include k6 performance tests in the run. Off by default to avoid
    accidental long waits in CI pipelines.

.PARAMETER Environment
    Target environment for API tests. Default: "local".
    WARNING: never run performance tests against production.

.PARAMETER Seed
    If present, seeds test data before running API and performance tests.

.EXAMPLE
    .\tests\run-all-tests.ps1
    .\tests\run-all-tests.ps1 -Seed -IncludePerf
    .\tests\run-all-tests.ps1 -SkipUnit -Seed
#>
param(
    [switch]$SkipUnit,
    [switch]$SkipApi,
    [switch]$IncludePerf,

    [ValidateSet("local", "production")]
    [string]$Environment = "local",

    [switch]$Seed
)

$ErrorActionPreference = "Stop"
$TestsDir = $PSScriptRoot

$results = @{}
$overallExit = 0

function Run-Step {
    param([string]$Label, [scriptblock]$Block)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkCyan
    Write-Host "  $Label" -ForegroundColor White
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkCyan
    $start = Get-Date
    try {
        & $Block
        $exit = $LASTEXITCODE
    } catch {
        Write-Host "  ERROR: $_" -ForegroundColor Red
        $exit = 1
    }
    $elapsed = ((Get-Date) - $start).TotalSeconds
    $results[$Label] = @{ Exit = $exit; Duration = [math]::Round($elapsed, 1) }
    if ($exit -ne 0) { $script:overallExit = 1 }
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  ONFIS Full Test Suite                       ║" -ForegroundColor Cyan
Write-Host "║  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')                  ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan

# ── Step 1: Unit tests ───────────────────────────────────────────────────────
if (-not $SkipUnit) {
    Run-Step "JUnit Unit Tests" {
        & "$TestsDir\run-unit-tests.ps1"
    }
}

# ── Step 2: Seed data (once, before API + performance tests) ─────────────────
if ($Seed -and (-not $SkipApi -or $IncludePerf)) {
    Run-Step "Seed Test Data" {
        $rootDir = Split-Path -Parent $TestsDir
        Push-Location $rootDir
        node tests/setup/seed-test-data.js
        Pop-Location
    }
}

# ── Step 3: API integration tests ────────────────────────────────────────────
if (-not $SkipApi) {
    Run-Step "Newman API Tests ($Environment)" {
        & "$TestsDir\run-api-tests.ps1" -Environment $Environment
    }
}

# ── Step 4: Performance tests (opt-in) ───────────────────────────────────────
if ($IncludePerf) {
    Run-Step "k6 Performance Tests" {
        & "$TestsDir\run-performance-tests.ps1" -Test all
    }
}

# ── Summary table ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Test Suite Summary" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════" -ForegroundColor Cyan
foreach ($step in $results.Keys) {
    $r     = $results[$step]
    $icon  = if ($r.Exit -eq 0) { "[PASS]" } else { "[FAIL]" }
    $color = if ($r.Exit -eq 0) { "Green" } else { "Red" }
    Write-Host ("  $icon  {0,-38} {1,6}s" -f $step, $r.Duration) -ForegroundColor $color
}
Write-Host ""
if ($overallExit -eq 0) {
    Write-Host "  All selected tests PASSED." -ForegroundColor Green
} else {
    Write-Host "  One or more test steps FAILED." -ForegroundColor Red
}
Write-Host ""
exit $overallExit
