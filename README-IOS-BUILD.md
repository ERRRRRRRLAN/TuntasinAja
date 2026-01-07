# 📱 Build iOS IPA dengan GitHub Actions

Aplikasi ini sudah dikonfigurasi untuk build IPA menggunakan GitHub Actions dengan Mac runner **GRATIS** untuk public repositories.

## 🚀 Cara Menggunakan

### 1. Manual Trigger (Recommended)

1. Buka repository di GitHub
2. Pergi ke tab **Actions**
3. Pilih workflow **"Build iOS IPA"**
4. Klik **"Run workflow"**
5. Pilih branch (biasanya `main`)
6. Klik **"Run workflow"**

### 2. Automatic Trigger

Workflow akan otomatis berjalan ketika:
- Push ke branch `main` atau `master`
- Ada perubahan di:
  - `app/**`
  - `components/**`
  - `public/**`
  - `capacitor.config.ts`
  - `package.json`
  - `.github/workflows/build-ios.yml`

## 📥 Download IPA

Setelah workflow selesai:

1. Pergi ke tab **Actions**
2. Pilih run yang baru saja selesai
3. Scroll ke bawah ke bagian **Artifacts**
4. Download **ios-ipa** artifact
5. Extract file `.ipa` dari zip

## ⚙️ Konfigurasi

### Development Build (Current - Unsigned)

Workflow saat ini menggunakan unsigned build untuk development/testing. IPA yang dihasilkan:
- ✅ Bisa digunakan untuk testing lokal
- ❌ Tidak bisa diinstall langsung di device (perlu Xcode)
- ❌ Tidak bisa upload ke App Store

### Production Build (Optional - Signed)

Untuk membuat signed IPA yang bisa diinstall atau upload ke App Store:

1. **Setup Apple Developer Account** ($99/tahun)
2. **Buat Certificates & Provisioning Profiles** di Apple Developer Portal
3. **Tambahkan Secrets di GitHub**:
   - `IOS_TEAM_ID` - Team ID dari Apple Developer
   - `IOS_SIGNING_CERTIFICATE` - Nama certificate (contoh: "iPhone Developer")
   - `IOS_PROVISIONING_PROFILE` - UUID provisioning profile
   - `IOS_CERTIFICATE_BASE64` - Certificate dalam format base64
   - `IOS_CERTIFICATE_PASSWORD` - Password certificate (jika ada)
   - `IOS_PROVISIONING_PROFILE_BASE64` - Provisioning profile dalam format base64

4. **Update workflow** untuk menggunakan signed build (lihat contoh di bawah)

## 🔧 Setup Signed Build (Advanced)

Jika ingin menggunakan signed build, update workflow dengan menambahkan step:

```yaml
- name: Setup Code Signing
  if: ${{ secrets.IOS_TEAM_ID != '' }}
  run: |
    # Import certificate
    echo "${{ secrets.IOS_CERTIFICATE_BASE64 }}" | base64 --decode > certificate.p12
    security create-keychain -p "" build.keychain
    security default-keychain -s build.keychain
    security unlock-keychain -p "" build.keychain
    security import certificate.p12 -k build.keychain -P "${{ secrets.IOS_CERTIFICATE_PASSWORD }}" -T /usr/bin/codesign
    security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "" build.keychain
    
    # Import provisioning profile
    mkdir -p ~/Library/MobileDevice/Provisioning\ Profiles
    echo "${{ secrets.IOS_PROVISIONING_PROFILE_BASE64 }}" | base64 --decode > ~/Library/MobileDevice/Provisioning\ Profiles/profile.mobileprovision
```

Dan update build step untuk menggunakan signing.

## 📊 GitHub Actions Limits

### Free Tier (Public Repos)
- ✅ **2000 minutes/month** gratis
- ✅ Mac runner tersedia
- ✅ Unlimited builds

### Free Tier (Private Repos)
- ⚠️ **2000 minutes/month** gratis
- ✅ Mac runner tersedia
- ⚠️ Setelah limit, perlu upgrade ke paid plan

**Note**: Build iOS biasanya memakan ~15-30 menit per build.

## 🐛 Troubleshooting

### Build Fails

1. **Check logs** di GitHub Actions
2. **Common issues**:
   - CocoaPods installation failed → Workflow akan retry
   - Xcode version mismatch → Update workflow Xcode version
   - Missing dependencies → Check `package.json`

### IPA Not Generated

1. Check artifact section di workflow run
2. IPA mungkin ada di `ios/build/App.ipa`
3. Jika tidak ada, check logs untuk error

### CocoaPods Issues

Workflow sudah handle CocoaPods installation, tapi jika masih error:
- Check `ios/App/Podfile`
- Try manual: `cd ios/App && pod install`

## 📝 Notes

- **Unsigned IPA** hanya untuk development/testing
- Untuk **production**, perlu signed build dengan Apple Developer account
- IPA file akan tersimpan sebagai artifact selama **30 hari**
- Archive file akan tersimpan selama **7 hari**

## 🔗 Resources

- [Capacitor iOS Docs](https://capacitorjs.com/docs/ios)
- [GitHub Actions Mac Runner](https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners#supported-runners-and-hardware-resources)
- [Apple Developer Portal](https://developer.apple.com/)

