# PowerShell script untuk build APK dengan Capacitor menggunakan D: drive
# Versi sederhana tanpa nested if-else kompleks

param(
    [switch]$SkipNpmInstall,
    [switch]$SkipBuild,
    [switch]$SkipSync
)

$ErrorActionPreference = "Stop"

# Refresh PATH
$env:PATH = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host ""
Write-Host "TuntasinAja - Build APK dengan Capacitor" -ForegroundColor Cyan
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
    $content = Get-Content $gradlePropsPath -Raw
    $content = $content -replace "(?m)^org\.gradle\.user\.home=.*$", ""
    $content = $content -replace "(?m)^android\.buildDir=.*$", ""
    if ($content -notmatch "org\.gradle\.user\.home") {
        $content += [Environment]::NewLine + "org.gradle.user.home=D:/gradle" + [Environment]::NewLine
    }
    if ($content -notmatch "android\.buildDir") {
        $content += "android.buildDir=D:/android-build" + [Environment]::NewLine
    }
    Set-Content -Path $gradlePropsPath -Value $content -NoNewline
    Write-Host "[OK] gradle.properties updated" -ForegroundColor Green
}
Write-Host ""

# Install dependencies
if (-not $SkipNpmInstall) {
    Write-Host "[Step 3] Checking dependencies..." -ForegroundColor Yellow
    if (-not (Test-Path "node_modules")) {
        Write-Host "  Installing npm packages..." -ForegroundColor Gray
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] npm install failed!" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "[OK] node_modules sudah ada" -ForegroundColor Green
    }
    Write-Host ""
} else {
    Write-Host "[Step 3] Skipping npm install..." -ForegroundColor Gray
    Write-Host ""
}

# Build Next.js
if (-not $SkipBuild) {
    Write-Host "[Step 4] Building Next.js app..." -ForegroundColor Yellow
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

# Build APK
Write-Host "[Step 6] Building Android APK..." -ForegroundColor Yellow
Write-Host "Menggunakan D: drive untuk build storage..." -ForegroundColor Gray
Write-Host ""

Push-Location android

try {
    $gradleArgs = @("assembleRelease", "-Dorg.gradle.user.home=$env:GRADLE_USER_HOME", "-Dorg.gradle.daemon=true", "--no-daemon")
    & .\gradlew.bat @gradleArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "[OK] APK build berhasil!" -ForegroundColor Green
        
        $apkPath = "app\build\outputs\apk\release\app-release-unsigned.apk"
        if (Test-Path $apkPath) {
            $apkFullPath = Resolve-Path $apkPath
            Write-Host ""
            Write-Host "APK Location:" -ForegroundColor Cyan
            Write-Host "  $apkFullPath" -ForegroundColor White
        }
    } else {
        Write-Host ""
        Write-Host "[ERROR] APK build failed!" -ForegroundColor Red
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
Write-Host "  - APK: android\app\build\outputs\apk\release\app-release-unsigned.apk" -ForegroundColor Gray
Write-Host ""

