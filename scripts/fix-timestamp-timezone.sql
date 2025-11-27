-- Script untuk memperbaiki timezone dan timestamp di database
-- Jalankan script ini di Supabase SQL Editor

-- 1. Set timezone database ke Asia/Jakarta (WIB) atau UTC
-- Pilih salah satu sesuai kebutuhan:

-- Opsi A: Set ke Asia/Jakarta (WIB) - UTC+7
SET timezone = 'Asia/Jakarta';

-- Opsi B: Set ke UTC (disarankan untuk production)
-- SET timezone = 'UTC';

-- 2. Periksa timezone saat ini
SHOW timezone;

-- 3. Periksa waktu server saat ini
SELECT NOW() as server_time, 
       CURRENT_TIMESTAMP as current_timestamp,
       timezone('Asia/Jakarta', NOW()) as jakarta_time;

-- 4. Update timestamp yang sudah ada (opsional - hanya jika perlu)
-- HATI-HATI: Script ini akan mengubah semua timestamp yang sudah ada
-- Backup database terlebih dahulu sebelum menjalankan!

-- Update created_at di users (jika perlu)
-- UPDATE users 
-- SET created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta'
-- WHERE created_at IS NOT NULL;

-- Update created_at di threads (jika perlu)
-- UPDATE threads 
-- SET created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta',
--     date = date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta',
--     updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta'
-- WHERE created_at IS NOT NULL;

-- Update created_at di comments (jika perlu)
-- UPDATE comments 
-- SET created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta',
--     updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta'
-- WHERE created_at IS NOT NULL;

-- Update created_at di user_statuses (jika perlu)
-- UPDATE user_statuses 
-- SET created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta',
--     updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta'
-- WHERE created_at IS NOT NULL;

-- Update timestamp di histories (jika perlu)
-- UPDATE histories 
-- SET created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta',
--     tanggal_selesai = tanggal_selesai AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta'
-- WHERE created_at IS NOT NULL;

-- 5. Untuk set timezone secara permanen di database (perlu akses superuser)
-- ALTER DATABASE postgres SET timezone = 'Asia/Jakarta';
-- Atau untuk connection pooler, set di connection string:
-- ?options=-c%20timezone%3DAsia/Jakarta

-- 6. Verifikasi timestamp setelah update
-- SELECT 
--   'users' as table_name,
--   COUNT(*) as total_rows,
--   MIN(created_at) as earliest_timestamp,
--   MAX(created_at) as latest_timestamp
-- FROM users
-- UNION ALL
-- SELECT 
--   'threads' as table_name,
--   COUNT(*) as total_rows,
--   MIN(created_at) as earliest_timestamp,
--   MAX(created_at) as latest_timestamp
-- FROM threads
-- UNION ALL
-- SELECT 
--   'comments' as table_name,
--   COUNT(*) as total_rows,
--   MIN(created_at) as earliest_timestamp,
--   MAX(created_at) as latest_timestamp
-- FROM comments
-- UNION ALL
-- SELECT 
--   'user_statuses' as table_name,
--   COUNT(*) as total_rows,
--   MIN(created_at) as earliest_timestamp,
--   MAX(created_at) as latest_timestamp
-- FROM user_statuses
-- UNION ALL
-- SELECT 
--   'histories' as table_name,
--   COUNT(*) as total_rows,
--   MIN(created_at) as earliest_timestamp,
--   MAX(created_at) as latest_timestamp
-- FROM histories;

