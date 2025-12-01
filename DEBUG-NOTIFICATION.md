# 🐛 Debug Push Notification - Panduan Lengkap

## 🔍 Checklist Debugging

Jika notifikasi tidak muncul, ikuti checklist ini:

### ✅ Step 1: Cek Device Token Terdaftar

Jalankan query SQL di Supabase:

```sql
-- Cek semua device tokens
SELECT 
  dt.id,
  dt.user_id,
  u.name as user_name,
  u.email,
  u.kelas,
  dt.token,
  dt.device_info,
  dt.created_at
FROM device_tokens dt
JOIN users u ON dt.user_id = u.id
ORDER BY dt.created_at DESC;
```

**Expected Result:**
- ✅ Harus ada record untuk user di HP Android
- ✅ `device_info` = "android"
- ✅ `kelas` harus sesuai dengan kelas user

**Jika TIDAK ada:**
- Device token belum terdaftar
- Cek Logcat di HP untuk error registration
- Pastikan permission notification sudah di-allow

### ✅ Step 2: Cek Kelas User Sama

Jalankan query SQL:

```sql
-- Cek kelas kedua user
SELECT 
  id,
  name,
  email,
  kelas,
  isAdmin
FROM users
WHERE email IN ('email_user_hp@example.com', 'email_user_laptop@example.com');
```

**Expected Result:**
- ✅ Kedua user harus memiliki `kelas` yang SAMA
- ✅ Kedua user `isAdmin` = false (admin tidak menerima notifikasi)

**Jika kelas berbeda:**
- Notifikasi tidak akan dikirim (by design)
- Pastikan kedua user di kelas yang sama

### ✅ Step 3: Cek Vercel Logs

1. Buka [Vercel Dashboard](https://vercel.com/dashboard)
2. Pilih project **TuntasinAja**
3. Buka tab **Logs**
4. Filter dengan: `ThreadRouter` atau `sendNotificationToClass`
5. Buat thread baru dari laptop
6. Cek log yang muncul

**Log yang harus muncul:**

```
[ThreadRouter] Sending notification for new thread: { kelas: 'X RPL 1', ... }
[sendNotificationToClass] Starting notification send: { kelas: 'X RPL 1', ... }
[sendNotificationToClass] Found device tokens: { count: 1, ... }
[FirebaseAdmin] Sending push notification: { tokenCount: 1, ... }
[FirebaseAdmin] ✅ Push notification sent: { successCount: 1, ... }
```

**Jika muncul error:**
- `No device tokens found for this class` → Device token tidak terdaftar
- `FIREBASE_SERVICE_ACCOUNT not set` → Firebase config belum di-set
- `Failed to parse FIREBASE_SERVICE_ACCOUNT` → Format JSON salah

### ✅ Step 4: Cek Firebase Config

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project **TuntasinAja**
3. Buka **Project Settings** → **Service Accounts**
4. Pastikan Service Account sudah dibuat
5. Cek di Vercel → **Settings** → **Environment Variables**
6. Pastikan `FIREBASE_SERVICE_ACCOUNT` sudah di-set

**Format yang benar:**
- Value harus JSON string (bukan file path)
- Harus valid JSON format
- Harus memiliki field: `project_id`, `private_key`, `client_email`

### ✅ Step 5: Cek Logcat di HP Android

1. Connect HP Android via USB
2. Buka Android Studio → **Logcat**
3. Filter dengan: `PushNotificationSetup`
4. Login ke aplikasi
5. Cek log yang muncul

**Log yang harus muncul:**

```
[PushNotificationSetup] Effect triggered { isNative: true, ... }
[PushNotificationSetup] Starting push notification setup...
[PushNotificationSetup] ✅ Push registration success!
[PushNotificationSetup] Token: [token akan muncul]
[PushNotificationSetup] ✅ Token registered successfully in backend!
```

**Jika ada error:**
- `Permission denied` → Enable notification permission di Settings
- `Registration error` → Firebase config bermasalah
- `Error registering token in backend` → Cek Vercel logs untuk error API

### ✅ Step 6: Test Manual via Firebase Console

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project → **Cloud Messaging**
3. Klik **Send test message**
4. Masukkan device token dari database
5. Kirim test message

**Jika test message tidak terkirim:**
- Firebase config bermasalah
- Device token tidak valid
- `google-services.json` tidak benar

## 🔧 Troubleshooting Berdasarkan Error

### Error: "No device tokens found for this class"

**Penyebab:**
- Device token tidak terdaftar di database
- User di HP tidak memiliki kelas yang sama dengan user di laptop
- User di HP adalah admin

**Solusi:**
1. Cek device token terdaftar (Step 1)
2. Cek kelas user sama (Step 2)
3. Pastikan user bukan admin

### Error: "FIREBASE_SERVICE_ACCOUNT not set"

**Penyebab:**
- Environment variable belum di-set di Vercel

**Solusi:**
1. Buka Firebase Console → Service Accounts
2. Generate new private key
3. Copy isi JSON file
4. Buka Vercel → Settings → Environment Variables
5. Tambah `FIREBASE_SERVICE_ACCOUNT` dengan value JSON (stringified)
6. Redeploy aplikasi

### Error: "Failed to parse FIREBASE_SERVICE_ACCOUNT"

**Penyebab:**
- Format JSON salah
- Ada karakter escape yang salah

**Solusi:**
1. Pastikan JSON valid (bisa test di jsonlint.com)
2. Pastikan semua `"` sudah di-escape dengan `\"`
3. Atau gunakan single quotes di Vercel

### Notifikasi Terkirim tapi Tidak Muncul di HP

**Penyebab:**
- Permission notification tidak di-allow
- Aplikasi di-force close
- Do Not Disturb mode aktif

**Solusi:**
1. Buka Android Settings → Apps → TuntasinAja → Notifications
2. Enable "Allow notifications"
3. Restart aplikasi
4. Cek Do Not Disturb mode

### Device Token Terdaftar tapi Notifikasi Tidak Muncul

**Kemungkinan:**
1. Kelas user berbeda
2. User adalah admin
3. Firebase config salah
4. Token sudah expired/invalid

**Solusi:**
1. Cek kelas user sama (Step 2)
2. Cek Vercel logs untuk error (Step 3)
3. Test manual via Firebase Console (Step 6)
4. Re-register device token (logout dan login ulang)

## 📊 Query SQL untuk Debugging

### Cek Device Tokens untuk Kelas Tertentu

```sql
SELECT 
  dt.id,
  u.name,
  u.kelas,
  dt.device_info,
  dt.created_at
FROM device_tokens dt
JOIN users u ON dt.user_id = u.id
WHERE u.kelas = 'X RPL 1'  -- Ganti dengan kelas yang diinginkan
ORDER BY dt.created_at DESC;
```

### Cek User di Kelas Tertentu

```sql
SELECT 
  id,
  name,
  email,
  kelas,
  isAdmin
FROM users
WHERE kelas = 'X RPL 1'  -- Ganti dengan kelas yang diinginkan
  AND isAdmin = false;
```

### Cek Device Token untuk User Tertentu

```sql
SELECT 
  dt.*,
  u.name,
  u.kelas,
  u.email
FROM device_tokens dt
JOIN users u ON dt.user_id = u.id
WHERE u.email = 'email@example.com';  -- Ganti dengan email user
```

## 🎯 Langkah Debugging Cepat

1. **Cek Database:**
   ```sql
   SELECT * FROM device_tokens ORDER BY created_at DESC LIMIT 10;
   ```

2. **Cek Vercel Logs:**
   - Filter: `ThreadRouter` atau `sendNotificationToClass`
   - Buat thread baru
   - Lihat log yang muncul

3. **Cek Logcat:**
   - Filter: `PushNotificationSetup`
   - Login ulang
   - Lihat apakah token terdaftar

4. **Test Manual:**
   - Firebase Console → Cloud Messaging → Send test message
   - Masukkan token dari database
   - Kirim test message

## ✅ Verifikasi Setelah Fix

Setelah melakukan fix, verifikasi:

- [ ] Device token terdaftar di database
- [ ] Kelas user sama
- [ ] Vercel logs menunjukkan notification terkirim
- [ ] Firebase Console test message berhasil
- [ ] Notifikasi muncul di HP

---

**Jika masih tidak bekerja setelah semua langkah di atas, cek:**
1. Apakah APK sudah di-rebuild setelah perubahan?
2. Apakah Vercel sudah di-redeploy?
3. Apakah Firebase project ID benar?
4. Apakah `google-services.json` sudah benar?

