@echo off
echo ========================================
echo Commit dan Push untuk Preview Deployment
echo ========================================
echo.

cd /d "E:\proyek\TuntasinAja"

echo [1/5] Checking current branch...
git branch --show-current
echo.

echo [2/5] Creating/checking out feature branch...
git checkout -b feature/set-thread-date 2>nul || git checkout feature/set-thread-date
echo Current branch:
git branch --show-current
echo.

echo [3/5] Adding all changes...
git add -A
echo Files to be committed:
git status --short
echo.

echo [4/5] Committing changes...
git commit -m "remove: Remove set thread date feature for testing"
if %errorlevel% equ 0 (
    echo Commit successful!
) else (
    echo No changes to commit or commit failed.
)
echo.

echo [5/5] Pushing to GitHub...
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
    echo Preview deployment will be created in Vercel.
    echo Check: https://vercel.com/dashboard
    echo.
) else (
    echo.
    echo ========================================
    echo PUSH FAILED
    echo ========================================
    echo Please check your authentication or network.
)

echo.
pause

