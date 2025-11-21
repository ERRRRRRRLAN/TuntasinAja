# Panduan Deployment ke Vercel

## Environment Variables yang Harus Di-Set di Vercel

**PENTING:** Semua environment variables harus di-set di Vercel Dashboard → Project Settings → Environment Variables

### 1. DATABASE_URL
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public
```
**Untuk Supabase:**
- Gunakan **Session Pooler** (port 6543), BUKAN direct connection (port 5432)
- Format: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public`
- Ganti `[PROJECT-REF]` dengan project reference dari Supabase
- Ganti `[PASSWORD]` dengan password database Anda
- Ganti `[REGION]` dengan region (misalnya: ap-southeast-1)

**Cara mendapatkan connection string:**
1. Buka Supabase Dashboard → Project Settings → Database
2. Scroll ke "Connection Pooling"
3. Pilih "Session mode"
4. Copy connection string
5. Ganti `[YOUR-PASSWORD]` dengan password database Anda

### 2. NEXTAUTH_SECRET
Generate random string (minimal 32 karakter):
```bash
openssl rand -base64 32
```
Atau gunakan online generator: https://generate-secret.vercel.app/32

**PENTING:** Secret ini HARUS sama untuk semua environment (Production, Preview, Development)

### 3. NEXTAUTH_URL
URL production Anda:
```
https://your-project-name.vercel.app
```
Atau jika sudah punya custom domain:
```
https://yourdomain.com
```

**PENTING:** 
- Jangan gunakan `localhost` untuk production
- Pastikan URL sesuai dengan domain Vercel Anda
- Jika menggunakan custom domain, gunakan custom domain tersebut

## Langkah Deployment

1. **Commit dan Push ke GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push
   ```

2. **Connect Repository ke Vercel**
   - Buka https://vercel.com
   - Import project dari GitHub
   - Vercel akan otomatis detect Next.js

3. **Set Environment Variables**
   - Di Vercel Dashboard → Project Settings → Environment Variables
   - Tambahkan semua environment variables di atas
   - Pastikan dipilih untuk **Production**, **Preview**, dan **Development**

4. **Deploy**
   - Vercel akan otomatis deploy setelah push
   - Atau klik "Redeploy" di dashboard

## Troubleshooting

### Error 404: Page Not Found
- Pastikan semua environment variables sudah di-set
- Cek build logs di Vercel untuk error
- Pastikan `DATABASE_URL` menggunakan connection pooler (port 6543 untuk Supabase)

### Database Connection Error
- Pastikan `DATABASE_URL` benar
- Untuk Supabase, gunakan **Session Pooler** (port 6543)
- Format: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true`

### Build Error
- Cek build logs di Vercel
- Pastikan semua dependencies terinstall
- Pastikan TypeScript compilation berhasil

### API Routes Not Found
- Pastikan file `pages/api/trpc/[trpc].ts` ada
- Pastikan file `pages/api/auth/[...nextauth].ts` ada
- Cek function logs di Vercel untuk runtime errors

## Catatan Penting

- Vercel menggunakan serverless functions untuk API routes
- Pastikan Prisma Client di-generate dengan benar (sudah ada di `postinstall` script)
- Database harus accessible dari internet (bukan localhost)
- Gunakan connection pooler untuk database (Supabase, Neon, dll)

