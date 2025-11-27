# Cara Build APK dengan Password

Karena bubblewrap membutuhkan input password secara interaktif, ikuti langkah berikut:

## Build APK dengan Password

1. Buka terminal/PowerShell di folder project
2. Jalankan command berikut:
   ```bash
   bubblewrap build --type=debug
   ```
3. Saat diminta password:
   - **Password for the Key Store:** `erlan210609`
   - **Password for the Key:** `erlan210609`
4. Tunggu proses build selesai
5. File APK akan ada di: `app/build/outputs/apk/debug/app-debug.apk`

## Atau Build Release

Untuk build release (untuk production):
```bash
bubblewrap build --type=release
```
Masukkan password yang sama saat diminta.

## File APK

Setelah build selesai, file APK ada di:
- Debug: `app/build/outputs/apk/debug/app-debug.apk`
- Release: `app/build/outputs/apk/release/app-release.apk`

