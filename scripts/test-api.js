async function testCommodityPriceAPI() {
  try {
  console.log("Testing commodity price API for Ag (Silver)...");

  // Test the API endpoint
  const response = await fetch('http://localhost:3000/api/commodities/Ag/price');
    const data = await response.json();

    console.log("API Response:", JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log("✅ Silver price API is working!");
    } else {
      console.log("❌ Silver price API failed:", data.error);
    }

  } catch (error) {
    console.error("Error testing API:", error);
  }
}

testCommodityPriceAPI();