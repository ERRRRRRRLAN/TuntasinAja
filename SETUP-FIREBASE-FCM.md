# 🔥 Setup Firebase Cloud Messaging (FCM) untuk Push Notifications

Panduan lengkap untuk setup Firebase Cloud Messaging agar notifikasi bisa muncul bahkan ketika aplikasi tidak dibuka.

## 📋 Prerequisites

1. Akun Google (untuk Firebase Console)
2. Project Firebase yang sudah dibuat

## 🚀 Langkah 1: Buat Firebase Project

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Klik **"Add project"** atau pilih project yang sudah ada
3. Isi nama project (misal: `tuntasinaja`)
4. Ikuti wizard setup (Google Analytics optional)

## 🔑 Langkah 2: Setup Web App di Firebase

1. Di Firebase Console, klik ikon **Web** (`</>`)
2. Register app dengan nama: `TuntasinAja Web`
3. **JANGAN** centang "Also set up Firebase Hosting"
4. Copy Firebase configuration object yang muncul

## 🔐 Langkah 3: Generate VAPID Key

1. Di Firebase Console, buka **Project Settings** (ikon gear)
2. Pilih tab **Cloud Messaging**
3. Scroll ke **Web Push certificates**
4. Klik **Generate key pair** (jika belum ada)
5. Copy **Key pair** yang di-generate (ini adalah VAPID key)

## 🔧 Langkah 4: Setup Service Account (untuk Server-side)

1. Di Firebase Console, buka **Project Settings**
2. Pilih tab **Service accounts**
3. Klik **Generate new private key**
4. Download file JSON (ini adalah service account key)
5. **PENTING:** Simpan file ini dengan aman, jangan commit ke Git!

## 📝 Langkah 5: Update Environment Variables

Tambahkan ke `.env` dan Vercel Environment Variables:

### Client-side (NEXT_PUBLIC_*)
```env
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcdef"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-XXXXXXXXXX"
NEXT_PUBLIC_FIREBASE_VAPID_KEY="BK-..."
```

### Server-side
```env
# Service account key sebagai JSON string (atau base64 encoded)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
```

**Cara mendapatkan service account key sebagai string:**
1. Buka file JSON yang didownload
2. Copy seluruh isi file
3. Paste sebagai string di environment variable
4. Atau encode ke base64: `cat serviceAccountKey.json | base64`

## 🔄 Langkah 6: Update Service Worker

File `public/firebase-messaging-sw.js` perlu di-update dengan Firebase config Anda:

1. Buka `public/firebase-messaging-sw.js`
2. Ganti `YOUR_API_KEY`, `YOUR_AUTH_DOMAIN`, dll dengan nilai dari Firebase Console
3. Atau gunakan dynamic config (lihat di bawah)

## 🛠️ Langkah 7: Update Database Schema

Jalankan migration untuk menambahkan kolom `fcm_token`:

```bash
npx prisma db push
```

Atau buat migration:
```bash
npx prisma migrate dev --name add_fcm_token
```

## ✅ Langkah 8: Test

1. Build aplikasi: `npm run build`
2. Start server: `npm start`
3. Buka aplikasi di browser
4. Buka console browser (F12)
5. Cek apakah FCM token berhasil di-generate
6. Test push notification dari Firebase Console

## 📱 Cara Kerja

1. **User membuka aplikasi** → FCM token di-generate dan disimpan ke database
2. **User A membuat thread** → Backend mengirim push notification ke semua user di kelas yang sama
3. **User B mendapat notifikasi** → Bahkan jika aplikasi tidak dibuka!

## 🔍 Troubleshooting

### FCM token tidak ter-generate
- Pastikan semua `NEXT_PUBLIC_FIREBASE_*` variables sudah di-set
- Cek console browser untuk error
- Pastikan Service Worker terdaftar (DevTools → Application → Service Workers)

### Push notification tidak muncul
- Pastikan `FIREBASE_SERVICE_ACCOUNT_KEY` sudah di-set di server
- Cek server logs untuk error
- Pastikan FCM token valid di database

### Service Worker error
- Pastikan `firebase-messaging-sw.js` ada di folder `public/`
- Cek apakah file di-load dengan benar (Network tab)
- Pastikan Firebase config di service worker benar

## 📚 Referensi

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Notifications](https://firebase.google.com/docs/cloud-messaging/js/receive)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

