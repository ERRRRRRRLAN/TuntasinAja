# 🔔 Sistem Notifikasi - TuntasinAja

Sistem notifikasi untuk aplikasi TuntasinAja menggunakan Browser Notification API (tanpa Capacitor/PWA/TWA).

## ✅ Fitur yang Tersedia

### 1. Notifikasi Thread Baru
- Ketika user lain di kelas yang sama membuat thread baru, semua user di kelas tersebut akan mendapat notifikasi
- Notifikasi muncul otomatis di browser

### 2. Notifikasi Sub Tugas Baru
- Ketika user lain di kelas yang sama menambahkan sub tugas (comment) pada thread, semua user di kelas tersebut akan mendapat notifikasi
- Notifikasi muncul otomatis di browser

### 3. Pengingat Harian
- Sistem secara otomatis mengingatkan user setiap hari tentang jumlah tugas yang belum dikerjakan
- Pengingat muncul sekali per hari (default: setelah jam 9 pagi)

## 📁 File yang Dibuat

### Backend
- `server/trpc/routers/notification.ts` - Router tRPC untuk mengelola notifikasi
- `pages/api/cron/daily-reminder.ts` - API endpoint untuk cron job pengingat harian

### Frontend
- `lib/notification-service.ts` - Service untuk menangani Browser Notification API
- `components/NotificationManager.tsx` - Component yang mengelola notifikasi di client-side

### Modifikasi
- `server/trpc/routers/thread.ts` - Menambahkan logika pembuatan notifikasi saat thread/comment dibuat
- `server/trpc/root.ts` - Menambahkan notification router
- `components/pages/FeedPage.tsx` - Menambahkan NotificationManager component

## 🚀 Cara Kerja

### 1. Notifikasi Thread/Comment Baru

Ketika user membuat thread atau comment baru:
1. Sistem mencari semua user di kelas yang sama (kecuali pembuat)
2. Membuat record notifikasi di database untuk setiap user
3. `NotificationManager` secara berkala (setiap 30 detik) mengecek notifikasi baru
4. Jika ada notifikasi baru yang belum dibaca, menampilkan browser notification
5. Notifikasi otomatis ditandai sebagai sudah dibaca setelah ditampilkan

### 2. Pengingat Harian

`NotificationManager` mengecek tugas yang belum selesai:
1. Setiap jam, sistem mengecek apakah sudah waktunya untuk pengingat harian
2. Jika sudah jam 9 pagi dan belum pernah mengecek hari ini, sistem:
   - Menghitung jumlah tugas yang belum selesai
   - Menampilkan browser notification dengan jumlah tugas
3. Pengingat hanya muncul sekali per hari

### 3. Cron Job Pengingat Harian (Opsional)

API endpoint `/api/cron/daily-reminder` dapat dipanggil oleh cron job eksternal:
- Menghitung tugas yang belum selesai untuk semua user
- Membuat notifikasi di database untuk user yang memiliki tugas belum selesai
- Dapat dijadwalkan untuk dipanggil sekali per hari (misalnya jam 9 pagi)

## 🔧 Konfigurasi

### Browser Notification Permission

Sistem akan otomatis meminta izin notifikasi dari user saat pertama kali aplikasi dimuat (jika user sudah login).

### Environment Variables

Untuk cron job, tambahkan di `.env`:
```
CRON_SECRET_TOKEN=your-secret-token-here
```

## 📝 Penggunaan

### Menampilkan Notifikasi Manual

```typescript
import { notificationService } from '@/lib/notification-service'

// Tampilkan notifikasi thread baru
await notificationService.showNewThreadNotification(
  'Matematika',
  'John Doe',
  'thread-id-123'
)

// Tampilkan notifikasi comment baru
await notificationService.showNewCommentNotification(
  'Matematika',
  'Jane Doe',
  'thread-id-123'
)

// Tampilkan pengingat harian
await notificationService.showDailyReminder(5) // 5 tugas belum selesai
```

### Menggunakan tRPC Notification Router

```typescript
import { trpc } from '@/lib/trpc'

// Get all notifications
const notifications = await trpc.notification.getAll.query()

// Get unread count
const unreadCount = await trpc.notification.getUnreadCount.query()

// Mark as read
await trpc.notification.markAsRead.mutate({ id: 'notification-id' })

// Mark all as read
await trpc.notification.markAllAsRead.mutate()

// Delete notification
await trpc.notification.delete.mutate({ id: 'notification-id' })
```

## 🎯 Setup Cron Job (Opsional)

Untuk mengaktifkan cron job pengingat harian otomatis:

### Vercel Cron (Recommended)

Tambahkan di `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-reminder",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### External Cron Service

Setup cron job untuk memanggil:
```
POST https://your-domain.com/api/cron/daily-reminder
Authorization: Bearer YOUR_SECRET_TOKEN
```

## ⚠️ Catatan Penting

1. **Browser Support**: Notifikasi hanya bekerja di browser yang mendukung Notification API (Chrome, Firefox, Safari, Edge)
2. **HTTPS Required**: Browser notification memerlukan HTTPS (atau localhost untuk development)
3. **Permission**: User harus memberikan izin notifikasi
4. **Kelas Matching**: Notifikasi hanya dikirim ke user di kelas yang sama dengan pembuat thread/comment
5. **No Self-Notification**: User tidak akan mendapat notifikasi untuk thread/comment yang mereka buat sendiri
6. **⚠️ BATASAN PENTING**: Notifikasi hanya muncul ketika aplikasi/website **DIBUKA**. Jika user menutup browser atau tidak membuka aplikasi, notifikasi tidak akan muncul. Untuk notifikasi push yang bekerja bahkan ketika aplikasi ditutup, diperlukan Push API (lihat `NOTIFICATION-PUSH-EXPLANATION.md`)

## 🐛 Troubleshooting

### Notifikasi tidak muncul
- Pastikan browser mendukung Notification API
- Cek apakah user sudah memberikan izin notifikasi
- Pastikan aplikasi berjalan di HTTPS (atau localhost)
- Cek console browser untuk error

### Notifikasi muncul terlalu sering
- Notifikasi hanya muncul untuk notifikasi yang dibuat dalam 5 menit terakhir
- Setiap notifikasi hanya ditampilkan sekali

### Pengingat harian tidak muncul
- Pastikan sudah jam 9 pagi atau lebih
- Pengingat hanya muncul sekali per hari
- Cek console browser untuk error

