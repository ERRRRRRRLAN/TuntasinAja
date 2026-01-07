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

-- Make thread_id nullable (if not already nullable)
ALTER TABLE histories ALTER COLUMN thread_id DROP NOT NULL;

-- Drop unique constraint on (user_id, thread_id) to allow multiple histories with null thread_id
-- PostgreSQL allows multiple NULL values in unique constraints, but we need to handle this explicitly
-- to ensure history is not deleted when thread is deleted
DO $$ 
BEGIN
  -- Drop the unique constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'histories_user_id_thread_id_key'
  ) THEN
    ALTER TABLE histories DROP CONSTRAINT histories_user_id_thread_id_key;
  END IF;
END $$;

-- Create a partial unique index that allows multiple NULL thread_id values
-- This ensures one history per user per thread (when thread_id is not null)
-- but allows multiple histories with null thread_id for the same user
-- This is important because when thread is deleted, multiple users can have history with null thread_id
DROP INDEX IF EXISTS histories_user_id_thread_id_unique;
CREATE UNIQUE INDEX histories_user_id_thread_id_unique 
ON histories(user_id, thread_id) 
WHERE thread_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN histories.thread_title IS 'Denormalized thread title (stored when thread is deleted)';
COMMENT ON COLUMN histories.thread_author_id IS 'Denormalized thread author ID (stored when thread is deleted)';
COMMENT ON COLUMN histories.thread_author_name IS 'Denormalized thread author name (stored when thread is deleted)';

