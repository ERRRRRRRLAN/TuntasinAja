# 🗄️ Setup Database Production untuk Vercel

Panduan untuk membuat tabel database di database production setelah deploy ke Vercel.

## ⚠️ Masalah

Error yang muncul:
```
The table `public.users` does not exist in the current database.
```

Ini berarti schema database belum di-push ke database production.

---

## 🔧 Solusi: Push Schema ke Database Production

Ada 3 cara untuk setup database schema di production:

---

## 📋 Cara 1: Menggunakan Vercel CLI (Recommended)

Cara ini paling mudah dan aman karena otomatis menggunakan environment variables dari Vercel.

### Langkah-langkah:

1. **Install Vercel CLI** (jika belum):
   ```bash
   npm i -g vercel
   ```

2. **Login ke Vercel**:
   ```bash
   vercel login
   ```
   - Buka browser dan login dengan akun Vercel Anda

3. **Link ke project Vercel**:
   ```bash
   vercel link
   ```
   - Pilih project yang sesuai
   - Pilih scope (biasanya personal atau team)

4. **Pull environment variables**:
   ```bash
   vercel env pull .env.local
   ```
   - Ini akan membuat file `.env.local` dengan semua environment variables dari Vercel
   - **JANGAN commit file ini ke GitHub!** (sudah ada di `.gitignore`)

5. **Push schema ke database**:
   ```bash
   npx prisma db push
   ```
   - Prisma akan menggunakan `DATABASE_URL` dari `.env.local`
   - Ini akan membuat semua tabel yang diperlukan

6. **Verifikasi** (opsional):
   ```bash
   npx prisma studio
   ```
   - Buka browser di `http://localhost:5555`
   - Cek apakah tabel-tabel sudah ada

---

## 📋 Cara 2: Menggunakan DATABASE_URL Langsung

Jika Anda sudah punya `DATABASE_URL` dari Vercel, bisa langsung digunakan.

### Langkah-langkah:

1. **Copy DATABASE_URL dari Vercel**:
   - Buka Vercel Dashboard → Project → Settings → Environment Variables
   - Copy value dari `DATABASE_URL`

2. **Set DATABASE_URL di terminal** (Windows PowerShell):
   ```powershell
   $env:DATABASE_URL="postgresql://postgres.xxxxx:password@aws-0-xxxxx.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public"
   ```

   Atau di Command Prompt:
   ```cmd
   set DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-xxxxx.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public
   ```

   Atau di Git Bash / Linux / Mac:
   ```bash
   export DATABASE_URL="postgresql://postgres.xxxxx:password@aws-0-xxxxx.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public"
   ```

3. **Push schema ke database**:
   ```bash
   npx prisma db push
   ```

---

## 📋 Cara 3: Menggunakan Supabase SQL Editor

Jika menggunakan Supabase, bisa langsung menjalankan SQL di Supabase Dashboard.

### Langkah-langkah:

1. **Generate SQL dari Prisma Schema**:
   ```bash
   npx prisma migrate dev --create-only --name init
   ```
   - Ini akan membuat file migration di `prisma/migrations/`

2. **Buka Supabase Dashboard**:
   - Buka project Anda di Supabase
   - Klik **SQL Editor**

3. **Jalankan SQL Migration**:
   - Buka file migration yang baru dibuat (di `prisma/migrations/[timestamp]_init/migration.sql`)
   - Copy isi SQL-nya
   - Paste ke SQL Editor di Supabase
   - Klik **Run**

**Catatan:** Cara ini lebih kompleks, lebih baik gunakan Cara 1 atau 2.

---

## ✅ Verifikasi Setup

Setelah menjalankan `prisma db push`, verifikasi bahwa tabel sudah dibuat:

### Menggunakan Prisma Studio:
```bash
npx prisma studio
```
Buka `http://localhost:5555` dan cek apakah tabel-tabel berikut ada:
- ✅ `users`
- ✅ `threads`
- ✅ `comments`
- ✅ `user_statuses`
- ✅ `histories`

### Atau test langsung di website:
1. Buka website production di Vercel
2. Coba register akun baru
3. Jika berhasil, berarti database sudah setup dengan benar

---

## 🐛 Troubleshooting

### Error: "Can't reach database server"

**Penyebab:** `DATABASE_URL` salah atau database tidak accessible

**Solusi:**
1. Pastikan `DATABASE_URL` benar
2. Pastikan menggunakan **Session Pooler** untuk Supabase (port 6543)
3. Pastikan database accessible dari internet
4. Cek firewall/network settings di Supabase

### Error: "Schema already exists" atau "Table already exists"

**Penyebab:** Schema sudah pernah di-push sebelumnya

**Solusi:**
- Tidak masalah, ini berarti tabel sudah ada
- Coba test register di website

### Error: "Connection pooler timeout"

**Penyebab:** Connection pooler terlalu sibuk atau connection string salah

**Solusi:**
1. Pastikan menggunakan **Session Pooler** (port 6543)
2. Pastikan format connection string benar
3. Coba lagi setelah beberapa saat

---

## 📝 Catatan Penting

1. **Jangan commit `.env.local`** ke GitHub (sudah ada di `.gitignore`)
2. **Gunakan Session Pooler** untuk Supabase (port 6543), bukan direct connection
3. **Backup database** sebelum push schema jika sudah ada data penting
4. **`prisma db push`** akan membuat tabel baru, tidak akan menghapus data yang sudah ada

---

## 🎉 Selesai!

Setelah menjalankan `prisma db push` dan verifikasi berhasil, website Anda seharusnya sudah bisa digunakan untuk register dan login!

**Langkah selanjutnya:**
1. Test register di website production
2. Test login
3. Test fitur-fitur lainnya

