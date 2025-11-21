@echo off
echo =========================================
echo   Karting Dashboard - Fresh Start
echo =========================================
echo.
echo Killing any running Python servers...
taskkill /F /IM python.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting HTTP server...
cd /d "%~dp0dashboard"
start "Karting Dashboard Server" python -m http.server 8000

echo.
echo =========================================
echo Server started on http://localhost:8000
echo =========================================
echo.
echo IMPORTANT: In your browser, do a HARD REFRESH:
echo   - Chrome/Edge: Ctrl + Shift + R
echo   - Firefox: Ctrl + F5
echo.
echo Or clear browser cache completely!
echo.
pause
