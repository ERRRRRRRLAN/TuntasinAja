-- Migration: Create feedbacks table
-- Description: Membuat tabel untuk menyimpan saran dan masukan dari user
-- Date: 2025-01-27
-- 
-- Usage:
--   1. Buka Supabase Dashboard → SQL Editor
--   2. Copy dan paste script ini
--   3. Jalankan (Run)

-- Create feedbacks table
CREATE TABLE IF NOT EXISTS feedbacks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Foreign key constraint: user_id references users(id)
  CONSTRAINT fk_feedback_user 
    FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_is_read ON feedbacks(is_read);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(created_at);

-- Add comments for documentation
COMMENT ON TABLE feedbacks IS 'Tabel untuk menyimpan saran dan masukan dari user. Admin dapat melihat semua feedback di admin panel.';
COMMENT ON COLUMN feedbacks.user_id IS 'ID user yang mengirim feedback';
COMMENT ON COLUMN feedbacks.content IS 'Isi saran dan masukan (minimal 10 karakter)';
COMMENT ON COLUMN feedbacks.is_read IS 'Status apakah feedback sudah dibaca admin (default: false)';
COMMENT ON COLUMN feedbacks.created_at IS 'Waktu feedback dibuat';
COMMENT ON COLUMN feedbacks.updated_at IS 'Waktu feedback terakhir diupdate';

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_feedbacks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_feedbacks_updated_at ON feedbacks;
CREATE TRIGGER trigger_update_feedbacks_updated_at
  BEFORE UPDATE ON feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION update_feedbacks_updated_at();

-- Verify the table was created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'feedbacks'
ORDER BY ordinal_position;

-- Verify indexes were created
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'feedbacks'
ORDER BY indexname;

