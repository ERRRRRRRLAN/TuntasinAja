-- Migration: Add Group Task Feature
-- Description: Menambahkan fitur tugas kelompok dengan field isGroupTask, maxGroupMembers di threads dan tabel group_members

-- 1. Add columns to threads table
ALTER TABLE threads 
ADD COLUMN IF NOT EXISTS is_group_task BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS max_group_members INTEGER;

-- 2. Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  added_by TEXT NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT group_members_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE,
  CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT group_members_added_by_fkey FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT group_members_thread_user_unique UNIQUE (thread_id, user_id)
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_group_members_thread_id ON group_members(thread_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);

-- 4. Add comment for documentation
COMMENT ON COLUMN threads.is_group_task IS 'Apakah thread ini adalah tugas kelompok';
COMMENT ON COLUMN threads.max_group_members IS 'Maksimal anggota per kelompok (termasuk pembuat)';
COMMENT ON TABLE group_members IS 'Tabel untuk menyimpan anggota kelompok tugas';

