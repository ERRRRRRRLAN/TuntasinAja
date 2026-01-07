-- Cek SEMUA constraint dan index di threads table
-- Jalankan ini untuk melihat apa yang sebenarnya ada

-- ============================================
-- 1. CEK SEMUA CONSTRAINT
-- ============================================
SELECT 
    con.conname as constraint_name,
    CASE con.contype
        WHEN 'u' THEN 'UNIQUE'
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'c' THEN 'CHECK'
        ELSE 'OTHER'
    END as constraint_type,
    pg_get_constraintdef(con.oid) as definition,
    con.conkey as column_numbers
FROM pg_constraint con
WHERE con.conrelid = 'threads'::regclass
ORDER BY con.contype, con.conname;

-- ============================================
-- 2. CEK SEMUA INDEX (termasuk unique index)
-- ============================================
SELECT 
    i.indexname as index_name,
    i.indexdef as index_definition,
    CASE 
        WHEN i.indexdef LIKE '%UNIQUE%' THEN 'YES'
        ELSE 'NO'
    END as is_unique
FROM pg_indexes i
WHERE i.tablename = 'threads'
ORDER BY i.indexname;

-- ============================================
-- 3. CEK INDEX DARI pg_index (lebih detail)
-- ============================================
SELECT 
    i.relname as index_name,
    a.attname as column_name,
    am.amname as index_type,
    idx.indisunique as is_unique,
    pg_get_indexdef(idx.indexrelid) as index_definition
FROM pg_index idx
JOIN pg_class i ON i.oid = idx.indexrelid
JOIN pg_class t ON t.oid = idx.indrelid
JOIN pg_am am ON am.oid = i.relam
LEFT JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(idx.indkey)
WHERE t.relname = 'threads'
  AND idx.indisunique = true
ORDER BY i.relname, a.attnum;

-- ============================================
-- 4. CEK SCHEMA (pastikan kita di schema yang benar)
-- ============================================
SELECT current_schema();

-- ============================================
-- 5. CEK TABLE DI SCHEMA MANA
-- ============================================
SELECT 
    schemaname,
    tablename
FROM pg_tables
WHERE tablename = 'threads';

