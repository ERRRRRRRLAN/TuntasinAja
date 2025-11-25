-- Migration untuk fitur Announcement
-- Buat tabel announcements

CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id TEXT NOT NULL,
    kelas TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_approved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_announcement_author
        FOREIGN KEY (author_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Buat index untuk performa
CREATE INDEX IF NOT EXISTS idx_announcements_kelas ON announcements(kelas);
CREATE INDEX IF NOT EXISTS idx_announcements_is_approved ON announcements(is_approved);
CREATE INDEX IF NOT EXISTS idx_announcements_expires_at ON announcements(expires_at);
CREATE INDEX IF NOT EXISTS idx_announcements_author_id ON announcements(author_id);

