# Script untuk resolve semua merge conflicts
# Menggunakan versi lokal (--ours) untuk semua file

Write-Host "🔧 Resolving merge conflicts..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Check current status
Write-Host "Step 1: Checking merge status..." -ForegroundColor Yellow
$mergeStatus = git status 2>&1 | Select-String -Pattern "Unmerged"
if ($mergeStatus) {
    Write-Host "Merge in progress detected" -ForegroundColor Yellow
} else {
    Write-Host "No merge in progress" -ForegroundColor Green
}

# Step 2: Use local version for all files
Write-Host ""
Write-Host "Step 2: Using local version for all conflicted files..." -ForegroundColor Yellow
git checkout --ours . 2>&1 | Out-Null
Write-Host "✅ Applied local version" -ForegroundColor Green

# Step 3: Remove package-lock.json (will be regenerated)
Write-Host ""
Write-Host "Step 3: Removing package-lock.json (will regenerate on npm install)..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    Remove-Item package-lock.json -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Removed package-lock.json" -ForegroundColor Green
}

# Step 4: Add all resolved files
Write-Host ""
Write-Host "Step 4: Staging all resolved files..." -ForegroundColor Yellow
git add . 2>&1 | Out-Null
Write-Host "✅ All files staged" -ForegroundColor Green

# Step 5: Check for remaining conflicts
Write-Host ""
Write-Host "Step 5: Checking for remaining conflicts..." -ForegroundColor Yellow
$remainingConflicts = Get-ChildItem -Recurse -File -Exclude "node_modules","*.lock" | Select-String -Pattern "<<<<<<< HEAD" -List
if ($remainingConflicts) {
    Write-Host "⚠️  Still have conflicts in:" -ForegroundColor Yellow
    $remainingConflicts.Path | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
} else {
    Write-Host "✅ No conflicts remaining" -ForegroundColor Green
}

# Step 6: Validate Prisma schema
Write-Host ""
Write-Host "Step 6: Validating Prisma schema..." -ForegroundColor Yellow
try {
    npx prisma validate 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Prisma schema is valid" -ForegroundColor Green
    } else {
        Write-Host "❌ Prisma schema validation failed" -ForegroundColor Red
    }
} catch {
    Write-Host "⚠️  Could not validate Prisma schema (prisma may not be installed)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✨ Conflict resolution complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Review changes: git status" -ForegroundColor White
Write-Host "  2. Complete merge: git commit -m 'Resolve merge conflicts'" -ForegroundColor White
Write-Host "  3. Push to GitHub: git push origin main" -ForegroundColor White
Write-Host ""

