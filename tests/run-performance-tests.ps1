#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Run ONFIS k6 performance tests (HTTP load + WebSocket chat).

.DESCRIPTION
    Executes the k6 load test scripts against the LOCAL environment.

    WARNING: NEVER run performance tests against production (onfis.me).
             The tests create hundreds of concurrent connections and will
             degrade production for real users.

.PARAMETER Test
    Which test to run: "http" (default), "ws", or "all".

.PARAMETER VUs
    Override the peak VU count defined in the script options.
    Only effective when combined with -Duration.

.PARAMETER Duration
    Override the test duration (e.g. "30s", "1m").
    If both -VUs and -Duration are provided, the stage profile is ignored
    and a single flat load is applied.

.EXAMPLE
    .\tests\run-performance-tests.ps1
    .\tests\run-performance-tests.ps1 -Test ws
    .\tests\run-performance-tests.ps1 -Test all
    .\tests\run-performance-tests.ps1 -Test http -VUs 10 -Duration 30s
#>
param(
    [ValidateSet("http", "ws", "all")]
    [string]$Test = "http",

    [int]$VUs = 0,
    [string]$Duration = ""
)

$ErrorActionPreference = "Stop"
$ScriptsDir = Join-Path $PSScriptRoot "performance"
$ResultsDir = Join-Path $PSScriptRoot "results"

if (-not (Test-Path $ResultsDir)) {
    New-Item -ItemType Directory -Path $ResultsDir | Out-Null
}

Write-Host ""
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ONFIS Performance Tests (LOCAL ONLY)" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  [!]  Ensure Docker Compose stack is running:" -ForegroundColor Yellow
    Write-Host "      docker-compose up -d" -ForegroundColor Yellow
    Write-Host "  [!]  Ensure seed data exists:" -ForegroundColor Yellow
Write-Host "      node tests/setup/seed-test-data.js" -ForegroundColor Yellow
Write-Host ""

# ── Ensure k6 is installed ───────────────────────────────────────────────────
$k6Exe = $null
foreach ($candidate in @(
    "$env:ProgramFiles\k6\k6.exe",
    "C:\Program Files\k6\k6.exe",
    "$env:LOCALAPPDATA\k6\k6.exe",
    "$env:ChocolateyInstall\bin\k6.exe"
)) {
    if (Test-Path $candidate) { $k6Exe = $candidate; break }
}
if (-not $k6Exe) {
    $cmd = Get-Command k6 -ErrorAction SilentlyContinue
    if ($cmd) { $k6Exe = $cmd.Source }
}
if (-not $k6Exe) {
    Write-Error @"
k6 is not installed or not on PATH.
Install from: https://k6.io/docs/getting-started/installation/
Windows (Chocolatey): choco install k6
Windows (Winget):     winget install k6
"@
}
Write-Host "[*] Using k6: $k6Exe" -ForegroundColor DarkGray

function Invoke-K6Test {
    param(
        [string]$ScriptFile,
        [string]$OutputFile
    )

    $scriptPath = Join-Path $ScriptsDir $ScriptFile
    $outPath    = Join-Path $ResultsDir $OutputFile
    $args_list  = @("run", $scriptPath, "--out", "json=$outPath")

    if ($VUs -gt 0 -and $Duration -ne "") {
        $args_list += "--vus", "$VUs"
        $args_list += "--duration", "$Duration"
        Write-Host "[*] Running with override: $VUs VUs for $Duration" -ForegroundColor Yellow
    }

    Write-Host "[*] k6 script: $scriptPath" -ForegroundColor Yellow
    Write-Host "[*] JSON output: $outPath"
    Write-Host ""

    # k6 writes all log output (info, error) to stderr; temporarily allow stderr
    # so PS does not throw a NativeCommandError before we can read $LASTEXITCODE.
    # Pipe stdout to Out-Host so it is not collected as the function's return value.
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    & $k6Exe @args_list | Out-Host
    $code = $LASTEXITCODE
    $ErrorActionPreference = $prev
    return $code
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$overallExit = 0

if ($Test -eq "http" -or $Test -eq "all") {
    Write-Host "──────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host "  HTTP Load Test" -ForegroundColor White
    Write-Host "──────────────────────────────────────────────" -ForegroundColor DarkGray
    $code = Invoke-K6Test "http-load-test.js" "http-results-$Timestamp.json"
    if ($code -ne 0) { $overallExit = $code }
    Write-Host ""
}

if ($Test -eq "ws" -or $Test -eq "all") {
    Write-Host "──────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host "  WebSocket Chat Load Test" -ForegroundColor White
    Write-Host "──────────────────────────────────────────────" -ForegroundColor DarkGray
    $code = Invoke-K6Test "ws-chat-load-test.js" "ws-results-$Timestamp.json"
    if ($code -ne 0) { $overallExit = $code }
    Write-Host ""
}

if ($overallExit -eq 0) {
    Write-Host "[PASS]  Performance tests passed all thresholds!" -ForegroundColor Green
} else {
    Write-Host "[FAIL]  One or more thresholds were exceeded (exit code $overallExit)." -ForegroundColor Red
}

Write-Host "[DIR]  Results stored in: $ResultsDir"
Write-Host ""
exit $overallExit
