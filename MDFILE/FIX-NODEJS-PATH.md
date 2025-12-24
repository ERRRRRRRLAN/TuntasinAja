# 🔧 Fix: Node.js Terinstall Tapi npm Tidak Dikenali

## ✅ Masalah

Node.js sudah terinstall tapi PowerShell masih error: `npm tidak dikenali`

## 🔍 Penyebab

PATH environment variable belum ter-update di session PowerShell yang sedang berjalan. Ini terjadi karena:
- PowerShell session tidak otomatis refresh PATH setelah install Node.js
- Perlu restart PowerShell atau refresh PATH manual

## 🚀 Solusi Cepat

### Opsi 1: Refresh PATH di PowerShell Saat Ini (Cepat)

Jalankan script ini di PowerShell:

```powershell
.\refresh-path.ps1
```

Atau jalankan command ini:

```powershell
$env:PATH = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

Kemudian test:
```powershell
node --version
npm --version
```

### Opsi 2: Restart PowerShell (Paling Mudah)

1. **Tutup PowerShell** yang sedang terbuka
2. **Buka PowerShell baru**
3. Test:
   ```powershell
   node --version
   npm --version
   ```

### Opsi 3: Restart Komputer (Jika opsi lain tidak bekerja)

1. Restart komputer
2. Buka PowerShell baru
3. Test Node.js dan npm

## ✅ Setelah PATH Ter-refresh

Sekarang Anda bisa menjalankan:

```powershell
npm install
.\build-android-d-drive.ps1
```

## 📝 Catatan

Script `build-android-d-drive.ps1` sudah di-update untuk otomatis refresh PATH, jadi tidak perlu refresh manual lagi.

## 🐛 Jika Masih Error

1. Cek apakah Node.js benar-benar terinstall:
   ```powershell
   Test-Path "C:\Program Files\nodejs\node.exe"
   ```

2. Cek PATH environment variable:
   ```powershell
   $env:PATH -split ';' | Select-String -Pattern 'node'
   ```

3. Jika Node.js tidak di PATH, tambahkan manual:
   - Buka System Properties → Environment Variables
   - Tambahkan `C:\Program Files\nodejs\` ke System PATH
   - Restart PowerShell

---

**Setelah PATH ter-refresh, lanjutkan build APK!** 🚀

