#!/bin/bash

echo "🚀 Starting AttendanceMS..."
echo "=========================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node -v)"
    echo "   Please update Node.js from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Initialize database if it doesn't exist
if [ ! -f "data/app.db" ]; then
    echo "🗄️  Setting up database..."
    npm run db:init
    npm run db:seed
fi

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️  Creating environment file..."
    cp .env.example .env
    echo "📝 Edit .env file to configure email settings"
fi

echo ""
echo "🎉 AttendanceMS is ready!"
echo ""
echo "📋 Quick Info:"
echo "   • URL: http://localhost:3000"
echo "   • Login: mjsfutane21@gmail.com"
echo "   • Password: abc@1234"
echo ""
echo "🚀 Starting server..."
npm start