#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import readline from 'readline';
import path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

console.log('🎓 Prathamesh Sir LMS - Setup Wizard\n');

async function setup() {
  try {
    console.log(`Node version: ${process.version}`);
    console.log('\n📦 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });

    const rootEnvPath = path.resolve(process.cwd(), '..', '.env');

    if (!fs.existsSync(rootEnvPath)) {
      console.log('\n🔧 Creating environment file...');
      
      const dbUrl = await question('Enter DATABASE_URL: ');
      const jwtSecret = await question('Enter JWT_SECRET (min 32 chars): ');
      const bunnyKey = await question('Enter BUNNY_API_KEY: ');
      const bunnyLib = await question('Enter BUNNY_LIBRARY_ID: ');
      const bunnyTokenKey = await question('Enter BUNNY_TOKEN_SECURITY_KEY: ');

      const envContent = `# Database
DATABASE_URL=${dbUrl}

# Security
JWT_SECRET=${jwtSecret}
REFRESH_TOKEN_DAYS=45
MAX_ACTIVE_DEVICES=2

# Bunny.net CDN
BUNNY_API_KEY=${bunnyKey}
BUNNY_LIBRARY_ID=${bunnyLib}
BUNNY_TOKEN_SECURITY_KEY=${bunnyTokenKey}

# Frontend
VITE_BUNNY_LIBRARY_ID=${bunnyLib}
`;

      fs.writeFileSync(rootEnvPath, envContent);
      console.log('✅ .env file created at repo root');
    }

    console.log('\n✨ Setup complete! Run `npm run dev` to start development server.');
    rl.close();
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setup();
