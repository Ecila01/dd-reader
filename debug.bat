@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo   DD Reader - Debug Mode
echo ============================================
echo.
echo   Frontend: http://localhost:5173
echo   Backend:  Tauri IPC (Rust)
echo   Folder:   %cd%
echo.

:: ── Environment ──────────────────────────────────────────
set "PATH=C:\Users\14699\.rustup\toolchains\stable-x86_64-pc-windows-msvc\bin;%PATH%"
set "PATH=C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\14.44.35207\bin\Hostx64\x64;%PATH%"
set "PATH=C:\Program Files (x86)\Windows Kits\10\bin\10.0.26100.0\x64;%PATH%"

:: Verify cargo
where cargo >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] cargo not found in PATH
    echo Current PATH: %PATH%
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('cargo --version') do set CARGO_VER=%%i
echo [OK] %CARGO_VER%

if not exist "node_modules" (
    echo [!] node_modules not found, installing...
    call npm install
    echo.
)

echo [OK] Starting Tauri dev server...
echo (Press Ctrl+C to stop)
echo.
echo.

call npx tauri dev

pause