# 🔄 Migration: Fitur Kelas

Panduan untuk menambahkan fitur kelas ke aplikasi TuntasinAja.

## 📋 Deskripsi

Fitur kelas memungkinkan:
- Admin untuk menambahkan user dengan kelas tertentu (X RPL 1, X RPL 2, XI TKJ 1, dll)
- User hanya melihat thread dari kelas mereka sendiri
- Admin melihat semua thread dari semua kelas

## 🚀 Langkah-langkah Migration

### 1. Jalankan Migration Database

#### Opsi A: Menggunakan SQL Script (Recommended untuk Supabase)

1. **Buka Supabase Dashboard**:
   - Login ke https://supabase.com
   - Pilih project Anda
   - Buka **SQL Editor**

2. **Jalankan SQL Script**:
   - Buka file `scripts/add-kelas-column.sql`
   - Copy semua isi file tersebut
   - Paste ke SQL Editor di Supabase
   - Klik **Run** atau tekan `Ctrl+Enter`

#### Opsi B: Menggunakan Node.js Script

1. **Pastikan environment variable sudah di-set**:
   - Pastikan file `.env` sudah ada dan berisi `DATABASE_URL` yang benar

2. **Jalankan script**:
   ```bash
   npm run migrate:kelas
   ```
   
   Atau langsung:
   ```bash
   node scripts/add-kelas-column.js
   ```

### 2. Generate Prisma Client

Setelah migration selesai, generate Prisma client:

```bash
npm run db:generate
```

Atau:

```bash
npx prisma generate
```

### 3. Verifikasi Migration

Setelah migration selesai, verifikasi dengan query berikut:

```sql
-- Cek apakah kolom sudah ada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name = 'kelas';

-- Cek index
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users' 
  AND indexname = 'idx_users_kelas';
```

## ✅ Fitur yang Ditambahkan

1. **Form Tambah User**:
   - Dropdown pilihan kelas (X, XI, XII untuk RPL, TKJ, BC dengan nomor 1 dan 2)
   - Kelas wajib untuk user non-admin
   - Admin tidak perlu memilih kelas

2. **Filter Thread**:
   - User hanya melihat thread dari kelas mereka
   - Admin melihat semua thread
   - User tanpa kelas (null) melihat semua thread

3. **Daftar User**:
   - Kolom kelas ditampilkan di tabel user
   - Badge untuk menampilkan kelas

## 📝 Format Kelas

Format kelas menggunakan angka romawi:
- **X** untuk kelas 10
- **XI** untuk kelas 11
- **XII** untuk kelas 12

Contoh:
- X RPL 1
- X RPL 2
- XI TKJ 1
- XI TKJ 2
- XII BC 1
- XII BC 2

## ⚠️ Catatan Penting

- **Backward Compatibility**: Kolom `kelas` adalah nullable, jadi user yang sudah ada tidak akan terpengaruh
- **User Lama**: User yang sudah ada tanpa kelas akan melihat semua thread (sama seperti admin)
- **Admin**: Admin tidak perlu kelas dan akan melihat semua thread
- **Production**: Pastikan migration di-test di development/staging sebelum dijalankan di production

## 🔍 Troubleshooting

### Error: Column already exists

Jika kolom sudah ada, script akan skip dan melanjutkan. Ini normal.

### Error: Cannot find module '@prisma/client'

Jalankan:
```bash
npm install
npm run db:generate
```

### User tidak melihat thread

Pastikan:
1. User sudah memiliki kelas yang di-set
2. Thread dibuat oleh user dari kelas yang sama
3. User bukan admin (admin melihat semua thread)

## 📚 File yang Diubah

- `prisma/schema.prisma` - Menambahkan field `kelas` ke model User
- `components/admin/AddUserForm.tsx` - Menambahkan dropdown kelas
- `components/admin/UserList.tsx` - Menampilkan kolom kelas
- `server/trpc/routers/auth.ts` - Menerima dan menyimpan kelas
- `server/trpc/routers/thread.ts` - Filter thread berdasarkan kelas

## 🎉 Selesai!

Setelah migration selesai, fitur kelas sudah siap digunakan!

