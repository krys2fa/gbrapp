import { prisma } from "@/app/lib/prisma";

const GRAMS_PER_TROY_OUNCE = 31.1035;

function csvEscape(v: any) {
  if (v == null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

async function handleRevenueAnalyticsDownload(feesReportParam: string) {
  const feesReport = feesReportParam || "daily-summary";
  const feesIsDaily = feesReport.startsWith("daily");
  const feesIsSummary = feesReport.includes("summary");
  const feesPeriodDays = feesIsDaily
    ? 1
    : feesReport.startsWith("weekly")
    ? 7
    : 30;
  const feesSinceDate = new Date(
    Date.now() - feesPeriodDays * 24 * 60 * 60 * 1000
  );

  // Fetch comprehensive financial data
  const [fees, jobCards, largeScaleJobCards] = await Promise.all([
    prisma.fee.findMany({
      where: { createdAt: { gte: feesSinceDate } },
      include: {
        jobCard: { include: { exporter: true } },
        largeScaleJobCard: { include: { exporter: true } },
        currency: true,
      },
      orderBy: { createdAt: "desc" },
      take: 2000,
    }),
    prisma.jobCard.findMany({
      where: { createdAt: { gte: feesSinceDate } },
      include: { exporter: true, assays: true },
    }),
    prisma.largeScaleJobCard.findMany({
      where: { createdAt: { gte: feesSinceDate } },
      include: { exporter: true, assays: true },
    }),
  ]);

  if (feesIsSummary) {
    // Revenue by exporter summary
    const exporterMap = new Map<
      string,
      {
        exporter: string;
        revenue: number;
        jobCardCount: number;
        assayCount: number;
        avgJobCardValue: number;
        lastActivity: Date;
      }
    >();

    // Process fees by exporter
    for (const f of fees) {
      const exporter =
        f.jobCard?.exporter?.name ||
        f.largeScaleJobCard?.exporter?.name ||
        "Unknown";
      const current = exporterMap.get(exporter) || {
        exporter,
        revenue: 0,
        jobCardCount: 0,
        assayCount: 0,
        avgJobCardValue: 0,
        lastActivity: new Date(0),
      };

      current.revenue += Number(f.amountPaid || 0);
      current.lastActivity =
        f.createdAt > current.lastActivity ? f.createdAt : current.lastActivity;
      exporterMap.set(exporter, current);
    }

    // Add job card counts
    [...jobCards, ...largeScaleJobCards].forEach((jc) => {
      const exporter = jc.exporter?.name || "Unknown";
      const current = exporterMap.get(exporter);
      if (current) {
        current.jobCardCount += 1;
        current.assayCount += jc.assays?.length || 0;
        current.avgJobCardValue =
          current.jobCardCount > 0 ? current.revenue / current.jobCardCount : 0;
      }
    });

    const exporterStats = Array.from(exporterMap.values()).sort(
      (a, b) => b.revenue - a.revenue
    );
    const totalRevenue = exporterStats.reduce(
      (sum, stat) => sum + stat.revenue,
      0
    );

    // Build CSV for summary
    const headers = [
      "Exporter",
      "Total_Revenue_USD",
      "Job_Cards",
      "Assays",
      "Avg_Value_Per_Card",
      "Market_Share_Percent",
      "Last_Activity",
    ];
    const lines = [headers.join(",")];

    for (const stat of exporterStats) {
      const marketShare =
        totalRevenue > 0 ? (stat.revenue / totalRevenue) * 100 : 0;
      const cols = [
        csvEscape(stat.exporter),
        csvEscape(stat.revenue.toFixed(2)),
        csvEscape(stat.jobCardCount.toString()),
        csvEscape(stat.assayCount.toString()),
        csvEscape(stat.avgJobCardValue.toFixed(2)),
        csvEscape(marketShare.toFixed(2)),
        csvEscape(stat.lastActivity.toISOString().split("T")[0]),
      ];
      lines.push(cols.join(","));
    }

    const csv = lines.join("\n");
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="revenue-analytics-summary-${Date.now()}.csv"`,
      },
    });
  } else {
    // Comprehensive transaction details
    const transactionDetails = fees.map((f: any) => {
      const exporter =
        f.jobCard?.exporter?.name ||
        f.largeScaleJobCard?.exporter?.name ||
        "Unknown";
      const jobCardType = f.jobCard ? "Regular" : "Large Scale";
      const amount = Number(f.amountPaid || 0);

      return {
        id: f.id,
        date: f.createdAt,
        exporter,
        jobCardType,
        amount,
        receiptNumber: f.receiptNumber || "-",
        status: f.status || "pending",
        paymentDate: f.paymentDate,
        currency: f.currency?.code || "USD",
      };
    });

    // Build CSV for comprehensive
    const headers = [
      "Transaction_Date",
      "Exporter",
      "Job_Card_Type",
      "Amount_USD",
      "Status",
      "Receipt_Number",
      "Payment_Date",
      "Currency",
    ];
    const lines = [headers.join(",")];

    for (const tx of transactionDetails) {
      const cols = [
        csvEscape(tx.date ? new Date(tx.date).toISOString().split("T")[0] : ""),
        csvEscape(tx.exporter),
        csvEscape(tx.jobCardType),
        csvEscape(tx.amount.toFixed(2)),
        csvEscape(tx.status),
        csvEscape(tx.receiptNumber),
        csvEscape(
          tx.paymentDate
            ? new Date(tx.paymentDate).toISOString().split("T")[0]
            : ""
        ),
        csvEscape(tx.currency),
      ];
      lines.push(cols.join(","));
    }

    const csv = lines.join("\n");
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="revenue-analytics-comprehensive-${Date.now()}.csv"`,
      },
    });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const reportParam = (
    url.searchParams.get("report") || "weekly-summary"
  ).toString();
  const feesReportParam = url.searchParams.get("feesReport");

  // Handle revenue analytics download
  if (reportParam === "revenue-analytics" && feesReportParam) {
    return handleRevenueAnalyticsDownload(feesReportParam);
  }

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
  headers.push(
    "Exporter",
    "NetGold_g",
    "Gold_oz",
    "NetSilver_g",
    "MarketValue_USD"
  );
  if (isSummary) headers.push("MarketShare_Percent");

  const lines = [headers.join(",")];
  const totalValue = rows.reduce(
    (sum, row) => sum + (row.estimatedValue || 0),
    0
  );

  for (const r of rows) {
    const cols: string[] = [];
    const goldOz = r.netGoldGrams / GRAMS_PER_TROY_OUNCE;
    const marketShare =
      totalValue > 0 ? (r.estimatedValue / totalValue) * 100 : 0;

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
    cols.push(csvEscape(goldOz.toFixed(4)));
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
    if (isSummary) cols.push(csvEscape(marketShare.toFixed(2)));
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
