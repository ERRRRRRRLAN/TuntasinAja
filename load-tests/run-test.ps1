# Load Test Runner Script untuk Windows PowerShell
# Usage: .\run-test.ps1 [test-type] [url]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('basic', 'stress', 'spike', 'soak')]
    [string]$TestType = 'basic',
    
    [Parameter(Mandatory=$false)]
    [string]$Url = 'http://localhost:3000'
)

Write-Host ""
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     k6 Load Test Runner                   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if k6 is installed
Write-Host "🔍 Checking k6 installation..." -ForegroundColor Yellow
try {
    $k6Version = k6 version 2>&1
    Write-Host "✅ k6 is installed: $k6Version" -ForegroundColor Green
} catch {
    Write-Host "❌ k6 is not installed!" -ForegroundColor Red
    Write-Host "   Please install k6 first: choco install k6" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Map test type to script file
$scriptMap = @{
    'basic' = 'basic-load-test.js'
    'stress' = 'stress-test.js'
    'spike' = 'spike-test.js'
    'soak' = 'soak-test.js'
}

$scriptFile = $scriptMap[$TestType]
$scriptPath = Join-Path $PSScriptRoot $scriptFile

# Check if script exists
if (-not (Test-Path $scriptPath)) {
    Write-Host "❌ Script not found: $scriptPath" -ForegroundColor Red
    exit 1
}

# Display test info
Write-Host "📋 Test Configuration:" -ForegroundColor Cyan
Write-Host "   Type: $TestType" -ForegroundColor White
Write-Host "   Script: $scriptFile" -ForegroundColor White
Write-Host "   Target: $Url" -ForegroundColor White
Write-Host ""

# Show warning for production tests
if ($Url -like "*vercel.app*" -or $Url -like "*production*") {
    Write-Host "⚠️  WARNING: Testing production server!" -ForegroundColor Yellow
    Write-Host "   This will generate real traffic to your Vercel app." -ForegroundColor Yellow
    Write-Host "   Make sure you understand the implications." -ForegroundColor Yellow
    Write-Host ""
    
    $confirmation = Read-Host "   Continue? (y/N)"
    if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
        Write-Host "❌ Test cancelled." -ForegroundColor Red
        exit 0
    }
    Write-Host ""
}

# Show test duration warning
$durationWarnings = @{
    'basic' = '~5 minutes'
    'stress' = '~13 minutes'
    'spike' = '~2 minutes'
    'soak' = '~33 minutes (VERY LONG!)'
}

Write-Host "⏱️  Estimated Duration: $($durationWarnings[$TestType])" -ForegroundColor Magenta
Write-Host ""

# Countdown
Write-Host "🚀 Starting test in..." -ForegroundColor Green
for ($i = 3; $i -gt 0; $i--) {
    Write-Host "   $i..." -ForegroundColor Yellow
    Start-Sleep -Seconds 1
}
Write-Host ""

# Run the test
Write-Host "▶️  Running k6 test..." -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

$env:BASE_URL = $Url
k6 run $scriptPath

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Write-Host "✅ Test completed!" -ForegroundColor Green
Write-Host ""

# Check if results file exists
$resultsFile = Join-Path $PSScriptRoot "load-test-summary.json"
if (Test-Path $resultsFile) {
    Write-Host "📊 Results saved to: load-test-summary.json" -ForegroundColor Cyan
}

$stressResultsFile = Join-Path $PSScriptRoot "stress-test-results.json"
if (Test-Path $stressResultsFile) {
    Write-Host "📊 Results saved to: stress-test-results.json" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "💡 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Check the results above" -ForegroundColor White
Write-Host "   2. Look for error rates and response times" -ForegroundColor White
Write-Host "   3. Monitor your Vercel dashboard during tests" -ForegroundColor White
Write-Host "   4. Try different test types to find your limits" -ForegroundColor White
Write-Host ""



