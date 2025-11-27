# 📱 Build APK dengan Capacitor menggunakan D: Drive

Panduan lengkap untuk membangun APK dari aplikasi TuntasinAja menggunakan Capacitor dengan storage build di D: drive.

## 📋 Prerequisites

1. **Node.js** (v18 atau lebih baru)
2. **npm** atau **yarn**
3. **Java JDK** (17 atau lebih baru)
4. **Android SDK** (via Android Studio atau standalone)
5. **Gradle** (akan diinstall otomatis oleh Capacitor)

## 🚀 Quick Start

### Metode 1: Menggunakan Script PowerShell (Recommended)

Jalankan script build yang sudah dikonfigurasi:

```powershell
.\build-android-d-drive.ps1
```

Script ini akan:
- ✅ Setup environment untuk D: drive
- ✅ Install dependencies (jika diperlukan)
- ✅ Build Next.js app
- ✅ Sync Capacitor
- ✅ Build APK menggunakan D: drive

### Metode 2: Manual Build

#### Step 1: Install Dependencies

```bash
npm install
```

#### Step 2: Setup Environment Variables

```powershell
$env:GRADLE_USER_HOME = "D:\gradle"
$env:ANDROID_BUILD_DIR = "D:\android-build"
```

#### Step 3: Buat Direktori di D: Drive

```powershell
New-Item -ItemType Directory -Path "D:\gradle" -Force
New-Item -ItemType Directory -Path "D:\android-build" -Force
```

#### Step 4: Update gradle.properties

File `gradle.properties` sudah dikonfigurasi dengan:
```
org.gradle.user.home=D:/gradle
android.buildDir=D:/android-build
```

#### Step 5: Build Next.js App

```bash
npm run build
```

#### Step 6: Sync Capacitor

```bash
npx cap sync android
```

#### Step 7: Build APK

```powershell
cd android
$env:GRADLE_USER_HOME = "D:\gradle"
.\gradlew.bat assembleRelease
```

## 📁 Struktur Build

Setelah build, struktur file akan seperti ini:

```
D:\
├── gradle\                    # Gradle cache dan dependencies
│   ├── caches\
│   └── daemon\
└── android-build\             # Android build artifacts

android\
└── app\
    └── build\
        └── outputs\
            └── apk\
                └── release\
                    ├── app-release-unsigned.apk    # APK unsigned
                    └── app-release.apk             # APK signed (jika ada keystore)
```

## 🔐 Signing APK

Untuk mempublish ke Google Play Store, Anda perlu men-sign APK dengan keystore.

### Membuat Keystore (jika belum ada)

```bash
keytool -genkey -v -keystore android.keystore -alias tuntasinaja -keyalg RSA -keysize 2048 -validity 10000
```

### Mengkonfigurasi Signing

Tambahkan konfigurasi signing di `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('../android.keystore')
            storePassword 'YOUR_STORE_PASSWORD'
            keyAlias 'tuntasinaja'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

## ⚠️ Catatan Penting

### Server Components

Aplikasi ini menggunakan **Next.js Server Components** dan **API Routes**. Untuk build sebagai APK:

1. **Option 1 (Recommended)**: Gunakan server URL yang sudah dikonfigurasi di `capacitor.config.ts`:
   ```typescript
   server: {
     url: 'https://tuntasinaja-livid.vercel.app',
     cleartext: false
   }
   ```
   Dengan konfigurasi ini, aplikasi akan memuat konten dari server URL tersebut.

2. **Option 2**: Convert server components ke client components untuk static export. Namun, API routes tidak akan berfungsi dalam static export.

### Static Export

Jika Anda ingin build sebagai static export, perlu:
- Convert semua server components ke client components
- Pindahkan API routes ke server terpisah
- Update `next.config.js` dengan `output: 'export'`

### Storage D: Drive

- Build files akan disimpan di `D:\gradle` dan `D:\android-build`
- Pastikan drive D: memiliki ruang yang cukup (minimal 5GB)
- Jika drive D: tidak tersedia, edit `gradle.properties` dan hapus konfigurasi D: drive

## 🐛 Troubleshooting

### Error: Gradle build failed

1. Pastikan Java JDK sudah terinstall dan di PATH
2. Check Android SDK location di `local.properties`:
   ```
   sdk.dir=C\:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
   ```
3. Pastikan drive D: memiliki ruang yang cukup

### Error: Capacitor sync failed

1. Pastikan `node_modules` sudah terinstall
2. Jalankan `npm install` lagi
3. Hapus folder `android` dan jalankan `npx cap add android` lagi

### Error: Next.js build failed

1. Check error message di console
2. Pastikan semua dependencies terinstall
3. Jika menggunakan server components, pastikan konfigurasi server URL di Capacitor sudah benar

### Build lambat

1. Gradle daemon akan menyimpan cache di D:\gradle, build berikutnya akan lebih cepat
2. Pastikan koneksi internet stabil untuk download dependencies

## 📝 Script Options

Script `build-android-d-drive.ps1` mendukung beberapa options:

```powershell
# Skip npm install (jika sudah install)
.\build-android-d-drive.ps1 -SkipNpmInstall

# Skip Next.js build (jika sudah build)
.\build-android-d-drive.ps1 -SkipBuild

# Skip Capacitor sync (jika sudah sync)
.\build-android-d-drive.ps1 -SkipSync

# Kombinasi
.\build-android-d-drive.ps1 -SkipNpmInstall -SkipBuild
```

## 🔄 Update Capacitor

Jika ada perubahan konfigurasi Capacitor atau plugin baru:

```bash
npx cap sync android
```

## 📚 Referensi

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Android Build Documentation](https://developer.android.com/studio/build)

## 🆘 Bantuan

Jika mengalami masalah:
1. Check log error di console
2. Pastikan semua prerequisites terinstall
3. Coba clean build: hapus `node_modules`, `android/app/build`, dan `D:\gradle`

