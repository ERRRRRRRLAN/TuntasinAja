# ⚠️ URGENT: Setup Timezone untuk Memperbaiki Timestamp

## Masalah
Timestamp `created_at` di database menunjukkan waktu yang salah (selisih 7 jam dari waktu lokal).

## Solusi Cepat

### Langkah 1: Set Timezone di Vercel Environment Variables

1. **Buka Vercel Dashboard**
   - Login ke https://vercel.com
   - Pilih project "TuntasinAja"

2. **Buka Settings > Environment Variables**

3. **Edit DATABASE_URL**
   - Cari variable `DATABASE_URL`
   - Edit value-nya
   - Tambahkan `&options=-c%20timezone%3DAsia/Jakarta` di akhir URL
   
   **Contoh:**
   ```
   Sebelum:
   postgresql://user:pass@host:port/db?schema=public
   
   Sesudah:
   postgresql://user:pass@host:port/db?schema=public&options=-c%20timezone%3DAsia/Jakarta
   ```

4. **Save dan Redeploy**
   - Klik "Save"
   - Buka tab "Deployments"
   - Klik "..." pada deployment terbaru
   - Pilih "Redeploy"

### Langkah 2: Set Timezone di Supabase (Opsional tapi Disarankan)

1. **Buka Supabase SQL Editor**
   - Login ke Supabase Dashboard
   - Pilih project Anda
   - Buka "SQL Editor"

2. **Jalankan query ini:**
   ```sql
   -- Set timezone untuk session ini
   SET timezone = 'Asia/Jakarta';
   
   -- Verifikasi
   SHOW timezone;
   SELECT NOW() as current_time;
   ```

3. **Untuk set permanen (jika punya akses):**
   ```sql
   -- Hanya bisa dilakukan jika punya akses superuser
   ALTER DATABASE postgres SET timezone = 'Asia/Jakarta';
   ```

### Langkah 3: Verifikasi

Setelah redeploy, test dengan:
1. Buat thread baru
2. Cek `created_at` di Supabase Table Editor
3. Waktu seharusnya sesuai dengan waktu lokal (WIB)

## Catatan Penting

- **Timezone di DATABASE_URL** adalah yang paling penting
- Setelah mengubah DATABASE_URL, **WAJIB redeploy** di Vercel
- Timestamp yang sudah ada tidak akan berubah, hanya timestamp baru yang akan benar
- Jika ingin memperbaiki timestamp lama, gunakan script SQL di `scripts/fix-timestamp-timezone.sql`

## Troubleshooting

### Timestamp masih salah setelah setup
- Pastikan sudah redeploy di Vercel
- Cek apakah DATABASE_URL sudah benar di Environment Variables
- Pastikan format URL benar: `&options=-c%20timezone%3DAsia/Jakarta`

### Error saat set timezone
- Pastikan format URL encoding benar (`%20` untuk space, `%3D` untuk `=`)
- Cek apakah connection string masih valid

