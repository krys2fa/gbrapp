import { prisma } from "@/app/lib/prisma";

const GRAMS_PER_TROY_OUNCE = 31.1034768;

function csvEscape(v: any) {
  if (v == null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const reportParam = (
    url.searchParams.get("report") || "weekly-summary"
  ).toString();
  const isWeekly = reportParam.startsWith("weekly");
  const isSummary = reportParam.includes("summary");
  const periodDays = isWeekly ? 7 : 30;
  const sinceDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

  const dailyPrice = await prisma.dailyPrice.findFirst({
    where: { type: "COMMODITY" },
    orderBy: { createdAt: "desc" },
  });
  const commodityPrice = dailyPrice?.price || 0;

  let jobCards: any[] = [];
  try {
    jobCards = await prisma.jobCard.findMany({
      where: { createdAt: { gte: sinceDate } },
      orderBy: { createdAt: "desc" },
      take: 1000,
      select: {
        id: true,
        createdAt: true,
        totalNetWeight: true,
        exporter: { select: { id: true, name: true } },
        assays: {
          select: {
            id: true,
            silverContent: true,
            measurements: { select: { id: true, netWeight: true } },
          },
        },
      },
    });
  } catch (e) {
    console.error("Failed to load job cards for CSV report:", e);
    jobCards = [];
  }

  const computed = jobCards.map((jc: any) => {
    const storedNet = Number(jc.totalNetWeight) || 0;
    let netGoldGrams = storedNet;
    if (!storedNet || storedNet === 0) {
      netGoldGrams = (jc.assays || []).reduce((acc: number, a: any) => {
        const s = (a.measurements || []).reduce(
          (mAcc: number, m: any) => mAcc + (Number(m.netWeight) || 0),
          0
        );
        return acc + s;
      }, 0);
    }
    const netSilverGrams = (jc.assays || []).reduce(
      (acc: number, a: any) => acc + (Number(a.silverContent) || 0),
      0
    );
    const ounces = netGoldGrams / GRAMS_PER_TROY_OUNCE;
    const estimatedValue = ounces * commodityPrice;
    return {
      id: jc.id,
      exporter: jc.exporter?.name || "-",
      createdAt: jc.createdAt,
      netGoldGrams,
      netSilverGrams,
      estimatedValue,
    };
  });

  let rows: any[] = [];
  if (isSummary) {
    const map = new Map<string, any>();
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
    rows = Array.from(map.values());
  } else {
    rows = computed;
  }

  // Build CSV
  const headers = [] as string[];
  if (!isSummary) headers.push("Date");
  headers.push("Exporter", "NetGold_g", "NetSilver_g", "EstimatedValue_USD");

  const lines = [headers.join(",")];
  for (const r of rows) {
    const cols: string[] = [];
    if (!isSummary)
      cols.push(
        csvEscape(r.createdAt ? new Date(r.createdAt).toISOString() : "")
      );
    cols.push(csvEscape(r.exporter));
    cols.push(
      csvEscape(
        r.netGoldGrams?.toFixed ? r.netGoldGrams.toFixed(2) : r.netGoldGrams
      )
    );
    cols.push(
      csvEscape(
        r.netSilverGrams?.toFixed
          ? r.netSilverGrams.toFixed(2)
          : r.netSilverGrams
      )
    );
    cols.push(
      csvEscape(
        r.estimatedValue?.toFixed
          ? r.estimatedValue.toFixed(2)
          : r.estimatedValue
      )
    );
    lines.push(cols.join(","));
  }

  const csv = lines.join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="report-${reportParam}-${Date.now()}.csv"`,
    },
  });
}
