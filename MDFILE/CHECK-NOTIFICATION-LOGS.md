# 🔍 Cara Cek Log Notifikasi

## ⚠️ Penting: Log Notifikasi Ada di 2 Tempat Berbeda!

### 1. **Logcat di HP Android** (Client-side)
- Log untuk **device token registration**
- Log saat user login dan device token terdaftar
- Filter: `PushNotificationSetup`

### 2. **Vercel Logs** (Server-side) ⭐ **INI YANG PENTING UNTUK NOTIFIKASI**
- Log untuk **pengiriman notifikasi**
- Log saat thread dibuat dan notifikasi dikirim
- Filter: `ThreadRouter`, `sendNotificationToClass`, `FirebaseAdmin`

## 📍 Di Mana Cek Log untuk Notifikasi?

### ✅ Untuk Cek Apakah Notifikasi Dikirim:
**CEK VERCEL LOGS, BUKAN LOGCAT!**

1. Buka [Vercel Dashboard](https://vercel.com/dashboard)
2. Pilih project **TuntasinAja**
3. Buka tab **Logs**
4. Filter dengan: `ThreadRouter` atau `sendNotificationToClass`
5. Buat thread baru dari device lain
6. **Log akan muncul di sini, bukan di logcat HP!**

### ✅ Untuk Cek Apakah Device Token Terdaftar:
**CEK LOGCAT DI HP ANDROID**

1. Connect HP via USB
2. Buka Android Studio → Logcat
3. Filter: `PushNotificationSetup`
4. Login di HP
5. Log akan muncul di logcat

## 🔍 Langkah Debugging Lengkap

### Step 1: Cek Device Token Terdaftar

**Di Logcat HP Android:**
```
[PushNotificationSetup] 🚀 Component mounted!
[PushNotificationSetup] ⚡ useEffect triggered
[PushNotificationSetup] 🔄 Initializing push notification setup...
[PushNotificationSetup] ✅ Push registration success!
[PushNotificationSetup] ✅✅ Token registered successfully in backend!
```

**Atau cek Database:**
```sql
SELECT * FROM device_tokens ORDER BY created_at DESC;
```

### Step 2: Cek Notifikasi Dikirim

**Di Vercel Logs (BUKAN LOGCAT!):**
1. Buka Vercel Dashboard → Logs
2. Buat thread baru dari device lain
3. Cari log:
```
[ThreadRouter] Sending notification for new thread: { kelas: '...', ... }
[sendNotificationToClass] Starting notification send: { kelas: '...', ... }
[sendNotificationToClass] Found device tokens: { count: 1, ... }
[FirebaseAdmin] Sending push notification: { tokenCount: 1, ... }
[FirebaseAdmin] ✅ Push notification sent: { successCount: 1, ... }
```

### Step 3: Cek Apakah Ada Error

**Di Vercel Logs:**
- Cari log dengan `ERROR` atau `❌`
- Cek apakah ada: `No device tokens found for this class`
- Cek apakah ada: `FIREBASE_SERVICE_ACCOUNT not set`

## 🎯 Checklist Debugging

### ✅ Device Token Registration (Logcat HP)
- [ ] Component mounted log muncul
- [ ] useEffect triggered log muncul
- [ ] Push registration success log muncul
- [ ] Token registered in backend log muncul
- [ ] Device token ada di database

### ✅ Notification Sending (Vercel Logs)
- [ ] ThreadRouter log muncul saat buat thread
- [ ] sendNotificationToClass log muncul
- [ ] Found device tokens log muncul (count > 0)
- [ ] FirebaseAdmin sending log muncul
- [ ] FirebaseAdmin success log muncul

## 🐛 Troubleshooting

### Problem: Tidak Ada Log di Logcat HP

**Kemungkinan:**
- Component tidak ter-mount
- Session belum ready
- APK tidak menggunakan kode terbaru

**Solusi:**
1. Pastikan sudah login di HP
2. Rebuild APK dengan kode terbaru
3. Install APK baru
4. Cek logcat dengan filter kosong (tampilkan semua)

### Problem: Tidak Ada Log di Vercel

**Kemungkinan:**
- Vercel belum deploy kode terbaru
- Thread tidak dibuat dengan benar
- Ada error yang mencegah log muncul

**Solusi:**
1. Cek Vercel deploy status
2. Pastikan thread berhasil dibuat
3. Cek Vercel logs dengan filter kosong
4. Cek apakah ada error

### Problem: Log Ada Tapi Notifikasi Tidak Muncul

**Kemungkinan:**
- Device token tidak valid
- Firebase config salah
- Permission notification tidak di-allow

**Solusi:**
1. Cek Vercel logs untuk error Firebase
2. Enable notification permission di HP
3. Test manual via Firebase Console

## 📝 Query SQL untuk Debugging

### Cek Device Tokens
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

### Cek Apakah Ada Device Token untuk Kelas
```sql
SELECT 
  COUNT(*) as token_count,
  u.kelas
FROM device_tokens dt
JOIN users u ON dt.user_id = u.id
WHERE u.kelas = 'X RPL 1'  -- Ganti dengan kelas yang diinginkan
  AND u.isAdmin = false
GROUP BY u.kelas;
```

## 🎯 Kesimpulan

**Untuk debugging notifikasi:**
- ✅ **Logcat HP**: Cek device token registration
- ✅ **Vercel Logs**: Cek pengiriman notifikasi (INI YANG PENTING!)
- ✅ **Database**: Cek device tokens terdaftar

**Log notifikasi pengiriman ada di Vercel, bukan di logcat HP!**

