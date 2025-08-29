import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
  const prices = await prisma.dailyPrice.findMany({
    where,
    include: { commodity: true, exchange: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(prices);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { type, itemId, price } = body;
  if (!type || !itemId || price == null) {
    return NextResponse.json(
      { error: "type, itemId, and price required" },
      { status: 400 }
    );
  }
  const data: any = { type, price };
  if (type === "COMMODITY") data.commodityId = itemId;
  if (type === "EXCHANGE") data.exchangeId = itemId;
  const dailyPrice = await prisma.dailyPrice.create({ data });
  return NextResponse.json(dailyPrice);
}
