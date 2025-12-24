# 📱 PWA Setup - TuntasinAja

Aplikasi TuntasinAja sudah dikonfigurasi sebagai Progressive Web App (PWA) dan bisa diinstall di Android/iOS.

## ✅ Yang Sudah Dikonfigurasi

- ✅ `next-pwa` sudah diinstall
- ✅ `manifest.json` sudah dibuat
- ✅ `next.config.js` sudah diupdate dengan PWA config
- ✅ `app/layout.tsx` sudah diupdate dengan manifest link
- ✅ Service worker akan otomatis dibuat saat build

## 🎨 Membuat Icon PWA

PWA memerlukan icon dengan berbagai ukuran. Ikuti langkah berikut:

### Opsi 1: Generate Icon Online (Paling Mudah)

1. Buka https://www.pwabuilder.com/imageGenerator
2. Upload logo/icon TuntasinAja (minimal 512x512px)
3. Download semua ukuran icon
4. Simpan di folder `public/` dengan nama:
   - `icon-72x72.png`
   - `icon-96x96.png`
   - `icon-128x128.png`
   - `icon-144x144.png`
   - `icon-152x152.png`
   - `icon-192x192.png`
   - `icon-384x384.png`
   - `icon-512x512.png`

### Opsi 2: Generate dengan RealFaviconGenerator

1. Buka https://realfavicongenerator.net/
2. Upload icon (minimal 260x260px)
3. Configure settings
4. Download dan extract ke folder `public/`

### Opsi 3: Buat Manual

Gunakan tool seperti:
- Figma
- Canva
- Photoshop
- GIMP

Buat icon dengan ukuran di atas, pastikan:
- Background transparan atau sesuai theme color (#6366f1)
- Icon jelas dan mudah dikenali
- Format PNG

## 🚀 Cara Menggunakan PWA

### Di Android (Chrome)

1. Buka aplikasi di Chrome: `https://tuntasinaja.vercel.app`
2. Tap menu (3 titik) di kanan atas
3. Pilih **"Add to Home screen"** atau **"Install app"**
4. Konfirmasi install
5. Aplikasi akan muncul di home screen seperti aplikasi native

### Di iOS (Safari)

1. Buka aplikasi di Safari: `https://tuntasinaja.vercel.app`
2. Tap tombol **Share** (kotak dengan panah ke atas)
3. Scroll ke bawah, pilih **"Add to Home Screen"**
4. Edit nama jika perlu (default: "TuntasinAja")
5. Tap **"Add"**
6. Aplikasi akan muncul di home screen

## 📦 Build & Deploy

```bash
# Build aplikasi
npm run build

# Start production server
npm start

# Atau deploy ke Vercel
vercel deploy
```

## 🔧 Convert PWA ke APK

### Opsi 1: PWA Builder (Paling Mudah)

1. Buka https://www.pwabuilder.com
2. Masukkan URL: `https://tuntasinaja.vercel.app`
3. Klik **"Start"** → **"Build My PWA"**
4. Pilih **"Android"** → **"Download"**
5. Download APK file

### Opsi 2: Bubblewrap (CLI)

```bash
# Install Bubblewrap
npm install -g @bubblewrap/cli

# Init project
bubblewrap init --manifest=https://tuntasinaja.vercel.app/manifest.json

# Build APK
bubblewrap build
```

### Opsi 3: Android Studio + TWA

1. Download Android Studio
2. Buat project baru dengan TWA template
3. Setup Trusted Web Activity
4. Build APK

## ⚠️ Catatan Penting

1. **HTTPS Required**: PWA hanya bekerja di HTTPS (atau localhost untuk development)
2. **Icon Wajib**: Pastikan semua icon sudah dibuat sebelum deploy
3. **Service Worker**: Akan otomatis dibuat saat build (di folder `public/`)
4. **Offline Support**: PWA bisa bekerja offline dengan caching
5. **Update**: Service worker akan auto-update saat ada perubahan

## 🧪 Testing

Setelah setup icon, test dengan:

1. Build aplikasi: `npm run build`
2. Start server: `npm start`
3. Buka di browser: `http://localhost:3000`
4. Buka DevTools → **Application** → **Manifest**
   - Cek apakah manifest terdeteksi
   - Cek apakah icon terdeteksi
5. Test install di mobile device

## 📝 Checklist

- [ ] Icon PWA sudah dibuat (semua ukuran)
- [ ] Icon sudah disimpan di folder `public/`
- [ ] Aplikasi sudah di-build
- [ ] Test install di Android
- [ ] Test install di iOS
- [ ] Test offline functionality

## 🐛 Troubleshooting

### Icon tidak muncul
- Pastikan semua icon sudah dibuat dan disimpan di `public/`
- Cek nama file harus sesuai dengan `manifest.json`
- Clear cache browser dan rebuild

### PWA tidak bisa diinstall
- Pastikan menggunakan HTTPS (atau localhost)
- Cek manifest.json valid (bisa test di https://manifest-validator.appspot.com)
- Pastikan service worker terdaftar (cek di DevTools → Application → Service Workers)

### Service worker error
- Clear cache browser
- Hapus folder `public/sw.js` dan `public/workbox-*.js`
- Rebuild aplikasi

## 📚 Referensi

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [next-pwa Documentation](https://github.com/shadowwalker/next-pwa)
- [PWA Builder](https://www.pwabuilder.com)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

