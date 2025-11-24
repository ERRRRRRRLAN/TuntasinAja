-- Add fcm_token column to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "fcm_token" TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS "users_fcm_token_idx" ON "users"("fcm_token") WHERE "fcm_token" IS NOT NULL;

