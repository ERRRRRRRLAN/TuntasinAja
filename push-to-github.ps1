# Script untuk commit dan push TuntasinAjaTest ke GitHub
Set-Location "E:\proyek\TuntasinAjaTest"

Write-Host "=== Setting up Git repository ===" -ForegroundColor Cyan

# Initialize git if not exists
if (!(Test-Path .git)) {
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init
} else {
    Write-Host "Git repository already exists" -ForegroundColor Green
}

# Set remote
Write-Host "`n=== Setting remote origin ===" -ForegroundColor Cyan
$remoteExists = git remote get-url origin 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Updating remote origin..." -ForegroundColor Yellow
    git remote set-url origin https://github.com/Albyehh/TuntasinAjaTest.git
} else {
    Write-Host "Adding remote origin..." -ForegroundColor Yellow
    git remote add origin https://github.com/Albyehh/TuntasinAjaTest.git
}

Write-Host "Remote URL: $(git remote get-url origin)" -ForegroundColor Green

# Add all files
Write-Host "`n=== Adding files to staging ===" -ForegroundColor Cyan
git add -A
$status = git status --short
if ($status) {
    Write-Host "Files staged:" -ForegroundColor Green
    Write-Host $status
} else {
    Write-Host "No changes to commit" -ForegroundColor Yellow
    exit 0
}

# Commit
Write-Host "`n=== Committing changes ===" -ForegroundColor Cyan
git commit -m "Initial commit: TuntasinAjaTest project"
if ($LASTEXITCODE -eq 0) {
    Write-Host "Commit successful!" -ForegroundColor Green
} else {
    Write-Host "Commit failed!" -ForegroundColor Red
    exit 1
}

# Set branch to main
Write-Host "`n=== Setting branch to main ===" -ForegroundColor Cyan
git branch -M main

# Push to GitHub
Write-Host "`n=== Pushing to GitHub ===" -ForegroundColor Cyan
Write-Host "Pushing to origin main..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n=== SUCCESS! ===" -ForegroundColor Green
    Write-Host "Repository pushed to: https://github.com/Albyehh/TuntasinAjaTest" -ForegroundColor Green
} else {
    Write-Host "`n=== PUSH FAILED ===" -ForegroundColor Red
    Write-Host "Please check your authentication or run the command manually" -ForegroundColor Yellow
    exit 1
}

