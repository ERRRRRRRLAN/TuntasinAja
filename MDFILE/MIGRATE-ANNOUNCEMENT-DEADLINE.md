# 🚀 Migration: Announcement & Deadline Features

Panduan untuk menjalankan migration database untuk fitur Announcement dan Deadline.

## ⚠️ Error yang Terjadi

Jika Anda melihat error seperti ini di Vercel logs:
```
The column `threads.deadline` does not exist in the current database.
```

Ini berarti migration belum dijalankan di database production.

---

## 📋 Cara Menjalankan Migration

### ⚠️ PENTING: Pilih Script yang Tepat!

Ada 2 versi migration script:

1. **`migrate-announcement-deadline.sql`** - **HAPUS semua data announcements** (jika tabel sudah ada)
   - Gunakan jika Anda **TIDAK** punya data announcements penting
   - Atau jika ini pertama kali setup

2. **`migrate-announcement-deadline-safe.sql`** - **MEMPERTAHANKAN data** yang sudah ada
   - Gunakan jika Anda **SUDAH** punya data announcements yang ingin dipertahankan
   - Script ini akan menambahkan kolom yang hilang tanpa menghapus data

---

### Opsi 1: Menggunakan Supabase SQL Editor (Recommended)

1. **Buka Supabase Dashboard**:
   - Login ke https://supabase.com
   - Pilih project Anda
   - Klik **SQL Editor** di sidebar kiri

2. **Pilih Script yang Tepat**:
   - **Jika TIDAK ada data penting**: Gunakan `scripts/migrate-announcement-deadline.sql`
   - **Jika ADA data penting**: Gunakan `scripts/migrate-announcement-deadline-safe.sql`

3. **Jalankan Migration Script**:
   - Buka file script yang dipilih
   - Copy **SEMUA** isi file tersebut
   - Paste ke SQL Editor di Supabase
   - Klik **Run** atau tekan `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

3. **Verifikasi Migration**:
   - Cek apakah kolom `deadline` sudah ditambahkan:
     ```sql
     SELECT column_name, data_type 
     FROM information_schema.columns 
     WHERE table_name = 'threads' AND column_name = 'deadline';
     ```
   - Cek apakah tabel `announcements` sudah dibuat:
     ```sql
     SELECT table_name 
     FROM information_schema.tables 
     WHERE table_name = 'announcements';
     ```

---

### Opsi 2: Menggunakan Vercel CLI

1. **Install Vercel CLI** (jika belum):
   ```bash
   npm i -g vercel
   ```

2. **Login ke Vercel**:
   ```bash
   vercel login
   ```

3. **Link ke project Vercel**:
   ```bash
   vercel link
   ```

4. **Pull environment variables**:
   ```bash
   vercel env pull .env.local
   ```

5. **Jalankan migration menggunakan psql atau database client**:
   ```bash
   # Jika menggunakan psql
   psql $DATABASE_URL -f scripts/migrate-announcement-deadline.sql
   
   # Atau copy-paste SQL script ke database client Anda
   ```

---

### Opsi 3: Menggunakan Prisma DB Push (Alternative)

**Catatan:** Opsi ini akan sync seluruh schema, bukan hanya migration ini.

1. **Set DATABASE_URL**:
   ```powershell
   # Windows PowerShell
   $env:DATABASE_URL="postgresql://[YOUR_DATABASE_URL]"
   ```

2. **Push schema**:
   ```bash
   npx prisma db push
   ```

3. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

---

## ✅ Setelah Migration Selesai

1. **Redeploy di Vercel** (opsional, tapi disarankan):
   - Buka Vercel Dashboard
   - Pilih project Anda
   - Klik **Deployments**
   - Klik **Redeploy** pada deployment terbaru

2. **Test aplikasi**:
   - Buka aplikasi production
   - Cek apakah halaman Tugas dan History sudah bisa dimuat
   - Cek apakah fitur Announcement sudah muncul di menu

---

## 🐛 Troubleshooting

### Error: "column already exists"
- **Tidak apa-apa!** Ini berarti kolom sudah ada dari migration sebelumnya
- Script menggunakan `IF NOT EXISTS`, jadi aman untuk dijalankan ulang
- Lanjut ke langkah berikutnya

### Error: "type already exists"
- **Tidak apa-apa!** Enum type sudah ada
- Script menggunakan `DO $$ BEGIN ... EXCEPTION ... END $$` untuk handle duplicate
- Lanjut ke langkah berikutnya

### Error: "table already exists"
- **Tidak apa-apa!** Tabel sudah dibuat sebelumnya
- Script menggunakan `IF NOT EXISTS`, jadi aman
- Lanjut ke langkah berikutnya

### Error: "relation does not exist"
- Pastikan Anda menjalankan migration di database yang benar (production)
- Cek `DATABASE_URL` di Vercel Environment Variables

---

## 📝 Yang Akan Ditambahkan oleh Migration

1. **Kolom `deadline`** di tabel `threads` (TIMESTAMP, nullable)
2. **Kolom `deadline`** di tabel `comments` (TIMESTAMP, nullable)
3. **Enum `AnnouncementTargetType`** ('global', 'class', 'subject')
4. **Enum `AnnouncementPriority`** ('urgent', 'normal', 'low')
5. **Tabel `announcements`** dengan semua kolom yang diperlukan
6. **Tabel `announcement_reads`** untuk tracking read status
7. **Indexes** untuk optimasi query

---

## 🔍 Verifikasi Lengkap

Setelah migration selesai, jalankan query berikut untuk memastikan semua sudah benar:

```sql
-- 1. Cek kolom deadline di threads
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'threads' AND column_name = 'deadline';

-- 2. Cek kolom deadline di comments
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'comments' AND column_name = 'deadline';

-- 3. Cek enum types
SELECT typname, typtype
FROM pg_type
WHERE typname IN ('AnnouncementTargetType', 'AnnouncementPriority');

-- 4. Cek tabel announcements
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'announcements';

-- 5. Cek tabel announcement_reads
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'announcement_reads';

-- 6. Cek indexes
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('announcements', 'announcement_reads');
```

Semua query di atas harus mengembalikan hasil (tidak kosong).

---

## ⚡ Quick Fix (Jika Masih Error Setelah Migration)

Jika setelah migration masih ada error, coba:

1. **Redeploy di Vercel**:
   - Vercel mungkin masih menggunakan cached Prisma Client
   - Redeploy akan regenerate Prisma Client dengan schema terbaru

2. **Clear Vercel Build Cache**:
   - Buka Vercel Dashboard → Project → Settings → General
   - Scroll ke bawah, klik **Clear Build Cache**
   - Redeploy ulang

---

**File migration:** `scripts/migrate-announcement-deadline.sql`

