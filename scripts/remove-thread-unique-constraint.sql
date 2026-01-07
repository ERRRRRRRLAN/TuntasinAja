-- Migration: Remove unique constraint on threads (title, date)
-- Description: Menghapus unique constraint untuk memungkinkan user dari kelas berbeda
--              membuat thread dengan mata pelajaran dan tanggal yang sama
-- Date: 2024
--
-- INSTRUKSI:
-- 1. Buka Supabase Dashboard -> SQL Editor
-- 2. Copy paste script ini dan jalankan
-- 3. Script akan otomatis mencari dan menghapus constraint yang melibatkan judul_mapel dan date

-- Method 1: Drop by common Prisma constraint names
ALTER TABLE threads DROP CONSTRAINT IF EXISTS threads_judul_mapel_date_key;
ALTER TABLE threads DROP CONSTRAINT IF EXISTS threads_title_date_key;
ALTER TABLE threads DROP CONSTRAINT IF EXISTS threads_judul_mapel_date_unique;

-- Method 2: Find and drop all unique constraints that involve both judul_mapel and date
DO $$
DECLARE
    constraint_record RECORD;
    constraint_name text;
    constraint_columns text[];
BEGIN
    -- Find all unique constraints on threads table
    FOR constraint_record IN
        SELECT 
            con.conname,
            array_agg(a.attname ORDER BY array_position(con.conkey, a.attnum)) as columns
        FROM pg_constraint con
        JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'threads'::regclass
          AND con.contype = 'u'
        GROUP BY con.conname
    LOOP
        constraint_columns := constraint_record.columns;
        
        -- Check if this constraint involves both judul_mapel and date
        IF 'judul_mapel' = ANY(constraint_columns) AND 'date' = ANY(constraint_columns) THEN
            constraint_name := constraint_record.conname;
            RAISE NOTICE 'Found constraint to drop: % (columns: %)', constraint_name, constraint_columns;
            
            -- Drop the constraint
            EXECUTE format('ALTER TABLE threads DROP CONSTRAINT IF EXISTS %I', constraint_name);
            RAISE NOTICE 'Successfully dropped constraint: %', constraint_name;
        END IF;
    END LOOP;
    
    -- If no constraint was found, show message
    IF NOT FOUND THEN
        RAISE NOTICE 'No constraint found involving both judul_mapel and date';
    END IF;
END $$;

-- Verify: Show remaining unique constraints (should not include judul_mapel + date)
SELECT 
    con.conname as constraint_name,
    pg_get_constraintdef(con.oid) as definition,
    array_agg(a.attname ORDER BY array_position(con.conkey, a.attnum)) as columns
FROM pg_constraint con
JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = ANY(con.conkey)
WHERE con.conrelid = 'threads'::regclass
  AND con.contype = 'u'
GROUP BY con.conname, con.oid
ORDER BY con.conname;

-- Final check: specifically look for constraints with both judul_mapel and date
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

