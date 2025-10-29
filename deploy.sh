#!/bin/bash

# PDF-AI Study Partner - Complete Deployment Script
# This script handles the full deployment of the PDF-AI Study Partner application

echo "🚀 PDF-AI Study Partner - Deployment Script"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    print_success "Node.js version: $NODE_VERSION"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    NPM_VERSION=$(npm --version)
    print_success "npm version: $NPM_VERSION"
}

# Check if .env file exists and has required variables
check_env() {
    if [ ! -f .env ]; then
        print_error ".env file not found!"
        print_status "Creating .env file with default values..."
        cat > .env << EOF
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=mongodb+srv://pasindu:12345@cluster0.yg0v7az.mongodb.net/
JWT_SECRET=00c0755f34a268636e7464ceb0388820e3bf6f1f48444d4a1becd22abe737dfc
PORT=5000
EOF
        print_warning "Please update the .env file with your actual API keys!"
        exit 1
    fi
    
    # Check if required environment variables are set
    if grep -q "your_gemini_api_key_here" .env; then
        print_warning "Please update GEMINI_API_KEY in .env file with your actual API key"
    fi
    
    print_success ".env file found and configured"
}

# Install backend dependencies
install_backend() {
    print_status "Installing backend dependencies..."
    if npm install; then
        print_success "Backend dependencies installed successfully"
    else
        print_error "Failed to install backend dependencies"
        exit 1
    fi
}

# Install frontend dependencies
install_frontend() {
    print_status "Installing frontend dependencies..."
    if [ -d "client" ]; then
        cd client
        if npm install; then
            print_success "Frontend dependencies installed successfully"
            cd ..
        else
            print_error "Failed to install frontend dependencies"
            exit 1
        fi
    else
        print_error "Client directory not found!"
        exit 1
    fi
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    # Create uploads directory
    if [ ! -d "uploads" ]; then
        mkdir uploads
        print_success "Created uploads directory"
    else
        print_success "Uploads directory already exists"
    fi
    
    # Create .gitkeep file in uploads
    if [ ! -f "uploads/.gitkeep" ]; then
        touch uploads/.gitkeep
        print_success "Created .gitkeep file in uploads directory"
    fi
}

# Check if ports are available
check_ports() {
    print_status "Checking if required ports are available..."
    
    # Check port 5000 (backend)
    if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port 5000 is already in use. Attempting to kill existing process..."
        lsof -ti:5000 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    # Check port 3000 (frontend)
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port 3000 is already in use. Attempting to kill existing process..."
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    print_success "Ports 5000 and 3000 are available"
}

# Start the application
start_application() {
    print_status "Starting PDF-AI Study Partner application..."
    print_status "Backend will run on: http://localhost:5000"
    print_status "Frontend will run on: http://localhost:3000"
    print_status ""
    print_status "Press Ctrl+C to stop both servers"
    print_status "=============================================="
    
    # Start both servers concurrently
    npm run dev
}

# Main deployment function
deploy() {
    echo ""
    print_status "Starting deployment process..."
    
    # Run all checks and setup
    check_node
    check_npm
    check_env
    create_directories
    install_backend
    install_frontend
    check_ports
    
    echo ""
    print_success "All checks passed! Starting application..."
    echo ""
    
    # Start the application
    start_application
}

# Handle script interruption
cleanup() {
    echo ""
    print_status "Shutting down servers..."
    # Kill any remaining Node processes
    pkill -f "node server.js" 2>/dev/null || true
    pkill -f "react-scripts start" 2>/dev/null || true
    print_success "Servers stopped successfully"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Run the deployment
deploy
