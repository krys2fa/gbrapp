import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import * as jose from "jose";
import { generateAssayNumber } from "@/lib/assay-number-generator";
import { generateJobCardNumber } from "@/lib/job-card-number-generator";

/**
 * GET handler for fetching all large scale job cards with optional filtering
 */
async function getAllLargeScaleJobCards(req: NextRequest) {
  try {
    // Extract query parameters for filtering
    const { searchParams } = new URL(req.url);
    const exporterId = searchParams.get("exporterId");
    const exporterTypeId = searchParams.get("exporterTypeId");
    const reference = searchParams.get("reference");
    const humanReadableId = searchParams.get("humanReadableId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");
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

    if (humanReadableId) {
      where.humanReadableId = {
        contains: humanReadableId,
        mode: "insensitive",
      };
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

    const jobCards = await prisma.largeScaleJobCard.findMany({
      where,
      include: {
        exporter: {
          include: {
            exporterType: true,
          },
        },
        customsOfficer: true,
        assayOfficer: true,
        technicalDirector: true,
        nacobOfficer: true,
        nationalSecurityOfficer: true,
        commodities: {
          include: {
            commodity: true,
          },
        },
        assays: {
          include: {
            measurements: true,
            shipmentType: true,
          },
          orderBy: { dateOfAnalysis: "desc" },
        },
        invoices: {
          select: {
            id: true,
            status: true,
          },
        },
        _count: {
          select: {
            assays: true,
            invoices: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.largeScaleJobCard.count({ where });

    return NextResponse.json({
      jobCards,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching large scale job cards:", error);
    return NextResponse.json(
      { error: "Failed to fetch large scale job cards" },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new large scale job card
 */
async function createLargeScaleJobCard(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      referenceNumber,
      receivedDate,
      exporterId,
      unitOfMeasure,
      notes,
      destinationCountry,
      sourceOfGold,
      numberOfBars,
      customsOfficerId,
      assayOfficerId,
      technicalDirectorId,
      nacobOfficerId,
      nationalSecurityOfficerId,
      // Assay-related fields
      assayMethod,
      authorizedSignatory,
      typeOfShipment,
      dateOfAnalysis,
      sampleBottleDates,
      dataSheetDates,
      numberOfSamples,
      sampleType,
      shipmentNumber,
      assayersData,
      // Valuation fields
      totalCombinedValue,
      totalGoldValue,
      totalNetGoldWeight,
      totalNetGoldWeightOz,
      totalNetSilverWeight,
      totalNetSilverWeightOz,
      totalSilverValue,
      totalValueGhs,
      // Pricing information used in calculations
      exchangeRate,
      commodityPrice,
      pricePerOz,
    } = body;

    // Generate reference number if not provided
    const generatedReferenceNumber =
      referenceNumber || (await generateJobCardNumber("LS"));

    // Validate required fields
    if (!receivedDate || !exporterId) {
      return NextResponse.json(
        { error: "receivedDate and exporterId are required" },
        { status: 400 }
      );
    }

    // Extract and verify JWT token to get user information
    const authHeader = req.headers.get("authorization");
    let token: string | undefined;

    // Check Authorization header first
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      // Fallback to cookie if no Authorization header
      const cookieHeader = req.headers.get("cookie");
      if (cookieHeader) {
        const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split("=");
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
        token = cookies["auth-token"];
      }
    }

    if (!token) {
      return NextResponse.json(
        {
          error: "Unauthorized. Authentication required.",
        },
        { status: 401 }
      );
    }

    const JWT_SECRET =
      process.env.JWT_SECRET || "fallback-secret-for-development-only";
    const secret = new TextEncoder().encode(JWT_SECRET);

    let userId: string;
    try {
      const { payload } = await jose.jwtVerify(token, secret);
      userId = payload.userId as string;
    } catch (error) {
      return NextResponse.json(
        {
          error: "Unauthorized. Invalid token.",
        },
        { status: 401 }
      );
    }

    // Check if reference number already exists
    const existingJobCard = await prisma.largeScaleJobCard.findUnique({
      where: { referenceNumber: generatedReferenceNumber },
    });

    if (existingJobCard) {
      return NextResponse.json(
        { error: "A job card with this reference number already exists" },
        { status: 409 }
      );
    }

    // Generate human-readable ID for large scale job cards
    const currentYear = new Date().getFullYear();

    // Get the next sequential number for this year
    const existingJobCards = await prisma.largeScaleJobCard.findMany({
      where: {
        humanReadableId: {
          startsWith: `LS-${currentYear}-`,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 1,
    });

    let nextSequence = 1;
    if (existingJobCards.length > 0) {
      const lastId = existingJobCards[0].humanReadableId;
      const lastSequence = parseInt(lastId.split("-")[2]);
      nextSequence = lastSequence + 1;
    }

    const humanReadableId = `LS-${currentYear}-${nextSequence
      .toString()
      .padStart(4, "0")}`;

    // Create the job card
    const jobCardData: any = {
      referenceNumber: generatedReferenceNumber,
      humanReadableId,
      receivedDate: new Date(receivedDate),
      exporterId,
      unitOfMeasure,
      notes,
      destinationCountry,
      sourceOfGold: sourceOfGold || "Ghana",
      numberOfBoxes: numberOfBars ? parseInt(numberOfBars) : undefined,
      customsOfficerId,
      assayOfficerId,
      technicalDirectorId,
      nacobOfficerId,
      nationalSecurityOfficerId,
      // Removed consignee and notified party fields - now stored in exporter
    };

    const jobCard = await prisma.largeScaleJobCard.create({
      data: jobCardData,
      include: {
        exporter: {
          include: {
            exporterType: true,
          },
        },
        customsOfficer: true,
        assayOfficer: true,
        technicalDirector: true,
        nacobOfficer: true,
        nationalSecurityOfficer: true,
      },
    });

    // Create assay if assay-related data is provided
    let assay = null;
    if (assayMethod || dateOfAnalysis || assayersData) {
      const assayData: any = {
        jobCardId: jobCard.id,
        method: assayMethod || "X_RAY",
        pieces:
          assayersData && Array.isArray(assayersData)
            ? assayersData.length
            : numberOfSamples
            ? parseInt(numberOfSamples)
            : 1,
        signatory: authorizedSignatory,
        dateOfAnalysis: dateOfAnalysis ? new Date(dateOfAnalysis) : new Date(),
        sampleBottleDates: sampleBottleDates
          ? new Date(sampleBottleDates)
          : null,
        dataSheetDates: dataSheetDates ? new Date(dataSheetDates) : null,
        numberOfSamples: numberOfSamples ? parseInt(numberOfSamples) : 1,
        sampleType: sampleType || "capillary",
        shipmentNumber: shipmentNumber,
        // Valuation fields
        totalCombinedValue: totalCombinedValue || 0,
        totalGoldValue: totalGoldValue || 0,
        totalNetGoldWeight: totalNetGoldWeight || 0,
        totalNetGoldWeightOz: totalNetGoldWeightOz || 0,
        totalNetSilverWeight: totalNetSilverWeight || 0,
        totalNetSilverWeightOz: totalNetSilverWeightOz || 0,
        totalSilverValue: totalSilverValue || 0,
        totalValueGhs: totalValueGhs || 0,
        // Pricing information used in calculations
        exchangeRate: exchangeRate ? Number(exchangeRate.toFixed(4)) : 1,
        commodityPrice: commodityPrice || 0,
        pricePerOz: pricePerOz || 0,
        humanReadableAssayNumber: await generateAssayNumber("LS"),
      };

      // Add shipment type if provided
      if (typeOfShipment) {
        assayData.shipmentTypeId = typeOfShipment;
      }

      assay = await prisma.largeScaleAssay.create({
        data: assayData,
      });

      // Create assay measurements if assayersData is provided
      if (assayersData && Array.isArray(assayersData)) {
        for (let i = 0; i < assayersData.length; i++) {
          const measurement = assayersData[i];
          await prisma.largeScaleAssayMeasurement.create({
            data: {
              assayId: assay.id,
              piece: i + 1,
              barNumber: measurement.barNo,
              grossWeight: measurement.grossWeight
                ? parseFloat(measurement.grossWeight)
                : null,
              goldAssay: measurement.goldFineness
                ? parseFloat(measurement.goldFineness)
                : null,
              netGoldWeight: measurement.goldNetWeight
                ? parseFloat(measurement.goldNetWeight)
                : null,
              silverAssay: measurement.silverFineness
                ? parseFloat(measurement.silverFineness)
                : null,
              netSilverWeight: measurement.silverNetWeight
                ? parseFloat(measurement.silverNetWeight)
                : null,
            },
          });
        }
      }
    }

    // Fetch the complete job card with commodities and assay
    const completeJobCard = await prisma.largeScaleJobCard.findUnique({
      where: { id: jobCard.id },
      include: {
        exporter: {
          include: {
            exporterType: true,
          },
        },
        customsOfficer: true,
        assayOfficer: true,
        technicalDirector: true,
        nacobOfficer: true,
        nationalSecurityOfficer: true,
        commodities: {
          include: {
            commodity: true,
          },
        },
        assays: {
          include: {
            shipmentType: true,
            measurements: true,
          },
        },
      },
    });

    return NextResponse.json(completeJobCard, { status: 201 });
  } catch (error) {
    console.error("Error creating large scale job card:", error);
    return NextResponse.json(
      { error: "Failed to create large scale job card" },
      { status: 500 }
    );
  }
}

// Export the handlers
export const GET = getAllLargeScaleJobCards;
export const POST = createLargeScaleJobCard;
