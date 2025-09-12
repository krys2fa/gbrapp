import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { pair: string } }
) {
  try {
    const { pair } = params;
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");

    // Parse the currency pair (e.g., "usd-ghs")
    const [fromCurrency, toCurrency] = pair.split("-");

    if (!fromCurrency || !toCurrency) {
      return NextResponse.json(
        {
          error:
            "Invalid currency pair format. Use format: from-to (e.g., usd-ghs)",
        },
        { status: 400 }
      );
    }

    // Find the exchange by symbol
    const exchange = await prisma.exchange.findFirst({
      where: {
        symbol: {
          equals: fromCurrency.toUpperCase(),
          mode: "insensitive",
        },
      },
    });

    if (!exchange) {
      return NextResponse.json(
        { error: "Exchange not found" },
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

    // Get the daily exchange rate for the exact target date first
    let dailyRate = await prisma.dailyPrice.findFirst({
      where: {
        type: "EXCHANGE",
        exchangeId: exchange.id,
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

    // If no rate for the exact date, look within the same week
    if (!dailyRate) {
      dailyRate = await prisma.dailyPrice.findFirst({
        where: {
          type: "EXCHANGE",
          exchangeId: exchange.id,
          date: {
            gte: weekStartDate,
            lte: weekEndDate,
          },
        },
        orderBy: {
          date: "desc", // Get the most recent rate within the week
        },
      });
    }

    if (!dailyRate) {
      return NextResponse.json(
        {
          error: `No exchange rate available for ${fromCurrency.toUpperCase()}-${toCurrency.toUpperCase()} in the week of ${
            targetDate.toISOString().split("T")[0]
          } (week: ${weekStartDate.toISOString().split("T")[0]} to ${
            weekEndDate.toISOString().split("T")[0]
          })`,
          available: false,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      from: fromCurrency.toUpperCase(),
      to: toCurrency.toUpperCase(),
      rate: Number(dailyRate.price.toFixed(4)), // Format to 4 decimal places
      date: dailyRate.date,
      type: "daily",
      available: true,
    });
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    return NextResponse.json(
      { error: "Failed to fetch exchange rate" },
      { status: 500 }
    );
  }
}
