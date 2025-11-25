# Fitur Danton (Ketua Kelas)

Fitur Danton memungkinkan ketua kelas untuk mengelola user di kelasnya dengan berbagai permission dan kemampuan moderasi.

## Fitur Utama

### 1. Permission System
Danton dapat mengatur permission tiap user di kelasnya:
- **Only Read**: User hanya bisa membaca konten, tidak dapat membuat atau mengedit
- **Read & Post/Edit**: User dapat membaca, membuat, dan mengedit thread/komentar

### 2. Manajemen User
- **Edit Data Siswa**: Danton dapat mengedit data siswa di kelasnya (nama, email, password)
- **Tambah User**: Danton dapat menambahkan user baru ke kelasnya (maksimal 40 user per kelas)
- **Hapus User**: Danton dapat menghapus user dari kelasnya (tidak dapat menghapus diri sendiri)
- **View List User**: Danton dapat melihat semua user di kelasnya beserta permission mereka

### 3. Moderasi Konten
- **Delete Thread**: Danton dapat menghapus thread di kelasnya
- **Delete Comment**: Danton dapat menghapus komentar di kelasnya
- Full oversight atas konten di kelasnya

## Cara Setup Danton

### 1. Update Database Schema

Jalankan migration SQL:
```sql
-- File: scripts/migrate-danton-schema.sql
-- Jalankan script ini di database
```

Atau menggunakan Prisma:
```bash
npx prisma db push
npx prisma generate
```

### 2. Set User sebagai Danton

**Menggunakan SQL:**
```sql
UPDATE users 
SET is_danton = true 
WHERE email = 'email_danton@example.com';
```

**Menggunakan Admin Panel:**
- Buka Admin Panel
- Edit user yang ingin dijadikan danton
- Set field `isDanton` menjadi `true`

### 3. Set Permission Default

Permission default untuk user baru adalah `read_and_post_edit`. Danton dapat mengubahnya melalui Danton Dashboard.

## Cara Menggunakan

### Akses Danton Dashboard
1. Login sebagai danton
2. Klik menu "Danton" di header atau "Danton Dashboard" di dropdown profile
3. Dashboard menampilkan statistik kelas dan daftar siswa

### Mengatur Permission User
1. Buka Danton Dashboard
2. Di tabel daftar siswa, klik tombol "Permission" pada user yang ingin diubah
3. Pilih permission yang diinginkan (Only Read atau Read & Post/Edit)
4. Klik "Simpan"

### Edit Data Siswa
1. Buka Danton Dashboard
2. Klik tombol "Edit" pada user yang ingin diedit
3. Ubah data (nama, email, password)
4. Klik "Simpan"

### Tambah Siswa Baru
1. Buka Danton Dashboard
2. Klik tombol "Tambah Siswa"
3. Isi form (nama, email, password)
4. Pastikan kapasitas kelas belum penuh (maksimal 40 user)
5. Klik "Tambah"

### Hapus Siswa
1. Buka Danton Dashboard
2. Klik tombol delete (trash icon) pada user yang ingin dihapus
3. Konfirmasi penghapusan

## Validasi & Batasan

1. **Kapasitas Kelas**: Maksimal 40 user per kelas
2. **Scope Management**: Danton hanya dapat manage user di kelasnya sendiri
3. **Self Protection**: Danton tidak dapat menghapus atau mengedit diri sendiri
4. **Admin Protection**: Danton tidak dapat menghapus atau mengedit admin
5. **Permission Check**: User dengan permission `only_read` tidak dapat:
   - Membuat thread baru
   - Menambah komentar
   - Mengedit thread/komentar

## File-file Penting

### Backend
- `server/trpc/routers/danton.ts` - Router untuk semua operasi danton
- `server/trpc/trpc.ts` - Middleware dan helper functions
- `server/trpc/routers/auth.ts` - Query isDanton dan getUserPermission
- `server/trpc/routers/thread.ts` - Permission checks untuk thread/comment
- `prisma/schema.prisma` - Database schema

### Frontend
- `components/danton/DantonDashboard.tsx` - Dashboard utama
- `components/danton/ClassUserList.tsx` - List user di kelas
- `components/danton/PermissionManager.tsx` - Manager permission
- `components/danton/EditClassUserForm.tsx` - Form edit user
- `components/danton/AddUserToClassForm.tsx` - Form tambah user
- `hooks/useDanton.ts` - Hook untuk check danton status
- `hooks/useUserPermission.ts` - Hook untuk check user permission
- `app/danton/page.tsx` - Halaman danton dashboard

## Testing Checklist

- [ ] Danton dapat mengakses dashboard
- [ ] Danton dapat melihat list user di kelasnya
- [ ] Danton dapat mengubah permission user
- [ ] Danton dapat edit data user
- [ ] Danton dapat tambah user (maksimal 40)
- [ ] Danton dapat hapus user (kecuali diri sendiri)
- [ ] Danton dapat delete thread di kelasnya
- [ ] Danton dapat delete comment di kelasnya
- [ ] User dengan permission `only_read` tidak dapat create/edit
- [ ] Danton tidak dapat manage kelas lain
- [ ] Validasi kapasitas maksimal 40 user bekerja
- [ ] Error handling dan toast notifications bekerja dengan baik

## Catatan Penting

1. **Permission Default**: User baru otomatis mendapat permission `read_and_post_edit`
2. **Auto Permission**: Jika user tidak punya record di `user_permissions`, default permission adalah `read_and_post_edit`
3. **Danton tidak bisa self-edit**: Danton tidak dapat mengedit data atau permission sendiri
4. **Class Scoping**: Semua operasi danton dibatasi hanya untuk kelasnya sendiri

