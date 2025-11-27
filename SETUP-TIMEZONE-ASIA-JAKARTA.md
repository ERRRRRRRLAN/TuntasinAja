# ⚠️ PENTING: Setup Timezone Asia/Jakarta di Vercel

## Masalah
Timestamp di database tidak sesuai dengan waktu lokal (WIB). Database masih menggunakan UTC.

## Solusi: Set Timezone Asia/Jakarta

### Langkah 1: Edit DATABASE_URL di Vercel

1. **Buka Vercel Dashboard**
   - Login ke https://vercel.com
   - Pilih project "TuntasinAja"

2. **Buka Settings → Environment Variables**

3. **Edit DATABASE_URL**
   - Cari variable `DATABASE_URL`
   - Klik untuk edit
   - **TAMBAHKAN** di akhir URL (setelah `?schema=public` atau sebelum `?`):
   
   ```
   &options=-c%20timezone%3DAsia/Jakarta
   ```
   
   **Contoh lengkap:**
   ```
   Sebelum:
   postgresql://user:pass@host:port/db?schema=public
   
   Sesudah:
   postgresql://user:pass@host:port/db?schema=public&options=-c%20timezone%3DAsia/Jakarta
   ```
   
   **Atau jika sudah ada parameter lain:**
   ```
   postgresql://user:pass@host:port/db?schema=public&options=-c%20timezone%3DAsia/Jakarta
   ```

4. **Save**
   - Klik "Save" untuk menyimpan perubahan

5. **Redeploy**
   - Buka tab "Deployments"
   - Klik "..." pada deployment terbaru
   - Pilih "Redeploy"
   - Tunggu sampai deploy selesai

### Langkah 2: Verifikasi di Supabase

1. **Buka Supabase SQL Editor**
   - Login ke Supabase Dashboard
   - Pilih project Anda
   - Buka "SQL Editor"

2. **Jalankan query untuk cek timezone:**
   ```sql
   SHOW timezone;
   SELECT NOW() as current_time;
   ```

3. **Set timezone (jika belum):**
   ```sql
   SET timezone = 'Asia/Jakarta';
   ```

### Langkah 3: Test

Setelah redeploy:
1. Buat thread baru di aplikasi
2. Cek `created_at` di Supabase Table Editor
3. Waktu seharusnya sesuai dengan waktu lokal (WIB)

## Format URL Encoding

- `%20` = space
- `%3D` = `=`
- Jadi `-c%20timezone%3DAsia/Jakarta` = `-c timezone=Asia/Jakarta`

## Catatan Penting

- ⚠️ **WAJIB redeploy** setelah mengubah Environment Variables
- Timestamp baru akan menggunakan timezone Asia/Jakarta
- Timestamp lama tidak akan berubah (sudah tersimpan)
- Jika ingin memperbaiki timestamp lama, gunakan script SQL di `scripts/fix-timestamp-timezone.sql`

## Troubleshooting

### Timestamp masih salah
- Pastikan sudah redeploy di Vercel
- Cek format URL encoding sudah benar
- Pastikan `&options=-c%20timezone%3DAsia/Jakarta` ada di akhir URL

### Error connection
- Pastikan format URL masih valid
- Cek apakah connection string masih bisa connect
- Pastikan tidak ada karakter yang salah

