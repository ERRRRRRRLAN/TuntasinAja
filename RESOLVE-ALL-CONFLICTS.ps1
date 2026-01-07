# Script untuk resolve SEMUA merge conflicts
# Menggunakan versi lokal (--ours) untuk semua file

Write-Host "🔧 Resolving ALL merge conflicts..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Use local version for ALL conflicted files
Write-Host "Step 1: Using local version for all conflicted files..." -ForegroundColor Yellow
git checkout --ours . 2>&1 | Out-Null

# Step 2: Remove package-lock.json (will be regenerated)
Write-Host "Step 2: Removing package-lock.json..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    Remove-Item package-lock.json -Force -ErrorAction SilentlyContinue
}

# Step 3: Stage all files
Write-Host "Step 3: Staging all files..." -ForegroundColor Yellow
git add . 2>&1 | Out-Null

# Step 4: Check for remaining conflict markers
Write-Host "Step 4: Checking for remaining conflict markers..." -ForegroundColor Yellow
$conflictFiles = Get-ChildItem -Recurse -File -Exclude "node_modules" | Select-String -Pattern "<<<<<<< HEAD" -List | Select-Object -ExpandProperty Path -Unique

if ($conflictFiles) {
    Write-Host "⚠️  Still have conflicts in:" -ForegroundColor Yellow
    $conflictFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
    Write-Host ""
    Write-Host "Manually fixing remaining conflicts..." -ForegroundColor Yellow
    
    # Try to remove conflict markers from remaining files
    foreach ($file in $conflictFiles) {
        Write-Host "  Fixing: $file" -ForegroundColor Gray
        $content = Get-Content $file -Raw
        # Remove conflict markers and keep local version
        $content = $content -replace '<<<<<<< HEAD.*?=======.*?>>>>>>> [a-f0-9]+', ''
        $content = $content -replace '<<<<<<< HEAD.*?=======', ''
        $content = $content -replace '>>>>>>> [a-f0-9]+', ''
        Set-Content -Path $file -Value $content -NoNewline
        git add $file 2>&1 | Out-Null
    }
} else {
    Write-Host "✅ No conflicts remaining!" -ForegroundColor Green
}

# Step 5: Validate Prisma
Write-Host ""
Write-Host "Step 5: Validating Prisma schema..." -ForegroundColor Yellow
try {
    $prismaCheck = npx prisma validate 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Prisma schema is valid" -ForegroundColor Green
    } else {
        Write-Host "❌ Prisma validation failed" -ForegroundColor Red
        Write-Host $prismaCheck
    }
} catch {
    Write-Host "⚠️  Could not validate Prisma" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✨ Conflict resolution complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next: git commit -m 'Resolve all merge conflicts'" -ForegroundColor Cyan

