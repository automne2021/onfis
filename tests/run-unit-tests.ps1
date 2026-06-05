#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Run ONFIS JUnit unit tests for the project-service.

.DESCRIPTION
    Compiles and executes all JUnit 5 tests in
    backend/services/project-service using Maven.

.PARAMETER Coverage
    If present, also generates a JaCoCo HTML coverage report.

.EXAMPLE
    .\tests\run-unit-tests.ps1
    .\tests\run-unit-tests.ps1 -Coverage
#>
param(
    [switch]$Coverage
)

$ErrorActionPreference = "Stop"
$RootDir      = Split-Path -Parent $PSScriptRoot
$BackendDir   = Join-Path $RootDir "backend"
$ServiceDir   = Join-Path $BackendDir "services\project-service"
$ResultsDir   = Join-Path $PSScriptRoot "results"

if (-not (Test-Path $ResultsDir)) {
    New-Item -ItemType Directory -Path $ResultsDir | Out-Null
}

Write-Host ""
Write-Host "══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ONFIS JUnit Unit Tests — project-service" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ── Ensure Maven is available ────────────────────────────────────────────────
if (-not (Get-Command mvn -ErrorAction SilentlyContinue)) {
    Write-Error "Maven (mvn) is not on PATH. Please install it and try again."
}

Push-Location $BackendDir
try {
    if ($Coverage) {
        Write-Host "[*] Running tests with JaCoCo coverage..." -ForegroundColor Yellow
        $mavenGoals = "test", "jacoco:report"
    } else {
        Write-Host "[*] Running tests..." -ForegroundColor Yellow
        $mavenGoals = "test"
    }

    & mvn $mavenGoals `
        --projects services/project-service `
        --also-make `
        --batch-mode `
        --no-transfer-progress

    $exitCode = $LASTEXITCODE

    # Copy Surefire XML results to tests/results/
    $surefireXml = Join-Path $ServiceDir "target\surefire-reports"
    if (Test-Path $surefireXml) {
        $destXml = Join-Path $ResultsDir "surefire-reports"
        if (-not (Test-Path $destXml)) {
            New-Item -ItemType Directory -Path $destXml | Out-Null
        }
        Copy-Item "$surefireXml\*.xml" $destXml -Force
        Write-Host "[OK]  Test XML reports copied to: $destXml"
    }

    if ($Coverage) {
        $jacocoHtml = Join-Path $ServiceDir "target\site\jacoco\index.html"
        if (Test-Path $jacocoHtml) {
            Write-Host "[OK]  Coverage report: $jacocoHtml"
        }
    }
} finally {
    Pop-Location
}

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "[PASS]  All unit tests passed!" -ForegroundColor Green
} else {
    Write-Host "[FAIL]  Some unit tests failed (exit code $exitCode)." -ForegroundColor Red
}

Write-Host ""
exit $exitCode
