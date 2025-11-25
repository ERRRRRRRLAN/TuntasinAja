@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ========================================
echo COMMIT AND PUSH FOR PREVIEW
echo ========================================
echo.

echo [1] Current directory:
cd
echo.

echo [2] Current branch:
git branch --show-current
echo.

echo [3] Checking out feature/set-thread-date...
git checkout feature/set-thread-date
if errorlevel 1 (
    echo ERROR: Failed to checkout branch
    pause
    exit /b 1
)
echo.

echo [4] Adding all changes...
git add -A
if errorlevel 1 (
    echo ERROR: Failed to add files
    pause
    exit /b 1
)
echo.

echo [5] Files to be committed:
git status --short
echo.

echo [6] Committing changes...
git commit -m "remove: Remove set thread date feature for testing"
if errorlevel 1 (
    echo WARNING: Commit may have failed or no changes to commit
) else (
    echo SUCCESS: Commit created
)
echo.

echo [7] Pushing to origin...
git push origin feature/set-thread-date
if errorlevel 1 (
    echo ERROR: Push failed
    echo.
    echo Possible reasons:
    echo - Authentication issue
    echo - Network problem
    echo - Branch already up to date
    pause
    exit /b 1
) else (
    echo SUCCESS: Push completed!
    echo.
    echo Preview deployment will be created in Vercel.
    echo Check: https://vercel.com/dashboard
)
echo.

pause

