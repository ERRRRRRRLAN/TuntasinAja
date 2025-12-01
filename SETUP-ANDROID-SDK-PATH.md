# Setup Android SDK Path untuk Build APK

## Masalah
Build APK membutuhkan path Android SDK yang valid. Path saat ini tidak ditemukan.

## Cara Mendapatkan Android SDK Path

### Metode 1: Dari Android Studio (Recommended)

1. **Buka Android Studio**
2. **Klik File > Settings** (atau **Android Studio > Preferences** di Mac)
3. **Pilih Appearance & Behavior > System Settings > Android SDK**
4. **Lihat "Android SDK Location"** di bagian atas
5. **Copy path tersebut**

Contoh path:
- Windows: `C:\Users\YourName\AppData\Local\Android\Sdk`
- Mac: `/Users/YourName/Library/Android/sdk`
- Linux: `/home/YourName/Android/Sdk`

### Metode 2: Set Environment Variable

Set environment variable `ANDROID_HOME`:

**Windows PowerShell:**
```powershell
$env:ANDROID_HOME = "C:\Users\YourName\AppData\Local\Android\Sdk"
```

**Windows Command Prompt:**
```cmd
set ANDROID_HOME=C:\Users\YourName\AppData\Local\Android\Sdk
```

**Permanent (Windows):**
1. Buka System Properties > Environment Variables
2. Tambahkan `ANDROID_HOME` dengan value path SDK Anda

### Metode 3: Buat File local.properties

Setelah Anda mendapatkan path SDK, buat file `android\local.properties` dengan isi:

```
sdk.dir=C\:\\Users\\YourName\\AppData\\Local\\Android\\Sdk
```

**PowerShell Command:**
```powershell
"sdk.dir=C\:\\Users\\YourName\\AppData\\Local\\Android\\Sdk" | Out-File -FilePath "android\local.properties" -Encoding utf8 -NoNewline
```

**Ganti `YourName` dengan username Anda!**

## Verifikasi

Setelah setup, verifikasi dengan:

```powershell
# Cek apakah path valid
Test-Path "C:\Users\YourName\AppData\Local\Android\Sdk"

# Cek isi local.properties
Get-Content "android\local.properties"
```

## Setelah Setup

Jalankan build lagi:

```powershell
cd android
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
.\gradlew.bat assembleRelease
```

## Troubleshooting

### Error: SDK location not found
- Pastikan path di `local.properties` benar
- Pastikan path menggunakan double backslash (`\\`) untuk escape
- Pastikan folder SDK benar-benar ada di path tersebut

### Error: Android SDK not installed
- Buka Android Studio
- Go to Tools > SDK Manager
- Install Android SDK Platform dan Build Tools

### Error: Java version
- Pastikan menggunakan Java 11 atau lebih baru
- Android Studio sudah include Java 21 di `C:\Program Files\Android\Android Studio\jbr`

