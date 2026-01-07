# 📱 CHANGELOG - TuntasinAja

## 🎉 UPDATE TERBARU - Sistem Pengerjaan Tugas Lebih Cerdas (Subtask-Driven)

### ✨ Fitur Baru

**✅ Tugas Utama Otomatis Selesai**
- Tidak perlu lagi mencentang tugas utama secara manual!
- Cukup selesaikan sub-tugasnya, dan tugas utama otomatis akan masuk ke Histori.
- Lebih praktis dan fokus ke apa yang harus dikerjakan.

**🔄 Pembatalan Cerdas (Auto-Uncheck)**
- Salah centang sub-tugas? Tenang saja.
- Begitu kamu membatalkan centang pada satu sub-tugas, tugas utama otomatis akan keluar dari Histori dan kembali ke halaman utama.

### 📱 Perbaikan UI/UX
- Tampilan lebih bersih dengan penghapusan checkbox yang tidak diperlukan pada halaman utama dan Quick View.
- Interaksi checkbox sekarang terasa lebih cepat dan responsif (Optimistic UI).
- Notifikasi "Waduh, pelan-pelan!" ditambahkan untuk membantu jika menekan tombol terlalu cepat secara tidak sengaja.

### 🐛 Perbaikan Bug
- Fixed: Tugas utama dan sub-tugas bentrok saat loading icon muncul (Icon loading sekarang dihapus untuk pengalaman yang lebih mulus).
- Fixed: Masalah centang yang tidak tersimpan jika dilakukan sangat cepat.

---

## 📅 UPDATE SEBELUMNYA - Notifikasi untuk iPhone & Perbaikan UI/UX

### ✨ Fitur Baru

**🔔 Notifikasi untuk iPhone (PWA)**
- iPhone sekarang bisa menerima notifikasi seperti Android!
- **Cara menggunakan:**
  1. Buka aplikasi TuntasinAja di Safari
  2. Tap tombol "Share" (kotak dengan panah ke atas)
  3. Pilih "Add to Home Screen"
  4. Setelah di-install, buka aplikasi dari Home Screen
  5. Buka halaman "Me" → "Notifikasi & Pengingat"
  6. Tap tombol "Aktifkan Notifikasi" untuk mengaktifkan notifikasi
  7. Izinkan notifikasi saat diminta
  8. Selesai! Sekarang iPhone kamu bisa menerima notifikasi tugas dan pengumuman seperti Android

**📱 Perbaikan UI/UX Mobile**
- Safe-area untuk iPhone notch sudah diperbaiki di semua quickview
- Layout FeedbackModal (Saran & Masukan) sudah diperbaiki untuk mobile
- Tombol close dan delete di quickview sekarang mengikuti safe-area dengan benar
- Padding dan spacing di mobile sudah dioptimalkan

### 🐛 Perbaikan Bug

- Fixed: Safe-area tidak bekerja di quickview header
- Fixed: Tombol close/delete di quickview tidak mengikuti safe-area
- Fixed: Layout FeedbackModal tidak rapi di mobile
- Fixed: Safe-area terlalu besar di Android (sekarang menggunakan 1.5rem)

### 📝 Catatan Penting

**Untuk iPhone Users:**
- Pastikan kamu sudah "Add to Home Screen" untuk mendapatkan notifikasi
- Notifikasi hanya bekerja jika aplikasi sudah di-install sebagai PWA
- Jika notifikasi tidak muncul, pastikan kamu sudah mengaktifkan notifikasi di Settings → Notifikasi & Pengingat

**Untuk Android Users:**
- Tidak ada perubahan, notifikasi tetap bekerja seperti biasa
- Safe-area sudah dioptimalkan untuk tampilan yang lebih rapi

---

**Terima kasih sudah menggunakan TuntasinAja! 🎉**
