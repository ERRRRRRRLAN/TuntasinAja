# ✅ Fix Push Notification - Selesai

## 🔧 Perbaikan yang Sudah Dilakukan

### 1. **PushNotificationSetup Component** (`components/notifications/PushNotificationSetup.tsx`)

#### Perbaikan:
- ✅ **Native Platform Detection**: Lebih lenient - hanya check `platform === 'android' || platform === 'ios'`
- ✅ **Error Handling**: Lebih robust dengan try-catch di setiap step
- ✅ **Permission Handling**: Retry mechanism jika permission masih "prompt"
- ✅ **useEffect Dependencies**: Diperbaiki untuk mencegah re-initialization yang tidak perlu
- ✅ **Token Persistence**: Token tidak di-unregister saat component unmount (persist across restarts)
- ✅ **Logging**: Logging lebih detail di setiap step untuk debugging
- ✅ **Session Handling**: Wait untuk session ready sebelum setup

#### Flow yang Diperbaiki:
```
1. Wait for session ready
2. Load Capacitor modules (dynamic import)
3. Check if native platform (android/ios)
4. Request permission (dengan retry)
5. Register dengan FCM
6. Listen for token registration
7. Send token ke backend
8. ✅ Token terdaftar
```

### 2. **Firebase Admin** (`lib/firebase-admin.ts`)

#### Perbaikan:
- ✅ **Data Payload Formatting**: Semua data values dikonversi ke string (FCM requirement)
- ✅ **Android Priority**: Set priority ke "high" untuk Android
- ✅ **iOS APNS Config**: Tambah APNS headers untuk iOS (future-proof)
- ✅ **Error Logging**: Logging lebih detail untuk failures

### 3. **Backend Logging** (Sudah ada sebelumnya)

- ✅ Logging di `ThreadRouter` saat mengirim notifikasi
- ✅ Logging di `sendNotificationToClass` dengan detail device tokens
- ✅ Logging di `NotificationRouter` saat register token

## 📋 Checklist Setup (Pastikan Sudah Dilakukan)

### ✅ Firebase Setup
- [ ] Firebase project sudah dibuat
- [ ] Android app sudah ditambahkan dengan package: `com.tuntasinaja.app`
- [ ] `google-services.json` sudah di-download dan diletakkan di `android/app/google-services.json`
- [ ] Service Account JSON sudah di-download dari Firebase Console
- [ ] Environment variable `FIREBASE_SERVICE_ACCOUNT` sudah di-set di Vercel (dengan value JSON stringified)

### ✅ Database Setup
- [ ] Database migration sudah dijalankan: `npx prisma db push`
- [ ] Tabel `device_tokens` sudah ada di database

### ✅ APK Build
- [ ] APK sudah di-build dengan Capacitor: `npx cap sync android`
- [ ] APK sudah di-rebuild setelah semua perubahan

## 🧪 Testing Steps

### Step 1: Test Device Token Registration

1. **Install APK** di HP Android (yang sudah di-rebuild)
2. **Buka aplikasi** dan login dengan user biasa (bukan admin)
3. **Allow notification permission** saat diminta
4. **Cek Logcat** (Android Studio → Logcat, filter: `PushNotificationSetup`)

**Log yang harus muncul:**
```
[PushNotificationSetup] 🔄 Initializing push notification setup...
[PushNotificationSetup] ✅ Native platform detected, proceeding with setup...
[PushNotificationSetup] 📱 Starting push notification setup...
[PushNotificationSetup] 🔐 Requesting permissions...
[PushNotificationSetup] ✅ Permission granted, registering with FCM...
[PushNotificationSetup] 📡 Registration request sent to FCM
[PushNotificationSetup] ⏳ Waiting for FCM token...
[PushNotificationSetup] ✅ Push registration success!
[PushNotificationSetup] 📤 Sending token to backend...
[PushNotificationSetup] ✅✅ Token registered successfully in backend!
```

5. **Cek Database** (Supabase):
```sql
SELECT 
  dt.id,
  u.name,
  u.kelas,
  dt.device_info,
  dt.created_at
FROM device_tokens dt
JOIN users u ON dt.user_id = u.id
ORDER BY dt.created_at DESC;
```

**Expected:** Harus ada record baru dengan `device_info = 'android'`

6. **Cek Vercel Logs**:
```
[NotificationRouter] Registering device token: {...}
[NotificationRouter] ✅ Device token registered successfully
```

### Step 2: Test Notification Sending

1. **Setup:**
   - HP Android: Login dengan User A (kelas: "X RPL 1")
   - Laptop/Web: Login dengan User B (kelas: "X RPL 1" - SAMA)

2. **Pastikan device token terdaftar** (cek database)

3. **Buat thread baru** dari Laptop/Web (User B)

4. **Cek Vercel Logs**:
```
[ThreadRouter] Sending notification for new thread: { kelas: 'X RPL 1', ... }
[sendNotificationToClass] Starting notification send: { kelas: 'X RPL 1', ... }
[sendNotificationToClass] Found device tokens: { count: 1, ... }
[FirebaseAdmin] Sending push notification: { tokenCount: 1, ... }
[FirebaseAdmin] ✅ Push notification sent: { successCount: 1, ... }
```

5. **Cek HP Android** - Harus menerima notifikasi:
   - Title: "Tugas Baru"
   - Body: "[Nama User B] membuat tugas baru: [Nama Thread]"

## 🐛 Troubleshooting

### Problem: Device Token Tidak Terdaftar

**Cek Logcat:**
- Jika muncul: `Capacitor not available` → APK tidak di-build dengan Capacitor
- Jika muncul: `Permission denied` → Enable notification permission di Settings
- Jika muncul: `Registration error` → Cek `google-services.json`

**Solusi:**
1. Pastikan APK di-build dengan `npx cap sync android`
2. Enable notification permission
3. Cek `google-services.json` sudah benar
4. Rebuild APK

### Problem: Notifikasi Tidak Muncul

**Cek Vercel Logs:**
- Jika muncul: `No device tokens found for this class` → Device token tidak terdaftar atau kelas berbeda
- Jika muncul: `FIREBASE_SERVICE_ACCOUNT not set` → Firebase config belum di-set

**Solusi:**
1. Cek device token terdaftar di database
2. Cek kelas user sama
3. Set `FIREBASE_SERVICE_ACCOUNT` di Vercel
4. Redeploy aplikasi

### Problem: Permission Denied

**Solusi:**
1. Buka Android Settings → Apps → TuntasinAja → Notifications
2. Enable "Allow notifications"
3. Restart aplikasi
4. Login ulang

## 📝 Perubahan Kode Utama

### 1. Native Platform Detection
**Sebelum:**
```typescript
const isNative = Capacitor.isNativePlatform() || 
                 Capacitor.getPlatform() === 'android' || 
                 Capacitor.getPlatform() === 'ios'
```

**Sekarang:**
```typescript
const platform = Capacitor.getPlatform()
if (platform !== 'android' && platform !== 'ios') {
  // Skip
}
```

Lebih sederhana dan reliable.

### 2. useEffect Dependencies
**Sebelum:**
```typescript
}, [session, status, registerToken, unregisterToken])
```

**Sekarang:**
```typescript
}, [session, status])
```

Mencegah re-initialization yang tidak perlu.

### 3. Token Persistence
**Sebelum:**
```typescript
// Unregister token when component unmounts
if (deviceToken) {
  unregisterToken.mutate({ token: deviceToken })
}
```

**Sekarang:**
```typescript
// Note: We don't unregister token on unmount anymore
// Token should persist across app restarts
```

Token akan persist, tidak dihapus saat app close.

### 4. Permission Retry
**Sebelum:**
```typescript
if (permResult.receive === 'prompt') {
  permResult = await PushNotifications.requestPermissions()
}
```

**Sekarang:**
```typescript
if (permResult.receive === 'prompt') {
  await new Promise(resolve => setTimeout(resolve, 1000))
  permResult = await PushNotifications.requestPermissions()
}
```

Tambah delay untuk memberikan waktu user merespons.

## ✅ Verifikasi Setelah Fix

Setelah Vercel deploy selesai dan APK di-rebuild:

- [ ] Device token terdaftar setelah login
- [ ] Logcat menunjukkan semua step berhasil
- [ ] Vercel logs menunjukkan token terdaftar
- [ ] Notifikasi muncul saat thread baru dibuat
- [ ] Notifikasi muncul saat comment baru ditambahkan

## 🚀 Next Steps

1. **Tunggu Vercel deploy selesai** (cek dashboard)
2. **Rebuild APK** dengan script build
3. **Install APK baru** di HP Android
4. **Test device token registration** (Step 1)
5. **Test notification sending** (Step 2)

---

**Status:** ✅ Fix selesai, siap untuk testing!

