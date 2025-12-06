-- Migration: Add Announcement and Deadline features
-- Run this script on your production database

-- 1. Add deadline column to threads table
ALTER TABLE threads ADD COLUMN IF NOT EXISTS deadline TIMESTAMP;

-- 2. Add deadline column to comments table
ALTER TABLE comments ADD COLUMN IF NOT EXISTS deadline TIMESTAMP;

-- 3. Create AnnouncementTargetType enum
DO $$ BEGIN
    CREATE TYPE "AnnouncementTargetType" AS ENUM ('global', 'class', 'subject');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Create AnnouncementPriority enum
DO $$ BEGIN
    CREATE TYPE "AnnouncementPriority" AS ENUM ('urgent', 'normal', 'low');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 5. Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type "AnnouncementTargetType" NOT NULL DEFAULT 'normal',
    target_kelas TEXT,
    target_subject TEXT,
    priority "AnnouncementPriority" NOT NULL DEFAULT 'normal',
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 6. Create indexes for announcements
CREATE INDEX IF NOT EXISTS idx_announcements_target_type ON announcements(target_type);
CREATE INDEX IF NOT EXISTS idx_announcements_target_kelas ON announcements(target_kelas);
CREATE INDEX IF NOT EXISTS idx_announcements_is_pinned ON announcements(is_pinned);
CREATE INDEX IF NOT EXISTS idx_announcements_expires_at ON announcements(expires_at);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at);

-- 7. Create announcement_reads table
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

