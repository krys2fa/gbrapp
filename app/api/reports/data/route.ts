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
        if (!exporterId || !monthStart) {
          return NextResponse.json(
            { error: "Exporter ID and month required" },
            { status: 400 }
          );
        }
        ({ data, title } = await getWeeklyShipmentExporter(
          exporterId,
          monthStart
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
        if (!monthStart) {
          return NextResponse.json(
            { error: "Month start required" },
            { status: 400 }
          );
        }
        ({ data, title } = await getMonthlyAnalysisAllExporters(monthStart));
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
        humanReadableId: card.humanReadableId,
        referenceNumber: card.referenceNumber,
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
  monthStart: string
) {
  // Parse monthStart
  const [year, month] = monthStart.split("-").map(Number);
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  // Build where clause
  const whereClause: any = {
    exporterId,
    createdAt: {
      gte: startOfMonth,
      lte: endOfMonth,
    },
  };

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
    orderBy: {
      createdAt: "asc",
    },
  });

  const data = jobCards.map((card) => {
    const assay = card.assays[0];

    // Calculate gross weight in kilograms
    const grossWeightKg =
      assay?.measurements?.reduce((sum, m) => sum + (m.grossWeight || 0), 0) ||
      0;
    const grossWeightKgValue = grossWeightKg / 1000; // Convert grams to kg

    // Get assay values
    const goldContent = assay?.goldContent || 0; // Au %
    const silverContent = assay?.silverContent || 0; // Ag %

    // Calculate net weights
    const netWeightAuKg = (grossWeightKg * goldContent) / 100 / 1000; // Convert to kg
    const netWeightAgKg = (grossWeightKg * silverContent) / 100 / 1000; // Convert to kg

    // Values
    const valueUSD = assay?.totalUsdValue || 0;
    const valueGHS = assay?.totalGhsValue || 0;

    return {
      humanReadableId: card.humanReadableId,
      referenceNumber: card.referenceNumber,
      dateOfAnalysis: card.createdAt.toLocaleDateString(),
      shipmentNumber: card.referenceNumber,
      grossWeightKg: grossWeightKgValue.toFixed(4),
      finenessAuKg: goldContent.toFixed(2), // Au %
      netWeightAuKg: netWeightAuKg.toFixed(4),
      finenessAgPercent: silverContent.toFixed(2), // Ag %
      netWeightAgKg: netWeightAgKg.toFixed(4),
      valueUSD: formatCurrency(valueUSD),
      valueGHS: formatCurrency(valueGHS),
    };
  });

  const exporterName = jobCards[0]?.exporter?.name || "Unknown Exporter";

  let monthText = "";
  if (monthStart) {
    const [year, month] = monthStart.split("-").map(Number);
    const monthDate = new Date(year, month - 1, 1);
    monthText = monthDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  }

  return {
    data,
    title: `Weekly Shipment Report - ${exporterName} - ${monthText}`,
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

async function getMonthlyAnalysisAllExporters(monthStart: string) {
  const [year, month] = monthStart.split("-").map(Number);
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  const jobCards = await prisma.jobCard.findMany({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
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

  // Group by exporter and date
  const groupedData = jobCards.reduce((acc, card) => {
    const exporterName = card.exporter?.name || "Unknown Exporter";
    const dateKey = card.createdAt.toISOString().split("T")[0]; // YYYY-MM-DD format

    if (!acc[exporterName]) {
      acc[exporterName] = {};
    }

    if (!acc[exporterName][dateKey]) {
      acc[exporterName][dateKey] = {
        exporter: exporterName,
        dateOfAnalysis: card.createdAt.toLocaleDateString(),
        numberOfSamples: 0,
        numberOfBars: 0,
        totalBarWeightShippedKg: 0,
        finenessAuPercent: 0,
        finenessAgPercent: 0,
        netWeightAuKg: 0,
        netWeightAgKg: 0,
      };
    }

    const assay = card.assays[0];
    if (assay) {
      acc[exporterName][dateKey].numberOfSamples += 1;
      acc[exporterName][dateKey].numberOfBars +=
        assay.measurements?.length || 0;

      // Calculate weights and fineness
      const goldContent = assay.goldContent || 0;
      const silverContent = assay.silverContent || 0;
      const grossWeight = card.totalGrossWeight || 0;

      acc[exporterName][dateKey].totalBarWeightShippedKg += grossWeight;
      acc[exporterName][dateKey].finenessAuPercent = goldContent;
      acc[exporterName][dateKey].finenessAgPercent = silverContent;
      acc[exporterName][dateKey].netWeightAuKg +=
        (grossWeight * goldContent) / 100;
      acc[exporterName][dateKey].netWeightAgKg +=
        (grossWeight * silverContent) / 100;
    }

    return acc;
  }, {} as Record<string, Record<string, any>>);

  // Flatten the grouped data
  const data = Object.values(groupedData).flatMap((exporterData: any) =>
    Object.values(exporterData)
  );

  // Format the data
  const formattedData = data.map((row: any) => ({
    exporter: row.exporter,
    dateOfAnalysis: row.dateOfAnalysis,
    numberOfSamples: row.numberOfSamples,
    numberOfBars: row.numberOfBars,
    totalBarWeightShippedKg: row.totalBarWeightShippedKg.toFixed(4),
    finenessAuPercent: row.finenessAuPercent.toFixed(2),
    finenessAgPercent: row.finenessAgPercent.toFixed(2),
    netWeightAuKg: row.netWeightAuKg.toFixed(4),
    netWeightAgKg: row.netWeightAgKg.toFixed(4),
  }));

  let monthText = "";
  if (monthStart) {
    const [year, month] = monthStart.split("-").map(Number);
    const monthDate = new Date(year, month - 1, 1);
    monthText = monthDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  }

  return {
    data: formattedData,
    title: `Monthly Sample Analysis Report - All Exporters - ${monthText}`,
  };
}
