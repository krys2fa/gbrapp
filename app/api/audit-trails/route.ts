import { prisma } from "@/app/lib/prisma";
import { withAuditTrail } from "@/app/lib/with-audit-trail";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET handler for fetching audit trails with optional filtering
 * This route should typically be restricted to admin users only
 */
async function getAuditTrails(req: NextRequest) {
  try {
    // Extract query parameters for filtering
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const action = searchParams.get("action");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    // Build where clause based on filters
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (action) {
      where.action = action;
    }

    if (startDate && endDate) {
      where.timestamp = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.timestamp = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      where.timestamp = {
        lte: new Date(endDate),
      };
    }

    // Calculate pagination
    const skip = (page - 1) * pageSize;

    // Get audit trails with pagination
    const [auditTrails, totalCount] = await Promise.all([
      prisma.auditTrail.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          timestamp: "desc",
        },
        skip,
        take: pageSize,
      }),
      prisma.auditTrail.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json({
      data: auditTrails,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching audit trails:", error);
    return NextResponse.json(
      { error: "Error fetching audit trails" },
      { status: 500 }
    );
  }
}

// Wrap handler with audit trail
export const GET = withAuditTrail(getAuditTrails, { entityType: "AuditTrail" });
