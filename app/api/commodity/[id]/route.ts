import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { logger, LogCategory } from "@/lib/logger";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const commodity = await prisma.commodity.findUnique({
      where: { id },
    });

    if (!commodity) {
      return NextResponse.json(
        { error: "Commodity not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(commodity);
  } catch (error) {
    void logger.error(LogCategory.DATABASE, "Error fetching commodity", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to fetch commodity" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, symbol } = await req.json();

    if (!name || !symbol) {
      return NextResponse.json(
        { error: "Name and symbol are required" },
        { status: 400 }
      );
    }

    const commodity = await prisma.commodity.update({
      where: { id },
      data: { name, symbol },
    });

    return NextResponse.json(commodity);
  } catch (error) {
    void logger.error(LogCategory.DATABASE, "Error updating commodity", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to update commodity" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.commodity.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    void logger.error(LogCategory.DATABASE, "Error deleting commodity", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to delete commodity" },
      { status: 500 }
    );
  }
}
