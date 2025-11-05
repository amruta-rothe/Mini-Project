@echo off
echo 🚀 Starting AttendanceMS...
echo ==========================

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js version: 
node --version

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

:: Initialize database if it doesn't exist
if not exist "data\app.db" (
    echo 🗄️  Setting up database...
    npm run db:init
    npm run db:seed
)

:: Create .env if it doesn't exist
if not exist ".env" (
    echo ⚙️  Creating environment file...
    copy .env.example .env
    echo 📝 Edit .env file to configure email settings
)

echo.
echo 🎉 AttendanceMS is ready!
echo.
echo 📋 Quick Info:
echo    • URL: http://localhost:3000
echo    • Login: mjsfutane21@gmail.com
echo    • Password: abc@1234
echo.
echo 🚀 Starting server...
npm start