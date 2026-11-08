@echo off
setlocal enabledelayedexpansion

echo ===============================================================================
echo   FUJI FLOW - AI-Based Business Process Automation & Analytics Platform
echo   Environment Setup & Dependency Verification (Windows)
echo ===============================================================================
echo.

cd /d "%~dp0"

:: 1. Check Python
echo [1/6] Checking Python installation...
where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not found in PATH. Please install Python 3.11+ and add to PATH.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('python -V') do echo   Found: %%i

:: 2. Check Node.js & npm
echo.
echo [2/6] Checking Node.js and npm...
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found in PATH. Please install Node.js v18+.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do echo   Found Node: %%i
for /f "tokens=*" %%i in ('npm -v') do echo   Found npm: %%i

:: 3. Check / Create Environment Configuration
echo.
echo [3/6] Verifying environment configuration (.env)...
if not exist ".env" (
    if exist ".env.example" (
        copy /y ".env.example" ".env" >nul
        echo   Created .env configuration from .env.example.
    ) else (
        echo [WARNING] .env.example not found.
    )
) else (
    echo   Found active .env configuration.
)

:: 4. Python Virtual Environment Setup & Backend Dependencies
echo.
echo [4/6] Setting up Python virtual environment and backend dependencies...
if not exist "backend\venv\Scripts\python.exe" (
    echo   Creating virtual environment in backend\venv...
    python -m venv backend\venv
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
)
echo   Installing/Verifying backend packages...
"backend\venv\Scripts\pip.exe" install -r "backend\requirements.txt" --quiet
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to install backend dependencies.
    pause
    exit /b 1
)
echo   Backend dependencies verified.

:: 5. Frontend Dependencies Setup
echo.
echo [5/6] Verifying frontend dependencies...
if not exist "frontend\node_modules" (
    echo   Installing frontend npm packages (this may take 1-2 minutes)...
    cd frontend
    call npm install
    cd ..
) else (
    echo   Frontend dependencies already installed.
)

:: 6. Initialize Database & Seed Default Records
echo.
echo [6/6] Verifying PostgreSQL database connection and running initialization...
"backend\venv\Scripts\python.exe" -u scripts\test_init_db.py
if %ERRORLEVEL% neq 0 (
    echo.
    echo [WARNING] Database connection initialization encountered a warning.
    echo Please verify PostgreSQL is running on port 5432 with password 'postgres'.
    echo Falling back to SQLite local database if PostgreSQL is offline.
)

echo.
echo ===============================================================================
echo   Setup Complete!
echo   To launch FUJI FLOW, run: start.bat
echo ===============================================================================
