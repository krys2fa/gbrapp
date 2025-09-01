import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { fetchAndSaveExchangeRateIfMissing } from "@/app/lib/external-exchange";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const exchangeId = searchParams.get("exchangeId");

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  try {
    if (exchangeId) {
      const todayExists = await prisma.dailyPrice.findFirst({
        where: {
          type: "EXCHANGE",
          exchangeId,
          createdAt: { gte: startOfToday, lt: startOfTomorrow },
        },
      });
      if (!todayExists) {
        await fetchAndSaveExchangeRateIfMissing(exchangeId).catch((e) => console.error(e));
      }
    } else {
      // ensure at least one exchange exists (create GHS if none)
      let exchanges = await prisma.exchange.findMany();
      if (!exchanges || exchanges.length === 0) {
        try {
          const defaultGhs = await prisma.exchange.create({ data: { name: "Ghana Cedi", symbol: "GHS" } });
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
          if (!exists) await fetchAndSaveExchangeRateIfMissing(ex.id).catch((e) => console.error(e));
        })
      );
    }
  } catch (err) {
    console.error("daily-exchange helper failed", err);
  }

  const prices = await prisma.dailyPrice.findMany({
    where: exchangeId ? { type: "EXCHANGE", exchangeId } : { type: "EXCHANGE" },
    include: { exchange: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(prices);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { exchangeId, price } = body;
  if (!exchangeId || price == null) return NextResponse.json({ error: "exchangeId and price required" }, { status: 400 });
  const created = await prisma.dailyPrice.create({ data: { type: "EXCHANGE", exchangeId, price } });
  return NextResponse.json(created);
}
