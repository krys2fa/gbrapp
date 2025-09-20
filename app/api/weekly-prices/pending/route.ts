// app/api/weekly-prices/pending/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import {
  validateAPIPermission,
  createUnauthorizedResponse,
} from "@/app/lib/api-validation";

export async function GET(req: NextRequest) {
  try {
    // Validate user has pending-approvals permission
    const validation = await validateAPIPermission(req, "pending-approvals");
    if (!validation.success) {
      return createUnauthorizedResponse(
        validation.error!,
        validation.statusCode
      );
    }

    const pendingPrices = await prisma.weeklyPrice.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        commodity: true,
        exchange: true,
        submittedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(pendingPrices);
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending approvals" },
      { status: 500 }
    );
  }
}
