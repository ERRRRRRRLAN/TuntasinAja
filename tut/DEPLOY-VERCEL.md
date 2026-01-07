# 🚀 Panduan Deployment ke Vercel - Step by Step

Panduan lengkap untuk deploy website TuntasinAja ke Vercel dengan mudah.

## 📋 Prasyarat

Sebelum mulai, pastikan Anda sudah memiliki:
- ✅ Akun GitHub (gratis)
- ✅ Akun Vercel (gratis, bisa login dengan GitHub)
- ✅ Database PostgreSQL (Supabase, Neon, atau provider lain)
- ✅ Kode sudah di-push ke GitHub repository

---

## 🔧 Langkah 1: Persiapan Database

### Jika menggunakan Supabase:

1. **Buka Supabase Dashboard** → Pilih project Anda
2. **Settings** → **Database**
3. Scroll ke bagian **Connection Pooling**
4. Pilih **Session mode** (penting!)
5. Copy connection string yang muncul
6. Format akan seperti ini:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
7. **Ganti `[PASSWORD]`** dengan password database Anda
8. **Tambahkan `&schema=public`** di akhir, jadi menjadi:
   ```
   postgresql://postgres.ahjoimrrzvftqidlnfwo:erlan210609@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public
   ```

**⚠️ PENTING:** 
- Gunakan **Session Pooler** (port 6543), BUKAN direct connection (port 5432)
- Connection pooling wajib untuk Vercel karena menggunakan serverless functions

### Jika menggunakan provider lain (Neon, Railway, dll):
- Pastikan menggunakan connection pooling jika tersedia
- Atau gunakan direct connection string dengan format PostgreSQL standar

---

## 🔑 Langkah 2: Generate NEXTAUTH_SECRET

Anda perlu secret key untuk NextAuth. Pilih salah satu cara:

### Cara 1: Menggunakan PowerShell (Windows)
```powershell
# Buka PowerShell dan jalankan:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Cara 2: Menggunakan Online Generator
1. Buka: https://generate-secret.vercel.app/32
2. Copy hasil yang muncul

### Cara 3: Menggunakan Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Simpan secret ini** - Anda akan membutuhkannya di langkah berikutnya.

---

## 📦 Langkah 3: Push Kode ke GitHub

Pastikan semua kode sudah di-push ke GitHub:

```bash
# Jika belum ada repository GitHub:
git init
git add .
git commit -m "Initial commit - ready for Vercel deployment"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO-NAME.git
git push -u origin main

# Jika sudah ada repository:
git add .
git commit -m "Prepare for Vercel deployment"
git push
```

**Pastikan file `.env` TIDAK di-commit** (sudah ada di `.gitignore`).

---

## 🌐 Langkah 4: Deploy ke Vercel

### 4.1. Import Project ke Vercel

1. **Buka https://vercel.com**
2. **Login** dengan akun GitHub Anda
3. Klik **"Add New..."** → **"Project"**
4. **Import** repository GitHub Anda
5. Vercel akan otomatis detect Next.js

### 4.2. Konfigurasi Project

Di halaman import project, Anda akan melihat:

- **Project Name**: Bisa diubah sesuai keinginan (misal: `tuntasinaja`)
- **Framework Preset**: Next.js (otomatis terdeteksi)
- **Root Directory**: `./` (biarkan default)
- **Build Command**: `npm run build` (otomatis)
- **Output Directory**: `.next` (otomatis)
- **Install Command**: `npm install` (otomatis)

**Biarkan semua default**, lalu scroll ke bawah.

### 4.3. Set Environment Variables

**PENTING:** Set environment variables SEBELUM deploy pertama kali!

Klik **"Environment Variables"** dan tambahkan 3 variables berikut:

#### Variable 1: `DATABASE_URL`
- **Key**: `DATABASE_URL`
- **Value**: Connection string dari Langkah 1
- **Environment**: ✅ Production, ✅ Preview, ✅ Development

Contoh:
```
postgresql://postgres.abcdefgh:password123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public
```

#### Variable 2: `NEXTAUTH_SECRET`
- **Key**: `NEXTAUTH_SECRET`
- **Value**: Secret yang di-generate di Langkah 2
- **Environment**: ✅ Production, ✅ Preview, ✅ Development

**⚠️ PENTING:** Secret ini HARUS sama untuk semua environment!

#### Variable 3: `NEXTAUTH_URL`
- **Key**: `NEXTAUTH_URL`
- **Value**: `https://your-project-name.vercel.app` (akan muncul setelah deploy pertama)
- **Environment**: ✅ Production, ✅ Preview, ✅ Development

**Catatan:** 
- Untuk deploy pertama, gunakan URL yang akan diberikan Vercel (biasanya `https://[project-name].vercel.app`)
- Setelah deploy pertama, Anda bisa update dengan URL yang sebenarnya
- Jika menggunakan custom domain, gunakan custom domain tersebut

### 4.4. Deploy!

1. Setelah semua environment variables di-set, klik **"Deploy"**
2. Tunggu proses build selesai (biasanya 2-5 menit)
3. Setelah selesai, Anda akan mendapat URL seperti: `https://tuntasinaja.vercel.app`

---

## 🔄 Langkah 5: Update NEXTAUTH_URL (Setelah Deploy Pertama)

Setelah deploy pertama selesai:

1. **Copy URL production** dari Vercel (misal: `https://tuntasinaja.vercel.app`)
2. **Buka Vercel Dashboard** → Project Anda → **Settings** → **Environment Variables**
3. **Edit** variable `NEXTAUTH_URL`
4. **Update value** dengan URL production yang benar
5. **Save**
6. **Redeploy** project (klik **Deployments** → **...** → **Redeploy**)

---

## 🗄️ Langkah 6: Setup Database Schema

Setelah deploy pertama, Anda perlu menjalankan Prisma migration untuk membuat tabel di database:

### Opsi 1: Menggunakan Prisma Studio (Lokal)
```bash
# Di komputer lokal Anda, pastikan .env sudah di-set dengan DATABASE_URL production
npx prisma db push
```

### Opsi 2: Menggunakan Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login ke Vercel
vercel login

# Link ke project
vercel link

# Pull environment variables
vercel env pull .env.local

# Push schema ke database
npx prisma db push
```

### Opsi 3: Menggunakan Supabase SQL Editor
1. Buka Supabase Dashboard → SQL Editor
2. Jalankan migration SQL yang di-generate Prisma
3. Atau gunakan Prisma Studio untuk generate migration

---

## ✅ Langkah 7: Testing

Setelah semua setup selesai, test website Anda:

1. **Buka URL production** (misal: `https://tuntasinaja.vercel.app`)
2. **Test Register/Login**
   - Buat akun baru atau login
   - Pastikan tidak ada error
3. **Test Fitur Utama**
   - ✅ Buat thread baru
   - ✅ Centang thread (mark as complete)
   - ✅ Tambah komentar
   - ✅ Lihat history
   - ✅ Lihat profile

### Checklist Testing:
- [ ] Website bisa diakses
- [ ] Register berfungsi
- [ ] Login berfungsi
- [ ] Session ter-set (cek cookies di DevTools)
- [ ] Bisa membuat thread
- [ ] Bisa centang thread
- [ ] Bisa menambah komentar
- [ ] History page berfungsi
- [ ] Profile page berfungsi

---

## 🐛 Troubleshooting

### Error: "Failed to fetch" atau "CLIENT_FETCH_ERROR"

**Penyebab:** `NEXTAUTH_URL` tidak sesuai dengan URL production

**Solusi:**
1. Pastikan `NEXTAUTH_URL` di Vercel sesuai dengan URL production
2. Pastikan menggunakan `https://` (bukan `http://`)
3. Clear browser cache dan cookies
4. Redeploy project

### Error: "Unauthorized" saat membuat thread

**Penyebab:** Session tidak ter-deteksi

**Solusi:**
1. Pastikan sudah login dengan benar
2. Cek cookies di DevTools → Application → Cookies
   - Harus ada: `__Secure-next-auth.session-token` (production)
   - Atau: `next-auth.session-token` (development)
3. Pastikan `NEXTAUTH_SECRET` sama untuk semua environment
4. Redeploy setelah mengubah environment variables

### Error: Database connection error

**Penyebab:** `DATABASE_URL` salah atau tidak menggunakan connection pooler

**Solusi:**
1. Pastikan menggunakan **Session Pooler** untuk Supabase (port 6543)
2. Pastikan format connection string benar
3. Test connection string di lokal terlebih dahulu
4. Pastikan database accessible dari internet

### Error: Build failed

**Penyebab:** Ada error di kode atau dependencies

**Solusi:**
1. Cek build logs di Vercel Dashboard → Deployments → [latest] → Build Logs
2. Pastikan semua dependencies terinstall
3. Pastikan TypeScript compilation berhasil
4. Test build lokal: `npm run build`

### Error: Prisma Client not generated

**Penyebab:** Prisma Client belum di-generate

**Solusi:**
- Sudah ada di `postinstall` script di `package.json`
- Vercel akan otomatis run `npm install` yang akan trigger `postinstall`
- Jika masih error, pastikan `postinstall` script ada di `package.json`

---

## 📝 Catatan Penting

1. **Environment Variables:**
   - Set di Vercel Dashboard → Settings → Environment Variables
   - Set untuk Production, Preview, dan Development
   - Redeploy setelah mengubah environment variables

2. **Database:**
   - Wajib menggunakan connection pooling untuk Supabase
   - Direct connection (port 5432) tidak akan bekerja di Vercel
   - Gunakan Session Pooler (port 6543)

3. **NEXTAUTH_SECRET:**
   - Harus minimal 32 karakter
   - Harus sama untuk semua environment
   - Jangan commit ke GitHub

4. **NEXTAUTH_URL:**
   - Harus sesuai dengan URL production
   - Gunakan `https://` (bukan `http://`)
   - Update setelah deploy pertama

5. **Redeploy:**
   - Setelah mengubah environment variables, **wajib redeploy**
   - Environment variables tidak otomatis ter-update tanpa redeploy

---

## 🎉 Selesai!

Jika semua langkah sudah dilakukan dan testing berhasil, website Anda sudah live di Vercel! 🚀

**URL Production:** `https://your-project-name.vercel.app`

---

## 📚 Referensi

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)

---

**Butuh bantuan?** Cek file `FIX-VERCEL-ISSUES.md` dan `TROUBLESHOOT-UNAUTHORIZED.md` untuk troubleshooting lebih detail.

