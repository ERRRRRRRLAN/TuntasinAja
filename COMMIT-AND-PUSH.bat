@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ========================================
echo COMMIT AND PUSH FOR PREVIEW
echo ========================================
echo.

echo [STEP 1] Checking current branch...
call git branch --show-current
echo.

echo [STEP 2] Checking out feature/set-thread-date...
call git checkout feature/set-thread-date
if errorlevel 1 (
    echo ERROR: Failed to checkout branch
    pause
    exit /b 1
)
echo Branch switched successfully
echo.

echo [STEP 3] Adding all changes...
call git add -A
if errorlevel 1 (
    echo ERROR: Failed to add files
    pause
    exit /b 1
)
echo Files added successfully
echo.

echo [STEP 4] Checking what will be committed...
call git status --short
echo.

echo [STEP 5] Committing changes...
call git commit -m "remove: Remove set thread date feature for testing"
if errorlevel 1 (
    echo WARNING: Commit failed or no changes to commit
    echo Trying empty commit...
    call git commit --allow-empty -m "remove: Remove set thread date feature for testing"
    if errorlevel 1 (
        echo ERROR: Empty commit also failed
        pause
        exit /b 1
    )
)
echo Commit created successfully
echo.

echo [STEP 6] Verifying commit...
call git log --oneline -1
echo.

echo [STEP 7] Pushing to origin...
call git push origin feature/set-thread-date
if errorlevel 1 (
    echo ERROR: Push failed
    echo.
    echo Possible reasons:
    echo - Authentication issue
    echo - Network problem
    echo - Branch already up to date
    pause
    exit /b 1
)
echo.
echo ========================================
echo SUCCESS!
echo ========================================
echo.
echo Branch pushed: feature/set-thread-date
echo Preview deployment will be created in Vercel.
echo Check: https://vercel.com/dashboard
echo.

pause

