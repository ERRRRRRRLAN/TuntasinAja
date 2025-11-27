# 🔍 Cara Mencari Lokasi Android SDK

## Android SDK Belum Ditemukan

Error menunjukkan bahwa Android SDK location belum dikonfigurasi.

## 📍 Lokasi Umum Android SDK

Android SDK biasanya terinstall di salah satu lokasi berikut:

1. **Default Android Studio:**
   ```
   C:\Users\erlan\AppData\Local\Android\Sdk
   ```

2. **Jika install di Program Files:**
   ```
   C:\Program Files\Android\Android Studio\sdk
   ```

3. **Custom location:**
   ```
   C:\Android\Sdk
   ```

## 🔍 Cara Mencari Lokasi SDK

### Opsi 1: Jika Android Studio Sudah Terinstall

1. Buka **Android Studio**
2. File → **Settings** (atau **Preferences** di Mac)
3. Appearance & Behavior → System Settings → **Android SDK**
4. Lihat **"Android SDK Location"** di bagian atas
5. Copy path tersebut

### Opsi 2: Cari di File Explorer

1. Buka **File Explorer**
2. Navigasi ke: `C:\Users\erlan\AppData\Local\`
3. Cari folder **Android** → **Sdk**

### Opsi 3: Cari dengan PowerShell

Jalankan command ini untuk mencari Android SDK:

```powershell
# Cari di lokasi umum
Get-ChildItem "$env:LOCALAPPDATA" -Filter "*Android*" -Directory -ErrorAction SilentlyContinue
Get-ChildItem "C:\Program Files" -Filter "*Android*" -Directory -ErrorAction SilentlyContinue
Get-ChildItem "C:\" -Filter "Android" -Directory -ErrorAction SilentlyContinue

# Atau cari folder yang berisi 'platform-tools'
Get-ChildItem "C:\Users" -Recurse -Filter "platform-tools" -Directory -ErrorAction SilentlyContinue | Select-Object FullName
```

## 📝 Setup Setelah Ditemukan

Setelah menemukan lokasi SDK, update file `android/local.properties`:

```properties
sdk.dir=C\:\\Users\\erlan\\AppData\\Local\\Android\\Sdk
```

Atau jika SDK ada di lokasi lain, sesuaikan path-nya.

## ⚠️ Jika Android SDK Belum Terinstall

Jika Android SDK belum terinstall, Anda perlu:

1. **Install Android Studio** (disarankan):
   - Download: https://developer.android.com/studio
   - Install Android Studio
   - Setup Android SDK melalui Android Studio

2. **Atau Install Command Line Tools:**
   - Download: https://developer.android.com/studio#command-tools
   - Extract dan install SDK

---

**Setelah menemukan atau install Android SDK, update file `android/local.properties`!** 📱

