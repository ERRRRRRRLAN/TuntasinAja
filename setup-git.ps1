# Script untuk setup Git dan push ke GitHub
# Jalankan di root project

Write-Host "🔍 Checking Git repository..." -ForegroundColor Cyan
Write-Host ""

# Get current directory
$currentDir = Get-Location
Write-Host "Current directory: $currentDir" -ForegroundColor Gray
Write-Host ""

# Check if .git exists
if (Test-Path ".git") {
    Write-Host "✅ Git repository sudah diinisialisasi" -ForegroundColor Green
    Write-Host ""
    
    # Check remote
    Write-Host "📡 Checking remote..." -ForegroundColor Cyan
    $remote = git remote -v 2>&1
    if ($remote -match "fatal" -or $remote.Length -eq 0) {
        Write-Host "⚠️  Remote GitHub belum di-set" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Silakan tambahkan remote GitHub:" -ForegroundColor Yellow
        Write-Host "  git remote add origin https://github.com/username/tuntasinaja.git" -ForegroundColor White
        Write-Host ""
        Write-Host "Atau jika sudah punya remote:" -ForegroundColor Yellow
        Write-Host "  git remote set-url origin https://github.com/username/tuntasinaja.git" -ForegroundColor White
        Write-Host ""
        exit 1
    } else {
        Write-Host "✅ Remote sudah di-set:" -ForegroundColor Green
        git remote -v
        Write-Host ""
    }
    
    # Check status
    Write-Host "📋 Git status:" -ForegroundColor Cyan
    git status
    Write-Host ""
    
    # Ask if want to add and commit
    $response = Read-Host "Apakah Anda ingin add dan commit semua file? (y/n)"
    if ($response -eq "y" -or $response -eq "Y") {
        Write-Host "📦 Adding files..." -ForegroundColor Cyan
        git add .
        
        $commitMsg = Read-Host "Masukkan commit message (default: 'Setup iOS build dengan GitHub Actions')"
        if ([string]::IsNullOrWhiteSpace($commitMsg)) {
            $commitMsg = "Setup iOS build dengan GitHub Actions"
        }
        
        Write-Host "💾 Committing..." -ForegroundColor Cyan
        git commit -m $commitMsg
        
        Write-Host ""
        Write-Host "✅ Files sudah di-commit!" -ForegroundColor Green
        Write-Host ""
        
        # Ask if want to push
        $pushResponse = Read-Host "Apakah Anda ingin push ke GitHub? (y/n)"
        if ($pushResponse -eq "y" -or $pushResponse -eq "Y") {
            Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Cyan
            
            # Try to get current branch
            $branch = git branch --show-current 2>&1
            if ($branch -match "fatal" -or [string]::IsNullOrWhiteSpace($branch)) {
                $branch = "main"
            }
            
            Write-Host "Branch: $branch" -ForegroundColor Gray
            git push -u origin $branch
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "✅ Push berhasil!" -ForegroundColor Green
                Write-Host ""
                Write-Host "🎉 Langkah selanjutnya:" -ForegroundColor Cyan
                Write-Host "  1. Buka repository di GitHub" -ForegroundColor White
                Write-Host "  2. Klik tab 'Actions'" -ForegroundColor White
                Write-Host "  3. Pilih workflow 'Build iOS IPA'" -ForegroundColor White
                Write-Host "  4. Klik 'Run workflow'" -ForegroundColor White
            } else {
                Write-Host ""
                Write-Host "❌ Push gagal. Periksa error di atas." -ForegroundColor Red
            }
        }
    }
    
} else {
    Write-Host "❌ Git repository belum diinisialisasi" -ForegroundColor Red
    Write-Host ""
    Write-Host "Menginisialisasi Git repository..." -ForegroundColor Yellow
    
    git init
    
    Write-Host "✅ Git repository diinisialisasi!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Langkah selanjutnya:" -ForegroundColor Cyan
    Write-Host "  1. Tambahkan remote GitHub:" -ForegroundColor White
    Write-Host "     git remote add origin https://github.com/username/tuntasinaja.git" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. Setup user name dan email (jika belum):" -ForegroundColor White
    Write-Host "     git config --global user.name 'Your Name'" -ForegroundColor Gray
    Write-Host "     git config --global user.email 'your.email@example.com'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. Jalankan script ini lagi untuk add dan commit" -ForegroundColor White
}

