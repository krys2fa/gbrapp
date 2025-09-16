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

    // Use an explicit select to avoid referencing columns that may not exist in older DBs
    const selectObj: any = {
      id: true,
      referenceNumber: true,
      receivedDate: true,
      status: true,
      exporterId: true,
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

      _count: {
        select: {
          assays: true,
          invoices: true,
        },
      },
      invoices: {
        select: {
          id: true,
          status: true,
        },
      },
    };

    // Get total count of job cards matching the filter (both regular and large scale)
    let totalCount = 0;
    let jobCards: any[] = [];

    if (hasAssays === "true") {
      // When filtering for assays, we need to query both models
      const [regularCount, largeScaleCount] = await Promise.all([
        prisma.jobCard.count({ where }),
        prisma.largeScaleJobCard.count({
          where: {
            ...where,
            // Remove jobCard-specific fields that don't exist on LargeScaleJobCard
            assays: { some: {} },
            // Keep other filters that apply to both models
            exporterId: where.exporterId,
            status: where.status,
            createdAt: where.createdAt,
          },
        }),
      ]);
      totalCount = regularCount + largeScaleCount;

      // Fetch both types of job cards
      const [regularJobCards, largeScaleJobCards] = await Promise.all([
        prisma.jobCard.findMany({
          where,
          select: selectObj,
          orderBy: { createdAt: "desc" },
          skip: 0,
          take: limit,
        }),
        prisma.largeScaleJobCard.findMany({
          where: {
            ...where,
            assays: { some: {} },
            exporterId: where.exporterId,
            status: where.status,
            createdAt: where.createdAt,
          },
          select: {
            id: true,
            referenceNumber: true,
            receivedDate: true,
            status: true,
            exporterId: true,
            createdAt: true,
            updatedAt: true,
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
            _count: {
              select: {
                assays: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: 0,
          take: limit,
        }),
      ]);

      // Combine and sort all job cards by creation date
      jobCards = [...regularJobCards, ...largeScaleJobCards]
        .sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, limit); // Apply pagination limit
    } else {
      // When not filtering for assays, just query regular job cards
      totalCount = await prisma.jobCard.count({ where });
      jobCards = await prisma.jobCard.findMany({
        where,
        select: selectObj,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      });
    }

    // If assays were requested, fetch assays separately and attach them to the job cards
    if (hasAssays === "true" && jobCards.length) {
      // Separate regular and large scale job cards
      const regularJobCards = jobCards.filter((jc: any) => !jc._count); // Regular job cards don't have _count initially
      const largeScaleJobCards = jobCards.filter((jc: any) => jc._count); // Large scale have _count

      // Fetch assays for regular job cards
      if (regularJobCards.length > 0) {
        const regularJobCardIds = regularJobCards.map((j: any) => j.id);
        const regularAssays = await prisma.assay.findMany({
          where: { jobCardId: { in: regularJobCardIds } },
          orderBy: { createdAt: "asc" },
        });

        const regularAssaysByJob: Record<string, any[]> = {};
        regularAssays.forEach((a: any) => {
          if (!regularAssaysByJob[a.jobCardId])
            regularAssaysByJob[a.jobCardId] = [];
          regularAssaysByJob[a.jobCardId].push(a);
        });

        // Fetch seals for regular job cards
        const regularSeals = await prisma.seal.findMany({
          where: { jobCardId: { in: regularJobCardIds } },
        });
        const regularSealsByJob: Record<string, any[]> = {};
        regularSeals.forEach((s: any) => {
          if (!regularSealsByJob[s.jobCardId])
            regularSealsByJob[s.jobCardId] = [];
          regularSealsByJob[s.jobCardId].push(s);
        });

        // Attach to regular job cards
        regularJobCards.forEach((jc: any) => {
          jc.assays = regularAssaysByJob[jc.id] || [];
          jc.seals = regularSealsByJob[jc.id] || [];
        });
      }

      // Fetch assays for large scale job cards
      if (largeScaleJobCards.length > 0) {
        const largeScaleJobCardIds = largeScaleJobCards.map((j: any) => j.id);
        const largeScaleAssays = await prisma.largeScaleAssay.findMany({
          where: { jobCardId: { in: largeScaleJobCardIds } },
          orderBy: { createdAt: "asc" },
        });

        const largeScaleAssaysByJob: Record<string, any[]> = {};
        largeScaleAssays.forEach((a: any) => {
          if (!largeScaleAssaysByJob[a.jobCardId])
            largeScaleAssaysByJob[a.jobCardId] = [];
          largeScaleAssaysByJob[a.jobCardId].push(a);
        });

        // Attach to large scale job cards
        largeScaleJobCards.forEach((jc: any) => {
          jc.assays = largeScaleAssaysByJob[jc.id] || [];
          jc.seals = []; // Large scale job cards might not have seals in the same way
        });
      }
    }

    console.log(
      `Returning ${jobCards.length} job cards with hasAssays=${hasAssays}`
    );
    if (jobCards.length > 0) {
      console.log(
        `First job card: ${jobCards[0].referenceNumber}, assays: ${
          jobCards[0].assays?.length || 0
        }`
      );
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
      page,
      limit,
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
    // Build a safe, explicit data object from a whitelist of allowed scalar fields.
    // This prevents any nested relation objects (e.g. exporter:{...}) from being
    // forwarded to Prisma where they would trigger validation errors.
    const payload: any =
      typeof requestData === "object" && requestData !== null
        ? requestData
        : {};

    // Defensive: strip nested relation objects that clients might send by mistake
    if (payload && typeof payload.exporter === "object")
      delete payload.exporter;

    // Shallow sanitize: remove any properties whose value is an object (this
    // prevents nested relation objects or arrays from being forwarded to Prisma)
    // But allow Date objects since Prisma expects them for DateTime fields
    for (const [k, v] of Object.entries(payload)) {
      if (v !== null && typeof v === "object" && !(v instanceof Date)) {
        delete (payload as any)[k];
      }
    }

    console.log("Sanitized payload:", JSON.stringify(payload, null, 2));

    const allowedKeys = [
      "referenceNumber",
      "receivedDate",
      "exporterId",
      "status",
      "unitOfMeasure",
      "buyerName", // Keep for exporter update, will be filtered out for job card
      "buyerAddress", // Keep for exporter update, will be filtered out for job card
      "teamLeader",
      "totalGrossWeight",
      "destinationCountry",
      "fineness",
      "sourceOfGold",
      "totalNetWeight",
      "numberOfBoxes",
      "commodityId",
      "notes",
      "valueUsd",
      "valueGhs",
      "numberOfOunces",
      "pricePerOunce",
      "customsOfficerId",
      "assayOfficerId",
      "technicalDirectorId",
      "nacobOfficerId",
      "nationalSecurityOfficerId",
    ];

    const data: any = {};

    // Copy only allowed scalar values and coerce simple types (numbers/dates)
    for (const k of allowedKeys) {
      if (payload[k] === undefined || payload[k] === null) continue;
      // strip out any nested objects accidentally passed
      if (typeof payload[k] === "object") continue;
      data[k] = payload[k];
    }

    // Ensure referenceNumber and receivedDate defaulting logic
    data.referenceNumber =
      data.referenceNumber ||
      `JC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    data.receivedDate = data.receivedDate
      ? new Date(String(data.receivedDate))
      : new Date();

    // Numeric coercions
    if (data.exporterPricePerOz)
      data.exporterPricePerOz = Number(data.exporterPricePerOz);
    if (data.totalGrossWeight)
      data.totalGrossWeight = Number(data.totalGrossWeight);
    if (data.fineness) data.fineness = Number(data.fineness);
    if (data.totalNetWeight) data.totalNetWeight = Number(data.totalNetWeight);
    if (data.numberOfPersons)
      data.numberOfPersons = Number(data.numberOfPersons);
    if (data.numberOfPersons)
      data.numberOfPersons = Number(data.numberOfPersons);
    if (data.numberOfBoxes) data.numberOfBoxes = Number(data.numberOfBoxes);
    if (data.valueUsd) data.valueUsd = Number(data.valueUsd);
    if (data.valueGhs) data.valueGhs = Number(data.valueGhs);
    if (data.numberOfOunces) data.numberOfOunces = Number(data.numberOfOunces);
    if (data.pricePerOunce) data.pricePerOunce = Number(data.pricePerOunce);

    // Normalize exporterId/commodityId to be undefined if empty string
    if (!data.exporterId) delete data.exporterId;
    if (!data.commodityId) delete data.commodityId;

    // Validate required fields (must match Prisma schema non-nullable fields)
    if (!data.exporterId || !data.commodityId) {
      console.log("Missing required fields", {
        exporterId: data.exporterId,
        commodityId: data.commodityId,
      });
      return NextResponse.json(
        {
          error:
            "Missing required fields: exporterId and commodityId are required",
        },
        { status: 400 }
      );
    }

    console.log("Creating job card with data:", JSON.stringify(data, null, 2));

    // Extract buyer information to save to exporter
    const buyerInfo = {
      buyerName: data.buyerName,
      buyerAddress: data.buyerAddress,
    };

    // If buyer information is provided, update the exporter
    if (data.exporterId && (buyerInfo.buyerName || buyerInfo.buyerAddress)) {
      try {
        const updateData: any = {};
        if (buyerInfo.buyerName) updateData.buyerName = buyerInfo.buyerName;
        if (buyerInfo.buyerAddress) updateData.buyerAddress = buyerInfo.buyerAddress;
        
        await prisma.exporter.update({
          where: { id: data.exporterId },
          data: updateData,
        });
        console.log("Updated exporter with buyer information");
      } catch (exporterError) {
        console.error("Failed to update exporter with buyer info:", exporterError);
        // Continue with job card creation even if exporter update fails
      }
    }

    // Prepare the arguments we will pass to Prisma so we can log them exactly
    // Build an explicit whitelist of scalar fields to avoid accidentally
    // passing nested relation objects (e.g. exporter: {...}) to Prisma.
    // Note: buyerName and buyerAddress are NOT included here as they belong to Exporter model
    const allowedFields = [
      "referenceNumber",
      "receivedDate",
      "exporterId",
      "status",
      "unitOfMeasure",
      "teamLeader",
      "totalGrossWeight",
      "destinationCountry",
      "fineness",
      "sourceOfGold",
      "totalNetWeight",
      "numberOfBoxes",
      "commodityId",
      "notes",
      "valueUsd",
      "valueGhs",
      "numberOfOunces",
      "pricePerOunce",
      "customsOfficerId",
      "assayOfficerId",
      "technicalDirectorId",
      "nacobOfficerId",
      "nationalSecurityOfficerId",
    ];

    const createData: any = {};
    for (const k of allowedFields) {
      if ((data as any)[k] !== undefined) {
        createData[k] = (data as any)[k];
      }
    }

    // Map nationalSecurityOfficerId to securityOfficerId for schema compatibility
    if (createData.nationalSecurityOfficerId) {
      createData.securityOfficerId = createData.nationalSecurityOfficerId;
      delete createData.nationalSecurityOfficerId;
    }

    // defensive: ensure no nested objects are present
    if (createData.exporter && typeof createData.exporter === "object")
      delete createData.exporter;

    const createArgs = {
      data: createData,
    } as const;

    // Log the exact create arguments to help debug Prisma validation errors
    try {
      console.log("Prisma create args:", JSON.stringify(createArgs, null, 2));
      // Extra log for the raw create data we will pass to Prisma
      console.log(
        "createData object sent to Prisma:",
        JSON.stringify(createData, null, 2)
      );

      // Fail-fast guard: if any property in createData is still an object,
      // return it to the client so we can inspect exactly what Prisma would
      // receive (helps locate who injected the nested relation).
      // Allow Date objects since Prisma expects them for DateTime fields
      const objectProps = Object.entries(createData).filter(
        ([, v]) => v !== null && typeof v === "object" && !(v instanceof Date)
      );
      if (objectProps.length > 0) {
        console.error(
          "createData contains object-valued properties:",
          objectProps.map(([k]) => k)
        );
        return NextResponse.json(
          {
            error: "createData contains object-valued properties",
            keys: objectProps.map(([k]) => k),
            createData,
          },
          { status: 400 }
        );
      }

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
          status: data.status || "pending",
        };
        console.log(
          "Attempting minimal create with data:",
          JSON.stringify(minimalData, null, 2)
        );
        const fallbackJobCard = await prisma.jobCard.create({
          data: minimalData,
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
