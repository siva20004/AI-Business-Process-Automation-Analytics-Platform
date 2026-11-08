@echo off
setlocal enabledelayedexpansion

echo ===============================================================================
echo   FUJI FLOW - AI-Based Business Process Automation & Analytics Platform
echo   Platform Startup Controller (Windows)
echo ===============================================================================
echo.

cd /d "%~dp0"

:: 1. Check if backend port 8000 or frontend port 5173 are already in use
netstat -ano | findstr ":8000 " >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [WARNING] Port 8000 is already in use.
    echo Backend may already be running. Run stop.bat first if you wish to restart.
)

netstat -ano | findstr ":5173 " >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [WARNING] Port 5173 is already in use.
    echo Frontend may already be running. Run stop.bat first if you wish to restart.
)

:: Clear existing pid tracking file
if exist ".pids" del /f /q ".pids"

:: 2. Launch FastAPI Backend
echo [1/3] Starting FUJI FLOW Backend on http://localhost:8000...
start "FUJI_FLOW_BACKEND" /min cmd /c "cd /d "%~dp0backend" && ..\backend\venv\Scripts\python.exe -u -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

:: 3. Launch React Vite Frontend
echo [2/3] Starting FUJI FLOW Frontend on http://localhost:5173...
start "FUJI_FLOW_FRONTEND" /min cmd /c "cd /d "%~dp0frontend" && node .\node_modules\vite\bin\vite.js --host localhost --port 5173"

:: 4. Verify System Health and Launch Browser
echo [3/3] Performing health check on backend service...
set RETRIES=0

:HEALTH_CHECK_LOOP
timeout /t 2 /nobreak >nul
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $res = Invoke-RestMethod -Uri 'http://localhost:8000/health' -TimeoutSec 2; if ($res.status -in @('healthy','degraded')) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    goto APP_READY
)

set /a RETRIES+=1
if %RETRIES% lss 10 (
    echo   Waiting for backend to respond... (!RETRIES!/10)
    goto HEALTH_CHECK_LOOP
) else (
    echo [WARNING] Backend did not respond within 20 seconds.
    echo Please check backend terminal window for details or run setup.bat.
)

:APP_READY
echo.
echo ===============================================================================
echo   FUJI FLOW PLATFORM IS ONLINE AND READY!
echo ===============================================================================
echo.
echo   Frontend Application:  http://localhost:5173
echo   Backend Service:       http://localhost:8000
echo   Interactive API Docs:  http://localhost:8000/docs
echo   System Health Check:   http://localhost:8000/health
echo   Database:              PostgreSQL 18 (localhost:5432/fuji_flow)
echo.
echo   Default Credentials:
echo     Administrator:  admin@fujikyuko.co.jp  /  FujiFlow2026!
echo     Analyst:        analyst@fujikyuko.co.jp  /  FujiFlow2026!
echo.
echo   To safely shut down the application, run: stop.bat
echo ===============================================================================
echo.

:: Open frontend automatically in default browser
start http://localhost:5173
