# Script wrapper untuk menjalankan build dengan bypass execution policy
# Script ini memastikan semua script bisa dijalankan tanpa masalah execution policy

# Refresh PATH first
$env:PATH = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host ""
Write-Host "🚀 Starting APK Build Process..." -ForegroundColor Cyan
Write-Host ""

# Check Node.js
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "✅ Node.js $nodeVersion dan npm v$npmVersion ready!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Node.js atau npm tidak ditemukan!" -ForegroundColor Red
    Write-Host "   Silakan install Node.js terlebih dahulu." -ForegroundColor Yellow
    exit 1
}

# Run build script with bypass
Write-Host "Running build script..." -ForegroundColor Yellow
Write-Host ""

& powershell -ExecutionPolicy Bypass -File ".\build-android-d-drive.ps1" @args

