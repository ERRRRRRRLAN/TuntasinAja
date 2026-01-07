-- Script SQL untuk membuat user admin langsung di database
-- 
-- Usage:
--   1. Buka Supabase Dashboard → SQL Editor
--   2. Copy dan paste script ini
--   3. Jalankan (Run)
--
-- Atau gunakan psql:
--   psql $DATABASE_URL -f scripts/create-admin.sql

-- Hash password untuk "210609190210" (dihasilkan dengan bcrypt, cost 10)
-- Password: 210609190210
-- Hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

-- Insert admin user (jika belum ada)
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

-- Verifikasi
SELECT id, name, email, is_admin, created_at 
FROM users 
WHERE email = 'admin@tuntasinaja.com';

