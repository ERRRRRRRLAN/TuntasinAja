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

# Step 1: Build Next.js
Write-Host "[Step 1] Building Next.js app..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Next.js build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Next.js build completed" -ForegroundColor Green
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