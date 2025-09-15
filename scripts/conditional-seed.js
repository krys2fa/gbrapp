const { execSync } = require('child_process');

/**
 * Conditional Seeding Script
 * 
 * This script runs during Vercel build only if SHOULD_SEED=true
 * Used for one-time production seeding during deployment
 */

console.log('🔍 Checking if seeding is required...');

// Only seed if SHOULD_SEED environment variable is set to 'true'
if (process.env.SHOULD_SEED === 'true') {
  console.log('🌱 SHOULD_SEED=true detected. Running database seed...');
  
  try {
    execSync('npx prisma db seed', { stdio: 'inherit' });
    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    process.exit(1);
  }
} else {
  console.log('⏭️  SHOULD_SEED not set to true. Skipping database seed.');
  console.log('   To seed during deployment, set SHOULD_SEED=true in Vercel environment variables.');
}