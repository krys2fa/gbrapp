// Test script to verify commodity price date selection functionality
const testCommodityPriceWithDate = async () => {
  try {
    console.log('Testing commodity price creation with custom date...');

    // First, get available commodities
    const commoditiesResponse = await fetch('http://localhost:3000/api/commodity');
    const commodities = await commoditiesResponse.json();

    if (!commodities || commodities.length === 0) {
      console.log('No commodities found. Please create a commodity first.');
      return;
    }

    const testCommodity = commodities[0];
    console.log(`Using commodity: ${testCommodity.name} (${testCommodity.symbol})`);

    // Test date: yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const testDate = yesterday.toISOString().split('T')[0];

    console.log(`Setting price for date: ${testDate}`);

    // Create price with specific date
    const response = await fetch('http://localhost:3000/api/daily-prices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'COMMODITY',
        itemId: testCommodity.id,
        price: 1500.50,
        date: testDate
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create price: ${error.error}`);
    }

    const result = await response.json();
    console.log('✅ Price created successfully!');
    console.log('Result:', result);

    // Verify the date was set correctly
    if (result.date) {
      const resultDate = new Date(result.date).toISOString().split('T')[0];
      if (resultDate === testDate) {
        console.log('✅ Date was set correctly!');
      } else {
        console.log('❌ Date mismatch:', { expected: testDate, actual: resultDate });
      }
    }

    // Fetch prices to verify it appears in the list
    const pricesResponse = await fetch('http://localhost:3000/api/daily-prices');
    const prices = await pricesResponse.json();

    const createdPrice = prices.find((p: any) => p.id === result.id);
    if (createdPrice) {
      console.log('✅ Price appears in the list!');
      console.log('Price details:', {
        commodity: createdPrice.commodity?.name,
        price: createdPrice.price,
        date: new Date(createdPrice.date).toLocaleDateString()
      });
    } else {
      console.log('❌ Price not found in the list');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testCommodityPriceWithDate();