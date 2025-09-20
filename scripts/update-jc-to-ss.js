import { PrismaClient } from '../app/generated/prisma/index.js';

const prisma = new PrismaClient();

/**
 * Script to update job card sequences from JC to SS format
 */
async function updateJobCardSequences() {
  console.log('Starting to update job card sequences from JC to SS format...');

  try {
    // Update any existing JC sequences to SS
    const jcSequences = await prisma.jobCardSequence.findMany({
      where: {
        cardType: 'JC'
      }
    });

    console.log(`Found ${jcSequences.length} JC sequences to update`);

    for (const sequence of jcSequences) {
      await prisma.jobCardSequence.update({
        where: { id: sequence.id },
        data: { cardType: 'SS' }
      });
      console.log(`Updated sequence ${sequence.id} from JC to SS for year ${sequence.year}`);
    }

    // Update any existing job card reference numbers from JC format to SS format
    const jobCardsToUpdate = await prisma.jobCard.findMany({
      where: {
        referenceNumber: {
          startsWith: 'JC-'
        }
      }
    });

    console.log(`Found ${jobCardsToUpdate.length} job cards with JC reference numbers to update`);

    for (const jobCard of jobCardsToUpdate) {
      const newReferenceNumber = jobCard.referenceNumber.replace('JC-', 'SS-');
      await prisma.jobCard.update({
        where: { id: jobCard.id },
        data: { referenceNumber: newReferenceNumber }
      });
      console.log(`Updated job card ${jobCard.id} from ${jobCard.referenceNumber} to ${newReferenceNumber}`);
    }

    console.log('✅ Successfully updated all job card sequences and reference numbers from JC to SS format!');

  } catch (error) {
    console.error('❌ Error updating job card sequences:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateJobCardSequences()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });