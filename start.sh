#!/bin/bash

# PDF-AI Study Partner Startup Script

echo "🚀 Starting PDF-AI Study Partner..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it with your API keys."
    echo "Required variables:"
    echo "  OPENAI_API_KEY=your_openai_api_key"
    echo "  MONGODB_URI=your_mongodb_connection_string"
    echo "  JWT_SECRET=your_jwt_secret"
    echo "  PORT=5000"
    exit 1
fi

# Install backend dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Install frontend dependencies if needed
if [ ! -d "client/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd client
    npm install
    cd ..
fi

# Create uploads directory if it doesn't exist
if [ ! -d "uploads" ]; then
    echo "📁 Creating uploads directory..."
    mkdir uploads
fi

echo "✅ All dependencies installed and directories created!"
echo ""
echo "🔧 Starting servers..."
echo "   Backend: http://localhost:5000"
echo "   Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start both servers concurrently
npm run dev:full
