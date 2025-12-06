-- Migration: Add canCreateAnnouncement permission field
-- Run this script on your production database

-- Add canCreateAnnouncement column to user_permissions table
ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS can_create_announcement BOOLEAN DEFAULT false;

-- Set default to true for all danton users
UPDATE user_permissions
SET can_create_announcement = true
WHERE user_id IN (
  SELECT id FROM users WHERE is_danton = true
);

-- Note: Danton users will have can_create_announcement = true by default
-- Regular users need to be granted this permission by admin or danton

