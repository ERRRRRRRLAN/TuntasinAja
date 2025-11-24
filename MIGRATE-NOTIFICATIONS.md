# 🔔 Migrasi Table Notifications

Table `notifications` belum ada di database. Ikuti salah satu cara berikut untuk membuat table:

## Opsi 1: Menggunakan Prisma DB Push (Paling Mudah)

Jalankan command berikut di terminal lokal Anda (pastikan `DATABASE_URL` sudah di-set di `.env`):

```bash
npx prisma db push
```

Ini akan secara otomatis membuat table `notifications` berdasarkan schema Prisma.

## Opsi 2: Menggunakan Script SQL (Manual)

Jika Anda memiliki akses langsung ke database PostgreSQL:

1. Buka database client (pgAdmin, DBeaver, atau psql)
2. Jalankan SQL script dari file `scripts/create-notifications-table.sql`

Atau jalankan via Node.js script:

```bash
npm run migrate:notifications
```

## Opsi 3: Menggunakan Prisma Migrate (Recommended untuk Production)

Buat migration file:

```bash
npx prisma migrate dev --name add_notifications_table
```

Kemudian deploy migration ke production:

```bash
npx prisma migrate deploy
```

## Opsi 4: Via Vercel (Jika menggunakan Vercel)

Jika aplikasi Anda di-deploy di Vercel, Anda bisa:

1. **Menambahkan build command** di `vercel.json` untuk auto-migrate:
   ```json
   {
     "buildCommand": "npm run build && npx prisma migrate deploy"
   }
   ```

2. **Atau jalankan manual** via Vercel CLI:
   ```bash
   vercel env pull
   npx prisma migrate deploy
   ```

3. **Atau via Vercel Dashboard**:
   - Buka project di Vercel Dashboard
   - Go to Settings > Environment Variables
   - Pastikan `DATABASE_URL` sudah di-set
   - Jalankan command via Vercel CLI atau via local dengan env variables

## ⚠️ Catatan Penting

- Pastikan `DATABASE_URL` sudah benar di environment variables
- Backup database sebelum menjalankan migration (untuk production)
- Setelah table dibuat, aplikasi akan berfungsi normal

## ✅ Verifikasi

Setelah migration selesai, verifikasi dengan:

```bash
npx prisma studio
```

Atau query langsung:

```sql
SELECT * FROM notifications LIMIT 1;
```

Jika tidak ada error, berarti table sudah berhasil dibuat!

