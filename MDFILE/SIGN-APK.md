# 🔐 Sign APK dengan Keystore

## ✅ Keystore Sudah Ada

File `android.keystore` sudah ada di root project.

## 📝 Cara Sign APK

### Opsi 1: Menggunakan keystore.properties (Recommended)

1. **Buat file `android/keystore.properties`** (atau copy dari `keystore.properties.example`):
   ```properties
   storePassword=your-keystore-password
   keyPassword=your-key-password
   keyAlias=tuntasinaja
   storeFile=../android.keystore
   ```

2. **Jalankan build:**
   ```powershell
   .\build-android-d-drive.ps1
   ```

   APK akan otomatis di-sign saat build.

### Opsi 2: Menggunakan Environment Variables

Set environment variables sebelum build:

```powershell
$env:KEYSTORE_PASSWORD = "your-keystore-password"
$env:KEY_PASSWORD = "your-key-password"
$env:KEY_ALIAS = "tuntasinaja"

.\build-android-d-drive.ps1
```

### Opsi 3: Sign APK Manual Setelah Build

Jika APK sudah dibuat (unsigned), bisa sign manual:

```powershell
# Set password
$env:KEYSTORE_PASSWORD = "your-keystore-password"
$env:KEY_PASSWORD = "your-key-password"

# Sign APK
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 `
    -keystore android.keystore `
    android\app\build\outputs\apk\release\app-release-unsigned.apk `
    tuntasinaja

# Align APK (optional, recommended)
zipalign -v 4 `
    android\app\build\outputs\apk\release\app-release-unsigned.apk `
    android\app\build\outputs\apk\release\app-release-signed.apk
```

## 📦 Lokasi APK Signed

Setelah sign, APK signed akan ada di:
```
android\app\build\outputs\apk\release\app-release.apk
```

## ⚠️ Catatan Penting

- **Password keystore sangat penting** - Simpan dengan aman!
- File `keystore.properties` sudah di `.gitignore` - tidak akan di-commit ke git
- Jika lupa password keystore, **TIDAK BISA** update APK yang sudah di Google Play Store
- Buat backup keystore di tempat yang aman

---

**Setelah setup password, build akan otomatis sign APK!** 🔐

