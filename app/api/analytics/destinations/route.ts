import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { logger, LogCategory } from "@/lib/logger";

function parseDate(q: string | null | undefined) {
  if (!q) return undefined;
  const d = new Date(q);
  return isNaN(d.getTime()) ? undefined : d;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const from = parseDate(url.searchParams.get("from"));
    const to = parseDate(url.searchParams.get("to"));
    const top = parseInt(url.searchParams.get("top") || "20", 10) || 20;

    const whereBase: any = {};
    if (from || to) whereBase.createdAt = {};
    if (from) whereBase.createdAt.gte = from;
    if (to) whereBase.createdAt.lte = to;

    // Aggregate small-scale JobCard by destinationCountry
    const small = await prisma.jobCard.groupBy({
      by: ["destinationCountry"],
      where: {
        ...whereBase,
      },
      _count: { _all: true },
    });

    // Aggregate large-scale job cards (LargeScaleJobCard model)
    const large = await prisma.largeScaleJobCard.groupBy({
      by: ["destinationCountry"],
      where: {
        ...whereBase,
      },
      _count: { _all: true },
    });

    const map = new Map<
      string,
      {
        countryCode: string;
        countryName?: string;
        largeCount: number;
        smallCount: number;
      }
    >();

    for (const s of small) {
      const code = s.destinationCountry || "Unknown";
      map.set(code, {
        countryCode: code,
        countryName: code,
        largeCount: 0,
        smallCount: s._count._all,
      });
    }
    for (const l of large) {
      const code = l.destinationCountry || "Unknown";
      const existing = map.get(code);
      if (existing) existing.largeCount = l._count._all;
      else
        map.set(code, {
          countryCode: code,
          countryName: code,
          largeCount: l._count._all,
          smallCount: 0,
        });
    }

    const arr = Array.from(map.values()).map((r) => ({
      ...r,
      total: r.largeCount + r.smallCount,
    }));

    arr.sort((a, b) => b.total - a.total);

    const topArr = arr.slice(0, top);
    const other = arr.slice(top).reduce(
      (acc, cur) => {
        acc.largeCount += cur.largeCount;
        acc.smallCount += cur.smallCount;
        acc.total += cur.total;
        return acc;
      },
      {
        countryCode: "Other",
        countryName: "Other",
        largeCount: 0,
        smallCount: 0,
        total: 0,
      }
    );

    if (arr.length > top) topArr.push(other);

    return NextResponse.json({ success: true, countries: topArr });
  } catch (err) {
    void logger.error(LogCategory.API, "analytics destinations error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
