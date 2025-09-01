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

    // Use an explicit select to avoid referencing columns that may not exist in older DBs
    const selectObj: any = {
      id: true,
      referenceNumber: true,
      receivedDate: true,
      status: true,
      exporterId: true,
      shipmentTypeId: true,
      createdAt: true,
      updatedAt: true,
      // include lightweight relations via select to avoid selecting all job card columns
      exporter: {
        select: {
          id: true,
          name: true,
          exporterType: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      shipmentType: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          assays: true,
        },
      },
    };

    // Fetch job cards (only selected fields)
    const jobCards = await prisma.jobCard.findMany({
      where,
      select: selectObj,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    // If assays were requested, fetch assays separately and attach them to the job cards to avoid selecting additional jobcard columns that may be missing in the DB schema.
    if (hasAssays === "true" && jobCards.length) {
      const jobCardIds = jobCards.map((j: any) => j.id);
      const assays = await prisma.assay.findMany({
        where: { jobCardId: { in: jobCardIds } },
        orderBy: { createdAt: "asc" },
      });

      const assaysByJob: Record<string, any[]> = {};
      assays.forEach((a: any) => {
        if (!assaysByJob[a.jobCardId]) assaysByJob[a.jobCardId] = [];
        assaysByJob[a.jobCardId].push(a);
      });

      // attach assays and a simple seals array placeholder (if needed elsewhere)
      jobCards.forEach((jc: any) => {
        jc.assays = assaysByJob[jc.id] || [];
        jc.seals = []; // keep existing shape when client expects seals
      });
    }

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

    // Sanitize incoming payload: remove nested relation objects if present
    // (client may send objects like `exporter` or `shipmentType` accidentally)
    const cleaned: any = { ...requestData };
    delete cleaned.exporter;
    delete cleaned.shipmentType;
    delete cleaned.shipmentTypeIdObj;

    // Build prisma data object from allowed scalar fields
    const data: any = {
      referenceNumber:
        cleaned.referenceNumber ||
        `JC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      receivedDate: cleaned.receivedDate
        ? new Date(cleaned.receivedDate)
        : new Date(),
      exporterId: cleaned.exporterId || null,
      shipmentTypeId: cleaned.shipmentTypeId || null,
      status: cleaned.status || "pending",
      // optional fields - include if provided
      unitOfMeasure: cleaned.unitOfMeasure || undefined,
      idType: cleaned.idType || undefined,
      buyerIdNumber: cleaned.buyerIdNumber || undefined,
      buyerName: cleaned.buyerName || undefined,
      buyerPhone: cleaned.buyerPhone || undefined,
      exporterPricePerOz: cleaned.exporterPricePerOz
        ? Number(cleaned.exporterPricePerOz)
        : undefined,
      teamLeader: cleaned.teamLeader || undefined,
      totalGrossWeight: cleaned.totalGrossWeight
        ? Number(cleaned.totalGrossWeight)
        : undefined,
      destinationCountry: cleaned.destinationCountry || undefined,
      fineness: cleaned.fineness ? Number(cleaned.fineness) : undefined,
      sourceOfGold: cleaned.sourceOfGold || undefined,
      totalNetWeight: cleaned.totalNetWeight
        ? Number(cleaned.totalNetWeight)
        : undefined,
      totalNetWeightOz: cleaned.totalNetWeightOz
        ? Number(cleaned.totalNetWeightOz)
        : undefined,
      numberOfPersons: cleaned.numberOfPersons
        ? Number(cleaned.numberOfPersons)
        : undefined,
      exporterValueUsd: cleaned.exporterValueUsd
        ? Number(cleaned.exporterValueUsd)
        : undefined,
      exporterValueGhs: cleaned.exporterValueGhs
        ? Number(cleaned.exporterValueGhs)
        : undefined,
      graDeclarationNumber: cleaned.graDeclarationNumber || undefined,
      numberOfBoxes: cleaned.numberOfBoxes
        ? Number(cleaned.numberOfBoxes)
        : undefined,
      remittanceType: cleaned.remittanceType || undefined,
      commodityId: cleaned.commodityId || undefined,
      notes: cleaned.notes || undefined,
    };

    // Validate required fields
    if (!data.exporterId || !data.shipmentTypeId || !data.commodityId) {
      console.log("Missing required fields", {
        exporterId: data.exporterId,
        shipmentTypeId: data.shipmentTypeId,
        commodityId: data.commodityId,
      });
      return NextResponse.json(
        {
          error:
            "Missing required fields: exporterId, shipmentTypeId and commodityId are required",
        },
        { status: 400 }
      );
    }

    console.log("Creating job card with data:", JSON.stringify(data, null, 2));

    // Prepare the arguments we will pass to Prisma so we can log them exactly
    const createArgs = {
      data,
      include: {
        exporter: true,
        shipmentType: true,
      },
    } as const;

    // Log the exact create arguments to help debug Prisma validation errors
    try {
      console.log("Prisma create args:", JSON.stringify(createArgs, null, 2));

      // Try the full create first
      const jobCard = await prisma.jobCard.create(createArgs as any);
      console.log("Job card created successfully:", jobCard.id);
      return NextResponse.json(jobCard, { status: 201 });
    } catch (createError) {
      console.error("prisma.jobCard.create failed:", createError);

      // As a fallback, attempt a minimal create with only the required scalar fields
      try {
        const minimalData: any = {
          referenceNumber: data.referenceNumber,
          receivedDate: data.receivedDate,
          exporterId: data.exporterId,
          shipmentTypeId: data.shipmentTypeId,
          status: data.status || "pending",
        };
        console.log(
          "Attempting minimal create with data:",
          JSON.stringify(minimalData, null, 2)
        );
        const fallbackJobCard = await prisma.jobCard.create({
          data: minimalData,
          include: { exporter: true, shipmentType: true },
        });
        console.log(
          "Fallback job card created successfully:",
          fallbackJobCard.id
        );
        return NextResponse.json(fallbackJobCard, { status: 201 });
      } catch (fallbackError) {
        console.error("Fallback create also failed:", fallbackError);
        throw fallbackError; // let outer catch handle the response
      }
    }
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
