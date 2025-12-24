# 🚀 Cara Push ke GitHub

## ⚠️ Masalah

Anda mendapat error karena:
1. **Anda berada di folder `android`** - perlu pindah ke root project
2. **Git repository belum diinisialisasi** - perlu setup Git dulu

## ✅ Solusi Langkah Demi Langkah

### Step 1: Pindah ke Root Project

**Masalah**: Anda berada di folder `android`

**Solusi**: Naik ke root project

```powershell
# Dari folder android, naik ke root
cd ..

# Atau langsung ke root
cd C:\Users\erlan\Downloads\TuntasinAja-Testing\TuntasinAja-Testing

# Verifikasi Anda di root
Get-Location
# Harusnya: C:\Users\erlan\Downloads\TuntasinAja-Testing\TuntasinAja-Testing
```

### Step 2: Setup Git (Jika Belum)

**Cek apakah Git sudah diinisialisasi:**

```powershell
# Di root project, jalankan:
if (Test-Path ".git") {
    Write-Host "Git sudah ada"
} else {
    Write-Host "Git belum ada, menginisialisasi..."
    git init
}
```

**Atau manual:**

```powershell
# Inisialisasi Git
git init
```

### Step 3: Setup Git Config (Jika Perlu)

```powershell
# Setup user name dan email (hanya sekali, jika belum)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Step 4: Buat Repository di GitHub

1. Buka https://github.com
2. Klik **"+"** → **"New repository"**
3. Nama repository: `tuntasinaja` (atau nama lain)
4. Pilih **Public** (untuk GitHub Actions gratis)
5. **JANGAN** centang "Initialize with README"
6. Klik **"Create repository"**
7. Copy URL repository (contoh: `https://github.com/username/tuntasinaja.git`)

### Step 5: Tambahkan Remote GitHub

```powershell
# Ganti URL dengan repository Anda
git remote add origin https://github.com/username/tuntasinaja.git

# Atau jika remote sudah ada, update URL:
git remote set-url origin https://github.com/username/tuntasinaja.git

# Cek remote
git remote -v
```

### Step 6: Add dan Commit Files

```powershell
# Pastikan Anda di root project!
cd C:\Users\erlan\Downloads\TuntasinAja-Testing\TuntasinAja-Testing

# Add semua file
git add .

# Commit
git commit -m "Setup iOS build dengan GitHub Actions"
```

### Step 7: Push ke GitHub

```powershell
# Push ke GitHub (pertama kali)
git push -u origin main

# Atau jika branch Anda 'master'
git push -u origin master
```

## 📝 Command Lengkap (Copy-Paste)

**Jalankan di PowerShell (di root project):**

```powershell
# 1. Pindah ke root project
cd C:\Users\erlan\Downloads\TuntasinAja-Testing\TuntasinAja-Testing

# 2. Inisialisasi Git (jika belum)
if (-not (Test-Path ".git")) {
    git init
}

# 3. Setup remote (GANTI URL dengan repository Anda!)
git remote add origin https://github.com/username/tuntasinaja.git
# Atau jika sudah ada:
# git remote set-url origin https://github.com/username/tuntasinaja.git

# 4. Add semua file
git add .

# 5. Commit
git commit -m "Setup iOS build dengan GitHub Actions"

# 6. Push ke GitHub
git push -u origin main
```

## 🔍 Troubleshooting

### Error: "remote origin already exists"

```powershell
# Hapus remote lama
git remote remove origin

# Tambahkan remote baru
git remote add origin https://github.com/username/tuntasinaja.git
```

### Error: "fatal: not a git repository"

Pastikan Anda di root project, bukan di folder `android`:

```powershell
# Cek lokasi Anda
Get-Location
# Harusnya: ...\TuntasinAja-Testing\TuntasinAja-Testing
# Bukan: ...\TuntasinAja-Testing\TuntasinAja-Testing\android

# Jika di android, naik ke root:
cd ..
```

### Error: "Please tell me who you are"

Setup Git config:

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Error: "authentication failed"

1. Gunakan **Personal Access Token** (bukan password)
2. Atau setup SSH key
3. Atau gunakan GitHub Desktop

## ✅ Setelah Push Berhasil

Setelah push berhasil:

1. **Buka repository di GitHub**: https://github.com/username/tuntasinaja
2. **Klik tab "Actions"**
3. **Workflow "Build iOS IPA" akan muncul**
4. **Klik "Run workflow"** untuk build pertama kali
5. **Tunggu build selesai** (5-10 menit)
6. **Download IPA** dari artifacts

---

**Penting**: Pastikan Anda di root project, bukan di folder `android`! ✅

