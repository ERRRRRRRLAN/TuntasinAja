# Script untuk update icon Android dengan logo TuntasinAja
# Logo sumber: AppImages/android/ atau public/icon-*.png

$ErrorActionPreference = "Stop"

Write-Host "🎨 Update Android Launcher Icons dengan Logo TuntasinAja..." -ForegroundColor Cyan
Write-Host ""

# Cek logo sumber
$logo512 = $null
$logos = @()

# Prioritas 1: AppImages/android/android-launchericon-512-512.png
if (Test-Path "AppImages\android\android-launchericon-512-512.png") {
    $logo512 = Get-Item "AppImages\android\android-launchericon-512-512.png"
    Write-Host "✅ Logo ditemukan: AppImages/android/android-launchericon-512-512.png" -ForegroundColor Green
    $logos += Get-Item "AppImages\android\android-launchericon-*.png"
}
# Prioritas 2: public/icon-512x512.png
elseif (Test-Path "public\icon-512x512.png") {
    $logo512 = Get-Item "public\icon-512x512.png"
    Write-Host "✅ Logo ditemukan: public/icon-512x512.png" -ForegroundColor Green
    $logos += Get-Item "public\icon-*.png"
}
# Prioritas 3: store_icon.png
elseif (Test-Path "store_icon.png") {
    $logo512 = Get-Item "store_icon.png"
    Write-Host "✅ Logo ditemukan: store_icon.png" -ForegroundColor Green
}

if (-not $logo512) {
    Write-Host "❌ Logo tidak ditemukan!" -ForegroundColor Red
    Write-Host "💡 Silakan pastikan salah satu file ini ada:" -ForegroundColor Yellow
    Write-Host "   - AppImages/android/android-launchericon-512-512.png" -ForegroundColor Gray
    Write-Host "   - public/icon-512x512.png" -ForegroundColor Gray
    Write-Host "   - store_icon.png" -ForegroundColor Gray
    exit 1
}

# Ukuran Android mipmap
$mipmapSizes = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

# Install ImageMagick jika belum ada (untuk resize)
$magickExists = $false
try {
    $null = Get-Command magick -ErrorAction Stop
    $magickExists = $true
    Write-Host "✅ ImageMagick ditemukan" -ForegroundColor Green
} catch {
    Write-Host "⚠️  ImageMagick tidak ditemukan" -ForegroundColor Yellow
    Write-Host "💡 Menggunakan metode alternatif (copy file yang sesuai ukuran)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📦 Update icon untuk setiap density..." -ForegroundColor Cyan

foreach ($mipmap in $mipmapSizes.Keys) {
    $size = $mipmapSizes[$mipmap]
    $targetDir = "android\app\src\main\res\$mipmap"
    
    if (-not (Test-Path $targetDir)) {
        Write-Host "⚠️  Folder tidak ditemukan: $targetDir" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "  Processing $mipmap ($size x $size)..." -ForegroundColor Gray
    
    # Cari logo dengan ukuran yang sesuai atau paling dekat
    $sourceLogo = $null
    $minDiff = [int]::MaxValue
    
    # Jika ada logo dengan ukuran yang tepat
    foreach ($logo in $logos) {
        $logoSize = [int]($logo.Name -replace '[^\d]', '')
        $diff = [Math]::Abs($logoSize - $size)
        
        if ($diff -lt $minDiff) {
            $minDiff = $diff
            $sourceLogo = $logo
        }
        
        if ($logoSize -eq $size) {
            $sourceLogo = $logo
            break
        }
    }
    
    # Jika tidak ada yang cocok, gunakan logo terbesar dan resize
    if (-not $sourceLogo) {
        $sourceLogo = $logo512
    }
    
    # Copy ke semua icon launcher
    $iconFiles = @("ic_launcher.png", "ic_launcher_foreground.png", "ic_launcher_round.png")
    
    foreach ($iconFile in $iconFiles) {
        $targetPath = Join-Path $targetDir $iconFile
        
        if ($magickExists -and $sourceLogo.Length -ne $size) {
            # Resize dengan ImageMagick
            & magick $sourceLogo.FullName -resize "${size}x${size}" $targetPath
            Write-Host "    ✓ Resized: $iconFile" -ForegroundColor Gray
        } else {
            # Copy langsung jika ukuran sudah cocok
            Copy-Item $sourceLogo.FullName -Destination $targetPath -Force
            Write-Host "    ✓ Copied: $iconFile" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "✨ Icon Android berhasil diupdate!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Build APK untuk melihat perubahan:" -ForegroundColor Cyan
Write-Host "   .\build-android-d-drive.ps1" -ForegroundColor Gray

