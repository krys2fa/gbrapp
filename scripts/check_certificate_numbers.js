// Use the generated Prisma client to avoid initialization issues on Windows
// generated client is located at ./app/generated/prisma
const { PrismaClient } = require('../app/generated/prisma');

(async () => {
  const prisma = new PrismaClient();
  try {
    const smallCountTotal = await prisma.jobCard.count();
    const smallCountWith = await prisma.jobCard.count({ where: { certificateNumber: { not: null } } });
    const smallWithSample = await prisma.jobCard.findMany({ select: { id: true, referenceNumber: true, certificateNumber: true }, where: { certificateNumber: { not: null } }, take: 20 });

    const largeCountTotal = await prisma.largeScaleJobCard.count();
    const largeCountWith = await prisma.largeScaleJobCard.count({ where: { certificateNumber: { not: null } } });
    const largeWithSample = await prisma.largeScaleJobCard.findMany({ select: { id: true, humanReadableId: true, certificateNumber: true }, where: { certificateNumber: { not: null } }, take: 20 });

    console.log('Small scale job cards - total:', smallCountTotal, 'with certificateNumber:', smallCountWith);
    console.log('Sample small-scale records with certificateNumber:', smallWithSample);
    console.log('\nLarge scale job cards - total:', largeCountTotal, 'with certificateNumber:', largeCountWith);
    console.log('Sample large-scale records with certificateNumber:', largeWithSample);

    // Show a few without certificateNumber
    const smallWithout = await prisma.jobCard.findMany({ select: { id: true, referenceNumber: true, certificateNumber: true }, where: { certificateNumber: null }, take: 5 });
    const largeWithout = await prisma.largeScaleJobCard.findMany({ select: { id: true, humanReadableId: true, certificateNumber: true }, where: { certificateNumber: null }, take: 5 });
    console.log('\nSmall sample without certificateNumber:', smallWithout);
    console.log('Large sample without certificateNumber:', largeWithout);
  } catch (err) {
    console.error('Error querying DB:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();