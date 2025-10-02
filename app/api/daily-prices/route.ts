import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { logger, LogCategory } from "@/lib/logger";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const itemId = searchParams.get("itemId");
  const where: any = {};
  if (type) where.type = type;
  if (itemId) {
    if (type === "COMMODITY") where.commodityId = itemId;
    if (type === "EXCHANGE") where.exchangeId = itemId;
  }

  try {
    // All prices (commodity and exchange) are now only manually entered - no external API fetching
  } catch (err) {
    void logger.error(LogCategory.EXCHANGE_RATE, "daily-prices helper failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  const prices = await prisma.dailyPrice.findMany({
    where,
    include: { commodity: true, exchange: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(prices);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { type, itemId, price, date } = body;
  if (!type || !itemId || price == null) {
    return NextResponse.json(
      { error: "type, itemId, and price required" },
      { status: 400 }
    );
  }
  const data: any = { type, price, date: date ? new Date(date) : new Date() };
  if (type === "COMMODITY") data.commodityId = itemId;
  if (type === "EXCHANGE") data.exchangeId = itemId;
  const dailyPrice = await prisma.dailyPrice.create({ data });
  return NextResponse.json(dailyPrice);
}
