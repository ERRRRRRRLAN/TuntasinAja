-- ============================================
-- FIX BUG: User dari kelas berbeda tidak bisa post mata pelajaran yang sama
-- ============================================
-- INSTRUKSI: Copy SEMUA script di bawah ini, paste ke Supabase SQL Editor, jalankan

-- STEP 1: Hapus constraint dengan nama umum
ALTER TABLE threads DROP CONSTRAINT IF EXISTS threads_judul_mapel_date_key;
ALTER TABLE threads DROP CONSTRAINT IF EXISTS threads_title_date_key;
ALTER TABLE threads DROP CONSTRAINT IF EXISTS threads_judul_mapel_date_unique;

-- STEP 2: Hapus index dengan nama umum
DROP INDEX IF EXISTS threads_judul_mapel_date_key;
DROP INDEX IF EXISTS threads_judul_mapel_date_idx;
DROP INDEX IF EXISTS threads_title_date_key;

-- STEP 3: Hapus SEMUA unique constraint di threads (kecuali primary key)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'threads'::regclass 
          AND contype = 'u'
          AND conname != 'threads_pkey'
    LOOP
        EXECUTE format('ALTER TABLE threads DROP CONSTRAINT %I', r.conname);
        RAISE NOTICE 'Dropped constraint: %', r.conname;
    END LOOP;
END $$;

-- STEP 4: Hapus SEMUA unique index yang melibatkan judul_mapel dan date
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'threads'
          AND (
            (indexdef LIKE '%UNIQUE%' AND indexdef LIKE '%judul_mapel%' AND indexdef LIKE '%date%')
            OR indexname LIKE '%judul_mapel%date%'
            OR indexname LIKE '%title%date%'
          )
    LOOP
        EXECUTE format('DROP INDEX IF EXISTS %I', r.indexname);
        RAISE NOTICE 'Dropped index: %', r.indexname;
    END LOOP;
END $$;

-- STEP 5: Verifikasi - harus return 0 rows
SELECT 'SUCCESS - No constraint/index found' as status
WHERE NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'threads'::regclass AND contype = 'u' AND conname != 'threads_pkey'
    UNION ALL
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'threads'
      AND indexdef LIKE '%UNIQUE%'
      AND indexdef LIKE '%judul_mapel%'
      AND indexdef LIKE '%date%'
);

