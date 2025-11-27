# 📚 TuntasinAja - Social Homework Thread System

Platform sosial berbasis 'thread' untuk berbagi dan melacak tugas sekolah harian.

## 🚀 Cara Menggunakan

1. **Buka aplikasi**: Buka file `index.html` di browser
2. **Login atau Daftar**: 
   - Untuk testing cepat, gunakan akun demo:
     - Email: `budi@test.com` / Password: `test123`
     - Email: `siti@test.com` / Password: `test123`
     - Email: `ahmad@test.com` / Password: `test123`
   - Atau daftar akun baru
3. **Mulai menggunakan**: Aplikasi akan otomatis memuat data demo jika belum ada data

## ✨ Fitur yang Tersedia

### ✅ Fitur UI yang Sudah Diimplementasikan:

1. **Autentikasi**
   - Login & Registrasi
   - Validasi form dengan feedback visual
   - Session management dengan localStorage

2. **Feed Thread**
   - Tampilan semua thread tugas
   - Prioritas thread belum selesai
   - Preview komentar (2 komentar teratas)
   - Klik thread untuk melihat detail

3. **Membuat Thread**
   - Form dengan validasi nama mata pelajaran (hanya huruf)
   - Komentar awal opsional
   - Deteksi thread duplikat (hari yang sama, mapel sama)
   - Notifikasi jika thread sudah ada

4. **Detail Thread**
   - Tampilan lengkap thread dan semua komentar
   - Form tambah komentar
   - Checkbox untuk menandai selesai

5. **Status Selesai**
   - Checkbox per thread dan komentar
   - Visual garis coret untuk item selesai
   - Auto-move ke History ketika semua selesai
   - Status tersimpan di localStorage (per user)

6. **History**
   - Daftar tugas yang sudah selesai
   - Tampilan tanggal penyelesaian

7. **Profil**
   - Informasi user
   - Statistik: Thread dibuat, Komentar, Tugas selesai

8. **Notifikasi**
   - Toast notification untuk feedback
   - Auto-hide setelah beberapa detik
   - Warna berbeda untuk success/error/info

9. **Responsive Design**
   - Tampilan optimal di desktop dan mobile
   - Animasi transisi halus

## 🧪 Testing

### Data Demo
Aplikasi otomatis memuat data demo saat pertama kali dibuka:
- 3 user demo
- 3 thread dengan komentar
- Thread dari hari ini dan kemarin

### Tombol Clear Data
Gunakan tombol "🗑️ Clear" di header untuk menghapus semua data (untuk testing ulang).

### Skenario Testing:

1. **Test Login/Registrasi**
   - Coba login dengan akun demo
   - Daftar akun baru
   - Test validasi form (email, password minimal 6 karakter)

2. **Test Membuat Thread**
   - Buat thread baru dengan nama mata pelajaran
   - Coba buat thread duplikat (mapel sama, hari sama) → akan jadi komentar
   - Test validasi (hanya huruf, wajib diisi)

3. **Test Interaksi Thread**
   - Klik thread untuk melihat detail
   - Tambah komentar di detail thread
   - Centang checkbox thread dan komentar
   - Lihat efek visual garis coret

4. **Test History**
   - Centang semua komentar dan thread
   - Thread akan otomatis pindah ke History
   - Cek halaman History

5. **Test Navigasi**
   - Pindah antar halaman (Feed, History, Profil)
   - Test tombol kembali
   - Test logout

## 📝 Catatan

- Data disimpan di **localStorage** browser (simulasi backend)
- Status selesai disimpan per user (bisa berbeda antar user)
- Thread duplikat (mapel + tanggal sama) otomatis menjadi komentar
- History hanya menampilkan thread yang sudah 100% selesai

## 🔧 Teknologi

- HTML5
- CSS3 (dengan CSS Variables)
- Vanilla JavaScript (ES6+)
- localStorage untuk data persistence

## 📦 File Struktur

```
TuntasinAja/
├── index.html      # Struktur HTML utama
├── styles.css      # Styling dan responsive design
├── app.js          # Logika aplikasi dan interaksi
├── todo.md         # Dokumentasi requirements
└── README.md       # Dokumentasi ini
```

## 🎨 Fitur UI Tambahan

- Animasi fade-in untuk transisi halaman
- Hover effects pada card dan button
- Visual feedback untuk form validation
- Toast notification dengan warna berbeda
- Loading states (implisit)
- Responsive breakpoints untuk mobile

---

**Status**: ✅ Bagian UI sudah selesai dan siap untuk testing!

