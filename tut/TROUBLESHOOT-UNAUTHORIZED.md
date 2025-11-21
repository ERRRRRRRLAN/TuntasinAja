# Troubleshooting Error UNAUTHORIZED di Production

## Masalah
Error 401 UNAUTHORIZED saat mengakses protected routes seperti `userStatus.getThreadStatuses` dan `userStatus.toggleComment`.

## Langkah-langkah Debugging

### 1. Cek Environment Variables di Vercel

**PENTING:** Pastikan semua environment variables sudah di-set dengan benar:

1. Buka Vercel Dashboard → Project Settings → Environment Variables
2. Pastikan ada 3 variables:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET` (minimal 32 karakter)
   - `NEXTAUTH_URL` (HARUS sesuai dengan URL production Anda)

**NEXTAUTH_URL harus:**
- Format: `https://your-project-name.vercel.app`
- Jangan gunakan `localhost`
- Harus menggunakan `https://`
- Harus sesuai dengan URL yang terlihat di browser address bar

**Contoh:**
Jika URL di browser adalah: `https://tuntasin-pjcpmdmqo-erlans-projects-44d8e70f.vercel.app`
Maka `NEXTAUTH_URL` harus: `https://tuntasin-pjcpmdmqo-erlans-projects-44d8e70f.vercel.app`

### 2. Test Cookie di Browser

1. **Clear semua cookies dan cache browser**
2. **Buka website di browser**
3. **Login dengan akun yang valid**
4. **Buka DevTools → Application → Cookies**
5. **Cek apakah ada cookie:**
   - Development: `next-auth.session-token`
   - Production: `__Secure-next-auth.session-token`

**Jika cookie TIDAK ADA setelah login:**
- Masalah: `NEXTAUTH_URL` tidak sesuai
- Solusi: Set `NEXTAUTH_URL` sesuai dengan URL production, lalu redeploy

**Jika cookie ADA:**
- Cek apakah cookie memiliki:
  - `Secure` flag (untuk HTTPS)
  - `HttpOnly` flag
  - `SameSite=Lax`
  - `Path=/`

### 3. Cek Network Request

1. **Buka DevTools → Network tab**
2. **Filter untuk `/api/trpc`**
3. **Klik salah satu request yang error (401)**
4. **Cek Request Headers:**
   - Harus ada header `Cookie: ...`
   - Harus berisi `next-auth.session-token=...` atau `__Secure-next-auth.session-token=...`

**Jika cookie TIDAK ADA di Request Headers:**
- Masalah: Cookie tidak ter-send dengan request
- Solusi: Sudah ada `credentials: 'include'` di tRPC client, tapi mungkin ada masalah dengan browser

**Jika cookie ADA di Request Headers:**
- Masalah: Cookie tidak ter-baca dengan benar di server
- Solusi: Cek function logs di Vercel

### 4. Cek Function Logs di Vercel

1. **Buka Vercel Dashboard → Deployments → [latest deployment]**
2. **Klik tab "Functions"**
3. **Klik function `/api/trpc/[trpc]`**
4. **Cari log yang dimulai dengan `[tRPC Context]`**

**Log yang harus ada:**
```
[tRPC Context] Cookie check: { hasCookie: true/false, ... }
[tRPC Context] Token result: { hasToken: true/false, hasId: true/false, ... }
```

**Jika `hasCookie: false`:**
- Masalah: Cookie tidak ter-send dengan request
- Solusi: Cek apakah cookie ter-set di browser (langkah 2)

**Jika `hasCookie: true` tapi `hasToken: false`:**
- Masalah: Cookie tidak ter-baca dengan benar atau `NEXTAUTH_SECRET` tidak sesuai
- Solusi: Pastikan `NEXTAUTH_SECRET` sama untuk semua environment

**Jika `hasToken: true` tapi `hasId: false`:**
- Masalah: Token tidak memiliki user ID
- Solusi: Cek JWT callback di NextAuth config

### 5. Test Login Flow

1. **Clear semua cookies dan cache**
2. **Buka website**
3. **Login**
4. **Setelah login, cek:**
   - Apakah redirect ke `/` berhasil?
   - Apakah cookie ter-set?
   - Apakah masih error 401?

**Jika masih error setelah login:**
- Kemungkinan cookie tidak ter-set dengan benar
- Cek `NEXTAUTH_URL` di Vercel

### 6. Common Issues dan Solusi

#### Issue: Cookie tidak ter-set setelah login
**Penyebab:**
- `NEXTAUTH_URL` tidak sesuai dengan URL production
- Cookie blocked oleh browser

**Solusi:**
1. Set `NEXTAUTH_URL` sesuai dengan URL production
2. Redeploy di Vercel
3. Clear cookies dan login ulang

#### Issue: Cookie tidak ter-send dengan request
**Penyebab:**
- Browser memblokir cookie
- CORS issue
- `credentials: 'include'` tidak bekerja

**Solusi:**
1. Cek browser settings (tidak memblokir cookies)
2. Coba di incognito/private mode
3. Coba di browser lain
4. Sudah ada `credentials: 'include'` di tRPC client

#### Issue: Cookie ter-send tapi tidak ter-baca
**Penyebab:**
- `NEXTAUTH_SECRET` tidak sesuai
- Cookie name tidak sesuai
- `getToken` tidak bisa membaca cookie

**Solusi:**
1. Pastikan `NEXTAUTH_SECRET` sama untuk semua environment
2. Cek function logs untuk error details
3. Pastikan cookie name sesuai (production vs development)

### 7. Quick Fix Checklist

- [ ] `NEXTAUTH_URL` di Vercel = URL production (misalnya: `https://tuntasin-pjcpmdmqo-erlans-projects-44d8e70f.vercel.app`)
- [ ] `NEXTAUTH_SECRET` di Vercel = minimal 32 karakter
- [ ] `DATABASE_URL` di Vercel = connection string yang benar
- [ ] Redeploy setelah mengubah environment variables
- [ ] Clear cookies browser setelah redeploy
- [ ] Login ulang setelah clear cookies
- [ ] Cek cookie di DevTools → Application → Cookies
- [ ] Cek cookie di Network → Request Headers
- [ ] Cek function logs di Vercel

### 8. Test Manual

Setelah semua langkah di atas:

1. **Clear cookies dan cache**
2. **Login**
3. **Buka DevTools → Application → Cookies**
4. **Pastikan cookie `__Secure-next-auth.session-token` ada**
5. **Buka DevTools → Network**
6. **Coba centang thread atau comment**
7. **Cek request ke `/api/trpc/userStatus.toggleThread` atau `/api/trpc/userStatus.toggleComment`**
8. **Cek Request Headers → harus ada `Cookie: ...`**
9. **Cek Response → harus 200 OK, bukan 401**

Jika masih error, kirimkan:
- Screenshot dari DevTools → Application → Cookies
- Screenshot dari Network → Request Headers
- Function logs dari Vercel

