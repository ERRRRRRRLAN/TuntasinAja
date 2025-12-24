# 🔧 Setup Node.js untuk Build APK

npm tidak dikenali karena Node.js belum terinstall atau belum ada di PATH.

## 📥 Cara Install Node.js

### Opsi 1: Download dari Website (Recommended)

1. **Download Node.js:**
   - Buka: https://nodejs.org/
   - Download versi **LTS** (Long Term Support)
   - Pilih versi Windows Installer (.msi)

2. **Install Node.js:**
   - Jalankan installer yang sudah didownload
   - Ikuti wizard installation
   - **Pastikan** checkbox "Add to PATH" dicentang
   - Klik Install

3. **Verifikasi:**
   - Tutup dan buka kembali PowerShell/Command Prompt
   - Jalankan:
     ```powershell
     node --version
     npm --version
     ```

### Opsi 2: Install via Chocolatey

Jika sudah install Chocolatey:

```powershell
choco install nodejs-lts
```

### Opsi 3: Install via Winget (Windows 10/11)

```powershell
winget install OpenJS.NodeJS.LTS
```

## ✅ Verifikasi Instalasi

Setelah install, tutup dan buka kembali PowerShell, lalu jalankan:

```powershell
node --version
npm --version
```

Jika berhasil, akan muncul versi seperti:
```
v18.17.0
9.6.7
```

## 🔄 Jika Sudah Install Tapi Masih Error

### 1. Restart Terminal/PowerShell
Tutup dan buka kembali PowerShell setelah install Node.js.

### 2. Check PATH Environment Variable

Jalankan di PowerShell:

```powershell
$env:PATH -split ';' | Select-String -Pattern 'node'
```

Jika tidak muncul, Node.js belum ada di PATH.

### 3. Tambahkan Node.js ke PATH Manual

1. Buka **System Properties**:
   - Tekan `Win + R`
   - Ketik: `sysdm.cpl`
   - Enter

2. Klik **Environment Variables**

3. Di **System Variables**, cari `Path` dan klik **Edit**

4. Klik **New** dan tambahkan path Node.js (biasanya):
   ```
   C:\Program Files\nodejs\
   ```

5. Klik **OK** di semua dialog

6. Restart PowerShell

### 4. Check Lokasi Node.js

Node.js biasanya terinstall di:
- `C:\Program Files\nodejs\`
- `C:\Program Files (x86)\nodejs\`
- `%AppData%\npm\`

Cek apakah folder tersebut ada:

```powershell
Test-Path "C:\Program Files\nodejs\node.exe"
Test-Path "C:\Program Files\nodejs\npm.cmd"
```

## 🚀 Setelah Node.js Terinstall

1. **Install dependencies:**
   ```powershell
   npm install
   ```

2. **Build APK:**
   ```powershell
   .\build-android-d-drive.ps1
   ```

## 📝 Alternative: Gunakan Full Path

Jika Node.js terinstall tapi tidak di PATH, bisa gunakan full path:

```powershell
& "C:\Program Files\nodejs\npm.cmd" install
```

Atau tambahkan ke script build, tapi lebih baik install dengan benar.

## ❓ Masih Bermasalah?

1. Pastikan menggunakan PowerShell sebagai **Administrator**
2. Cek apakah antivirus memblokir instalasi
3. Restart komputer setelah install
4. Install versi LTS (bukan Current)

---

**Setelah Node.js terinstall, lanjutkan ke build APK!** 🎉

