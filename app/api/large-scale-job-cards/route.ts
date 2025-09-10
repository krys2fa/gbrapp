import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import * as jose from "jose";

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
      numberOfBoxes,
      customsOfficerId,
      assayOfficerId,
      technicalDirectorId,
      nacobOfficerId,
      nationalSecurityOfficerId,
      // Removed consignee and notified party fields - now stored in exporter
      commodities,
    } = body;

    // Validate required fields
    if (!referenceNumber || !receivedDate || !exporterId) {
      return NextResponse.json(
        { error: "referenceNumber, receivedDate, and exporterId are required" },
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
      where: { referenceNumber },
    });

    if (existingJobCard) {
      return NextResponse.json(
        { error: "A job card with this reference number already exists" },
        { status: 409 }
      );
    }

    // Create the job card
    const jobCardData: any = {
      referenceNumber,
      receivedDate: new Date(receivedDate),
      exporterId,
      unitOfMeasure,
      notes,
      destinationCountry,
      sourceOfGold: sourceOfGold || "Ghana",
      numberOfBoxes,
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

    // Create commodity associations if provided
    if (commodities && Array.isArray(commodities)) {
      for (const commodityData of commodities) {
        if (commodityData.commodityId) {
          await prisma.largeScaleJobCardCommodity.create({
            data: {
              jobCardId: jobCard.id,
              commodityId: commodityData.commodityId,
              grossWeight: commodityData.grossWeight,
              netWeight: commodityData.netWeight,
              fineness: commodityData.fineness,
              valueGhs: commodityData.valueGhs,
              valueUsd: commodityData.valueUsd,
              pricePerOunce: commodityData.pricePerOunce,
              numberOfOunces: commodityData.numberOfOunces,
            },
          });
        }
      }
    }

    // Fetch the complete job card with commodities
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
