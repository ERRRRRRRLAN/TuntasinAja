# 📢 Fitur Announcement (Pengumuman)

Dokumentasi untuk fitur announcement/pengumuman dengan sistem approval untuk danton.

## 📋 Fitur Utama

1. **Danton bisa membuat announcement langsung** - Announcement langsung approved dan terlihat oleh semua user di kelas
2. **User biasa bisa request announcement** - Request dikirim ke danton untuk approval
3. **Danton bisa approve/reject request** - Danton memiliki halaman khusus untuk melihat dan mengelola request
4. **Auto-delete berdasarkan timer** - Announcement otomatis terhapus setelah waktu yang ditentukan
5. **Edit dan Delete** - Author, Danton, atau Admin bisa edit/delete announcement

## 🔧 Setup Database

### 1. Jalankan Migration SQL

Jalankan script migration di Supabase SQL Editor atau database client Anda:

```sql
-- File: scripts/migrate-announcement.sql
```

Atau copy-paste dari file `scripts/migrate-announcement.sql` dan jalankan di SQL Editor.

### 2. Generate Prisma Client

```bash
npx prisma generate
```

## ⚙️ Cara Kerja

### Untuk Danton:

1. **Buat Announcement:**
   - Buka halaman **Pengumuman** (dari navigation header)
   - Klik tombol **"Buat Pengumuman"**
   - Isi judul, konten, dan set durasi (dalam jam)
   - Announcement langsung approved dan terlihat oleh semua user

2. **Lihat Request:**
   - Buka **Danton Dashboard**
   - Klik card **"Request Pengumuman"** (ada badge notification jika ada request pending)
   - Atau langsung ke halaman `/danton/requests`
   - Approve atau Reject request dari user

3. **Edit/Delete Announcement:**
   - Buka halaman **Pengumuman**
   - Klik icon Edit atau Delete pada announcement yang ingin diubah/hapus

### Untuk User Biasa:

1. **Buat Request Announcement:**
   - Buka halaman **Pengumuman**
   - Klik tombol **"Buat Pengumuman"**
   - Isi judul, konten, dan set durasi
   - Request akan dikirim ke danton (ada toast notification)
   - Tunggu approval dari danton

2. **Lihat Announcements:**
   - Buka halaman **Pengumuman**
   - Hanya announcement yang sudah approved yang akan terlihat
   - Announcement yang expired tidak akan ditampilkan

### Durasi Announcement:

- Durasi dihitung dalam **jam** (1 jam = 1 jam, 24 jam = 1 hari)
- Contoh:
  - `24` jam = 1 hari
  - `168` jam = 7 hari (1 minggu)
  - `720` jam = 30 hari (1 bulan)
  - Maksimal: `8760` jam (1 tahun)

## 🔄 Auto-Delete Expired Announcements

Cron job otomatis menghapus announcement yang sudah expired sekali sehari:

- **Cron Schedule:** Setiap hari jam 1:00 AM (0 1 * * *)
- **API Endpoint:** `/api/cron/auto-delete-expired-announcements`
- **Konfigurasi:** Sudah ditambahkan di `vercel.json`
- **Note:** Schedule diubah menjadi sekali sehari karena Vercel Hobby plan hanya mendukung daily cron jobs

## 🔒 Permission & Access Control

### Create Announcement:
- **Danton:** ✅ Auto-approved
- **Admin:** ✅ Auto-approved
- **User dengan permission "read_and_post_edit":** ✅ Sebagai request (perlu approval)
- **User dengan permission "only_read":** ❌ Tidak bisa

### View Announcements:
- **Semua user:** ✅ Hanya announcement approved
- **Admin:** ✅ Semua announcement

### Approve/Reject Request:
- **Danton:** ✅ Hanya untuk kelas mereka sendiri
- **Admin:** ❌ (Admin tidak bisa approve/reject, tapi bisa langsung create approved)

### Edit/Delete Announcement:
- **Author:** ✅ Announcement mereka sendiri
- **Danton:** ✅ Announcement di kelas mereka
- **Admin:** ✅ Semua announcement

## 📱 Responsive Design

Fitur announcement sudah fully responsive:
- **Desktop:** Layout optimal dengan spacing yang baik
- **Tablet:** Layout disesuaikan untuk layar menengah
- **Mobile:** Stack layout, full-width buttons, touch-friendly

## 🎨 UI/UX Features

- ✅ Minimalis design tanpa emoji
- ✅ Menggunakan icon monochrome
- ✅ Animasi fade-in untuk announcement cards
- ✅ Toast notification untuk feedback
- ✅ Badge notification untuk pending requests (di Danton Dashboard)
- ✅ Expires countdown display (hari/jam tersisa)
- ✅ Lock body scroll saat modal/form terbuka (mobile)

## 📂 File Structure

```
app/
  announcements/
    page.tsx              # Halaman utama announcements
  danton/
    requests/
      page.tsx            # Halaman request announcements untuk danton

components/
  announcements/
    AnnouncementCard.tsx           # Card untuk display announcement
    AnnouncementRequestCard.tsx    # Card untuk display request dengan approve/reject buttons
    CreateAnnouncementForm.tsx     # Form untuk create/edit announcement

hooks/
  useAnnouncements.ts              # Hook untuk fetch announcements
  useAnnouncementRequests.ts       # Hook untuk fetch request announcements

server/trpc/routers/
  announcement.ts                  # Backend router untuk announcement operations

pages/api/cron/
  auto-delete-expired-announcements.ts  # Cron job untuk auto-delete

scripts/
  migrate-announcement.sql         # SQL migration script
```

## 🧪 Testing

### Test Create Announcement (Danton):
1. Login sebagai danton
2. Buka halaman Pengumuman
3. Klik "Buat Pengumuman"
4. Isi form dan submit
5. Verify: Announcement langsung muncul di list

### Test Request Announcement (User):
1. Login sebagai user biasa
2. Buka halaman Pengumuman
3. Klik "Buat Pengumuman"
4. Isi form dan submit
5. Verify: Toast notification muncul "Request announcement telah dikirim..."
6. Login sebagai danton dari kelas yang sama
7. Buka Danton Dashboard
8. Verify: Ada badge notification di "Request Pengumuman"
9. Klik card tersebut
10. Verify: Request muncul di list
11. Klik "Setujui"
12. Verify: Request hilang dari list request, muncul di halaman Pengumuman

### Test Auto-Delete:
1. Buat announcement dengan durasi 1 jam
2. Wait 1 jam (atau test manual dengan mengubah `expiresAt` di database)
3. Verify: Announcement otomatis terhapus (tidak muncul di list)

### Test Edit/Delete:
1. Buat announcement sebagai danton
2. Klik icon Edit
3. Ubah title/content/duration
4. Verify: Changes tersimpan
5. Klik icon Delete
6. Verify: Announcement terhapus

## 📝 Notes

- Announcement yang sudah expired tidak akan ditampilkan di list (auto-filter)
- Request yang expired juga tidak akan muncul di list request danton
- Admin bisa melihat semua announcement (tidak filter by kelas)
- Subscription status tetap di-check saat create announcement (user tidak bisa create jika subscription expired)

