import { prisma } from "@/app/lib/prisma";
import { withAuditTrail } from "@/app/lib/with-audit-trail";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET handler for fetching all exporters
 */
async function getAllExporters(req: NextRequest) {
  try {
    // Check if exporter type filter is provided
    const { searchParams } = new URL(req.url);
    const exporterTypeId = searchParams.get("exporterTypeId");

    // Build where clause for filtering
    const where: any = {};
    if (exporterTypeId) {
      where.exporterTypeId = exporterTypeId;
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
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(exporters);
  } catch (error) {
    console.error("Error fetching exporters:", error);
    return NextResponse.json(
      { error: "Error fetching exporters" },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new exporter
 */
async function createExporter(req: NextRequest) {
  try {
    const data = await req.json();

    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 }
      );
    }

    // Check if exporter with same name already exists
    const existingExporter = await prisma.exporter.findFirst({
      where: {
        name: data.name,
      },
    });

    if (existingExporter) {
      return NextResponse.json(
        { error: "An exporter with this name already exists" },
        { status: 409 }
      );
    }

    // Create the exporter
    const exporter = await prisma.exporter.create({
      data,
    });

    return NextResponse.json(exporter, { status: 201 });
  } catch (error) {
    console.error("Error creating exporter:", error);
    return NextResponse.json(
      { error: "Error creating exporter" },
      { status: 500 }
    );
  }
}

// Wrap all handlers with audit trail
export const GET = withAuditTrail(getAllExporters, { entityType: "Exporter" });
export const POST = withAuditTrail(createExporter, { entityType: "Exporter" });
