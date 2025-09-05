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

    // Calculate total revenue from invoices
    const totalRevenueResult = await prisma.invoice.aggregate({
      _sum: {
        amount: true,
      },
    });
    const totalRevenueAmount = totalRevenueResult._sum.amount || 0;

    // Fetch current exchange rate (GHS per USD)
    const latestExchangeRate = await prisma.dailyPrice.findFirst({
      where: { type: "EXCHANGE" },
      orderBy: { createdAt: "desc" },
    });

    // Fetch current gold price (GHS per troy ounce) - most recent
    const latestGoldPrice = await prisma.dailyPrice.findFirst({
      where: {
        type: "COMMODITY",
        commodity: {
          symbol: "XAU", // Gold symbol
        },
      },
      include: {
        commodity: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // If no gold price found, try to get any recent commodity price as fallback
    let goldPrice = latestGoldPrice?.price;
    if (!goldPrice) {
      const anyRecentCommodityPrice = await prisma.dailyPrice.findFirst({
        where: {
          type: "COMMODITY",
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      goldPrice = anyRecentCommodityPrice?.price;
    }

    // Fetch current silver price (GHS per troy ounce) - most recent
    const latestSilverPrice = await prisma.dailyPrice.findFirst({
      where: {
        type: "COMMODITY",
        commodity: {
          symbol: "XAG", // Silver symbol
        },
      },
      include: {
        commodity: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Fallback: If no XAG silver price found, get any recent commodity price
    const silverPrice =
      latestSilverPrice?.price ||
      (
        await prisma.dailyPrice.findFirst({
          where: {
            type: "COMMODITY",
          },
          include: {
            commodity: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        })
      )?.price;

    // Calculate total withholding tax from fees
    const withholdingTaxResult = await prisma.fee.aggregate({
      _sum: {
        whtTotal: true,
      },
    });
    const totalWithholdingTax = withholdingTaxResult._sum.whtTotal || 0;

    // Calculate total VAT from levies
    const vatResult = await prisma.levy.aggregate({
      _sum: {
        calculatedAmount: true,
      },
      where: {
        code: "VAT",
      },
    });
    const totalVat = vatResult._sum.calculatedAmount || 0;

    // Calculate total NHIL from levies
    const nhilResult = await prisma.levy.aggregate({
      _sum: {
        calculatedAmount: true,
      },
      where: {
        code: "NHIL",
      },
    });
    const totalNhil = nhilResult._sum.calculatedAmount || 0;

    // Calculate total COVID levy from levies
    const covidLevyResult = await prisma.levy.aggregate({
      _sum: {
        calculatedAmount: true,
      },
      where: {
        code: "COVID",
      },
    });
    const totalCovidLevy = covidLevyResult._sum.calculatedAmount || 0;

    // Calculate total GETFund from levies
    const getFundResult = await prisma.levy.aggregate({
      _sum: {
        calculatedAmount: true,
      },
      where: {
        code: "GETFUND",
      },
    });
    const totalGetFund = getFundResult._sum.calculatedAmount || 0;

    // Calculate total export values and quantities from job cards
    const exportStats = await prisma.jobCard.aggregate({
      _sum: {
        totalNetWeight: true,
        valueUsd: true,
        valueGhs: true,
      },
    });

    const totalExportValueUsd = exportStats._sum.valueUsd || 0;
    const totalExportValueGhs = exportStats._sum.valueGhs || 0;
    const totalQuantityKg = exportStats._sum.totalNetWeight || 0;
    const totalQuantityLbs = totalQuantityKg * 2.20462; // Convert kg to lbs

    // Calculate service fees from fees table
    const serviceFeesResult = await prisma.fee.aggregate({
      _sum: {
        amountPaid: true,
      },
    });
    const serviceFeesInclusive = serviceFeesResult._sum.amountPaid || 0;

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
        currentGoldPriceGhsPerOz: goldPrice,
        currentSilverPriceGhsPerOz: silverPrice,
        totalExportValueUsd: totalExportValueUsd,
        totalExportValueGhs: totalExportValueGhs,
        totalQuantityKg: totalQuantityKg,
        totalQuantityLbs: totalQuantityLbs,
        serviceFeesInclusive: serviceFeesInclusive,
        withholdingTax: totalWithholdingTax,
        totalVat: totalVat,
        totalNhil: totalNhil,
        totalCovidLevy: totalCovidLevy,
        totalGetFund: totalGetFund,
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

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
