# 🗑️ Setup Auto-Delete Tugas

Dokumentasi untuk fitur auto-delete tugas setelah 1 hari dengan history tetap tersimpan selama 30 hari.

## 📋 Fitur

- **Auto-delete tugas**: Tugas (thread) akan otomatis terhapus setelah 1 hari dari tanggal dibuat
- **History tetap tersimpan**: History tugas tetap tersimpan selama 30 hari meskipun tugas sudah dihapus
- **Denormalisasi data**: Data thread (title, author) disimpan di history untuk memastikan history tetap bisa ditampilkan meskipun thread sudah dihapus

## 🔧 Setup Database

### 1. Update Schema Database

Jalankan migration untuk update schema:

```bash
npm run db:push
```

Atau jika menggunakan Prisma Migrate:

```bash
npm run db:migrate
```

### 2. Migrasi Data Existing (Opsional)

Jika Anda sudah memiliki data history yang ada, data tersebut akan tetap berfungsi. Namun, untuk memastikan data denormalisasi tersimpan, Anda bisa menjalankan script migrasi (opsional).

## ⚙️ Setup Cron Job

### Vercel (Recommended)

Cron job sudah dikonfigurasi di `vercel.json` dan akan berjalan otomatis setiap hari jam 00:00 (midnight).

**Tidak perlu setup tambahan** - Vercel akan otomatis menjalankan cron job sesuai schedule yang sudah dikonfigurasi.

### Manual Setup (Alternatif)

Jika Anda menggunakan hosting lain atau ingin menjalankan cron job secara manual:

1. **Setup Environment Variable**:
   ```env
   CRON_SECRET="c0a3e12c039e1b72c1cda36a0376811e"
   ```

2. **Call API Endpoint**:
   ```bash
   curl -X POST https://tuntasinaja-livid.vercel.app/api/cron/auto-delete-threads \
     -H "Authorization: Bearer c0a3e12c039e1b72c1cda36a0376811e"
   ```

3. **Setup Cron Job** (Linux/Mac):
   ```bash
   # Edit crontab
   crontab -e
   
   # Tambahkan baris berikut untuk menjalankan setiap hari jam 00:00
   0 0 * * * curl -X POST https://tuntasinaja-livid.vercel.app/api/cron/auto-delete-threads -H "Authorization: Bearer c0a3e12c039e1b72c1cda36a0376811e"
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

## 📊 Cara Kerja

1. **Saat tugas dibuat**: Data thread disimpan normal di database
2. **Saat tugas selesai**: History dibuat dengan data denormalisasi (title, author) disimpan
3. **Setelah 1 hari**: Cron job akan:
   - Mencari semua thread yang dibuat lebih dari 1 hari yang lalu
   - Update semua history terkait dengan data denormalisasi
   - Hapus thread (history tetap ada dengan `threadId = null`)
4. **Setelah 30 hari**: History akan terhapus otomatis (sudah ada fitur sebelumnya)

## 🧪 Testing

Untuk testing manual, Anda bisa:

1. **Test API Endpoint**:
   ```bash
   curl -X POST http://localhost:3000/api/cron/auto-delete-threads \
     -H "Authorization: Bearer your-cron-secret-key-here"
   ```

2. **Test via tRPC** (development):
   ```typescript
   // Di development, Anda bisa langsung call procedure
   await trpc.thread.autoDeleteOldThreads.mutate()
   ```

## 📝 Catatan

- **Thread yang dihapus**: Thread akan benar-benar dihapus dari database setelah 1 hari
- **History tetap ada**: History akan tetap tersimpan dengan data denormalisasi
- **Timer history**: History akan terhapus setelah 30 hari dari tanggal selesai (bukan dari tanggal thread dihapus)
- **Data denormalisasi**: Data thread (title, author) disimpan di history untuk memastikan history tetap bisa ditampilkan

## ⚠️ Troubleshooting

### Cron job tidak berjalan

1. **Cek vercel.json**: Pastikan cron job sudah dikonfigurasi
2. **Cek Vercel Dashboard**: Lihat di bagian "Cron Jobs" untuk melihat status
3. **Cek logs**: Lihat logs di Vercel untuk error messages

### History tidak menampilkan data

1. **Cek schema**: Pastikan migration sudah dijalankan
2. **Cek data**: Pastikan data denormalisasi sudah tersimpan di database
3. **Cek code**: Pastikan history router sudah update untuk handle data denormalisasi

### Error saat delete thread

1. **Cek foreign key**: Pastikan `onDelete: SetNull` sudah dikonfigurasi dengan benar
2. **Cek data**: Pastikan tidak ada constraint yang melanggar
3. **Cek logs**: Lihat error message di logs untuk detail

## 🔄 Update Schema

Jika perlu update schema di masa depan:

1. Update `prisma/schema.prisma`
2. Jalankan `npm run db:push` atau `npm run db:migrate`
3. Update code yang terkait jika perlu

