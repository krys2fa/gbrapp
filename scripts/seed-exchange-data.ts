import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();

async function seedExchangeData() {
  try {
    console.log('🔄 Seeding exchange data...');

    // Check if USD exchange already exists
    let usdExchange = await prisma.exchange.findFirst({
      where: { symbol: 'USD' }
    });

    if (!usdExchange) {
      // Create USD exchange
      usdExchange = await prisma.exchange.create({
        data: {
          name: 'US Dollar',
          symbol: 'USD'
        }
      });
      console.log('✅ Created USD exchange:', usdExchange);
    } else {
      console.log('✅ USD exchange already exists:', usdExchange);
    }

    // Check if GHS exchange already exists
    let ghsExchange = await prisma.exchange.findFirst({
      where: { symbol: 'GHS' }
    });

    if (!ghsExchange) {
      // Create GHS exchange
      ghsExchange = await prisma.exchange.create({
        data: {
          name: 'Ghana Cedi',
          symbol: 'GHS'
        }
      });
      console.log('✅ Created GHS exchange:', ghsExchange);
    } else {
      console.log('✅ GHS exchange already exists:', ghsExchange);
    }

    // Check if there are any exchange rates for today
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const existingRates = await prisma.dailyPrice.findMany({
      where: {
        type: 'EXCHANGE',
        date: {
          gte: startOfToday,
          lt: endOfToday
        }
      }
    });

    if (existingRates.length === 0) {
      // Create some sample exchange rates
      const sampleRate = 15.75; // USD to GHS rate (approximate)
      
      const usdToGhsRate = await prisma.dailyPrice.create({
        data: {
          type: 'EXCHANGE',
          exchangeId: usdExchange.id,
          price: sampleRate,
          date: new Date()
        }
      });
      console.log('✅ Created USD to GHS exchange rate:', usdToGhsRate);

      // Also create a GHS rate (usually 1.0 for base currency)
      const ghsRate = await prisma.dailyPrice.create({
        data: {
          type: 'EXCHANGE',
          exchangeId: ghsExchange.id,
          price: 1.0,
          date: new Date()
        }
      });
      console.log('✅ Created GHS base rate:', ghsRate);
    } else {
      console.log('✅ Exchange rates already exist for today:', existingRates.length, 'rates');
    }

    console.log('🎉 Exchange data seeding completed!');

  } catch (error) {
    console.error('❌ Error seeding exchange data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedExchangeData();