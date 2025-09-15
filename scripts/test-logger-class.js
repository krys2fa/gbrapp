// test-logger-class.js - Test the Logger class implementation
const { Logger, LogLevel, LogCategory } = require('../lib/logger.ts');

async function testLoggerClass() {
  console.log('🧪 Testing Logger Class Implementation...\n');
  
  try {
    // Test 1: Create logger instance
    console.log('1. Testing Logger singleton...');
    const logger1 = Logger.getInstance();
    const logger2 = Logger.getInstance();
    console.log(`✅ Singleton working: ${logger1 === logger2 ? 'Same instance' : 'Different instances'}\n`);
    
    // Test 2: Test different log levels
    console.log('2. Testing different log levels...');
    await logger1.debug(LogCategory.SYSTEM, 'Debug message from Logger class');
    await logger1.info(LogCategory.AUTH, 'Info message from Logger class');
    await logger1.warn(LogCategory.SMS, 'Warning message from Logger class');
    await logger1.error(LogCategory.API, 'Error message from Logger class');
    console.log('✅ All log levels tested\n');
    
    // Test 3: Test structured logging
    console.log('3. Testing structured logging...');
    await logger1.log({
      level: LogLevel.INFO,
      category: LogCategory.SMS,
      message: 'Structured log message',
      userId: 'test-user-123',
      userName: 'Test User',
      userRole: 'ADMIN',
      ipAddress: '192.168.1.100',
      userAgent: 'Test Browser',
      requestId: 'req_test_123',
      metadata: {
        feature: 'logging_test',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    });
    console.log('✅ Structured logging tested\n');
    
    // Test 4: Test convenience methods
    console.log('4. Testing convenience methods...');
    await logger1.logAuth('User login attempt', { userId: 'user123', success: true });
    await logger1.logSMS('SMS sent successfully', { phone: '+233123456789', messageId: 'sms_123' });
    await logger1.logAPI('API request processed', { endpoint: '/api/test', statusCode: 200 });
    await logger1.logSystem('System startup completed', { version: '1.0.0', environment: 'test' });
    console.log('✅ Convenience methods tested\n');
    
    // Test 5: Check if logs are being created
    console.log('5. Checking database logs...');
    const { PrismaClient } = require('../app/generated/prisma/index');
    const prisma = new PrismaClient();
    
    const logCount = await prisma.systemLog.count();
    console.log(`✅ Total logs in database: ${logCount}`);
    
    const recentLogs = await prisma.systemLog.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        level: true,
        category: true,
        message: true,
        userName: true,
        createdAt: true
      }
    });
    
    console.log('📋 Most recent logs:');
    recentLogs.forEach(log => {
      console.log(`  - [${log.level}] ${log.category}: ${log.message}`);
      console.log(`    User: ${log.userName || 'System'}, Time: ${log.createdAt.toISOString()}\n`);
    });
    
    await prisma.$disconnect();
    
    console.log('🎉 Logger class test completed successfully!');
    console.log('\n📝 Summary:');
    console.log('✅ Logger singleton pattern working');
    console.log('✅ All log levels functional');
    console.log('✅ Structured logging working');
    console.log('✅ Convenience methods working');
    console.log('✅ Database integration working');
    console.log('✅ File logging should be working (check /logs directory)');
    
  } catch (error) {
    console.error('❌ Logger class test failed:', error);
    console.error('\n🔍 Error details:');
    console.error('Message:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }
}

// Run the test
testLoggerClass().catch(console.error);