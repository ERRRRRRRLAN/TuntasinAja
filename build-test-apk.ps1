# PowerShell script untuk build Test/Debug APK dengan Capacitor
# Versi sederhana untuk testing

param(
    [switch]$SkipNpmInstall,
    [switch]$SkipBuild,
    [switch]$SkipSync
)

$ErrorActionPreference = "Stop"

# Refresh PATH
$env:PATH = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host ""
Write-Host "TuntasinAja - Build Test APK (Debug)" -ForegroundColor Cyan
Write-Host "Menggunakan storage D: drive untuk build" -ForegroundColor Gray
Write-Host ""

# Check Node.js
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "[OK] Node.js $nodeVersion dan npm v$npmVersion terdeteksi" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "[ERROR] Node.js atau npm tidak ditemukan!" -ForegroundColor Red
    Write-Host "Silakan install Node.js dari: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Setup D: drive
Write-Host "[Step 1] Setup environment untuk D: drive..." -ForegroundColor Yellow
$env:GRADLE_USER_HOME = "D:\gradle"
$env:ANDROID_BUILD_DIR = "D:\android-build"

$dirsToCreate = @("D:\gradle", "D:\android-build", "D:\gradle\caches", "D:\gradle\daemon")
foreach ($dir in $dirsToCreate) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  Membuat direktori: $dir" -ForegroundColor Gray
    }
}
Write-Host "[OK] D: drive setup selesai" -ForegroundColor Green
Write-Host ""

# Update gradle.properties
Write-Host "[Step 2] Update gradle.properties..." -ForegroundColor Yellow
$gradlePropsPath = Join-Path $PSScriptRoot "gradle.properties"
if (Test-Path $gradlePropsPath) {
    $gradleProps = Get-Content $gradlePropsPath -Raw
    if ($gradleProps -notmatch "org\.gradle\.user\.home") {
        Add-Content -Path $gradlePropsPath -Value "`norg.gradle.user.home=D:\\gradle"
    }
}
Write-Host "[OK] gradle.properties updated" -ForegroundColor Green
Write-Host ""

# Install dependencies
if (-not $SkipNpmInstall) {
    Write-Host "[Step 3] Installing npm dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] npm install failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Dependencies installed" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[Step 3] Skipping npm install..." -ForegroundColor Gray
    Write-Host ""
}

# Set dummy DATABASE_URL for build (required for Prisma during build)
if (-not $env:DATABASE_URL) {
    Write-Host "[Step 3.5] Setting dummy DATABASE_URL for build..." -ForegroundColor Yellow
    $env:DATABASE_URL = "postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
    Write-Host "[OK] Dummy DATABASE_URL set" -ForegroundColor Green
    Write-Host ""
}

# Build Next.js
if (-not $SkipBuild) {
    Write-Host "[Step 4] Building Next.js..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Next.js build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Next.js build completed" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[Step 4] Skipping Next.js build..." -ForegroundColor Gray
    Write-Host ""
}

# Sync Capacitor
if (-not $SkipSync) {
    Write-Host "[Step 5] Syncing Capacitor..." -ForegroundColor Yellow
    npx cap sync android
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Capacitor sync failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Capacitor sync completed" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[Step 5] Skipping Capacitor sync..." -ForegroundColor Gray
    Write-Host ""
}

# Build Debug APK
Write-Host "[Step 6] Building Android Debug APK (Test)..." -ForegroundColor Yellow
Write-Host "Menggunakan D: drive untuk build storage..." -ForegroundColor Gray
Write-Host ""

Push-Location android

try {
    # Use assembleDebug for test APK (faster, unsigned, for testing)
    $gradleArgs = @("assembleDebug", "-Dorg.gradle.user.home=$env:GRADLE_USER_HOME", "-Dorg.gradle.daemon=true", "--no-daemon")
    & .\gradlew.bat @gradleArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "[OK] Test APK build berhasil!" -ForegroundColor Green
        
        $apkPath = "app\build\outputs\apk\debug\app-debug.apk"
        if (Test-Path $apkPath) {
            $apkFullPath = Resolve-Path $apkPath
            Write-Host ""
            Write-Host "Test APK Location:" -ForegroundColor Cyan
            Write-Host "  $apkFullPath" -ForegroundColor White
            Write-Host ""
            Write-Host "Catatan:" -ForegroundColor Yellow
            Write-Host "  - APK ini adalah debug build (untuk testing)" -ForegroundColor Gray
            Write-Host "  - Tidak di-sign, bisa langsung diinstall untuk testing" -ForegroundColor Gray
            Write-Host "  - Untuk production, gunakan build-signed-apk.ps1" -ForegroundColor Gray
        }
    } else {
        Write-Host ""
        Write-Host "[ERROR] Test APK build failed!" -ForegroundColor Red
        exit 1
    }
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "[SUCCESS] Build process selesai!" -ForegroundColor Green
Write-Host ""
Write-Host "Tips:" -ForegroundColor Cyan
Write-Host "  - Build files: D:\gradle dan D:\android-build" -ForegroundColor Gray
Write-Host "  - Test APK: android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Gray
Write-Host ""

