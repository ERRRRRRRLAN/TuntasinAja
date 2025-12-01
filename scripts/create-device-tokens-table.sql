-- ========================================
-- CREATE DEVICE TOKENS TABLE
-- ========================================
-- 
-- Script ini akan membuat tabel device_tokens untuk menyimpan
-- FCM device tokens dari user untuk push notification
-- 
-- Usage:
--   1. Buka Supabase Dashboard → SQL Editor
--   2. Copy dan paste script ini
--   3. Jalankan (Run)
-- 
-- ========================================

-- Create device_tokens table
CREATE TABLE IF NOT EXISTS device_tokens (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  device_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_token ON device_tokens(token);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_device_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_device_tokens_updated_at
  BEFORE UPDATE ON device_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_device_tokens_updated_at();

-- ========================================
-- VERIFICATION
-- ========================================
-- 
-- Untuk verifikasi, jalankan query ini:
-- 
-- SELECT 
--   table_name,
--   column_name,
--   data_type,
--   is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'device_tokens'
-- ORDER BY ordinal_position;
-- 
-- ========================================

