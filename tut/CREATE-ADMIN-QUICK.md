# ⚡ Quick Setup Admin User

## 🚀 Langkah Cepat (3 Langkah)

### 1. Update Database Schema

**Opsi A: Menggunakan Prisma (Lokal)**
```bash
npx prisma db push
```

**Opsi B: Menggunakan SQL (Supabase)**
```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
```

### 2. Buat Admin User

**Opsi A: Menggunakan Script**
```bash
# Set DATABASE_URL dulu
$env:DATABASE_URL="postgresql://..."

# Jalankan script
npm run create:admin
```

**Opsi B: Menggunakan SQL (Supabase)**
Buka Supabase SQL Editor, jalankan:

```sql
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

### 3. Login dan Test

- **Email:** `admin@tuntasinaja.com`
- **Password:** `210609190210`

Setelah login, tombol "🗑️ Hapus" harus muncul di thread dan komentar.

---

**Panduan lengkap:** Lihat `SETUP-ADMIN.md`

