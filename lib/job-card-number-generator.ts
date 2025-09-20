import { Prisma } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";

export type JobCardType = "SS" | "LS";

/**
 * Generates a human-readable job card reference number with auto-incrementing sequence
 * Format: SS-2025-01 or LS-2025-01
 */
export async function generateJobCardNumber(
  cardType: JobCardType
): Promise<string> {
  const currentYear = new Date().getFullYear();

  try {
    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Get or create the sequence for this year and card type
        const sequence = await tx.jobCardSequence.upsert({
          where: {
            year_cardType: {
              year: currentYear,
              cardType: cardType,
            },
          },
          create: {
            year: currentYear,
            cardType: cardType,
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

        return `${cardType}-${currentYear}-${paddedNumber}`;
      }
    );

    return result;
  } catch (error) {
    console.error("Error generating job card number:", error);
    // Fallback to timestamp-based number if sequence fails
    return `${cardType}-${Date.now()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;
  }
}

/**
 * Resets the sequence for a given year and card type (useful for testing or admin purposes)
 */
export async function resetJobCardSequence(
  year: number,
  cardType: JobCardType
): Promise<void> {
  await prisma.jobCardSequence.upsert({
    where: {
      year_cardType: {
        year,
        cardType,
      },
    },
    create: {
      year,
      cardType,
      lastNumber: 0,
    },
    update: {
      lastNumber: 0,
    },
  });
}
