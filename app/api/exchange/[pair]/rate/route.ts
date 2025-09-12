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

    // Get the daily exchange rate for the exact target date
    const dailyRate = await prisma.dailyPrice.findFirst({
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

    if (!dailyRate) {
      return NextResponse.json(
        {
          error: `No exchange rate available for ${fromCurrency.toUpperCase()}-${toCurrency.toUpperCase()} on ${
            targetDate.toISOString().split("T")[0]
          }`,
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
