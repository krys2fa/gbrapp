import { prisma } from "@/app/lib/prisma";
import { withAuditTrail } from "@/app/lib/with-audit-trail";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET handler for fetching a single exporter
 */
async function getExporter(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const exporter = await prisma.exporter.findUnique({
      where: { id },
      include: {
        exporterType: {
          select: {
            id: true,
            name: true,
          },
        },
        jobCards: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10, // Only include the 10 most recent job cards
        },
      },
    });

    if (!exporter) {
      return NextResponse.json(
        { error: "Exporter not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(exporter);
  } catch (error) {
    console.error("Error fetching exporter:", error);
    return NextResponse.json(
      { error: "Error fetching exporter" },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating an exporter
 */
async function updateExporter(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const data = await req.json();

    // Check if exporter exists
    const existingExporter = await prisma.exporter.findUnique({
      where: { id },
    });

    if (!existingExporter) {
      return NextResponse.json(
        { error: "Exporter not found" },
        { status: 404 }
      );
    }

    // If name is being updated, check if it conflicts with another exporter
    if (data.name && data.name !== existingExporter.name) {
      const nameConflict = await prisma.exporter.findFirst({
        where: {
          name: data.name,
          id: { not: id },
        },
      });

      if (nameConflict) {
        return NextResponse.json(
          { error: "An exporter with this name already exists" },
          { status: 409 }
        );
      }
    }

    // Update the exporter
    const updatedExporter = await prisma.exporter.update({
      where: { id },
      data,
    });

    return NextResponse.json(updatedExporter);
  } catch (error) {
    console.error("Error updating exporter:", error);
    return NextResponse.json(
      { error: "Error updating exporter" },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for deleting an exporter
 */
async function deleteExporter(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    // Check if exporter exists
    const existingExporter = await prisma.exporter.findUnique({
      where: { id },
      include: {
        jobCards: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!existingExporter) {
      return NextResponse.json(
        { error: "Exporter not found" },
        { status: 404 }
      );
    }

    // Check if exporter has job cards
    if (existingExporter.jobCards.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete exporter with associated job cards" },
        { status: 400 }
      );
    }

    // Delete the exporter
    await prisma.exporter.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Exporter deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting exporter:", error);
    return NextResponse.json(
      { error: "Error deleting exporter" },
      { status: 500 }
    );
  }
}

// Wrap all handlers with audit trail
export const GET = withAuditTrail(getExporter, { entityType: "Exporter" });
export const PUT = withAuditTrail(updateExporter, { entityType: "Exporter" });
export const DELETE = withAuditTrail(deleteExporter, {
  entityType: "Exporter",
});
