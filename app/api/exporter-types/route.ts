import { prisma } from "@/app/lib/prisma";
import { withProtectedRoute } from "@/app/lib/with-protected-route";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET handler for fetching all exporter types
 */
async function getAllExporterTypes(req: NextRequest) {
  try {
    const exporterTypes = await prisma.exporterType.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(exporterTypes);
  } catch (error) {
    console.error("Error fetching exporter types:", error);
    return NextResponse.json(
      { error: "Error fetching exporter types" },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new exporter type
 */
async function createExporterType(req: NextRequest) {
  try {
    const data = await req.json();

    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 }
      );
    }

    // Check if exporter type with same name already exists
    const existingExporterType = await prisma.exporterType.findFirst({
      where: {
        name: data.name,
      },
    });

    if (existingExporterType) {
      return NextResponse.json(
        { error: "Exporter type with this name already exists" },
        { status: 400 }
      );
    }

    // Create the exporter type
    const exporterType = await prisma.exporterType.create({
      data,
    });

    return NextResponse.json(exporterType, { status: 201 });
  } catch (error) {
    console.error("Error creating exporter type:", error);
    return NextResponse.json(
      { error: "Error creating exporter type" },
      { status: 500 }
    );
  }
}

export const GET = getAllExporterTypes;
export const POST = withProtectedRoute(createExporterType, {
  entityType: "ExporterType",
});
