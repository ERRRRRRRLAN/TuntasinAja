# Panduan Memperbaiki Timestamp dan Timezone di Database

## Masalah
Timestamp di database tidak sesuai dengan waktu sekarang. Ini biasanya terjadi karena:
1. Timezone database tidak diatur dengan benar
2. Timestamp yang sudah ada menggunakan timezone yang salah
3. Aplikasi dan database menggunakan timezone yang berbeda

## Solusi

### ⚠️ PENTING: Set Timezone di DATABASE_URL

**Langkah pertama yang harus dilakukan**: Tambahkan timezone ke connection string di file `.env`:

```env
DATABASE_URL="postgresql://user:password@host:port/database?schema=public&options=-c%20timezone%3DAsia/Jakarta"
```

Atau untuk UTC (disarankan untuk production):
```env
DATABASE_URL="postgresql://user:password@host:port/database?schema=public&options=-c%20timezone%3DUTC"
```

**Setelah mengubah DATABASE_URL, restart aplikasi Anda!**

### Opsi 1: Menggunakan Script SQL (Disarankan)

1. **Buka Supabase SQL Editor**
   - Login ke Supabase Dashboard
   - Pilih project Anda
   - Buka menu "SQL Editor"

2. **Jalankan Script SQL**
   - Buka file `scripts/fix-timestamp-timezone.sql`
   - Copy isi file tersebut
   - Paste ke SQL Editor
   - Edit sesuai kebutuhan (pilih timezone: Asia/Jakarta atau UTC)
   - Jalankan script

3. **Set Timezone Permanen (Opsional)**
   - Untuk set timezone secara permanen, tambahkan ke connection string:
   ```
   DATABASE_URL="postgresql://...?options=-c%20timezone%3DAsia/Jakarta"
   ```
   - Atau set di Supabase Dashboard > Settings > Database > Connection Pooling

### Opsi 2: Menggunakan Script Node.js

1. **Jalankan script untuk memeriksa dan set timezone:**
   ```bash
   npm run fix:timezone
   ```

2. **Update timestamp yang sudah ada (HATI-HATI!):**
   - Buka file `scripts/fix-timestamp-timezone.js`
   - Uncomment bagian `updateExistingTimestamps()`
   - Jalankan dengan:
   ```bash
   node scripts/fix-timestamp-timezone.js --update-timestamps
   ```

   ⚠️ **PERINGATAN**: Script ini akan mengubah semua timestamp yang sudah ada. Pastikan Anda sudah backup database terlebih dahulu!

### Opsi 3: Set Timezone di Connection String

Tambahkan timezone ke `DATABASE_URL` di file `.env`:

```env
DATABASE_URL="postgresql://user:password@host:port/database?schema=public&options=-c%20timezone%3DAsia/Jakarta"
```

Atau untuk UTC:
```env
DATABASE_URL="postgresql://user:password@host:port/database?schema=public&options=-c%20timezone%3DUTC"
```

## Timezone yang Disarankan

- **Asia/Jakarta (WIB)**: UTC+7 - Cocok untuk aplikasi lokal Indonesia
- **UTC**: Cocok untuk aplikasi internasional atau production

## Verifikasi

Setelah memperbaiki timezone, verifikasi dengan:

1. **Cek timezone database:**
   ```sql
   SHOW timezone;
   ```

2. **Cek waktu server:**
   ```sql
   SELECT NOW() as server_time, 
          CURRENT_TIMESTAMP as current_timestamp;
   ```

3. **Cek timestamp di tabel:**
   ```sql
   SELECT 
     'users' as table_name,
     MIN(created_at) as earliest,
     MAX(created_at) as latest
   FROM users
   UNION ALL
   SELECT 
     'threads' as table_name,
     MIN(created_at) as earliest,
     MAX(created_at) as latest
   FROM threads;
   ```

## Catatan Penting

1. **Backup Database**: Selalu backup database sebelum mengubah timestamp yang sudah ada
2. **Timezone Permanen**: Untuk set timezone permanen, gunakan connection string atau set di database level
3. **Aplikasi Baru**: Timestamp baru yang dibuat setelah perbaikan akan menggunakan timezone yang benar
4. **Timestamp Lama**: Jika perlu memperbaiki timestamp lama, gunakan script update dengan hati-hati

## Troubleshooting

### Timestamp masih salah setelah perbaikan
- Pastikan timezone sudah di-set dengan benar
- Cek apakah aplikasi menggunakan `new Date()` dengan benar
- Verifikasi connection string sudah include timezone option

### Error saat menjalankan script
- Pastikan koneksi database berjalan
- Cek apakah user memiliki permission untuk set timezone
- Untuk Supabase, pastikan menggunakan connection pooler dengan benar

## Referensi

- [PostgreSQL Timezone Documentation](https://www.postgresql.org/docs/current/datatype-datetime.html)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

