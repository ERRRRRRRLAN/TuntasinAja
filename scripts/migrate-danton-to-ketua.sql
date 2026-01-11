-- Migration script to rename is_danton to is_ketua in the User table
-- Database: PostgreSQL

-- 1. Rename the column
ALTER TABLE "users" RENAME COLUMN "is_danton" TO "is_ketua";

-- 2. (Optional) If you have indices or constraints named after danton, you might want to rename them too.
-- Prisma usually handles these naming conventions, but if you have custom ones:
-- ALTER INDEX IF EXISTS "User_is_danton_key" RENAME TO "User_is_ketua_key";

-- Note: Ensure that your Prisma client is regenerated after running this script
-- by running `npx prisma generate`.
