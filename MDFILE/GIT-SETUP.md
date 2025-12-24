# Setup Git dan Push ke GitHub

## Repository: https://github.com/Albyehh/TuntasinAjaTest

## Langkah-langkah:

### 1. Initialize Git (jika belum)
```bash
cd E:\proyek\TuntasinAjaTest
git init
```

### 2. Set Remote Origin
```bash
git remote add origin https://github.com/Albyehh/TuntasinAjaTest.git
# atau jika sudah ada:
git remote set-url origin https://github.com/Albyehh/TuntasinAjaTest.git
```

### 3. Add All Files
```bash
git add .
```

### 4. Commit
```bash
git commit -m "Initial commit: TuntasinAjaTest project"
```

### 5. Set Branch to Main
```bash
git branch -M main
```

### 6. Push to GitHub
```bash
git push -u origin main
```

## Catatan:
- Pastikan Anda sudah login ke GitHub di terminal
- Jika perlu authentication, gunakan Personal Access Token (PAT)
- Repository di GitHub harus sudah dibuat dan kosong

## Troubleshooting:

### Jika push ditolak karena repository tidak kosong:
```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### Jika perlu authentication:
1. Buat Personal Access Token di GitHub Settings > Developer settings > Personal access tokens
2. Gunakan token sebagai password saat push

