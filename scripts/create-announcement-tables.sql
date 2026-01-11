-- CreateEnum safely
DO $$ BEGIN
    CREATE TYPE "AnnouncementTargetType" AS ENUM ('global', 'class', 'subject');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum safely
DO $$ BEGIN
    CREATE TYPE "AnnouncementPriority" AS ENUM ('urgent', 'normal', 'low');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "target_type" "AnnouncementTargetType" NOT NULL,
    "target_kelas" TEXT,
    "target_subject" TEXT,
    "priority" "AnnouncementPriority" NOT NULL DEFAULT 'normal',
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "announcement_reads" (
    "id" TEXT NOT NULL,
    "announcement_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_reads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "announcements_target_type_idx" ON "announcements"("target_type");
CREATE INDEX IF NOT EXISTS "announcements_target_kelas_idx" ON "announcements"("target_kelas");
CREATE INDEX IF NOT EXISTS "announcements_is_pinned_idx" ON "announcements"("is_pinned");
CREATE INDEX IF NOT EXISTS "announcements_expires_at_idx" ON "announcements"("expires_at");
CREATE INDEX IF NOT EXISTS "announcements_created_at_idx" ON "announcements"("created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "announcement_reads_user_id_idx" ON "announcement_reads"("user_id");
CREATE INDEX IF NOT EXISTS "announcement_reads_announcement_id_idx" ON "announcement_reads"("announcement_id");
CREATE UNIQUE INDEX IF NOT EXISTS "announcement_reads_announcement_id_user_id_key" ON "announcement_reads"("announcement_id", "user_id");

-- AddForeignKey safely
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'announcements_author_id_fkey') THEN
        ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey safely
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'announcement_reads_announcement_id_fkey') THEN
        ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey safely
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'announcement_reads_user_id_fkey') THEN
        ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
