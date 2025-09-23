import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Fetch actual counts from database
    const totalJobCardsCount = await prisma.jobCard.count();
    const activeJobCardsCount = await prisma.jobCard.count({
      where: { status: "ACTIVE" },
    });
    const completedJobCardsCount = await prisma.jobCard.count({
      where: { status: "COMPLETED" },
    });
    const pendingJobCardsCount = await prisma.jobCard.count({
      where: { status: "PENDING" },
    });

    // Calculate this week's job cards
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const thisWeekJobCardsCount = await prisma.jobCard.count({
      where: {
        createdAt: {
          gte: startOfWeek,
        },
      },
    });

    // Fetch actual users and exporters count
    const totalUsersCount = await prisma.user.count();
    const totalExportersCount = await prisma.exporter.count();

    // Calculate total revenue from fees (payments received) instead of invoice amounts
    const totalRevenueResult = await prisma.fee.aggregate({
      _sum: {
        amountPaid: true,
      },
    });
    const totalRevenueAmount = totalRevenueResult._sum.amountPaid || 0;

    // Fetch current exchange rate (GHS per USD)
    const latestExchangeRate = await prisma.dailyPrice.findFirst({
      where: { type: "EXCHANGE" },
      orderBy: { createdAt: "desc" },
    });

    // Fetch all commodities configured in the system and attach their latest prices
    // into a commodityPrices map keyed by the commodity symbol.
    const commodities = await prisma.commodity.findMany();

    const commodityPrices: Record<
      string,
      { price?: number; date?: Date; name?: string }
    > = {};

    for (const c of commodities) {
      try {
        const latest = await prisma.dailyPrice.findFirst({
          where: {
            type: "COMMODITY",
            commodityId: c.id,
          },
          orderBy: { createdAt: "desc" },
        });

        const p = latest?.price;
        if (typeof p === "number") {
          commodityPrices[c.symbol] = {
            price: p,
            date: latest!.date,
            name: c.name,
          };
        } else {
          commodityPrices[c.symbol] = { name: c.name };
        }
      } catch (err) {
        // non-fatal for dashboard; continue with other commodities
        console.warn(`Failed to fetch price for commodity ${c.symbol}`, err);
        commodityPrices[c.symbol] = { name: c.name };
      }
    }

    // Backwards-compatible convenience fields for Gold and Silver.
    // Derive from commodities by name (case-insensitive) so the system uses
    // whatever symbols are configured in the DB but still exposes Gold/Silver
    // values to existing UI.
    const findCommodityByName = (name: string) =>
      commodities.find((c) => (c.name || "").toLowerCase() === name.toLowerCase());

    const goldCommodity = findCommodityByName("Gold");
    const silverCommodity = findCommodityByName("Silver");

    const goldPriceDisplayed =
      goldCommodity && typeof commodityPrices[goldCommodity.symbol]?.price === "number"
        ? commodityPrices[goldCommodity.symbol]!.price
        : undefined;

    const silverPriceDisplayed =
      silverCommodity && typeof commodityPrices[silverCommodity.symbol]?.price === "number"
        ? commodityPrices[silverCommodity.symbol]!.price
        : undefined;

  

    // Get monthly invoice amounts by exporter for the current year (showing PAID invoices by payment date)
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    console.log("Debug - Query date range:", {
      currentYear,
      startOfYear: startOfYear.toISOString(),
      endOfYear: endOfYear.toISOString(),
    });

    // Updated query to show payments by payment date, not invoice issue date
    const exporterInvoiceData = (await prisma.$queryRaw`
      SELECT 
        e.name as "exporterName",
        EXTRACT(MONTH FROM f."paymentDate") as month,
        SUM(f."amountPaid") as "paidAmount",
        0 as "pendingAmount",
        SUM(f."amountPaid") as "totalAmount"
      FROM "Fee" f
      JOIN "JobCard" jc ON f."jobCardId" = jc.id
      JOIN "Exporter" e ON jc."exporterId" = e.id
      WHERE f."paymentDate" >= ${startOfYear} 
        AND f."paymentDate" <= ${endOfYear}
        AND f.status = 'paid'
      GROUP BY e.name, EXTRACT(MONTH FROM f."paymentDate")
      
      UNION ALL
      
      SELECT 
        e.name as "exporterName",
        EXTRACT(MONTH FROM f."paymentDate") as month,
        SUM(f."amountPaid") as "paidAmount",
        0 as "pendingAmount",
        SUM(f."amountPaid") as "totalAmount"
      FROM "Fee" f
      JOIN "LargeScaleJobCard" ljc ON f."largeScaleJobCardId" = ljc.id
      JOIN "Exporter" e ON ljc."exporterId" = e.id
      WHERE f."paymentDate" >= ${startOfYear} 
        AND f."paymentDate" <= ${endOfYear}
        AND f.status = 'paid'
      GROUP BY e.name, EXTRACT(MONTH FROM f."paymentDate")
      
      UNION ALL
      
      SELECT 
        e.name as "exporterName",
        EXTRACT(MONTH FROM i."issueDate") as month,
        0 as "paidAmount",
        SUM(i.amount) as "pendingAmount", 
        SUM(i.amount) as "totalAmount"
      FROM "Invoice" i
      JOIN "JobCard" jc ON i."jobCardId" = jc.id
      JOIN "Exporter" e ON jc."exporterId" = e.id
      WHERE i."issueDate" >= ${startOfYear} 
        AND i."issueDate" <= ${endOfYear}
        AND i.status = 'pending'
      GROUP BY e.name, EXTRACT(MONTH FROM i."issueDate")
      
      UNION ALL
      
      SELECT 
        e.name as "exporterName",
        EXTRACT(MONTH FROM i."issueDate") as month,
        0 as "paidAmount",
        SUM(i.amount) as "pendingAmount", 
        SUM(i.amount) as "totalAmount"
      FROM "Invoice" i
      JOIN "LargeScaleJobCard" ljc ON i."largeScaleJobCardId" = ljc.id
      JOIN "Exporter" e ON ljc."exporterId" = e.id
      WHERE i."issueDate" >= ${startOfYear} 
        AND i."issueDate" <= ${endOfYear}
        AND i.status = 'pending'
      GROUP BY e.name, EXTRACT(MONTH FROM i."issueDate")
      
      ORDER BY month, "exporterName"
    `) as Array<{
      exporterName: string;
      month: number;
      paidAmount: number;
      pendingAmount: number;
      totalAmount: number;
    }>;

    // Debug: Let's also check all invoices to see what we have
    const allInvoicesDebug = await prisma.invoice.findMany({
      include: {
        jobCard: {
          include: {
            exporter: true,
          },
        },
        largeScaleJobCard: {
          include: {
            exporter: true,
          },
        },
      },
      take: 10, // Just first 10 for debugging
    });
    console.log(
      "Debug - All invoices (first 10):",
      allInvoicesDebug.map((inv) => ({
        id: inv.id,
        amount: inv.amount,
        status: inv.status,
        issueDate: inv.issueDate,
        exporter:
          inv.jobCard?.exporter?.name ??
          inv.largeScaleJobCard?.exporter?.name ??
          "-",
      }))
    );

    // Debug: Let's check what fees exist
    const allFeesDebug = await prisma.fee.findMany({
      include: {
        jobCard: {
          include: {
            exporter: true,
          },
        },
        largeScaleJobCard: {
          include: {
            exporter: true,
          },
        },
      },
      take: 10, // Just first 10 for debugging
    });
    console.log(
      "Debug - All fees (first 10):",
      allFeesDebug.map((fee) => ({
        id: fee.id,
        amountPaid: fee.amountPaid,
        status: fee.status,
        paymentDate: fee.paymentDate,
        exporter:
          fee.jobCard?.exporter?.name ||
          fee.largeScaleJobCard?.exporter?.name ||
          "Unknown",
        feeType: fee.feeType,
      }))
    );

    console.log(
      "Debug - Exporter invoice data for chart:",
      exporterInvoiceData
    );
    console.log(
      "Debug - Raw exporterInvoiceData length:",
      exporterInvoiceData.length
    );

    // Let's also try a simpler query to see if data exists
    const simpleInvoiceCheck = await prisma.invoice.findMany({
      where: {
        issueDate: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
      include: {
        jobCard: {
          include: {
            exporter: true,
          },
        },
        largeScaleJobCard: {
          include: {
            exporter: true,
          },
        },
      },
    });
    console.log(
      "Debug - Simple invoice check found:",
      simpleInvoiceCheck.length,
      "invoices"
    );
    simpleInvoiceCheck.forEach((inv) => {
      const exporterName =
        inv.jobCard?.exporter?.name ??
        inv.largeScaleJobCard?.exporter?.name ??
        "-";
      console.log(
        `  - ${exporterName}: GHS ${inv.amount} (${
          inv.status
        }) - ${inv.issueDate.toLocaleDateString()}`
      );
    });

    // Transform the data for the chart - simplified approach
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Create chart data structure
    const exporterInvoiceChart = monthNames.map((monthName, index) => {
      const monthNumber = index + 1;
      const monthData: any = { month: monthName };

      // Find ALL data for this month and aggregate by exporter
      const monthRecords = exporterInvoiceData.filter(
        (item) => Number(item.month) === monthNumber
      );

      console.log(
        `Debug - Records for ${monthName} (month ${monthNumber}):`,
        monthRecords
      );

      // Group by exporter and sum the amounts
      const exporterTotals: { [key: string]: number } = {};
      monthRecords.forEach((record) => {
        const exporterName = record.exporterName;
        const amount = Number(record.totalAmount) || 0;

        if (exporterTotals[exporterName]) {
          exporterTotals[exporterName] += amount;
        } else {
          exporterTotals[exporterName] = amount;
        }
      });

      // Add aggregated amounts to month data
      Object.entries(exporterTotals).forEach(([exporterName, totalAmount]) => {
        monthData[exporterName] = totalAmount;
        console.log(
          `Debug - Adding ${exporterName}: ${totalAmount} to ${monthName}`
        );
      });

      // Get all unique exporters and fill zeros for months without data
      const allExporters = [
        ...new Set(exporterInvoiceData.map((item) => item.exporterName)),
      ];
      allExporters.forEach((exporterName) => {
        if (!(exporterName in monthData)) {
          monthData[exporterName] = 0;
        }
      });

      return monthData;
    });

    // Fetch recent audit trail activities for specific management areas
    const recentActivities = await prisma.auditTrail.findMany({
      where: {
        entityType: {
          in: [
            // "User",
            "JobCard",
            "Assay",
            "Invoice",
            "Commodity",
            "Exchange",
            "DailyPrice",
            "WeeklyPrice",
          ],
        },
      },
      take: 10,
      orderBy: {
        timestamp: "desc",
      },
      include: {
        user: true,
      },
    });

    // Map audit trail data to the expected format with meaningful descriptions
    const formattedActivities = recentActivities.map((activity) => {
      let actionDescription = "";

      switch (activity.entityType) {
        case "User":
          actionDescription = `${activity.action.toLowerCase()} user account`;
          break;
        case "JobCard":
          actionDescription = `${activity.action.toLowerCase()} job card ${
            activity.entityId
          }`;
          break;
        case "Assay":
          actionDescription = `${activity.action.toLowerCase()} assay record`;
          break;
        case "Invoice":
          actionDescription = `${activity.action.toLowerCase()} invoice`;
          break;
        case "Commodity":
          actionDescription = `${activity.action.toLowerCase()} commodity`;
          break;
        case "Exchange":
          actionDescription = `${activity.action.toLowerCase()} exchange rate`;
          break;
        case "DailyPrice":
          actionDescription = `${activity.action.toLowerCase()} price data`;
          break;
        case "WeeklyPrice":
          actionDescription = `${activity.action.toLowerCase()} price data`;
          break;
        default:
          actionDescription = `${activity.action.toLowerCase()} ${activity.entityType.toLowerCase()}`;
      }

      return {
        id: activity.id,
        user: activity.user.name,
        action: actionDescription,
        time: activity.timestamp,
        type: activity.action.toLowerCase(),
      };
    });

    // Mock data structured to match dashboard expectations
    const stats = {
      // Financial & export metrics requested for dashboard stat cards
      financials: {
        currentExchangeRateGhs: latestExchangeRate?.price,
        // Expose commodity prices as USD per troy ounce (matching Daily Prices)
        currentGoldPriceUsdPerOz: goldPriceDisplayed,
        currentSilverPriceUsdPerOz: silverPriceDisplayed,
        // Keep legacy GHS fields undefined to avoid accidental display
        currentGoldPriceGhsPerOz: undefined,
        currentSilverPriceGhsPerOz: undefined,
        // totalExportValueUsd: totalExportValueUsd,
        // totalExportValueGhs: totalExportValueGhs,
        // totalQuantityKg: totalQuantityKg,
        // totalQuantityLbs: totalQuantityLbs,
        // serviceFeesInclusive: serviceFeesInclusive,
        // withholdingTax: totalWithholdingTax,
        // totalVat: totalVat,
        // totalNhil: totalNhil,
        // totalCovidLevy: totalCovidLevy,
        // totalGetFund: totalGetFund,
      },
      overview: {
        totalJobCards: {
          value: totalJobCardsCount,
          change: "12.5",
          changeType: "positive" as const,
        },
        totalExporters: {
          value: totalExportersCount,
          change: "5.2",
          changeType: "positive" as const,
        },
        totalUsers: {
          value: totalUsersCount,
          change: "8.1",
          changeType: "positive" as const,
        },
        totalRevenue: {
          value: totalRevenueAmount,
          change: "15.3",
          changeType: "positive" as const,
        },
        activeJobCards: activeJobCardsCount,
        completedJobCards: completedJobCardsCount,
        pendingJobCards: pendingJobCardsCount,
        thisWeekJobCards: thisWeekJobCardsCount,
      },
      charts: {
        jobCardsByStatus: [
          { name: "Active", value: activeJobCardsCount },
          { name: "Completed", value: completedJobCardsCount },
          { name: "Pending", value: pendingJobCardsCount },
        ],
        monthlyTrend: [
          { month: "Jan", count: 18 },
          { month: "Feb", count: 22 },
          { month: "Mar", count: 25 },
          { month: "Apr", count: 28 },
          { month: "May", count: 24 },
          { month: "Jun", count: 32 },
        ],
        topExporters: [
          { name: "ABC Corp", code: "ABC", jobCards: 45 },
          { name: "XYZ Ltd", code: "XYZ", jobCards: 38 },
          { name: "Global Exports", code: "GE", jobCards: 32 },
          { name: "Trade Masters", code: "TM", jobCards: 28 },
          { name: "Export Pro", code: "EP", jobCards: 24 },
        ],
      },
      recentActivity: formattedActivities,
      exporterInvoiceChart: exporterInvoiceChart,
      chartData: {
        jobCardStatus: [
          { name: "Active", value: activeJobCardsCount, color: "#FFD700" },
          {
            name: "Completed",
            value: completedJobCardsCount,
            color: "#000000",
          },
          { name: "Pending", value: pendingJobCardsCount, color: "#666666" },
        ],
        monthlyTrends: [
          { month: "Jan", jobCards: 18, revenue: 180000 },
          { month: "Feb", jobCards: 22, revenue: 220000 },
          { month: "Mar", jobCards: 25, revenue: 250000 },
          { month: "Apr", jobCards: 28, revenue: 280000 },
          { month: "May", jobCards: 24, revenue: 240000 },
          { month: "Jun", jobCards: 32, revenue: 320000 },
        ],
        topExporters: [
          { name: "ABC Corp", jobCards: 45, revenue: 450000 },
          { name: "XYZ Ltd", jobCards: 38, revenue: 380000 },
          { name: "Global Exports", jobCards: 32, revenue: 320000 },
          { name: "Trade Masters", jobCards: 28, revenue: 280000 },
          { name: "Export Pro", jobCards: 24, revenue: 240000 },
        ],
      },
    };

    console.log(
      "Debug - Final exporterInvoiceChart being returned:",
      JSON.stringify(exporterInvoiceChart, null, 2)
    );

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
