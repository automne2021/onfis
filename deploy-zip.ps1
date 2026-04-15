# ==============================================================
# Onfis - Production Deployment Package Creator
# Usage: .\deploy-zip.ps1
# Output: onfis-deploy-YYYYMMDD-HHmm.zip (in project root)
# ==============================================================

$ProjectRoot = $PSScriptRoot
$ZipName     = "onfis-deploy-$(Get-Date -Format 'yyyyMMdd-HHmm').zip"
$ZipPath     = Join-Path $ProjectRoot $ZipName
$TempDir     = Join-Path $env:TEMP "onfis-deploy-$(Get-Date -Format 'yyyyMMddHHmmss')"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Onfis Production Deployment Packager" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Source : $ProjectRoot"
Write-Host "Output : $ZipPath"
Write-Host ""

# --- Sanity check: .env.production must exist ---
if (-not (Test-Path (Join-Path $ProjectRoot ".env.production"))) {
    Write-Host "ERROR: .env.production not found. Aborting." -ForegroundColor Red
    exit 1
}

# --- Remove stale temp dir ---
if (Test-Path $TempDir) {
    Remove-Item -Recurse -Force $TempDir
}

# --- Copy files, excluding dev artifacts ---
Write-Host "Copying project files..." -ForegroundColor Yellow
Write-Host "  Excluding: node_modules, target, .git, .env (dev)"
Write-Host ""

robocopy $ProjectRoot $TempDir `
    /E `
    /XD "node_modules" "target" ".git" ".mvn" `
    /XF ".env" ".env.local" ".env.*.local" "onfis-deploy*.zip" `
    /NFL /NDL /NJH /NJS

# robocopy exit codes 0-7 = success (8+ = errors)
if ($LASTEXITCODE -gt 7) {
    Write-Host "ERROR: File copy failed (robocopy exit code: $LASTEXITCODE). Aborting." -ForegroundColor Red
    Remove-Item -Recurse -Force $TempDir -ErrorAction SilentlyContinue
    exit 1
}

# --- Create zip archive ---
Write-Host "Creating zip archive..." -ForegroundColor Yellow
Compress-Archive -Path "$TempDir\*" -DestinationPath $ZipPath -Force

# --- Cleanup temp dir ---
Remove-Item -Recurse -Force $TempDir

# --- Print result ---
$ZipSizeMB = [math]::Round((Get-Item $ZipPath).Length / 1MB, 1)
Write-Host ""
Write-Host "SUCCESS: $ZipName ($ZipSizeMB MB)" -ForegroundColor Green
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Next Steps" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Upload zip to server:" -ForegroundColor Yellow
Write-Host "   scp $ZipName root@146.190.98.126:~/"
Write-Host ""
Write-Host "2. SSH into server:" -ForegroundColor Yellow
Write-Host "   ssh root@146.190.98.126"
Write-Host ""
Write-Host "3. Run setup (on server):" -ForegroundColor Yellow
Write-Host "   unzip $ZipName -d /opt/onfis"
Write-Host "   cd /opt/onfis"
Write-Host "   chmod +x server-setup.sh"
Write-Host "   Follow server-setup.sh instructions"
Write-Host ""
