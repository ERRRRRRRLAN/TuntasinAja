'use client'

import { BookIcon, UserIcon, ClockIcon, CheckCircleIcon, BellIcon, CalendarIcon, SmartphoneIcon, GlobeIcon } from '@/components/ui/Icons'

export default function AboutPage() {
  return (
    <div className="about-page-wrapper">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-content">
          <div className="about-hero-icon">
            <BookIcon size={64} />
          </div>
          <h1 className="about-hero-title">TuntasinAja</h1>
          <p className="about-hero-subtitle">
            Platform manajemen tugas sekolah yang membantu siswa mengelola tugas, deadline, dan jadwal pelajaran dengan mudah dan efisien.
          </p>
          <p className="about-hero-description">
            Kolaborasi dengan teman sekelas, tracking progress bersama, dan tidak pernah ketinggalan deadline lagi.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="about-features">
        <div className="about-section-header">
          <h2 className="about-section-title">Fitur Utama</h2>
          <p className="about-section-subtitle">Semua yang kamu butuhkan untuk mengelola tugas sekolah</p>
        </div>

        <div className="about-features-grid">
          <div className="about-feature-card">
            <div className="about-feature-icon">
              <BookIcon size={32} />
            </div>
            <h3 className="about-feature-title">Tugas Individual & Kelompok</h3>
            <p className="about-feature-description">
              Buat tugas individual atau tugas kelompok dengan mudah. Kolaborasi dengan teman sekelas untuk menyelesaikan tugas bersama-sama.
            </p>
          </div>

          <div className="about-feature-card">
            <div className="about-feature-icon">
              <ClockIcon size={32} />
            </div>
            <h3 className="about-feature-title">Manajemen Deadline</h3>
            <p className="about-feature-description">
              Atur deadline untuk setiap tugas dan sub-tugas. Dapatkan pengingat otomatis sebelum deadline tiba, tidak akan ketinggalan lagi.
            </p>
          </div>

          <div className="about-feature-card">
            <div className="about-feature-icon">
              <CheckCircleIcon size={32} />
            </div>
            <h3 className="about-feature-title">Progress Tracking</h3>
            <p className="about-feature-description">
              Lihat kemajuan tugas kelompok secara real-time dengan progress bar. Track siapa yang sudah selesai dan siapa yang belum.
            </p>
          </div>

          <div className="about-feature-card">
            <div className="about-feature-icon">
              <BellIcon size={32} />
            </div>
            <h3 className="about-feature-title">Notifikasi Real-time</h3>
            <p className="about-feature-description">
              Dapatkan notifikasi langsung saat ada tugas baru, komentar baru, atau pengingat deadline. Tidak perlu refresh halaman.
            </p>
          </div>

          <div className="about-feature-card">
            <div className="about-feature-icon">
              <CalendarIcon size={32} />
            </div>
            <h3 className="about-feature-title">Jadwal Pelajaran</h3>
            <p className="about-feature-description">
              Lihat jadwal pelajaran harian dan dapatkan pengingat otomatis untuk tugas yang terkait dengan mata pelajaran besok.
            </p>
          </div>

          <div className="about-feature-card">
            <div className="about-feature-icon">
              <UserIcon size={32} />
            </div>
            <h3 className="about-feature-title">Kolaborasi Kelas</h3>
            <p className="about-feature-description">
              Semua siswa di kelas bisa melihat tugas yang sama, menambah detail tugas, dan bekerja sama menyelesaikan tugas.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="about-benefits">
        <div className="about-section-header">
          <h2 className="about-section-title">Keuntungan Menggunakan TuntasinAja</h2>
          <p className="about-section-subtitle">Mengapa TuntasinAja adalah pilihan terbaik untuk mengelola tugas sekolah</p>
        </div>

        <div className="about-benefits-list">
          <div className="about-benefit-item">
            <div className="about-benefit-icon">
              <CheckCircleIcon size={24} />
            </div>
            <div className="about-benefit-content">
              <h3 className="about-benefit-title">Tidak Ada Tugas yang Terlewat</h3>
              <p className="about-benefit-description">
                Semua tugas dari kelas terkumpul di satu tempat. Tidak perlu khawatir ketinggalan tugas karena semua teman sekelas saling berbagi informasi.
              </p>
            </div>
          </div>

          <div className="about-benefit-item">
            <div className="about-benefit-icon">
              <CheckCircleIcon size={24} />
            </div>
            <div className="about-benefit-content">
              <h3 className="about-benefit-title">Pengingat Otomatis</h3>
              <p className="about-benefit-description">
                Dapatkan pengingat untuk deadline yang akan datang, tugas yang sudah lama belum dikerjakan, dan pengingat berdasarkan jadwal pelajaran.
              </p>
            </div>
          </div>

          <div className="about-benefit-item">
            <div className="about-benefit-icon">
              <CheckCircleIcon size={24} />
            </div>
            <div className="about-benefit-content">
              <h3 className="about-benefit-title">Kolaborasi yang Mudah</h3>
              <p className="about-benefit-description">
                Bekerja sama dengan teman sekelas menjadi lebih mudah. Buat tugas kelompok, tambah anggota, dan track progress bersama-sama.
              </p>
            </div>
          </div>

          <div className="about-benefit-item">
            <div className="about-benefit-icon">
              <CheckCircleIcon size={24} />
            </div>
            <div className="about-benefit-content">
              <h3 className="about-benefit-title">Manajemen yang Terstruktur</h3>
              <p className="about-benefit-description">
                Ketua kelas bisa mengelola siswa, mengatur jadwal pelajaran, dan memantau progress kelas dengan mudah melalui dashboard khusus.
              </p>
            </div>
          </div>

          <div className="about-benefit-item">
            <div className="about-benefit-icon">
              <CheckCircleIcon size={24} />
            </div>
            <div className="about-benefit-content">
              <h3 className="about-benefit-title">History & Tracking</h3>
              <p className="about-benefit-description">
                Lihat riwayat tugas yang sudah selesai, statistik personal, dan bisa kembalikan tugas jika salah mencentang.
              </p>
            </div>
          </div>

          <div className="about-benefit-item">
            <div className="about-benefit-icon">
              <CheckCircleIcon size={24} />
            </div>
            <div className="about-benefit-content">
              <h3 className="about-benefit-title">Akses di Mana Saja</h3>
              <p className="about-benefit-description">
                Gunakan TuntasinAja di HP, tablet, atau komputer. Tersedia sebagai website dan aplikasi Android dengan fitur yang sama.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Section */}
      <section className="about-platform">
        <div className="about-section-header">
          <h2 className="about-section-title">Tersedia di Berbagai Platform</h2>
          <p className="about-section-subtitle">Akses TuntasinAja di perangkat favoritmu</p>
        </div>

        <div className="about-platform-grid">
          <div className="about-platform-card">
            <div className="about-platform-icon">
              <GlobeIcon size={40} />
            </div>
            <h3 className="about-platform-title">Website</h3>
            <p className="about-platform-description">
              Akses melalui browser di HP, tablet, atau komputer. Bisa diinstall sebagai aplikasi (PWA) untuk pengalaman yang lebih baik.
            </p>
          </div>

          <div className="about-platform-card">
            <div className="about-platform-icon">
              <SmartphoneIcon size={40} />
            </div>
            <h3 className="about-platform-title">Aplikasi Android</h3>
            <p className="about-platform-description">
              Download dan install aplikasi Android untuk pengalaman native dengan notifikasi push dan akses offline.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="about-stats">
        <div className="about-stats-grid">
          <div className="about-stat-item">
            <div className="about-stat-number">80+</div>
            <div className="about-stat-label">Fitur Lengkap</div>
          </div>
          <div className="about-stat-item">
            <div className="about-stat-number">2</div>
            <div className="about-stat-label">Platform</div>
          </div>
          <div className="about-stat-item">
            <div className="about-stat-number">24/7</div>
            <div className="about-stat-label">Tersedia</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta">
        <div className="about-cta-content">
          <h2 className="about-cta-title">Siap Mulai Menggunakan TuntasinAja?</h2>
          <p className="about-cta-description">
            Bergabunglah dengan ribuan siswa yang sudah menggunakan TuntasinAja untuk mengelola tugas sekolah mereka.
          </p>
        </div>
      </section>
    </div>
  )
}

