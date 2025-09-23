import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { logger, LogCategory } from "@/lib/logger";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");

    // Find the commodity by symbol
    const commodity = await prisma.commodity.findFirst({
      where: {
        symbol: {
          equals: symbol,
          mode: "insensitive",
        },
      },
    });

    if (!commodity) {
      return NextResponse.json(
        { error: "Commodity not found" },
        { status: 404 }
      );
    }

    // Determine the target date (use provided date or current date)
    const targetDate = dateParam ? new Date(dateParam) : new Date();

    // Find the Monday of the week containing the target date
    const targetDay = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const diff = targetDate.getDate() - targetDay + (targetDay === 0 ? -6 : 1); // Adjust for Sunday
    const weekStartDate = new Date(targetDate);
    weekStartDate.setDate(diff);
    weekStartDate.setHours(0, 0, 0, 0);

    // Find the Sunday of the same week
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    weekEndDate.setHours(23, 59, 59, 999);

    // Get the daily price for the exact target date
    const dailyPrice = await prisma.dailyPrice.findFirst({
      where: {
        type: "COMMODITY",
        commodityId: commodity.id,
        date: {
          gte: new Date(
            targetDate.getFullYear(),
            targetDate.getMonth(),
            targetDate.getDate()
          ),
          lt: new Date(
            targetDate.getFullYear(),
            targetDate.getMonth(),
            targetDate.getDate() + 1
          ),
        },
      },
    });

    if (!dailyPrice) {
      return NextResponse.json(
        {
          error: `No commodity price available for ${commodity.name} on ${
            targetDate.toISOString().split("T")[0]
          }`,
          available: false,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      commodity: commodity.name,
      symbol: commodity.symbol,
      price: dailyPrice.price,
      date: dailyPrice.date,
      type: "daily",
      available: true,
      currency: "USD",
    });
  } catch (error) {
    void logger.error(
      LogCategory.EXCHANGE_RATE,
      "Error fetching commodity price",
      {
        error: error instanceof Error ? error.message : String(error),
      }
    );
    return NextResponse.json(
      { error: "Failed to fetch commodity price" },
      { status: 500 }
    );
  }
}
