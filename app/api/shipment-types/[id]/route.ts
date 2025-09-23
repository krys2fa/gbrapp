import { prisma } from "@/app/lib/prisma";
import { withProtectedRoute } from "@/app/lib/with-protected-route";
import { NextRequest, NextResponse } from "next/server";
import { logger, LogCategory } from "@/lib/logger";

/**
 * GET handler for fetching a single shipment type by ID
 */
async function getShipmentType(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const shipmentType = await prisma.shipmentType.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    if (!shipmentType) {
      return NextResponse.json(
        { error: "Shipment type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(shipmentType);
  } catch (error) {
    void logger.error(LogCategory.API, "Error fetching shipment type", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Error fetching shipment type" },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating a shipment type
 */
async function updateShipmentType(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await req.json();

    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 }
      );
    }

    // Check if shipment type exists
    const existingShipmentType = await prisma.shipmentType.findUnique({
      where: { id },
    });

    if (!existingShipmentType) {
      return NextResponse.json(
        { error: "Shipment type not found" },
        { status: 404 }
      );
    }

    // Check if another shipment type with the same name exists (excluding current one)
    if (data.name !== existingShipmentType.name) {
      const duplicateShipmentType = await prisma.shipmentType.findFirst({
        where: {
          name: data.name,
          id: { not: id },
        },
      });

      if (duplicateShipmentType) {
        return NextResponse.json(
          { error: "Shipment type with this name already exists" },
          { status: 400 }
        );
      }
    }

    // Update the shipment type
    const updatedShipmentType = await prisma.shipmentType.update({
      where: { id },
      data,
    });

    return NextResponse.json(updatedShipmentType);
  } catch (error) {
    void logger.error(LogCategory.API, "Error updating shipment type", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Error updating shipment type" },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for deleting a shipment type
 */
async function deleteShipmentType(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if shipment type exists
    const existingShipmentType = await prisma.shipmentType.findUnique({
      where: { id },
    });

    if (!existingShipmentType) {
      return NextResponse.json(
        { error: "Shipment type not found" },
        { status: 404 }
      );
    }

    // Check if shipment type is being used by any assays
    const assayCount = await prisma.assay.count({
      where: { shipmentTypeId: id },
    });

    const largeScaleAssayCount = await prisma.largeScaleAssay.count({
      where: { shipmentTypeId: id },
    });

    if (assayCount > 0 || largeScaleAssayCount > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete shipment type as it is being used by existing records",
          details: {
            assays: assayCount,
            largeScaleAssays: largeScaleAssayCount,
          },
        },
        { status: 400 }
      );
    }

    // Delete the shipment type
    await prisma.shipmentType.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Shipment type deleted successfully",
    });
  } catch (error) {
    void logger.error(LogCategory.API, "Error deleting shipment type", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Error deleting shipment type" },
      { status: 500 }
    );
  }
}

export const GET = getShipmentType;
export const PUT = withProtectedRoute(updateShipmentType, {
  entityType: "ShipmentType",
});
export const DELETE = withProtectedRoute(deleteShipmentType, {
  entityType: "ShipmentType",
});
