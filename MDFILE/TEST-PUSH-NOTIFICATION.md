# 🧪 Testing Push Notification - Panduan Lengkap

## 🔍 Debugging: Device Token Tidak Terdaftar

Jika device token tidak muncul di database setelah login, ikuti langkah-langkah debugging berikut:

### Step 1: Cek Log di Device Android

#### A. Menggunakan Android Studio Logcat

1. Buka Android Studio
2. Connect device Android via USB (atau gunakan emulator)
3. Buka tab **Logcat**
4. Filter dengan keyword: `PushNotificationSetup`
5. Login ke aplikasi dan perhatikan log yang muncul

#### B. Log yang Harus Muncul:

```
[PushNotificationSetup] Effect triggered { isNative: true, platform: 'android', ... }
[PushNotificationSetup] Starting push notification setup...
[PushNotificationSetup] Requesting permissions...
[PushNotificationSetup] Permission granted, registering with FCM...
[PushNotificationSetup] ✅ Push registration success!
[PushNotificationSetup] Token: [token akan muncul di sini]
[PushNotificationSetup] Sending token to backend...
[PushNotificationSetup] ✅ Token registered successfully in backend!
```

#### C. Jika Ada Error:

- **"Not native platform"** → APK belum di-build dengan benar atau Capacitor tidak terdeteksi
- **"Permission denied"** → User menolak permission notification
- **"Registration error"** → Firebase config bermasalah (cek `google-services.json`)
- **"Error registering token in backend"** → API endpoint error atau database error

### Step 2: Cek Backend Logs (Vercel)

1. Buka [Vercel Dashboard](https://vercel.com/dashboard)
2. Pilih project **TuntasinAja**
3. Buka tab **Logs**
4. Filter dengan: `NotificationRouter`
5. Cari log saat user login

#### Log yang Harus Muncul:

```
[NotificationRouter] Registering device token: { userId: '...', userName: '...', ... }
[NotificationRouter] ✅ Device token registered successfully: { id: '...', userId: '...', ... }
```

### Step 3: Cek Database

Jalankan query SQL di Supabase:

```sql
-- Cek semua device tokens
SELECT 
  dt.id,
  dt.user_id,
  u.name as user_name,
  u.kelas,
  dt.token,
  dt.device_info,
  dt.created_at,
  dt.updated_at
FROM device_tokens dt
JOIN users u ON dt.user_id = u.id
ORDER BY dt.created_at DESC;

-- Cek token untuk user tertentu
SELECT 
  dt.*,
  u.name,
  u.kelas
FROM device_tokens dt
JOIN users u ON dt.user_id = u.id
WHERE u.email = 'email_user@example.com';
```

### Step 4: Verifikasi Firebase Config

1. Pastikan `google-services.json` ada di `android/app/google-services.json`
2. Cek isi file, pastikan:
   - `project_id` sesuai dengan Firebase project
   - `package_name` = `com.tuntasinaja.app`
   - File tidak corrupt

3. Pastikan Firebase Service Account sudah di-set di Vercel:
   - Environment Variable: `FIREBASE_SERVICE_ACCOUNT`
   - Value: JSON string dari Firebase Console → Service Accounts

### Step 5: Rebuild APK

Setelah melakukan perubahan, **WAJIB rebuild APK**:

```powershell
.\build-signed-apk.ps1
```

**PENTING**: Setiap perubahan di kode frontend memerlukan rebuild APK!

---

## ✅ Testing Workflow Lengkap

### Test 1: Device Registration

1. **Install APK** di device Android (yang sudah di-rebuild)
2. **Buka aplikasi** dan login dengan user biasa (bukan admin)
3. **Allow notification permission** saat diminta
4. **Cek Logcat** untuk melihat log registration
5. **Cek database** `device_tokens` table
6. **Cek Vercel logs** untuk melihat backend registration

**Expected Result**: 
- ✅ Logcat menunjukkan token berhasil didapat
- ✅ Database memiliki record baru di `device_tokens`
- ✅ Vercel logs menunjukkan token terdaftar

### Test 2: Notification - Thread Baru

**Setup**:
- Device A: Login dengan User A (kelas: "X RPL 1")
- Device B: Login dengan User B (kelas: "X RPL 1")

**Steps**:
1. Pastikan kedua device sudah terdaftar (cek database)
2. Di Device A: Buat thread baru (misal: "Matematika")
3. Di Device B: Harus menerima notifikasi

**Expected Result**:
- ✅ Device B menerima notifikasi dengan:
  - Title: "Tugas Baru"
  - Body: "[Nama User A] membuat tugas baru: Matematika"

### Test 3: Notification - Comment Baru

**Setup**:
- Device A: Login dengan User A (kelas: "X RPL 1")
- Device B: Login dengan User B (kelas: "X RPL 1")

**Steps**:
1. Pastikan kedua device sudah terdaftar
2. Di Device A: Buka thread yang sudah ada, tambahkan comment baru
3. Di Device B: Harus menerima notifikasi

**Expected Result**:
- ✅ Device B menerima notifikasi dengan:
  - Title: "Sub Tugas Baru"
  - Body: "[Nama User A] menambahkan sub tugas baru di [Nama Thread]"

### Test 4: Notification - Kelas Berbeda

**Setup**:
- Device A: Login dengan User A (kelas: "X RPL 1")
- Device B: Login dengan User B (kelas: "X RPL 2") ← **Kelas berbeda**

**Steps**:
1. Di Device A: Buat thread baru
2. Di Device B: **TIDAK** harus menerima notifikasi

**Expected Result**:
- ✅ Device B **TIDAK** menerima notifikasi (karena kelas berbeda)

### Test 5: Admin Tidak Menerima Notifikasi

**Setup**:
- Device A: Login dengan User A (kelas: "X RPL 1", isAdmin: false)
- Device B: Login dengan Admin (isAdmin: true)

**Steps**:
1. Di Device A: Buat thread baru
2. Di Device B: **TIDAK** harus menerima notifikasi

**Expected Result**:
- ✅ Admin **TIDAK** menerima notifikasi

---

## 🐛 Troubleshooting

### Problem: Device Token Tidak Terdaftar

**Kemungkinan Penyebab**:
1. Component tidak berjalan (bukan native platform)
2. Permission ditolak
3. Firebase config salah
4. API endpoint error
5. Database migration belum dijalankan

**Solusi**:
1. ✅ Cek Logcat untuk melihat error
2. ✅ Pastikan APK sudah di-rebuild setelah perubahan
3. ✅ Cek `google-services.json` sudah benar
4. ✅ Cek Vercel logs untuk error backend
5. ✅ Jalankan database migration: `npx prisma db push`

### Problem: Notifikasi Tidak Muncul

**Kemungkinan Penyebab**:
1. Device token tidak terdaftar
2. User dari kelas berbeda
3. User adalah admin
4. Firebase Service Account tidak di-set
5. FCM server error

**Solusi**:
1. ✅ Cek database: apakah device token terdaftar?
2. ✅ Cek kelas user: apakah sama?
3. ✅ Cek `isAdmin`: admin tidak menerima notifikasi
4. ✅ Cek Vercel environment variable: `FIREBASE_SERVICE_ACCOUNT`
5. ✅ Cek Firebase Console → Cloud Messaging → Usage

### Problem: Permission Denied

**Solusi**:
1. Buka Android Settings → Apps → TuntasinAja → Notifications
2. Enable "Allow notifications"
3. Restart aplikasi
4. Login ulang

### Problem: "FIREBASE_SERVICE_ACCOUNT not set"

**Solusi**:
1. Buka Firebase Console → Project Settings → Service Accounts
2. Generate new private key (atau gunakan yang sudah ada)
3. Copy isi JSON file
4. Buka Vercel → Project → Settings → Environment Variables
5. Tambah variable: `FIREBASE_SERVICE_ACCOUNT`
6. Value: Paste JSON (stringified)
7. Redeploy aplikasi

---

## 📊 Checklist Testing

Gunakan checklist ini untuk memastikan semua fitur bekerja:

- [ ] APK sudah di-install di device Android
- [ ] User sudah login (bukan admin)
- [ ] Permission notification sudah di-allow
- [ ] Device token terdaftar di database (`device_tokens` table)
- [ ] Firebase Service Account sudah di-set di Vercel
- [ ] `google-services.json` sudah ada di `android/app/`
- [ ] Database migration sudah dijalankan
- [ ] APK sudah di-rebuild setelah perubahan
- [ ] Logcat menunjukkan token registration success
- [ ] Vercel logs menunjukkan backend registration success
- [ ] Notifikasi muncul saat thread baru dibuat
- [ ] Notifikasi muncul saat comment baru ditambahkan
- [ ] Notifikasi tidak muncul untuk kelas berbeda
- [ ] Admin tidak menerima notifikasi

---

## 🔧 Quick Debug Commands

### Cek Device Tokens di Database

```sql
-- Semua tokens
SELECT * FROM device_tokens ORDER BY created_at DESC;

-- Tokens untuk kelas tertentu
SELECT dt.*, u.name, u.kelas 
FROM device_tokens dt
JOIN users u ON dt.user_id = u.id
WHERE u.kelas = 'X RPL 1';
```

### Test Manual via Firebase Console

1. Buka Firebase Console → Cloud Messaging
2. Klik "Send test message"
3. Masukkan device token dari database
4. Kirim test message
5. Jika tidak terkirim, kemungkinan Firebase config bermasalah

---

## 📝 Catatan Penting

1. **Setiap perubahan kode memerlukan rebuild APK** - tidak cukup hanya restart aplikasi
2. **Logcat adalah tools utama untuk debugging** - selalu cek log saat testing
3. **Database migration wajib dijalankan** - pastikan tabel `device_tokens` sudah ada
4. **Firebase config harus benar** - `google-services.json` dan Service Account
5. **Notifikasi hanya untuk user di kelas yang sama** - bukan semua user
6. **Admin tidak menerima notifikasi** - sesuai requirement

---

## 🎯 Hasil yang Diharapkan

Setelah semua testing selesai, hasil yang diharapkan:

✅ Device token terdaftar otomatis saat login  
✅ Notifikasi muncul saat ada thread baru di kelas yang sama  
✅ Notifikasi muncul saat ada comment baru di kelas yang sama  
✅ Notifikasi tidak muncul untuk kelas berbeda  
✅ Admin tidak menerima notifikasi  
✅ Logcat menunjukkan semua proses berjalan dengan baik  
✅ Database memiliki record device tokens  
✅ Vercel logs menunjukkan backend berjalan dengan baik  

