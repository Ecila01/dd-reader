#!/bin/bash
# DD Reader Debug Launcher
# Run in Git Bash: ./debug.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# ── Environment ──────────────────────────────────────────
export PATH="/c/Users/14699/.rustup/toolchains/stable-x86_64-pc-windows-msvc/bin:$PATH"
export PATH="/c/Program Files (x86)/Microsoft Visual Studio/2022/BuildTools/VC/Tools/MSVC/14.44.35207/bin/Hostx64/x64:$PATH"
export PATH="/c/Program Files (x86)/Windows Kits/10/bin/10.0.26100.0/x64:$PATH"

echo "============================================"
echo "  DD Reader - Debug Mode"
echo "============================================"
echo ""
echo "  Frontend: http://localhost:5173"
echo "  Backend:  Tauri IPC (Rust)"
echo "  Folder:   $SCRIPT_DIR"
echo ""

if [ ! -d "node_modules" ]; then
    echo "[!] node_modules not found, installing..."
    npm install
    echo ""
fi

echo "[OK] Starting Tauri dev server..."
echo ""

npx tauri dev