import { prisma } from "../app/lib/prisma.ts";

async function testSilverPriceFetching() {
  try {
    // Find the silver commodity
    const silverCommodity = await prisma.commodity.findFirst({
      where: { name: "Silver" }
    });

    if (!silverCommodity) {
      console.log("Silver commodity not found");
      return;
    }

    console.log(`Testing price fetching for Silver (${silverCommodity.symbol})`);

    // Try to fetch price for silver
    const { fetchAndSaveCommodityPriceIfMissing } = await import("../app/lib/external-prices.ts");

    const result = await fetchAndSaveCommodityPriceIfMissing(silverCommodity.id);
    console.log("Price fetching result:", result);

    // Check if a price was saved
    const recentPrices = await prisma.dailyPrice.findMany({
      where: {
        commodityId: silverCommodity.id,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log("Recent silver prices:");
    recentPrices.forEach(price => {
      console.log(`- $${price.price} (${price.currency}) on ${price.createdAt}`);
    });

  } catch (error) {
    console.error("Error testing silver price fetching:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testSilverPriceFetching();