import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const dailyPrice = await prisma.dailyPrice.findUnique({
      where: { id },
      include: { commodity: true, exchange: true },
    });

    if (!dailyPrice) {
      return NextResponse.json(
        { error: "Daily price not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(dailyPrice);
  } catch (error) {
    console.error("[DAILY_PRICE_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const { price, type, itemId, date } = body;

    if (price == null) {
      return NextResponse.json(
        { error: "Price is required" },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {
      price: parseFloat(price),
    };

    // Update date if provided
    if (date) {
      updateData.date = new Date(date);
    }

    // Update type and item association if provided
    if (type && itemId) {
      updateData.type = type;
      if (type === "COMMODITY") {
        updateData.commodityId = itemId;
        updateData.exchangeId = null;
      } else if (type === "EXCHANGE") {
        updateData.exchangeId = itemId;
        updateData.commodityId = null;
      }
    }

    const dailyPrice = await prisma.dailyPrice.update({
      where: { id },
      data: updateData,
      include: { commodity: true, exchange: true },
    });

    return NextResponse.json(dailyPrice);
  } catch (error: any) {
    console.error("[DAILY_PRICE_PUT]", error);
    
    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "Daily price not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.dailyPrice.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DAILY_PRICE_DELETE]", error);
    
    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "Daily price not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}