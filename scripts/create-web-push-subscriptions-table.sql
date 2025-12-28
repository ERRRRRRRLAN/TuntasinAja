-- ========================================
-- CREATE WEB PUSH SUBSCRIPTIONS TABLE
-- ========================================
-- 
-- Script ini akan membuat tabel web_push_subscriptions untuk menyimpan
-- Web Push API subscriptions dari user untuk push notification di browser/PWA
-- 
-- Usage:
--   1. Buka Supabase Dashboard → SQL Editor
--   2. Copy dan paste script ini
--   3. Jalankan (Run)
-- 
-- ========================================

-- Create web_push_subscriptions table
CREATE TABLE IF NOT EXISTS web_push_subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_web_push_subscriptions_user_id ON web_push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_web_push_subscriptions_endpoint ON web_push_subscriptions(endpoint);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_web_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_web_push_subscriptions_updated_at
  BEFORE UPDATE ON web_push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_web_push_subscriptions_updated_at();

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
-- WHERE table_name = 'web_push_subscriptions'
-- ORDER BY ordinal_position;
-- 
-- Atau cek constraints dan indexes:
-- 
-- SELECT
--   conname AS constraint_name,
--   contype AS constraint_type,
--   pg_get_constraintdef(oid) AS constraint_definition
-- FROM pg_constraint
-- WHERE conrelid = 'web_push_subscriptions'::regclass;
-- 
-- SELECT
--   indexname AS index_name,
--   indexdef AS index_definition
-- FROM pg_indexes
-- WHERE tablename = 'web_push_subscriptions';
-- 
-- ========================================

