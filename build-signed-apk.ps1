# Auto-increment version before build
Write-Host "Incrementing version..." -ForegroundColor Cyan
node scripts/increment-version.js

cd android
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
$env:ANDROID_HOME = "C:\Users\fawza\AppData\Local\Android\Sdk"
.\gradlew.bat assembleRelease
cd ..

# Copy APK to public folder for download
Write-Host "Copying APK to public folder..." -ForegroundColor Cyan
$apkSource = "android\app\build\outputs\apk\release\TuntasinAja.apk"
$apkDest = "public\TuntasinAja.apk"

if (Test-Path $apkSource) {
    Copy-Item -Path $apkSource -Destination $apkDest -Force
    Write-Host "✅ APK copied to public folder successfully" -ForegroundColor Green
    Write-Host "   Source: $apkSource" -ForegroundColor Gray
    Write-Host "   Destination: $apkDest" -ForegroundColor Gray
} else {
    Write-Host "⚠️  APK file not found at: $apkSource" -ForegroundColor Yellow
    Write-Host "   Please check if build was successful" -ForegroundColor Yellow
}