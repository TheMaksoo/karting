@echo off

:: Display header
@echo =========================================
@echo   Karting Dashboard - Full Deployment
@echo =========================================
@echo.

:: Step 1: Set environment file
set ENV_FILE=c:\laragon\www\karting\portal\backend\.env.local
if "%1"=="production" set ENV_FILE=c:\laragon\www\karting\portal\backend\.env.production
if not exist %ENV_FILE% (
    @echo ERROR: Environment file %ENV_FILE% not found. Ensure it exists and is valid.
    pause
    exit /b
)

:: Debugging: Check if .env.local file exists and is accessible
@echo Debugging: Checking if %ENV_FILE% exists...
if exist %ENV_FILE% (
    @echo Debugging: %ENV_FILE% exists.
) else (
    @echo Debugging: %ENV_FILE% does not exist.
    pause
    exit /b
)

@echo Debugging: Attempting to copy %ENV_FILE%...
copy /Y %ENV_FILE% c:\laragon\www\karting\portal\backend\.env >nul
if errorlevel 1 (
    @echo ERROR: Failed to copy %ENV_FILE%. Ensure permissions are correct.
    pause
    exit /b
)
@echo Using %ENV_FILE% for environment configuration.

:: Step 2: Check if MySQL is already running
@echo Checking if MySQL is already running...
netstat -ano | findstr :3306 >nul
if errorlevel 1 (
    @echo Starting MySQL Service...
    net start MySQL80 >nul 2>&1
    if errorlevel 1 (
        @echo ERROR: MySQL service could not be started. Ensure MySQL is installed and configured correctly.
        pause
        exit /b
    )
    @echo MySQL Service started successfully.
) else (
    @echo MySQL is already running.
)

:: Step 3: Kill any running Python servers
@echo Killing any running Python servers...
taskkill /F /IM python.exe 2>nul
timeout /t 2 /nobreak >nul

:: Step 4: Install backend dependencies and start the backend server
@echo.
@echo Installing Backend Dependencies...
cd /d "%~dp0portal/backend"
if not exist vendor (
    composer install
    if errorlevel 1 (
        @echo ERROR: Composer installation failed. Ensure Composer is installed and accessible.
        pause
        exit /b
    )
)

:: Step 4: Check if backend server is already running
@echo Checking if backend server is already running...
netstat -ano | findstr :%BACKEND_PORT% >nul
if not errorlevel 1 (
    @echo Backend server is already running on port %BACKEND_PORT%.
    goto :SKIP_BACKEND_START
)

@echo Starting Backend Server...
set BACKEND_PORT=8000
for /l %%P in (8000,1,8100) do (
    netstat -ano | findstr :%%P >nul
    if errorlevel 1 (
        set BACKEND_PORT=%%P
        goto :FOUND_BACKEND_PORT
    )
)
:FOUND_BACKEND_PORT
@echo Using backend port: %BACKEND_PORT%
start /B php artisan serve --host=0.0.0.0 --port=%BACKEND_PORT% > backend.log 2>&1
if errorlevel 1 (
    @echo ERROR: Failed to start the backend server. Check backend logs for details.
    pause
    exit /b
)
@echo Backend server started on http://localhost:%BACKEND_PORT%
:SKIP_BACKEND_START

:: Step 5: Start the database (if using Laravel Sail or Docker)
@echo.
@echo Starting Database...
cd /d "%~dp0portal"
if exist docker-compose.yml (
    docker-compose up -d
    if errorlevel 1 (
        @echo ERROR: Failed to start Docker containers. Ensure Docker is installed and running.
        pause
        exit /b
    )
    @echo Database started using Docker Compose.
) else (
    @echo WARNING: No docker-compose.yml found. Ensure your database is running manually.
)

:: Step 6: Run migrations and seed the database
@echo.
@echo Initializing and Seeding Database...
cd /d "%~dp0portal/backend"
php artisan migrate --force
if errorlevel 1 (
    @echo ERROR: Database migrations failed. Check your database configuration.
    pause
    exit /b
)
php artisan db:seed --force
if errorlevel 1 (
    @echo ERROR: Database seeding failed. Check your database configuration.
    pause
    exit /b
)
@echo Database initialized and seeded.

:: Step 7: Fix frontend dependencies and start the development server
@echo.
@echo Setting up Frontend...
cd /d "%~dp0portal/frontend"
if not exist node_modules (
    npm install --legacy-peer-deps
    if errorlevel 1 (
        @echo ERROR: NPM installation failed. Ensure Node.js and npm are installed and accessible.
        pause
        exit /b
    )
)
set FRONTEND_PORT=3000
for /l %%P in (3000,1,3100) do (
    netstat -ano | findstr :%%P >nul
    if errorlevel 1 (
        set FRONTEND_PORT=%%P
        goto :FOUND_FRONTEND_PORT
    )
)
:FOUND_FRONTEND_PORT
npx vite --port %FRONTEND_PORT% > frontend.log 2>&1 &
if errorlevel 1 (
    @echo ERROR: Failed to start the frontend server. Check frontend logs for details.
    pause
    exit /b
)
@echo Frontend development server started on http://localhost:%FRONTEND_PORT%

:: Step 8: Start the Python HTTP server for the dashboard
@echo.
@echo Starting HTTP server...
cd /d "%~dp0dashboard"
set DASHBOARD_PORT=8001
for /l %%P in (8001,1,8100) do (
    netstat -ano | findstr :%%P >nul
    if errorlevel 1 (
        set DASHBOARD_PORT=%%P
        goto :FOUND_DASHBOARD_PORT
    )
)
:FOUND_DASHBOARD_PORT
start "Karting Dashboard Server" python -m http.server %DASHBOARD_PORT%
if errorlevel 1 (
    @echo ERROR: Failed to start the Python HTTP server. Check for Python installation issues.
    pause
    exit /b
)
@echo HTTP server started on http://localhost:%DASHBOARD_PORT%

:: Step 9: Run the CSV processing script
@echo.
@echo Running CSV processing script...
cd /d "%~dp0data-importer/scripts"
python process_karting_sessions.py
if errorlevel 1 (
    @echo ERROR: Failed to run the CSV processing script. Check the script for issues.
    pause
    exit /b
)
@echo CSV processing completed successfully.

@echo.
@echo =========================================
@echo All services started successfully!
@echo Backend: http://localhost:%BACKEND_PORT%
@echo Frontend: http://localhost:%FRONTEND_PORT%
@echo Dashboard: http://localhost:%DASHBOARD_PORT%
@echo =========================================
@echo.
@echo IMPORTANT: In your browser, do a HARD REFRESH:
@echo   - Chrome/Edge: Ctrl + Shift + R
@echo   - Firefox: Ctrl + F5
@echo.
@echo Or clear browser cache completely!
@echo.
pause
