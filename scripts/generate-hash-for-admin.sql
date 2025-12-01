-- Script untuk generate bcrypt hash untuk admin password
-- 
-- CATATAN PENTING:
-- Bcrypt hash tidak bisa di-generate di SQL karena memerlukan library bcrypt.
-- Hash harus di-generate menggunakan Node.js script.
--
-- Gunakan script ini untuk mendapatkan hash yang benar:
--
-- Opsi 1: Menggunakan Node.js script (RECOMMENDED)
--   node scripts/fix-admin-password.js
--
-- Opsi 2: Generate hash manual dan update via SQL
--   1. Jalankan di terminal:
--      node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('210609190210', 10).then(hash => console.log('Hash:', hash))"
--
--   2. Copy hash yang muncul, lalu jalankan SQL di bawah ini (ganti PASTE_HASH_DISINI dengan hash dari step 1):

-- Update admin password dengan hash baru
-- GANTI 'PASTE_HASH_DISINI' dengan hash dari Node.js script di atas!
UPDATE users 
SET 
  password_hash = 'PASTE_HASH_DISINI',  -- GANTI INI dengan hash dari Node.js
  is_admin = true,
  updated_at = NOW()
WHERE email = 'admin@tuntasinaja.com';

-- Verifikasi
SELECT 
  id, 
  name, 
  email, 
  is_admin,
  password_hash,
  substring(password_hash, 1, 29) as hash_prefix,
  length(password_hash) as hash_length,
  created_at 
FROM users 
WHERE email = 'admin@tuntasinaja.com';

