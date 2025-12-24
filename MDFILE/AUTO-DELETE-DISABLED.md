# ⚠️ Auto-Delete Threads Dinonaktifkan

## 📋 Status

Fitur auto-delete threads telah **dinonaktifkan** untuk memastikan tugas tetap tersimpan dan dapat dilihat oleh user di waktu yang akan datang.

## 🔄 Perubahan

### Sebelumnya:
- Thread otomatis terhapus setelah 1 hari
- History tetap tersimpan selama 30 hari

### Sekarang:
- **Thread tetap tersimpan** di database
- Thread tidak akan terhapus otomatis
- History tetap tersimpan selama 30 hari
- Admin masih bisa menghapus thread secara manual jika diperlukan

## 📊 Manfaat

1. **Tugas tetap terlihat**: User bisa melihat tugas yang dibuat beberapa hari/minggu/bulan yang lalu
2. **Tidak ada data yang hilang**: Semua thread tetap tersimpan
3. **Fleksibilitas**: Admin bisa menghapus thread secara manual jika diperlukan

## 🗑️ Penghapusan Manual

Jika perlu menghapus thread secara manual:

1. **Via Admin Panel**: 
   - Login sebagai admin
   - Klik tombol "Hapus" pada thread yang ingin dihapus
   - Konfirmasi penghapusan

2. **Via Database**:
   - Buka Supabase Dashboard atau database client
   - Hapus thread secara langsung dari database

## 📝 Catatan

- **Thread tidak akan terhapus otomatis**: Semua thread akan tetap tersimpan
- **Database size**: Perlu monitor database size karena thread tidak terhapus otomatis
- **History cleanup**: History tetap akan terhapus setelah 30 hari (jika ada fitur cleanup history)
- **UserStatus cleanup**: Cleanup UserStatus tetap berjalan untuk membersihkan data tidak valid

## 🔄 Jika Ingin Mengaktifkan Kembali

Jika di masa depan ingin mengaktifkan kembali auto-delete:

1. **Edit vercel.json**:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/auto-delete-threads",
         "schedule": "0 0 * * *"
       }
     ]
   }
   ```

2. **Deploy ulang** ke Vercel

3. **Atau ubah durasi**: Edit `pages/api/cron/auto-delete-threads.ts` untuk mengubah durasi (misalnya 7 hari, 30 hari, dll)

## 💡 Rekomendasi

Untuk aplikasi tugas sekolah, lebih baik:
- **Thread tetap tersimpan** (seperti sekarang)
- **History tetap tersimpan** selama 30 hari
- **Admin bisa hapus manual** jika diperlukan
- **Monitor database size** secara berkala

