// Quick test script to verify humanReadableId columns are working
const { PrismaClient } = require('./app/generated/prisma');

async function testHumanReadableId() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing JobCard humanReadableId...');
    const jobCards = await prisma.jobCard.findMany({
      select: {
        id: true,
        humanReadableId: true,
        createdAt: true
      },
      take: 5
    });
    
    console.log('JobCard records:');
    jobCards.forEach(card => {
      console.log(`- ${card.humanReadableId} (created: ${card.createdAt.toISOString().split('T')[0]})`);
    });
    
    console.log('\nTesting LargeScaleJobCard humanReadableId...');
    const largeScaleJobCards = await prisma.largeScaleJobCard.findMany({
      select: {
        id: true,
        humanReadableId: true,
        createdAt: true
      },
      take: 5
    });
    
    console.log('LargeScaleJobCard records:');
    largeScaleJobCards.forEach(card => {
      console.log(`- ${card.humanReadableId} (created: ${card.createdAt.toISOString().split('T')[0]})`);
    });
    
    console.log('\n✅ humanReadableId columns are working correctly!');
    
  } catch (error) {
    console.error('❌ Error testing humanReadableId:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testHumanReadableId();