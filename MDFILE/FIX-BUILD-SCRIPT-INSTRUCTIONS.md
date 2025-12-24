# Cara Memperbaiki Script Build APK

## Masalah
Script `build-signed-apk.ps1` di lokasi `D:\proyek\Tuntasin` menggunakan versi lama yang tidak copy APK ke folder `public` dengan benar.

## Solusi

### Opsi 1: Pull perubahan terbaru dari branch Test (RECOMMENDED)

Jalankan di terminal PowerShell di lokasi `D:\proyek\Tuntasin`:

```powershell
cd "D:\proyek\Tuntasin"
git fetch origin
git pull origin Test
```

Setelah pull berhasil, coba jalankan script lagi:

```powershell
.\build-signed-apk.ps1
```

### Opsi 2: Ganti script manual (jika opsi 1 gagal)

1. Backup script lama:
```powershell
cd "D:\proyek\Tuntasin"
Copy-Item build-signed-apk.ps1 build-signed-apk.ps1.backup
```

2. Copy script terbaru dari worktree:
```powershell
Copy-Item "C:\Users\fawza\.cursor\worktrees\Tuntasin\bfe\build-signed-apk.ps1" "D:\proyek\Tuntasin\build-signed-apk.ps1" -Force
```

3. Jalankan script:
```powershell
.\build-signed-apk.ps1
```

## Verifikasi Copy Berhasil

Setelah build selesai, cek apakah file ter-copy:

```powershell
$src = Get-Item "android\app\build\outputs\apk\release\TuntasinAja.apk"
$dest = Get-Item "public\TuntasinAja.apk"

Write-Host "Source:" -ForegroundColor Cyan
Write-Host "  Path: $($src.FullName)"
Write-Host "  Size: $([math]::Round($src.Length/1MB, 2))MB"
Write-Host "  Modified: $($src.LastWriteTime)"

Write-Host "`nDestination:" -ForegroundColor Cyan
Write-Host "  Path: $($dest.FullName)"
Write-Host "  Size: $([math]::Round($dest.Length/1MB, 2))MB"
Write-Host "  Modified: $($dest.LastWriteTime)"

Write-Host "`nFiles match: $($src.Length -eq $dest.Length)" -ForegroundColor $(if ($src.Length -eq $dest.Length) { "Green" } else { "Red" })
```

## Fitur Script Terbaru

Script versi terbaru sudah di-improve dengan:
- ✅ Auto-increment version code dan version name
- ✅ Build APK dengan Gradle
- ✅ **Copy APK ke folder public otomatis**
- ✅ Verifikasi file size dan timestamp
- ✅ Retry mechanism jika copy gagal
- ✅ Error handling yang lebih baik
- ✅ Logging yang lebih detail

## Troubleshooting

### Jika script masih gagal copy:

1. Cek apakah build berhasil:
```powershell
Test-Path "android\app\build\outputs\apk\release\TuntasinAja.apk"
# Should return: True
```

2. Cek apakah folder public ada:
```powershell
Test-Path "public"
# Should return: True
```

3. Cek permission:
```powershell
# Pastikan user punya permission write ke folder public
New-Item -ItemType File -Path "public\test.txt" -Force
Remove-Item "public\test.txt" -Force
```

4. Jika masih bermasalah, jalankan copy manual:
```powershell
Copy-Item "android\app\build\outputs\apk\release\TuntasinAja.apk" "public\TuntasinAja.apk" -Force
```

## Commit & Push ke Vercel

Setelah script berhasil dan APK ter-copy ke `public`, commit dan push:

```powershell
git add public/TuntasinAja.apk android/app/build.gradle
git commit -m "build: Update APK to version X.X"
git push origin Test
```

Vercel akan deploy dan APK terbaru akan tersedia di:
https://tuntasinaja-livid.vercel.app/TuntasinAja.apk

