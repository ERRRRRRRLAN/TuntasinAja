# Database Migration - Group Task Feature

## File
`add_group_task_feature.sql`

## Deskripsi
Migration ini menambahkan fitur tugas kelompok ke database dengan:
1. Kolom `is_group_task` (BOOLEAN) di tabel `threads`
2. Kolom `group_task_title` (VARCHAR) di tabel `threads`
3. Tabel `group_members` untuk menyimpan anggota kelompok

## Cara Menjalankan di Supabase

### 1. Buka SQL Editor di Supabase
1. Login ke dashboard Supabase: https://app.supabase.com
2. Pilih project Anda
3. Klik "SQL Editor" di sidebar kiri
4. Klik "New query"

### 2. Copy-Paste Script
1. Buka file `add_group_task_feature.sql`
2. Copy semua isi file
3. Paste ke SQL Editor di Supabase
4. Klik "Run" atau tekan `Ctrl/Cmd + Enter`

### 3. Verifikasi
Setelah migration berhasil, Anda akan melihat output:
```
================================================
Migration completed successfully!
================================================
  - Threads columns added: 2 / 2
  - Group members table exists: true
================================================
✅ All changes applied successfully!
```

## Verifikasi Manual (Opsional)

Jalankan query berikut untuk memverifikasi perubahan:

```sql
-- Cek kolom di tabel threads
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'threads'
AND column_name IN ('is_group_task', 'group_task_title');

-- Cek tabel group_members
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'group_members'
ORDER BY ordinal_position;

-- Cek index
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'group_members';
```

## Rollback (Jika Perlu)

Jika perlu rollback migration, jalankan:

```sql
-- Hapus tabel group_members
DROP TABLE IF EXISTS group_members CASCADE;

-- Hapus kolom dari threads
ALTER TABLE threads DROP COLUMN IF EXISTS is_group_task;
ALTER TABLE threads DROP COLUMN IF EXISTS group_task_title;
```

## Catatan Penting

- Migration ini aman dijalankan berulang kali (idempotent)
- Menggunakan `IF NOT EXISTS` dan `IF EXISTS` untuk menghindari error
- Semua foreign key menggunakan `ON DELETE CASCADE` untuk data integrity
- Index dibuat otomatis untuk performa query yang optimal

