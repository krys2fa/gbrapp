const { spawn } = require('child_process');
const path = require('path');

// Simple function to run database queries via Prisma CLI
function runPrismaQuery(query) {
  return new Promise((resolve, reject) => {
    console.log(`Running query: ${query}`);
    
    const prisma = spawn('npx', ['prisma', 'db', 'execute', '--stdin'], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let error = '';
    
    prisma.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    prisma.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    prisma.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Query failed: ${error}`));
      }
    });
    
    prisma.stdin.write(query);
    prisma.stdin.end();
  });
}

async function checkData() {
  try {
    console.log('Checking database for exchange data...\n');
    
    // Check exchanges
    console.log('=== Checking Exchange table ===');
    const exchangeQuery = 'SELECT id, name, symbol FROM "Exchange" LIMIT 10;';
    try {
      const result = await runPrismaQuery(exchangeQuery);
      console.log(result);
    } catch (err) {
      console.log('Could not query Exchange table:', err.message);
    }
    
    // Check daily prices
    console.log('\n=== Checking DailyPrice table for exchanges ===');
    const priceQuery = 'SELECT dp.id, dp.price, dp.date, e.name as exchange_name FROM "DailyPrice" dp LEFT JOIN "Exchange" e ON dp."exchangeId" = e.id WHERE dp.type = \'EXCHANGE\' ORDER BY dp."createdAt" DESC LIMIT 5;';
    try {
      const result = await runPrismaQuery(priceQuery);
      console.log(result);
    } catch (err) {
      console.log('Could not query DailyPrice table:', err.message);
    }
    
  } catch (error) {
    console.error('Database check failed:', error);
  }
}

checkData();