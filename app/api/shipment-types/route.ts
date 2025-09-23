import { prisma } from "@/app/lib/prisma";
import { withProtectedRoute } from "@/app/lib/with-protected-route";
import { NextRequest, NextResponse } from "next/server";
import { logger, LogCategory } from "@/lib/logger";

/**
 * GET handler for fetching all shipment types
 */
async function getAllShipmentTypes(req: NextRequest) {
  try {
    const shipmentTypes = await prisma.shipmentType.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(shipmentTypes);
  } catch (error) {
    void logger.error(LogCategory.API, "Error fetching shipment types", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Error fetching shipment types" },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new shipment type
 */
async function createShipmentType(req: NextRequest) {
  try {
    const data = await req.json();

    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 }
      );
    }

    // Check if shipment type with same name already exists
    const existingShipmentType = await prisma.shipmentType.findFirst({
      where: {
        name: data.name,
      },
    });

    if (existingShipmentType) {
      return NextResponse.json(
        { error: "Shipment type with this name already exists" },
        { status: 400 }
      );
    }

    // Create the shipment type
    const shipmentType = await prisma.shipmentType.create({
      data,
    });

    return NextResponse.json(shipmentType, { status: 201 });
  } catch (error) {
    void logger.error(LogCategory.API, "Error creating shipment type", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Error creating shipment type" },
      { status: 500 }
    );
  }
}

export const GET = getAllShipmentTypes;
export const POST = withProtectedRoute(createShipmentType, {
  entityType: "ShipmentType",
});
