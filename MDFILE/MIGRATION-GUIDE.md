# 🔄 Panduan Migration Database

Panduan untuk menjalankan migration database tanpa menggunakan `npx prisma db push`.

## 📋 Opsi 1: Menggunakan SQL Script (Recommended untuk Supabase)

### Langkah-langkah:

1. **Buka Supabase Dashboard**:
   - Login ke https://supabase.com
   - Pilih project Anda
   - Buka **SQL Editor**

2. **Jalankan SQL Script**:
   - Buka file `scripts/migrate-history-denormalization.sql`
   - Copy semua isi file tersebut
   - Paste ke SQL Editor di Supabase
   - Klik **Run** atau tekan `Ctrl+Enter`

3. **Verifikasi**:
   - Cek apakah kolom sudah ditambahkan dengan query:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'histories';
   ```

## 📋 Opsi 2: Menggunakan Node.js Script

### Langkah-langkah:

1. **Pastikan environment variable sudah di-set**:
   - Pastikan file `.env` sudah ada dan berisi `DATABASE_URL` yang benar

2. **Jalankan script**:
   ```bash
   node scripts/migrate-history-denormalization.js
   ```
   
   Atau menggunakan npm script:
   ```bash
   npm run migrate:history
   ```

3. **Verifikasi**:
   - Script akan menampilkan log sukses jika migration berhasil

## 📋 Opsi 3: Menggunakan Prisma Studio (Manual)

1. **Buka Prisma Studio**:
   ```bash
   npm run db:studio
   ```

2. **Jalankan SQL manual**:
   - Buka database client (pgAdmin, DBeaver, atau Supabase SQL Editor)
   - Jalankan SQL dari `scripts/migrate-history-denormalization.sql`

## ⚠️ Catatan Penting

- **Backup Database**: Sebelum menjalankan migration, disarankan untuk backup database terlebih dahulu
- **Production**: Pastikan migration di-test di development/staging sebelum dijalankan di production
- **Downtime**: Migration ini tidak akan menyebabkan downtime karena hanya menambahkan kolom baru

## 🔍 Verifikasi Migration

Setelah migration selesai, verifikasi dengan query berikut:

```sql
-- Cek apakah kolom sudah ada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'histories'
  AND column_name IN ('thread_title', 'thread_author_id', 'thread_author_name');

-- Cek data existing
SELECT id, thread_id, thread_title, thread_author_id, thread_author_name
FROM histories
LIMIT 5;
```

## 🆘 Troubleshooting

### Error: "column already exists"
- Kolom sudah ada, migration sudah pernah dijalankan
- Tidak perlu khawatir, script menggunakan `IF NOT EXISTS`

### Error: "permission denied"
- Pastikan database user memiliki permission untuk ALTER TABLE
- Untuk Supabase, pastikan menggunakan service role key atau admin user

### Error: "relation does not exist"
- Pastikan nama tabel benar (harus `histories`, bukan `history`)
- Cek schema name (default: `public`)

