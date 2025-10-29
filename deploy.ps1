# PDF-AI Study Partner - Complete Deployment Script for PowerShell
# This script handles the full deployment of the PDF-AI Study Partner application

Write-Host "🚀 PDF-AI Study Partner - Deployment Script" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# Function to print colored output
function Write-Status {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Success "Node.js version: $nodeVersion"
} catch {
    Write-Error "Node.js is not installed. Please install Node.js first."
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Success "npm version: $npmVersion"
} catch {
    Write-Error "npm is not installed. Please install npm first."
    exit 1
}

# Check if .env file exists and has required variables
if (-not (Test-Path ".env")) {
    Write-Error ".env file not found!"
    Write-Status "Creating .env file with default values..."
    @"
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=mongodb+srv://pasindu:12345@cluster0.yg0v7az.mongodb.net/
JWT_SECRET=00c0755f34a268636e7464ceb0388820e3bf6f1f48444d4a1becd22abe737dfc
PORT=5000
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Warning "Please update the .env file with your actual API keys!"
    exit 1
}

# Check if required environment variables are set
$envContent = Get-Content ".env"
if ($envContent -match "your_gemini_api_key_here") {
    Write-Warning "Please update GEMINI_API_KEY in .env file with your actual API key"
}

Write-Success ".env file found and configured"

# Create necessary directories
Write-Status "Creating necessary directories..."

if (-not (Test-Path "uploads")) {
    New-Item -ItemType Directory -Path "uploads" | Out-Null
    Write-Success "Created uploads directory"
} else {
    Write-Success "Uploads directory already exists"
}

if (-not (Test-Path "uploads\.gitkeep")) {
    New-Item -ItemType File -Path "uploads\.gitkeep" | Out-Null
    Write-Success "Created .gitkeep file in uploads directory"
}

# Install backend dependencies
Write-Status "Installing backend dependencies..."
try {
    npm install
    Write-Success "Backend dependencies installed successfully"
} catch {
    Write-Error "Failed to install backend dependencies"
    exit 1
}

# Install frontend dependencies
Write-Status "Installing frontend dependencies..."
if (Test-Path "client") {
    Set-Location "client"
    try {
        npm install
        Set-Location ".."
        Write-Success "Frontend dependencies installed successfully"
    } catch {
        Write-Error "Failed to install frontend dependencies"
        exit 1
    }
} else {
    Write-Error "Client directory not found!"
    exit 1
}

# Check if ports are available
Write-Status "Checking if required ports are available..."

# Kill any existing Node processes on port 5000
$processes5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($processes5000) {
    Write-Warning "Port 5000 is already in use. Attempting to kill existing process..."
    $processes5000 | ForEach-Object { 
        $process = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
        if ($process) { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue }
    }
    Start-Sleep -Seconds 2
}

# Kill any existing Node processes on port 3000
$processes3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($processes3000) {
    Write-Warning "Port 3000 is already in use. Attempting to kill existing process..."
    $processes3000 | ForEach-Object { 
        $process = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
        if ($process) { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue }
    }
    Start-Sleep -Seconds 2
}

Write-Success "Ports 5000 and 3000 are available"

Write-Host ""
Write-Success "All checks passed! Starting application..."
Write-Host ""
Write-Status "Starting PDF-AI Study Partner application..."
Write-Status "Backend will run on: http://localhost:5000"
Write-Status "Frontend will run on: http://localhost:3000"
Write-Host ""
Write-Status "Press Ctrl+C to stop both servers"
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Start both servers concurrently
try {
    npm run dev
} catch {
    Write-Host ""
    Write-Status "Shutting down servers..."
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Success "Servers stopped successfully"
}
