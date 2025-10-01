import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

const GRAMS_PER_TROY_OUNCE = 31.1035;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const reportParam = (
    url.searchParams.get("report") || "weekly-summary"
  ).toString();

  const isWeekly = reportParam.startsWith("weekly");
  const isSummary = reportParam.includes("summary");
  const periodDays = isWeekly ? 7 : 30;
  const until = new Date();
  const sinceDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

  // Fetch latest commodity price (best-effort)
  const dailyPrice = await prisma.dailyPrice.findFirst({
    where: { type: "COMMODITY" },
    orderBy: { createdAt: "desc" },
  });
  const commodityPrice = dailyPrice?.price || 0; // assumed per troy ounce

  // Fetch both regular and large scale job cards within the selected period
  let jobCards: any[] = [];

  try {
    // Fetch regular job cards
    const regularJobCards = await prisma.jobCard.findMany({
      where: { createdAt: { gte: sinceDate } },
      orderBy: { createdAt: "desc" },
      take: 1000,
      select: {
        id: true,
        createdAt: true,
        totalNetWeight: true,
        exporter: {
          select: {
            name: true,
          },
        },
        assays: {
          select: {
            jbGrossWeight: true,
            jbNetWeight: true,
            jbFineness: true,
            jbWeightInOz: true,
            jbPricePerOz: true,
            jbTotalUsdValue: true,
            jbTotalGhsValue: true,
            silverContent: true,
            measurements: {
              select: {
                netWeight: true,
              },
            },
          },
        },
      },
    });

    // Fetch large scale job cards
    const largeScaleJobCards = await prisma.largeScaleJobCard.findMany({
      where: { createdAt: { gte: sinceDate } },
      orderBy: { createdAt: "desc" },
      take: 1000,
      select: {
        id: true,
        createdAt: true,
        exporter: {
          select: {
            name: true,
          },
        },
        assays: {
          select: {
            totalNetGoldWeight: true,
            totalNetSilverWeight: true,
            totalNetGoldWeightOz: true,
            pricePerOz: true,
            totalCombinedValue: true,
            totalGoldValue: true,
            totalValueGhs: true,
            measurements: {
              select: {
                netGoldWeight: true,
                netSilverWeight: true,
              },
            },
          },
        },
      },
    });

    // Combine both types of job cards
    jobCards = [...regularJobCards, ...largeScaleJobCards];
  } catch (e) {
    // Defensive: log and continue with empty jobCards so the dashboard doesn't crash
    console.error("Failed to load job cards for analytics dashboard:", e);
    jobCards = [];
  }

  let rows: any[] = [];

  const computed = jobCards.map((jc: any) => {
    // Determine if this is a large scale job card (they don't have totalNetWeight)
    const isLargeScale = !jc.totalNetWeight && jc.assays?.length > 0;
    const assay = jc.assays && jc.assays.length > 0 ? jc.assays[0] : null;

    let netGoldGrams = 0;
    let netSilverGrams = 0;
    let ounces = 0;
    let pricePerOunce = commodityPrice;
    let estimatedValue = 0;

    if (isLargeScale) {
      // Large scale job card calculations
      netGoldGrams = assay?.totalNetGoldWeight || 0; // Already in grams
      netSilverGrams = assay?.totalNetSilverWeight || 0; // Already in grams

      // If no stored weights, calculate from measurements
      if (!netGoldGrams || netGoldGrams === 0) {
        netGoldGrams = (jc.assays || []).reduce((acc: number, a: any) => {
          const s = (a.measurements || []).reduce(
            (mAcc: number, m: any) => mAcc + (Number(m.netGoldWeight) || 0),
            0
          );
          return acc + s;
        }, 0);
      }

      if (!netSilverGrams || netSilverGrams === 0) {
        netSilverGrams = (jc.assays || []).reduce((acc: number, a: any) => {
          const s = (a.measurements || []).reduce(
            (mAcc: number, m: any) => mAcc + (Number(m.netSilverWeight) || 0),
            0
          );
          return acc + s;
        }, 0);
      }

      ounces =
        assay?.totalNetGoldWeightOz || netGoldGrams / GRAMS_PER_TROY_OUNCE;
      pricePerOunce = assay?.pricePerOz || commodityPrice;
      estimatedValue =
        assay?.totalCombinedValue ||
        assay?.totalGoldValue ||
        ounces * pricePerOunce;
    } else {
      // Regular job card calculations
      const storedNet = assay?.jbNetWeight || Number(jc.totalNetWeight) || 0;
      netGoldGrams = storedNet;

      if (!storedNet || storedNet === 0) {
        netGoldGrams = (jc.assays || []).reduce((acc: number, a: any) => {
          const s = (a.measurements || []).reduce(
            (mAcc: number, m: any) => mAcc + (Number(m.netWeight) || 0),
            0
          );
          return acc + s;
        }, 0);
      }

      netSilverGrams = (jc.assays || []).reduce(
        (acc: number, a: any) => acc + (Number(a.silverContent) || 0),
        0
      );

      ounces = assay?.jbWeightInOz || netGoldGrams / GRAMS_PER_TROY_OUNCE;
      pricePerOunce = assay?.jbPricePerOz || commodityPrice;
      estimatedValue = assay?.jbTotalUsdValue || ounces * pricePerOunce;
    }

    return {
      id: jc.id,
      exporter: jc.exporter?.name || "-",
      createdAt: jc.createdAt,
      netGoldGrams,
      netSilverGrams,
      estimatedValue,
      isLargeScale,
    };
  });

  if (isSummary) {
    // aggregate by exporter
    const map = new Map<
      string,
      {
        exporter: string;
        netGoldGrams: number;
        netSilverGrams: number;
        estimatedValue: number;
      }
    >();
    for (const c of computed) {
      const key = c.exporter || "-";
      const prev = map.get(key);
      if (prev) {
        prev.netGoldGrams += c.netGoldGrams;
        prev.netSilverGrams += c.netSilverGrams;
        prev.estimatedValue += c.estimatedValue;
      } else {
        map.set(key, {
          exporter: key,
          netGoldGrams: c.netGoldGrams,
          netSilverGrams: c.netSilverGrams,
          estimatedValue: c.estimatedValue,
        });
      }
    }
    rows = Array.from(map.values()).map((v, i) => ({
      id: `agg-${i}-${v.exporter}`,
      exporter: v.exporter,
      netGoldGrams: v.netGoldGrams,
      netSilverGrams: v.netSilverGrams,
      estimatedValue: v.estimatedValue,
    }));
  } else {
    // comprehensive: list every job card row
    rows = computed;
  }

  return NextResponse.json({
    rows,
    isSummary,
    isWeekly,
    periodDays,
    until: until.toISOString(),
    sinceDate: sinceDate.toISOString(),
    commodityPrice,
  });
}
