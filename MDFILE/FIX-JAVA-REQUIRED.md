# ☕ Fix: Java/JDK Required untuk Build APK

## ❌ Error

```
ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
Please set the JAVA_HOME variable in your environment to match the location of your Java installation.
```

## 🔍 Penyebab

Java JDK tidak terinstall atau tidak ada di PATH. Build Android APK memerlukan Java JDK (minimal versi 17).

## ✅ Solusi

### Opsi 1: Install Java JDK

#### Download Java JDK

**Recommended: Eclipse Temurin (Adoptium)**
- Website: https://adoptium.net/
- Pilih **JDK 17** atau **JDK 21** (LTS)
- Pilih **Windows x64** installer
- Download dan install

**Atau Oracle JDK:**
- Website: https://www.oracle.com/java/technologies/downloads/
- Pilih **JDK 17** atau **JDK 21** (LTS)
- Download dan install

#### Set JAVA_HOME

Setelah install:

1. **Cari lokasi install Java:**
   - Biasanya di: `C:\Program Files\Java\jdk-17` atau `C:\Program Files\Eclipse Adoptium\jdk-17`

2. **Set JAVA_HOME di PowerShell (untuk session saat ini):**
   ```powershell
   $env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
   ```

3. **Set JAVA_HOME Permanent (recommended):**
   - Tekan `Win + R`, ketik: `sysdm.cpl`
   - Klik **Environment Variables**
   - Di **System Variables**, klik **New**
   - Variable name: `JAVA_HOME`
   - Variable value: `C:\Program Files\Java\jdk-17` (sesuaikan dengan path install Anda)
   - Klik **OK**
   - Di **System Variables**, cari `Path` dan klik **Edit**
   - Klik **New** dan tambahkan: `%JAVA_HOME%\bin`
   - Klik **OK** di semua dialog
   - Restart PowerShell

### Opsi 2: Menggunakan Script Build (Auto-detect)

Script `build-android-d-drive.ps1` sudah diupdate untuk otomatis mencari dan set JAVA_HOME jika belum ter-set.

Jalankan:
```powershell
.\build-android-d-drive.ps1
```

Script akan:
- ✅ Otomatis check Java
- ✅ Otomatis mencari JAVA_HOME
- ✅ Memberikan instruksi jika tidak ditemukan

### Opsi 3: Install via Chocolatey (Jika sudah install)

```powershell
choco install openjdk17
```

Atau via Winget:
```powershell
winget install EclipseAdoptium.Temurin.17.JDK
```

## ✅ Verifikasi

Setelah install, verifikasi:

```powershell
java -version
```

Seharusnya muncul versi Java.

```powershell
echo $env:JAVA_HOME
```

Seharusnya muncul path ke Java installation.

## 📝 Catatan

- **Versi Java:** Minimal JDK 17 (disarankan LTS: 17 atau 21)
- **JAVA_HOME:** Harus menunjuk ke folder JDK (bukan JRE)
- **Path:** Harus include `%JAVA_HOME%\bin`

## 🚀 Setelah Java Terinstall

Setelah Java terinstall dan JAVA_HOME ter-set, jalankan build lagi:

```powershell
.\build-android-d-drive.ps1
```

---

**Dengan Java terinstall, build APK seharusnya bisa dilanjutkan!** 🚀

