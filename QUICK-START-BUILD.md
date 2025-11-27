# 🚀 Quick Start - Build APK

## Langkah Cepat Build APK

### 1. Install Dependencies (jika belum)

```bash
npm install
```

### 2. Jalankan Build Script

```powershell
.\build-android-d-drive.ps1
```

**Selesai!** APK akan tersimpan di:
- `android\app\build\outputs\apk\release\app-release-unsigned.apk`

---

## 📋 Checklist Sebelum Build

- [ ] Node.js terinstall (v18+)
- [ ] npm terinstall
- [ ] Java JDK terinstall (v17+)
- [ ] Android SDK terinstall
- [ ] Drive D: tersedia dengan ruang minimal 5GB
- [ ] File `android/local.properties` ada dengan path Android SDK

### Setup Android SDK Path

Jika belum ada, buat file `android/local.properties`:

```properties
sdk.dir=C\:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
```

(Ganti `YourUsername` dengan username Anda)

---

## ⚙️ Build Options

### Full Build (Default)
```powershell
.\build-android-d-drive.ps1
```

### Skip npm install
```powershell
.\build-android-d-drive.ps1 -SkipNpmInstall
```

### Skip Next.js build
```powershell
.\build-android-d-drive.ps1 -SkipBuild
```

### Skip Capacitor sync
```powershell
.\build-android-d-drive.ps1 -SkipSync
```

---

## 🔍 Troubleshooting

### Error: npm tidak ditemukan
- Pastikan Node.js terinstall dan di PATH
- Restart terminal/PowerShell

### Error: Android SDK tidak ditemukan
- Install Android Studio
- Buat `android/local.properties` dengan path SDK

### Error: Java tidak ditemukan
- Install Java JDK 17+
- Set JAVA_HOME environment variable

### Error: Drive D: tidak ada
- Edit `gradle.properties` dan hapus/comment line:
  ```
  # org.gradle.user.home=D:/gradle
  # android.buildDir=D:/android-build
  ```
- Atau gunakan drive lain (ubah path di script)

---

## 📚 Dokumentasi Lengkap

Lihat `BUILD-APK-CAPACITOR.md` untuk dokumentasi lengkap.

---

**Selamat Build! 🎉**

