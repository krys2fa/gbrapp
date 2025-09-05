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

    // Mock data structured to match dashboard expectations
    const stats = {
      // Financial & export metrics requested for dashboard stat cards
      financials: {
        currentExchangeRateGhs: 12.34, // GHS per USD (example)
        currentGoldPriceGhsPerOz: 7400.5,
        currentSilverPriceGhsPerOz: 88.75,
        totalExportValueUsd: 1234567.89,
        totalExportValueGhs: 15234567.45,
        totalQuantityKg: 12345.67,
        totalQuantityLbs: 27232.45,
        serviceFeesInclusive: 23456.78,
        withholdingTax: 3456.12,
        totalVat: 4567.89,
        totalNhil: 567.01,
        totalCovidLevy: 78.9,
        totalGetFund: 123.45,
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
      recentActivity: [
        {
          id: "1",
          type: "Job Card Created",
          action: "New job card for XYZ Corp",
          time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          user: "John Doe",
        },
        {
          id: "2",
          type: "Invoice Generated",
          action: "Invoice #INV-2024-001 generated",
          time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          user: "Jane Smith",
        },
        {
          id: "3",
          type: "Job Card Completed",
          action: "Job card #JC-2024-045 completed",
          time: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
          user: "Mike Johnson",
        },
        {
          id: "4",
          type: "User Registered",
          action: "New user Sarah Wilson registered",
          time: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
          user: "System",
        },
        {
          id: "5",
          type: "Payment Received",
          action: "Payment of $15,000 received",
          time: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
          user: "Accounts Team",
        },
      ],
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
