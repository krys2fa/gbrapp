import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withAuth } from "@/app/lib/with-auth";
import { logger, LogCategory } from "@/lib/logger";

async function testDatabaseConnection(request: NextRequest) {
  try {
    // Test basic database connectivity
    const count = await prisma.largeScaleJobCard.count();
    void logger.info(LogCategory.ASSAY, "Database connection test successful", {
      totalJobCards: count,
    });

    // Test a simple query
    const sampleJobCard = await prisma.largeScaleJobCard.findFirst({
      select: {
        id: true,
        humanReadableId: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      totalJobCards: count,
      sampleJobCard,
    });
  } catch (error) {
    void logger.error(LogCategory.ASSAY, "Database connection test failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Database connection failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(testDatabaseConnection, []);
