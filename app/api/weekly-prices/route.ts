import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getWeekBounds } from "@/app/lib/week-utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const itemId = searchParams.get("itemId");
  const week = searchParams.get("week"); // optional week parameter in YYYY-MM-DD format

  const where: any = {};
  if (type) where.type = type;
  if (itemId) {
    if (type === "COMMODITY") where.commodityId = itemId;
    if (type === "EXCHANGE") where.exchangeId = itemId;
  }

  // If week is specified, filter by that week
  if (week) {
    const weekDate = new Date(week);
    const { startOfWeek, endOfWeek } = getWeekBounds(weekDate);
    where.weekStartDate = {
      gte: startOfWeek,
      lte: endOfWeek,
    };
  }

  try {
    const prices = await prisma.weeklyPrice.findMany({
      where,
      include: {
        commodity: true,
        exchange: true,
      },
      orderBy: { weekStartDate: "desc" },
    });
    return NextResponse.json(prices);
  } catch (error) {
    console.error("Error fetching weekly prices:", error);
    return NextResponse.json(
      { error: "Failed to fetch weekly prices" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, itemId, price, weekStartDate } = body;

    if (!type || !itemId || price == null) {
      return NextResponse.json(
        { error: "type, itemId, and price are required" },
        { status: 400 }
      );
    }

    // If weekStartDate is not provided, use current week
    let startDate: Date;
    if (weekStartDate) {
      startDate = new Date(weekStartDate);
    } else {
      const { startOfWeek } = getWeekBounds(new Date());
      startDate = startOfWeek;
    }

    const { endOfWeek } = getWeekBounds(startDate);

    const data: any = {
      type,
      price,
      weekStartDate: startDate,
      weekEndDate: endOfWeek,
    };

    if (type === "COMMODITY") data.commodityId = itemId;
    if (type === "EXCHANGE") data.exchangeId = itemId;

    // Check if a price already exists for this week
    const existingPrice = await prisma.weeklyPrice.findFirst({
      where: {
        type,
        ...(type === "COMMODITY"
          ? { commodityId: itemId }
          : { exchangeId: itemId }),
        weekStartDate: startDate,
      },
    });

    if (existingPrice) {
      return NextResponse.json(
        { error: "A price already exists for this week" },
        { status: 409 }
      );
    }

    const weeklyPrice = await prisma.weeklyPrice.create({
      data,
      include: {
        commodity: true,
        exchange: true,
      },
    });

    return NextResponse.json(weeklyPrice);
  } catch (error) {
    console.error("Error creating weekly price:", error);
    return NextResponse.json(
      { error: "Failed to create weekly price" },
      { status: 500 }
    );
  }
}
