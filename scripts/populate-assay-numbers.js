import { PrismaClient } from '../app/generated/prisma/index.js';

const prisma = new PrismaClient();

/**
 * Script to populate humanReadableAssayNumber for existing assays
 * This should be run after the database migration is complete
 */
async function populateHumanReadableAssayNumbers() {
  console.log('Starting to populate human-readable assay numbers...');

  try {
    // Initialize sequence trackers
    const sequences = {};

    // Helper function to get next sequence number
    const getNextSequenceNumber = (assayType, year) => {
      const key = `${assayType}-${year}`;
      if (!sequences[key]) {
        sequences[key] = 0;
      }
      sequences[key]++;
      const paddedNumber = sequences[key].toString().padStart(2, '0');
      return `${assayType}-ASSY-${year}-${paddedNumber}`;
    };

    // Process small-scale assays
    console.log('Processing small-scale assays...');
    const smallScaleAssays = await prisma.assay.findMany({
      where: {
        humanReadableAssayNumber: null
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`Found ${smallScaleAssays.length} small-scale assays to update`);

    for (const assay of smallScaleAssays) {
      const year = assay.createdAt.getFullYear();
      const humanReadableNumber = getNextSequenceNumber('SS', year);
      
      await prisma.assay.update({
        where: { id: assay.id },
        data: { humanReadableAssayNumber: humanReadableNumber }
      });

      console.log(`Updated assay ${assay.id} with number: ${humanReadableNumber}`);
    }

    // Process large-scale assays
    console.log('Processing large-scale assays...');
    const largeScaleAssays = await prisma.largeScaleAssay.findMany({
      where: {
        humanReadableAssayNumber: null
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`Found ${largeScaleAssays.length} large-scale assays to update`);

    for (const assay of largeScaleAssays) {
      const year = assay.createdAt.getFullYear();
      const humanReadableNumber = getNextSequenceNumber('LS', year);
      
      await prisma.largeScaleAssay.update({
        where: { id: assay.id },
        data: { humanReadableAssayNumber: humanReadableNumber }
      });

      console.log(`Updated large-scale assay ${assay.id} with number: ${humanReadableNumber}`);
    }

    // Update the AssaySequence table with the final counts
    console.log('Updating sequence table...');
    for (const [key, lastNumber] of Object.entries(sequences)) {
      const [assayType, year] = key.split('-');
      
      await prisma.assaySequence.upsert({
        where: {
          year_assayType: {
            year: parseInt(year),
            assayType: assayType
          }
        },
        create: {
          year: parseInt(year),
          assayType: assayType,
          lastNumber: lastNumber
        },
        update: {
          lastNumber: lastNumber
        }
      });

      console.log(`Set sequence for ${assayType}-${year} to ${lastNumber}`);
    }

    console.log('✅ Successfully populated all human-readable assay numbers!');

  } catch (error) {
    console.error('❌ Error populating assay numbers:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
populateHumanReadableAssayNumbers()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });