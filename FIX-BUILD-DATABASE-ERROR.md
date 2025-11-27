# 🔧 Fix: Prisma Database URL Error saat Build

## ❌ Error

```
PrismaClientConstructorValidationError: Invalid value undefined for datasource "db" 
provided to PrismaClient constructor.
It should have this form: { url: "CONNECTION_STRING" }
```

## 🔍 Penyebab

Next.js build membutuhkan environment variable `DATABASE_URL` karena Prisma Client memvalidasi connection string saat inisialisasi, bahkan saat build.

## ✅ Solusi

### Opsi 1: Menggunakan Script Build (Recommended)

Script `build-android-d-drive.ps1` sudah diupdate untuk otomatis set dummy environment variables saat build. Tidak perlu setup manual.

### Opsi 2: Membuat File .env

Buat file `.env` di root project dengan dummy values:

```env
# Dummy values untuk build APK (tidak akan digunakan di mobile app)
DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
NEXTAUTH_SECRET="dummy-secret-key-for-build-only-min-32-chars-long"
NEXTAUTH_URL="http://localhost:3000"
```

**Catatan:** 
- File `.env` ini hanya untuk build
- Mobile app akan menggunakan server URL yang sudah dikonfigurasi di `capacitor.config.ts`
- Database connection tidak diperlukan di mobile app

### Opsi 3: Set Environment Variables di PowerShell

Sebelum build, set environment variables:

```powershell
$env:DATABASE_URL = "postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
$env:NEXTAUTH_SECRET = "dummy-secret-key-for-build-only-min-32-chars-long"
$env:NEXTAUTH_URL = "http://localhost:3000"
.\build-android-d-drive.ps1
```

## 📝 Penjelasan

1. **Mengapa butuh DATABASE_URL saat build?**
   - Next.js melakukan static analysis dan code generation saat build
   - Prisma Client memvalidasi schema dan connection string saat di-import
   - Meskipun tidak akan digunakan di mobile app, Next.js tetap perlu valid configuration

2. **Apakah database connection benar-benar digunakan?**
   - **TIDAK** - Mobile app akan menggunakan server URL (`https://tuntasinaja-livid.vercel.app`)
   - Database connection hanya diperlukan untuk server-side rendering yang tidak akan terjadi di mobile app
   - Build hanya menghasilkan static assets untuk frontend

3. **Apakah aman menggunakan dummy values?**
   - **YA** - Dummy values hanya untuk build process
   - Mobile app tidak akan menggunakan database connection langsung
   - Semua API calls akan pergi ke server URL yang sudah dikonfigurasi

## ✅ Verifikasi

Setelah fix, build seharusnya berjalan tanpa error:

```powershell
.\build-android-d-drive.ps1
```

Atau test build saja:

```powershell
.\build-android-d-drive.ps1 -SkipSync
```

---

**Dengan fix ini, build APK seharusnya berhasil!** 🚀

