# Debug Session Issues

## Masalah: UNAUTHORIZED Error di Production

Jika masih mendapatkan error UNAUTHORIZED setelah deploy, ikuti langkah-langkah berikut:

### 1. Cek Environment Variables di Vercel

Pastikan semua environment variables sudah di-set dengan benar:

- **NEXTAUTH_SECRET**: Minimal 32 karakter, harus sama untuk semua environment
- **NEXTAUTH_URL**: Harus sesuai dengan URL Vercel (misalnya: `https://tuntasin-aja.vercel.app`)
- **DATABASE_URL**: Connection string yang benar

### 2. Cek Function Logs di Vercel

1. Buka Vercel Dashboard → Deployments → [latest deployment]
2. Klik "Functions" tab
3. Cari function `/api/trpc/[trpc]`
4. Cek logs untuk error messages

Jika ada error seperti:
- "Error getting session in tRPC context" → Session tidak bisa di-baca
- "No session cookie found" → Cookie tidak ter-set atau tidak ter-send

### 3. Cek Cookies di Browser

1. Buka DevTools → Application → Cookies
2. Cari cookie dengan nama:
   - Development: `next-auth.session-token`
   - Production: `__Secure-next-auth.session-token`
3. Pastikan cookie ada dan memiliki:
   - `Secure` flag (untuk HTTPS)
   - `HttpOnly` flag
   - `SameSite=Lax`

### 4. Test Login Flow

1. Clear semua cookies dan cache
2. Login ulang
3. Setelah login, cek apakah cookie ter-set
4. Coba akses protected route

### 5. Cek Network Tab

1. Buka DevTools → Network
2. Filter untuk `/api/trpc`
3. Cek request headers:
   - Harus ada `Cookie` header
   - Harus berisi session token cookie
4. Cek response:
   - Jika 401, berarti session tidak ter-deteksi
   - Cek response body untuk error message

### 6. Common Issues

#### Issue: Cookie tidak ter-set setelah login
**Penyebab:**
- `NEXTAUTH_URL` tidak sesuai
- Cookie blocked oleh browser
- `secure` flag tidak sesuai dengan protocol (HTTP vs HTTPS)

**Solusi:**
- Pastikan `NEXTAUTH_URL` sesuai dengan domain Vercel
- Pastikan menggunakan HTTPS (Vercel otomatis HTTPS)
- Clear cookies dan login ulang

#### Issue: Cookie tidak ter-send dengan request
**Penyebab:**
- `credentials: 'include'` tidak di-set di fetch
- Cookie domain tidak sesuai
- CORS issue

**Solusi:**
- Sudah di-set di `lib/trpc.ts` dengan `credentials: 'include'`
- Pastikan cookie domain sesuai (biasanya otomatis)

#### Issue: Session tidak ter-baca di server
**Penyebab:**
- `NEXTAUTH_SECRET` tidak sesuai
- Cookie name tidak sesuai
- `getToken` tidak bisa membaca cookie

**Solusi:**
- Pastikan `NEXTAUTH_SECRET` sama untuk semua environment
- Biarkan NextAuth handle cookie name secara otomatis
- Cek function logs untuk error details

### 7. Temporary Debug Logging

Untuk debugging, tambahkan logging di `server/trpc/trpc.ts`:

```typescript
console.log('Request cookies:', req.headers.cookie)
console.log('NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET)
console.log('Token result:', token)
```

**PENTING:** Hapus logging ini setelah debugging selesai untuk security.

### 8. Test di Local dengan Production Config

1. Set environment variables di `.env.local` sama dengan production
2. Test di local dengan `npm run dev`
3. Jika bekerja di local tapi tidak di production, kemungkinan masalah environment variables

### 9. Redeploy

Setelah mengubah environment variables atau kode:
1. Commit dan push perubahan
2. Redeploy di Vercel
3. Clear cookies dan test ulang

### 10. Contact Support

Jika semua langkah di atas sudah dilakukan tapi masih error:
1. Kumpulkan function logs dari Vercel
2. Kumpulkan network requests dari browser DevTools
3. Kumpulkan cookie information dari browser
4. Buat issue dengan informasi tersebut

