@echo off
cd /d "%~dp0"
echo Pushing feature/set-thread-date branch...
git add -A
git commit -m "remove: Remove set thread date feature for testing"
git push origin feature/set-thread-date
echo.
echo Done! Check Vercel dashboard for preview deployment.
pause

