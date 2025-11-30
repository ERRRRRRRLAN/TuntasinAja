-- Migration: Create class_subjects table
-- Description: Membuat tabel untuk menyimpan daftar mata pelajaran per kelas
-- Date: 2025
-- 
-- Usage:
--   1. Buka Supabase Dashboard → SQL Editor
--   2. Copy dan paste script ini
--   3. Jalankan (Run)

-- Create class_subjects table
CREATE TABLE IF NOT EXISTS class_subjects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  kelas TEXT NOT NULL,
  subject TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: satu kelas tidak boleh punya mata pelajaran yang sama
  CONSTRAINT class_subjects_kelas_subject_unique UNIQUE (kelas, subject)
);

-- Create index on kelas for faster queries
CREATE INDEX IF NOT EXISTS idx_class_subjects_kelas ON class_subjects(kelas);

-- Add comments for documentation
COMMENT ON TABLE class_subjects IS 'Tabel untuk menyimpan daftar mata pelajaran per kelas. Admin dapat menambahkan mata pelajaran untuk setiap kelas, dan user akan melihat mata pelajaran sesuai kelasnya.';
COMMENT ON COLUMN class_subjects.kelas IS 'Nama kelas (format: X RPL 1, XI TKJ 2, dll)';
COMMENT ON COLUMN class_subjects.subject IS 'Nama mata pelajaran';

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_class_subjects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_class_subjects_updated_at ON class_subjects;
CREATE TRIGGER trigger_update_class_subjects_updated_at
  BEFORE UPDATE ON class_subjects
  FOR EACH ROW
  EXECUTE FUNCTION update_class_subjects_updated_at();

-- Verify the table was created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'class_subjects'
ORDER BY ordinal_position;

