-- Script SQL untuk fix admin user - Update password dan ensure isAdmin = true
-- 
-- Usage:
--   1. Buka Supabase Dashboard → SQL Editor
--   2. Copy dan paste script ini
--   3. Jalankan (Run)
--
-- Atau gunakan psql:
--   psql $DATABASE_URL -f scripts/fix-admin.sql

-- Generate password hash baru dengan Node.js terlebih dahulu:
-- node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('210609190210', 10).then(hash => console.log('Hash:', hash))"
--
-- Atau gunakan hash yang sudah diketahui:
-- Hash untuk password "210609190210": $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

-- Pastikan email adalah lowercase (normalize)
-- First, check if admin user exists with different case
DO $$
DECLARE
  existing_user_id TEXT;
BEGIN
  -- Check if user exists (case insensitive)
  SELECT id INTO existing_user_id 
  FROM users 
  WHERE LOWER(email) = 'admin@tuntasinaja.com'
  LIMIT 1;
  
  IF existing_user_id IS NOT NULL THEN
    -- Update existing user (normalize email to lowercase and update password)
    UPDATE users 
    SET 
      email = 'admin@tuntasinaja.com',  -- Ensure lowercase
      password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
      is_admin = true,
      updated_at = NOW()
    WHERE id = existing_user_id;
    
    RAISE NOTICE 'Updated existing admin user: %', existing_user_id;
  ELSE
    -- Create new admin user
    INSERT INTO users (id, name, email, password_hash, is_admin, created_at, updated_at)
    VALUES (
      'admin_' || gen_random_uuid()::text,
      'Admin',
      'admin@tuntasinaja.com',
      '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
      true,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Created new admin user';
  END IF;
END $$;

-- Verifikasi admin user
SELECT 
  id, 
  name, 
  email, 
  is_admin,
  CASE 
    WHEN password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy' THEN '✅ Hash matches'
    ELSE '⚠️ Hash berbeda'
  END as password_hash_status,
  created_at 
FROM users 
WHERE email = 'admin@tuntasinaja.com';

