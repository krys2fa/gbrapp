import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { logger, LogCategory } from "@/lib/logger";

/**
 * GET handler for fetching all exporters - simplified version without audit trail
 */
export async function GET(req: NextRequest) {
  try {
    void logger.debug(
      LogCategory.EXPORTER,
      "GET /api/exporters - Starting request",
      {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
      }
    );

    const { searchParams } = new URL(req.url);
    const exporterTypeId = searchParams.get("exporterTypeId");
    const search = searchParams.get("search");
    const email = searchParams.get("email");
    const phone = searchParams.get("phone");
    const code = searchParams.get("code");
    const orderBy = searchParams.get("orderBy") || "name";
    const order = searchParams.get("order") || "asc";

    // Build where clause for filtering
    const where: any = {};
    if (exporterTypeId) {
      where.exporterTypeId = exporterTypeId;
    }
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }
    if (email) {
      where.email = { contains: email, mode: "insensitive" };
    }
    if (phone) {
      where.phone = { contains: phone, mode: "insensitive" };
    }
    if (code) {
      where.exporterCode = { contains: code, mode: "insensitive" };
    }

    void logger.debug(LogCategory.EXPORTER, "Querying exporters", {
      filterKeys: Object.keys(where || {}),
    });

    // Build dynamic orderBy based on parameters
    const orderByClause: any = {};
    if (orderBy === "createdAt" || orderBy === "updatedAt") {
      orderByClause[orderBy] = order === "desc" ? "desc" : "asc";
    } else {
      // Default to name ordering for other fields
      orderByClause["name"] = order === "desc" ? "desc" : "asc";
    }

    const exporters = await prisma.exporter.findMany({
      where,
      include: {
        exporterType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: orderByClause,
    });

    void logger.info(LogCategory.EXPORTER, "Exporters query successful", {
      count: exporters.length,
    });
    return NextResponse.json(exporters);
  } catch (error) {
    void logger.error(LogCategory.EXPORTER, "Error fetching exporters", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error: "Error fetching exporters",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new exporter - simplified version without audit trail
 */
export async function POST(req: NextRequest) {
  try {
    void logger.debug(
      LogCategory.EXPORTER,
      "POST /api/exporters - Starting request",
      {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
      }
    );

    const data = await req.json();
    void logger.debug(
      LogCategory.EXPORTER,
      "Request data received for exporter create",
      { keys: Object.keys(data || {}) }
    );

    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 }
      );
    }

    void logger.debug(LogCategory.EXPORTER, "Checking for existing exporter", {
      name: data?.name,
    });
    // Check if exporter with same name already exists
    const existingExporter = await prisma.exporter.findFirst({
      where: {
        name: data.name,
      },
    });

    if (existingExporter) {
      void logger.info(LogCategory.EXPORTER, "Exporter already exists", {
        name: data?.name,
      });
      return NextResponse.json(
        { error: "An exporter with this name already exists" },
        { status: 409 }
      );
    }

    void logger.debug(LogCategory.EXPORTER, "Generating exporter code");
    // Generate the next exporterCode by finding the highest existing one
    const lastExporter = await prisma.exporter.findFirst({
      where: {
        exporterCode: {
          startsWith: "EXP-",
        },
      },
      orderBy: {
        exporterCode: "desc",
      },
    });

    let nextNumber = 1;
    if (lastExporter && lastExporter.exporterCode) {
      const match = lastExporter.exporterCode.match(/EXP-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    const exporterCode = `EXP-${nextNumber.toString().padStart(3, "0")}`;
    void logger.debug(LogCategory.EXPORTER, "Generated exporter code", {
      exporterCode,
    });

    void logger.debug(LogCategory.EXPORTER, "Creating new exporter");
    // Create the exporter with the generated code
    const exporter = await prisma.exporter.create({
      data: {
        ...data,
        exporterCode,
      },
    });

    void logger.info(LogCategory.EXPORTER, "Exporter created", {
      id: exporter.id,
    });
    return NextResponse.json(exporter, { status: 201 });
  } catch (error) {
    void logger.error(LogCategory.EXPORTER, "Error creating exporter", {
      error: error instanceof Error ? error.message : String(error),
    });
    void logger.error(
      LogCategory.EXPORTER,
      "Error creating exporter (details)",
      {
        detail:
          error instanceof Error ? error.stack ?? error.message : String(error),
      }
    );
    return NextResponse.json(
      {
        error: "Error creating exporter",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
