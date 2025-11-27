# 📦 Setup Git & Push ke GitHub

Panduan untuk setup Git repository dan push ke GitHub.

## ⚠️ Error yang Terjadi

Anda mendapat error:
```
fatal: not a git repository (or any of the parent directories): .git
```

Ini terjadi karena:
1. Anda berada di folder `android` (bukan root project)
2. Git repository belum diinisialisasi

## 🔧 Solusi

### Step 1: Pindah ke Root Project

Anda perlu berada di root project (bukan di folder `android`):

```powershell
# Dari folder android, naik ke root
cd ..

# Pastikan Anda di root project
Get-Location
# Harusnya: C:\Users\erlan\Downloads\TuntasinAja-Testing\TuntasinAja-Testing
```

### Step 2: Inisialisasi Git (Jika Belum)

Jika Git belum diinisialisasi:

```powershell
# Inisialisasi Git
git init

# Tambahkan remote GitHub (ganti dengan URL repository Anda)
git remote add origin https://github.com/username/tuntasinaja.git
```

### Step 3: Setup Git (Jika Perlu)

```powershell
# Setup user name dan email (hanya sekali)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Step 4: Add & Commit Files

```powershell
# Add semua file
git add .

# Commit
git commit -m "Setup iOS build dengan GitHub Actions"
```

### Step 5: Push ke GitHub

```powershell
# Push ke GitHub (pertama kali)
git push -u origin main

# Atau jika branch Anda 'master'
git push -u origin master
```

## 📝 Quick Script

Jalankan script berikut di PowerShell (di root project):

```powershell
# Pastikan di root project
cd C:\Users\erlan\Downloads\TuntasinAja-Testing\TuntasinAja-Testing

# Cek apakah git sudah diinisialisasi
if (-not (Test-Path ".git")) {
    Write-Host "Menginisialisasi Git repository..." -ForegroundColor Yellow
    git init
}

# Cek remote
$remote = git remote -v 2>&1
if ($remote -match "fatal") {
    Write-Host "Remote belum di-set. Silakan tambahkan manual:" -ForegroundColor Yellow
    Write-Host "  git remote add origin https://github.com/username/repo.git" -ForegroundColor Gray
} else {
    Write-Host "Remote sudah di-set:" -ForegroundColor Green
    git remote -v
}

# Status
git status
```

## 🔗 Setup GitHub Repository Baru

Jika Anda belum punya repository GitHub:

1. **Buka GitHub**: https://github.com
2. **Buat repository baru**:
   - Klik "+" → "New repository"
   - Nama: `tuntasinaja` (atau nama lain)
   - Pilih **Public** (untuk GitHub Actions gratis)
   - Jangan centang "Initialize with README"
   - Klik "Create repository"

3. **Copy URL repository** (contoh: `https://github.com/username/tuntasinaja.git`)

4. **Tambahkan remote**:
   ```powershell
   git remote add origin https://github.com/username/tuntasinaja.git
   ```

## ✅ Checklist

- [ ] Sudah di root project (bukan folder `android`)
- [ ] Git sudah diinisialisasi (`git init`)
- [ ] Remote GitHub sudah ditambahkan
- [ ] File sudah di-commit
- [ ] Push ke GitHub berhasil

## 🚀 Setelah Push Berhasil

Setelah push berhasil:

1. Buka repository di GitHub
2. Klik tab **Actions**
3. Workflow **"Build iOS IPA"** akan muncul
4. Klik **"Run workflow"** untuk build pertama kali

---

**Jika masih error, jalankan command berikut dan kirim output-nya:**

```powershell
cd C:\Users\erlan\Downloads\TuntasinAja-Testing\TuntasinAja-Testing
Get-Location
Test-Path ".git"
git status 2>&1
```

