# Script untuk refresh PATH environment variable tanpa restart PowerShell

Write-Host ""
Write-Host "Refreshing PATH environment variable..." -ForegroundColor Yellow

# Get PATH from System and User environment variables
$machinePath = [System.Environment]::GetEnvironmentVariable("Path","Machine")
$userPath = [System.Environment]::GetEnvironmentVariable("Path","User")

# Combine and update current session PATH
$env:PATH = $machinePath + ";" + $userPath

Write-Host "PATH telah di-refresh!" -ForegroundColor Green
Write-Host ""

# Test Node.js
Write-Host "Testing Node.js..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    Write-Host "   [OK] Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   [ERROR] Node.js tidak ditemukan" -ForegroundColor Red
}

# Test npm
Write-Host ""
Write-Host "Testing npm..." -ForegroundColor Cyan
try {
    $npmVersion = npm --version
    Write-Host "   [OK] npm: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "   [ERROR] npm tidak ditemukan" -ForegroundColor Red
}

Write-Host ""
Write-Host "Sekarang Anda bisa menjalankan:" -ForegroundColor Cyan
Write-Host "   npm install" -ForegroundColor White
Write-Host ""

