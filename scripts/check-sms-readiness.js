// scripts/check-sms-readiness.js
// Run with: node scripts/check-sms-readiness.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Validate if a phone number is in a valid format for SMS
 */
function isValidPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  // Remove all non-digit characters
  const cleanedPhone = phone.replace(/\D/g, '');
  
  // Check if it's between 10-15 digits (international standard)
  if (cleanedPhone.length < 10 || cleanedPhone.length > 15) {
    return false;
  }
  
  // Must start with digits (country codes are typically 1-4 digits)
  return /^\d+$/.test(cleanedPhone);
}

async function checkSMSReadiness() {
  try {
    console.log('🔍 Checking SMS readiness for exchange rate notifications...\n');
    
    // Check users with approval roles
    const approvalRoles = ['SUPERADMIN', 'CEO', 'DEPUTY_CEO'];
    
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: approvalRoles,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });

    console.log(`Found ${users.length} users with approval roles:\n`);

    const results = {
      total: users.length,
      active: 0,
      validPhone: 0,
      invalidPhone: 0,
      noPhone: 0,
      issues: []
    };

    users.forEach(user => {
      const phoneValid = isValidPhoneNumber(user.phone);
      const isActive = user.isActive;
      
      if (isActive) results.active++;
      
      let status = '';
      let issue = null;
      
      if (!isActive) {
        status = '❌ INACTIVE';
        issue = `${user.name} (${user.role}) is inactive`;
      } else if (!user.phone) {
        status = '📵 NO PHONE';
        results.noPhone++;
        issue = `${user.name} (${user.role}) has no phone number`;
      } else if (!phoneValid) {
        status = '❌ INVALID PHONE';
        results.invalidPhone++;
        issue = `${user.name} (${user.role}) has invalid phone: ${user.phone}`;
      } else {
        status = '✅ SMS READY';
        results.validPhone++;
      }
      
      if (issue) {
        results.issues.push(issue);
      }
      
      console.log(`${status} - ${user.name} (${user.role})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Phone: ${user.phone || 'N/A'}`);
      console.log('');
    });

    console.log('📊 SUMMARY:');
    console.log(`   Total users: ${results.total}`);
    console.log(`   Active users: ${results.active}`);
    console.log(`   SMS ready: ${results.validPhone}`);
    console.log(`   Invalid phones: ${results.invalidPhone}`);
    console.log(`   No phones: ${results.noPhone}`);
    
    if (results.issues.length > 0) {
      console.log('\n⚠️  ISSUES TO FIX:');
      results.issues.forEach(issue => {
        console.log(`   - ${issue}`);
      });
    }
    
    console.log('\n🔔 NOTIFICATION READINESS:');
    console.log(`   Immediate notifications (SUPERADMIN + CEO): ${users.filter(u => ['SUPERADMIN', 'CEO'].includes(u.role) && isValidPhoneNumber(u.phone) && u.isActive).length} users ready`);
    console.log(`   Delayed notifications (DEPUTY_CEO + SUPERADMIN): ${users.filter(u => ['DEPUTY_CEO', 'SUPERADMIN'].includes(u.role) && isValidPhoneNumber(u.phone) && u.isActive).length} users ready`);
    
    if (results.validPhone === 0) {
      console.log('\n🚨 WARNING: No users have valid phone numbers for SMS notifications!');
      console.log('   Exchange rate approval SMS notifications will not work.');
    } else if (results.validPhone < results.active) {
      console.log('\n⚠️  RECOMMENDATION: Add phone numbers for all active approval users.');
    } else {
      console.log('\n🎉 SMS notifications are properly configured!');
    }
    
  } catch (error) {
    console.error('❌ Error checking SMS readiness:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSMSReadiness();