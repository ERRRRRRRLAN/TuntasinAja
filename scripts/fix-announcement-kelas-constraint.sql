-- Fix: Check and fix kelas constraint issue in announcements table
-- This script checks if there's a 'kelas' field (not target_kelas) causing the issue

-- 1. Check if 'kelas' column exists (should not exist, only target_kelas should exist)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'announcements' AND column_name = 'kelas'
    ) THEN
        -- If 'kelas' column exists and has NOT NULL constraint, make it nullable or drop it
        -- First, check if it has NOT NULL constraint
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'announcements' 
            AND column_name = 'kelas' 
            AND is_nullable = 'NO'
        ) THEN
            -- Make it nullable
            ALTER TABLE announcements ALTER COLUMN kelas DROP NOT NULL;
            RAISE NOTICE 'Made kelas column nullable';
        END IF;
        
        -- Optionally, you can drop the kelas column if it's not needed
        -- ALTER TABLE announcements DROP COLUMN IF EXISTS kelas;
    ELSE
        RAISE NOTICE 'No kelas column found - this is correct. Only target_kelas should exist.';
    END IF;
END $$;

-- 2. Verify target_kelas is nullable (should be)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'announcements' 
        AND column_name = 'target_kelas' 
        AND is_nullable = 'NO'
    ) THEN
        -- Make target_kelas nullable if it's not
        ALTER TABLE announcements ALTER COLUMN target_kelas DROP NOT NULL;
        RAISE NOTICE 'Made target_kelas column nullable';
    ELSE
        RAISE NOTICE 'target_kelas is already nullable - this is correct.';
    END IF;
END $$;

-- 3. Show current schema of announcements table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'announcements'
ORDER BY ordinal_position;

