import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withAuth } from "@/app/lib/with-auth";

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
    console.error("Error fetching assay:", error);
    return NextResponse.json(
      { error: "Failed to fetch assay" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getAssay, []);
