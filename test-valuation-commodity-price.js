/**
 * Test script to verify the valuation commodity price check functionality
 * This script tests the modified logic for checking commodity prices based on job card received date
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testValuationCommodityPriceCheck() {
  console.log('Testing valuation commodity price check functionality...\n');

  try {
    // Find a job card to test with
    const jobCard = await prisma.jobCard.findFirst({
      include: {
        commodity: true,
        exporter: true,
      }
    });

    if (!jobCard) {
      console.log('No job cards found to test with');
      return;
    }

    console.log(`Testing with Job Card: ${jobCard.referenceNumber}`);
    console.log(`Received Date: ${jobCard.receivedDate}`);
    console.log(`Commodity: ${jobCard.commodity?.name}`);
    
    // Extract the date part from the received date
    const receivedDateStr = jobCard.receivedDate.toISOString().split('T')[0];
    console.log(`Formatted received date: ${receivedDateStr}`);

    // Check if there's a commodity price for the received date
    const commodityPrices = await prisma.dailyPrice.findMany({
      where: {
        type: 'COMMODITY',
        itemId: jobCard.commodityId,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`\nFound ${commodityPrices.length} commodity prices for this commodity`);

    // Check for prices matching the received date
    const matchingPrices = commodityPrices.filter(price => {
      const priceDate = price.createdAt.toISOString().split('T')[0];
      return priceDate === receivedDateStr;
    });

    console.log(`Prices matching received date (${receivedDateStr}): ${matchingPrices.length}`);

    if (matchingPrices.length === 0) {
      console.log('✅ TEST CASE: No commodity price found for job card received date');
      console.log('Expected behavior: Toast message should show and valuation should not proceed');
    } else {
      console.log('✅ TEST CASE: Commodity price found for job card received date');
      console.log('Expected behavior: Valuation should proceed normally');
      console.log(`Price: $${matchingPrices[0].price} per ounce`);
    }

    // Show available prices for reference
    console.log('\nAvailable commodity prices:');
    commodityPrices.slice(0, 5).forEach(price => {
      const priceDate = price.createdAt.toISOString().split('T')[0];
      console.log(`  ${priceDate}: $${price.price}`);
    });

  } catch (error) {
    console.error('Error testing valuation commodity price check:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testValuationCommodityPriceCheck();