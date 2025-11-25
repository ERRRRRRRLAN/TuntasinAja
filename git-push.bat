@echo off
echo ========================================
echo Git Push TuntasinAjaTest to GitHub
echo ========================================
echo.

cd /d "E:\proyek\TuntasinAjaTest"

echo [1/6] Initializing git repository...
if not exist .git (
    git init
    echo Git repository initialized.
) else (
    echo Git repository already exists.
)

echo.
echo [2/6] Setting remote origin...
git remote remove origin 2>nul
git remote add origin https://github.com/Albyehh/TuntasinAjaTest.git
git remote set-url origin https://github.com/Albyehh/TuntasinAjaTest.git
echo Remote set to: https://github.com/Albyehh/TuntasinAjaTest.git

echo.
echo [3/6] Adding files to staging...
git add -A
echo Files added.

echo.
echo [4/6] Committing changes...
git commit -m "Initial commit: TuntasinAjaTest project"
if %errorlevel% equ 0 (
    echo Commit successful!
) else (
    echo Commit failed or no changes to commit.
)

echo.
echo [5/6] Setting branch to main...
git branch -M main
echo Branch set to main.

echo.
echo [6/6] Pushing to GitHub...
echo.
echo NOTE: You may be prompted for credentials.
echo If asked for password, use your GitHub Personal Access Token (PAT).
echo.
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS! Repository pushed to GitHub!
    echo ========================================
    echo Repository: https://github.com/Albyehh/TuntasinAjaTest
) else (
    echo.
    echo ========================================
    echo PUSH FAILED
    echo ========================================
    echo Please check:
    echo 1. Your GitHub credentials
    echo 2. Repository exists and is empty
    echo 3. You have write access to the repository
    echo.
    echo You may need to:
    echo - Use Personal Access Token as password
    echo - Or setup SSH key for authentication
)

echo.
pause

