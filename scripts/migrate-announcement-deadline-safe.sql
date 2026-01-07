-- Migration: Add Announcement and Deadline features (SAFE VERSION - preserves existing data)
-- Run this script if you already have announcements data that you want to keep

-- 1. Add deadline column to threads table
ALTER TABLE threads ADD COLUMN IF NOT EXISTS deadline TIMESTAMP;

-- 2. Add deadline column to comments table
ALTER TABLE comments ADD COLUMN IF NOT EXISTS deadline TIMESTAMP;

-- 3. Create AnnouncementTargetType enum (must be created before using it)
DO $$ BEGIN
    CREATE TYPE "AnnouncementTargetType" AS ENUM ('global', 'class', 'subject');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Create AnnouncementPriority enum (must be created before using it)
DO $$ BEGIN
    CREATE TYPE "AnnouncementPriority" AS ENUM ('urgent', 'normal', 'low');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 5. Check if announcements table exists and has correct columns
DO $$ 
BEGIN
    -- If table doesn't exist, create it
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'announcements') THEN
        CREATE TABLE announcements (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            target_type "AnnouncementTargetType" NOT NULL DEFAULT 'global',
            target_kelas TEXT,
            target_subject TEXT,
            priority "AnnouncementPriority" NOT NULL DEFAULT 'normal',
            is_pinned BOOLEAN NOT NULL DEFAULT false,
            expires_at TIMESTAMP,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
    ELSE
        -- Table exists, add missing columns
        -- Add target_type if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'announcements' AND column_name = 'target_type'
        ) THEN
            ALTER TABLE announcements ADD COLUMN target_type "AnnouncementTargetType" NOT NULL DEFAULT 'global';
        END IF;
        
        -- Add target_kelas if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'announcements' AND column_name = 'target_kelas'
        ) THEN
            ALTER TABLE announcements ADD COLUMN target_kelas TEXT;
        END IF;
        
        -- Add target_subject if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'announcements' AND column_name = 'target_subject'
        ) THEN
            ALTER TABLE announcements ADD COLUMN target_subject TEXT;
        END IF;
        
        -- Add priority if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'announcements' AND column_name = 'priority'
        ) THEN
            ALTER TABLE announcements ADD COLUMN priority "AnnouncementPriority" NOT NULL DEFAULT 'normal';
        END IF;
        
        -- Add is_pinned if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'announcements' AND column_name = 'is_pinned'
        ) THEN
            ALTER TABLE announcements ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT false;
        END IF;
        
        -- Add expires_at if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'announcements' AND column_name = 'expires_at'
        ) THEN
            ALTER TABLE announcements ADD COLUMN expires_at TIMESTAMP;
        END IF;
    END IF;
END $$;

-- 6. Create indexes for announcements (safe - won't fail if already exists)
CREATE INDEX IF NOT EXISTS idx_announcements_target_type ON announcements(target_type);
CREATE INDEX IF NOT EXISTS idx_announcements_target_kelas ON announcements(target_kelas);
CREATE INDEX IF NOT EXISTS idx_announcements_is_pinned ON announcements(is_pinned);
CREATE INDEX IF NOT EXISTS idx_announcements_expires_at ON announcements(expires_at);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at);

-- 7. Create announcement_reads table if it doesn't exist
CREATE TABLE IF NOT EXISTS announcement_reads (
    id TEXT PRIMARY KEY,
    announcement_id TEXT NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(announcement_id, user_id)
);

-- 8. Create indexes for announcement_reads
CREATE INDEX IF NOT EXISTS idx_announcement_reads_user_id ON announcement_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_announcement_id ON announcement_reads(announcement_id);

