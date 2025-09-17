const http = require('http');

async function testAPI(path, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n=== Testing ${description} ===`);
    console.log(`Path: ${path}`);
    
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      timeout: 15000
    }, (res) => {
      console.log('Status:', res.statusCode);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const jsonData = JSON.parse(data);
            console.log('Success! Data received:');
            console.log(JSON.stringify(jsonData, null, 2));
            resolve(jsonData);
          } else {
            console.log('Error response:', data);
            resolve({ error: true, status: res.statusCode, data });
          }
        } catch (err) {
          console.log('Raw response:', data);
          resolve({ error: true, message: 'Failed to parse JSON' });
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Request failed:', error.message);
      resolve({ error: true, message: error.message });
    });
    
    req.on('timeout', () => {
      console.error('Request timed out');
      req.destroy();
      resolve({ error: true, message: 'Request timed out' });
    });
    
    req.end();
  });
}

async function runTests() {
  console.log('Testing exchange-related API endpoints...\n');
  
  // Test basic exchange endpoint
  await testAPI('/api/exchange', 'Exchange Entities');
  
  // Test daily exchange endpoint
  await testAPI('/api/daily-exchange', 'Daily Exchange Rates');
  
  // Test specific exchange rate endpoint
  await testAPI('/api/exchange/usd-ghs/rate', 'USD-GHS Rate');
  
  console.log('\n=== Tests completed ===');
}

runTests();