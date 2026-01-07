-- Setup App Settings Table
-- Run this script in your database (Supabase SQL Editor or PostgreSQL)

-- Create app_settings table if not exists
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);

-- Insert default updateEnabled setting (optional - can be set via admin panel)
-- Uncomment the line below if you want to set default value
-- INSERT INTO app_settings (id, key, value, description) 
-- VALUES ('default_update_enabled', 'updateEnabled', 'true', 'Control whether users can see update notifications')
-- ON CONFLICT (key) DO NOTHING;

