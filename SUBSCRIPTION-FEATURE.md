# 🎫 Fitur Class Subscription

Dokumentasi lengkap untuk fitur Class Subscription di TuntasinAja.

## 📋 Overview

Fitur Class Subscription memungkinkan admin untuk mengatur durasi pemakaian aplikasi per kelas. Setiap kelas memiliki subscription tersendiri, dan jika subscription habis, semua fitur kelas tersebut akan dinonaktifkan untuk semua user di kelas tersebut.

## 🎯 Fitur-Fitur

### 1. **Admin - Set/Extend Subscription**
- Admin dapat set subscription baru untuk kelas tertentu
- Admin dapat extend subscription yang sudah ada
- Input durasi dalam format **days** (hari)
- Extend subscription dihitung dari `endDate` yang ada (bukan reset dari sekarang)
- Contoh: 3 bulan = 90 days, 6 bulan = 180 days, 1 tahun = 365 days

### 2. **Admin - Lihat Semua Subscription**
- List semua kelas dengan status subscription mereka
- Status subscription:
  - **Active** (Aktif): Subscription masih berlaku
  - **Expiring Soon** (Akan Berakhir): Subscription akan habis dalam ≤7 hari
  - **Expired** (Habis): Subscription sudah habis
  - **No Subscription** (Belum Ada): Kelas belum memiliki subscription
- Tampilkan tanggal berakhir dan sisa durasi

### 3. **Danton - Lihat Status Subscription**
- Danton dapat melihat status subscription kelasnya
- Tampilkan:
  - Status (Aktif/Akan Berakhir/Habis)
  - Tanggal berakhir
  - Sisa durasi (hari dan jam)
- Warning/alert jika subscription akan habis atau sudah habis
- Fitur management otomatis dinonaktifkan jika subscription expired

### 4. **User - Disable Fitur saat Expired**
- Jika subscription expired:
  - Tidak bisa create thread
  - Tidak bisa add/edit comment
  - Tidak bisa edit thread/comment
  - Warning message ditampilkan di FeedPage dan ThreadQuickView
- Admin tidak terpengaruh (selalu bisa semua fitur)

### 5. **Validasi Backend**
- Validasi subscription status sebelum allow create/edit thread/comment
- Error message yang jelas jika subscription expired
- Admin skip validasi subscription

## 🗄️ Database Schema

### Model: ClassSubscription

```prisma
model ClassSubscription {
  id                 String   @id @default(cuid())
  kelas              String   @unique @map("kelas")
  subscriptionEndDate DateTime @map("subscription_end_date")
  createdAt          DateTime @default(now()) @map("created_at")
  updatedAt          DateTime @updatedAt @map("updated_at")

  @@map("class_subscriptions")
}
```

## 📁 File & Components

### Backend
- `server/trpc/routers/subscription.ts` - Router subscription dengan semua procedures
- `server/trpc/routers/thread.ts` - Updated untuk check subscription
- `prisma/schema.prisma` - Model ClassSubscription
- `scripts/migrate-class-subscription.sql` - Migration SQL

### Frontend
- `hooks/useClassSubscription.ts` - Hook untuk check subscription
- `components/danton/SubscriptionStatusCard.tsx` - Card untuk danton melihat status
- `components/admin/SubscriptionList.tsx` - List semua subscription untuk admin
- `components/admin/ClassSubscriptionManager.tsx` - Form untuk set/extend subscription
- `components/danton/DantonDashboard.tsx` - Updated untuk show subscription status
- `components/pages/FeedPage.tsx` - Updated untuk check subscription
- `components/threads/ThreadQuickView.tsx` - Updated untuk check subscription

## 🚀 Cara Testing

### 1. **Setup Database (Penting!)**

Jalankan migration SQL di Supabase:

1. Buka Supabase Dashboard
2. Klik **SQL Editor**
3. Copy dan paste isi file `scripts/migrate-class-subscription.sql`
4. Klik **Run**

### 2. **Test Admin - Set Subscription**

1. Login sebagai **Admin**
2. Buka **Profile** → **Panel Admin**
3. Klik tab **Manajemen Subscription**
4. Klik tombol **Set Subscription** pada kelas yang ingin di-set
5. Isi durasi (misal: 90 untuk 3 bulan)
6. Pilih **Set Subscription Baru**
7. Klik **Set Subscription**
8. Verifikasi: Status berubah menjadi "Aktif" dan tanggal berakhir ter-update

### 3. **Test Admin - Extend Subscription**

1. Login sebagai **Admin**
2. Buka **Profile** → **Panel Admin** → **Manajemen Subscription**
3. Pilih kelas yang sudah ada subscription
4. Klik tombol **Extend**
5. Isi durasi tambahan (misal: 30 hari)
6. Klik **Extend Subscription**
7. Verifikasi: Tanggal berakhir diperpanjang dan sisa durasi bertambah

### 4. **Test Danton - Lihat Status**

1. Login sebagai **Danton** (pastikan sudah ada subscription untuk kelasnya)
2. Buka **Danton Panel** (Profile → Danton Panel)
3. Lihat **SubscriptionStatusCard** di bagian atas
4. Verifikasi:
   - Status subscription ditampilkan
   - Tanggal berakhir ditampilkan
   - Sisa durasi (hari) ditampilkan
   - Warning muncul jika ≤7 hari tersisa

### 5. **Test Subscription Expired**

**Cara 1: Set tanggal expired manual di database**
```sql
UPDATE class_subscriptions 
SET subscription_end_date = NOW() - INTERVAL '1 day'
WHERE kelas = 'X RPL 1';
```

**Cara 2: Set subscription dengan durasi 0 hari (akan expired)**

1. Login sebagai **Admin**
2. Set subscription dengan durasi **0 hari** (atau update manual di database)
3. Login sebagai **User di kelas tersebut**
4. Verifikasi:
   - FAB button di FeedPage tidak muncul
   - Warning muncul: "Subscription habis - Tidak dapat membuat/mengedit"
   - Form add comment di ThreadQuickView tidak muncul
   - Warning muncul di ThreadQuickView
   - Danton dashboard menampilkan warning besar
   - Fitur management danton dinonaktifkan

### 6. **Test Subscription Expiring Soon**

**Cara: Set subscription dengan durasi ≤7 hari**

1. Login sebagai **Admin**
2. Set subscription dengan durasi **5 hari**
3. Login sebagai **Danton** dari kelas tersebut
4. Verifikasi:
   - Status badge berubah menjadi "Akan Berakhir"
   - Warning muncul di SubscriptionStatusCard
   - Sisa durasi ditampilkan

### 7. **Test Backend Validation**

1. Set subscription untuk kelas menjadi expired (via SQL)
2. Login sebagai **User** di kelas tersebut
3. Coba create thread
4. Verifikasi: Error message muncul "Subscription untuk kelas [kelas] sudah habis..."
5. Coba add comment
6. Verifikasi: Error message muncul "Subscription untuk kelas [kelas] sudah habis..."

### 8. **Test Extend Logic**

1. Login sebagai **Admin**
2. Set subscription untuk kelas dengan durasi **90 hari**
3. Catat tanggal berakhir
4. Extend dengan **30 hari** lagi
5. Verifikasi: Tanggal berakhir = tanggal berakhir lama + 30 hari (bukan dari sekarang + 30 hari)

### 9. **Test Admin Skip Validation**

1. Login sebagai **Admin**
2. Set subscription untuk kelas menjadi expired (via SQL)
3. Login sebagai **Admin** lagi
4. Verifikasi:
   - Admin tetap bisa create thread
   - Admin tetap bisa add/edit comment
   - Tidak ada warning subscription expired untuk admin

## 📝 Format Durasi

Durasi subscription diinput dalam format **days** (hari):

- 30 hari = 1 bulan
- 90 hari = 3 bulan
- 180 hari = 6 bulan
- 365 hari = 1 tahun
- Maksimal: 3650 hari (10 tahun)

## ⚠️ Catatan Penting

1. **Extend Subscription**: Durasi yang ditambahkan dihitung dari `endDate` yang ada, bukan dari sekarang
2. **Set Subscription Baru**: Jika sudah ada subscription aktif, akan di-extend dari `endDate` yang ada. Jika sudah expired, akan dibuat baru dari sekarang
3. **Admin Bypass**: Admin selalu bisa semua fitur, tidak terpengaruh subscription
4. **Expiring Soon**: Subscription dianggap "akan berakhir" jika sisa durasi ≤7 hari
5. **One Subscription per Class**: Satu kelas hanya punya satu subscription (unique constraint)

## 🐛 Troubleshooting

### Error: "Column class_subscriptions.subscription_end_date does not exist"
**Solusi**: Jalankan migration SQL terlebih dahulu (`scripts/migrate-class-subscription.sql`)

### Error: "Subscription untuk kelas sudah habis"
**Solusi**: Admin perlu extend subscription untuk kelas tersebut

### Warning tidak muncul di Danton Dashboard
**Solusi**: Pastikan hook `useClassSubscription` sudah di-import dan digunakan dengan benar

### Subscription tidak expired padahal sudah lewat tanggal
**Solusi**: Check timezone. Pastikan `getUTCDate()` menggunakan timezone yang benar

## ✅ Checklist Testing

- [ ] Migration SQL berhasil dijalankan
- [ ] Admin bisa set subscription baru
- [ ] Admin bisa extend subscription
- [ ] Admin bisa lihat list semua subscription
- [ ] Danton bisa lihat status subscription kelasnya
- [ ] Warning muncul jika subscription ≤7 hari tersisa
- [ ] Fitur management danton dinonaktifkan jika expired
- [ ] User tidak bisa create/edit thread/comment jika expired
- [ ] Warning muncul di FeedPage dan ThreadQuickView jika expired
- [ ] Admin skip validasi subscription
- [ ] Extend subscription dihitung dari endDate (bukan reset)
- [ ] Status badge sesuai dengan kondisi (Active/Expiring Soon/Expired)

---

**Happy Testing! 🎉**

