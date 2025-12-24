# 🔧 Fix: Gradle Tidak Support Java 25

## ❌ Error

```
Unsupported class file major version 69
```

**Class file major version 69 = Java 25**

Gradle 8.2.1 hanya support sampai Java 21 (major version 65).

## ✅ Solusi yang Sudah Diterapkan

### 1. Update Gradle Wrapper

File `android/gradle/wrapper/gradle-wrapper.properties` sudah diupdate:
- **Dari:** Gradle 8.2.1
- **Ke:** Gradle 8.10.2 (support Java 25)

### 2. Update Android Gradle Plugin

File `android/build.gradle` sudah diupdate:
- **Dari:** Android Gradle Plugin 8.2.1
- **Ke:** Android Gradle Plugin 8.7.3

## 🚀 Build Sekarang

Jalankan build lagi:

```powershell
.\build-android-d-drive.ps1
```

Gradle akan otomatis download versi 8.10.2 saat pertama kali build.

## 📝 Catatan

- **Java 25** adalah versi yang sangat baru
- **Gradle 8.10.2** support Java 25
- Build pertama kali akan download Gradle 8.10.2 (sekitar 150MB)
- Download akan disimpan di `D:\gradle\wrapper\dists\`

## ⚠️ Alternatif: Gunakan Java 17 (Lebih Stabil)

Jika ingin menggunakan Java 17 (LTS) yang lebih stabil:

1. Install Java 17 dari: https://adoptium.net/temurin/releases/?version=17
2. Update JAVA_HOME:
   ```powershell
   $env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot"
   ```
3. Bisa tetap menggunakan Gradle 8.2.1

---

**Gradle sudah diupdate untuk support Java 25!** 🚀

