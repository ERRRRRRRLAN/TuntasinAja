# Script untuk build APK dengan password
$keystorePassword = "erlan210609"
$keyPassword = "erlan210609"

# Set environment variables
$env:KEYSTORE_PASSWORD = $keystorePassword
$env:KEY_PASSWORD = $keyPassword

# Build APK
Write-Host "Building APK dengan password keystore..."
bubblewrap build --type=debug

