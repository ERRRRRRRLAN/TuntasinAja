# 🎛️ Kontrol Update Aplikasi (Hybrid System)

Dokumentasi untuk mengontrol kapan user bisa melihat notifikasi update aplikasi menggunakan sistem hybrid: **Admin Panel (Priority) + Environment Variables (Fallback)**.

## 📋 Cara Kerja

Sistem ini menggunakan **dua metode kontrol** dengan prioritas:

1. **Database (Admin Panel)** - Prioritas utama
   - Admin dapat mengontrol via Admin Panel di aplikasi
   - Perubahan langsung aktif tanpa perlu redeploy
   - Data disimpan di tabel `app_settings` di database

2. **Environment Variables** - Fallback
   - Jika tidak ada setting di database, sistem akan menggunakan environment variable `APP_UPDATE_ENABLED`
   - Perlu redeploy setelah mengubah environment variable

### Flow Prioritas:
```
API /api/app/version:
1. Cek database (app_settings table) → Ada setting? Pakai itu ✅
2. Database kosong/error? → Pakai environment variable APP_UPDATE_ENABLED ✅
3. Environment variable tidak ada? → Default: true (update enabled) ✅
```

### Flow Aplikasi:
1. Aplikasi mengecek update setiap 5 menit (atau saat app dibuka)
2. API `/api/app/version` membaca setting dari database (priority) atau environment variable (fallback)
3. Jika `updateEnabled=false`, aplikasi **tidak akan menampilkan dialog update** meskipun ada versi baru
4. Jika `updateEnabled=true` (default), aplikasi akan menampilkan dialog update jika ada versi baru

## 🚀 Cara Menggunakan

### Metode 1: Admin Panel (Recommended - Real-time Control)

#### Untuk Menonaktifkan Update:
1. **Login sebagai Admin**
   - Buka aplikasi dan login dengan akun admin
   
2. **Buka Admin Panel**
   - Klik menu "Admin Panel" atau "Profile" → "Admin Panel"
   - Pilih tab **"⚙️ Pengaturan"**

3. **Toggle Update Notification**
   - Klik tombol "Aktif" untuk menonaktifkan
   - Tombol akan berubah menjadi "Nonaktif"
   - **Perubahan langsung aktif** tanpa perlu redeploy! ✅

4. **Verifikasi**
   - User yang membuka aplikasi **tidak akan melihat dialog update** meskipun ada versi baru

#### Untuk Mengaktifkan Update:
1. **Buka Admin Panel → Tab Pengaturan**
2. **Klik tombol "Nonaktif"** untuk mengaktifkan
3. **Tombol akan berubah menjadi "Aktif"**
4. **Perubahan langsung aktif** tanpa perlu redeploy! ✅

### Metode 2: Environment Variables (Fallback/Backup)

#### Untuk Menonaktifkan Update:
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

4. **Catatan**: Environment variable hanya digunakan jika **tidak ada setting di database**

#### Untuk Mengaktifkan Update:
1. **Edit Environment Variable di Vercel**
   - **Key**: `APP_UPDATE_ENABLED`
   - **Value**: `true` (atau hapus variable ini)

2. **Save dan Redeploy**
   - Klik **Save**
   - Redeploy aplikasi

## 📝 Environment Variables yang Terkait

| Variable | Default | Deskripsi |
|----------|---------|-----------|
| `APP_UPDATE_ENABLED` | `true` | Kontrol apakah update notification ditampilkan ke user (fallback jika tidak ada setting di database) |
| `APP_VERSION_CODE` | `1` | Version code aplikasi terbaru (harus lebih besar dari versi di build.gradle) |
| `APP_VERSION_NAME` | `1.0` | Version name aplikasi terbaru |
| `APP_DOWNLOAD_URL` | (auto) | URL untuk download APK |
| `APP_RELEASE_NOTES` | (default) | Catatan rilis update |
| `APP_FORCE_UPDATE` | `false` | Jika `true`, user wajib update (tidak bisa klik "Nanti") |

## ⚠️ Catatan Penting

1. **Prioritas**: Database (Admin Panel) > Environment Variables > Default (true)
2. **Admin Panel**: Perubahan langsung aktif tanpa perlu redeploy ✅
3. **Environment Variables**: Perlu redeploy setelah mengubah
4. **Default Behavior**: Jika tidak ada setting di database dan environment variable, default adalah `true` (update enabled)
5. **Version Check Tetap Berjalan**: Meskipun update disabled, aplikasi tetap mengecek versi di background, hanya dialog yang tidak ditampilkan
6. **Tidak Mencegah Download Manual**: User masih bisa download APK secara manual jika mereka tahu URL-nya

## 🔄 Skenario Penggunaan

### Skenario 1: Release Update Tapi Belum Siap (Menggunakan Admin Panel)
```
1. Build APK baru dengan versionCode lebih tinggi
2. Upload APK ke server
3. Login sebagai admin → Buka Admin Panel → Tab Pengaturan
4. Klik "Aktif" untuk menonaktifkan update
5. User tidak akan melihat update notification (langsung aktif!)
6. Ketika siap, klik "Nonaktif" untuk mengaktifkan update
7. User akan melihat update notification (langsung aktif!)
```

### Skenario 2: Staged Rollout (Menggunakan Admin Panel)
```
1. Build APK baru dengan versionCode lebih tinggi
2. Upload APK ke server
3. Login sebagai admin → Nonaktifkan update via Admin Panel
4. Test update dengan beberapa user internal
5. Jika OK, aktifkan update via Admin Panel
6. Semua user akan melihat update notification (langsung aktif!)
```

### Skenario 3: Backup Control (Menggunakan Environment Variables)
```
1. Jika admin panel tidak bisa diakses atau database error
2. Set APP_UPDATE_ENABLED=false di Vercel
3. Redeploy
4. Sistem akan menggunakan environment variable sebagai fallback
```

## 🛠️ Troubleshooting

### User Masih Melihat Update Dialog
- **Cek Admin Panel**: Pastikan update sudah dinonaktifkan di Admin Panel → Tab Pengaturan
- **Cek Database**: Pastikan ada record di tabel `app_settings` dengan `key='updateEnabled'` dan `value='false'`
- **Cek Environment Variable**: Jika tidak ada di database, pastikan `APP_UPDATE_ENABLED=false` di Vercel
- **Redeploy**: Jika menggunakan environment variable, pastikan sudah redeploy
- **Clear Cache**: Clear cache browser/app jika perlu

### Update Tidak Muncul Setelah Enable
- **Cek Admin Panel**: Pastikan update sudah diaktifkan di Admin Panel → Tab Pengaturan
- **Cek Version Code**: Pastikan `APP_VERSION_CODE` lebih besar dari versionCode di `android/app/build.gradle`
- **Cek Database**: Pastikan ada record di tabel `app_settings` dengan `key='updateEnabled'` dan `value='true'`
- **Cek Console**: Cek console log aplikasi untuk melihat error

### Database Error
- Jika ada error saat mengakses database, sistem akan otomatis fallback ke environment variable
- Pastikan `DATABASE_URL` sudah di-set dengan benar di Vercel
- Cek log di Vercel untuk melihat error detail

## 📚 File yang Terkait

- `pages/api/app/version.ts` - API endpoint yang membaca dari database (priority) atau environment variables (fallback)
- `components/AppUpdateChecker.tsx` - Komponen yang menampilkan dialog update
- `components/admin/AppSettingsControl.tsx` - Komponen UI untuk kontrol update di admin panel
- `server/trpc/routers/appSettings.ts` - tRPC router untuk get/set app settings
- `prisma/schema.prisma` - Schema database dengan model `AppSettings`
- `app/profile/page.tsx` - Admin panel page dengan tab Pengaturan
- `android/app/build.gradle` - File yang berisi versionCode dan versionName aplikasi

## 🗄️ Database Schema

### Model: AppSettings
```prisma
model AppSettings {
  id            String    @id @default(cuid())
  key           String    @unique
  value         String
  description   String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### Setup Database
Setelah menambahkan model `AppSettings` di schema, jalankan:
```bash
npx prisma db push
npx prisma generate
```

Atau jika menggunakan migration:
```bash
npx prisma migrate dev --name add_app_settings
```
