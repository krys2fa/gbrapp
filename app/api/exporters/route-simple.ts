import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET handler for fetching all exporters - simplified version without audit trail
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const exporterTypeId = searchParams.get("exporterTypeId");
    const search = searchParams.get("search");
    const email = searchParams.get("email");
    const phone = searchParams.get("phone");

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
      {
        error: "Error creating exporter",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
