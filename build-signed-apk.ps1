# Get script directory - use multiple methods for reliability
if ($PSScriptRoot) {
    $scriptDir = $PSScriptRoot
} elseif ($MyInvocation.MyCommand.Path) {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
} else {
    $scriptDir = Get-Location
}

# Convert to absolute path
$scriptDir = (Resolve-Path $scriptDir).Path
Set-Location $scriptDir

Write-Host "Script directory: $scriptDir" -ForegroundColor Cyan

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

# Ensure we're back in script directory
Set-Location $scriptDir

# Copy APK to public folder for download
Write-Host "`nCopying APK to public folder..." -ForegroundColor Cyan

# Build absolute paths using current directory (which should be scriptDir)
$currentDir = (Get-Location).Path
$apkSource = Join-Path $currentDir "android\app\build\outputs\apk\release\TuntasinAja.apk"
$apkDest = Join-Path $currentDir "public\TuntasinAja.apk"

# Convert to absolute paths
$apkSource = (Resolve-Path $apkSource -ErrorAction SilentlyContinue).Path
if (-not $apkSource) {
    # Try alternative method
    $apkSource = (Get-Item (Join-Path $currentDir "android\app\build\outputs\apk\release\TuntasinAja.apk") -ErrorAction SilentlyContinue).FullName
}

# Ensure destination directory exists and get absolute path
$publicDir = Join-Path $currentDir "public"
if (-not (Test-Path $publicDir)) {
    New-Item -ItemType Directory -Path $publicDir -Force | Out-Null
}
$publicDir = (Resolve-Path $publicDir).Path
$apkDest = Join-Path $publicDir "TuntasinAja.apk"

Write-Host "   Current directory: $currentDir" -ForegroundColor Gray
Write-Host "   Source: $apkSource" -ForegroundColor Gray
Write-Host "   Destination: $apkDest" -ForegroundColor Gray

# Wait a bit to ensure file is fully written
Start-Sleep -Seconds 3

if (Test-Path $apkSource) {
    # Get file info before copy
    $srcFile = Get-Item $apkSource -Force
    Write-Host "   Source APK found:" -ForegroundColor Gray
    Write-Host "      Size: $([math]::Round($srcFile.Length / 1MB, 2)) MB" -ForegroundColor Gray
    Write-Host "      Modified: $($srcFile.LastWriteTime)" -ForegroundColor Gray
    
    # Ensure public folder exists
    $publicDir = Split-Path $apkDest -Parent
    if (-not (Test-Path $publicDir)) {
        New-Item -ItemType Directory -Path $publicDir -Force | Out-Null
        Write-Host "   Created public folder: $publicDir" -ForegroundColor Gray
    }
    
    # Remove existing file if it exists (to avoid any lock issues)
    if (Test-Path $apkDest) {
        Remove-Item $apkDest -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 500
    }
    
    # Copy APK with explicit error handling
    try {
        Write-Host "   Copying file..." -ForegroundColor Gray
        Copy-Item -Path $apkSource -Destination $apkDest -Force -ErrorAction Stop
        
        # Wait a bit for file system to sync
        Start-Sleep -Seconds 1
        
        # Verify copy
        if (Test-Path $apkDest) {
            $destFile = Get-Item $apkDest -Force
            Write-Host "`n✅ APK copied to public folder successfully!" -ForegroundColor Green
            Write-Host "   Destination: $apkDest" -ForegroundColor Gray
            Write-Host "   Size: $([math]::Round($destFile.Length / 1MB, 2)) MB" -ForegroundColor Gray
            Write-Host "   Modified: $($destFile.LastWriteTime)" -ForegroundColor Gray
            
            # Verify sizes match
            if ($srcFile.Length -eq $destFile.Length) {
                Write-Host "   ✅ File sizes match - copy verified" -ForegroundColor Green
            } else {
                Write-Host "   ⚠️  File sizes don't match! Source: $($srcFile.Length) bytes, Dest: $($destFile.Length) bytes" -ForegroundColor Yellow
                Write-Host "   Retrying copy..." -ForegroundColor Yellow
                Copy-Item -Path $apkSource -Destination $apkDest -Force -ErrorAction Stop
                Start-Sleep -Seconds 1
                $destFile = Get-Item $apkDest -Force
                if ($srcFile.Length -eq $destFile.Length) {
                    Write-Host "   ✅ Retry successful - file sizes now match" -ForegroundColor Green
                } else {
                    Write-Host "   ❌ Retry failed - sizes still don't match" -ForegroundColor Red
                    exit 1
                }
            }
            
            # Verify timestamps are close (within 5 seconds)
            $timeDiff = [math]::Abs(($srcFile.LastWriteTime - $destFile.LastWriteTime).TotalSeconds)
            if ($timeDiff -gt 5) {
                Write-Host "   ⚠️  Warning: Timestamps differ by $([math]::Round($timeDiff, 1)) seconds" -ForegroundColor Yellow
            }
        } else {
            Write-Host "❌ Copy failed - destination file not found after copy!" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "❌ Error copying file: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   Full error: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ APK file not found at: $apkSource" -ForegroundColor Red
    Write-Host "   Current directory: $(Get-Location)" -ForegroundColor Yellow
    Write-Host "   Script directory: $scriptDir" -ForegroundColor Yellow
    Write-Host "   Please check if build was successful" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n✅ Build and copy completed successfully!" -ForegroundColor Green