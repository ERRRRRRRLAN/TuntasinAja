-- Migration untuk fitur Class Schedule (Jadwal Pelajaran)
-- Buat enum type untuk day of week
DO $$ BEGIN
    CREATE TYPE "DayOfWeek" AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Buat tabel class_schedules
CREATE TABLE IF NOT EXISTS class_schedules (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    kelas TEXT NOT NULL,
    day_of_week "DayOfWeek" NOT NULL,
    subject TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_kelas_day_subject UNIQUE (kelas, day_of_week, subject)
);

-- Buat index untuk performa
CREATE INDEX IF NOT EXISTS idx_class_schedules_kelas ON class_schedules(kelas);
CREATE INDEX IF NOT EXISTS idx_class_schedules_day_of_week ON class_schedules(day_of_week);
