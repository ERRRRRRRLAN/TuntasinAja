# Build script untuk membuat APK menggunakan Capacitor dengan storage D:
# Script ini mengkonfigurasi Gradle untuk menggunakan D: drive

Write-Host "🚀 Memulai build APK dengan Capacitor..." -ForegroundColor Cyan

# Set environment variables untuk menggunakan D: drive
$env:GRADLE_USER_HOME = "D:\gradle"
$env:ANDROID_BUILD_DIR = "D:\android-build"
$env:ANDROID_HOME = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { $env:LOCALAPPDATA + "\Android\Sdk" }

# Create directories di D: jika belum ada
if (-not (Test-Path "D:\gradle")) {
    Write-Host "📁 Membuat direktori D:\gradle..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "D:\gradle" -Force | Out-Null
}

if (-not (Test-Path "D:\android-build")) {
    Write-Host "📁 Membuat direktori D:\android-build..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "D:\android-build" -Force | Out-Null
}

Write-Host "✅ Konfigurasi storage D: drive selesai" -ForegroundColor Green
Write-Host "   - Gradle User Home: $env:GRADLE_USER_HOME" -ForegroundColor Gray
Write-Host "   - Android Build Dir: $env:ANDROID_BUILD_DIR" -ForegroundColor Gray

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Build Next.js app (static export)
Write-Host "`n🔨 Building Next.js app..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Next.js build failed!" -ForegroundColor Red
    exit 1
}

# Sync Capacitor
Write-Host "`n🔄 Syncing Capacitor..." -ForegroundColor Cyan
npx cap sync android

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Capacitor sync failed!" -ForegroundColor Red
    exit 1
}

# Build APK
Write-Host "`n📱 Building Android APK..." -ForegroundColor Cyan
Write-Host "   Menggunakan storage D: untuk build..." -ForegroundColor Gray

# Change to android directory
Push-Location android

# Set Gradle properties for D: drive
$gradlePropsPath = "gradle.properties"
$gradlePropsContent = Get-Content $gradlePropsPath -Raw -ErrorAction SilentlyContinue

if ($gradlePropsContent) {
    if ($gradlePropsContent -notmatch "org\.gradle\.user\.home") {
        $gradlePropsContent += "`norg.gradle.user.home=D:/gradle`n"
    }
    if ($gradlePropsContent -notmatch "android\.buildDir") {
        $gradlePropsContent += "`nandroid.buildDir=D:/android-build`n"
    }
    Set-Content -Path $gradlePropsPath -Value $gradlePropsContent
} else {
    @"
org.gradle.user.home=D:/gradle
android.buildDir=D:/android-build
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
"@ | Set-Content -Path $gradlePropsPath
}

# Run Gradle build
Write-Host "`n🔨 Running Gradle build..." -ForegroundColor Cyan
.\gradlew.bat assembleRelease

Pop-Location

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ APK berhasil dibuat!" -ForegroundColor Green
    Write-Host "   Lokasi APK: android\app\build\outputs\apk\release\app-release-unsigned.apk" -ForegroundColor Gray
    
    # Check if keystore exists for signing
    if (Test-Path "android.keystore") {
        Write-Host "`n🔐 Signing APK dengan keystore..." -ForegroundColor Cyan
        # Add signing commands here if needed
    }
} else {
    Write-Host "`n❌ Build APK gagal!" -ForegroundColor Red
    exit 1
}

