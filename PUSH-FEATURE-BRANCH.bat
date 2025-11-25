@echo off
echo ========================================
echo Push Feature Branch untuk Preview Deployment
echo Project: TuntasinAja
echo ========================================
echo.

cd /d "E:\proyek\TuntasinAja"

echo [1/6] Checking current branch...
git branch
echo.

echo [2/6] Creating feature branch...
git checkout -b feature/set-thread-date 2>nul || git checkout feature/set-thread-date
echo Current branch:
git branch --show-current
echo.

echo [3/6] Checking changes...
git status --short
echo.

echo [4/6] Adding all changes...
git add -A
echo Files staged:
git status --short
echo.

echo [5/6] Committing changes...
git commit -m "feat: Add set thread date feature for admin testing

- Add updateThreadDate mutation (admin only)
- Add ThreadList component for admin panel
- Add tab navigation in admin panel (Users/Threads)
- Allow admin to set/update thread date for testing purposes
- Use toJakartaDate for proper date formatting"
echo.

echo [6/6] Pushing to GitHub...
echo.
echo NOTE: This will trigger preview deployment in Vercel!
echo.
git push -u origin feature/set-thread-date

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS!
    echo ========================================
    echo.
    echo Branch pushed: feature/set-thread-date
    echo.
    echo Next steps:
    echo 1. Check Vercel Dashboard for preview deployment
    echo 2. Test the feature in preview URL
    echo 3. Merge to main when ready for production
    echo.
    echo Preview deployment URL will be available in:
    echo https://vercel.com/dashboard
    echo.
) else (
    echo.
    echo ========================================
    echo PUSH FAILED
    echo ========================================
    echo Please check:
    echo 1. Your GitHub credentials
    echo 2. Repository access
    echo 3. Network connection
)

echo.
pause

