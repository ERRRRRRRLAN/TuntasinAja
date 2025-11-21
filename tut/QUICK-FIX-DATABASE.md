# ⚡ Quick Fix: Setup Database Production

**Masalah:** Error "The table `public.users` does not exist"

**Solusi:** Push Prisma schema ke database production

---

## 🚀 Cara Cepat (Pilih Salah Satu)

### Opsi A: Menggunakan DATABASE_URL Langsung (Paling Cepat)

1. **Copy DATABASE_URL dari Vercel:**
   - Buka: https://vercel.com/dashboard
   - Pilih project Anda
   - Settings → Environment Variables
   - Copy value dari `DATABASE_URL`

2. **Set environment variable di PowerShell:**
   ```powershell
   $env:DATABASE_URL="PASTE_DATABASE_URL_DARI_VERCEL_DISINI"
   ```
   
   **Contoh:**
   ```powershell
   $env:DATABASE_URL="postgresql://postgres.ahjoimrrzvftqidlnfwo:erlan210609@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public"
   ```

3. **Push schema ke database:**
   ```bash
   npx prisma db push
   ```

4. **Selesai!** Coba register lagi di website.

---

### Opsi B: Install Vercel CLI (Lebih Aman)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login:**
   ```bash
   vercel login
   ```

3. **Link project:**
   ```bash
   vercel link
   ```

4. **Pull environment variables:**
   ```bash
   vercel env pull .env.local
   ```

5. **Push schema:**
   ```bash
   npx prisma db push
   ```

---

## ✅ Verifikasi

Setelah `prisma db push` berhasil, coba:
1. Buka website production
2. Register akun baru
3. Jika berhasil, berarti sudah fix! 🎉

---

**Butuh bantuan lebih detail?** Baca `SETUP-DATABASE-PRODUCTION.md`

