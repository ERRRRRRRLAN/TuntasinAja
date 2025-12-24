# 🔧 Fix: gradlew.bat Tidak Ditemukan

## ❌ Error

```
The term '.\gradlew.bat' is not recognized as the name of a cmdlet, function, script file, or operable program.
```

## 🔍 Penyebab

File `gradlew.bat` (Gradle Wrapper) tidak ada di folder `android/`. Ini berarti Android project belum lengkap atau belum diinisialisasi dengan benar oleh Capacitor.

## ✅ Solusi

### Opsi 1: Menggunakan Script Build (Automatic)

Script `build-android-d-drive.ps1` sudah diupdate untuk otomatis mendeteksi dan membuat ulang Android project jika `gradlew.bat` tidak ditemukan.

Jalankan:
```powershell
.\build-android-d-drive.ps1
```

Script akan:
- ✅ Otomatis detect jika `gradlew.bat` tidak ada
- ✅ Hapus folder `android` lama
- ✅ Buat ulang Android project dengan `npx cap add android`
- ✅ Sync Capacitor
- ✅ Lanjutkan build APK

### Opsi 2: Manual Setup

1. **Hapus folder android lama:**
   ```powershell
   Remove-Item -Path android -Recurse -Force
   ```

2. **Tambahkan Android platform:**
   ```powershell
   npx cap add android
   ```

3. **Sync Capacitor:**
   ```powershell
   npx cap sync android
   ```

4. **Verifikasi gradlew.bat ada:**
   ```powershell
   Test-Path android\gradlew.bat
   ```

### Opsi 3: Menggunakan Android Studio

1. Install Android Studio
2. Buka Android Studio
3. File → Open → Pilih folder `android`
4. Android Studio akan otomatis setup Gradle wrapper

## 📝 Catatan

- `gradlew.bat` adalah Gradle Wrapper yang diperlukan untuk build Android project
- File ini biasanya dibuat otomatis oleh Capacitor saat pertama kali menambahkan Android platform
- Jika file tidak ada, Android project belum lengkap

## ✅ Verifikasi

Setelah fix, pastikan file ada:
```powershell
Test-Path android\gradlew.bat
```

Seharusnya return `True`.

---

**Dengan fix ini, build APK seharusnya bisa dilanjutkan!** 🚀

