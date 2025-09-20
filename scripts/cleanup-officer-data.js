import { PrismaClient } from "../app/generated/prisma/index.js";
const prisma = new PrismaClient();

async function cleanupOfficerData() {
  try {
    console.log("🧹 Starting cleanup of NACOB and National Security Officer data...");

    // First, check what data exists
    const nacobOfficers = await prisma.nACOBOfficer.findMany();
    const nationalSecurityOfficers = await prisma.nationalSecurityOfficer.findMany();

    console.log(`Found ${nacobOfficers.length} NACOB Officers`);
    console.log(`Found ${nationalSecurityOfficers.length} National Security Officers`);

    // Check if any job cards are referencing these officers
    const jobCardsWithNacob = await prisma.jobCard.findMany({
      where: { nacobOfficerId: { not: null } },
      select: { id: true, referenceNumber: true, nacobOfficerId: true }
    });

    const jobCardsWithSecurity = await prisma.jobCard.findMany({
      where: { securityOfficerId: { not: null } },
      select: { id: true, referenceNumber: true, securityOfficerId: true }
    });

    const largeScaleJobCardsWithNacob = await prisma.largeScaleJobCard.findMany({
      where: { nacobOfficerId: { not: null } },
      select: { id: true, referenceNumber: true, nacobOfficerId: true }
    });

    const largeScaleJobCardsWithSecurity = await prisma.largeScaleJobCard.findMany({
      where: { nationalSecurityOfficerId: { not: null } },
      select: { id: true, referenceNumber: true, nationalSecurityOfficerId: true }
    });

    console.log(`Found ${jobCardsWithNacob.length} JobCards with NACOB Officers`);
    console.log(`Found ${jobCardsWithSecurity.length} JobCards with Security Officers`);
    console.log(`Found ${largeScaleJobCardsWithNacob.length} LargeScale JobCards with NACOB Officers`);
    console.log(`Found ${largeScaleJobCardsWithSecurity.length} LargeScale JobCards with Security Officers`);

    // Update job cards to remove references to these officers
    if (jobCardsWithNacob.length > 0) {
      console.log("Removing NACOB Officer references from JobCards...");
      await prisma.jobCard.updateMany({
        where: { nacobOfficerId: { not: null } },
        data: { nacobOfficerId: null }
      });
    }

    if (jobCardsWithSecurity.length > 0) {
      console.log("Removing Security Officer references from JobCards...");
      await prisma.jobCard.updateMany({
        where: { securityOfficerId: { not: null } },
        data: { securityOfficerId: null }
      });
    }

    if (largeScaleJobCardsWithNacob.length > 0) {
      console.log("Removing NACOB Officer references from Large Scale JobCards...");
      await prisma.largeScaleJobCard.updateMany({
        where: { nacobOfficerId: { not: null } },
        data: { nacobOfficerId: null }
      });
    }

    if (largeScaleJobCardsWithSecurity.length > 0) {
      console.log("Removing Security Officer references from Large Scale JobCards...");
      await prisma.largeScaleJobCard.updateMany({
        where: { nationalSecurityOfficerId: { not: null } },
        data: { nationalSecurityOfficerId: null }
      });
    }

    console.log("✅ Cleanup completed successfully!");
    console.log("You can now run the migration to remove the officer tables.");

  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOfficerData();