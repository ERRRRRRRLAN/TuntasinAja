# Instruksi Push ke GitHub

## Repository: https://github.com/Albyehh/TuntasinAjaTest

## Cara 1: Menggunakan Batch File (Paling Mudah)

1. Double-click file `git-push.bat` di folder TuntasinAjaTest
2. Ikuti instruksi di terminal
3. Jika diminta password, gunakan Personal Access Token (PAT) dari GitHub

## Cara 2: Manual di Terminal/PowerShell

Buka terminal di folder `E:\proyek\TuntasinAjaTest` dan jalankan:

```bash
# 1. Initialize git
git init

# 2. Set remote
git remote add origin https://github.com/Albyehh/TuntasinAjaTest.git

# 3. Add files
git add .

# 4. Commit
git commit -m "Initial commit: TuntasinAjaTest project"

# 5. Set branch
git branch -M main

# 6. Push
git push -u origin main
```

## Cara 3: Menggunakan PowerShell Script

```powershell
cd E:\proyek\TuntasinAjaTest
powershell -ExecutionPolicy Bypass -File push-to-github.ps1
```

## Authentication

Jika diminta username/password:
- **Username**: `Albyehh`
- **Password**: Gunakan Personal Access Token (PAT)

### Cara Buat Personal Access Token:

1. Buka GitHub → Settings
2. Developer settings → Personal access tokens → Tokens (classic)
3. Generate new token (classic)
4. Beri nama: "TuntasinAjaTest"
5. Pilih scope: `repo` (full control of private repositories)
6. Generate token
7. Copy token (hanya muncul sekali!)
8. Gunakan token sebagai password saat push

## Troubleshooting

### Error: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/Albyehh/TuntasinAjaTest.git
```

### Error: "repository not found"
- Pastikan repository sudah dibuat di GitHub
- Pastikan nama repository benar: `Albyehh/TuntasinAjaTest`
- Pastikan Anda punya akses write ke repository

### Error: "authentication failed"
- Gunakan Personal Access Token, bukan password GitHub
- Pastikan token memiliki scope `repo`

### Error: "failed to push some refs"
- Jika repository sudah ada file, gunakan:
```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

## Verifikasi

Setelah push berhasil, cek di browser:
https://github.com/Albyehh/TuntasinAjaTest

File-file Anda seharusnya sudah muncul di repository.

