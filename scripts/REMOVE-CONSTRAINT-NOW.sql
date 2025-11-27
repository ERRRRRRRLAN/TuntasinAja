-- ⚠️ URGENT: Hapus unique constraint dari threads table
-- Copy paste script ini ke Supabase SQL Editor dan jalankan SEKARANG
-- 
-- Error yang terjadi: Unique constraint failed on the fields: (judul_mapel, date)
-- Script ini akan menghapus constraint tersebut

-- Step 1: Cari nama constraint yang ada
SELECT 
    con.conname as constraint_name,
    pg_get_constraintdef(con.oid) as definition
FROM pg_constraint con
WHERE con.conrelid = 'threads'::regclass
  AND con.contype = 'u'
  AND con.conkey IS NOT NULL;

-- Step 2: Hapus constraint dengan nama yang umum (jalankan ini dulu)
ALTER TABLE threads DROP CONSTRAINT IF EXISTS threads_judul_mapel_date_key;

-- Step 3: Hapus constraint secara dinamis (jika step 2 tidak bekerja)
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Cari constraint yang melibatkan judul_mapel dan date
    SELECT con.conname INTO constraint_name
    FROM pg_constraint con
    JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = ANY(con.conkey)
    WHERE con.conrelid = 'threads'::regclass
      AND con.contype = 'u'
      AND array_length(con.conkey, 1) = 2
    GROUP BY con.conname
    HAVING array_agg(a.attname ORDER BY array_position(con.conkey, a.attnum))::text[] = ARRAY['judul_mapel', 'date']
    LIMIT 1;

    -- Hapus constraint jika ditemukan
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE threads DROP CONSTRAINT %I', constraint_name);
        RAISE NOTICE '✅ Constraint berhasil dihapus: %', constraint_name;
    ELSE
        RAISE NOTICE 'ℹ️  Constraint tidak ditemukan (mungkin sudah dihapus)';
    END IF;
END $$;

-- Step 4: Verifikasi constraint sudah dihapus
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

-- Jika query di atas mengembalikan 0 rows, berarti constraint sudah berhasil dihapus! ✅

