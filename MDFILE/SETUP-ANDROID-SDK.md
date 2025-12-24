# 📱 Setup Android SDK untuk Build APK

## ❌ Error

```
SDK location not found. Define a valid SDK location with an ANDROID_HOME environment variable 
or by setting the sdk.dir path in your project's local.properties file.
```

## 🔍 Penyebab

Android SDK tidak ditemukan. Perlu setup lokasi Android SDK.

## ✅ Solusi

### Opsi 1: Install Android Studio (Recommended)

1. **Download Android Studio:**
   - Website: https://developer.android.com/studio
   - Download dan install Android Studio

2. **Setup Android SDK:**
   - Saat install, Android Studio akan menanyakan lokasi SDK
   - Default: `C:\Users\YourUsername\AppData\Local\Android\Sdk`
   - Atau buka Android Studio → Settings → Appearance & Behavior → System Settings → Android SDK
   - Copy path SDK Location

3. **Set di local.properties:**
   - Buat file `android/local.properties`
   - Tambahkan:
     ```properties
     sdk.dir=C\:\\Users\\erlan\\AppData\\Local\\Android\\Sdk
     ```
   - (Sesuaikan dengan path SDK Anda, ganti backslash dengan double backslash)

### Opsi 2: Install Command Line Tools (Tanpa Android Studio)

1. **Download Command Line Tools:**
   - https://developer.android.com/studio#command-tools
   - Extract ke folder (misalnya: `C:\Android\Sdk\cmdline-tools`)

2. **Install SDK:**
   ```powershell
   cd C:\Android\Sdk\cmdline-tools\latest\bin
   .\sdkmanager.bat "platform-tools" "platforms;android-34" "build-tools;34.0.0"
   ```

3. **Set di local.properties:**
   ```properties
   sdk.dir=C\:\\Android\\Sdk
   ```

### Opsi 3: Cari SDK yang Sudah Terinstall

Jika Android Studio sudah terinstall, cari lokasi SDK:

**Lokasi umum:**
- `C:\Users\erlan\AppData\Local\Android\Sdk`
- `C:\Program Files\Android\Android Studio\sdk`
- `C:\Android\Sdk`

**Cara cari:**
1. Buka Android Studio
2. File → Settings → Appearance & Behavior → System Settings → Android SDK
3. Copy "Android SDK Location"

## 📝 Setup local.properties

Setelah menemukan lokasi SDK, buat file `android/local.properties`:

```properties
## Android SDK Location
sdk.dir=C\:\\Users\\erlan\\AppData\\Local\\Android\\Sdk
```

**Penting:** 
- Gunakan double backslash (`\\`) untuk path Windows
- Atau gunakan forward slash (`/`): `sdk.dir=C:/Users/erlan/AppData/Local/Android/Sdk`

## ✅ Setelah Setup

Jalankan build lagi:

```powershell
.\build-android-d-drive.ps1
```

---

**Butuh bantuan setup Android SDK? Ikuti langkah di atas!** 📱

