# 🔧 Cara Memperbaiki Database Connection Error

## Masalah
Error: `Can't reach database server at aws-1-ap-southeast-1.pooler.supabase.com:5432`

## Solusi

### 1. Periksa File `.env`
Pastikan file `.env` ada di root project dan berisi connection string yang benar.

### 2. Format Connection String Supabase

Ada beberapa jenis connection string di Supabase:

#### A. Direct Connection (Port 5432)
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
```

#### B. Session Pooler (Port 6543) - RECOMMENDED
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

#### C. Transaction Pooler (Port 6543)
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

### 3. Cara Mendapatkan Connection String yang Benar

1. Buka Supabase Dashboard
2. Pilih project Anda
3. Pergi ke **Settings** → **Database**
4. Scroll ke bagian **Connection string**
5. Pilih **Session mode** (bukan Transaction mode)
6. Copy connection string
7. Ganti `[YOUR-PASSWORD]` dengan password database Anda
8. Pastikan menambahkan `?schema=public` di akhir jika belum ada

### 4. Contoh Format yang Benar

```env
DATABASE_URL="postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&schema=public"
```

**PENTING:**
- Ganti `xxxxx` dengan project reference Anda
- Ganti `YOUR_PASSWORD` dengan password database yang benar
- Gunakan port **6543** untuk session pooler (lebih stabil)
- Pastikan tidak ada spasi di connection string
- Jangan gunakan tanda kutip ganda di dalam connection string jika sudah ada di .env

### 5. Setelah Memperbaiki Connection String

1. **Restart development server:**
   ```bash
   # Hentikan server (Ctrl+C)
   npm run dev
   ```

2. **Test connection:**
   ```bash
   npm run db:push
   ```

3. **Jika masih error, coba:**
   - Pastikan password benar (tanpa karakter khusus yang perlu di-encode)
   - Coba gunakan direct connection (port 5432) sebagai alternatif
   - Periksa apakah Supabase project masih aktif

### 6. Troubleshooting

**Jika masih tidak bisa connect:**

1. **Cek apakah project Supabase masih aktif:**
   - Login ke Supabase Dashboard
   - Pastikan project tidak di-pause

2. **Coba connection string langsung (tanpa pooler):**
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?schema=public
   ```

3. **Periksa firewall/network:**
   - Pastikan tidak ada firewall yang memblokir koneksi
   - Coba dari network yang berbeda

4. **Reset password database:**
   - Di Supabase Dashboard → Settings → Database
   - Reset database password
   - Update connection string dengan password baru

### 7. Format .env yang Benar

```env
DATABASE_URL="postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
NODE_ENV="development"
```

**Catatan:** 
- Jangan commit file `.env` ke Git
- Pastikan `.env` ada di root project (sama level dengan `package.json`)

