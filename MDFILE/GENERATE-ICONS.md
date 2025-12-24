# 🎨 Generate Icon PWA untuk TuntasinAja

Logo SVG sudah dibuat di `public/logo.svg` dan `public/logo-simple.svg`. Ikuti langkah berikut untuk generate icon PWA.

## 🚀 Cara Generate Icon (Otomatis)

### Opsi 1: Menggunakan Script (Recommended)

```bash
# Install sharp (untuk image processing)
npm install sharp

# Generate semua icon
npm run generate:icons
```

Script akan otomatis generate semua ukuran icon yang diperlukan:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

### Opsi 2: Manual dengan Online Tool

1. Buka https://www.pwabuilder.com/imageGenerator
2. Upload file `public/logo.svg` atau `public/logo-simple.svg`
3. Download semua ukuran icon
4. Simpan di folder `public/` dengan nama sesuai di atas

### Opsi 3: Manual dengan Image Editor

1. Buka `public/logo.svg` di editor (Figma, Illustrator, Inkscape, dll)
2. Export ke PNG dengan ukuran:
   - 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512
3. Simpan di folder `public/` dengan nama sesuai

## 📋 Checklist Icon

Setelah generate, pastikan semua file ini ada di folder `public/`:

- [ ] icon-72x72.png
- [ ] icon-96x96.png
- [ ] icon-128x128.png
- [ ] icon-144x144.png
- [ ] icon-152x152.png
- [ ] icon-192x192.png
- [ ] icon-384x384.png
- [ ] icon-512x512.png

## 🎨 Logo yang Tersedia

1. **logo.svg** - Logo dengan detail lebih banyak
2. **logo-simple.svg** - Logo versi sederhana (recommended untuk icon kecil)

Pilih salah satu yang paling sesuai untuk aplikasi Anda.

## ✅ Test Icon

Setelah icon di-generate:

1. Build aplikasi: `npm run build`
2. Start server: `npm start`
3. Buka di browser: `http://localhost:3000`
4. Buka DevTools → Application → Manifest
5. Cek apakah semua icon terdeteksi

## 🐛 Troubleshooting

### Error: sharp not found
```bash
npm install sharp
```

### Icon tidak muncul
- Pastikan semua icon sudah di-generate
- Cek nama file harus sesuai dengan `manifest.json`
- Clear cache browser dan rebuild

### Logo SVG tidak terdeteksi
- Pastikan file `logo.svg` ada di folder `public/`
- Cek format SVG valid (buka di browser untuk test)

## 📝 Catatan

- Logo menggunakan warna primary (#6366f1) sesuai dengan theme aplikasi
- Background menggunakan warna #f1f5f9 (bg color aplikasi)
- Icon akan otomatis di-resize dengan background yang sesuai

