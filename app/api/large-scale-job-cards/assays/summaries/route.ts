import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withAuth } from "@/app/lib/with-auth";
import { logger, LogCategory } from "@/lib/logger";

async function getAssaySummaries(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const exporterId = searchParams.get("exporterId");
    const exporterTypeId = searchParams.get("exporterTypeId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};

    if (exporterId) {
      where.exporterId = exporterId;
    }

    if (exporterTypeId) {
      where.exporter = {
        exporterTypeId: exporterTypeId,
      };
    }

    if (startDate || endDate) {
      where.receivedDate = {};
      if (startDate) {
        where.receivedDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.receivedDate.lte = new Date(endDate);
      }
    }

    if (status) {
      where.status = status;
    }

    // Get total count for pagination
    const total = await prisma.largeScaleJobCard.count({ where });

    // Get job cards with assay data
    const jobCardsWithAssays = await prisma.largeScaleJobCard.findMany({
      where,
      include: {
        assays: {
          include: {
            measurements: true,
            shipmentType: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1, // Get only the most recent assay
        },
        exporter: {
          include: {
            exporterType: true,
          },
        },
        commodities: {
          include: {
            commodity: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: offset,
      take: limit,
    });

    // Transform the data to include assay summaries
    const assaySummaries = jobCardsWithAssays.map((jobCard) => {
      // Get the most recent assay (if any)
      const assay = jobCard.assays.length > 0 ? jobCard.assays[0] : null;
      let assaySummary = null;

      if (assay) {
        assaySummary = {
          id: assay.id,
          method: assay.method,
          pieces: assay.pieces,
          totalNetGoldWeight: assay.totalNetGoldWeight,
          totalNetSilverWeight: assay.totalNetSilverWeight,
          totalNetGoldWeightOz: assay.totalNetGoldWeightOz,
          totalNetSilverWeightOz: assay.totalNetSilverWeightOz,
          totalGoldValue: assay.totalGoldValue,
          totalSilverValue: assay.totalSilverValue,
          totalCombinedValue: assay.totalCombinedValue,
          totalValueGhs: assay.totalValueGhs,
          dateOfAnalysis: assay.dateOfAnalysis,
          signatory: assay.signatory,
          measurementCount: assay.measurements.length,
        };
      }

      return {
        id: jobCard.id,
        humanReadableId: jobCard.humanReadableId,
        referenceNumber: jobCard.referenceNumber,
        receivedDate: jobCard.receivedDate,
        status: jobCard.status,
        exporter: {
          name: jobCard.exporter.name,
          exporterType: jobCard.exporter.exporterType.name,
        },
        commodities: jobCard.commodities.map((c) => c.commodity.name),
        unitOfMeasure: jobCard.unitOfMeasure,
        assaySummary,
      };
    });

    return NextResponse.json({
      assaySummaries,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    void logger.error(LogCategory.ASSAY, "Error fetching assay summaries", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to fetch assay summaries" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getAssaySummaries, []);
