// test-logging.js - Test script for the comprehensive logging system
const { PrismaClient } = require('./app/generated/prisma');

async function testLogging() {
  console.log('🧪 Testing Logging System...\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Test 1: Check if SystemLog table exists and is accessible
    console.log('1. Testing database connectivity...');
    const logCount = await prisma.systemLog.count();
    console.log(`✅ SystemLog table accessible. Current log count: ${logCount}\n`);
    
    // Test 2: Create a test log entry directly
    console.log('2. Creating test log entry...');
    const testLog = await prisma.systemLog.create({
      data: {
        level: 'INFO',
        category: 'TEST',
        message: 'Test log entry from test script',
        userId: null,
        userName: null,
        userRole: null,
        ipAddress: '127.0.0.1',
        userAgent: 'Test Script',
        requestId: `test_${Date.now()}`,
        metadata: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString(),
          environment: 'development'
        })
      }
    });
    console.log(`✅ Log entry created with ID: ${testLog.id}\n`);
    
    // Test 3: Query recent logs
    console.log('3. Querying recent logs...');
    const recentLogs = await prisma.systemLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        level: true,
        category: true,
        message: true,
        createdAt: true,
        userName: true,
        userRole: true
      }
    });
    
    console.log('📋 Recent log entries:');
    recentLogs.forEach(log => {
      console.log(`  - [${log.level}] ${log.category}: ${log.message}`);
      console.log(`    User: ${log.userName || 'System'} (${log.userRole || 'N/A'})`);
      console.log(`    Time: ${log.createdAt.toISOString()}\n`);
    });
    
    // Test 4: Test log levels and categories
    console.log('4. Testing different log levels and categories...');
    const testLogs = [
      { level: 'DEBUG', category: 'SYSTEM', message: 'Debug message test' },
      { level: 'INFO', category: 'AUTH', message: 'Info message test' },
      { level: 'WARN', category: 'SMS', message: 'Warning message test' },
      { level: 'ERROR', category: 'API', message: 'Error message test' }
    ];
    
    for (const testLogData of testLogs) {
      await prisma.systemLog.create({
        data: {
          ...testLogData,
          requestId: `test_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          ipAddress: '127.0.0.1',
          userAgent: 'Test Script',
          metadata: JSON.stringify({ 
            testType: testLogData.level.toLowerCase(),
            category: testLogData.category 
          })
        }
      });
      console.log(`✅ Created ${testLogData.level} log for ${testLogData.category}`);
    }
    
    console.log('\n5. Final log count check...');
    const finalCount = await prisma.systemLog.count();
    console.log(`✅ Total logs in database: ${finalCount}`);
    
    // Test 6: Test log filtering
    console.log('\n6. Testing log filtering...');
    const errorLogs = await prisma.systemLog.count({
      where: { level: 'ERROR' }
    });
    const smsLogs = await prisma.systemLog.count({
      where: { category: 'SMS' }
    });
    
    console.log(`📊 Error logs: ${errorLogs}`);
    console.log(`📊 SMS logs: ${smsLogs}`);
    
    console.log('\n🎉 Logging system test completed successfully!');
    console.log('\n📝 Summary:');
    console.log('✅ Database connection working');
    console.log('✅ SystemLog table created and accessible');
    console.log('✅ Log creation working');
    console.log('✅ Log querying working');
    console.log('✅ Multiple log levels supported');
    console.log('✅ Multiple categories supported');
    console.log('✅ Log filtering working');
    
  } catch (error) {
    console.error('❌ Logging system test failed:', error);
    console.error('\n🔍 Error details:');
    console.error('Message:', error.message);
    if (error.code) {
      console.error('Code:', error.code);
    }
    if (error.meta) {
      console.error('Meta:', error.meta);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testLogging().catch(console.error);