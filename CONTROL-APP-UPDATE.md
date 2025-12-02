# 🎛️ Kontrol Update Aplikasi

Dokumentasi untuk mengontrol kapan user bisa melihat notifikasi update aplikasi.

## 📋 Cara Kerja

Sistem ini menggunakan environment variable `APP_UPDATE_ENABLED` untuk mengontrol apakah user bisa melihat notifikasi update atau tidak.

### Flow:
1. Aplikasi mengecek update setiap 5 menit (atau saat app dibuka)
2. API `/api/app/version` membaca environment variable `APP_UPDATE_ENABLED`
3. Jika `APP_UPDATE_ENABLED=false`, aplikasi **tidak akan menampilkan dialog update** meskipun ada versi baru
4. Jika `APP_UPDATE_ENABLED=true` (default), aplikasi akan menampilkan dialog update jika ada versi baru

## 🚀 Cara Menggunakan

### Untuk Menonaktifkan Update (User tidak bisa update)

1. **Buka Vercel Dashboard**
   - Login ke https://vercel.com
   - Pilih project "TuntasinAja"
   - Buka **Settings** → **Environment Variables**

2. **Tambah/Edit Environment Variable**
   - **Key**: `APP_UPDATE_ENABLED`
   - **Value**: `false`
   - **Environment**: Pilih semua (Production, Preview, Development) atau hanya Production

3. **Save dan Redeploy**
   - Klik **Save**
   - Buka tab **Deployments**
   - Klik **"..."** pada deployment terbaru
   - Pilih **"Redeploy"**
   - Tunggu sampai deploy selesai

4. **Verifikasi**
   - Setelah redeploy, user yang membuka aplikasi **tidak akan melihat dialog update** meskipun ada versi baru di server

### Untuk Mengaktifkan Update (User bisa update)

1. **Edit Environment Variable di Vercel**
   - **Key**: `APP_UPDATE_ENABLED`
   - **Value**: `true` (atau hapus variable ini, karena default adalah `true`)

2. **Save dan Redeploy**
   - Klik **Save**
   - Redeploy aplikasi

3. **Verifikasi**
   - Setelah redeploy, user yang membuka aplikasi **akan melihat dialog update** jika ada versi baru

## 📝 Environment Variables yang Terkait

| Variable | Default | Deskripsi |
|----------|---------|-----------|
| `APP_UPDATE_ENABLED` | `true` | Kontrol apakah update notification ditampilkan ke user |
| `APP_VERSION_CODE` | `1` | Version code aplikasi terbaru (harus lebih besar dari versi di build.gradle) |
| `APP_VERSION_NAME` | `1.0` | Version name aplikasi terbaru |
| `APP_DOWNLOAD_URL` | (auto) | URL untuk download APK |
| `APP_RELEASE_NOTES` | (default) | Catatan rilis update |
| `APP_FORCE_UPDATE` | `false` | Jika `true`, user wajib update (tidak bisa klik "Nanti") |

## ⚠️ Catatan Penting

1. **Redeploy Wajib**: Setelah mengubah environment variable, **WAJIB redeploy** aplikasi agar perubahan aktif
2. **Default Behavior**: Jika `APP_UPDATE_ENABLED` tidak di-set, default adalah `true` (update enabled)
3. **Version Check Tetap Berjalan**: Meskipun update disabled, aplikasi tetap mengecek versi di background, hanya dialog yang tidak ditampilkan
4. **Tidak Mencegah Download Manual**: User masih bisa download APK secara manual jika mereka tahu URL-nya

## 🔄 Skenario Penggunaan

### Skenario 1: Release Update Tapi Belum Siap
```
1. Build APK baru dengan versionCode lebih tinggi
2. Upload APK ke server
3. Set APP_UPDATE_ENABLED=false di Vercel
4. Redeploy
5. User tidak akan melihat update notification
6. Ketika siap, set APP_UPDATE_ENABLED=true
7. Redeploy
8. User akan melihat update notification
```

### Skenario 2: Staged Rollout
```
1. Set APP_UPDATE_ENABLED=false (default)
2. Test update dengan beberapa user internal
3. Jika OK, set APP_UPDATE_ENABLED=true
4. Redeploy
5. Semua user akan melihat update notification
```

## 🛠️ Troubleshooting

### User Masih Melihat Update Dialog
- Pastikan sudah redeploy setelah mengubah environment variable
- Cek di Vercel Dashboard bahwa `APP_UPDATE_ENABLED` sudah di-set ke `false`
- Clear cache browser/app jika perlu

### Update Tidak Muncul Setelah Enable
- Pastikan `APP_VERSION_CODE` lebih besar dari versionCode di `android/app/build.gradle`
- Pastikan sudah redeploy setelah mengubah environment variable
- Cek console log aplikasi untuk melihat error

## 📚 File yang Terkait

- `pages/api/app/version.ts` - API endpoint yang membaca environment variables
- `components/AppUpdateChecker.tsx` - Komponen yang menampilkan dialog update
- `android/app/build.gradle` - File yang berisi versionCode dan versionName aplikasi

