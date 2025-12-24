# 🔧 Setup External Cron Job untuk Schedule Reminder

Karena Vercel Hobby plan hanya mendukung 1 cron job per hari, kita menggunakan external cron service (cron-job.org) untuk menjalankan 2 reminder (maghrib dan malam).

## ✅ Yang Sudah Diimplementasikan

1. ✅ **Endpoint Maghrib**: `pages/api/cron/schedule-reminder-maghrib.ts`
2. ✅ **Endpoint Malam**: `pages/api/cron/schedule-reminder-malam.ts`
3. ✅ **Update vercel.json**: Menghapus cron job schedule-reminder dari Vercel

## 📋 Yang Perlu Dilakukan Manual

### Step 1: Daftar/Login di cron-job.org

1. Buka https://cron-job.org
2. Daftar akun baru atau login jika sudah punya
3. Akun gratis sudah cukup untuk 2 cron jobs

### Step 2: Buat Cron Job 1 (Maghrib - 18:00 WIB)

1. Klik **"Create cronjob"** atau **"New cronjob"**
2. Isi form berikut:
   - **Title**: `Schedule Reminder Maghrib`
   - **Address (URL)**: 
     ```
     https://tuntasinaja-livid.vercel.app/api/cron/schedule-reminder-maghrib
     ```
   - **Request method**: Pilih **POST**
   - **Execution schedule**: 
     - Pilih **"Once a day"** atau **"Custom"**
     - Jika custom, isi: `0 18 * * *` (18:00 WIB)
   - **Timezone**: Pilih **`Asia/Jakarta`** (WIB)
   - **Request headers** (opsional, jika menggunakan CRON_SECRET):
     - Klik **"Add header"**
     - **Name**: `Authorization`
     - **Value**: `Bearer YOUR_CRON_SECRET`
       (Ganti `YOUR_CRON_SECRET` dengan nilai dari Vercel environment variable `CRON_SECRET`)
3. Klik **"Create cronjob"** atau **"Save"**

### Step 3: Buat Cron Job 2 (Malam - 21:00 WIB)

1. Klik **"Create cronjob"** atau **"New cronjob"** lagi
2. Isi form berikut:
   - **Title**: `Schedule Reminder Malam`
   - **Address (URL)**: 
     ```
     https://tuntasinaja-livid.vercel.app/api/cron/schedule-reminder-malam
     ```
   - **Request method**: Pilih **POST**
   - **Execution schedule**: 
     - Pilih **"Once a day"** atau **"Custom"**
     - Jika custom, isi: `0 21 * * *` (21:00 WIB)
   - **Timezone**: Pilih **`Asia/Jakarta`** (WIB)
   - **Request headers** (sama seperti di atas jika menggunakan CRON_SECRET):
     - Klik **"Add header"**
     - **Name**: `Authorization`
     - **Value**: `Bearer YOUR_CRON_SECRET`
3. Klik **"Create cronjob"** atau **"Save"**

### Step 4: Test Manual (Opsional)

Sebelum menunggu schedule, bisa test manual:

**Test Maghrib endpoint:**
```bash
curl -X POST https://tuntasinaja-livid.vercel.app/api/cron/schedule-reminder-maghrib \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Test Malam endpoint:**
```bash
curl -X POST https://tuntasinaja-livid.vercel.app/api/cron/schedule-reminder-malam \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Atau test langsung di cron-job.org dengan klik tombol **"Execute now"** atau **"Run now"**.

## ⚙️ Konfigurasi

### Environment Variables

Pastikan di Vercel sudah di-set:
- `CRON_SECRET` (opsional, untuk autentikasi)
- `FIREBASE_SERVICE_ACCOUNT` (wajib, untuk push notification)

### Schedule Time

Dengan timezone **Asia/Jakarta**:
- **Maghrib**: `0 18 * * *` (18:00 WIB / 6 PM)
- **Malam**: `0 21 * * *` (21:00 WIB / 9 PM)

**Catatan**: Pastikan timezone di cron-job.org di-set ke **Asia/Jakarta**, bukan UTC.

## 🔍 Monitoring

Di cron-job.org, Anda bisa:
- Melihat history execution
- Melihat response dari endpoint
- Melihat error jika ada
- Mengaktifkan/menonaktifkan cron job

## 📝 Catatan

1. **Gratis**: cron-job.org gratis untuk 2 cron jobs (sudah cukup)
2. **Reliability**: cron-job.org cukup reliable untuk production use
3. **Alternative**: Jika perlu lebih banyak cron jobs atau fitur premium, bisa upgrade ke cron-job.org Pro atau gunakan service lain seperti EasyCron, GitHub Actions, dll.

## 🚀 Setelah Setup

Setelah kedua cron job dibuat di cron-job.org:
1. Cron jobs akan otomatis berjalan sesuai schedule
2. Notifikasi akan dikirim ke semua user di kelas yang memiliki jadwal untuk besok
3. User bisa klik notifikasi untuk membuka aplikasi dengan filter aktif

## ⚠️ Troubleshooting

### Cron job tidak berjalan
- Check apakah cron job sudah diaktifkan di cron-job.org
- Check schedule time (pastikan UTC, bukan WIB)
- Check URL endpoint (pastikan benar dan accessible)

### Notifikasi tidak terkirim
- Check logs di cron-job.org untuk melihat response
- Check Firebase configuration
- Check apakah ada jadwal untuk besok
- Check apakah ada device tokens terdaftar

### Error 401 Unauthorized
- Pastikan `CRON_SECRET` sudah di-set di Vercel
- Pastikan header Authorization sudah di-set dengan benar di cron-job.org
- Format: `Bearer YOUR_CRON_SECRET` (dengan spasi setelah Bearer)

