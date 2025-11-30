# 🔧 FIX ADMIN PASSWORD - Quick Solution

**Masalah:** Password validation gagal meskipun user ditemukan.

**Solusi Cepat:**

## 🚀 Opsi 1: Menggunakan Node.js Script (Paling Mudah)

**Jalankan script yang akan regenerate password hash baru:**

```powershell
# Set DATABASE_URL dari Vercel Environment Variables
$env:DATABASE_URL="postgresql://..."

# Jalankan script fix password
npm run fix:admin-password
```

Script ini akan:
- ✅ Generate hash baru untuk password "210609190210"
- ✅ Update password hash di database
- ✅ Verify password valid
- ✅ Ensure isAdmin = true

---

## 🔧 Opsi 2: Generate Hash Manual + Update via SQL

Jika tidak bisa run Node.js script:

### Step 1: Generate Hash

Jalankan di terminal lokal (dengan node_modules):
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('210609190210', 10).then(hash => console.log(hash))"
```

**Output contoh:**
```
$2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUV
```

### Step 2: Copy Hash dan Update via SQL

Buka Supabase SQL Editor, jalankan:

```sql
-- GANTI 'PASTE_HASH_DISINI' dengan hash dari Step 1!
UPDATE users 
SET 
  password_hash = 'PASTE_HASH_DISINI',
  is_admin = true,
  updated_at = NOW()
WHERE email = 'admin@tuntasinaja.com';

-- Verifikasi
SELECT 
  id, 
  email, 
  is_admin,
  substring(password_hash, 1, 29) as hash_prefix
FROM users 
WHERE email = 'admin@tuntasinaja.com';
```

---

## ✅ Setelah Fix

Login dengan:
- **Email:** `admin@tuntasinaja.com`
- **Password:** `210609190210`

---

## 📝 Catatan

**Mengapa hash berbeda?**
- Bcrypt menggunakan random salt
- Hash berbeda setiap kali di-generate
- Hash yang benar hanya bisa di-generate dengan bcrypt library
- SQL script tidak bisa generate bcrypt hash

**Solusi terbaik:** Gunakan Node.js script (`npm run fix:admin-password`) yang akan regenerate hash baru yang pasti benar.

