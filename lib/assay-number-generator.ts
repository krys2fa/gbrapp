import { Prisma } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";

export type AssayType = "LS" | "SS";

/**
 * Generates a human-readable assay number with auto-incrementing sequence
 * Format: LS-ASSY-2025-01 or SS-ASSY-2025-01
 */
export async function generateAssayNumber(
  assayType: AssayType
): Promise<string> {
  const currentYear = new Date().getFullYear();

  try {
    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Get or create the sequence for this year and assay type
        const sequence = await tx.assaySequence.upsert({
          where: {
            year_assayType: {
              year: currentYear,
              assayType: assayType,
            },
          },
          create: {
            year: currentYear,
            assayType: assayType,
            lastNumber: 1,
          },
          update: {
            lastNumber: {
              increment: 1,
            },
          },
        });

        // Format the number with leading zeros (01, 02, etc.)
        const paddedNumber = sequence.lastNumber.toString().padStart(2, "0");

        return `${assayType}-ASSY-${currentYear}-${paddedNumber}`;
      }
    );

    return result;
  } catch (error) {
    console.error("Error generating assay number:", error);
    // Fallback to timestamp-based number if sequence fails
    return `${assayType}-ASSY-${Date.now()}-${Math.floor(
      Math.random() * 1000
    )}`;
  }
}

/**
 * Resets the sequence for a given year and assay type (useful for testing or admin purposes)
 */
export async function resetAssaySequence(
  year: number,
  assayType: AssayType
): Promise<void> {
  await prisma.assaySequence.upsert({
    where: {
      year_assayType: {
        year,
        assayType,
      },
    },
    create: {
      year,
      assayType,
      lastNumber: 0,
    },
    update: {
      lastNumber: 0,
    },
  });
}
