# 🔧 Fix Admin Login Issue

Panduan untuk memperbaiki masalah login admin.

## 🔍 Troubleshooting

### Langkah 1: Verify Admin User

Jalankan script untuk cek dan fix admin user:

```bash
# Pastikan DATABASE_URL sudah di-set
$env:DATABASE_URL="postgresql://..."

# Jalankan verify script
npm run verify:admin
```

Script ini akan:
- ✅ Cek apakah admin user ada
- ✅ Test password
- ✅ Update password jika tidak valid
- ✅ Set isAdmin = true jika belum
- ✅ Buat admin user baru jika tidak ada

---

### Langkah 2: Cek Database Schema

Pastikan kolom `is_admin` sudah ada di database:

**Opsi A: Menggunakan Prisma**
```bash
npx prisma db push
```

**Opsi B: Menggunakan SQL (Supabase)**
```sql
-- Cek apakah kolom sudah ada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'is_admin';

-- Jika belum ada, tambahkan:
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
```

---

### Langkah 3: Buat/Update Admin User

**Opsi A: Menggunakan Script (Recommended)**
```bash
npm run verify:admin
```

**Opsi B: Menggunakan SQL (Supabase)**

1. Generate password hash baru dengan Node.js:
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('210609190210', 10).then(hash => console.log(hash))"
```

2. Copy hash yang muncul, lalu jalankan SQL:
```sql
-- Update atau insert admin user
INSERT INTO users (id, name, email, password_hash, is_admin, created_at, updated_at)
VALUES (
  COALESCE((SELECT id FROM users WHERE email = 'admin@tuntasinaja.com'), 'admin_' || gen_random_uuid()::text),
  'Admin',
  'admin@tuntasinaja.com',
  'PASTE_HASH_DISINI',  -- Ganti dengan hash dari step 1
  true,
  COALESCE((SELECT created_at FROM users WHERE email = 'admin@tuntasinaja.com'), NOW()),
  NOW()
)
ON CONFLICT (email) 
DO UPDATE SET 
  is_admin = true,
  password_hash = 'PASTE_HASH_DISINI',  -- Ganti dengan hash dari step 1
  updated_at = NOW();
```

---

### Langkah 4: Test Login

1. **Buka website** (localhost atau production)
2. **Login dengan:**
   - Email: `admin@tuntasinaja.com`
   - Password: `210609190210`

3. **Jika masih error:**
   - Cek browser console untuk error
   - Cek server logs (terminal atau Vercel logs)
   - Pastikan `NEXTAUTH_SECRET` sudah di-set

---

## 🐛 Common Issues

### Issue 1: "Invalid email or password"

**Penyebab:** Password hash tidak sesuai

**Solusi:**
```bash
npm run verify:admin
```

### Issue 2: "Unknown column 'isAdmin'"

**Penyebab:** Kolom `is_admin` belum ada di database

**Solusi:**
```bash
npx prisma db push
```

Atau jalankan SQL:
```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
```

### Issue 3: Admin user tidak ada

**Penyebab:** Admin user belum dibuat

**Solusi:**
```bash
npm run verify:admin
```

### Issue 4: Login berhasil tapi tombol delete tidak muncul

**Penyebab:** `isAdmin` belum di-set ke `true`

**Solusi:**
```sql
UPDATE users 
SET is_admin = true 
WHERE email = 'admin@tuntasinaja.com';
```

Lalu logout dan login lagi.

---

## ✅ Checklist

Setelah fix, pastikan:

- [ ] Admin user ada di database
- [ ] Password hash valid (test dengan `npm run verify:admin`)
- [ ] `is_admin = true` di database
- [ ] Bisa login dengan email dan password
- [ ] Tombol delete muncul setelah login

---

## 🎯 Quick Fix (All-in-One)

Jalankan semua command ini secara berurutan:

```bash
# 1. Update schema
npx prisma db push

# 2. Verify dan fix admin
npm run verify:admin

# 3. Test login di website
```

---

**Masih error?** Cek error message dan kirimkan detail error untuk troubleshooting lebih lanjut.

