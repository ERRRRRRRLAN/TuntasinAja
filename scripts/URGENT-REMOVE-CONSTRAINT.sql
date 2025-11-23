-- ⚠️ URGENT: Hapus unique constraint (judul_mapel, date) dari threads
-- 
-- INSTRUKSI:
-- 1. Copy SEMUA script di bawah ini
-- 2. Paste ke Supabase SQL Editor
-- 3. Jalankan SEMUA sekaligus (jangan hanya query SELECT)
-- 4. Perhatikan output NOTICE untuk melihat constraint yang dihapus

-- ============================================
-- BAGIAN 1: LIHAT SEMUA CONSTRAINT YANG ADA
-- ============================================
-- Query ini untuk melihat constraint apa saja yang ada
SELECT 
    con.conname as constraint_name,
    CASE con.contype
        WHEN 'u' THEN 'UNIQUE'
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'f' THEN 'FOREIGN KEY'
        ELSE 'OTHER'
    END as constraint_type,
    pg_get_constraintdef(con.oid) as definition
FROM pg_constraint con
WHERE con.conrelid = 'threads'::regclass
  AND con.contype = 'u'
ORDER BY con.conname;

-- ============================================
-- BAGIAN 2: HAPUS CONSTRAINT DENGAN NAMA UMUM
-- ============================================
-- Jalankan semua baris ini untuk menghapus constraint dengan nama yang umum
ALTER TABLE threads DROP CONSTRAINT IF EXISTS threads_judul_mapel_date_key;
ALTER TABLE threads DROP CONSTRAINT IF EXISTS threads_title_date_key;
ALTER TABLE threads DROP CONSTRAINT IF EXISTS threads_judul_mapel_date_unique;

-- ============================================
-- BAGIAN 3: HAPUS CONSTRAINT SECARA DINAMIS
-- ============================================
-- Script ini akan mencari dan menghapus constraint yang melibatkan judul_mapel dan date
DO $$
DECLARE
    constraint_rec RECORD;
    dropped_count INTEGER := 0;
BEGIN
    -- Cari semua unique constraint yang melibatkan judul_mapel dan date
    FOR constraint_rec IN
        SELECT 
            con.conname,
            array_agg(a.attname ORDER BY array_position(con.conkey, a.attnum)) as columns
        FROM pg_constraint con
        JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'threads'::regclass
          AND con.contype = 'u'
        GROUP BY con.conname
        HAVING 'judul_mapel' = ANY(array_agg(a.attname)) 
           AND 'date' = ANY(array_agg(a.attname))
    LOOP
        RAISE NOTICE '🗑️  Menghapus constraint: % (columns: %)', constraint_rec.conname, constraint_rec.columns;
        
        BEGIN
            EXECUTE format('ALTER TABLE threads DROP CONSTRAINT %I', constraint_rec.conname);
            RAISE NOTICE '✅ Berhasil menghapus: %', constraint_rec.conname;
            dropped_count := dropped_count + 1;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ Gagal menghapus %: %', constraint_rec.conname, SQLERRM;
        END;
    END LOOP;
    
    IF dropped_count = 0 THEN
        RAISE NOTICE 'ℹ️  Tidak ada constraint yang ditemukan untuk dihapus';
    ELSE
        RAISE NOTICE '✅ Total constraint yang dihapus: %', dropped_count;
    END IF;
END $$;

-- ============================================
-- BAGIAN 4: VERIFIKASI
-- ============================================
-- Query ini harus mengembalikan 0 rows jika constraint sudah dihapus
SELECT 
    con.conname as constraint_name,
    array_agg(a.attname ORDER BY array_position(con.conkey, a.attnum)) as columns
FROM pg_constraint con
JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = ANY(con.conkey)
WHERE con.conrelid = 'threads'::regclass
  AND con.contype = 'u'
  AND array_length(con.conkey, 1) = 2
GROUP BY con.conname
HAVING array_agg(a.attname ORDER BY array_position(con.conkey, a.attnum))::text[] = ARRAY['judul_mapel', 'date'];

-- Jika query di atas mengembalikan 0 rows = SUCCESS! ✅
-- Jika masih ada rows = constraint masih ada, cek output NOTICE di atas

