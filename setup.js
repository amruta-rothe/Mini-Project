#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 AttendanceMS Quick Setup');
console.log('============================\n');

try {
  // Check if Node.js version is compatible
  const nodeVersion = process.version;
  console.log(`✅ Node.js version: ${nodeVersion}`);
  
  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  // Initialize database
  console.log('🗄️  Initializing database...');
  execSync('npm run db:init', { stdio: 'inherit' });
  
  // Seed with sample data
  console.log('🌱 Adding sample data...');
  execSync('npm run db:seed', { stdio: 'inherit' });
  
  // Copy environment file if it doesn't exist
  if (!fs.existsSync('.env')) {
    console.log('⚙️  Creating environment file...');
    fs.copyFileSync('.env.example', '.env');
    console.log('📝 Please edit .env file with your email settings');
  }
  
  console.log('\n🎉 Setup completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Edit .env file with your email settings (optional)');
  console.log('2. Run: npm start');
  console.log('3. Open: http://localhost:3000');
  console.log('4. Login: mjsfutane21@gmail.com / abc@1234');
  console.log('\n🌐 To share with others:');
  console.log('- Deploy to Railway: https://railway.app');
  console.log('- Deploy to Render: https://render.com');
  console.log('- Use GitHub Codespaces for instant access');
  
} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}