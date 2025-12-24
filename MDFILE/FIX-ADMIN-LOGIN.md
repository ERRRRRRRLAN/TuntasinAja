# 🔧 Fix Admin Login - Password atau Email Salah

Panduan untuk memperbaiki masalah login admin dengan error "Invalid email or password".

## 🚀 Cara Cepat (Pilih Salah Satu)

### Opsi 1: Menggunakan SQL Script (Paling Cepat - Recommended)

1. **Buka Supabase Dashboard → SQL Editor**
   - Login ke https://supabase.com/dashboard
   - Pilih project Anda
   - Buka SQL Editor

2. **Copy dan jalankan script SQL:**
   - Buka file `scripts/fix-admin.sql`
   - Copy seluruh isi script
   - Paste ke SQL Editor di Supabase
   - Klik "Run"

3. **Verifikasi:**
   - Script akan menampilkan hasil admin user
   - Pastikan `is_admin = true`
   - Pastikan `password_hash_status = ✅ Hash matches`

4. **Login dengan:**
   - Email: `admin@tuntasinaja.com`
   - Password: `210609190210`

---

### Opsi 2: Menggunakan Node.js Script (Lokal)

**Jika Anda punya akses ke DATABASE_URL:**

1. **Set DATABASE_URL:**
   ```powershell
   # Copy DATABASE_URL dari Vercel Environment Variables
   $env:DATABASE_URL="postgresql://..."
   ```

2. **Jalankan script:**
   ```bash
   npm run fix:admin
   ```
   
   Atau:
   ```bash
   node scripts/fix-admin.js
   ```

3. **Verifikasi:**
   - Script akan menampilkan status admin user
   - Pastikan password verification = ✅ Valid
   - Pastikan isAdmin = ✅ True

---

## 🔍 Troubleshooting

### Error: "User not found"

**Penyebab:** Admin user belum dibuat di database.

**Solusi:**
1. Jalankan SQL script di Opsi 1 (akan otomatis membuat user jika belum ada)
2. Atau jalankan Node.js script di Opsi 2

---

### Error: "Password mismatch"

**Penyebab:** Password hash di database tidak sesuai.

**Solusi:**
1. SQL script akan otomatis update password hash
2. Atau jalankan Node.js script untuk regenerate hash

---

### Error: "isAdmin column does not exist"

**Penyebab:** Schema database belum update.

**Solusi:**
```sql
-- Jalankan di Supabase SQL Editor:
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
```

Atau:
```bash
npx prisma db push
```

---

### Error: "Cannot connect to database"

**Penyebab:** DATABASE_URL tidak valid atau tidak di-set.

**Solusi:**
1. **Untuk Vercel Production:**
   - DATABASE_URL sudah otomatis di-set di Vercel
   - Pastikan connection string valid

2. **Untuk lokal:**
   - Set DATABASE_URL di environment variable
   - Atau buat file `.env.local`:
     ```
     DATABASE_URL="postgresql://..."
     ```

---

## ✅ Verifikasi Setelah Fix

1. **Login dengan:**
   - Email: `admin@tuntasinaja.com`
   - Password: `210609190210`

2. **Cek di database (opsional):**
   ```sql
   SELECT 
     id, 
     name, 
     email, 
     is_admin,
     password_hash
   FROM users 
   WHERE email = 'admin@tuntasinaja.com';
   ```

3. **Expected Result:**
   - Email: `admin@tuntasinaja.com`
   - is_admin: `true`
   - password_hash: Hash bcrypt yang valid

---

## 📝 Informasi Login

- **Email:** `admin@tuntasinaja.com`
- **Password:** `210609190210`
- **Password Hash (bcrypt):** `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy`

**⚠️ PENTING:** Setelah login berhasil, disarankan untuk mengganti password default!

---

## 🔗 File yang Terkait

- `scripts/fix-admin.sql` - SQL script untuk fix admin
- `scripts/fix-admin.js` - Node.js script untuk fix admin
- `scripts/verify-admin.js` - Script untuk verify admin user
- `scripts/create-admin.sql` - Script untuk membuat admin user

---

## 💡 Tips

1. **Gunakan SQL Script (Opsi 1)** jika Anda tidak punya akses ke lokal environment
2. **Gunakan Node.js Script (Opsi 2)** jika Anda ingin lebih banyak kontrol dan debugging
3. **Selalu verify** setelah fix untuk memastikan admin user benar

---

**Masih ada masalah?** Pastikan:
- ✅ Database connection berfungsi
- ✅ Schema sudah update (kolom `is_admin` ada)
- ✅ Email sama persis: `admin@tuntasinaja.com` (lowercase)
- ✅ Password yang diinput: `210609190210`

