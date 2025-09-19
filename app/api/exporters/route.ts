import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET handler for fetching all exporters - simplified version without audit trail
 */
export async function GET(req: NextRequest) {
  try {
    console.log("GET /api/exporters - Starting request");
    console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);

    const { searchParams } = new URL(req.url);
    const exporterTypeId = searchParams.get("exporterTypeId");
    const search = searchParams.get("search");
    const email = searchParams.get("email");
    const phone = searchParams.get("phone");
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

    console.log("About to query database with where:", where);

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

    console.log("Query successful, found", exporters.length, "exporters");
    return NextResponse.json(exporters);
  } catch (error) {
    console.error("Error fetching exporters:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : "Unknown error"
    );
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack"
    );
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
    console.log("POST /api/exporters - Starting request");
    console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);

    const data = await req.json();
    console.log("Request data received:", Object.keys(data));

    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 }
      );
    }

    console.log("Checking for existing exporter with name:", data.name);
    // Check if exporter with same name already exists
    const existingExporter = await prisma.exporter.findFirst({
      where: {
        name: data.name,
      },
    });

    if (existingExporter) {
      console.log("Exporter already exists");
      return NextResponse.json(
        { error: "An exporter with this name already exists" },
        { status: 409 }
      );
    }

    console.log("Creating new exporter");
    // Create the exporter
    const exporter = await prisma.exporter.create({
      data,
    });

    console.log("Exporter created successfully with ID:", exporter.id);
    return NextResponse.json(exporter, { status: 201 });
  } catch (error) {
    console.error("Error creating exporter:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : "Unknown error"
    );
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack"
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
