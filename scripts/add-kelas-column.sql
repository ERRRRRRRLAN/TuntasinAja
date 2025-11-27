-- Migration: Add kelas column to users table
-- Description: Menambahkan kolom kelas untuk fitur filtering berdasarkan kelas
-- Date: 2024

-- Add kelas column to users table (nullable for backward compatibility)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS kelas VARCHAR(50) NULL;

-- Add comment to column
COMMENT ON COLUMN users.kelas IS 'Kelas siswa (format: X RPL 1, XI TKJ 2, dll). NULL untuk admin atau user tanpa kelas.';

-- Create index for faster filtering by kelas
CREATE INDEX IF NOT EXISTS idx_users_kelas ON users(kelas) WHERE kelas IS NOT NULL;

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name = 'kelas';

