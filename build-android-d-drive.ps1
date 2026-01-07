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

# Refresh JAVA_HOME dari System Variables
$env:JAVA_HOME = [System.Environment]::GetEnvironmentVariable("JAVA_HOME", "Machine")
if ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
    $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
}

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
    
    # Set dummy DATABASE_URL untuk build (tidak akan digunakan di mobile app)
    if (-not $env:DATABASE_URL) {
        Write-Host "  Setting dummy DATABASE_URL for build..." -ForegroundColor Gray
        $env:DATABASE_URL = "postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
    }
    
    # Set NEXTAUTH_SECRET jika belum ada
    if (-not $env:NEXTAUTH_SECRET) {
        Write-Host "  Setting dummy NEXTAUTH_SECRET for build..." -ForegroundColor Gray
        $env:NEXTAUTH_SECRET = "dummy-secret-key-for-build-only-min-32-chars-long"
    }
    
    # Set NEXTAUTH_URL jika belum ada
    if (-not $env:NEXTAUTH_URL) {
        Write-Host "  Setting dummy NEXTAUTH_URL for build..." -ForegroundColor Gray
        $env:NEXTAUTH_URL = "http://localhost:3000"
    }
    
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

# Check Java/JDK
Write-Host "Checking Java/JDK..." -ForegroundColor Cyan

# Prefer Java 17 for Android builds (more stable)
# First, try to find Java 17 explicitly
$java17Paths = @(
    "$env:LOCALAPPDATA\Programs\Eclipse Adoptium\jdk-17*",
    "C:\Program Files\Eclipse Adoptium\jdk-17*",
    "C:\Program Files\Java\jdk-17*"
)

Write-Host "  Mencari Java 17 untuk Android build..." -ForegroundColor Gray
$foundJava17 = $false
foreach ($pattern in $java17Paths) {
    $javaPath = Get-ChildItem -Path $pattern -Directory -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($javaPath -and (Test-Path "$($javaPath.FullName)\bin\java.exe")) {
        $env:JAVA_HOME = $javaPath.FullName
        Write-Host "  [OK] Java 17 ditemukan: $env:JAVA_HOME" -ForegroundColor Green
        $foundJava17 = $true
        break
    }
}

# If Java 17 not found, try other versions
if (-not $foundJava17) {
    # Try to get from System Variables
    $systemJavaHome = [System.Environment]::GetEnvironmentVariable("JAVA_HOME", "Machine")
    if ($systemJavaHome -and (Test-Path "$systemJavaHome\bin\java.exe")) {
        # Check if it's Java 17 or 21 (preferred)
        if ($systemJavaHome -match "jdk-17" -or $systemJavaHome -match "jdk-21") {
            $env:JAVA_HOME = $systemJavaHome
            Write-Host "  [OK] JAVA_HOME dari System Variables: $env:JAVA_HOME" -ForegroundColor Green
            $foundJava17 = $true
        }
    }
    
    # If still not found, search for any Java
    if (-not $foundJava17) {
        $allJavaPaths = @(
            "$env:LOCALAPPDATA\Programs\Eclipse Adoptium\jdk-21*",
            "C:\Program Files\Eclipse Adoptium\jdk-21*",
            "C:\Program Files\Java\jdk-21*",
            "$env:LOCALAPPDATA\Programs\Eclipse Adoptium\jdk-*",
            "C:\Program Files\Java\jdk-*",
            "C:\Program Files\Eclipse Adoptium\jdk-*"
        )
        
        foreach ($pattern in $allJavaPaths) {
            $javaPath = Get-ChildItem -Path $pattern -Directory -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($javaPath -and (Test-Path "$($javaPath.FullName)\bin\java.exe")) {
                $env:JAVA_HOME = $javaPath.FullName
                Write-Host "  [OK] Java ditemukan: $env:JAVA_HOME" -ForegroundColor Green
                
                # Warn if Java 25
                if ($env:JAVA_HOME -match "jdk-25") {
                    Write-Host "  [WARNING] Java 25 terdeteksi. Java 17 direkomendasikan untuk Android builds." -ForegroundColor Yellow
                }
                break
            }
        }
    }
}

# Add Java bin to PATH if JAVA_HOME is set
if ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
    $javaBinPath = "$env:JAVA_HOME\bin"
    if ($env:PATH -notlike "*$javaBinPath*") {
        $env:PATH = "$javaBinPath;$env:PATH"
    }
}

# Test Java command
$javaFound = $false
try {
    $javaCmd = Get-Command java -ErrorAction Stop
    $javaVersionOutput = java -version 2>&1 | Select-Object -First 1
    Write-Host "[OK] Java ditemukan" -ForegroundColor Green
    Write-Host "     Version: $javaVersionOutput" -ForegroundColor Gray
    if ($env:JAVA_HOME) {
        Write-Host "     JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Gray
    }
    $javaFound = $true
} catch {
    # Try direct path
    if ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
        $javaExe = "$env:JAVA_HOME\bin\java.exe"
        try {
            $javaVersionOutput = & $javaExe -version 2>&1 | Select-Object -First 1
            Write-Host "[OK] Java ditemukan" -ForegroundColor Green
            Write-Host "     Version: $javaVersionOutput" -ForegroundColor Gray
            Write-Host "     JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Gray
            $javaFound = $true
        } catch {
            # Ignore error, just check if file exists
            Write-Host "[OK] Java ditemukan di: $env:JAVA_HOME" -ForegroundColor Green
            $javaFound = $true
        }
    }
}

if (-not $javaFound) {
    Write-Host "[ERROR] Java/JDK tidak ditemukan!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Java JDK diperlukan untuk build Android APK." -ForegroundColor Yellow
    Write-Host "Silakan install Java JDK 17 atau lebih baru:" -ForegroundColor Yellow
    Write-Host "  - Download: https://adoptium.net/" -ForegroundColor Cyan
    Write-Host "  - Atau: https://www.oracle.com/java/technologies/downloads/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Setelah install, pastikan JAVA_HOME environment variable ter-set di System Variables." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
Write-Host ""

Push-Location android

# Check if gradlew.bat exists
if (-not (Test-Path "gradlew.bat")) {
    Write-Host "[WARNING] gradlew.bat tidak ditemukan!" -ForegroundColor Yellow
    Write-Host "Android project mungkin belum lengkap." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Mencoba membuat Android project ulang..." -ForegroundColor Cyan
    Pop-Location
    
    # Try to re-initialize Android platform
    Write-Host "Menghapus android folder lama..." -ForegroundColor Gray
    if (Test-Path "android") {
        Remove-Item -Path "android" -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    Write-Host "Menambahkan Android platform..." -ForegroundColor Gray
    npx cap add android 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0 -and (Test-Path "android\gradlew.bat")) {
        Write-Host "[OK] Android project berhasil dibuat ulang" -ForegroundColor Green
        Write-Host ""
        Write-Host "Jalankan sync Capacitor..." -ForegroundColor Cyan
        npx cap sync android 2>&1 | Out-Null
        Write-Host ""
    } else {
        Write-Host "[ERROR] Gagal membuat Android project!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Solusi manual:" -ForegroundColor Yellow
        Write-Host "1. Pastikan Android Studio sudah terinstall" -ForegroundColor White
        Write-Host "2. Jalankan: npx cap add android" -ForegroundColor White
        Write-Host "3. Atau buka Android Studio dan import project dari folder android" -ForegroundColor White
        Write-Host ""
        exit 1
    }
    
    Push-Location android
}

try {
    $gradleArgs = @("assembleRelease", "-Dorg.gradle.user.home=$env:GRADLE_USER_HOME", "-Dorg.gradle.daemon=true", "--no-daemon")
    Write-Host "Running Gradle build..." -ForegroundColor Gray
    Write-Host "(Ini akan memakan waktu beberapa menit untuk download dependencies pertama kali)" -ForegroundColor Gray
    Write-Host ""
    
    # Suppress Java 25 restricted method warnings by redirecting stderr
    $ErrorActionPreference = "Continue"
    
    # Run gradlew and capture exit code
    & .\gradlew.bat @gradleArgs 2>&1 | ForEach-Object {
        # Filter out Java 25 restricted method warnings
        if ($_ -match "WARNING.*restricted method" -or $_ -match "Use --enable-native-access" -or $_ -match "Restricted methods will be blocked") {
            # Suppress these warnings
            return
        }
        # Write other output
        Write-Host $_
    }
    
    $exitCode = $LASTEXITCODE
    $ErrorActionPreference = "Stop"
    
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

