# 📱 Build iOS IPA dengan GitHub Actions

Panduan lengkap untuk build IPA (iOS App) menggunakan GitHub Actions tanpa perlu Mac fisik.

## 🎯 Keuntungan

- ✅ **Tidak perlu Mac** - Build di cloud menggunakan macOS runner
- ✅ **Gratis** untuk public repository
- ✅ **Otomatis** - Build otomatis saat push code
- ✅ **Mudah** - Setup sekali, build berkali-kali

## 📋 Prerequisites

1. **Akun GitHub** (gratis)
2. **Repository GitHub** untuk project ini
3. **Apple Developer Account** ($99/tahun) - **OPSIONAL** untuk development build

> **Catatan**: Untuk build development/testing, signing tidak selalu diperlukan. Untuk production/App Store, perlu Apple Developer Account.

## 🚀 Quick Start

### Step 1: Push Project ke GitHub

Jika project belum di GitHub:

```bash
# Inisialisasi git (jika belum)
git init

# Tambahkan remote GitHub
git remote add origin https://github.com/username/tuntasinaja.git

# Commit semua file
git add .
git commit -m "Setup iOS build dengan GitHub Actions"

# Push ke GitHub
git push -u origin main
```

### Step 2: Setup GitHub Actions

File workflow sudah dibuat di `.github/workflows/build-ios.yml`. Pastikan file ini sudah ada di repository.

### Step 3: Setup Secrets (Optional - untuk signing)

Jika ingin sign IPA dengan Apple Developer Account:

1. Buka repository di GitHub
2. Settings → Secrets and variables → Actions
3. Tambahkan secrets berikut:
   - `IOS_TEAM_ID` - Team ID dari Apple Developer Account
   - `APPLE_ID` - Apple ID untuk signing
   - `APPLE_APP_SPECIFIC_PASSWORD` - App-specific password

> **Catatan**: Untuk development build, secrets ini tidak wajib.

### Step 4: Jalankan Workflow

Ada 2 cara menjalankan workflow:

#### Opsi A: Manual Trigger (Recommended)

1. Buka repository di GitHub
2. Klik tab **Actions**
3. Pilih workflow **"Build iOS IPA"**
4. Klik **"Run workflow"**
5. Pilih branch (biasanya `main`)
6. Klik **"Run workflow"**

#### Opsi B: Otomatis (saat push code)

Workflow akan otomatis berjalan saat:
- Push ke branch `main` atau `master`
- Ada perubahan di:
  - `app/**`
  - `components/**`
  - `public/**`
  - `capacitor.config.ts`
  - `package.json`

### Step 5: Download IPA

Setelah workflow selesai:

1. Buka tab **Actions** di GitHub
2. Klik pada workflow run yang baru selesai
3. Scroll ke bawah, cari **"Artifacts"**
4. Download **"ios-ipa"** artifact
5. Extract ZIP file untuk mendapatkan file `.ipa`

## 📦 Lokasi IPA

Setelah download artifact:
- File IPA: `ios/build/App.ipa` (di dalam ZIP artifact)
- Archive: `ios-archive.zip` (jika perlu)

## ⚙️ Konfigurasi Workflow

Workflow file ada di `.github/workflows/build-ios.yml`

### Mengubah Konfigurasi

Jika perlu mengubah konfigurasi:

```yaml
# Mengubah trigger branch
on:
  push:
    branches: [main, develop]  # Tambahkan branch lain

# Mengubah Node.js version
- uses: actions/setup-node@v4
  with:
    node-version: '20'  # Ubah version

# Mengubah Xcode version
- uses: maxim-lobanov/setup-xcode@v1
  with:
    xcode-version: '15.0'  # Version spesifik
```

## 🔐 Signing IPA

### Development Build (Tidak Perlu Signing)

Workflow default menggunakan development build yang tidak perlu signing. IPA bisa diinstall via Xcode atau TestFlight (dengan limit).

### Production Build (Perlu Signing)

Untuk sign IPA dengan Apple Developer Account:

1. **Setup Secrets** di GitHub (seperti di Step 3)
2. **Update ExportOptions.plist** untuk production:

Edit `.github/ios/ExportOptions.plist`:

```xml
<key>method</key>
<string>app-store</string>  <!-- Untuk App Store -->
<!-- atau -->
<string>ad-hoc</string>      <!-- Untuk Ad-Hoc distribution -->
```

3. **Update workflow** untuk menggunakan signing:

Tambahkan step di workflow:

```yaml
- name: Setup Apple Signing
  env:
    APPLE_ID: ${{ secrets.APPLE_ID }}
    APPLE_APP_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
  run: |
    # Setup keychain dan certificates
    # (detail setup bergantung pada kebutuhan)
```

## 📝 Checklist

- [ ] Project sudah di GitHub
- [ ] File `.github/workflows/build-ios.yml` ada
- [ ] File `.github/ios/ExportOptions.plist` ada
- [ ] `capacitor.config.ts` sudah include iOS config
- [ ] Workflow sudah dijalankan
- [ ] IPA sudah didownload

## 🐛 Troubleshooting

### Error: "No such file or directory: ios/App/App.xcworkspace"

**Solusi**: iOS platform belum ditambahkan. Workflow akan otomatis menambahkan, atau jalankan manual:

```bash
npm install @capacitor/ios
npx cap add ios
```

### Error: "CocoaPods not found"

**Solusi**: CocoaPods akan diinstall otomatis oleh workflow. Jika masih error, cek step "Setup CocoaPods" di workflow.

### Error: "Code signing required"

**Solusi**: Untuk development build, workflow sudah meng-disable signing. Jika ingin enable signing, setup secrets dan update workflow.

### Build gagal di step "Build Archive"

**Solusi**:
- Cek log error di GitHub Actions
- Pastikan semua dependencies terinstall
- Pastikan Next.js build berhasil
- Pastikan Capacitor sync berhasil

### IPA tidak bisa diinstall

**Solusi**:
- Pastikan IPA sudah di-sign (jika untuk device)
- Untuk development, install via Xcode
- Untuk testing, upload ke TestFlight

## 📚 Resources

- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Xcode Build Documentation](https://developer.apple.com/documentation/xcode)

## ✅ Next Steps

Setelah IPA berhasil dibuat:

1. **Test di Simulator**: Download Xcode dan test di simulator
2. **Upload ke TestFlight**: Untuk testing di device fisik
3. **Submit ke App Store**: Untuk distribusi public

---

**Selamat! Anda bisa build IPA tanpa Mac! 🎉**

