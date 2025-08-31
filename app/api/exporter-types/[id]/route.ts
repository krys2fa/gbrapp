import { prisma } from "@/app/lib/prisma";
import { withAuditTrail } from "@/app/lib/with-audit-trail";
import { NextRequest, NextResponse } from "next/server";

async function getExporterType(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const exporterType = await prisma.exporterType.findUnique({
      where: { id },
    });

    if (!exporterType) {
      return NextResponse.json(
        { error: "Exporter type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(exporterType);
  } catch (error) {
    console.error("Error fetching exporter type:", error);
    return NextResponse.json(
      { error: "Error fetching exporter type" },
      { status: 500 }
    );
  }
}

async function updateExporterType(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const { name, description } = await req.json();

    const existing = await prisma.exporterType.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Exporter type not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.exporterType.update({
      where: { id },
      data: { name, description },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating exporter type:", error);
    return NextResponse.json(
      { error: "Error updating exporter type" },
      { status: 500 }
    );
  }
}

async function deleteExporterType(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    const existing = await prisma.exporterType.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Exporter type not found" },
        { status: 404 }
      );
    }

    await prisma.exporterType.delete({ where: { id } });

    return NextResponse.json({ message: "Exporter type deleted" });
  } catch (error) {
    console.error("Error deleting exporter type:", error);
    return NextResponse.json(
      { error: "Error deleting exporter type" },
      { status: 500 }
    );
  }
}

export const GET = withAuditTrail(getExporterType, {
  entityType: "ExporterType",
});
export const PUT = withAuditTrail(updateExporterType, {
  entityType: "ExporterType",
});
export const DELETE = withAuditTrail(deleteExporterType, {
  entityType: "ExporterType",
});
