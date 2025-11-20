# 💻 To-Do List Project: Social Homework/To-Do Thread System

**Visi:** Membuat platform sosial berbasis 'thread' untuk berbagi dan melacak tugas sekolah harian.

---

## 🚀 Fase 1: Perencanaan & Setup Awal

- [ ] 1.1 **Stack Technology:** Tentukan dan dokumentasikan teknologi yang akan digunakan (misalnya: Frontend: React/Vue/Next.js, Backend: Node.js/Express/Python/Django, Database: PostgreSQL/MongoDB).
- [ ] 1.2 **Database Schema (Backend):** Rancang skema database (termasuk relasi):
    - [ ] `User` (ID, Nama, Email, Password Hash).
    - [ ] `Thread/To-Do` (ID, User_ID_Pembuat, Judul_Mapel, Tanggal_Dibuat, Tanggal_Deadline).
    - [ ] `Comment/Task Item` (ID, Thread_ID, User_ID_Pembuat, Isi_Tugas).
    - [ ] `User_Status` (ID, User_ID, Comment_ID, Status_Selesai - *Untuk poin 6*).
    - [ ] `History` (ID, User_ID, Thread_ID, Tanggal_Selesai - *Untuk poin 8*).
- [ ] 1.3 **Setup Lingkungan:** Inisialisasi proyek, setup kontrol versi (Git), hosting/deployment dasar.

---

## 🔐 Fase 2: Fitur Autentikasi & User (Poin 1)

- [ ] 2.1 **Registrasi:** Implementasi formulir dan logika pendaftaran pengguna baru.
- [ ] 2.2 **Login:** Implementasi formulir dan logika login, menggunakan token aman (misalnya JWT).
- [ ] 2.3 **Middleware:** Buat middleware/guard untuk melindungi endpoint yang memerlukan otentikasi.
- [ ] 2.4 **UI Dasar:** Rancang layout dasar aplikasi (Header, Navigasi, Halaman Profil).

---

## 📝 Fase 3: Membuat & Melihat Thread (Poin 2, 3, 4, 7)

- [ ] 3.1 **Form Thread:** Buat formulir untuk membuat Thread baru. Input wajib: **Judul (Nama Mata Pelajaran)**.
- [ ] 3.2 **Form Komentar Awal (Poin 3):** Integrasikan kolom komentar awal pada form pembuatan Thread untuk menjabarkan tugas ("kerjakan halaman 42").
- [ ] 3.3 **Logika Post Thread:** Endpoint API untuk menyimpan Thread dan Komentar awal.
- [ ] 3.4 **Validasi Judul:** Implementasi validasi ketat agar judul hanya bisa menggunakan nama mata pelajaran (misalnya hanya teks tanpa angka, batasi ke daftar mapel yang umum, dll.).
- [ ] 3.5 **Tampilan Feed (Poin 4):** Tampilkan daftar semua Thread (To-Do Pelajaran) secara global di halaman utama (Feed).
    - [ ] Prioritaskan Thread yang **belum diselesaikan** oleh user yang sedang login.
- [ ] 3.6 **Tampilan Detail Thread:** Buat halaman detail untuk melihat satu Thread dan semua Komentarnya.
- [ ] 3.7 **Logika Tanggal (Poin 7):** Pastikan Thread yang sudah ada tetapi **belum selesai** tetap ditampilkan. Ketika Thread baru dengan mapel yang sama dibuat, tampilkan keduanya, namun bedakan dengan jelas berdasarkan tanggalnya.

---

## 💬 Fase 4: Interaksi & Logika Bisnis Utama (Poin 5)

- [ ] 4.1 **Form Tambah Komentar (Poin 4):** Buat form untuk user lain menambahkan tugas/komentar ke Thread yang sudah ada.
- [ ] 4.2 **Logika Konfirmasi Unik (Poin 5 - Backend):**
    - [ ] Ketika user mencoba membuat Thread baru (Judul X) pada tanggal T:
    - [ ] Cek database apakah Thread dengan Judul X sudah ada pada tanggal T.
    - [ ] Jika **sudah ada**, **batalkan** pembuatan Thread baru, dan ubah konten input Thread menjadi **Komentar**.
    - [ ] Komentar tersebut otomatis ditambahkan ke Thread yang sudah ada (Thread X, Tanggal T).
- [ ] 4.3 **Notifikasi Konfirmasi (Poin 5 - Frontend):** Berikan notifikasi/popup yang jelas kepada user bahwa "Thread [Mapel] hari ini sudah dibuat oleh [Nama User]. Postingan Anda akan ditambahkan sebagai Komentar."
- [ ] 4.4 **Sinkronisasi (Poin 4):** Pastikan semua komentar dari semua user langsung masuk ke Thread yang sama, dilihat oleh semua user.

---

## ✅ Fase 5: Status, Penyelesaian & History (Poin 6, 8)

- [ ] 5.1 **Status Selesai (Poin 6 - Client-Side):**
    - [ ] Tambahkan tombol/checkbox di sebelah setiap **Komentar** (tugas) dan **Thread** (pelajaran).
    - [ ] Implementasi logika *client-side* (localStorage/state management) untuk menyimpan status centang **per user**.
    - [ ] Visual: Beri efek centang/garis coret pada tugas yang sudah dicentang.
- [ ] 5.2 **Penyimpanan Status (Backend - Improvisasi):** *Improvisasi:* Kirim status centang ke Backend (`User_Status` Table) agar status tetap tersimpan meskipun user berganti perangkat.
- [ ] 5.3 **Logika History (Poin 8):** Ketika status Thread *sepenuhnya* selesai (semua komentarnya dicentang oleh user), pindahkan Thread ke tabel/koleksi `History` user tersebut.
- [ ] 5.4 **Tampilan History:** Buat halaman terpisah untuk menampilkan daftar tugas yang sudah diselesaikan (History).
- [ ] 5.5 **Penghapusan Otomatis (Poin 8):** Implementasi Cron Job/Scheduler di sisi Backend yang berjalan harian untuk menghapus entri dari tabel `History` yang sudah berumur lebih dari 30 hari.

---

## 🛠️ Fase 6: Penyempurnaan & Deployment

- [ ] 6.1 **Responsivitas:** Pastikan tampilan berfungsi baik di desktop dan mobile.
- [ ] 6.2 **Keamanan:** Lakukan pengujian dasar (CORS, XSS, CSRF, Rate Limiting API).
- [ ] 6.3 **Testing:** Tulis unit dan integration test untuk fitur-fitur kritis (Login, Logika Konfirmasi Poin 5, Cron Job Poin 8).
- [ ] 6.4 **Deployment:** Deploy aplikasi ke server produksi.
- [ ] 6.5 **Dokumentasi:** Buat dokumentasi teknis dan panduan penggunaan.

---

## 🌟 Improvisasi/Fitur Tambahan (Optional)

- [ ] **Filter/Pencarian:** Filter Thread berdasarkan Mata Pelajaran atau Tanggal.
- [ ] **Notifikasi:** Notifikasi jika ada user lain yang menambahkan komentar ke Thread yang Anda buat.
- [ ] **Profil:** Halaman profil user untuk melihat semua Thread yang pernah dibuatnya.
- [ ] **Dark Mode:** Tambahkan fitur *Dark Mode* untuk kenyamanan visual.