# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Auto-increment version before build
Write-Host "Incrementing version..." -ForegroundColor Cyan
node scripts/increment-version.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to increment version" -ForegroundColor Red
    exit 1
}

# Build APK
Write-Host "Building APK..." -ForegroundColor Cyan
cd android
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
$env:ANDROID_HOME = "C:\Users\fawza\AppData\Local\Android\Sdk"
.\gradlew.bat assembleRelease

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    cd ..
    exit 1
}

cd ..

# Copy APK to public folder for download
Write-Host "`nCopying APK to public folder..." -ForegroundColor Cyan
$apkSource = Join-Path $scriptDir "android\app\build\outputs\apk\release\TuntasinAja.apk"
$apkDest = Join-Path $scriptDir "public\TuntasinAja.apk"

# Wait a bit to ensure file is fully written
Start-Sleep -Seconds 2

if (Test-Path $apkSource) {
    # Get file info before copy
    $srcFile = Get-Item $apkSource
    Write-Host "   Source APK:" -ForegroundColor Gray
    Write-Host "      Path: $apkSource" -ForegroundColor Gray
    Write-Host "      Size: $([math]::Round($srcFile.Length / 1MB, 2)) MB" -ForegroundColor Gray
    Write-Host "      Modified: $($srcFile.LastWriteTime)" -ForegroundColor Gray
    
    # Ensure public folder exists
    $publicDir = Split-Path $apkDest -Parent
    if (-not (Test-Path $publicDir)) {
        New-Item -ItemType Directory -Path $publicDir -Force | Out-Null
        Write-Host "   Created public folder: $publicDir" -ForegroundColor Gray
    }
    
    # Copy APK
    Copy-Item -Path $apkSource -Destination $apkDest -Force
    
    # Verify copy
    if (Test-Path $apkDest) {
        $destFile = Get-Item $apkDest
        Write-Host "`n✅ APK copied to public folder successfully!" -ForegroundColor Green
        Write-Host "   Destination: $apkDest" -ForegroundColor Gray
        Write-Host "   Size: $([math]::Round($destFile.Length / 1MB, 2)) MB" -ForegroundColor Gray
        Write-Host "   Modified: $($destFile.LastWriteTime)" -ForegroundColor Gray
        
        # Verify sizes match
        if ($srcFile.Length -eq $destFile.Length) {
            Write-Host "   ✅ File sizes match - copy verified" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  File sizes don't match! Source: $($srcFile.Length) bytes, Dest: $($destFile.Length) bytes" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Copy failed - destination file not found!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ APK file not found at: $apkSource" -ForegroundColor Red
    Write-Host "   Please check if build was successful" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n✅ Build and copy completed successfully!" -ForegroundColor Green