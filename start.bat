@echo off
REM PDF-AI Study Partner Startup Script for Windows

echo 🚀 Starting PDF-AI Study Partner...

REM Check if .env file exists
if not exist .env (
    echo ❌ .env file not found. Please create it with your API keys.
    echo Required variables:
    echo   OPENAI_API_KEY=your_openai_api_key
    echo   MONGODB_URI=your_mongodb_connection_string
    echo   JWT_SECRET=your_jwt_secret
    echo   PORT=5000
    pause
    exit /b 1
)

REM Install backend dependencies if needed
if not exist node_modules (
    echo 📦 Installing backend dependencies...
    npm install
)

REM Install frontend dependencies if needed
if not exist client\node_modules (
    echo 📦 Installing frontend dependencies...
    cd client
    npm install
    cd ..
)

REM Create uploads directory if it doesn't exist
if not exist uploads (
    echo 📁 Creating uploads directory...
    mkdir uploads
)

echo ✅ All dependencies installed and directories created!
echo.
echo 🔧 Starting servers...
echo    Backend: http://localhost:5000
echo    Frontend: http://localhost:3000
echo.
echo Press Ctrl+C to stop both servers
echo.

REM Start both servers concurrently
npm run dev:full
