# Fix Issues di Vercel

## Masalah yang Ditemukan

1. **CLIENT_FETCH_ERROR dari NextAuth**
2. **ERR_INTERNET_DISCONNECTED** (false positive)
3. **Unauthorized error** saat membuat thread

## Solusi yang Sudah Diterapkan

### 1. NextAuth Configuration
- ✅ Menambahkan cookie configuration untuk production
- ✅ Menambahkan `secure: true` untuk production
- ✅ Menambahkan error handling yang lebih baik
- ✅ Menambahkan debug mode untuk development

### 2. SessionProvider Configuration
- ✅ Menambahkan `refetchInterval` dan `refetchOnWindowFocus`
- ✅ Menambahkan retry logic untuk queries

### 3. Database Connection
- ✅ Memastikan menggunakan connection pooler (Supabase Session Pooler)
- ✅ Error handling untuk Prisma connection

## Checklist Environment Variables di Vercel

Pastikan semua environment variables sudah di-set dengan benar:

### ✅ DATABASE_URL
Format untuk Supabase:
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public
```

**PENTING:**
- Gunakan **Session Pooler** (port 6543), BUKAN direct connection
- Tambahkan `?pgbouncer=true` di akhir URL
- Ganti `[PROJECT-REF]`, `[PASSWORD]`, dan `[REGION]` dengan nilai yang benar

### ✅ NEXTAUTH_SECRET
Generate dengan:
```bash
openssl rand -base64 32
```

**PENTING:**
- Harus minimal 32 karakter
- Harus sama untuk semua environment (Production, Preview, Development)

### ✅ NEXTAUTH_URL
URL production Anda:
```
https://your-project-name.vercel.app
```

**PENTING:**
- Jangan gunakan `localhost`
- Pastikan sesuai dengan domain Vercel Anda
- Jika menggunakan custom domain, gunakan custom domain tersebut

## Langkah Troubleshooting

### 1. Cek Environment Variables
- Buka Vercel Dashboard → Project Settings → Environment Variables
- Pastikan semua 3 variables sudah di-set
- Pastikan dipilih untuk **Production**, **Preview**, dan **Development**

### 2. Cek Build Logs
- Buka Vercel Dashboard → Deployments → [latest deployment] → Build Logs
- Cari error terkait database atau NextAuth

### 3. Cek Function Logs
- Buka Vercel Dashboard → Deployments → [latest deployment] → Function Logs
- Cari error runtime terkait database connection atau authentication

### 4. Test Database Connection
- Pastikan database accessible dari internet
- Test connection string di local dengan environment variable yang sama
- Pastikan menggunakan connection pooler untuk Supabase

### 5. Clear Browser Cache
- Clear cookies dan cache browser
- Coba di incognito/private mode
- Coba di browser lain

### 6. Redeploy
- Setelah mengubah environment variables, **Redeploy** project
- Environment variables tidak otomatis ter-update tanpa redeploy

## Common Issues

### Issue: "Failed to fetch" atau "CLIENT_FETCH_ERROR"
**Penyebab:**
- `NEXTAUTH_URL` tidak sesuai dengan URL production
- Cookie tidak bisa di-set karena `secure` flag

**Solusi:**
- Pastikan `NEXTAUTH_URL` sesuai dengan domain Vercel
- Pastikan menggunakan HTTPS (Vercel otomatis HTTPS)
- Clear browser cache dan cookies

### Issue: "Unauthorized" saat membuat thread
**Penyebab:**
- Session tidak ter-deteksi oleh tRPC
- Cookie tidak ter-set dengan benar
- `NEXTAUTH_SECRET` tidak sesuai

**Solusi:**
- Pastikan sudah login dengan benar
- Cek apakah session ter-set di browser (DevTools → Application → Cookies)
- Pastikan `NEXTAUTH_SECRET` sama untuk semua environment
- Redeploy setelah mengubah environment variables

### Issue: Database connection error
**Penyebab:**
- `DATABASE_URL` salah
- Tidak menggunakan connection pooler
- Database tidak accessible dari internet

**Solusi:**
- Pastikan menggunakan Supabase Session Pooler (port 6543)
- Pastikan format connection string benar
- Test connection string di local terlebih dahulu

## Testing Checklist

Setelah deploy, test:
- [ ] Bisa login/register
- [ ] Session ter-set dengan benar (cek cookies)
- [ ] Bisa membuat thread
- [ ] Bisa centang thread
- [ ] Bisa menambah komentar
- [ ] History page berfungsi
- [ ] Profile page berfungsi

Jika semua checklist sudah ✅, berarti deployment berhasil!

