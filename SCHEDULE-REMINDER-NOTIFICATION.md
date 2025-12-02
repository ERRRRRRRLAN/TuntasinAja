# ⏰ Schedule Reminder Notification Feature

Fitur notifikasi otomatis untuk mengingatkan siswa tentang jadwal pelajaran besok dan PR yang belum selesai.

## 📋 Fitur

1. **Notifikasi Otomatis**: Sistem akan mengirim notifikasi otomatis di jam 6 maghrib (18:00 WIB) dan jam 9 malam (21:00 WIB)
2. **Informasi Jadwal Besok**: Notifikasi berisi daftar pelajaran yang akan ada besok sesuai jadwal yang sudah di-set oleh danton
3. **Reminder PR Belum Selesai**: Sistem akan memberitahu jika masih ada PR untuk pelajaran besok yang belum selesai
4. **Deep Link dengan Filter**: Ketika user klik notifikasi, aplikasi akan terbuka dengan filter aktif untuk menampilkan tugas-tugas pelajaran besok saja
5. **Clear Filter**: User bisa menghapus filter dengan mudah melalui tombol "Hapus Filter"

## 🔧 Cara Kerja

### 1. Cron Job
- **Endpoint**: `/api/cron/schedule-reminder`
- **Schedule**: Setiap hari jam 11:00 UTC dan 14:00 UTC (18:00 WIB dan 21:00 WIB)
- **Konfigurasi**: Sudah dikonfigurasi di `vercel.json`

### 2. Proses Notifikasi

1. **Cek Jadwal Besok**: Sistem mengecek jadwal pelajaran untuk hari besok berdasarkan hari dalam seminggu
2. **Cek PR yang Relevan**: Sistem mencari tugas (thread) yang dibuat hari ini dan relevan dengan pelajaran besok
3. **Generate Notifikasi**: 
   - Jika ada PR yang belum selesai: "⏰ Reminder Maghrib/Malam: Besok Ada Pelajaran! Besok (tanggal) ada pelajaran: [daftar pelajaran]. Cek PR yang belum selesai dan segera selesaikan!"
   - Jika semua PR sudah selesai: "📅 Reminder Maghrib/Malam: Besok Ada Pelajaran. Besok (tanggal) ada pelajaran: [daftar pelajaran]. Jangan lupa persiapkan!"
4. **Kirim Notifikasi**: Notifikasi dikirim ke semua user di kelas yang memiliki jadwal untuk besok
5. **Deep Link**: Notifikasi mengandung deep link dengan filter subjects, format: `/?filter=subject1,subject2`

### 3. Deep Link Handling

Ketika user klik notifikasi:
1. Aplikasi akan terbuka dan navigasi ke home page (`/`)
2. URL akan mengandung query parameter `filter` dengan daftar subjects (comma-separated)
3. `FeedPage` akan membaca query parameter dan mengaktifkan filter
4. Feed akan menampilkan hanya tugas-tugas yang relevan dengan pelajaran besok
5. Badge filter akan muncul di atas feed dengan tombol "Hapus Filter"

## 📁 File yang Dibuat/Dimodifikasi

### Baru Dibuat
- `pages/api/cron/schedule-reminder.ts` - API endpoint untuk cron job
- `SCHEDULE-REMINDER-NOTIFICATION.md` - Dokumentasi ini

### Dimodifikasi
- `vercel.json` - Menambahkan cron job baru untuk schedule reminder
- `components/pages/FeedPage.tsx` - Menambahkan:
  - Handling URL search params untuk filter
  - State `filteredSubjects` untuk multiple subject filter
  - UI badge untuk menampilkan filter aktif
  - Function `clearFilter()` untuk reset filter
- `components/notifications/PushNotificationSetup.tsx` - Menambahkan:
  - Handler untuk `pushNotificationActionPerformed` event
  - Navigasi ke deep link ketika notifikasi diklik

## ⚙️ Konfigurasi

### Vercel Cron Job

Cron job sudah dikonfigurasi di `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/schedule-reminder",
      "schedule": "0 11,14 * * *"
    }
  ]
}
```

**Penjelasan Schedule**:
- `0 11 * * *` = Setiap hari jam 11:00 UTC (18:00 WIB / 6 maghrib)
- `0 14 * * *` = Setiap hari jam 14:00 UTC (21:00 WIB / 9 malam)

### Environment Variables

Tidak ada environment variable baru yang diperlukan. Fitur ini menggunakan:
- `CRON_SECRET` (opsional) - Untuk autentikasi cron job jika diperlukan
- `FIREBASE_SERVICE_ACCOUNT` - Sudah ada untuk push notification

## 🧪 Testing

### Manual Testing

1. **Test Cron Job**:
   ```bash
   curl -X POST https://your-domain.com/api/cron/schedule-reminder \
     -H "Authorization: Bearer your-cron-secret"
   ```

2. **Test Filter dari URL**:
   - Buka aplikasi dengan URL: `/?filter=Dasar%20PPLG,Matematika`
   - Pastikan feed hanya menampilkan tugas yang relevan
   - Pastikan badge filter muncul
   - Klik "Hapus Filter" dan pastikan filter ter-reset

3. **Test Notifikasi**:
   - Pastikan danton sudah set jadwal untuk besok
   - Pastikan ada tugas yang relevan dengan pelajaran besok
   - Tunggu sampai jam 18:00 atau 21:00 WIB
   - Atau trigger manual dengan curl command di atas
   - Klik notifikasi dan pastikan aplikasi terbuka dengan filter aktif

## 📝 Catatan Penting

1. **Waktu Maghrib**: Waktu maghrib bisa berubah setiap hari. Untuk fleksibilitas, cron job akan check waktu Jakarta dan mengirim notifikasi jika waktu antara 17:55 - 18:05 atau 20:55 - 21:05. Jika perlu waktu maghrib yang lebih akurat, bisa ditambahkan environment variable untuk konfigurasi waktu.

2. **Filter Matching**: Filter menggunakan substring matching (case-insensitive). Pastikan nama mata pelajaran di jadwal sesuai dengan nama yang digunakan di judul tugas.

3. **Deep Link di Android**: Deep link akan bekerja otomatis di Android karena menggunakan `window.location.href`. Untuk iOS, mungkin perlu konfigurasi tambahan.

4. **Performance**: Untuk kelas dengan banyak user, proses check incomplete tasks bisa memakan waktu. Jika perlu, bisa di-optimize dengan batch query atau caching.

## 🚀 Deployment

Setelah deploy ke Vercel:
1. Cron job akan otomatis aktif sesuai schedule
2. Pastikan `CRON_SECRET` sudah di-set di Vercel environment variables (jika menggunakan autentikasi)
3. Pastikan `FIREBASE_SERVICE_ACCOUNT` sudah di-set untuk push notification
4. Test dengan trigger manual terlebih dahulu sebelum menunggu schedule

## 🔄 Update Waktu Maghrib

Jika waktu maghrib berubah (misalnya karena perubahan musim), bisa update schedule di `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/schedule-reminder",
      "schedule": "0 11,14 * * *" // Update sesuai waktu maghrib baru
    }
  ]
}
```

Atau bisa menggunakan environment variable untuk waktu maghrib yang lebih dinamis (perlu modifikasi code).

