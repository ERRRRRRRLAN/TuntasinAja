'use client'

import { BookIcon, UserIcon, ClockIcon, CheckCircleIcon, BellIcon, CalendarIcon, SmartphoneIcon, GlobeIcon } from '@/components/ui/Icons'
import { useEffect, useState, useRef } from 'react'

export default function AboutPage() {
  const [isVisible, setIsVisible] = useState(false)
  const [stats, setStats] = useState({ features: 0, platforms: 0 })
  const statsRef = useRef<HTMLElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true)
            animateStats()
          }
        })
      },
      { threshold: 0.5 }
    )

    if (statsRef.current) {
      observer.observe(statsRef.current)
    }

    return () => {
      if (statsRef.current) {
        observer.unobserve(statsRef.current)
      }
    }
  }, [hasAnimated])

  const animateStats = () => {
    const duration = 2000
    const steps = 60
    const increment = duration / steps

    let currentFeatures = 0
    let currentPlatforms = 0

    const interval = setInterval(() => {
      currentFeatures += 80 / steps
      currentPlatforms += 2 / steps

      if (currentFeatures >= 80) {
        currentFeatures = 80
        currentPlatforms = 2
        clearInterval(interval)
      }

      setStats({
        features: Math.floor(currentFeatures),
        platforms: Math.floor(currentPlatforms),
      })
    }, increment)
  }

  const features = [
    {
      icon: BookIcon,
      title: 'Tugas Individual & Kelompok',
      description: 'Buat tugas individual atau tugas kelompok dengan mudah. Kolaborasi dengan teman sekelas untuk menyelesaikan tugas bersama-sama.',
      delay: 0,
    },
    {
      icon: ClockIcon,
      title: 'Manajemen Deadline',
      description: 'Atur deadline untuk setiap tugas dan sub-tugas. Dapatkan pengingat otomatis sebelum deadline tiba, tidak akan ketinggalan lagi.',
      delay: 100,
    },
    {
      icon: CheckCircleIcon,
      title: 'Progress Tracking',
      description: 'Lihat kemajuan tugas kelompok secara real-time dengan progress bar. Track siapa yang sudah selesai dan siapa yang belum.',
      delay: 200,
    },
    {
      icon: BellIcon,
      title: 'Notifikasi Real-time',
      description: 'Dapatkan notifikasi langsung saat ada tugas baru, komentar baru, atau pengingat deadline. Tidak perlu refresh halaman.',
      delay: 300,
    },
    {
      icon: CalendarIcon,
      title: 'Jadwal Pelajaran',
      description: 'Lihat jadwal pelajaran harian dan dapatkan pengingat otomatis untuk tugas yang terkait dengan mata pelajaran besok.',
      delay: 400,
    },
    {
      icon: UserIcon,
      title: 'Kolaborasi Kelas',
      description: 'Semua siswa di kelas bisa melihat tugas yang sama, menambah detail tugas, dan bekerja sama menyelesaikan tugas.',
      delay: 500,
    },
  ]

  const benefits = [
    { title: 'Tidak Ada Tugas yang Terlewat', description: 'Semua tugas dari kelas terkumpul di satu tempat. Tidak perlu khawatir ketinggalan tugas karena semua teman sekelas saling berbagi informasi.' },
    { title: 'Pengingat Otomatis', description: 'Dapatkan pengingat untuk deadline yang akan datang, tugas yang sudah lama belum dikerjakan, dan pengingat berdasarkan jadwal pelajaran.' },
    { title: 'Kolaborasi yang Mudah', description: 'Bekerja sama dengan teman sekelas menjadi lebih mudah. Buat tugas kelompok, tambah anggota, dan track progress bersama-sama.' },
    { title: 'Manajemen yang Terstruktur', description: 'Ketua kelas bisa mengelola siswa, mengatur jadwal pelajaran, dan memantau progress kelas dengan mudah melalui dashboard khusus.' },
    { title: 'History & Tracking', description: 'Lihat riwayat tugas yang sudah selesai, statistik personal, dan bisa kembalikan tugas jika salah mencentang.' },
    { title: 'Akses di Mana Saja', description: 'Gunakan TuntasinAja di HP, tablet, atau komputer. Tersedia sebagai website dan aplikasi Android dengan fitur yang sama.' },
  ]

  return (
    <div className="about-page-wrapper">
      {/* Animated Background */}
      <div className="about-bg-decoration">
        <div className="about-bg-circle about-bg-circle-1"></div>
        <div className="about-bg-circle about-bg-circle-2"></div>
        <div className="about-bg-circle about-bg-circle-3"></div>
      </div>

      {/* Hero Section */}
      <section className={`about-hero ${isVisible ? 'about-hero-visible' : ''}`}>
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
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className={`about-feature-card ${isVisible ? 'about-feature-card-visible' : ''}`}
                style={{ animationDelay: `${feature.delay}ms` }}
              >
                <div className="about-feature-icon">
                  <Icon size={32} />
                </div>
                <h3 className="about-feature-title">{feature.title}</h3>
                <p className="about-feature-description">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="about-benefits">
        <div className="about-section-header">
          <h2 className="about-section-title">Keuntungan Menggunakan TuntasinAja</h2>
          <p className="about-section-subtitle">Mengapa TuntasinAja adalah pilihan terbaik untuk mengelola tugas sekolah</p>
        </div>

        <div className="about-benefits-list">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className={`about-benefit-item ${isVisible ? 'about-benefit-item-visible' : ''}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="about-benefit-icon">
                <CheckCircleIcon size={24} />
              </div>
              <div className="about-benefit-content">
                <h3 className="about-benefit-title">{benefit.title}</h3>
                <p className="about-benefit-description">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Section */}
      <section className="about-platform">
        <div className="about-section-header">
          <h2 className="about-section-title">Tersedia di Berbagai Platform</h2>
          <p className="about-section-subtitle">Akses TuntasinAja di perangkat favoritmu</p>
        </div>

        <div className="about-platform-grid">
          <div className="about-platform-card about-platform-card-1">
            <div className="about-platform-icon">
              <GlobeIcon size={40} />
            </div>
            <h3 className="about-platform-title">Website</h3>
            <p className="about-platform-description">
              Akses melalui browser di HP, tablet, atau komputer. Bisa diinstall sebagai aplikasi (PWA) untuk pengalaman yang lebih baik.
            </p>
          </div>

          <div className="about-platform-card about-platform-card-2">
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

      {/* Stats Section with Counter Animation */}
      <section className="about-stats" ref={statsRef}>
        <div className="about-stats-grid">
          <div className="about-stat-item">
            <div className="about-stat-number">{stats.features}+</div>
            <div className="about-stat-label">Fitur Lengkap</div>
          </div>
          <div className="about-stat-item">
            <div className="about-stat-number">{stats.platforms}</div>
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
          <div className="about-cta-sparkles">
            <div className="about-sparkle about-sparkle-1"></div>
            <div className="about-sparkle about-sparkle-2"></div>
            <div className="about-sparkle about-sparkle-3"></div>
          </div>
        </div>
      </section>
    </div>
  )
}
