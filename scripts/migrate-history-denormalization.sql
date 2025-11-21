-- Migration: Add denormalization fields to histories table
-- Run this script in your Supabase SQL Editor or PostgreSQL client

-- Add new columns to histories table
ALTER TABLE histories 
ADD COLUMN IF NOT EXISTS thread_title TEXT,
ADD COLUMN IF NOT EXISTS thread_author_id TEXT,
ADD COLUMN IF NOT EXISTS thread_author_name TEXT;

-- Update existing histories with denormalized data from threads
UPDATE histories h
SET 
  thread_title = t.judul_mapel,
  thread_author_id = t.user_id_pembuat,
  thread_author_name = u.name
FROM threads t
JOIN users u ON t.user_id_pembuat = u.id
WHERE h.thread_id = t.id
  AND (h.thread_title IS NULL OR h.thread_author_id IS NULL OR h.thread_author_name IS NULL);

-- Make thread_id nullable (optional, if not already nullable)
-- ALTER TABLE histories ALTER COLUMN thread_id DROP NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN histories.thread_title IS 'Denormalized thread title (stored when thread is deleted)';
COMMENT ON COLUMN histories.thread_author_id IS 'Denormalized thread author ID (stored when thread is deleted)';
COMMENT ON COLUMN histories.thread_author_name IS 'Denormalized thread author name (stored when thread is deleted)';

