# 🗑️ Setup Auto-Delete untuk Deadline yang Sudah Lewat

Dokumentasi untuk fitur auto-delete threads dan comments yang deadline-nya sudah lewat.

## 📋 Fitur

- **Auto-delete expired threads**: Thread dengan deadline yang sudah lewat akan otomatis terhapus
- **Auto-delete expired comments**: Comment (sub-task) dengan deadline yang sudah lewat akan otomatis terhapus
- **Auto-delete thread dengan semua sub-task expired**: Jika semua sub-task dalam thread sudah expired, thread akan terhapus
- **Filter real-time**: Expired items tidak muncul di feed meskipun masih ada di database (filtered di server-side)
- **History tetap tersimpan**: History tugas yang sudah diselesaikan tetap tersimpan untuk laporan
- **Cron job setiap jam**: Auto-delete berjalan otomatis setiap jam

## ⚙️ Cara Kerja

### 1. Filter Real-time (Server-side)
- Saat user request data threads, server akan filter expired items
- Thread dengan deadline expired → tidak muncul di feed
- Comment dengan deadline expired → tidak muncul di list sub-tasks
- Thread dengan semua sub-task expired → tidak muncul di feed
- **Keuntungan**: Expired items langsung hilang dari feed tanpa menunggu cron job

### 2. Cron Job (Database Cleanup)
- Berjalan otomatis setiap jam (schedule: `0 * * * *`)
- Menghapus expired threads dan comments dari database
- Menjaga database tetap bersih
- **Path**: `/api/cron/auto-delete-expired-threads`

### 3. Manual Trigger (Admin Only)
- Admin dapat trigger deletion secara manual melalui tRPC
- Endpoint: `thread.deleteExpired`
- Berguna untuk cleanup langsung tanpa menunggu cron job

## 🔧 Setup

### 1. Konfigurasi Cron Job (Vercel)

Sudah dikonfigurasi di `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/auto-delete-expired-threads",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Schedule**: `0 * * * *` = Setiap jam, di menit ke-0
- 00:00, 01:00, 02:00, ..., 23:00

**Tidak perlu setup tambahan** - Vercel akan otomatis menjalankan cron job.

### 2. Environment Variable (Opsional)

Untuk keamanan, tambahkan secret key:
```env
CRON_SECRET="your-secret-key-here"
```

### 3. Manual Trigger via tRPC (Admin)

Admin dapat trigger deletion secara manual:
```typescript
// Di admin panel atau console
await trpc.thread.deleteExpired.mutate()
```

## 📊 Logic Deletion

### Thread dihapus jika:
1. **Thread memiliki deadline dan sudah expired**
   - Contoh: Thread deadline 7 Des 2025, sekarang 8 Des 2025 → HAPUS

2. **Thread tidak memiliki deadline TAPI semua sub-task yang memiliki deadline sudah expired**
   - Contoh: Thread tanpa deadline, punya 3 sub-task dengan deadline:
     - Sub-task A: deadline 5 Des (expired)
     - Sub-task B: deadline 6 Des (expired)
     - Sub-task C: tanpa deadline (tidak expired)
   - Hasil: Thread TIDAK dihapus (masih ada sub-task C)
   
   - Contoh 2: Thread tanpa deadline, punya 2 sub-task:
     - Sub-task A: deadline 5 Des (expired)
     - Sub-task B: deadline 6 Des (expired)
   - Hasil: Thread DIHAPUS (semua sub-task expired)

### Comment (sub-task) dihapus jika:
1. **Comment memiliki deadline dan sudah expired**
   - Comment akan dihapus dari thread
   - Thread masih bisa tetap ada (jika masih punya sub-task lain)

### Catatan Penting:
- Thread/comment **tanpa deadline** tidak akan pernah dihapus otomatis
- History tetap tersimpan meskipun thread/comment sudah dihapus
- UserStatus terkait akan ikut terhapus untuk menjaga konsistensi database

## 🔒 Keamanan

1. **Cron endpoint** dilindungi dengan `CRON_SECRET`
2. **Manual trigger** hanya bisa diakses oleh Admin
3. **Filter server-side** mencegah data bocor meskipun masih di database

## 🧪 Testing

### Test Cron Endpoint (Manual)
```bash
curl -X POST https://tuntasinaja-livid.vercel.app/api/cron/auto-delete-expired-threads \
  -H "Authorization: Bearer your-cron-secret"
```

### Test via Admin Panel
```typescript
// Login sebagai admin, lalu:
const result = await trpc.thread.deleteExpired.mutate()
console.log(result)
// Output: { success: true, deleted: { threads: 2, comments: 3 }, message: "..." }
```

## 📈 Monitoring

Untuk melihat hasil cron job:
1. Buka Vercel Dashboard → Logs
2. Filter by `/api/cron/auto-delete-expired-threads`
3. Lihat output: berapa thread dan comment yang dihapus

## ❓ FAQ

**Q: Bagaimana jika cron job gagal?**
A: Admin bisa trigger manual melalui `thread.deleteExpired` mutation.

**Q: Apakah history ikut terhapus?**
A: Tidak, history tetap tersimpan untuk laporan.

**Q: Bagaimana jika deadline tepat sekarang (second-level)?**
A: Sistem menggunakan UTC date comparison. Jika `deadline < now`, akan dihapus.

**Q: Apakah expired items langsung hilang dari feed?**
A: Ya, karena ada filter real-time di server-side. Tidak perlu menunggu cron job.

**Q: Kenapa schedule cron job setiap jam, bukan setiap menit?**
A: Untuk menghindari overhead dan rate limit. Setiap jam sudah cukup cepat untuk cleanup. Ditambah lagi ada filter real-time yang membuat expired items langsung hilang dari feed.

## 🚀 Next Steps

1. ✅ Filter real-time sudah aktif
2. ✅ Cron job sudah dikonfigurasi (setiap jam)
3. ✅ Manual trigger tersedia untuk admin
4. ✅ History preservation sudah diimplementasikan

Semua fitur sudah siap digunakan!

