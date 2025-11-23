# 📋 TODO List - Database Management Plan

Dokumentasi untuk rencana optimasi dan manajemen database agar tidak melebihi batas 500MB di Supabase.

## 🎯 Prioritas Tinggi (Cleanup Otomatis)

### ✅ Task 1: Ubah cleanOldHistory menjadi publicProcedure
- [ ] Ubah `cleanOldHistory` dari `protectedProcedure` menjadi `publicProcedure` di `server/trpc/routers/history.ts`
- **Alasan**: Agar bisa dipanggil dari cron job tanpa autentikasi user
- **File**: `server/trpc/routers/history.ts`

### ✅ Task 2: Buat API Endpoint Cleanup History
- [ ] Buat file `pages/api/cron/cleanup-history.ts`
- [ ] Implementasi handler untuk memanggil `cleanOldHistory` dari tRPC
- [ ] Tambahkan autentikasi dengan `CRON_SECRET`
- **Alasan**: History yang lebih dari 30 hari perlu dihapus otomatis untuk menghemat space
- **File**: `pages/api/cron/cleanup-history.ts`

### ✅ Task 3: Tambahkan Cron Job Cleanup History
- [ ] Tambahkan entry cron job ke `vercel.json`
- [ ] Schedule: `0 3 * * *` (setiap hari jam 3:00 AM)
- **Alasan**: Berjalan setelah auto-delete threads dan cleanup user statuses
- **File**: `vercel.json`

---

## 🔧 Prioritas Sedang (Cleanup Tambahan & Monitoring)

### ✅ Task 4: Buat API Endpoint Cleanup Inactive Threads
- [ ] Buat file `pages/api/cron/cleanup-inactive-threads.ts`
- [ ] Implementasi logika untuk menghapus thread yang:
  - Tidak pernah dikomentari
  - Tidak pernah diselesaikan oleh siapa pun
  - Lebih dari 90 hari
- [ ] Tambahkan autentikasi dengan `CRON_SECRET`
- **Alasan**: Thread yang tidak aktif lama tidak perlu disimpan
- **File**: `pages/api/cron/cleanup-inactive-threads.ts`

### ✅ Task 5: Tambahkan Cron Job Cleanup Inactive Threads
- [ ] Tambahkan entry cron job ke `vercel.json`
- [ ] Schedule: `0 4 * * *` (setiap hari jam 4:00 AM)
- **Alasan**: Berjalan setelah cleanup history
- **File**: `vercel.json`

### ✅ Task 6: Buat API Endpoint Database Stats
- [ ] Buat file `pages/api/admin/database-stats.ts`
- [ ] Implementasi query untuk melihat:
  - Total rows per table
  - Estimated size per table
  - Oldest records
  - Database size usage
- [ ] Tambahkan autentikasi admin
- **Alasan**: Monitoring penting untuk mengetahui penggunaan database
- **File**: `pages/api/admin/database-stats.ts`

---

## 📊 Prioritas Rendah (Optimasi)

### ✅ Task 7: Tambahkan Validasi Max Length untuk Comment Content
- [ ] Tambahkan validasi di schema Prisma untuk `content` field
- [ ] Atau tambahkan validasi di tRPC input schema
- [ ] Max length: 5000 karakter
- **Alasan**: Mencegah comment yang terlalu panjang menghabiskan space
- **File**: `prisma/schema.prisma` atau `server/trpc/routers/thread.ts`

### ✅ Task 8: Buat Dokumentasi Database Management
- [ ] Buat file `DATABASE-MANAGEMENT.md`
- [ ] Dokumentasikan:
  - Semua cron job yang berjalan
  - Schedule dan fungsi masing-masing
  - Cara kerja cleanup
  - Tips optimasi database
  - Monitoring database size
- **Alasan**: Dokumentasi penting untuk maintenance jangka panjang
- **File**: `DATABASE-MANAGEMENT.md`

---

## 📈 Perkiraan Penghematan

- **History Cleanup (30 hari)**: ~10-20% jika banyak history
- **Thread Cleanup (inactive 90+ hari)**: ~20-30% jika banyak thread lama
- **UserStatus Cleanup (sudah ada)**: ~5-10%
- **Total Estimasi**: 35-60% penghematan tergantung pola penggunaan

---

## 🕐 Schedule Cron Jobs

| Waktu | Cron Job | Fungsi |
|-------|----------|--------|
| 00:00 | `auto-delete-threads` | Hapus thread yang sudah selesai 24 jam lalu |
| 02:00 | `cleanup-user-statuses` | Hapus UserStatus orphaned dan old incomplete |
| 03:00 | `cleanup-history` | Hapus history lebih dari 30 hari |
| 04:00 | `cleanup-inactive-threads` | Hapus thread tidak aktif 90+ hari |

---

## 📝 Catatan

- Semua cron job menggunakan `CRON_SECRET` untuk autentikasi
- Pastikan `CRON_SECRET` sudah di-set di environment variables
- Monitor database size secara berkala setelah implementasi
- Backup database sebelum menjalankan cleanup besar-besaran

---

**Status**: 🟡 In Progress  
**Last Updated**: 2024

