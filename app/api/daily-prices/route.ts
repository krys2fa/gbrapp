import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { fetchAndSaveCommodityPriceIfMissing } from "@/app/lib/external-prices";
import { fetchAndSaveExchangeRateIfMissing } from "@/app/lib/external-exchange";

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
  // Use date-only checks (start-of-day to start-of-next-day) to determine whether
  // today's entry exists. This avoids duplicate records for the same calendar day.
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  try {
    if (type === "COMMODITY") {
      if (itemId) {
        const todayExists = await prisma.dailyPrice.findFirst({
          where: {
            type: "COMMODITY",
            commodityId: itemId,
            createdAt: { gte: startOfToday, lt: startOfTomorrow },
          },
        });
        if (!todayExists)
          await fetchAndSaveCommodityPriceIfMissing(itemId).catch((e) =>
            console.error(e)
          );
      } else {
        const commodities = await prisma.commodity.findMany();
        await Promise.all(
          commodities.map(async (c) => {
            const exists = await prisma.dailyPrice.findFirst({
              where: {
                type: "COMMODITY",
                commodityId: c.id,
                createdAt: { gte: startOfToday, lt: startOfTomorrow },
              },
            });
            if (!exists)
              await fetchAndSaveCommodityPriceIfMissing(c.id).catch((e) =>
                console.error(e)
              );
          })
        );
      }
    }

    if (type === "EXCHANGE") {
      if (itemId) {
        const todayExists = await prisma.dailyPrice.findFirst({
          where: {
            type: "EXCHANGE",
            exchangeId: itemId,
            createdAt: { gte: startOfToday, lt: startOfTomorrow },
          },
        });
        if (!todayExists)
          await fetchAndSaveExchangeRateIfMissing(itemId).catch((e) =>
            console.error(e)
          );
      } else {
        let exchanges = await prisma.exchange.findMany();
        if (!exchanges || exchanges.length === 0) {
          try {
            const defaultGhs = await prisma.exchange.create({
              data: { name: "Ghana Cedi", symbol: "GHS" },
            });
            exchanges = [defaultGhs];
          } catch (e) {
            console.warn("Could not create default GHS exchange:", e);
          }
        }
        await Promise.all(
          exchanges.map(async (ex) => {
            const exists = await prisma.dailyPrice.findFirst({
              where: {
                type: "EXCHANGE",
                exchangeId: ex.id,
                createdAt: { gte: startOfToday, lt: startOfTomorrow },
              },
            });
            if (!exists)
              await fetchAndSaveExchangeRateIfMissing(ex.id).catch((e) =>
                console.error(e)
              );
          })
        );
      }
    }
  } catch (err) {
    console.error("daily-prices helper failed", err);
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
