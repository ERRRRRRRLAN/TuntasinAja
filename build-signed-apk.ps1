# Auto-increment version before build
Write-Host "Incrementing version..." -ForegroundColor Cyan
node scripts/increment-version.js

cd android
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
$env:ANDROID_HOME = "C:\Users\fawza\AppData\Local\Android\Sdk"
.\gradlew.bat assembleRelease
cd ..