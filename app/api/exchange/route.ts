import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { logger, LogCategory } from "@/lib/logger";

export async function GET() {
  try {
    const exchanges = await prisma.exchange.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(exchanges);
  } catch (error) {
    void logger.error(LogCategory.EXCHANGE_RATE, "Error fetching exchanges", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to fetch exchanges" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { name, symbol } = await req.json();

    if (!name || !symbol) {
      return NextResponse.json(
        { error: "Name and symbol are required" },
        { status: 400 }
      );
    }

    const exchange = await prisma.exchange.create({
      data: { name, symbol },
    });

    return NextResponse.json(exchange);
  } catch (error) {
    void logger.error(LogCategory.EXCHANGE_RATE, "Error creating exchange", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to create exchange" },
      { status: 500 }
    );
  }
}
