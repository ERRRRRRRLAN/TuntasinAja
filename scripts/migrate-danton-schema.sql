-- Migration untuk fitur ketua (Ketua Kelas)
-- Tambah kolom is_ketua di tabel users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_ketua BOOLEAN DEFAULT false;

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
CREATE INDEX IF NOT EXISTS idx_users_is_ketua ON users(is_ketua);
CREATE INDEX IF NOT EXISTS idx_users_kelas ON users(kelas);

-- Set default permission untuk user yang sudah ada (read_and_post_edit)
-- Permission akan dibuat otomatis saat pertama kali diakses atau bisa dibuat manual
