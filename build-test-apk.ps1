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

# Setup Java and Android SDK
Write-Host "[Step 1.5] Setup Java dan Android SDK..." -ForegroundColor Yellow

# Find Java (Android Studio bundled JDK)
$javaPaths = @(
    "C:\Program Files\Android\Android Studio\jbr",
    "$env:LOCALAPPDATA\Android\Sdk\..\Android Studio\jbr",
    "$env:LOCALAPPDATA\Programs\Android Studio\jbr"
)

$javaHome = $null
foreach ($path in $javaPaths) {
    if (Test-Path "$path\bin\java.exe") {
        $javaHome = $path
        break
    }
}

if ($javaHome) {
    $env:JAVA_HOME = $javaHome
    Write-Host "  JAVA_HOME: $javaHome" -ForegroundColor Gray
    try {
        $javaOutput = & "$javaHome\bin\java.exe" -version 2>&1
        $javaVersion = ($javaOutput | Select-Object -First 1).ToString()
        Write-Host "  Java: $javaVersion" -ForegroundColor Gray
    } catch {
        Write-Host "  Java: (version check skipped)" -ForegroundColor Gray
    }
} else {
    Write-Host "[WARNING] Android Studio JDK tidak ditemukan!" -ForegroundColor Yellow
    Write-Host "  Mencoba menggunakan Java dari PATH..." -ForegroundColor Gray
    try {
        $javaOutput = java -version 2>&1
        $javaVersion = ($javaOutput | Select-Object -First 1).ToString()
        Write-Host "  Java dari PATH: $javaVersion" -ForegroundColor Gray
    } catch {
        Write-Host "[ERROR] Java tidak ditemukan! Install Java 11+ atau Android Studio" -ForegroundColor Red
        exit 1
    }
}

# Find Android SDK
$sdkPaths = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk",
    "$env:ANDROID_HOME"
)

$androidHome = $null
foreach ($path in $sdkPaths) {
    if ($path -and (Test-Path $path)) {
        $androidHome = $path
        break
    }
}

# Also check local.properties
if (-not $androidHome) {
    $localPropsPath = Join-Path $PSScriptRoot "android\local.properties"
    if (Test-Path $localPropsPath) {
        $localProps = Get-Content $localPropsPath
        $sdkDirLine = $localProps | Where-Object { $_ -match "sdk\.dir=(.+)" }
        if ($sdkDirLine) {
            $sdkPath = $sdkDirLine -replace "sdk\.dir=", "" -replace "\\\\", "\"
            if (Test-Path $sdkPath) {
                $androidHome = $sdkPath
            }
        }
    }
}

if ($androidHome) {
    $env:ANDROID_HOME = $androidHome
    Write-Host "  ANDROID_HOME: $androidHome" -ForegroundColor Gray
} else {
    Write-Host "[WARNING] Android SDK tidak ditemukan!" -ForegroundColor Yellow
    Write-Host "  Pastikan Android SDK sudah terinstall" -ForegroundColor Gray
}

Write-Host "[OK] Java dan Android SDK setup selesai" -ForegroundColor Green
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
    # Ensure JAVA_HOME is set for this session
    if ($env:JAVA_HOME) {
        Write-Host "  Menggunakan JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Gray
    }
    if ($env:ANDROID_HOME) {
        Write-Host "  Menggunakan ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Gray
    }
    Write-Host ""
    
    $gradleArgs = @("assembleDebug", "-Dorg.gradle.user.home=$env:GRADLE_USER_HOME", "-Dorg.gradle.daemon=true", "--no-daemon")
    & .\gradlew.bat @gradleArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "[OK] Test APK build berhasil!" -ForegroundColor Green
        
        # Find APK files (could be app-debug.apk or TuntasinAja-debug-*.apk)
        $apkPaths = @(
            "app\build\outputs\apk\debug\app-debug.apk",
            "app\build\outputs\apk\debug\TuntasinAja-debug-*.apk"
        )
        
        $foundApk = $null
        foreach ($pattern in $apkPaths) {
            $apks = Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
            if ($apks) {
                $foundApk = $apks[0]
                break
            }
        }
        
        if ($foundApk) {
            $apkFullPath = $foundApk.FullName
            $apkSize = [math]::Round($foundApk.Length / 1MB, 2)
            Write-Host ""
            Write-Host "Test APK Location:" -ForegroundColor Cyan
            Write-Host "  $apkFullPath" -ForegroundColor White
            Write-Host "  Size: $apkSize MB" -ForegroundColor Gray
            Write-Host "  Modified: $($foundApk.LastWriteTime)" -ForegroundColor Gray
            Write-Host ""
            Write-Host "Catatan:" -ForegroundColor Yellow
            Write-Host "  - APK ini adalah debug build (untuk testing)" -ForegroundColor Gray
            Write-Host "  - Tidak di-sign, bisa langsung diinstall untuk testing" -ForegroundColor Gray
            Write-Host "  - Untuk production, gunakan build-signed-apk.ps1" -ForegroundColor Gray
        } else {
            Write-Host "[WARNING] APK file tidak ditemukan di lokasi yang diharapkan" -ForegroundColor Yellow
            Write-Host "  Cek manual di: app\build\outputs\apk\debug\" -ForegroundColor Gray
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

