Set-Location "E:\proyek\TuntasinAja"
Write-Host "Current branch:" -ForegroundColor Cyan
git branch --show-current
Write-Host "`nStatus:" -ForegroundColor Cyan
git status --short
Write-Host "`nLast commit:" -ForegroundColor Cyan
git log --oneline -1
Write-Host "`nPushing to origin..." -ForegroundColor Yellow
git push origin feature/set-thread-date
Write-Host "`nDone!" -ForegroundColor Green

