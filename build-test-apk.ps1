# Script untuk build APK signed untuk testing (TIDAK increment version)
# Gunakan script ini untuk testing tanpa mengubah version name dan version code

$keystorePassword = "erlan210609"
$keyPassword = "erlan210609"

# Set environment variables
$env:KEYSTORE_PASSWORD = $keystorePassword
$env:KEY_PASSWORD = $keyPassword
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
$env:ANDROID_HOME = "C:\Users\fawza\AppData\Local\Android\Sdk"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Build APK untuk Testing" -ForegroundColor Cyan
Write-Host "  (Version TIDAK akan di-increment)" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Skip version increment
Write-Host "Skipping version increment (testing build)" -ForegroundColor Yellow
Write-Host ""

# Step 1: Build Next.js (skip if DATABASE_URL not available)
Write-Host "[Step 1] Building Next.js app..." -ForegroundColor Cyan

# Check if DATABASE_URL exists in environment or .env file
$hasDatabaseUrl = $false
if ($env:DATABASE_URL) {
    $hasDatabaseUrl = $true
    Write-Host "DATABASE_URL found in environment" -ForegroundColor Green
} else {
    # Try to load from .env.local or .env
    if (Test-Path ".env.local") {
        $envLines = Get-Content ".env.local"
        foreach ($line in $envLines) {
            if ($line -match "^DATABASE_URL=(.+)$") {
                $env:DATABASE_URL = $matches[1].Trim('"').Trim("'")
                $hasDatabaseUrl = $true
                Write-Host "DATABASE_URL loaded from .env.local" -ForegroundColor Green
                break
            }
        }
    }
    if (-not $hasDatabaseUrl -and (Test-Path ".env")) {
        $envLines = Get-Content ".env"
        foreach ($line in $envLines) {
            if ($line -match "^DATABASE_URL=(.+)$") {
                $env:DATABASE_URL = $matches[1].Trim('"').Trim("'")
                $hasDatabaseUrl = $true
                Write-Host "DATABASE_URL loaded from .env" -ForegroundColor Green
                break
            }
        }
    }
}

if ($hasDatabaseUrl) {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Next.js build failed!" -ForegroundColor Red
        Write-Host "Continuing anyway for testing build..." -ForegroundColor Yellow
        Write-Host "Note: APK will use the last successful build if available." -ForegroundColor Yellow
    } else {
        Write-Host "Next.js build completed" -ForegroundColor Green
    }
} else {
    Write-Host "DATABASE_URL not found. Skipping Next.js build..." -ForegroundColor Yellow
    Write-Host "Note: This is OK for testing builds. The APK will use the last successful build." -ForegroundColor Yellow
    Write-Host "To do a full build, set DATABASE_URL environment variable or add it to .env.local" -ForegroundColor Gray
}
Write-Host ""

# Step 2: Sync Capacitor
Write-Host "[Step 2] Syncing Capacitor..." -ForegroundColor Cyan
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "Capacitor sync failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Capacitor sync completed" -ForegroundColor Green
Write-Host ""

# Step 3: Clean previous build (optional but recommended)
Write-Host "[Step 3] Cleaning previous build..." -ForegroundColor Cyan
cd android
.\gradlew.bat clean
$cleanResult = $LASTEXITCODE
cd ..
if ($cleanResult -ne 0) {
    Write-Host "Clean failed, but continuing..." -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Build APK
Write-Host "[Step 4] Building signed APK..." -ForegroundColor Cyan
cd android
.\gradlew.bat assembleRelease
$buildResult = $LASTEXITCODE
cd ..

if ($buildResult -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit $buildResult
}

# Copy APK to public folder for download
Write-Host ""
Write-Host "Copying APK to public folder..." -ForegroundColor Cyan
$apkSource = "android\app\build\outputs\apk\release\TuntasinAja.apk"
$apkDest = "public\TuntasinAja.apk"

if (Test-Path $apkSource) {
    Copy-Item -Path $apkSource -Destination $apkDest -Force
    Write-Host "APK copied to public folder successfully" -ForegroundColor Green
    Write-Host "   Source: $apkSource" -ForegroundColor Gray
    Write-Host "   Destination: $apkDest" -ForegroundColor Gray
    Write-Host ""
    Write-Host "APK siap untuk testing!" -ForegroundColor Green
} else {
    Write-Host "APK file not found at: $apkSource" -ForegroundColor Yellow
    Write-Host "   Please check if build was successful" -ForegroundColor Yellow
    exit 1
}