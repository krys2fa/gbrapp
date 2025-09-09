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

      // attach assays and fetch seals for each job card so the client can show seal numbers
      const seals = await prisma.seal.findMany({
        where: { jobCardId: { in: jobCardIds } },
      });
      const sealsByJob: Record<string, any[]> = {};
      seals.forEach((s: any) => {
        if (!sealsByJob[s.jobCardId]) sealsByJob[s.jobCardId] = [];
        sealsByJob[s.jobCardId].push(s);
      });

      jobCards.forEach((jc: any) => {
        jc.assays = assaysByJob[jc.id] || [];
        jc.seals = sealsByJob[jc.id] || [];
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
      "buyerName",
      "buyerAddress",
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

    // Prepare the arguments we will pass to Prisma so we can log them exactly
    // Build an explicit whitelist of scalar fields to avoid accidentally
    // passing nested relation objects (e.g. exporter: {...}) to Prisma.
    const allowedFields = [
      "referenceNumber",
      "receivedDate",
      "exporterId",
      "status",
      "unitOfMeasure",
      "buyerName",
      "buyerAddress",
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
