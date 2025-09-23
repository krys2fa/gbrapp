import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withAuth } from "@/app/lib/with-auth";
import { logger, LogCategory } from "@/lib/logger";

async function getAssay(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assayId: string }> }
) {
  try {
    const { id: jobCardId, assayId } = await params;

    const assay = await prisma.largeScaleAssay.findFirst({
      where: {
        id: assayId,
        jobCardId: jobCardId,
      },
      include: {
        measurements: {
          orderBy: { piece: "asc" },
        },
        shipmentType: true,
      },
    });

    if (!assay) {
      return NextResponse.json({ error: "Assay not found" }, { status: 404 });
    }

    return NextResponse.json(assay);
  } catch (error) {
    void logger.error(LogCategory.ASSAY, "Error fetching assay detail", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to fetch assay" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getAssay, []);
