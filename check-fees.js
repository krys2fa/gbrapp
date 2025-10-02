const { PrismaClient } = require('./app/generated/prisma');

async function checkFees() {
  const prisma = new PrismaClient();

  try {
    const feeCount = await prisma.fee.count();
    console.log('Total fees in database:', feeCount);

    if (feeCount > 0) {
      const recentFees = await prisma.fee.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          currency: true,
          jobCard: { include: { exporter: true } },
          largeScaleJobCard: { include: { exporter: true } }
        }
      });

      console.log('Recent fees:');
      recentFees.forEach(fee => {
        console.log(`- ID: ${fee.id}, Amount: ${fee.amountPaid}, Currency: ${fee.currency?.code}, Created: ${fee.createdAt}`);
        console.log(`  Exporter: ${fee.jobCard?.exporter?.name || fee.largeScaleJobCard?.exporter?.name || 'Unknown'}`);
      });
    }

    // Check date range
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentFeeCount = await prisma.fee.count({
      where: { createdAt: { gte: oneDayAgo } }
    });
    console.log(`Fees in last 24 hours: ${recentFeeCount}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFees();