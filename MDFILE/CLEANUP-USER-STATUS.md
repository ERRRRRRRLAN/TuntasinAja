# 🧹 Auto-Cleanup UserStatus

Dokumentasi untuk fitur auto-cleanup UserStatus yang tidak valid atau tidak terpakai untuk menghemat database size.

## 📋 Fitur

Fitur ini secara otomatis membersihkan UserStatus yang:
1. **Orphaned UserStatus**: UserStatus dengan `threadId` atau `commentId` yang tidak ada di database (thread/comment sudah dihapus)
2. **Old Incomplete Status**: UserStatus yang tidak pernah diselesaikan dan sudah lebih dari 30 hari
3. **UserStatus dari Thread/Comment yang dihapus**: Dibersihkan saat thread dihapus otomatis

## 🔧 Cara Kerja

### 1. Auto-Cleanup Cron Job

Cron job berjalan setiap hari jam 2:00 AM (setelah auto-delete threads) untuk membersihkan:
- UserStatus dengan `threadId` yang tidak valid
- UserStatus dengan `commentId` yang tidak valid
- UserStatus yang tidak selesai dan lebih dari 30 hari

### 2. Cleanup saat Auto-Delete Thread

Saat thread dihapus otomatis (setelah 1 hari), UserStatus terkait juga akan dihapus:
- UserStatus dengan `threadId` yang sama dengan thread yang dihapus
- UserStatus dengan `commentId` yang sama dengan comment di thread yang dihapus

## ⚙️ Setup

### Vercel (Automatic)

Cron job sudah dikonfigurasi di `vercel.json` dan akan berjalan otomatis setiap hari jam 2:00 AM.

**Tidak perlu setup tambahan** - Vercel akan otomatis menjalankan cron job sesuai schedule yang sudah dikonfigurasi.

### Manual Setup (Alternatif)

Jika Anda menggunakan hosting lain atau ingin menjalankan cleanup secara manual:

1. **Setup Environment Variable**:
   ```env
   CRON_SECRET="your-cron-secret-key-here"
   ```

2. **Call API Endpoint**:
   ```bash
   curl -X POST https://your-domain.com/api/cron/cleanup-user-statuses \
     -H "Authorization: Bearer your-cron-secret-key-here"
   ```

3. **Setup Cron Job** (Linux/Mac):
   ```bash
   # Edit crontab
   crontab -e
   
   # Tambahkan baris berikut untuk menjalankan setiap hari jam 2:00 AM
   0 2 * * * curl -X POST https://your-domain.com/api/cron/cleanup-user-statuses -H "Authorization: Bearer your-cron-secret-key-here"
   ```

### External Cron Services

Anda juga bisa menggunakan layanan cron eksternal seperti:
- **cron-job.org**: https://cron-job.org
- **EasyCron**: https://www.easycron.com
- **GitHub Actions**: Setup workflow dengan schedule

## 🔒 Keamanan

Untuk keamanan endpoint cron, pastikan:

1. **Set CRON_SECRET** di environment variables (production)
2. **Jangan expose** CRON_SECRET di public repository
3. **Gunakan HTTPS** untuk semua request ke cron endpoint

## 📊 Manfaat

### Penghematan Database Size

Dengan cleanup otomatis, database size akan lebih efisien:
- **UserStatus orphaned**: Dihapus segera setelah thread/comment dihapus
- **UserStatus lama**: Dihapus setelah 30 hari jika tidak selesai
- **Estimasi penghematan**: ~140 bytes per UserStatus yang dihapus

### Contoh Penghematan

Jika ada 10.000 UserStatus orphaned:
- **Sebelum cleanup**: 10.000 × 140 bytes = ~1.4 MB
- **Setelah cleanup**: 0 MB
- **Penghematan**: ~1.4 MB

## 🧪 Testing

Untuk testing manual, Anda bisa:

1. **Test API Endpoint**:
   ```bash
   curl -X POST http://localhost:3000/api/cron/cleanup-user-statuses \
     -H "Authorization: Bearer your-cron-secret-key-here"
   ```

2. **Test via tRPC** (development):
   ```typescript
   // Di development, Anda bisa langsung call procedure
   await trpc.userStatus.cleanupOrphanedStatuses.mutate()
   ```

## 📝 Catatan

- **UserStatus yang valid**: Tidak akan terhapus (status untuk thread/comment yang masih ada)
- **UserStatus yang selesai**: Tidak akan terhapus (hanya yang tidak selesai dan >30 hari)
- **Cleanup frequency**: Setiap hari jam 2:00 AM
- **Impact**: Minimal - hanya menghapus data yang tidak valid atau tidak terpakai

## ⚠️ Troubleshooting

### Cron job tidak berjalan

1. **Cek vercel.json**: Pastikan cron job sudah dikonfigurasi
2. **Cek Vercel Dashboard**: Lihat di bagian "Cron Jobs" untuk melihat status
3. **Cek logs**: Lihat di Vercel Dashboard > Deployments > Functions untuk melihat error

### UserStatus masih menumpuk

1. **Cek cron job**: Pastikan cron job berjalan dengan benar
2. **Cek logs**: Lihat apakah ada error saat cleanup
3. **Manual cleanup**: Jalankan cleanup secara manual untuk testing

## 🎯 Best Practices

1. **Monitor cleanup**: Cek logs secara berkala untuk memastikan cleanup berjalan
2. **Adjust schedule**: Jika perlu, ubah schedule di `vercel.json`
3. **Backup data**: Sebelum cleanup besar, pastikan backup database sudah ada

## 📚 Related Documentation

- [AUTO-DELETE-SETUP.md](./AUTO-DELETE-SETUP.md) - Dokumentasi auto-delete threads
- [MIGRATION-KELAS.md](./MIGRATION-KELAS.md) - Dokumentasi fitur kelas

