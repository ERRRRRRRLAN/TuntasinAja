# 📝 Cara Menjalankan Script Build APK

## ✅ Masalah Execution Policy Sudah Teratasi!

Execution policy sudah diubah ke `RemoteSigned` untuk CurrentUser. Sekarang Anda bisa menjalankan script langsung.

## 🚀 Cara Menjalankan Script

### Metode 1: Langsung (Recommended)

Setelah execution policy diubah, Anda bisa menjalankan script langsung:

```powershell
.\refresh-path.ps1
.\build-android-d-drive.ps1
```

### Metode 2: Menggunakan Script Wrapper

Gunakan script wrapper yang sudah dibuat:

```powershell
.\run-build.ps1
```

Script ini akan:
- ✅ Otomatis refresh PATH
- ✅ Check Node.js dan npm
- ✅ Menjalankan build dengan bypass execution policy

### Metode 3: Dengan Bypass Manual

Jika masih ada masalah, jalankan dengan bypass:

```powershell
powershell -ExecutionPolicy Bypass -File .\refresh-path.ps1
powershell -ExecutionPolicy Bypass -File .\build-android-d-drive.ps1
```

## 📋 Langkah-langkah Build APK

### Step 1: Refresh PATH (Optional)

Jika belum restart PowerShell:

```powershell
.\refresh-path.ps1
```

### Step 2: Build APK

Jalankan script build:

```powershell
.\build-android-d-drive.ps1
```

Atau gunakan wrapper:

```powershell
.\run-build.ps1
```

## ⚙️ Execution Policy Info

**Status saat ini:** `RemoteSigned` (CurrentUser)

Ini berarti:
- ✅ Script lokal bisa dijalankan langsung
- ✅ Script dari internet perlu ditandatangani
- ✅ Aman untuk development

**Jika perlu ubah lagi:**

```powershell
# Lihat execution policy
Get-ExecutionPolicy -List

# Ubah untuk CurrentUser
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Atau bypass (kurang aman, hanya untuk development)
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

## 🐛 Troubleshooting

### Error: "cannot be loaded because running scripts is disabled"

**Solusi 1:** Jalankan dengan bypass:
```powershell
powershell -ExecutionPolicy Bypass -File .\script-name.ps1
```

**Solusi 2:** Ubah execution policy:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Solusi 3:** Unblock file:
```powershell
Unblock-File .\script-name.ps1
```

### Error: "Access Denied"

Jalankan PowerShell sebagai Administrator, lalu ubah execution policy untuk System:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine
```

*(Hanya lakukan ini jika benar-benar diperlukan)*

## ✅ Checklist Sebelum Build

- [ ] Node.js terinstall (v24.11.1 ✓)
- [ ] npm terinstall (v11.6.2 ✓)
- [ ] Dependencies terinstall (`npm install` ✓)
- [ ] Execution policy sudah diubah (✓)
- [ ] Android SDK terinstall
- [ ] File `android/local.properties` ada dengan path SDK
- [ ] Drive D: tersedia untuk build storage

---

**Sekarang siap untuk build APK!** 🎉

Jalankan: `.\build-android-d-drive.ps1`

