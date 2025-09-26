import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withAuth } from "@/app/lib/with-auth";
import { logger, LogCategory } from "@/lib/logger";

async function getAssaySummaries(request: NextRequest) {
  try {
    // First, test basic database connectivity
    try {
      await prisma.largeScaleJobCard.count();
      void logger.info(LogCategory.ASSAY, "Database connectivity test passed");
    } catch (dbError) {
      void logger.error(
        LogCategory.ASSAY,
        "Database connectivity test failed",
        {
          error: dbError instanceof Error ? dbError.message : String(dbError),
        }
      );
      throw dbError;
    }

    const { searchParams } = new URL(request.url);
    const exporterId = searchParams.get("exporterId");
    const exporterTypeId = searchParams.get("exporterTypeId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Log request parameters for debugging
    void logger.info(LogCategory.ASSAY, "Fetching assay summaries", {
      exporterId,
      exporterTypeId,
      startDate,
      endDate,
      status,
      page,
      limit,
    });

    // Build where clause for filtering
    const where: any = {};

    if (exporterId) {
      where.exporterId = exporterId;
    }

    if (exporterTypeId) {
      // Use a safer approach for exporter type filtering
      where.exporter = {
        ...where.exporter,
        exporterTypeId: exporterTypeId,
      };
    }

    if (startDate || endDate) {
      where.receivedDate = {};
      if (startDate) {
        try {
          where.receivedDate.gte = new Date(startDate);
        } catch (dateError) {
          void logger.warn(LogCategory.ASSAY, "Invalid startDate format", {
            startDate,
          });
        }
      }
      if (endDate) {
        try {
          where.receivedDate.lte = new Date(endDate);
        } catch (dateError) {
          void logger.warn(LogCategory.ASSAY, "Invalid endDate format", {
            endDate,
          });
        }
      }
    }

    if (status) {
      where.status = status;
    }

    void logger.info(LogCategory.ASSAY, "Built where clause", { where });

    // Get total count for pagination
    let total: number;
    try {
      total = await prisma.largeScaleJobCard.count({ where });
      void logger.info(LogCategory.ASSAY, "Total count retrieved", { total });
    } catch (countError) {
      void logger.error(LogCategory.ASSAY, "Error counting job cards", {
        error:
          countError instanceof Error ? countError.message : String(countError),
        where,
      });
      throw countError;
    }

    // Get job cards with assay data
    let jobCardsWithAssays: any[];
    try {
      jobCardsWithAssays = await prisma.largeScaleJobCard.findMany({
        where,
        include: {
          assays: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1, // Get only the most recent assay
            select: {
              id: true,
              method: true,
              pieces: true,
              totalNetGoldWeight: true,
              totalNetSilverWeight: true,
              totalNetGoldWeightOz: true,
              totalNetSilverWeightOz: true,
              totalGoldValue: true,
              totalSilverValue: true,
              totalCombinedValue: true,
              totalValueGhs: true,
              dateOfAnalysis: true,
              signatory: true,
            },
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
    } catch (queryError) {
      void logger.error(
        LogCategory.ASSAY,
        "Error querying job cards with assays",
        {
          error:
            queryError instanceof Error
              ? queryError.message
              : String(queryError),
          where,
          offset,
          limit,
        }
      );
      throw queryError;
    }

    void logger.info(LogCategory.ASSAY, "Raw job cards data retrieved", {
      count: jobCardsWithAssays.length,
      sampleData: jobCardsWithAssays.slice(0, 2).map((jc) => ({
        id: jc.id,
        exporterId: jc.exporterId,
        exporter: jc.exporter
          ? { id: jc.exporter.id, name: jc.exporter.name }
          : null,
        exporterType: jc.exporter?.exporterType
          ? {
              id: jc.exporter.exporterType.id,
              name: jc.exporter.exporterType.name,
            }
          : null,
        assaysCount: jc.assays.length,
        commoditiesCount: jc.commodities.length,
      })),
    });

    // Transform the data to include assay summaries
    let assaySummaries: any[];
    try {
      assaySummaries = jobCardsWithAssays.map((jobCard) => {
        // Log potential data issues for debugging
        if (!jobCard.exporter) {
          void logger.warn(LogCategory.ASSAY, "Job card missing exporter", {
            jobCardId: jobCard.id,
          });
        }
        if (!jobCard.exporter?.exporterType) {
          void logger.warn(
            LogCategory.ASSAY,
            "Job card exporter missing exporterType",
            { jobCardId: jobCard.id, exporterId: jobCard.exporter?.id }
          );
        }

        // Get the most recent assay (if any)
        const assay = jobCard.assays.length > 0 ? jobCard.assays[0] : null;
        let assaySummary = null;

        if (assay) {
          assaySummary = {
            id: assay.id,
            method: assay.method,
            pieces: assay.pieces || 0,
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
            measurementCount: 0, // Removed measurements relation, so we can't count them
          };
        }

        return {
          id: jobCard.id,
          humanReadableId: jobCard.humanReadableId,
          referenceNumber: jobCard.referenceNumber,
          receivedDate: jobCard.receivedDate,
          status: jobCard.status,
          exporter: {
            name: jobCard.exporter?.name || "Unknown Exporter",
            exporterType:
              jobCard.exporter?.exporterType?.name || "Unknown Type",
          },
          commodities:
            jobCard.commodities
              ?.filter((c: any) => c?.commodity?.name)
              ?.map((c: any) => c.commodity.name) || [],
          unitOfMeasure: jobCard.unitOfMeasure,
          assaySummary,
        };
      });
    } catch (transformError) {
      void logger.error(LogCategory.ASSAY, "Error transforming assay data", {
        error:
          transformError instanceof Error
            ? transformError.message
            : String(transformError),
        stack:
          transformError instanceof Error ? transformError.stack : undefined,
        jobCardsCount: jobCardsWithAssays.length,
      });
      throw transformError;
    }

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
      stack: error instanceof Error ? error.stack : undefined,
      requestUrl: request.url,
    });
    return NextResponse.json(
      { error: "Failed to fetch assay summaries" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getAssaySummaries, []);
