-- Migration: Remove Group Task Feature
-- This script removes all group task related columns and tables from the database

-- Drop group_members table (if exists)
DROP TABLE IF EXISTS "group_members" CASCADE;

-- Remove is_group_task column from threads table (if exists)
ALTER TABLE "threads" DROP COLUMN IF EXISTS "is_group_task";

-- Remove max_group_members column from threads table (if exists)
ALTER TABLE "threads" DROP COLUMN IF EXISTS "max_group_members";

