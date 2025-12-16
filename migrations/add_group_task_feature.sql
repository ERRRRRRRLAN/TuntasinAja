-- =====================================================
-- Migration: Add Group Task Feature
-- Description: Menambahkan fitur tugas kelompok dengan shared completion
-- Date: 2025-12-15
-- =====================================================

-- =====================================================
-- 1. Tambahkan kolom is_group_task ke tabel threads
-- =====================================================
ALTER TABLE threads 
ADD COLUMN IF NOT EXISTS is_group_task BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN threads.is_group_task IS 'Menandai apakah thread adalah tugas kelompok atau individual';

-- =====================================================
-- 2. Tambahkan kolom group_task_title ke tabel threads
-- =====================================================
ALTER TABLE threads 
ADD COLUMN IF NOT EXISTS group_task_title VARCHAR(255) NULL;

COMMENT ON COLUMN threads.group_task_title IS 'Judul khusus untuk tugas kelompok';

-- =====================================================
-- 3. Buat tabel group_members untuk anggota kelompok
-- =====================================================
CREATE TABLE IF NOT EXISTS group_members (
    id VARCHAR(255) PRIMARY KEY,
    thread_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    added_by VARCHAR(255) NOT NULL,
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_group_members_thread 
        FOREIGN KEY (thread_id) 
        REFERENCES threads(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_group_members_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_group_members_adder 
        FOREIGN KEY (added_by) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    
    -- Unique constraint: satu user hanya bisa menjadi anggota sekali per thread
    CONSTRAINT uk_group_members_thread_user 
        UNIQUE (thread_id, user_id)
);

-- =====================================================
-- 4. Buat index untuk performa query
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_group_members_thread_id 
    ON group_members(thread_id);

CREATE INDEX IF NOT EXISTS idx_group_members_user_id 
    ON group_members(user_id);

CREATE INDEX IF NOT EXISTS idx_group_members_added_by 
    ON group_members(added_by);

-- =====================================================
-- 5. Tambahkan comment untuk dokumentasi
-- =====================================================
COMMENT ON TABLE group_members IS 'Tabel untuk menyimpan anggota kelompok dalam tugas kelompok';
COMMENT ON COLUMN group_members.id IS 'ID unik untuk record anggota kelompok';
COMMENT ON COLUMN group_members.thread_id IS 'ID thread (tugas kelompok)';
COMMENT ON COLUMN group_members.user_id IS 'ID user (anggota kelompok)';
COMMENT ON COLUMN group_members.added_by IS 'ID user yang menambahkan anggota (pembuat thread)';
COMMENT ON COLUMN group_members.added_at IS 'Waktu ketika anggota ditambahkan ke kelompok';

-- =====================================================
-- Migration selesai
-- =====================================================
-- Verifikasi: Cek apakah semua kolom dan tabel sudah dibuat
DO $$ 
DECLARE
    threads_columns_count INTEGER;
    group_members_exists BOOLEAN;
BEGIN
    -- Cek field di threads
    SELECT COUNT(*) INTO threads_columns_count
    FROM information_schema.columns
    WHERE table_name = 'threads'
    AND column_name IN ('is_group_task', 'group_task_title');
    
    -- Cek tabel group_members
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'group_members'
    ) INTO group_members_exists;
    
    -- Log hasil
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE '================================================';
    RAISE NOTICE '  - Threads columns added: % / 2', threads_columns_count;
    RAISE NOTICE '  - Group members table exists: %', group_members_exists;
    RAISE NOTICE '================================================';
    
    IF threads_columns_count >= 2 AND group_members_exists THEN
        RAISE NOTICE '✅ All changes applied successfully!';
    ELSE
        RAISE WARNING '⚠️ Some changes may not have been applied. Please check manually.';
    END IF;
END $$;



