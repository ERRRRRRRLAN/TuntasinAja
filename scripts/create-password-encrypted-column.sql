-- ========================================
-- ADD PASSWORD_ENCRYPTED COLUMN
-- ========================================
-- 
-- Script ini akan menambahkan kolom password_encrypted ke tabel users
-- untuk menyimpan password dalam format encrypted (bisa di-decrypt)
-- 
-- Usage:
--   1. Buka Supabase Dashboard → SQL Editor
--   2. Copy dan paste script ini
--   3. Jalankan (Run)
-- 
-- ========================================

-- Add password_encrypted column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_encrypted TEXT;

-- Add comment untuk dokumentasi
COMMENT ON COLUMN users.password_encrypted IS 'Encrypted password untuk admin view (AES-256-GCM). Password tetap di-hash dengan bcrypt untuk autentikasi.';

-- ========================================
-- VERIFICATION
-- ========================================
-- 
-- Untuk verifikasi, jalankan query ini:
-- 
-- SELECT 
--   column_name,
--   data_type,
--   is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'users' 
--   AND column_name = 'password_encrypted';
-- 
-- ========================================

