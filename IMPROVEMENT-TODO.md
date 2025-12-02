# 📋 TODO - Saran Perbaikan dan Penambahan Fitur

Dokumentasi lengkap untuk semua saran, masukan, penambahan, dan perbaikan yang direkomendasikan untuk meningkatkan aplikasi TuntasinAja.

**Last Updated**: 2025-01-27  
**Status**: 🟡 Planning

---

## 🔴 PRIORITAS TINGGI (High Priority)

### 1. Keamanan dan Autentikasi

#### 1.1 Rate Limiting
- [ ] **Implementasi rate limiting middleware untuk tRPC**
  - File: `server/trpc/middleware/rateLimit.ts` (baru)
  - Gunakan library seperti `@upstash/ratelimit` atau `express-rate-limit`
  - Limit: 10 requests per 10 detik per user/IP
  - Apply ke semua mutation endpoints
  - Error code: `TOO_MANY_REQUESTS`

#### 1.2 Input Validation
- [ ] **Perkuat Zod validation schema**
  - File: `server/trpc/routers/*.ts`
  - Tambahkan validasi lebih ketat untuk:
    - Email format (regex validation)
    - Password strength (min 8 chars, uppercase, lowercase, number)
    - Thread title (max length, sanitize HTML)
    - Comment content (max 5000 chars, sanitize HTML)
  - Tambahkan `z.string().trim()` untuk semua string inputs

#### 1.3 Console.log Cleanup
- [ ] **Hapus semua console.log dari production code**
  - File: `server/trpc/routers/*.ts`
  - Ganti dengan logging library (Winston/Pino)
  - File: `lib/logger.ts` (baru)
  - Log level: error, warn, info, debug
  - Environment-based logging (tidak log di production kecuali error)

#### 1.4 CSRF Protection
- [ ] **Implementasi CSRF token untuk mutation operations**
  - File: `lib/csrf.ts` (baru)
  - Generate CSRF token saat login
  - Validate CSRF token untuk semua POST/PUT/DELETE requests
  - Store token di session/cookie

### 2. Database Management

#### 2.1 Complete Cleanup Tasks
- [ ] **Implementasi semua task dari DATABASE-MANAGEMENT-TODO.md**
  - File: `pages/api/cron/cleanup-history.ts` (baru)
  - File: `pages/api/cron/cleanup-inactive-threads.ts` (baru)
  - File: `pages/api/admin/database-stats.ts` (baru)
  - Update `vercel.json` dengan cron jobs baru
  - Schedule:
    - `00:00` - auto-delete-threads (sudah ada)
    - `02:00` - cleanup-user-statuses (sudah ada)
    - `03:00` - cleanup-history (baru)
    - `04:00` - cleanup-inactive-threads (baru)

#### 2.2 Database Monitoring
- [ ] **Setup database size monitoring**
  - File: `pages/api/admin/database-stats.ts`
  - Endpoint untuk melihat:
    - Total rows per table
    - Estimated size per table
    - Oldest records
    - Database size usage
  - Alert jika size > 80% dari limit (400MB dari 500MB)

#### 2.3 Database Backup Strategy
- [ ] **Dokumentasi backup strategy**
  - File: `docs/DATABASE-BACKUP.md` (baru)
  - Setup automated backup (Supabase sudah punya)
  - Retention policy: 7 hari daily, 4 minggu weekly
  - Test restore procedure

### 3. Performance Optimization

#### 3.1 Refetch Interval Optimization
- [ ] **Optimasi refetch interval yang terlalu agresif**
  - File: `components/pages/FeedPage.tsx`
  - Ubah `refetchInterval: 2000` menjadi conditional:
    ```typescript
    refetchInterval: (query) => {
      if (document.hidden) return false // Stop polling jika tab tidak aktif
      return 5000 // 5 detik lebih reasonable
    }
    ```

#### 3.2 Pagination
- [ ] **Implementasi pagination untuk thread list**
  - File: `server/trpc/routers/thread.ts`
  - Tambahkan input: `page`, `limit` (default: 20, max: 50)
  - Return: `{ threads, total, page, totalPages }`
  - File: `components/pages/FeedPage.tsx`
  - Tambahkan pagination controls (prev/next, page numbers)

#### 3.3 Query Optimization
- [ ] **Fix N+1 query problems**
  - File: `server/trpc/routers/thread.ts`
  - Gunakan `include` atau `select` yang tepat
  - Batch queries jika memungkinkan
  - Review semua router untuk query optimization

#### 3.4 Caching Strategy
- [ ] **Implementasi caching yang lebih baik**
  - File: `lib/trpc.ts`
  - Setup React Query cache dengan:
    - `staleTime: 30000` (30 detik untuk queries)
    - `cacheTime: 300000` (5 menit)
  - Invalidate cache dengan lebih tepat (tidak semua invalidate)

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

### 4. Error Handling dan Logging

#### 4.1 Centralized Error Handling
- [ ] **Buat centralized error handling**
  - File: `lib/error-handler.ts` (baru)
  - Class `AppError` dengan code, statusCode, userMessage
  - Error mapping untuk user-friendly messages
  - Error logging ke external service (Sentry)

#### 4.2 Error Tracking
- [ ] **Setup error tracking dengan Sentry**
  - Install: `@sentry/nextjs`
  - File: `sentry.client.config.ts`, `sentry.server.config.ts` (baru)
  - Setup di `app/providers.tsx`
  - Track errors, performance, user sessions

#### 4.3 User-Friendly Error Messages
- [ ] **Improve error messages untuk user**
  - File: `components/ui/ErrorDisplay.tsx` (baru)
  - Tampilkan error yang user-friendly
  - Hide technical details dari user
  - Tambahkan retry button untuk recoverable errors

#### 4.4 Error Recovery
- [ ] **Improve error recovery mechanism**
  - File: `components/ErrorBoundary.tsx` (update)
  - Tambahkan retry dengan exponential backoff
  - Show error details untuk development
  - Auto-retry untuk network errors

---

## 🟡 PRIORITAS SEDANG (Medium Priority)

### 5. Testing

#### 5.1 Setup Testing Framework
- [ ] **Setup Jest dan Testing Library**
  - File: `jest.config.js` (baru)
  - File: `jest.setup.js` (baru)
  - Install: `jest`, `@testing-library/react`, `@testing-library/jest-dom`

#### 5.2 Unit Tests
- [ ] **Write unit tests untuk business logic**
  - File: `__tests__/lib/date-utils.test.ts` (baru)
  - File: `__tests__/server/trpc/routers/thread.test.ts` (baru)
  - File: `__tests__/server/trpc/routers/auth.test.ts` (baru)
  - Test coverage target: 70%+

#### 5.3 Integration Tests
- [ ] **Write integration tests untuk API endpoints**
  - File: `__tests__/api/trpc.test.ts` (baru)
  - Test critical flows:
    - User registration/login
    - Thread creation
    - Comment addition
    - Status toggle

#### 5.4 E2E Tests
- [ ] **Setup Playwright untuk E2E tests**
  - File: `playwright.config.ts` (baru)
  - Test critical user flows:
    - Complete login → create thread → add comment → mark complete
    - Admin panel workflows
    - Danton workflows

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

#### 6.2 Toast Queue Management
- [ ] **Implementasi toast queue untuk prevent spam**
  - File: `components/ui/ToastContainer.tsx` (update)
  - Limit: maksimal 3 toast sekaligus
  - Queue system untuk pending toasts
  - Auto-dismiss oldest toast jika limit tercapai

#### 6.3 Dark Mode
- [ ] **Implementasi dark mode**
  - File: `app/globals.css` (update)
  - File: `components/ui/ThemeToggle.tsx` (baru)
  - CSS variables untuk dark theme
  - Store preference di localStorage
  - Toggle di Header component

#### 6.4 Accessibility
- [ ] **Improve accessibility**
  - Tambahkan ARIA labels untuk semua interactive elements
  - Keyboard navigation support
  - Screen reader support
  - Focus management untuk modals
  - Color contrast compliance (WCAG AA)

### 7. Code Quality

#### 7.1 TypeScript Strict Mode
- [ ] **Enable TypeScript strict mode**
  - File: `tsconfig.json` (update)
  - Enable: `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`
  - Fix semua type errors
  - Remove semua `as any` type assertions

#### 7.2 Code Splitting
- [ ] **Split large components**
  - File: `components/pages/FeedPage.tsx` (refactor)
  - Extract:
    - SearchAndFilter component
    - ThreadList component
    - ReminderHandler component
  - Lazy load heavy components

#### 7.3 Extract Common Logic
- [ ] **Create utility functions untuk common logic**
  - File: `lib/utils/thread-helpers.ts` (baru)
  - File: `lib/utils/user-helpers.ts` (baru)
  - File: `lib/utils/date-helpers.ts` (baru)
  - Extract duplicate code

#### 7.4 Code Formatting
- [ ] **Setup Prettier dan ESLint**
  - File: `.prettierrc` (baru)
  - File: `.eslintrc.json` (update)
  - Pre-commit hooks dengan Husky
  - Auto-format on save

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

#### 8.2 Performance Monitoring
- [ ] **Track Web Vitals**
  - File: `lib/analytics.ts` (baru)
  - Track: LCP, FID, CLS
  - Send to analytics service
  - Alert jika performance degradation

#### 8.3 Uptime Monitoring
- [ ] **Setup uptime monitoring**
  - Service: UptimeRobot atau Pingdom
  - Monitor: Main API endpoint
  - Alert: Email/SMS jika down
  - Status page untuk public

### 9. Fitur Tambahan

#### 9.1 Search Functionality
- [ ] **Full-text search untuk threads dan comments**
  - File: `server/trpc/routers/search.ts` (baru)
  - Use PostgreSQL full-text search atau external service (Algolia/Meilisearch)
  - Search by: title, content, author
  - Highlight search results

#### 9.2 Advanced Filters
- [ ] **Advanced filter untuk threads**
  - File: `components/pages/FeedPage.tsx` (update)
  - Filter by:
    - Date range (from - to)
    - Author
    - Subject
    - Completion status
    - Class

#### 9.3 In-App Notifications
- [ ] **In-app notifications center**
  - File: `components/notifications/NotificationCenter.tsx` (baru)
  - File: `server/trpc/routers/notification.ts` (update)
  - Store notifications di database
  - Real-time updates dengan polling atau WebSocket
  - Mark as read functionality

#### 9.4 Email Notifications
- [ ] **Email notifications untuk important events**
  - Service: SendGrid, Resend, atau Nodemailer
  - Events:
    - New thread in your class
    - New comment on your thread
    - Subscription expiring soon
  - Email preferences per user

#### 9.5 Export Data
- [ ] **Export history ke PDF/CSV**
  - File: `pages/api/export/history.ts` (baru)
  - File: `components/history/ExportButton.tsx` (baru)
  - Format: PDF (dengan library seperti `pdfkit` atau `jspdf`)
  - Format: CSV (simple CSV generation)

#### 9.6 Collaboration Features
- [ ] **@mention users dalam comments**
  - File: `components/threads/CommentInput.tsx` (update)
  - Autocomplete untuk @mentions
  - Notifikasi untuk mentioned users
  - Highlight mentions di comments

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

