-- Hapus unique INDEX (bukan constraint) yang melibatkan judul_mapel dan date
-- Kadang Prisma membuat unique index terpisah

-- ============================================
-- STEP 1: Lihat semua unique index
-- ============================================
SELECT 
    i.indexname as index_name,
    i.indexdef as index_definition
FROM pg_indexes i
WHERE i.tablename = 'threads'
  AND i.indexdef LIKE '%UNIQUE%'
  AND (i.indexdef LIKE '%judul_mapel%' OR i.indexdef LIKE '%judul_mapel%')
  AND (i.indexdef LIKE '%date%' OR i.indexdef LIKE '%date%');

-- ============================================
-- STEP 2: Hapus unique index secara dinamis
-- ============================================
DO $$
DECLARE
    index_rec RECORD;
    dropped_count INTEGER := 0;
BEGIN
    -- Cari semua unique index yang melibatkan judul_mapel dan date
    FOR index_rec IN
        SELECT 
            i.indexname,
            i.indexdef,
            idx.indexrelid
        FROM pg_indexes i
        JOIN pg_class t ON t.relname = i.tablename
        JOIN pg_index idx ON idx.indrelid = t.oid
        JOIN pg_class idx_class ON idx_class.oid = idx.indexrelid
        WHERE i.tablename = 'threads'
          AND idx.indisunique = true
          AND i.indexdef LIKE '%UNIQUE%'
    LOOP
        -- Cek apakah index ini melibatkan judul_mapel dan date
        IF index_rec.indexdef LIKE '%judul_mapel%' 
           AND index_rec.indexdef LIKE '%date%' THEN
            RAISE NOTICE '🗑️  Menghapus unique index: %', index_rec.indexname;
            RAISE NOTICE '   Definition: %', index_rec.indexdef;
            
            BEGIN
                EXECUTE format('DROP INDEX IF EXISTS %I', index_rec.indexname);
                RAISE NOTICE '✅ Berhasil menghapus index: %', index_rec.indexname;
                dropped_count := dropped_count + 1;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '❌ Gagal menghapus %: %', index_rec.indexname, SQLERRM;
            END;
        END IF;
    END LOOP;
    
    IF dropped_count = 0 THEN
        RAISE NOTICE 'ℹ️  Tidak ada unique index yang ditemukan untuk dihapus';
    ELSE
        RAISE NOTICE '✅ Total unique index yang dihapus: %', dropped_count;
    END IF;
END $$;

-- ============================================
-- STEP 3: Hapus dengan nama umum
-- ============================================
DROP INDEX IF EXISTS threads_judul_mapel_date_key;
DROP INDEX IF EXISTS threads_judul_mapel_date_idx;
DROP INDEX IF EXISTS threads_title_date_key;

-- ============================================
-- STEP 4: Verifikasi
-- ============================================
SELECT 
    i.indexname as index_name,
    i.indexdef as index_definition
FROM pg_indexes i
WHERE i.tablename = 'threads'
  AND i.indexdef LIKE '%UNIQUE%'
  AND i.indexdef LIKE '%judul_mapel%'
  AND i.indexdef LIKE '%date%';

-- Harus mengembalikan 0 rows jika berhasil

