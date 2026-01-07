-- ⚠️ FORCE REMOVE: Hapus SEMUA unique constraint yang melibatkan judul_mapel dan date
-- Jalankan script ini di Supabase SQL Editor

-- Step 1: Lihat SEMUA constraint yang ada di threads table
SELECT 
    con.conname as constraint_name,
    con.contype as constraint_type,
    CASE con.contype
        WHEN 'u' THEN 'UNIQUE'
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'c' THEN 'CHECK'
        ELSE 'OTHER'
    END as type_name,
    pg_get_constraintdef(con.oid) as definition,
    array_agg(a.attname ORDER BY array_position(con.conkey, a.attnum)) as columns
FROM pg_constraint con
LEFT JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = ANY(con.conkey)
WHERE con.conrelid = 'threads'::regclass
GROUP BY con.conname, con.contype, con.oid, con.conkey
ORDER BY con.conname;

-- Step 2: Hapus constraint dengan semua kemungkinan nama
ALTER TABLE threads DROP CONSTRAINT IF EXISTS threads_judul_mapel_date_key;
ALTER TABLE threads DROP CONSTRAINT IF EXISTS threads_title_date_key;
ALTER TABLE threads DROP CONSTRAINT IF EXISTS threads_judul_mapel_date_unique;
ALTER TABLE threads DROP CONSTRAINT IF EXISTS threads_judul_mapel_date_idx;
ALTER TABLE threads DROP CONSTRAINT IF EXISTS threads_judul_mapel_date;

-- Step 3: Hapus constraint secara dinamis - CARI SEMUA yang melibatkan judul_mapel DAN date
DO $$
DECLARE
    constraint_rec RECORD;
    constraint_name text;
    columns_array text[];
    has_judul_mapel boolean;
    has_date boolean;
BEGIN
    -- Loop melalui semua unique constraints
    FOR constraint_rec IN
        SELECT 
            con.conname,
            con.oid,
            array_agg(a.attname ORDER BY array_position(con.conkey, a.attnum)) as cols
        FROM pg_constraint con
        JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'threads'::regclass
          AND con.contype = 'u'
        GROUP BY con.conname, con.oid
    LOOP
        columns_array := constraint_rec.cols;
        has_judul_mapel := 'judul_mapel' = ANY(columns_array);
        has_date := 'date' = ANY(columns_array);
        
        -- Jika constraint melibatkan kedua kolom, hapus
        IF has_judul_mapel AND has_date THEN
            constraint_name := constraint_rec.conname;
            RAISE NOTICE 'Found constraint to drop: % (columns: %)', constraint_name, columns_array;
            
            BEGIN
                EXECUTE format('ALTER TABLE threads DROP CONSTRAINT %I', constraint_name);
                RAISE NOTICE '✅ Successfully dropped: %', constraint_name;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '❌ Error dropping %: %', constraint_name, SQLERRM;
            END;
        END IF;
    END LOOP;
END $$;

-- Step 4: Coba hapus dengan mencari berdasarkan definition text
DO $$
DECLARE
    constraint_rec RECORD;
    constraint_name text;
    constraint_def text;
BEGIN
    FOR constraint_rec IN
        SELECT 
            con.conname,
            pg_get_constraintdef(con.oid) as definition
        FROM pg_constraint con
        WHERE con.conrelid = 'threads'::regclass
          AND con.contype = 'u'
    LOOP
        constraint_name := constraint_rec.conname;
        constraint_def := LOWER(constraint_rec.definition);
        
        -- Cek jika definition mengandung judul_mapel dan date
        IF constraint_def LIKE '%judul_mapel%' AND constraint_def LIKE '%date%' THEN
            RAISE NOTICE 'Found constraint by definition: %', constraint_name;
            RAISE NOTICE 'Definition: %', constraint_rec.definition;
            
            BEGIN
                EXECUTE format('ALTER TABLE threads DROP CONSTRAINT %I', constraint_name);
                RAISE NOTICE '✅ Successfully dropped: %', constraint_name;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '❌ Error dropping %: %', constraint_name, SQLERRM;
            END;
        END IF;
    END LOOP;
END $$;

-- Step 5: Verifikasi - harus mengembalikan 0 rows
SELECT 
    con.conname as constraint_name,
    pg_get_constraintdef(con.oid) as definition,
    array_agg(a.attname ORDER BY array_position(con.conkey, a.attnum)) as columns
FROM pg_constraint con
JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = ANY(con.conkey)
WHERE con.conrelid = 'threads'::regclass
  AND con.contype = 'u'
  AND array_length(con.conkey, 1) = 2
GROUP BY con.conname, con.oid
HAVING array_agg(a.attname ORDER BY array_position(con.conkey, a.attnum))::text[] = ARRAY['judul_mapel', 'date'];

-- Jika query di atas mengembalikan 0 rows, constraint sudah berhasil dihapus! ✅

