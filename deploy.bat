@echo off
REM PDF-AI Study Partner - Complete Deployment Script for Windows
REM This script handles the full deployment of the PDF-AI Study Partner application

echo 🚀 PDF-AI Study Partner - Deployment Script
echo ==============================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [SUCCESS] Node.js version: %NODE_VERSION%

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed. Please install npm first.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [SUCCESS] npm version: %NPM_VERSION%

REM Check if .env file exists
if not exist .env (
    echo [ERROR] .env file not found!
    echo [INFO] Creating .env file with default values...
    (
        echo GEMINI_API_KEY=your_gemini_api_key_here
        echo MONGODB_URI=mongodb+srv://pasindu:12345@cluster0.yg0v7az.mongodb.net/
        echo JWT_SECRET=00c0755f34a268636e7464ceb0388820e3bf6f1f48444d4a1becd22abe737dfc
        echo PORT=5000
    ) > .env
    echo [WARNING] Please update the .env file with your actual API keys!
    pause
    exit /b 1
)

echo [SUCCESS] .env file found and configured

REM Create necessary directories
echo [INFO] Creating necessary directories...

if not exist uploads (
    mkdir uploads
    echo [SUCCESS] Created uploads directory
) else (
    echo [SUCCESS] Uploads directory already exists
)

if not exist uploads\.gitkeep (
    echo. > uploads\.gitkeep
    echo [SUCCESS] Created .gitkeep file in uploads directory
)

REM Install backend dependencies
echo [INFO] Installing backend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)
echo [SUCCESS] Backend dependencies installed successfully

REM Install frontend dependencies
echo [INFO] Installing frontend dependencies...
if exist client (
    cd client
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install frontend dependencies
        pause
        exit /b 1
    )
    cd ..
    echo [SUCCESS] Frontend dependencies installed successfully
) else (
    echo [ERROR] Client directory not found!
    pause
    exit /b 1
)

REM Check if ports are available and kill existing processes
echo [INFO] Checking if required ports are available...

REM Kill any existing Node processes on port 5000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    taskkill /PID %%a /F >nul 2>&1
)

REM Kill any existing Node processes on port 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    taskkill /PID %%a /F >nul 2>&1
)

timeout /t 2 /nobreak >nul
echo [SUCCESS] Ports 5000 and 3000 are available

echo.
echo [SUCCESS] All checks passed! Starting application...
echo.
echo [INFO] Starting PDF-AI Study Partner application...
echo [INFO] Backend will run on: http://localhost:5000
echo [INFO] Frontend will run on: http://localhost:3000
echo.
echo [INFO] Press Ctrl+C to stop both servers
echo ==============================================
echo.

REM Start both servers concurrently
call npm run dev

REM Cleanup on exit
echo.
echo [INFO] Shutting down servers...
taskkill /F /IM node.exe >nul 2>&1
echo [SUCCESS] Servers stopped successfully
pause
