import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getWeekBounds } from "@/app/lib/week-utils";
import { logger, LogCategory } from "@/lib/logger";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const weeklyPrice = await prisma.weeklyPrice.findUnique({
      where: { id },
      include: {
        commodity: true,
        exchange: true,
      },
    });

    if (!weeklyPrice) {
      return NextResponse.json(
        { error: "Weekly price not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(weeklyPrice);
  } catch (error) {
    void logger.error(
      LogCategory.EXCHANGE_RATE,
      "Error fetching weekly price",
      {
        error: error instanceof Error ? error.message : String(error),
      }
    );
    return NextResponse.json(
      { error: "Failed to fetch weekly price" },
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
    const body = await req.json();
    const { price, weekStartDate } = body;

    if (price == null) {
      return NextResponse.json({ error: "price is required" }, { status: 400 });
    }

    // Get the existing record to check if it exists
    const existing = await prisma.weeklyPrice.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Weekly price not found" },
        { status: 404 }
      );
    }

    const updateData: any = { price };

    // If weekStartDate is provided, update it and calculate new end date
    if (weekStartDate) {
      const startDate = new Date(weekStartDate);
      const { endOfWeek } = getWeekBounds(startDate);
      updateData.weekStartDate = startDate;
      updateData.weekEndDate = endOfWeek;
    }

    const updatedPrice = await prisma.weeklyPrice.update({
      where: { id },
      data: updateData,
      include: {
        commodity: true,
        exchange: true,
      },
    });

    return NextResponse.json(updatedPrice);
  } catch (error) {
    void logger.error(
      LogCategory.EXCHANGE_RATE,
      "Error updating weekly price",
      {
        error: error instanceof Error ? error.message : String(error),
      }
    );
    return NextResponse.json(
      { error: "Failed to update weekly price" },
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

    // Check if the record exists
    const existing = await prisma.weeklyPrice.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Weekly price not found" },
        { status: 404 }
      );
    }

    await prisma.weeklyPrice.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    void logger.error(
      LogCategory.EXCHANGE_RATE,
      "Error deleting weekly price",
      {
        error: error instanceof Error ? error.message : String(error),
      }
    );
    return NextResponse.json(
      { error: "Failed to delete weekly price" },
      { status: 500 }
    );
  }
}
