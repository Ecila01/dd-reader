# DD Reader Debug Launcher
# Usage: .\debug.ps1  (or double-click debug.bat)

$ErrorActionPreference = "Continue"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not (Test-Path "$scriptDir\node_modules")) {
    Write-Host "[!] node_modules not found, installing..." -ForegroundColor Yellow
    Set-Location $scriptDir
    npm install
    Write-Host ""
}

Write-Host "Launching DD Reader in a new window..." -ForegroundColor Green
Write-Host ""

# Launch a NEW cmd.exe window (independent environment, inherits system PATH)
# The .bat file prepends Rust/MSVC/SDK paths
Start-Process cmd.exe -ArgumentList "/c `"$scriptDir\debug.bat`""