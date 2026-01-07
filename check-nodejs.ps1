# Script untuk check apakah Node.js sudah terinstall

Write-Host ""
Write-Host "Checking Node.js Installation..." -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
$nodePath = Get-Command node -ErrorAction SilentlyContinue
if ($nodePath) {
    try {
        $nodeVersion = node --version
        Write-Host "   [OK] Node.js ditemukan: $nodeVersion" -ForegroundColor Green
        Write-Host "      Path: $($nodePath.Source)" -ForegroundColor Gray
    } catch {
        Write-Host "   [ERROR] Node.js ditemukan tapi tidak bisa dijalankan" -ForegroundColor Red
    }
} else {
    Write-Host "   [ERROR] Node.js TIDAK ditemukan" -ForegroundColor Red
    Write-Host "      Silakan install Node.js dari: https://nodejs.org/" -ForegroundColor Yellow
}

# Check npm
Write-Host ""
Write-Host "Checking npm..." -ForegroundColor Yellow
$npmPath = Get-Command npm -ErrorAction SilentlyContinue
if ($npmPath) {
    try {
        $npmVersion = npm --version
        Write-Host "   [OK] npm ditemukan: v$npmVersion" -ForegroundColor Green
        Write-Host "      Path: $($npmPath.Source)" -ForegroundColor Gray
    } catch {
        Write-Host "   [ERROR] npm ditemukan tapi tidak bisa dijalankan" -ForegroundColor Red
    }
} else {
    Write-Host "   [ERROR] npm TIDAK ditemukan" -ForegroundColor Red
    Write-Host "      npm biasanya terinstall bersama Node.js" -ForegroundColor Yellow
}

# Check common Node.js installation paths
Write-Host ""
Write-Host "Checking common Node.js paths..." -ForegroundColor Yellow
$commonPaths = @(
    "C:\Program Files\nodejs\node.exe",
    "C:\Program Files (x86)\nodejs\node.exe"
)

$found = $false
foreach ($path in $commonPaths) {
    if (Test-Path $path) {
        Write-Host "   [OK] Ditemukan di: $path" -ForegroundColor Green
        $found = $true
    }
}

if (-not $found) {
    Write-Host "   [INFO] Node.js tidak ditemukan di lokasi standar" -ForegroundColor Gray
}

# Check PATH
Write-Host ""
Write-Host "Checking PATH environment variable..." -ForegroundColor Yellow
$pathEntries = $env:PATH -split ';' | Where-Object { $_ -like '*node*' }
if ($pathEntries) {
    Write-Host "   [OK] Node.js ditemukan di PATH:" -ForegroundColor Green
    foreach ($entry in $pathEntries) {
        Write-Host "      - $entry" -ForegroundColor Gray
    }
} else {
    Write-Host "   [WARNING] Node.js TIDAK ditemukan di PATH" -ForegroundColor Yellow
    Write-Host "      Node.js mungkin perlu ditambahkan ke PATH manual" -ForegroundColor Gray
}

# Summary
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
if ($nodePath -and $npmPath) {
    Write-Host "[SUCCESS] Node.js dan npm sudah terinstall dengan benar!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Lanjutkan dengan:" -ForegroundColor Cyan
    Write-Host "   npm install" -ForegroundColor White
    Write-Host "   .\build-android-d-drive.ps1" -ForegroundColor White
} else {
    Write-Host "[ERROR] Node.js atau npm belum terinstall!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Silakan install Node.js dari:" -ForegroundColor Yellow
    Write-Host "   https://nodejs.org/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Atau lihat panduan di: SETUP-NODEJS.md" -ForegroundColor Gray
}
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
