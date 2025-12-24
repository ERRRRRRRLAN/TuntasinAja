# 🔔 Setup Push Notification dengan Firebase

Panduan lengkap untuk setup push notification menggunakan Firebase Cloud Messaging (FCM) untuk aplikasi TuntasinAja.

## 📋 Prerequisites

1. **Firebase Project** - Buat project di [Firebase Console](https://console.firebase.google.com/)
2. **Firebase Service Account** - Download service account JSON
3. **Google Services JSON** - Download `google-services.json` untuk Android

## 🚀 Step-by-Step Setup

### Step 1: Buat Firebase Project

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Klik "Add project" atau pilih project yang sudah ada
3. Isi nama project (contoh: "TuntasinAja")
4. Enable Google Analytics (opsional)
5. Klik "Create project"

### Step 2: Tambahkan Android App ke Firebase

1. Di Firebase Console, klik ikon Android
2. Isi package name: `com.tuntasinaja.app`
3. Isi App nickname: `TuntasinAja` (opsional)
4. Download `google-services.json`
5. Letakkan file di: `android/app/google-services.json`

### Step 3: Setup Firebase Admin SDK

1. Di Firebase Console, buka **Project Settings** → **Service Accounts**
2. Klik **Generate new private key**
3. Download file JSON (ini adalah service account key)
4. Copy isi file JSON tersebut
5. Set environment variable `FIREBASE_SERVICE_ACCOUNT` di Vercel/Server:

```bash
# Di Vercel Dashboard → Settings → Environment Variables
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

**⚠️ PENTING**: 
- Jangan commit file service account ke git!
- Simpan sebagai environment variable di Vercel
- File JSON harus di-stringify (semua dalam satu baris)

### Step 4: Migrate Database

Jalankan SQL script untuk membuat tabel `device_tokens`:

```sql
-- File: scripts/create-device-tokens-table.sql
-- Jalankan di Supabase SQL Editor
```

Atau jalankan via Prisma:

```bash
npx prisma db push
```

### Step 5: Rebuild APK

Setelah semua setup selesai, rebuild APK:

```powershell
.\build-signed-apk.ps1
```

## 📱 Cara Kerja

### 1. Device Registration
- Saat user login di aplikasi mobile, `PushNotificationSetup` component akan:
  - Request permission untuk push notification
  - Register device dengan FCM
  - Mengirim device token ke backend via `notification.registerToken`

### 2. Notification Trigger
- **Thread Baru**: Ketika ada user membuat thread baru di kelas mereka, semua user di kelas yang sama akan menerima notifikasi
- **Sub Tugas Baru**: Ketika ada user menambahkan comment (sub tugas) baru, semua user di kelas yang sama akan menerima notifikasi

### 3. Notification Content
- **Title**: "Tugas Baru" atau "Sub Tugas Baru"
- **Body**: Nama user + detail tugas
- **Data**: `type`, `threadId`, `threadTitle` untuk deep linking

## 🔧 Konfigurasi yang Sudah Dibuat

### Backend
- ✅ `lib/firebase-admin.ts` - Firebase Admin SDK setup
- ✅ `server/trpc/routers/notification.ts` - API untuk register/unregister token
- ✅ `server/trpc/routers/thread.ts` - Trigger notification saat thread/comment dibuat
- ✅ `prisma/schema.prisma` - Model DeviceToken

### Frontend
- ✅ `components/notifications/PushNotificationSetup.tsx` - Auto-register device token
- ✅ `app/providers.tsx` - Include PushNotificationSetup component

### Android
- ✅ `android/app/src/main/AndroidManifest.xml` - Permissions untuk notification
- ✅ `android/app/build.gradle` - Google Services plugin
- ✅ `android/build.gradle` - Google Services classpath

## 🧪 Testing

### 1. Test Device Registration
1. Install APK di device Android
2. Login ke aplikasi
3. Check console log untuk melihat token registration
4. Check database `device_tokens` table untuk melihat token tersimpan

### 2. Test Notification
1. Buat thread baru sebagai user dari kelas tertentu
2. User lain di kelas yang sama harus menerima notifikasi
3. Check Firebase Console → Cloud Messaging untuk melihat delivery status

## 🐛 Troubleshooting

### Error: FIREBASE_SERVICE_ACCOUNT not set
- Pastikan environment variable sudah di-set di Vercel
- Pastikan format JSON sudah benar (stringified)

### Error: google-services.json not found
- Pastikan file `google-services.json` ada di `android/app/`
- Pastikan package name di Firebase Console sama dengan `com.tuntasinaja.app`

### Notification tidak terkirim
- Check device token sudah terdaftar di database
- Check Firebase Console untuk error logs
- Pastikan user dari kelas yang sama
- Pastikan user bukan admin (admin tidak menerima notifikasi)

### Permission denied
- User perlu allow notification permission saat pertama kali
- Check Android settings → Apps → TuntasinAja → Notifications

## 📝 Environment Variables

Tambahkan di Vercel Dashboard:

```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

## 🔐 Security Notes

- Service account key sangat sensitif - jangan commit ke git
- Device tokens disimpan di database dengan user ID
- Notification hanya dikirim ke user di kelas yang sama
- Admin tidak menerima notifikasi

## 📚 Next Steps

Setelah setup dasar bekerja, bisa ditambahkan:
- Deep linking saat notifikasi diklik
- Badge count untuk unread notifications
- Notification settings per user
- Scheduled notifications untuk reminder

