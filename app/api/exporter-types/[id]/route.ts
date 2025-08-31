import { prisma } from "@/app/lib/prisma";
import { withProtectedRoute } from "@/app/lib/with-protected-route";
import { NextRequest, NextResponse } from "next/server";

function getIdFromReq(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1];
  } catch (e) {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const id = getIdFromReq(req);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    const exporterType = await prisma.exporterType.findUnique({
      where: { id },
    });
    if (!exporterType)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(exporterType);
  } catch (error) {
    console.error("Error fetching exporter type:", error);
    return NextResponse.json(
      { error: "Error fetching exporter type" },
      { status: 500 }
    );
  }
}

async function updateExporterType(req: NextRequest) {
  const id = getIdFromReq(req);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    const data = await req.json();
    if (!data.name) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 }
      );
    }

    const updated = await prisma.exporterType.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description || null,
      },
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

async function deleteExporterType(req: NextRequest) {
  const id = getIdFromReq(req);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    // Optionally: prevent deletion if exporters exist (foreign key constraints may handle this)
    await prisma.exporterType.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting exporter type:", error);
    return NextResponse.json(
      { error: "Error deleting exporter type" },
      { status: 500 }
    );
  }
}

export const PUT = withProtectedRoute(updateExporterType, {
  entityType: "ExporterType",
});
export const DELETE = withProtectedRoute(deleteExporterType, {
  entityType: "ExporterType",
});
