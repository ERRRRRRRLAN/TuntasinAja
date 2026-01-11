# 🗓️ Setup Tabel Weekly Schedule

Panduan untuk membuat tabel `weekly_schedules` di database production.

## ⚠️ Masalah

Error yang muncul:
```
The table `public.weekly_schedules` does not exist in the current database.
```

Ini berarti tabel `weekly_schedules` belum dibuat di database production.

---

## 🔧 Solusi: Push Schema ke Database Production

Ada 2 cara untuk setup tabel `weekly_schedules` di production:

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
   - Ini akan membuat tabel `weekly_schedules` dan enum `DayOfWeek`

6. **Verifikasi** (opsional):
   ```bash
   npx prisma studio
   ```
   - Buka browser di `http://localhost:5555`
   - Cek apakah tabel `weekly_schedules` sudah ada

---

## 📋 Cara 2: Menggunakan SQL Script Langsung

Jika menggunakan Supabase atau database lain, bisa langsung menjalankan SQL script.

### Langkah-langkah:

1. **Buka Supabase Dashboard** (atau database client Anda):
   - Buka project Anda di Supabase
   - Klik **SQL Editor**

2. **Jalankan SQL Script**:
   - Buka file `scripts/create-weekly-schedule-table.sql`
   - Copy isi SQL-nya
   - Paste ke SQL Editor di Supabase
   - Klik **Run**

3. **Verifikasi**:
   - Cek apakah tabel `weekly_schedules` sudah dibuat
   - Cek apakah enum `DayOfWeek` sudah dibuat

---

## ✅ Verifikasi Setup

Setelah menjalankan migration, verifikasi bahwa tabel sudah dibuat:

### Menggunakan Prisma Studio:
```bash
npx prisma studio
```
Buka `http://localhost:5555` dan cek apakah tabel berikut ada:
- ✅ `weekly_schedules`

### Atau test langsung di website:
1. Buka website production di Vercel
2. Login sebagai ketua
3. Buka halaman ketua Dashboard
4. Coba tambah jadwal pelajaran
5. Jika berhasil, berarti tabel sudah setup dengan benar

---

## 🐛 Troubleshooting

### Error: "Can't reach database server"

**Penyebab:** `DATABASE_URL` salah atau database tidak accessible

**Solusi:**
1. Pastikan `DATABASE_URL` di Vercel sudah benar
2. Pastikan database server sudah running
3. Cek firewall/network settings

### Error: "Type already exists"

**Penyebab:** Enum `DayOfWeek` sudah ada

**Solusi:**
- Script SQL sudah handle ini dengan `DO $$ BEGIN ... EXCEPTION ... END $$;`
- Jika masih error, hapus dulu enum yang lama:
  ```sql
  DROP TYPE IF EXISTS "DayOfWeek" CASCADE;
  ```
  Lalu jalankan script lagi

### Error: "Table already exists"

**Penyebab:** Tabel `weekly_schedules` sudah ada

**Solusi:**
- Script SQL sudah handle ini dengan `CREATE TABLE IF NOT EXISTS`
- Jika masih error, hapus dulu tabel yang lama:
  ```sql
  DROP TABLE IF EXISTS "weekly_schedules" CASCADE;
  ```
  Lalu jalankan script lagi

---

## 📝 Catatan

- Pastikan sudah menjalankan migration sebelum menggunakan fitur jadwal mingguan
- Tabel ini hanya bisa diakses oleh ketua untuk mengatur jadwal kelas mereka
- User biasa hanya bisa melihat jadwal (read-only)


