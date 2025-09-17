// Quick test to check what the weekly-prices API returns
console.log('Testing weekly-prices API...');

async function testWeeklyPricesAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/weekly-prices?type=EXCHANGE&approvedOnly=true');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
      
      if (Array.isArray(data)) {
        console.log(`Found ${data.length} approved weekly exchange rates`);
        if (data.length > 0) {
          console.log('Latest rate:', {
            price: data[0].price,
            status: data[0].status,
            weekStart: data[0].weekStartDate,
            weekEnd: data[0].weekEndDate
          });
        }
      } else {
        console.log('Unexpected response format - not an array');
      }
    } else {
      const errorText = await response.text();
      console.log('API Error Response:', errorText);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

// Wait a moment for server to be ready, then test
setTimeout(testWeeklyPricesAPI, 2000);