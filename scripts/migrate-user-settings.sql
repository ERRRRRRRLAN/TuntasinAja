-- Migration untuk fitur User Settings
-- Buat tabel user_settings

CREATE TABLE IF NOT EXISTS user_settings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT UNIQUE NOT NULL,
    
    -- Notifications
    push_notifications_enabled BOOLEAN DEFAULT true,
    task_notifications_enabled BOOLEAN DEFAULT true,
    comment_notifications_enabled BOOLEAN DEFAULT true,
    announcement_notifications_enabled BOOLEAN DEFAULT true,
    deadline_reminder_enabled BOOLEAN DEFAULT true,
    schedule_reminder_enabled BOOLEAN DEFAULT true,
    overdue_reminder_enabled BOOLEAN DEFAULT true,
    reminder_time TEXT,
    dnd_enabled BOOLEAN DEFAULT false,
    dnd_start_time TEXT,
    dnd_end_time TEXT,
    
    -- Display
    theme TEXT DEFAULT 'auto',
    tasks_per_page INTEGER DEFAULT 20,
    default_sort TEXT DEFAULT 'newest',
    show_completed_tasks BOOLEAN DEFAULT true,
    font_size TEXT DEFAULT 'normal',
    animations_enabled BOOLEAN DEFAULT true,
    
    -- Data
    auto_delete_history_days INTEGER,
    
    -- Sound & Vibration
    sound_enabled BOOLEAN DEFAULT true,
    vibration_enabled BOOLEAN DEFAULT true,
    
    -- Language & Regional
    language TEXT DEFAULT 'id',
    date_format TEXT DEFAULT 'DD/MM/YYYY',
    time_format TEXT DEFAULT '24h',
    
    -- Accessibility
    high_contrast BOOLEAN DEFAULT false,
    large_buttons BOOLEAN DEFAULT false,
    reduce_animations BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_user_settings_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- Buat index untuk performa
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Buat trigger untuk update updated_at
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_settings_updated_at();

