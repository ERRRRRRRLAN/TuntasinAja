-- Create enum for DayOfWeek
DO $$ BEGIN
    CREATE TYPE "DayOfWeek" AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create weekly_schedules table
CREATE TABLE IF NOT EXISTS "weekly_schedules" (
    "id" TEXT NOT NULL,
    "kelas" TEXT NOT NULL,
    "day_of_week" "DayOfWeek" NOT NULL,
    "period" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_schedules_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "weekly_schedules_kelas_day_of_week_period_key" 
ON "weekly_schedules"("kelas", "day_of_week", "period");

-- Create indexes
CREATE INDEX IF NOT EXISTS "weekly_schedules_kelas_idx" ON "weekly_schedules"("kelas");
CREATE INDEX IF NOT EXISTS "weekly_schedules_day_of_week_idx" ON "weekly_schedules"("day_of_week");


