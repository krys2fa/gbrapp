const { PrismaClient } = require('../app/generated/prisma');

async function getExporterIds() {
  const prisma = new PrismaClient();

  try {
    const exporters = await prisma.exporter.findMany({
      select: {
        id: true,
        name: true,
        exporterCode: true
      }
    });

    console.log('Available exporters:');
    exporters.forEach(exp => {
      console.log(`${exp.name} (${exp.exporterCode}): ${exp.id}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getExporterIds();