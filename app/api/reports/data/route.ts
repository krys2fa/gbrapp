import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { formatCurrency } from "@/app/lib/utils";

const GRAMS_PER_TROY_OUNCE = 31.1035;

interface ReportData {
  reportType: string;
  exporterId?: string;
  weekStart?: string;
  monthStart?: string;
  scale?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { reportType, exporterId, weekStart, monthStart, scale }: ReportData =
      await request.json();

    let data: any[] = [];
    let title = "";

    switch (reportType) {
      case "monthly-shipment-all-exporters":
        ({ data, title } = await getMonthlyShipmentAllExporters(
          monthStart,
          scale
        ));
        break;
      case "monthly-shipment-gold-exporters":
        ({ data, title } = await getMonthlyShipmentGoldExporters(
          monthStart,
          scale
        ));
        break;
      case "weekly-shipment-exporter":
        if (!exporterId || !weekStart) {
          return NextResponse.json(
            { error: "Exporter ID and week start required" },
            { status: 400 }
          );
        }
        ({ data, title } = await getWeeklyShipmentExporter(
          exporterId,
          weekStart
        ));
        break;
      case "monthly-analysis-exporter":
        if (!exporterId || !weekStart) {
          return NextResponse.json(
            { error: "Exporter ID and week start required" },
            { status: 400 }
          );
        }
        ({ data, title } = await getMonthlyAnalysisExporter(
          exporterId,
          weekStart
        ));
        break;
      case "monthly-analysis-all-exporters":
        if (!weekStart) {
          return NextResponse.json(
            { error: "Week start required" },
            { status: 400 }
          );
        }
        ({ data, title } = await getMonthlyAnalysisAllExporters(weekStart));
        break;
      default:
        return NextResponse.json(
          { error: "Invalid report type" },
          { status: 400 }
        );
    }

    return NextResponse.json({ data, title });
  } catch (error) {
    console.error("Error generating report data:", error);
    return NextResponse.json(
      { error: "Failed to generate report data" },
      { status: 500 }
    );
  }
}

async function getMonthlyShipmentAllExporters(
  monthStart?: string,
  scale?: string
) {
  // Parse monthStart or use current month
  let startOfMonth: Date;
  let endOfMonth: Date;

  if (monthStart) {
    const [year, month] = monthStart.split("-").map(Number);
    startOfMonth = new Date(year, month - 1, 1);
    endOfMonth = new Date(year, month, 0, 23, 59, 59);
  } else {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    startOfMonth = new Date(currentYear, currentMonth, 1);
    endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
  }

  // Build where clause for filtering by scale
  const whereClause: any = {
    createdAt: {
      gte: startOfMonth,
      lte: endOfMonth,
    },
  };

  if (scale === "small-scale") {
    whereClause.referenceNumber = {
      startsWith: "SS-",
    };
  } else if (scale === "large-scale") {
    whereClause.referenceNumber = {
      startsWith: "LS-",
    };
  }

  const jobCards = await prisma.jobCard.findMany({
    where: whereClause,
    include: {
      exporter: true,
      assays: {
        include: {
          measurements: true,
        },
      },
    },
  });

  // Group by exporter and aggregate data
  const exporterData: { [key: string]: any } = {};

  jobCards.forEach((card) => {
    const exporterName = card.exporter?.name || "Unknown";

    if (!exporterData[exporterName]) {
      exporterData[exporterName] = {
        exporter: exporterName,
        grossWeight: 0,
        netGoldWeightOz: 0,
        netSilverWeightOz: 0,
        estimatedValueUsd: 0,
      };
    }

    card.assays.forEach((assay) => {
      // Gross weight from assay or measurements
      const assayGrossWeight = assay.grossWeight || 0;
      const measurementsGrossWeight =
        assay.measurements?.reduce((sum, m) => sum + (m.grossWeight || 0), 0) ||
        0;
      const grossWeight = Math.max(assayGrossWeight, measurementsGrossWeight);

      // Net weight from assay or measurements
      const assayNetWeight = assay.netWeight || 0;
      const measurementsNetWeight =
        assay.measurements?.reduce((sum, m) => sum + (m.netWeight || 0), 0) ||
        0;
      const netWeight = Math.max(assayNetWeight, measurementsNetWeight);

      // Calculate gold and silver weights in troy ounces
      const goldContent = assay.goldContent || 0;
      const silverContent = assay.silverContent || 0;

      const netGoldWeightGrams = netWeight * (goldContent / 100);
      const netSilverWeightGrams = netWeight * (silverContent / 100);

      const netGoldWeightOz = netGoldWeightGrams / GRAMS_PER_TROY_OUNCE;
      const netSilverWeightOz = netSilverWeightGrams / GRAMS_PER_TROY_OUNCE;

      // Estimated value
      const estimatedValue = assay.totalUsdValue || 0;

      exporterData[exporterName].grossWeight += grossWeight;
      exporterData[exporterName].netGoldWeightOz += netGoldWeightOz;
      exporterData[exporterName].netSilverWeightOz += netSilverWeightOz;
      exporterData[exporterName].estimatedValueUsd += estimatedValue;
    });
  });

  const data = Object.values(exporterData).map((item: any) => ({
    exporter: item.exporter,
    grossWeight: item.grossWeight.toFixed(4),
    netGoldWeightOz: item.netGoldWeightOz.toFixed(3),
    netSilverWeightOz: item.netSilverWeightOz.toFixed(3),
    estimatedValueUsd: formatCurrency(item.estimatedValueUsd),
  }));

  const monthName = startOfMonth.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
  const scaleText =
    scale === "small-scale"
      ? "Small Scale"
      : scale === "large-scale"
      ? "Large Scale"
      : "All";

  return {
    data,
    title: `Monthly Shipment Records For ${scaleText} Exporters - ${monthName}`,
  };
}

async function getMonthlyShipmentGoldExporters(
  monthStart?: string,
  scale?: string
) {
  // Parse monthStart or use current month
  let startOfMonth: Date;
  let endOfMonth: Date;

  if (monthStart) {
    const [year, month] = monthStart.split("-").map(Number);
    startOfMonth = new Date(year, month - 1, 1);
    endOfMonth = new Date(year, month, 0, 23, 59, 59);
  } else {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    startOfMonth = new Date(currentYear, currentMonth, 1);
    endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
  }

  // Build where clause for filtering by scale
  const whereClause: any = {
    createdAt: {
      gte: startOfMonth,
      lte: endOfMonth,
    },
    commodityId: {
      not: null,
    },
  };

  if (scale === "small-scale") {
    whereClause.referenceNumber = {
      startsWith: "SS-",
    };
  } else if (scale === "large-scale") {
    whereClause.referenceNumber = {
      startsWith: "LS-",
    };
  }

  const jobCards = await prisma.jobCard.findMany({
    where: whereClause,
    include: {
      exporter: true,
      commodity: true,
      assays: {
        include: {
          measurements: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const data = jobCards
    .filter((card) => card.commodity?.symbol === "Au")
    .map((card) => {
      const assay = card.assays[0];
      const grossWeight =
        assay?.measurements?.reduce(
          (sum, m) => sum + (m.grossWeight || 0),
          0
        ) || 0;
      const netWeight =
        assay?.measurements?.reduce((sum, m) => sum + (m.netWeight || 0), 0) ||
        0;

      // Convert grams to kilos for gross weight
      const grossWeightKilos = grossWeight / 1000;
      // Convert grams to troy ounces for net weight
      const netWeightOz = netWeight / GRAMS_PER_TROY_OUNCE;
      // Get estimated value
      const estimatedValueUSD = assay?.totalUsdValue || 0;

      return {
        exporter: card.exporter?.name || "Unknown",
        grossWeightKilos: grossWeightKilos.toFixed(4),
        netWeightOz: netWeightOz.toFixed(3),
        estimatedValueUSD: formatCurrency(estimatedValueUSD),
      };
    });

  const monthName = startOfMonth.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
  const scaleText =
    scale === "small-scale"
      ? "Small Scale"
      : scale === "large-scale"
      ? "Large Scale"
      : "All";

  return {
    data,
    title: `Monthly Shipment Report for ${scaleText} Gold Exporters - ${monthName}`,
  };
}

async function getWeeklyShipmentExporter(
  exporterId: string,
  weekStart: string
) {
  const startDate = new Date(weekStart);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const jobCards = await prisma.jobCard.findMany({
    where: {
      exporterId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      exporter: true,
      assays: {
        include: {
          measurements: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const data = jobCards.map((card) => {
    const assay = card.assays[0];
    const totalWeight =
      assay?.measurements?.reduce((sum, m) => sum + (m.netWeight || 0), 0) || 0;

    return {
      date: card.createdAt.toLocaleDateString(),
      referenceNumber: card.referenceNumber,
      totalWeight: totalWeight.toFixed(2),
      unit: "grams",
    };
  });

  return {
    data,
    title: `Weekly Shipment Report - ${
      jobCards[0]?.exporter?.name || "Unknown Exporter"
    } (${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()})`,
  };
}

async function getMonthlyAnalysisExporter(
  exporterId: string,
  weekStart: string
) {
  const startDate = new Date(weekStart);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const assays = await prisma.assay.findMany({
    where: {
      jobCard: {
        exporterId,
      },
      assayDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      jobCard: {
        include: {
          exporter: true,
        },
      },
      measurements: true,
    },
    orderBy: {
      assayDate: "asc",
    },
  });

  const data = assays.map((assay) => ({
    date: assay.assayDate.toLocaleDateString(),
    referenceNumber: assay.jobCard?.referenceNumber || "Unknown",
    goldContent: assay.goldContent?.toFixed(2) || "0.00",
    silverContent: assay.silverContent?.toFixed(2) || "0.00",
    fineness: assay.fineness?.toFixed(2) || "0.00",
    certificateNumber: assay.certificateNumber || "N/A",
  }));

  return {
    data,
    title: `Monthly Analysis Report - ${
      assays[0]?.jobCard?.exporter?.name || "Unknown Exporter"
    } (${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()})`,
  };
}

async function getMonthlyAnalysisAllExporters(weekStart: string) {
  const startDate = new Date(weekStart);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const assays = await prisma.assay.findMany({
    where: {
      assayDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      jobCard: {
        include: {
          exporter: true,
        },
      },
      measurements: true,
    },
    orderBy: {
      assayDate: "asc",
    },
  });

  const data = assays.map((assay) => ({
    date: assay.assayDate.toLocaleDateString(),
    exporter: assay.jobCard?.exporter?.name || "Unknown",
    referenceNumber: assay.jobCard?.referenceNumber || "Unknown",
    goldContent: assay.goldContent?.toFixed(2) || "0.00",
    silverContent: assay.silverContent?.toFixed(2) || "0.00",
    fineness: assay.fineness?.toFixed(2) || "0.00",
    certificateNumber: assay.certificateNumber || "N/A",
  }));

  return {
    data,
    title: `Monthly Analysis Report - All Exporters (${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()})`,
  };
}
