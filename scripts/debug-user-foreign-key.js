// debug-user-foreign-key.js - Debug script for WeeklyPrice submittedBy foreign key issue
const { PrismaClient } = require('../app/generated/prisma');

async function debugUserForeignKey() {
  console.log('🔍 Debugging WeeklyPrice submittedBy foreign key constraint...\n');
  
  const prisma = new PrismaClient();
  
  try {
    // 1. Check if there are any users in the database
    console.log('1. Checking User table...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    
    console.log(`✅ Found ${users.length} users in database:`);
    users.forEach(user => {
      console.log(`   - ID: ${user.id}`);
      console.log(`     Name: ${user.name}`);
      console.log(`     Email: ${user.email}`);
      console.log(`     Role: ${user.role}`);
      console.log(`     Created: ${user.createdAt.toISOString()}\n`);
    });
    
    if (users.length === 0) {
      console.log('❌ NO USERS FOUND! This is likely the cause of the foreign key constraint error.');
      console.log('   The submittedBy field is trying to reference a user that doesn\'t exist.\n');
      
      console.log('🔧 SOLUTION: You need to seed the database with users first.');
      console.log('   Run: npm run db:seed\n');
      return;
    }
    
    // 2. Check existing WeeklyPrice records
    console.log('2. Checking existing WeeklyPrice records...');
    const weeklyPrices = await prisma.weeklyPrice.findMany({
      select: {
        id: true,
        type: true,
        price: true,
        submittedBy: true,
        submittedByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        createdAt: true
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`✅ Found ${weeklyPrices.length} recent WeeklyPrice records:`);
    weeklyPrices.forEach(price => {
      console.log(`   - ID: ${price.id}`);
      console.log(`     Type: ${price.type}`);
      console.log(`     Price: ${price.price}`);
      console.log(`     Submitted By ID: ${price.submittedBy}`);
      console.log(`     Submitted By User: ${price.submittedByUser ? price.submittedByUser.name : 'NULL/MISSING'}`);
      console.log(`     Created: ${price.createdAt.toISOString()}\n`);
    });
    
    // 3. Check for orphaned submittedBy references
    console.log('3. Checking for orphaned submittedBy references...');
    const orphanedPrices = await prisma.weeklyPrice.findMany({
      where: {
        submittedBy: {
          not: null
        },
        submittedByUser: null
      },
      select: {
        id: true,
        submittedBy: true,
        type: true,
        price: true
      }
    });
    
    if (orphanedPrices.length > 0) {
      console.log(`❌ Found ${orphanedPrices.length} WeeklyPrice records with invalid submittedBy references:`);
      orphanedPrices.forEach(price => {
        console.log(`   - WeeklyPrice ID: ${price.id}`);
        console.log(`     Invalid User ID: ${price.submittedBy}`);
        console.log(`     Type: ${price.type}, Price: ${price.price}\n`);
      });
    } else {
      console.log('✅ No orphaned submittedBy references found.');
    }
    
    // 4. Test what user ID would be used for new submissions
    console.log('4. Simulating JWT token parsing...');
    
    // Check if there's a system user that could be used as default
    const systemUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'system@gbrapp.com' },
          { name: { contains: 'System' } },
          { role: 'SUPERADMIN' }
        ]
      }
    });
    
    if (systemUser) {
      console.log('✅ Found potential system/admin user for submissions:');
      console.log(`   - ID: ${systemUser.id}`);
      console.log(`   - Name: ${systemUser.name}`);
      console.log(`   - Email: ${systemUser.email}`);
      console.log(`   - Role: ${systemUser.role}`);
    } else {
      console.log('⚠️  No system/admin user found. Consider creating one.');
    }
    
    console.log('\n🎯 DIAGNOSIS COMPLETE');
    console.log('\n📋 COMMON SOLUTIONS:');
    console.log('1. Run database seeding: npm run db:seed');
    console.log('2. Ensure users exist before creating WeeklyPrice records');
    console.log('3. Check JWT token contains valid userId');
    console.log('4. Make submittedBy field optional if needed');
    console.log('5. Add proper error handling for missing users');
    
  } catch (error) {
    console.error('❌ Debug script failed:', error);
    console.error('Message:', error.message);
    if (error.code) {
      console.error('Error Code:', error.code);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug
debugUserForeignKey().catch(console.error);