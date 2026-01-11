-- Add capacity column to classes table
ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "capacity" INTEGER DEFAULT 40;

-- Update existing rows to have default capacity of 40 if they were somehow null
UPDATE "classes" SET "capacity" = 40 WHERE "capacity" IS NULL;
