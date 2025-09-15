#!/usr/bin/env node

/**
 * Production Database Seeding Script
 * 
 * This script safely seeds the production database by:
 * 1. Temporarily switching to production database
 * 2. Running the seed command
 * 3. Restoring development database connection
 * 
 * Usage: node scripts/seed-production.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ENV_FILE = path.join(__dirname, '..', '.env');
const BACKUP_FILE = path.join(__dirname, '..', '.env.backup');

async function seedProduction() {
  console.log('🌱 Starting production database seeding...\n');

  try {
    // Step 1: Backup current .env file
    console.log('📋 1. Backing up current .env file...');
    if (fs.existsSync(ENV_FILE)) {
      fs.copyFileSync(ENV_FILE, BACKUP_FILE);
      console.log('✅ .env file backed up to .env.backup\n');
    } else {
      console.error('❌ .env file not found!');
      process.exit(1);
    }

    // Step 2: Read current .env content
    const envContent = fs.readFileSync(ENV_FILE, 'utf8');
    const envLines = envContent.split('\n');

    // Step 3: Find production database URL
    let productionUrl = null;
    for (const line of envLines) {
      if (line.startsWith('PRODUCTION_DATABASE_URL=')) {
        productionUrl = line.replace('PRODUCTION_DATABASE_URL=', '').trim();
        break;
      }
    }

    if (!productionUrl) {
      console.error('❌ PRODUCTION_DATABASE_URL not found in .env file!');
      console.log('Please ensure your .env file contains PRODUCTION_DATABASE_URL');
      process.exit(1);
    }

    // Step 4: Update DATABASE_URL to point to production
    console.log('🔄 2. Switching to production database...');
    const updatedLines = envLines.map(line => {
      if (line.startsWith('DATABASE_URL=')) {
        return `DATABASE_URL=${productionUrl}`;
      }
      return line;
    });

    fs.writeFileSync(ENV_FILE, updatedLines.join('\n'));
    console.log('✅ DATABASE_URL updated to production database\n');

    // Step 5: Deploy migrations first
    console.log('🔄 3. Deploying database migrations...');
    execSync('npx prisma migrate deploy', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log('✅ Migrations deployed successfully\n');

    // Step 6: Run seed command
    console.log('🌱 4. Running database seed...');
    console.log('This may take a few minutes...\n');
    
    execSync('npm run db:seed', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    
    console.log('✅ Database seeded successfully!\n');

    // Step 7: Restore original .env file
    console.log('🔄 5. Restoring development database connection...');
    fs.copyFileSync(BACKUP_FILE, ENV_FILE);
    fs.unlinkSync(BACKUP_FILE); // Clean up backup
    console.log('✅ Development database connection restored\n');

    console.log('🎉 Production seeding completed successfully!');
    console.log('📝 Next steps:');
    console.log('   1. Visit your Vercel app to verify data');
    console.log('   2. Login with admin credentials and change default passwords');
    console.log('   3. Test all functionality');

  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
    
    // Restore .env file if backup exists
    if (fs.existsSync(BACKUP_FILE)) {
      console.log('🔄 Restoring .env file from backup...');
      fs.copyFileSync(BACKUP_FILE, ENV_FILE);
      fs.unlinkSync(BACKUP_FILE);
      console.log('✅ .env file restored');
    }
    
    process.exit(1);
  }
}

// Confirmation prompt
console.log('⚠️  PRODUCTION DATABASE SEEDING');
console.log('This will add initial data to your production database.');
console.log('Make sure your production database is empty or you want to add seed data.\n');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Are you sure you want to proceed? (yes/no): ', (answer) => {
  rl.close();
  
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    seedProduction();
  } else {
    console.log('❌ Seeding cancelled');
    process.exit(0);
  }
});