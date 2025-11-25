# 📅 Fitur Jadwal Pelajaran & Pengingat

Dokumentasi untuk fitur jadwal pelajaran dan sistem pengingat otomatis berdasarkan jadwal.

## 📋 Fitur Utama

1. **Danton bisa mengelola jadwal** - Tambah, hapus jadwal pelajaran untuk kelas mereka
2. **User bisa melihat jadwal** - Lihat jadwal pelajaran kelas mereka di halaman Jadwal
3. **Reminder otomatis** - Sistem otomatis memberi reminder jika besok ada pelajaran dan ada tugas yang belum selesai

## 🔧 Setup Database

### 1. Jalankan Migration SQL

Jalankan script migration di Supabase SQL Editor atau database client Anda:

```sql
-- File: scripts/migrate-class-schedule.sql
```

Atau copy-paste dari file `scripts/migrate-class-schedule.sql` dan jalankan di SQL Editor.

### 2. Generate Prisma Client

```bash
npx prisma generate
```

## ⚙️ Cara Kerja

### Untuk Danton:

1. **Kelola Jadwal:**
   - Buka **Danton Dashboard**
   - Scroll ke bagian **"Jadwal Pelajaran"**
   - Klik **"Tambah Jadwal"**
   - Pilih hari dan masukkan nama mata pelajaran (contoh: IPAS, MTK, PAI)
   - Klik **"Simpan"**
   - Untuk menghapus, klik icon trash pada jadwal yang ingin dihapus

2. **Aturan:**
   - Hanya bisa mengelola jadwal untuk kelas mereka sendiri
   - Bisa menambahkan multiple mata pelajaran per hari
   - Fitur hanya aktif saat subscription kelas aktif

### Untuk User Biasa:

1. **Lihat Jadwal:**
   - Buka halaman **Jadwal** (dari navigation header)
   - Lihat jadwal pelajaran untuk kelas mereka
   - Jadwal dikelompokkan berdasarkan hari

2. **Reminder Otomatis:**
   - Saat membuka aplikasi, sistem akan:
     - Cek jadwal untuk hari besok
     - Jika ada jadwal, cari tugas yang mengandung nama mata pelajaran di title
     - Jika ada tugas yang belum selesai, munculkan reminder modal
   - Reminder muncul otomatis sekali per session
   - Reminder ditunda jika ada overdue reminder (muncul setelah overdue reminder ditutup)

## 🎯 Logic Reminder

### Kapan Reminder Muncul:
1. User membuka aplikasi (page load)
2. Besok ada jadwal pelajaran di kelas user
3. Ada tugas yang dibuat hari ini yang mengandung nama mata pelajaran di title
4. Tugas tersebut belum selesai (belum dicentang)

### Contoh:
- Jadwal besok (Selasa): IPAS, MTK
- Ada tugas hari ini dengan title: "IPAS - Kerjakan halaman 10" → **Akan muncul di reminder**
- Ada tugas hari ini dengan title: "PR Matematika" → **Tidak muncul** (tidak mengandung "MTK" di title)

### Filter Task:
- Sistem mencari nama mata pelajaran di **title thread/tugas**
- Pencarian case-insensitive
- Contoh: "IPAS", "ipas", "Ipas" akan match dengan jadwal "IPAS"

## 🔒 Permission & Access Control

### Kelola Jadwal (Danton):
- **Danton:** ✅ Hanya untuk kelas mereka sendiri
- **User Biasa:** ❌ Tidak bisa
- **Admin:** ❌ (Admin tidak bisa manage jadwal, hanya danton)

### Lihat Jadwal:
- **Semua user:** ✅ Hanya jadwal kelas mereka sendiri
- **Admin:** ❌ (Tidak ada kelas)

### Reminder:
- **Semua user:** ✅ Otomatis muncul jika kondisi terpenuhi

## 📱 Responsive Design

Fitur schedule sudah fully responsive:
- **Desktop:** Layout optimal dengan spacing yang baik
- **Tablet:** Layout disesuaikan untuk layar menengah
- **Mobile:** Stack layout, full-width buttons, touch-friendly

## 🎨 UI/UX Features

- ✅ Minimalis design tanpa emoji
- ✅ Menggunakan icon monochrome (CalendarIcon, BookIcon, BellIcon)
- ✅ Animasi fade-in untuk schedule cards
- ✅ Modal form untuk tambah jadwal dengan animasi
- ✅ Responsive layout untuk semua device
- ✅ Touch-friendly buttons (min-height 44px)

## 📂 File Structure

```
app/
  schedule/
    page.tsx                      # Halaman jadwal untuk user lihat jadwal

components/
  schedule/
    ScheduleManager.tsx           # Component untuk danton manage jadwal (CRUD)
    ScheduleViewer.tsx            # Component untuk user lihat jadwal (read-only)
    ScheduleReminderModal.tsx     # Modal reminder untuk tugas besok berdasarkan jadwal

hooks/
  useSchedule.ts                  # Hook untuk fetch jadwal (getByKelas, getMySchedule)
  useScheduleReminder.ts          # Hook untuk fetch reminder tasks

server/trpc/routers/
  schedule.ts                     # Backend router untuk schedule operations

scripts/
  migrate-class-schedule.sql      # SQL migration script
```

## 🧪 Testing

### Test Manage Jadwal (Danton):
1. Login sebagai danton
2. Buka Danton Dashboard
3. Scroll ke "Jadwal Pelajaran"
4. Klik "Tambah Jadwal"
5. Pilih hari (contoh: Senin)
6. Masukkan mata pelajaran (contoh: IPAS)
7. Klik "Simpan"
8. Verify: Jadwal muncul di list
9. Klik icon trash untuk hapus
10. Verify: Jadwal terhapus

### Test Lihat Jadwal (User):
1. Login sebagai user biasa (dari kelas yang sudah ada jadwal)
2. Klik "Jadwal" di navigation header
3. Verify: Jadwal pelajaran muncul dikelompokkan per hari

### Test Reminder:
1. **Setup:**
   - Login sebagai danton
   - Tambah jadwal: Besok = IPAS
   - Buat tugas hari ini dengan title mengandung "IPAS" (contoh: "IPAS - Kerjakan PR")
   - Login sebagai user biasa (dari kelas yang sama)
   - Pastikan tugas belum dicentang
2. **Test:**
   - Refresh page atau buka aplikasi
   - Verify: Reminder modal muncul dengan informasi:
     - Hari besok
     - Mata pelajaran yang ada jadwal (IPAS)
     - Tugas yang belum selesai (IPAS - Kerjakan PR)
3. **Test No Reminder:**
   - Centang tugas sebagai selesai
   - Refresh page
   - Verify: Reminder tidak muncul

### Test Multiple Subjects:
1. Tambah jadwal: Besok = IPAS, MTK, PAI
2. Buat 3 tugas hari ini:
   - "IPAS - Kerjakan halaman 10"
   - "MTK - Kerjakan soal 1-5"
   - "PAI - Hafalkan surat Al-Fatihah"
3. Verify: Reminder muncul dengan semua 3 tugas

## 📝 Notes

- **Jadwal per kelas:** Setiap kelas memiliki jadwal sendiri
- **Reminder otomatis:** Muncul saat page load, hanya sekali per session
- **Filter tugas:** Berdasarkan nama mata pelajaran di title (case-insensitive, substring match)
- **Subscription:** Danton hanya bisa manage jadwal saat subscription aktif
- **Unique constraint:** Tidak bisa menambah jadwal duplikat (hari + mata pelajaran yang sama)

