import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const feesReportParam = url.searchParams.get("feesReport") || "daily-summary";

  const feesReport = feesReportParam;
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

  try {
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

    // Calculate financial metrics
    const totalRevenue = fees.reduce(
      (sum: number, f: any) => sum + Number(f.amountPaid || 0),
      0
    );
    const totalJobCards = jobCards.length + largeScaleJobCards.length;
    const avgRevenuePerJobCard =
      totalJobCards > 0 ? totalRevenue / totalJobCards : 0;

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
          f.createdAt > current.lastActivity
            ? f.createdAt
            : current.lastActivity;
        exporterMap.set(exporter, current);
      }

      // Add job card counts and assay counts
      [...jobCards, ...largeScaleJobCards].forEach((jc) => {
        const exporter = jc.exporter?.name || "Unknown";
        const current = exporterMap.get(exporter);
        if (current) {
          current.jobCardCount += 1;
          current.assayCount += jc.assays?.length || 0;
          current.avgJobCardValue =
            current.jobCardCount > 0
              ? current.revenue / current.jobCardCount
              : 0;
        }
      });

      const exporterStats = Array.from(exporterMap.values()).sort(
        (a, b) => b.revenue - a.revenue
      );

      return NextResponse.json({
        fees,
        jobCards,
        largeScaleJobCards,
        exporterStats,
        totalRevenue,
        totalJobCards,
        avgRevenuePerJobCard,
      });
    } else {
      // Comprehensive: detailed transaction list with business context
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

      return NextResponse.json({
        fees,
        jobCards,
        largeScaleJobCards,
        exporterStats: [],
        totalRevenue,
        totalJobCards,
        avgRevenuePerJobCard,
        transactionDetails,
      });
    }
  } catch (error) {
    console.error("Error fetching fees data:", error);
    return NextResponse.json(
      { error: "Failed to fetch fees data" },
      { status: 500 }
    );
  }
}
