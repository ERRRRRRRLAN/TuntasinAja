# ⚠️ URGENT: Fix Database Error untuk Fitur Danton

**Error:** `The column users.is_danton does not exist in the current database.`

**Penyebab:** Database belum di-migrate untuk fitur danton.

---

## 🚀 SOLUSI CEPAT: Jalankan SQL Migration

### Langkah-langkah:

1. **Buka Supabase Dashboard:**
   - Login ke https://supabase.com
   - Pilih project Anda (yang digunakan untuk testing/production)
   - Klik **SQL Editor** di sidebar kiri

2. **Jalankan SQL Migration:**
   - Copy semua SQL di bawah ini
   - Paste ke SQL Editor
   - Klik **Run** atau tekan `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

```sql
-- Migration untuk fitur Danton (Ketua Kelas)
-- Tambah kolom is_danton di tabel users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_danton BOOLEAN DEFAULT false;

-- Buat enum type untuk permission (jika belum ada)
DO $$ BEGIN
    CREATE TYPE "PermissionType" AS ENUM ('only_read', 'read_and_post_edit');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Buat tabel user_permissions
CREATE TABLE IF NOT EXISTS user_permissions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT UNIQUE NOT NULL,
    permission "PermissionType" NOT NULL DEFAULT 'read_and_post_edit',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_user_permission_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- Buat index untuk performa
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_users_is_danton ON users(is_danton);
CREATE INDEX IF NOT EXISTS idx_users_kelas ON users(kelas);
```

3. **Verifikasi:**
   - Cek apakah kolom sudah ditambahkan:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'users' AND column_name = 'is_danton';
   ```
   
   - Cek apakah tabel sudah dibuat:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_name = 'user_permissions';
   ```

4. **Selesai!** Login sekarang seharusnya sudah bisa.

---

## 🔧 Opsi 2: Menggunakan Prisma DB Push

Jika Anda punya akses ke DATABASE_URL dari Vercel:

1. **Set DATABASE_URL di terminal:**
   ```powershell
   # Windows PowerShell
   $env:DATABASE_URL="postgresql://[YOUR_DATABASE_URL_DARI_VERCEL]"
   ```

2. **Push schema ke database:**
   ```bash
   npx prisma db push
   ```

3. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

---

## ✅ Setelah Migration Selesai

1. **Restart aplikasi di Vercel** (redeploy atau restart function)
2. **Coba login lagi** - error seharusnya sudah hilang
3. **Test fitur danton** - pastikan semua fitur bekerja dengan baik

---

## 🐛 Jika Masih Error

**Error: "column already exists"**
- Tidak apa-apa, berarti kolom sudah ada
- Lanjut ke langkah berikutnya

**Error: "type already exists"**
- Tidak apa-apa, berarti enum type sudah ada
- Lanjut ke langkah berikutnya

**Error: "table already exists"**
- Tidak apa-apa, berarti tabel sudah ada
- Migration sudah berjalan sebelumnya

---

**File migration SQL lengkap:** `scripts/migrate-danton-schema.sql`

