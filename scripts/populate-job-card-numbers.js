import { PrismaClient } from '../app/generated/prisma/index.js';

const prisma = new PrismaClient();

/**
 * Script to populate humanReadableReferenceNumber for existing job cards
 * This should be run after the database migration is complete
 */
async function populateHumanReadableJobCardNumbers() {
  console.log('Starting to populate human-readable job card reference numbers...');

  try {
    // Initialize sequence trackers
    const sequences = {};

    // Helper function to get next sequence number
    const getNextSequenceNumber = (cardType, year) => {
      const key = `${cardType}-${year}`;
      if (!sequences[key]) {
        sequences[key] = 0;
      }
      sequences[key]++;
      const paddedNumber = sequences[key].toString().padStart(2, '0');
      return `${cardType}-${year}-${paddedNumber}`;
    };

    // Process regular job cards (small-scale)
    console.log('Processing regular job cards...');
    const regularJobCards = await prisma.jobCard.findMany({
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`Found ${regularJobCards.length} regular job cards to update`);

    for (const jobCard of regularJobCards) {
      const year = jobCard.createdAt.getFullYear();
      const humanReadableNumber = getNextSequenceNumber('JC', year);
      
      // We'll add a new field for human-readable reference numbers to avoid conflicts
      // For now, we'll just update the existing referenceNumber field
      await prisma.jobCard.update({
        where: { id: jobCard.id },
        data: { 
          referenceNumber: humanReadableNumber
        }
      });

      console.log(`Updated job card ${jobCard.id} from ${jobCard.referenceNumber} to: ${humanReadableNumber}`);
    }

    // Process large-scale job cards
    console.log('Processing large-scale job cards...');
    const largeScaleJobCards = await prisma.largeScaleJobCard.findMany({
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`Found ${largeScaleJobCards.length} large-scale job cards to update`);

    for (const jobCard of largeScaleJobCards) {
      const year = jobCard.createdAt.getFullYear();
      const humanReadableNumber = getNextSequenceNumber('LS', year);
      
      await prisma.largeScaleJobCard.update({
        where: { id: jobCard.id },
        data: { 
          referenceNumber: humanReadableNumber
        }
      });

      console.log(`Updated large-scale job card ${jobCard.id} from ${jobCard.referenceNumber} to: ${humanReadableNumber}`);
    }

    // Update the JobCardSequence table with the final counts
    console.log('Updating sequence table...');
    for (const [key, lastNumber] of Object.entries(sequences)) {
      const [cardType, year] = key.split('-');
      
      await prisma.jobCardSequence.upsert({
        where: {
          year_cardType: {
            year: parseInt(year),
            cardType: cardType
          }
        },
        create: {
          year: parseInt(year),
          cardType: cardType,
          lastNumber: lastNumber
        },
        update: {
          lastNumber: lastNumber
        }
      });

      console.log(`Set sequence for ${cardType}-${year} to ${lastNumber}`);
    }

    console.log('✅ Successfully populated all human-readable job card reference numbers!');

  } catch (error) {
    console.error('❌ Error populating job card numbers:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
populateHumanReadableJobCardNumbers()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });