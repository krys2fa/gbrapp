import { Role } from "@/app/generated/prisma";
import { prisma } from "@/app/lib/prisma";
import { withProtectedRoute } from "@/app/lib/with-protected-route";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET handler for fetching all job cards with optional filtering
 */
async function getAllJobCards(req: NextRequest) {
  try {
    // Extract query parameters for filtering
    const { searchParams } = new URL(req.url);
    const exporterId = searchParams.get("exporterId");
    const exporterTypeId = searchParams.get("exporterTypeId");
    const reference = searchParams.get("reference");
    const pmmc = searchParams.get("pmmc");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");
    const hasAssays = searchParams.get("hasAssays");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build where clause based on filters
    const where: any = {};

    if (exporterId) {
      where.exporterId = exporterId;
    }

    // For exporter type filtering, we need to filter by exporters that belong to this type
    if (exporterTypeId) {
      where.exporter = {
        exporterTypeId: exporterTypeId,
      };
    }

    if (reference) {
      where.referenceNumber = { contains: reference };
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

    // Server-side filter: only include job cards that have at least one assay
    if (hasAssays === "true") {
      where.assays = { some: {} };
    }

    // filter by PMMC seal number if provided
    if (pmmc) {
      where.seals = {
        some: { sealType: "PMMC_SEAL", sealNumber: { contains: pmmc } },
      };
    }

    // Get total count of job cards matching the filter
    const totalCount = await prisma.jobCard.count({ where });

    // Get job cards with basic relations and assays when requested
    const includeObj: any = {
      exporter: {
        include: {
          exporterType: true,
        },
      },
      shipmentType: true,
      // include a count of related rows so clients can know if assays exist without pulling full arrays
      _count: {
        select: {
          assays: true,
        },
      },
    };

    if (hasAssays === "true") {
      includeObj.assays = true;
      includeObj.seals = true;
    }

    // Fetch job cards
    const jobCards = await prisma.jobCard.findMany({
      where,
      include: includeObj,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    // If client requested hasAssays=true, sort the returned jobCards by latest assay date (server-side sorting by related array not directly supported across DBs in Prisma), so do a client-side sort here before returning to keep behavior deterministic.
    if (hasAssays === "true") {
      jobCards.sort((a: any, b: any) => {
        const aDate =
          a.assays && a.assays.length
            ? new Date(a.assays[a.assays.length - 1].createdAt).getTime()
            : 0;
        const bDate =
          b.assays && b.assays.length
            ? new Date(b.assays[b.assays.length - 1].createdAt).getTime()
            : 0;
        return bDate - aDate;
      });
    }

    return NextResponse.json({
      jobCards,
      total: totalCount,
    });
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
    const requestData = await req.json();
    console.log("Received data:", JSON.stringify(requestData, null, 2));

    // Extract only the required fields for simplicity
    const data: any = {
      referenceNumber:
        requestData.referenceNumber ||
        `JC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      receivedDate: new Date(),
      exporterId: requestData.exporterId,
      shipmentTypeId: requestData.shipmentTypeId,
      status: requestData.status || "pending",
    };

    // Validate required fields
    if (!data.exporterId || !data.shipmentTypeId) {
      console.log("Missing required fields");
      return NextResponse.json(
        {
          error:
            "Missing required fields: exporterId and shipmentTypeId are required",
        },
        { status: 400 }
      );
    }

    console.log("Creating job card with data:", JSON.stringify(data, null, 2));

    // Create the job card with minimal fields first
    const jobCard = await prisma.jobCard.create({
      data,
      include: {
        exporter: true,
        shipmentType: true,
      },
    });

    console.log("Job card created successfully:", jobCard.id);
    return NextResponse.json(jobCard, { status: 201 });
  } catch (error) {
    console.error("Error creating job card:", error);
    // Return more detailed error information for debugging
    return NextResponse.json(
      {
        error: "Error creating job card",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// Wrap all handlers with auth and audit trail
// export const GET = withProtectedRoute(getAllJobCards, {
//   entityType: "JobCard",
//   requiredRoles: [Role.ADMIN, Role.USER, Role.SUPERADMIN],
// });

// Allow unauthenticated access for GET and POST operations during development
export const GET = getAllJobCards;
export const POST = createJobCard;
