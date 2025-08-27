import { PrismaClient, Role } from "@/app/generated/prisma";
import { withProtectedRoute } from "@/app/lib/with-protected-route";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

/**
 * GET handler for fetching all job cards with optional filtering
 */
async function getAllJobCards(req: NextRequest) {
  try {
    // Extract query parameters for filtering
    const { searchParams } = new URL(req.url);
    const exporterId = searchParams.get("exporterId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");

    // Build where clause based on filters
    const where: any = {};

    if (exporterId) {
      where.exporterId = exporterId;
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.createdAt = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      where.createdAt = {
        lte: new Date(endDate),
      };
    }

    if (status) {
      where.status = status;
    }

    // Get job cards with basic relations
    const jobCards = await prisma.jobCard.findMany({
      where,
      include: {
        exporter: true,
        shipmentType: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(jobCards);
  } catch (error) {
    console.error("Error fetching job cards:", error);
    return NextResponse.json(
      { error: "Error fetching job cards" },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new job card
 */
async function createJobCard(req: NextRequest) {
  try {
    const data = await req.json();

    // Validate required fields
    if (!data.exporterId || !data.shipmentTypeId) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: exporterId and shipmentTypeId are required",
        },
        { status: 400 }
      );
    }

    // Create the job card
    const jobCard = await prisma.jobCard.create({
      data,
      include: {
        exporter: true,
        shipmentType: true,
      },
    });

    return NextResponse.json(jobCard, { status: 201 });
  } catch (error) {
    console.error("Error creating job card:", error);
    return NextResponse.json(
      { error: "Error creating job card" },
      { status: 500 }
    );
  }
}

// Wrap all handlers with auth and audit trail
export const GET = withProtectedRoute(getAllJobCards, {
  entityType: "JobCard",
  requiredRoles: [Role.ADMIN, Role.USER, Role.SUPERADMIN],
});

export const POST = withProtectedRoute(createJobCard, {
  entityType: "JobCard",
  requiredRoles: [Role.ADMIN, Role.SUPERADMIN],
});
