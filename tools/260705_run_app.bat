@echo off
echo ========================================================
echo   NAME 2 PERFUME - Local Development Starter
echo ========================================================
echo.

cd /d "%~dp0\.."

if not exist node_modules (
    echo [1/2] Installing npm packages...
    call npm install
) else (
    echo [1/2] Packages already installed. Skipping npm install.
)

echo.
echo [2/2] Starting Vite development server...
echo.
node --require "%~dp0\260705_polyfill.cjs" "%~dp0\..\node_modules\vite\bin\vite.js"

pause
