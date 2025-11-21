# 👤 Setup Admin User

Panduan untuk membuat akun admin yang bisa menghapus thread dan komentar.

## 📋 Prasyarat

1. Database schema sudah di-update dengan field `isAdmin`
2. Prisma Client sudah di-regenerate

---

## 🔧 Langkah 1: Update Database Schema

Tambahkan field `isAdmin` ke tabel `users` di database:

### Opsi A: Menggunakan Prisma (Recommended)

```bash
# Generate Prisma Client dengan schema baru
npx prisma generate

# Push schema ke database
npx prisma db push
```

### Opsi B: Menggunakan SQL Langsung (Supabase)

Jalankan SQL berikut di Supabase SQL Editor:

```sql
-- Tambahkan kolom is_admin jika belum ada
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Buat index untuk performa (opsional)
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
```

---

## 👤 Langkah 2: Buat Admin User

Ada 2 cara untuk membuat admin user:

### Cara 1: Menggunakan Script Node.js (Recommended)

```bash
# Pastikan DATABASE_URL sudah di-set
# Di PowerShell:
$env:DATABASE_URL="postgresql://..."

# Atau pull dari Vercel:
vercel env pull .env.local

# Jalankan script
npm run create:admin
```

**Output yang diharapkan:**
```
✅ Admin user berhasil dibuat!
   Email: admin@tuntasinaja.com
   Password: 210609190210
   Name: Admin
```

### Cara 2: Menggunakan SQL Langsung

1. Buka Supabase Dashboard → SQL Editor
2. Copy dan paste script dari `scripts/create-admin.sql`
3. Jalankan (Run)

**Atau jalankan SQL berikut:**

```sql
-- Hash password untuk "210609190210"
INSERT INTO users (id, name, email, password_hash, is_admin, created_at, updated_at)
VALUES (
  'admin_' || gen_random_uuid()::text,
  'Admin',
  'admin@tuntasinaja.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) 
DO UPDATE SET 
  is_admin = true,
  password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  updated_at = NOW();
```

---

## ✅ Langkah 3: Verifikasi

1. **Login dengan akun admin:**
   - Email: `admin@tuntasinaja.com`
   - Password: `210609190210`

2. **Cek apakah tombol delete muncul:**
   - Di ThreadCard: harus ada tombol "🗑️ Hapus" di pojok kanan atas
   - Di ThreadQuickView: harus ada tombol "🗑️ Hapus Thread" di header
   - Di setiap komentar: harus ada tombol "🗑️" di pojok kanan atas

3. **Test delete:**
   - Coba hapus thread (harus muncul konfirmasi)
   - Coba hapus komentar (harus muncul konfirmasi)

---

## 🔐 Kredensial Admin

- **Email:** `admin@tuntasinaja.com`
- **Password:** `210609190210`
- **Name:** `Admin`

**⚠️ PENTING:** Ganti password setelah pertama kali login untuk keamanan!

---

## 🐛 Troubleshooting

### Error: "isAdmin does not exist"

**Penyebab:** Prisma Client belum di-regenerate atau schema belum di-push

**Solusi:**
```bash
npx prisma generate
npx prisma db push
```

### Error: "Admin access required"

**Penyebab:** User belum di-set sebagai admin

**Solusi:**
1. Cek di database apakah `is_admin = true` untuk user tersebut
2. Logout dan login lagi
3. Atau update langsung di database:
   ```sql
   UPDATE users SET is_admin = true WHERE email = 'admin@tuntasinaja.com';
   ```

### Tombol delete tidak muncul

**Penyebab:** 
- User belum login sebagai admin
- Query `auth.isAdmin` gagal

**Solusi:**
1. Pastikan sudah login dengan akun admin
2. Cek browser console untuk error
3. Pastikan `isAdmin` query berhasil (cek di Network tab)

---

## 📝 Catatan

1. **Hanya admin yang bisa menghapus** thread dan komentar
2. **Hapusan tidak bisa dibatalkan** - pastikan sebelum menghapus
3. **Admin bisa menghapus** thread/komentar milik siapa saja
4. **User biasa tidak bisa** menghapus thread/komentar

---

## 🎉 Selesai!

Setelah semua langkah selesai, admin user sudah siap digunakan! 🚀

