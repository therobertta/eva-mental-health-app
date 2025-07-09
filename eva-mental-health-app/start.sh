#!/bin/bash

# Eva Mental Health App Startup Script
echo "🌟 Starting Eva Mental Health App..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if .env file exists in backend
if [ ! -f "backend/.env" ]; then
    echo "⚠️  No .env file found in backend directory."
    echo "📝 Creating .env file from template..."
    cp backend/config/environment.js backend/.env
    echo "🔧 Please edit backend/.env with your configuration:"
    echo "   - OpenAI API key"
    echo "   - Database credentials"
    echo "   - Other settings"
    echo ""
    read -p "Press Enter after you've configured the .env file..."
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

# Start backend server
echo "🚀 Starting backend server..."
cd ../backend
npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "🚀 Starting frontend server..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo ""
echo "🎉 Eva Mental Health App is starting up!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping Eva Mental Health App..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait 