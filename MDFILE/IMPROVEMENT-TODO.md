# 📋 TODO - Saran Perbaikan dan Penambahan Fitur

Dokumentasi lengkap untuk semua saran, masukan, penambahan, dan perbaikan yang direkomendasikan untuk meningkatkan aplikasi TuntasinAja.

**Last Updated**: 2025-12-03  
**Status**: 🟡 Planning

---

## 🎯 FITUR ADMIN BARU - Saran Penambahan

### 📊 1. Dashboard Analytics & Statistics (Prioritas Tinggi)
**Manfaat**: Monitoring kesehatan aplikasi, insight penggunaan user, identifikasi masalah lebih cepat

**Keterangan:**
- **Buat apa**: Membuat dashboard yang menampilkan statistik dan analytics aplikasi secara real-time
- **Gunanya untuk apa**: Admin bisa melihat overview aplikasi, tracking user activity, monitoring trends, dan identifikasi masalah lebih cepat
- **Supaya apa**: Admin bisa membuat keputusan data-driven, proaktif mengatasi masalah, dan memahami bagaimana aplikasi digunakan

#### Detail Fitur:
- [ ] **Overview Stats**
  - Total Users (dengan breakdown per kelas)
  - Total Threads (hari ini, minggu ini, bulan ini)
  - Total Comments (hari ini, minggu ini, bulan ini)
  - Active Users (login dalam 7 hari terakhir)
  - Completion Rate (rata-rata % tugas selesai)
- [ ] **Per-Kelas Statistics**
  - User count per kelas
  - Thread count per kelas
  - Completion rate per kelas
  - Most active kelas
- [ ] **Activity Trends**
  - Thread creation trend (7 hari, 30 hari)
  - Comment creation trend
  - User registration trend
  - Completion rate trend
- [ ] **Quick Actions**
  - Kelas dengan subscription expiring soon
  - Kelas dengan aktivitas rendah
  - User yang belum login > 30 hari

**File yang perlu dibuat:**
- `components/admin/AnalyticsDashboard.tsx` - Dashboard utama
- `server/trpc/routers/analytics.ts` - Router untuk analytics queries
- `components/admin/StatsCard.tsx` - Component untuk statistik card
- `components/admin/ActivityChart.tsx` - Component untuk chart trends

---

### 💾 2. Database Monitoring & Health (Prioritas Tinggi) ✅
**Manfaat**: Mencegah database penuh, monitoring performa, early warning system

**Keterangan:**
- **Buat apa**: Membuat sistem monitoring untuk melihat kesehatan dan penggunaan database secara real-time
- **Gunanya untuk apa**: Admin bisa melihat ukuran database, table mana yang paling besar, dan kapan perlu cleanup sebelum database penuh
- **Supaya apa**: Database tidak penuh tiba-tiba, admin bisa proaktif melakukan cleanup, dan aplikasi tetap stabil

#### Detail Fitur:
- [x] **Size Monitoring**
  - Total database size
  - Size per table
  - Growth rate (MB/hari)
  - Alert jika > 80% limit (400MB dari 500MB)
- [x] **Table Statistics**
  - Rows count per table
  - Oldest records
  - Largest tables
  - Growth trends
- [x] **Cleanup Recommendations**
  - History > 30 hari: X records
  - Inactive threads > 90 hari: X records
  - Orphaned user statuses: X records
- [ ] **Performance Metrics**
  - Average query time
  - Slow queries (> 1 detik)
  - Connection pool usage

**File yang perlu dibuat:**
- `components/admin/DatabaseHealth.tsx` - Database monitoring dashboard ✅
- `pages/api/admin/database-stats.ts` - API endpoint untuk database stats (implemented via tRPC)
- `server/trpc/routers/database.ts` - Router untuk database queries ✅

---

### 📝 3. Activity Logs & Audit Trail (Prioritas Tinggi)
**Manfaat**: Tracking perubahan penting, security audit, troubleshooting

**Keterangan:**
- **Buat apa**: Membuat sistem logging untuk mencatat semua aktivitas penting di aplikasi (admin actions, user activities, system events)
- **Gunanya untuk apa**: Tracking siapa melakukan apa dan kapan, security audit, troubleshooting masalah, dan accountability
- **Supaya apa**: Bisa track perubahan data, security lebih baik, debugging lebih mudah, dan ada audit trail untuk compliance

#### Detail Fitur:
- [ ] **Admin Actions Log**
  - User created/deleted/edited
  - Subscription set/extended
  - Settings changed
  - Bulk operations
- [ ] **User Activity Log**
  - Login attempts (failed/success)
  - Permission changes
  - Danton actions
  - Suspicious activities
- [ ] **System Events Log**
  - Cron job executions
  - Notification sends
  - Database cleanup
  - Errors/warnings
- [ ] **Filters & Search**
  - Filter by date range
  - Filter by action type
  - Filter by user
  - Export logs (CSV/JSON)

**File yang perlu dibuat:**
- `components/admin/ActivityLogs.tsx` - Activity logs viewer
- `server/trpc/routers/activityLog.ts` - Router untuk activity logs
- `prisma/schema.prisma` - Model ActivityLog baru
- `scripts/create-activity-log-table.sql` - Migration SQL

---

### 🔧 4. Bulk Operations & Tools (Prioritas Sedang) ✅
**Manfaat**: Efisiensi manajemen, hemat waktu, konsistensi data

**Keterangan:**
- **Buat apa**: Membuat tools untuk melakukan operasi bulk (multiple operations sekaligus) pada user, subscription, dan content
- **Gunanya untuk apa**: Admin bisa mengelola banyak data sekaligus tanpa harus satu-satu, menghemat waktu, dan memastikan konsistensi
- **Supaya apa**: Admin lebih efisien, waktu management lebih hemat, dan data lebih konsisten karena operasi dilakukan sekaligus

#### Detail Fitur:
- [x] **User Management Bulk**
  - Bulk edit kelas
  - Bulk set permission
  - Bulk activate/deactivate
  - Bulk delete (dengan safety checks)
- [x] **Subscription Management Bulk**
  - Bulk extend subscription (multiple kelas)
  - Bulk set subscription (multiple kelas)
  - Bulk expire subscription
- [x] **Content Management Bulk**
  - Bulk delete threads (by date range, kelas)
  - Bulk delete comments
  - Bulk archive old content
- [x] **Data Migration**
  - Move users between kelas
  - Merge duplicate users
  - Cleanup orphaned data

**File yang perlu dibuat:**
- `components/admin/BulkOperations.tsx` - Bulk operations panel ✅
- `server/trpc/routers/bulkOperations.ts` - Router untuk bulk operations ✅

---

### 📤 5. Export/Import Data (Prioritas Sedang)
**Manfaat**: Backup manual, data portability, reporting

**Keterangan:**
- **Buat apa**: Membuat fitur untuk export data ke file (CSV/Excel/JSON) dan import data dari file
- **Gunanya untuk apa**: Backup manual, portabilitas data, reporting, dan migrasi data
- **Supaya apa**: Data bisa di-backup manual, bisa digunakan untuk reporting eksternal, dan memudahkan migrasi data

#### Detail Fitur:
- [ ] **Export Data**
  - Export users (CSV/Excel)
  - Export threads (JSON/CSV)
  - Export statistics (PDF/Excel)
  - Export subscription data
- [ ] **Import Data**
  - Import users from CSV
  - Import subjects per kelas
  - Import schedules
- [ ] **Templates**
  - User import template
  - Subject import template
  - Schedule import template

**File yang perlu dibuat:**
- `components/admin/DataExportImport.tsx` - Export/import panel
- `server/trpc/routers/exportImport.ts` - Router untuk export/import
- `lib/export-utils.ts` - Utility functions untuk export
- `lib/import-utils.ts` - Utility functions untuk import

---

### 🔔 6. Notification Management (Prioritas Sedang)
**Manfaat**: Kontrol notifikasi, testing & debugging, monitoring delivery

**Keterangan:**
- **Buat apa**: Membuat panel untuk mengelola, test, dan monitor semua notifikasi push yang dikirim
- **Gunanya untuk apa**: Admin bisa melihat history notifikasi, test notifikasi sebelum kirim, dan monitor delivery rate
- **Supaya apa**: Notifikasi lebih terkontrol, bisa debug masalah notifikasi, dan memastikan notifikasi sampai ke user

#### Detail Fitur:
- [ ] **Notification History**
  - List semua notifikasi yang dikirim
  - Filter by type, date, kelas
  - Success/failure rate
  - Delivery status per user
- [ ] **Notification Testing**
  - Send test notification ke user tertentu
  - Send test ke kelas tertentu
  - Preview notification content
- [ ] **Notification Settings**
  - Enable/disable notification types
  - Set notification schedule
  - Configure notification templates
- [ ] **Device Token Management**
  - List semua device tokens
  - Invalid token cleanup
  - Token statistics per kelas

**File yang perlu dibuat:**
- `components/admin/NotificationManagement.tsx` - Notification management panel
- `server/trpc/routers/notificationAdmin.ts` - Router untuk notification admin
- `prisma/schema.prisma` - Model NotificationLog baru

---

### 🛡️ 7. Content Moderation Tools (Prioritas Sedang)
**Manfaat**: Kontrol konten lebih baik, quick actions, reporting

**Keterangan:**
- **Buat apa**: Membuat tools untuk memoderasi konten (thread/comment) termasuk reported content dan quick actions
- **Gunanya untuk apa**: Admin bisa mengontrol konten lebih baik, handle reported content, dan melakukan bulk moderation
- **Supaya apa**: Konten lebih terkontrol, reported content bisa di-handle dengan cepat, dan aplikasi lebih aman

#### Detail Fitur:
- [ ] **Reported Content**
  - Thread/comment yang dilaporkan user
  - Auto-flag suspicious content
  - Review & action queue
- [ ] **Quick Actions**
  - Bulk approve/reject
  - Bulk delete with reason
  - Bulk hide/unhide
- [ ] **Content Search**
  - Search threads/comments by keyword
  - Search by user
  - Search by date range
- [ ] **Moderation Logs**
  - History of moderation actions
  - Who moderated what
  - Reason for actions

**File yang perlu dibuat:**
- `components/admin/ContentModeration.tsx` - Content moderation panel
- `server/trpc/routers/moderation.ts` - Router untuk moderation
- `prisma/schema.prisma` - Model ContentReport baru

---

### 👥 8. User Activity Tracking (Prioritas Rendah)
**Manfaat**: Insight user behavior, identifikasi power users, engagement metrics

**Keterangan:**
- **Buat apa**: Membuat sistem tracking untuk melihat aktivitas dan engagement setiap user
- **Gunanya untuk apa**: Admin bisa melihat user mana yang paling aktif, identifikasi power users, dan tracking engagement metrics
- **Supaya apa**: Admin bisa memahami user behavior, memberikan reward untuk power users, dan meningkatkan engagement

#### Detail Fitur:
- [ ] **User Engagement**
  - Most active users
  - Users dengan completion rate tertinggi
  - Users yang jarang login
  - Power users (most threads/comments)
- [ ] **Per-User Statistics**
  - Threads created
  - Comments created
  - Completion rate
  - Last login
  - Device count
- [ ] **Engagement Trends**
  - Daily active users
  - Weekly active users
  - Monthly active users

**File yang perlu dibuat:**
- `components/admin/UserActivity.tsx` - User activity tracking
- `server/trpc/routers/userActivity.ts` - Router untuk user activity

---

### ⚡ 9. System Health & Performance (Prioritas Rendah)
**Manfaat**: Proactive monitoring, performance optimization, issue detection

**Keterangan:**
- **Buat apa**: Membuat dashboard untuk monitoring kesehatan sistem (API performance, database performance, server resources)
- **Gunanya untuk apa**: Admin bisa melihat performa aplikasi, detect slow queries, dan monitor resource usage
- **Supaya apa**: Masalah performa bisa di-detect lebih awal, aplikasi tetap optimal, dan user experience lebih baik

#### Detail Fitur:
- [ ] **API Performance**
  - Response time per endpoint
  - Error rate per endpoint
  - Request volume
- [ ] **Database Performance**
  - Query performance
  - Connection pool status
  - Slow query alerts
- [ ] **Server Resources**
  - Memory usage
  - CPU usage (jika available)
  - Disk usage
- [ ] **Cron Jobs Status**
  - Last execution time
  - Success/failure rate
  - Execution duration
  - Next scheduled run

**File yang perlu dibuat:**
- `components/admin/SystemHealth.tsx` - System health dashboard
- `server/trpc/routers/systemHealth.ts` - Router untuk system health

---

### 🔍 10. Advanced Search & Filter (Prioritas Rendah)
**Manfaat**: Mencari data lebih cepat, filter kompleks, analisis data

**Keterangan:**
- **Buat apa**: Membuat sistem search dan filter yang lebih advanced dengan multiple criteria dan saved searches
- **Gunanya untuk apa**: Admin bisa mencari data lebih cepat dengan filter kompleks, save search yang sering digunakan
- **Supaya apa**: Mencari data lebih efisien, analisis data lebih mudah, dan workflow admin lebih cepat

#### Detail Fitur:
- [ ] **User Search**
  - Search by name, email, kelas
  - Filter by permission, danton status
  - Filter by last login
  - Filter by activity level
- [ ] **Content Search**
  - Search threads/comments by content
  - Filter by date range
  - Filter by kelas
  - Filter by author
- [ ] **Saved Searches**
  - Save frequently used searches
  - Quick access to saved searches
  - Share searches with other admins

**File yang perlu dibuat:**
- `components/admin/AdvancedSearch.tsx` - Advanced search panel
- `server/trpc/routers/search.ts` - Router untuk advanced search

---

## 🔴 PRIORITAS TINGGI (High Priority)

### 1. Keamanan dan Autentikasi

#### 1.1 Rate Limiting ✅
- [x] **Implementasi rate limiting middleware untuk tRPC**
  - File: `server/trpc/middleware/rateLimit.ts` (baru) ✅
  - Gunakan library seperti `@upstash/ratelimit` atau `express-rate-limit` (menggunakan in-memory store)
  - Limit: 10 requests per 10 detik per user/IP ✅
  - Apply ke semua mutation endpoints (sedang dalam progress - sudah apply ke auth dan thread)
  - Error code: `TOO_MANY_REQUESTS` ✅
  
  **Keterangan:**
  - **Buat apa**: Membuat middleware yang membatasi jumlah request per user/IP dalam waktu tertentu
  - **Gunanya untuk apa**: Mencegah abuse, spam, dan serangan DDoS. Melindungi server dari overload akibat terlalu banyak request dalam waktu singkat
  - **Supaya apa**: Server tetap stabil, performa terjaga, dan mencegah user melakukan aksi berulang-ulang yang tidak perlu (seperti spam create thread/comment)

#### 1.2 Input Validation
- [ ] **Perkuat Zod validation schema**
  - File: `server/trpc/routers/*.ts`
  - Tambahkan validasi lebih ketat untuk:
    - Email format (regex validation)
    - Comment content (max 5000 chars, sanitize HTML)
  - Tambahkan `z.string().trim()` untuk semua string inputs
  
  **Keterangan:**
  - **Buat apa**: Memperkuat validasi input data yang masuk ke server dengan aturan yang lebih ketat
  - **Gunanya untuk apa**: Mencegah data tidak valid masuk ke database, mencegah XSS attack melalui HTML injection, memastikan password kuat, dan mencegah input yang terlalu panjang
  - **Supaya apa**: Data di database lebih bersih dan konsisten, keamanan aplikasi meningkat, dan mencegah error yang disebabkan oleh data tidak valid

#### 1.3 Console.log Cleanup
- [ ] **Hapus semua console.log dari production code**
  - File: `server/trpc/routers/*.ts`
  - Ganti dengan logging library (Winston/Pino)
  - File: `lib/logger.ts` (baru)
  - Log level: error, warn, info, debug
  - Environment-based logging (tidak log di production kecuali error)
  
  **Keterangan:**
  - **Buat apa**: Mengganti semua console.log dengan logging library yang lebih profesional dan terstruktur
  - **Gunanya untuk apa**: Logging yang lebih terorganisir, bisa filter berdasarkan level (error/warn/info/debug), dan tidak spam log di production
  - **Supaya apa**: Lebih mudah debug masalah, log production lebih bersih (hanya error), dan performa lebih baik karena tidak log semua hal di production

#### 1.4 CSRF Protection
- [ ] **Implementasi CSRF token untuk mutation operations**
  - File: `lib/csrf.ts` (baru)
  - Generate CSRF token saat login
  - Validate CSRF token untuk semua POST/PUT/DELETE requests
  - Store token di session/cookie
  
  **Keterangan:**
  - **Buat apa**: Menambahkan CSRF (Cross-Site Request Forgery) token untuk melindungi mutation operations
  - **Gunanya untuk apa**: Mencegah serangan CSRF dimana attacker bisa membuat user melakukan aksi tanpa sepengetahuan user (seperti delete thread, update data, dll)
  - **Supaya apa**: Keamanan aplikasi meningkat, user terlindungi dari serangan CSRF, dan data tidak bisa diubah oleh request dari website lain

### 2. Database Management

#### 2.2 Database Monitoring ✅
- [x] **Setup database size monitoring**
  - File: `pages/api/admin/database-stats.ts` (implemented via tRPC router)
  - Endpoint untuk melihat:
    - Total rows per table ✅
    - Estimated size per table ✅
    - Oldest records ✅
    - Database size usage ✅
  - Alert jika size > 80% dari limit (400MB dari 500MB) ✅
  
  **Keterangan:**
  - **Buat apa**: Membuat sistem monitoring untuk melihat penggunaan database secara real-time
  - **Gunanya untuk apa**: Admin bisa melihat seberapa besar database, table mana yang paling besar, dan kapan perlu cleanup
  - **Supaya apa**: Admin bisa proaktif melakukan cleanup sebelum database penuh, mencegah error karena database limit, dan lebih mudah planning untuk upgrade jika diperlukan

#### 2.3 Database Backup Strategy
- [ ] **Dokumentasi backup strategy**
  - File: `docs/DATABASE-BACKUP.md` (baru)
  - Setup automated backup (Supabase sudah punya)
  - Retention policy: 7 hari daily, 4 minggu weekly
  - Test restore procedure
  
  **Keterangan:**
  - **Buat apa**: Membuat dokumentasi lengkap tentang strategi backup database dan cara restore
  - **Gunanya untuk apa**: Memastikan data bisa di-restore jika terjadi masalah (corrupt, deleted by mistake, dll)
  - **Supaya apa**: Data aman, bisa recover dengan cepat jika terjadi disaster, dan tim tahu cara restore jika diperlukan

### 3. Performance Optimization

#### 3.1 Refetch Interval Optimization ✅
- [x] **Optimasi refetch interval yang terlalu agresif**
  - File: `components/pages/FeedPage.tsx` ✅
  - File: `hooks/useClassSubscription.ts` ✅
  - File: `components/admin/DatabaseHealth.tsx` ✅
  - File: `components/admin/AppSettingsControl.tsx` ✅
  - Ubah `refetchInterval: 2000` menjadi conditional:
    ```typescript
    refetchInterval: (query) => {
      if (typeof document !== 'undefined' && document.hidden) return false // Stop polling jika tab tidak aktif
      return 5000 // 5 detik lebih reasonable
    }
    ```
  
  **Keterangan:**
  - **Buat apa**: Mengoptimasi interval refetch data agar tidak terlalu sering dan hanya fetch saat tab aktif
  - **Gunanya untuk apa**: Mengurangi beban server, menghemat bandwidth, dan menghemat baterai di mobile
  - **Supaya apa**: Server tidak overload, performa aplikasi lebih baik, dan user experience lebih smooth (tidak lag karena terlalu banyak request)

#### 3.2 Pagination ✅
- [x] **Implementasi pagination untuk thread list**
  - File: `server/trpc/routers/thread.ts` ✅
  - Tambahkan input: `page`, `limit` (default: 20, max: 50) ✅
  - Return: `{ threads, total, page, totalPages }` ✅
  - File: `components/pages/FeedPage.tsx` ✅
  - Tambahkan pagination controls (prev/next, page numbers) ✅
  
  **Keterangan:**
  - **Buat apa**: Membagi thread list menjadi beberapa halaman (pagination) daripada load semua sekaligus
  - **Gunanya untuk apa**: Mengurangi waktu loading, mengurangi memory usage, dan query database lebih efisien
  - **Supaya apa**: Aplikasi lebih cepat saat load feed, terutama jika ada banyak thread, dan performa lebih baik di mobile device dengan memory terbatas

#### 3.3 Query Optimization
- [ ] **Fix N+1 query problems**
  - File: `server/trpc/routers/thread.ts`
  - Gunakan `include` atau `select` yang tepat
  - Batch queries jika memungkinkan
  - Review semua router untuk query optimization
  
  **Keterangan:**
  - **Buat apa**: Memperbaiki query database yang tidak efisien (N+1 problem) dimana query di-loop berkali-kali
  - **Gunanya untuk apa**: Mengurangi jumlah query ke database, mempercepat response time, dan mengurangi beban database
  - **Supaya apa**: Aplikasi lebih cepat, database tidak overload, dan user experience lebih baik karena data load lebih cepat

#### 3.4 Caching Strategy
- [ ] **Implementasi caching yang lebih baik**
  - File: `lib/trpc.ts`
  - Setup React Query cache dengan:
    - `staleTime: 30000` (30 detik untuk queries)
    - `cacheTime: 300000` (5 menit)
  - Invalidate cache dengan lebih tepat (tidak semua invalidate)
  
  **Keterangan:**
  - **Buat apa**: Mengoptimasi caching strategy untuk menyimpan data di memory dan mengurangi request ke server
  - **Gunanya untuk apa**: Data yang sudah di-fetch tidak perlu di-fetch lagi dalam waktu tertentu, mengurangi beban server
  - **Supaya apa**: Aplikasi lebih cepat (data langsung dari cache), server lebih efisien, dan user experience lebih baik karena tidak perlu menunggu loading setiap kali

#### 3.5 Database Indexing
- [ ] **Review dan tambahkan database indexes**
  - File: `prisma/schema.prisma` atau migration SQL
  - Index untuk:
    - `threads.date` (untuk filtering by date)
    - `threads.authorId` (sudah ada via relation)
    - `comments.threadId` (sudah ada via relation)
    - `user_statuses.userId` (sudah ada)
    - `histories.userId` (sudah ada)
    - `histories.completedDate` (untuk cleanup queries)
  
  **Keterangan:**
  - **Buat apa**: Menambahkan index pada kolom database yang sering digunakan untuk filter/search
  - **Gunanya untuk apa**: Mempercepat query database, terutama untuk WHERE clause dan JOIN operations
  - **Supaya apa**: Query lebih cepat, aplikasi lebih responsif, dan database bisa handle lebih banyak data tanpa slowdown

### 4. Error Handling dan Logging

#### 4.1 Centralized Error Handling
- [ ] **Buat centralized error handling**
  - File: `lib/error-handler.ts` (baru)
  - Class `AppError` dengan code, statusCode, userMessage
  - Error mapping untuk user-friendly messages
  - Error logging ke external service (Sentry)
  
  **Keterangan:**
  - **Buat apa**: Membuat sistem error handling terpusat yang menangani semua error dengan cara yang konsisten
  - **Gunanya untuk apa**: Error message lebih user-friendly, error tracking lebih mudah, dan debugging lebih efisien
  - **Supaya apa**: User tidak bingung dengan error message teknis, developer bisa track error dengan mudah, dan aplikasi lebih robust dalam handle error

#### 4.2 Error Tracking
- [ ] **Setup error tracking dengan Sentry**
  - Install: `@sentry/nextjs`
  - File: `sentry.client.config.ts`, `sentry.server.config.ts` (baru)
  - Setup di `app/providers.tsx`
  - Track errors, performance, user sessions
  
  **Keterangan:**
  - **Buat apa**: Mengintegrasikan Sentry untuk tracking error dan performance monitoring secara real-time
  - **Gunanya untuk apa**: Developer bisa langsung tahu jika ada error di production, termasuk stack trace, user info, dan context
  - **Supaya apa**: Error bisa di-fix lebih cepat, performa issue bisa di-detect lebih awal, dan aplikasi lebih reliable karena masalah cepat terdeteksi

#### 4.3 User-Friendly Error Messages
- [ ] **Improve error messages untuk user**
  - File: `components/ui/ErrorDisplay.tsx` (baru)
  - Tampilkan error yang user-friendly
  - Hide technical details dari user
  - Tambahkan retry button untuk recoverable errors
  
  **Keterangan:**
  - **Buat apa**: Membuat komponen untuk menampilkan error message yang mudah dipahami user (bukan technical error)
  - **Gunanya untuk apa**: User tidak bingung dengan error message teknis seperti "Database connection failed", tapi mendapat pesan yang jelas seperti "Gagal menyimpan data, silakan coba lagi"
  - **Supaya apa**: User experience lebih baik, user tahu apa yang harus dilakukan saat error, dan aplikasi terlihat lebih profesional

#### 4.4 Error Recovery
- [ ] **Improve error recovery mechanism**
  - File: `components/ErrorBoundary.tsx` (update)
  - Tambahkan retry dengan exponential backoff
  - Show error details untuk development
  - Auto-retry untuk network errors
  
  **Keterangan:**
  - **Buat apa**: Membuat mekanisme untuk auto-retry saat terjadi error (terutama network error) dengan delay yang meningkat
  - **Gunanya untuk apa**: Aplikasi bisa recover sendiri dari error sementara (seperti network timeout), user tidak perlu manual retry
  - **Supaya apa**: User experience lebih baik, aplikasi lebih resilient terhadap error sementara, dan mengurangi frustrasi user

---

## 🟡 PRIORITAS SEDANG (Medium Priority)

### 5. Testing

#### 5.1 Setup Testing Framework
- [ ] **Setup Jest dan Testing Library**
  - File: `jest.config.js` (baru)
  - File: `jest.setup.js` (baru)
  - Install: `jest`, `@testing-library/react`, `@testing-library/jest-dom`
  
  **Keterangan:**
  - **Buat apa**: Setup framework testing untuk menulis dan menjalankan test otomatis
  - **Gunanya untuk apa**: Memastikan kode bekerja dengan benar, mencegah regression bug, dan memudahkan refactoring
  - **Supaya apa**: Kode lebih reliable, bug bisa di-detect lebih cepat, dan developer lebih percaya diri saat mengubah kode

#### 5.2 Unit Tests
- [ ] **Write unit tests untuk business logic**
  - File: `__tests__/lib/date-utils.test.ts` (baru)
  - File: `__tests__/server/trpc/routers/thread.test.ts` (baru)
  - File: `__tests__/server/trpc/routers/auth.test.ts` (baru)
  - Test coverage target: 70%+
  
  **Keterangan:**
  - **Buat apa**: Menulis test untuk setiap fungsi/unit kode secara terpisah
  - **Gunanya untuk apa**: Memastikan setiap fungsi bekerja dengan benar dalam berbagai skenario, termasuk edge cases
  - **Supaya apa**: Bug bisa di-detect lebih cepat, refactoring lebih aman, dan dokumentasi kode melalui test cases

#### 5.3 Integration Tests
- [ ] **Write integration tests untuk API endpoints**
  - File: `__tests__/api/trpc.test.ts` (baru)
  - Test critical flows:
    - User registration/login
    - Thread creation
    - Comment addition
    - Status toggle
  
  **Keterangan:**
  - **Buat apa**: Menulis test untuk menguji interaksi antar komponen (frontend-backend-database)
  - **Gunanya untuk apa**: Memastikan seluruh flow aplikasi bekerja dengan benar dari awal sampai akhir
  - **Supaya apa**: Bug di integration bisa di-detect, memastikan API bekerja dengan benar, dan memastikan data flow benar

#### 5.4 E2E Tests
- [ ] **Setup Playwright untuk E2E tests**
  - File: `playwright.config.ts` (baru)
  - Test critical user flows:
    - Complete login → create thread → add comment → mark complete
    - Admin panel workflows
    - Danton workflows
  
  **Keterangan:**
  - **Buat apa**: Menulis test yang menguji aplikasi dari perspektif user (seperti user benar-benar menggunakan aplikasi)
  - **Gunanya untuk apa**: Memastikan aplikasi bekerja dengan benar dari sudut pandang end-user, termasuk UI interactions
  - **Supaya apa**: Memastikan aplikasi benar-benar bisa digunakan, bug UI bisa di-detect, dan confidence tinggi saat deploy

### 6. UI/UX Improvements

#### 6.1 Skeleton Loading
- [ ] **Implementasi skeleton loading untuk semua list views**
  - File: `components/ui/Skeleton.tsx` (baru)
  - File: `components/threads/ThreadCardSkeleton.tsx` (baru)
  - Replace loading spinner dengan skeleton di:
    - FeedPage
    - HistoryPage
    - Admin UserList
    - SchedulePage
  
  **Keterangan:**
  - **Buat apa**: Mengganti loading spinner dengan skeleton screen yang menampilkan struktur konten yang akan muncul
  - **Gunanya untuk apa**: User tahu konten apa yang akan muncul, mengurangi perceived loading time, dan UX lebih baik
  - **Supaya apa**: User tidak bingung saat loading, aplikasi terlihat lebih profesional, dan user experience lebih smooth

#### 6.2 Toast Queue Management
- [ ] **Implementasi toast queue untuk prevent spam**
  - File: `components/ui/ToastContainer.tsx` (update)
  - Limit: maksimal 3 toast sekaligus
  - Queue system untuk pending toasts
  - Auto-dismiss oldest toast jika limit tercapai
  
  **Keterangan:**
  - **Buat apa**: Membuat sistem queue untuk membatasi jumlah toast notification yang muncul sekaligus
  - **Gunanya untuk apa**: Mencegah UI penuh dengan toast notification, toast lebih terorganisir, dan user tidak overwhelmed
  - **Supaya apa**: UI lebih bersih, user bisa membaca semua notifikasi dengan baik, dan aplikasi terlihat lebih profesional

#### 6.3 Dark Mode
- [ ] **Implementasi dark mode**
  - File: `app/globals.css` (update)
  - File: `components/ui/ThemeToggle.tsx` (baru)
  - CSS variables untuk dark theme
  - Store preference di localStorage
  - Toggle di Header component
  
  **Keterangan:**
  - **Buat apa**: Menambahkan tema gelap (dark mode) yang bisa di-toggle oleh user
  - **Gunanya untuk apa**: User bisa menggunakan aplikasi di kondisi gelap tanpa silau, mengurangi eye strain, dan preferensi user
  - **Supaya apa**: User experience lebih baik, aplikasi lebih modern, dan bisa digunakan di berbagai kondisi pencahayaan

#### 6.4 Accessibility
- [ ] **Improve accessibility**
  - Tambahkan ARIA labels untuk semua interactive elements
  - Keyboard navigation support
  - Screen reader support
  - Focus management untuk modals
  
  **Keterangan:**
  - **Buat apa**: Meningkatkan aksesibilitas aplikasi agar bisa digunakan oleh semua user termasuk yang menggunakan screen reader atau keyboard navigation
  - **Gunanya untuk apa**: Aplikasi bisa digunakan oleh user dengan disabilitas, compliance dengan accessibility standards, dan UX lebih baik untuk semua user
  - **Supaya apa**: Aplikasi lebih inklusif, bisa digunakan oleh lebih banyak user, dan memenuhi standar aksesibilitas web
  - Color contrast compliance (WCAG AA)

### 7. Code Quality

#### 7.1 TypeScript Strict Mode
- [ ] **Enable TypeScript strict mode**
  - File: `tsconfig.json` (update)
  - Enable: `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`
  - Fix semua type errors
  - Remove semua `as any` type assertions
  
  **Keterangan:**
  - **Buat apa**: Mengaktifkan TypeScript strict mode untuk type checking yang lebih ketat
  - **Gunanya untuk apa**: Mencegah type errors, memaksa developer untuk handle null/undefined dengan benar, dan kode lebih type-safe
  - **Supaya apa**: Bug bisa di-detect lebih cepat di compile time, kode lebih maintainable, dan refactoring lebih aman

#### 7.2 Code Splitting
- [ ] **Split large components**
  - File: `components/pages/FeedPage.tsx` (refactor)
  - Extract:
    - SearchAndFilter component
    - ThreadList component
    - ReminderHandler component
  - Lazy load heavy components
  
  **Keterangan:**
  - **Buat apa**: Memecah komponen besar menjadi komponen-komponen kecil yang lebih fokus dan lazy load komponen berat
  - **Gunanya untuk apa**: Initial load lebih cepat, bundle size lebih kecil, dan kode lebih mudah di-maintain
  - **Supaya apa**: Aplikasi load lebih cepat, performa lebih baik, dan developer lebih mudah memahami dan maintain kode

#### 7.3 Extract Common Logic
- [ ] **Create utility functions untuk common logic**
  - File: `lib/utils/thread-helpers.ts` (baru)
  - File: `lib/utils/user-helpers.ts` (baru)
  - File: `lib/utils/date-helpers.ts` (baru)
  - Extract duplicate code
  
  **Keterangan:**
  - **Buat apa**: Mengekstrak logic yang duplikat atau sering digunakan menjadi utility functions yang reusable
  - **Gunanya untuk apa**: DRY (Don't Repeat Yourself), kode lebih konsisten, dan lebih mudah di-test
  - **Supaya apa**: Kode lebih maintainable, bug fix lebih mudah (fix sekali, semua tempat ter-update), dan kode lebih clean

#### 7.4 Code Formatting
- [ ] **Setup Prettier dan ESLint**
  - File: `.prettierrc` (baru)
  - File: `.eslintrc.json` (update)
  - Pre-commit hooks dengan Husky
  - Auto-format on save
  
  **Keterangan:**
  - **Buat apa**: Setup code formatter (Prettier) dan linter (ESLint) dengan auto-format dan pre-commit hooks
  - **Gunanya untuk apa**: Kode lebih konsisten, format otomatis, dan catch potential bugs sebelum commit
  - **Supaya apa**: Kode lebih rapi dan konsisten, developer tidak perlu manual format, dan kualitas kode lebih terjaga

---

## 🟢 PRIORITAS RENDAH (Low Priority)

### 8. Monitoring dan Analytics

#### 8.1 Analytics
- [ ] **Setup analytics (privacy-friendly)**
  - Option 1: Plausible Analytics (privacy-friendly)
  - Option 2: Google Analytics 4
  - Track:
    - Page views
    - User actions (create thread, add comment, etc.)
    - Feature usage
  
  **Keterangan:**
  - **Buat apa**: Mengintegrasikan analytics service untuk tracking penggunaan aplikasi
  - **Gunanya untuk apa**: Admin bisa melihat bagaimana aplikasi digunakan, feature mana yang populer, dan user behavior
  - **Supaya apa**: Keputusan development lebih data-driven, bisa fokus ke feature yang benar-benar digunakan, dan memahami user needs

#### 8.2 Performance Monitoring
- [ ] **Track Web Vitals**
  - File: `lib/analytics.ts` (baru)
  - Track: LCP, FID, CLS
  - Send to analytics service
  - Alert jika performance degradation
  
  **Keterangan:**
  - **Buat apa**: Tracking Web Vitals (Core Web Vitals) untuk mengukur performa aplikasi dari sudut pandang user
  - **Gunanya untuk apa**: Monitor performa aplikasi, detect performance regression, dan memastikan user experience optimal
  - **Supaya apa**: Aplikasi tetap cepat, SEO lebih baik (Google menggunakan Web Vitals), dan user experience lebih baik

#### 8.3 Uptime Monitoring
- [ ] **Setup uptime monitoring**
  - Service: UptimeRobot atau Pingdom
  - Monitor: Main API endpoint
  - Alert: Email/SMS jika down
  - Status page untuk public
  
  **Keterangan:**
  - **Buat apa**: Setup monitoring service untuk mengecek apakah aplikasi masih online/accessible
  - **Gunanya untuk apa**: Admin langsung tahu jika aplikasi down, bisa cepat response, dan user tahu status aplikasi
  - **Supaya apa**: Downtime bisa di-detect dan di-handle lebih cepat, user tidak bingung jika aplikasi down, dan reliability lebih baik

### 9. Fitur Tambahan

#### 9.1 Search Functionality
- [ ] **Full-text search untuk threads dan comments**
  - File: `server/trpc/routers/search.ts` (baru)
  - Use PostgreSQL full-text search atau external service (Algolia/Meilisearch)
  - Search by: title, content, author
  - Highlight search results
  
  **Keterangan:**
  - **Buat apa**: Membuat fitur search yang bisa mencari konten di dalam thread dan comment
  - **Gunanya untuk apa**: User bisa mencari thread/comment berdasarkan keyword, lebih mudah menemukan tugas tertentu
  - **Supaya apa**: User lebih mudah menemukan informasi, aplikasi lebih user-friendly, dan produktivitas user meningkat

#### 9.2 Advanced Filters
- [ ] **Advanced filter untuk threads**
  - File: `components/pages/FeedPage.tsx` (update)
  - Filter by:
    - Date range (from - to)
    - Author
    - Subject
    - Completion status
    - Class
  
  **Keterangan:**
  - **Buat apa**: Menambahkan filter yang lebih advanced dengan multiple criteria untuk mencari thread
  - **Gunanya untuk apa**: User bisa filter thread berdasarkan berbagai kriteria sekaligus, lebih mudah menemukan thread tertentu
  - **Supaya apa**: User lebih mudah menemukan thread yang dicari, workflow lebih efisien, dan aplikasi lebih powerful

#### 9.3 In-App Notifications
- [ ] **In-app notifications center**
  - File: `components/notifications/NotificationCenter.tsx` (baru)
  - File: `server/trpc/routers/notification.ts` (update)
  - Store notifications di database
  - Real-time updates dengan polling atau WebSocket
  - Mark as read functionality
  
  **Keterangan:**
  - **Buat apa**: Membuat notification center di dalam aplikasi untuk menampilkan semua notifikasi
  - **Gunanya untuk apa**: User bisa melihat semua notifikasi di satu tempat, tidak perlu push notification untuk semua hal
  - **Supaya apa**: User tidak ketinggalan informasi penting, notifikasi lebih terorganisir, dan user experience lebih baik

#### 9.4 Email Notifications
- [ ] **Email notifications untuk important events**
  - Service: SendGrid, Resend, atau Nodemailer
  - Events:
    - New thread in your class
    - New comment on your thread
    - Subscription expiring soon
  - Email preferences per user
  
  **Keterangan:**
  - **Buat apa**: Mengirim email notification untuk event penting (bukan hanya push notification)
  - **Gunanya untuk apa**: User tetap informed meskipun tidak buka aplikasi, penting untuk event yang sangat penting
  - **Supaya apa**: User tidak ketinggalan informasi penting, engagement lebih baik, dan aplikasi lebih reliable dalam komunikasi

#### 9.5 Export Data
- [ ] **Export history ke PDF/CSV**
  - File: `pages/api/export/history.ts` (baru)
  - File: `components/history/ExportButton.tsx` (baru)
  - Format: PDF (dengan library seperti `pdfkit` atau `jspdf`)
  - Format: CSV (simple CSV generation)
  
  **Keterangan:**
  - **Buat apa**: Membuat fitur untuk export history tugas ke file PDF atau CSV
  - **Gunanya untuk apa**: User bisa menyimpan history tugas mereka, bisa digunakan untuk reporting atau dokumentasi
  - **Supaya apa**: User bisa backup data mereka sendiri, bisa digunakan untuk keperluan lain (seperti laporan), dan data lebih portable

#### 9.6 Collaboration Features
- [ ] **@mention users dalam comments**
  - File: `components/threads/CommentInput.tsx` (update)
  - Autocomplete untuk @mentions
  - Notifikasi untuk mentioned users
  - Highlight mentions di comments
  
  **Keterangan:**
  - **Buat apa**: Menambahkan fitur @mention untuk mention user lain dalam comment
  - **Gunanya untuk apa**: User bisa mention user lain untuk menarik perhatian, kolaborasi lebih baik
  - **Supaya apa**: Kolaborasi lebih efektif, user yang di-mention langsung dapat notifikasi, dan engagement lebih baik

#### 9.7 Threaded Comments
- [ ] **Reply to specific comments**
  - File: `prisma/schema.prisma` (update)
  - Add `parentCommentId` to Comment model
  - File: `components/threads/CommentThread.tsx` (baru)
  - Nested comment display
  - Indentation untuk replies

#### 9.8 Statistics Dashboard
- [ ] **Personal statistics dashboard**
  - File: `app/stats/page.tsx` (baru)
  - Show:
    - Tasks completed this week/month
    - Productivity trends (chart)
    - Most active subjects
    - Completion rate

#### 9.9 Class Statistics (Danton/Admin)
- [ ] **Class statistics untuk danton/admin**
  - File: `components/danton/ClassStats.tsx` (baru)
  - Show:
    - Class completion rate
    - Most active students
    - Subject distribution
    - Weekly/monthly trends

### 10. Security Checklist

- [ ] **Rate limiting** (lihat 1.1)
- [ ] **Input sanitization** untuk prevent XSS
  - File: `lib/utils/sanitize.ts` (baru)
  - Sanitize HTML di user inputs
  - Use library seperti `DOMPurify`
- [ ] **SQL injection protection**
  - Review semua raw queries (jika ada)
  - Pastikan semua menggunakan Prisma (sudah safe)
- [ ] **Password strength requirements**
  - File: `server/trpc/routers/auth.ts` (update)
  - Min 8 chars, uppercase, lowercase, number
  - Show password strength indicator
- [ ] **Session timeout**
  - File: `pages/api/auth/[...nextauth].ts` (update)
  - Auto-logout setelah 30 menit inactive
  - Show warning sebelum timeout
- [ ] **2FA untuk admin accounts**
  - File: `lib/2fa.ts` (baru)
  - Use library seperti `speakeasy` atau `otplib`
  - QR code untuk setup
  - Backup codes
- [ ] **Audit log untuk admin actions**
  - File: `prisma/schema.prisma` (update)
  - Model `AuditLog` baru
  - Log: user actions, admin actions, danton actions
  - View di admin panel

### 11. Documentation

#### 11.1 Update README
- [ ] **Update README.md dengan current stack**
  - File: `README.md` (update)
  - Remove localStorage mentions
  - Update dengan:
    - Current tech stack (Next.js, tRPC, Prisma, PostgreSQL)
    - Current features
    - Setup instructions
    - Deployment guide

#### 11.2 API Documentation
- [ ] **Generate API documentation**
  - Use: OpenAPI/Swagger atau tRPC OpenAPI
  - File: `docs/API.md` (baru)
  - Document semua endpoints
  - Request/response examples

#### 11.3 Deployment Guide
- [ ] **Lengkap deployment guide**
  - File: `docs/DEPLOYMENT.md` (baru)
  - Step-by-step deployment
  - Environment variables setup
  - Database migration
  - Troubleshooting common issues

#### 11.4 Developer Guide
- [ ] **Developer onboarding guide**
  - File: `docs/DEVELOPER-GUIDE.md` (baru)
  - Project structure
  - Development setup
  - Code conventions
  - Testing guide
  - Contributing guidelines

### 12. Mobile App Improvements

#### 12.1 Offline Support
- [ ] **Implementasi service worker untuk offline**
  - File: `public/sw.js` (baru)
  - Cache static assets
  - Cache API responses
  - Offline fallback page
  - Sync when online

#### 12.2 Better Update Mechanism
- [ ] **Improve app update mechanism**
  - File: `components/AppUpdateChecker.tsx` (update)
  - Show update progress
  - Background download
  - Install prompt
  - Changelog display

#### 12.3 App Performance
- [ ] **Optimize bundle size**
  - Analyze bundle dengan `@next/bundle-analyzer`
  - Code splitting untuk routes
  - Lazy load heavy components
  - Optimize images

#### 12.4 Android Improvements
- [ ] **Improve Android clipboard handling**
  - File: `app/auth/signin/page.tsx` (update)
  - Test di berbagai Android versions
  - Fallback untuk older Android versions

---

## 📊 Progress Tracking

### Overall Progress
- **Total Tasks**: ~80 tasks
- **Completed**: 0
- **In Progress**: 0
- **Not Started**: ~80

### By Category
- **Security**: 0/10 (0%)
- **Performance**: 0/8 (0%)
- **Testing**: 0/4 (0%)
- **UI/UX**: 0/4 (0%)
- **Code Quality**: 0/4 (0%)
- **Monitoring**: 0/3 (0%)
- **Features**: 0/9 (0%)
- **Documentation**: 0/4 (0%)
- **Mobile**: 0/4 (0%)

---

## 🎯 Quick Wins (Bisa dikerjakan cepat)

1. **Console.log cleanup** - Hapus console.log dari production code
2. **Refetch interval optimization** - Ubah dari 2s ke 5s dengan conditional
3. **Skeleton loading** - Replace loading spinner dengan skeleton
4. **Toast queue** - Limit toast yang muncul sekaligus
5. **TypeScript strict mode** - Enable dan fix type errors
6. **Database indexes** - Review dan tambahkan indexes yang missing
7. **Error messages** - Improve user-friendly error messages
8. **README update** - Update README dengan current state

---

## 📝 Notes

- **Prioritas**: High → Medium → Low
- **Estimasi waktu**: Setiap task bisa memakan 1-8 jam tergantung kompleksitas
- **Dependencies**: Beberapa task bergantung pada task lain (contoh: testing setup sebelum write tests)
- **Review**: Review progress setiap minggu
- **Update**: Update file ini setiap kali task selesai

---

**Happy Coding! 🚀**

