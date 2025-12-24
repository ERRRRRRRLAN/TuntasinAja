# 🍎 Setup iOS Platform Lokal (Optional)

Panduan untuk setup iOS platform secara lokal (jika Anda punya Mac atau ingin test di lokal).

## 📋 Prerequisites Lokal

1. **macOS** (12.0 atau lebih baru)
2. **Xcode** (14.0 atau lebih baru) - Download dari App Store
3. **CocoaPods** - Install via: `sudo gem install cocoapods`
4. **Apple Developer Account** (optional, untuk signing)

## 🚀 Setup Lokal

### Step 1: Install Dependencies

```bash
# Install Capacitor iOS
npm install @capacitor/ios

# Atau gunakan script
node scripts/setup-ios-capacitor.js
```

### Step 2: Tambahkan iOS Platform

```bash
npx cap add ios
```

Ini akan membuat folder `ios/` dengan Xcode project.

### Step 3: Update Icon iOS

Copy icon dari `AppImages/ios/` ke `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

Atau gunakan script:
```bash
node scripts/update-ios-icons.js  # (akan dibuat jika perlu)
```

### Step 4: Build dan Sync

```bash
# Build Next.js
npm run build

# Sync Capacitor
npx cap sync ios
```

### Step 5: Install CocoaPods Dependencies

```bash
cd ios/App
pod install
cd ../..
```

### Step 6: Buka di Xcode

```bash
npx cap open ios
```

Atau buka manual:
```
ios/App/App.xcworkspace
```

## 🔨 Build IPA Lokal

### Opsi 1: Menggunakan Xcode (GUI)

1. Buka `ios/App/App.xcworkspace` di Xcode
2. Pilih scheme **"App"**
3. Pilih destination **"Any iOS Device"**
4. Product → Archive
5. Window → Organizer
6. Distribute App → Pilih metode distribusi

### Opsi 2: Menggunakan Command Line

```bash
# Archive
xcodebuild archive \
  -workspace ios/App/App.xcworkspace \
  -scheme App \
  -configuration Release \
  -archivePath ios/build/App.xcarchive

# Export IPA
xcodebuild -exportArchive \
  -archivePath ios/build/App.xcarchive \
  -exportPath ios/build \
  -exportOptionsPlist ios/ExportOptions.plist
```

## 🔐 Setup Signing

1. Buka Xcode project
2. Pilih project → Target "App"
3. Tab "Signing & Capabilities"
4. Pilih Team (Apple Developer Account)
5. Xcode akan generate provisioning profile otomatis

## 📦 Lokasi File

- iOS Project: `ios/`
- Xcode Workspace: `ios/App/App.xcworkspace`
- IPA Output: `ios/build/App.ipa` (setelah export)

---

**Note**: Setup lokal ini optional. Untuk build tanpa Mac, gunakan GitHub Actions.

