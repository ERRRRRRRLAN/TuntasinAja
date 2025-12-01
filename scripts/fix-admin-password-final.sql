-- ========================================
-- FIX ADMIN PASSWORD - SQL SCRIPT FINAL
-- ========================================
-- 
-- Script ini akan:
-- 1. Update password hash admin dengan hash baru yang valid
-- 2. Ensure is_admin = true
-- 3. Normalize email ke lowercase
-- 
-- Usage:
--   1. Buka Supabase Dashboard → SQL Editor
--   2. Copy dan paste script ini
--   3. Jalankan (Run)
-- 
-- Hash ini di-generate untuk password: 210609190210
-- Hash di-generate pada: 2025-01-27
-- ========================================

-- Update admin user dengan password hash baru
UPDATE users 
SET 
  email = 'admin@tuntasinaja.com',  -- Ensure lowercase
  password_hash = '$2a$10$7Ffu6QEn.K2OGBNBcxb8H.ap75vmqjt0A/BCouIV9y9PMmS6IDUpi',
  is_admin = true,
  updated_at = NOW()
WHERE LOWER(email) = 'admin@tuntasinaja.com';

-- Jika admin user belum ada, buat baru
INSERT INTO users (id, name, email, password_hash, is_admin, created_at, updated_at)
SELECT 
  'admin_' || gen_random_uuid()::text,
  'Admin',
  'admin@tuntasinaja.com',
  '$2a$10$7Ffu6QEn.K2OGBNBcxb8H.ap75vmqjt0A/BCouIV9y9PMmS6IDUpi',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE LOWER(email) = 'admin@tuntasinaja.com'
);

-- Verifikasi admin user
SELECT 
  id, 
  name, 
  email, 
  is_admin,
  CASE 
    WHEN password_hash = '$2a$10$7Ffu6QEn.K2OGBNBcxb8H.ap75vmqjt0A/BCouIV9y9PMmS6IDUpi' THEN '✅ Hash matches'
    ELSE '⚠️ Hash berbeda - perlu update ulang'
  END as password_hash_status,
  substring(password_hash, 1, 29) as hash_prefix,
  length(password_hash) as hash_length,
  created_at,
  updated_at
FROM users 
WHERE LOWER(email) = 'admin@tuntasinaja.com';

-- ========================================
-- LOGIN CREDENTIALS:
-- Email: admin@tuntasinaja.com
-- Password: 210609190210
-- ========================================

