-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "logoUrl" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- AddColumn
ALTER TABLE "users" ADD COLUMN "school_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "classes_school_id_name_key" ON "classes"("school_id", "name");

-- CreateIndex
CREATE INDEX "classes_school_id_idx" ON "classes"("school_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data Migration: Create Default School and Assign Users
DO $$
DECLARE
    default_school_id TEXT;
BEGIN
    -- 1. Create Default School
    default_school_id := 'school_' || substr(md5(random()::text), 0, 25); -- Generate a random cuid-like or just use a fixed ID if preferred. Let's use a known variable.
    
    -- Insert Default School (using a generated CUID-like ID or UUID if extension enabled, but let's just stick to a manual ID generation or let postgres handle it if we had a function. Since we don't have cuid() function in raw postgres usually, we insert a manual one or use a placeholder)
    -- Simplification: Just use a fixed string 'default-school-id' for simplicity in this script, or generate a UUID if `pgcrypto` is available. 
    -- Assuming `gen_random_uuid()` is available (Postgres 13+).
    
    INSERT INTO "schools" ("id", "name", "updated_at")
    VALUES (gen_random_uuid()::text, 'Sekolah Umum', NOW())
    RETURNING "id" INTO default_school_id;

    -- 2. Assign all existing users to this school
    UPDATE "users" SET "school_id" = default_school_id WHERE "school_id" IS NULL;
    
    -- 3. Populate Classes from unique "kelas" strings in users
    -- This part is tricky because 'kelas' in User is just a string. 
    -- We want to create Class entries for each unique 'kelas' found in Users, linked to the default school.
    INSERT INTO "classes" ("id", "name", "school_id", "updated_at")
    SELECT 
        gen_random_uuid()::text, 
        u."kelas", 
        default_school_id, 
        NOW()
    FROM "users" u
    WHERE u."kelas" IS NOT NULL
    GROUP BY u."kelas"
    ON CONFLICT ("school_id", "name") DO NOTHING;

END $$;
