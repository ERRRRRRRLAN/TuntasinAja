# 🔔 Web Push API Setup - TuntasinAja

Aplikasi TuntasinAja sekarang mendukung Web Push API untuk push notifications di browser (termasuk iOS Safari 16.4+ dan Android Chrome).

## ✅ Yang Sudah Diimplementasikan

### 1. Backend Implementation
- ✅ **Database Schema**: Model `WebPushSubscription` di Prisma schema
- ✅ **Web Push Library**: Setup `web-push` library di `lib/firebase-admin.ts`
- ✅ **Notification Router**: API untuk register/unregister Web Push subscription
- ✅ **Notification Sending**: Fungsi untuk mengirim Web Push notifications
- ✅ **Auto Cleanup**: Auto-delete expired subscriptions

### 2. Frontend Implementation
- ✅ **WebPushSetup Component**: Auto-register Web Push subscription saat user login
- ✅ **Service Worker**: Handle push events dan notification clicks
- ✅ **Integrated ke Providers**: Component sudah ditambahkan ke app layout

### 3. Service Worker
- ✅ **Push Handler**: Handle incoming push notifications
- ✅ **Notification Click**: Handle click pada notification untuk open app
- ✅ **Notification Close**: Handle close event

## 📋 Setup Instructions

### Step 1: Generate VAPID Keys

VAPID keys diperlukan untuk Web Push API. Generate sekali dan simpan di environment variables.

```bash
npm run generate:vapid-keys
```

Ini akan menghasilkan:
- `VAPID_PUBLIC_KEY` - Public key (bisa di-commit ke git)
- `VAPID_PRIVATE_KEY` - Private key (JANGAN commit ke git!)

### Step 2: Setup Environment Variables

Tambahkan ke `.env` atau environment variables di Vercel:

```env
# Web Push VAPID Keys
VAPID_PUBLIC_KEY="your-vapid-public-key-here"
VAPID_PRIVATE_KEY="your-vapid-private-key-here"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-vapid-public-key-here"

# Optional: Email untuk VAPID (default: noreply@tuntasinaja.com)
VAPID_EMAIL="noreply@tuntasinaja.com"
```

### Step 3: Migrate Database

Jalankan SQL script untuk membuat tabel `web_push_subscriptions`:

1. Buka Supabase Dashboard → SQL Editor
2. Copy dan paste isi file `scripts/create-web-push-subscriptions-table.sql`
3. Jalankan (Run)

Atau jika menggunakan command line:

```bash
# Copy script dan jalankan di Supabase SQL Editor
# File: scripts/create-web-push-subscriptions-table.sql
```

**Catatan**: Setelah menjalankan SQL script, jalankan `npx prisma generate` untuk update Prisma Client:

```bash
npx prisma generate
```

### Step 4: Deploy

Deploy aplikasi ke Vercel atau hosting lainnya. Pastikan environment variables sudah di-set.

## 🎯 Cara Kerja

### 1. User Registration
- Saat user login di browser (PWA), `WebPushSetup` component akan:
  - Cek apakah browser support Web Push API
  - Request notification permission
  - Subscribe ke push notifications dengan VAPID key
  - Mengirim subscription ke backend via `notification.registerWebPushToken`

### 2. Notification Trigger
- **Thread Baru**: Ketika ada user membuat thread baru di kelas mereka, semua user di kelas yang sama akan menerima notifikasi (native FCM + Web Push)
- **Sub Tugas Baru**: Ketika ada user menambahkan comment (sub tugas) baru, semua user di kelas yang sama akan menerima notifikasi

### 3. Notification Delivery
- **Native Apps**: Menggunakan FCM (Firebase Cloud Messaging)
- **PWA/Browser**: Menggunakan Web Push API
- Keduanya berjalan bersamaan untuk coverage maksimal

## 📱 Platform Support

### ✅ Fully Supported
- **Android Chrome** (Android 4.4+)
- **Android Firefox**
- **Desktop Chrome** (Windows/Mac/Linux)
- **Desktop Firefox**
- **Desktop Edge**
- **iOS Safari** (iOS 16.4+)

### ⚠️ Limited Support
- **iOS Chrome/Firefox**: Tidak support (menggunakan WebKit yang tidak support Web Push)
- **Safari Desktop**: Support tapi perlu user interaction untuk subscribe

### ❌ Not Supported
- **iOS Safari** (iOS < 16.4): Tidak support Web Push API
- **Native Apps**: Menggunakan native push (FCM) bukan Web Push

## 🧪 Testing

### 1. Test di Desktop Browser

1. Buka aplikasi di Chrome/Firefox: `https://tuntasinaja-livid.vercel.app`
2. Login ke aplikasi
3. Allow notification permission saat diminta
4. Check console untuk melihat subscription berhasil
5. Buat thread baru sebagai user lain di kelas yang sama
6. Anda harus menerima Web Push notification

### 2. Test di Android Chrome

1. Buka Chrome di Android
2. Buka aplikasi: `https://tuntasinaja-livid.vercel.app`
3. Install sebagai PWA (Add to Home Screen)
4. Buka aplikasi dari home screen
5. Allow notification permission
6. Test dengan membuat thread baru

### 3. Test di iOS Safari (iOS 16.4+)

1. Buka Safari di iPhone (iOS 16.4+)
2. Buka aplikasi: `https://tuntasinaja-livid.vercel.app`
3. Install sebagai PWA (Add to Home Screen)
4. Buka aplikasi dari home screen
5. Allow notification permission
6. Test dengan membuat thread baru

### 4. Debug Web Push

**Di Browser Console:**
```javascript
// Cek subscription
navigator.serviceWorker.ready.then(reg => {
  reg.pushManager.getSubscription().then(sub => {
    console.log('Subscription:', sub?.toJSON())
  })
})

// Test notification manual
new Notification('Test', {
  body: 'Test notification',
  icon: '/icon-192x192.png'
})
```

**Di Service Worker:**
- Buka DevTools → Application → Service Workers
- Cek apakah service worker terdaftar
- Cek logs di Console untuk push events

## 🔧 Troubleshooting

### Notification Permission Denied
- **Problem**: User menolak permission
- **Solution**: User perlu enable manual di browser settings
- **Chrome**: Settings → Site Settings → Notifications → Allow
- **Safari**: Settings → Safari → Notifications → Allow

### Subscription Failed
- **Problem**: VAPID keys tidak configured
- **Solution**: Pastikan `VAPID_PUBLIC_KEY` dan `VAPID_PRIVATE_KEY` sudah di-set di environment variables

### Notifications Not Received
- **Problem**: Subscription expired atau invalid
- **Solution**: System akan auto-delete expired subscriptions. User perlu re-subscribe dengan refresh page

### Service Worker Not Registered
- **Problem**: Service worker tidak terdaftar
- **Solution**: 
  - Pastikan aplikasi di-deploy dengan HTTPS (atau localhost)
  - Clear cache browser
  - Check console untuk error messages

## 📝 File yang Dibuat/Dimodifikasi

### Baru Dibuat
- `components/notifications/WebPushSetup.tsx` - Component untuk setup Web Push
- `scripts/generate-vapid-keys.js` - Script untuk generate VAPID keys
- `MDFILE/WEB-PUSH-SETUP.md` - Dokumentasi ini

### Dimodifikasi
- `prisma/schema.prisma` - Tambah model `WebPushSubscription`
- `lib/firebase-admin.ts` - Tambah fungsi Web Push
- `server/trpc/routers/notification.ts` - Tambah endpoint Web Push
- `public/sw.js` - Tambah push event handlers
- `app/providers.tsx` - Integrate WebPushSetup component
- `package.json` - Tambah script `generate:vapid-keys`
- `env.example` - Tambah VAPID keys variables

## 🎉 Benefits

- ✅ **Gratis**: Tidak perlu Apple Developer Program ($99/tahun)
- ✅ **Cross-Platform**: Bekerja di Android, iOS (16.4+), dan Desktop
- ✅ **No Re-sign**: Tidak perlu re-sign setiap 7 hari seperti native app gratis
- ✅ **Auto Update**: Service worker auto-update saat ada perubahan
- ✅ **Offline Support**: Bisa bekerja offline dengan caching

## 📚 Resources

- [Web Push API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [web-push Library](https://github.com/web-push-libs/web-push)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

