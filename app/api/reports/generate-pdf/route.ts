import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { formatCurrency } from "@/app/lib/utils";

const GRAMS_PER_TROY_OUNCE = 31.1035;

interface ReportData {
  reportType: string;
  exporterId?: string;
  weekStart?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { reportType, exporterId, weekStart }: ReportData =
      await request.json();

    let htmlContent = "";
    let title = "";

    switch (reportType) {
      case "monthly-shipment-all-exporters":
        ({ htmlContent, title } = await generateMonthlyShipmentAllExporters());
        break;
      case "monthly-shipment-gold-exporters":
        ({ htmlContent, title } = await generateMonthlyShipmentGoldExporters());
        break;
      case "weekly-shipment-exporter":
        if (!exporterId || !weekStart) {
          return NextResponse.json(
            { error: "Exporter ID and week start required" },
            { status: 400 }
          );
        }
        ({ htmlContent, title } = await generateWeeklyShipmentExporter(
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
        ({ htmlContent, title } = await generateMonthlyAnalysisExporter(
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
        ({ htmlContent, title } = await generateMonthlyAnalysisAllExporters(
          weekStart
        ));
        break;
      default:
        return NextResponse.json(
          { error: "Invalid report type" },
          { status: 400 }
        );
    }

    // Generate PDF using Puppeteer or similar
    // For now, return HTML that can be printed to PDF
    const fullHtml = generateFullHtml(htmlContent, title);

    return new NextResponse(fullHtml, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="${title.replace(
          /\s+/g,
          "_"
        )}.html"`,
      },
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

async function generateMonthlyShipmentAllExporters() {
  const title = "Monthly Shipment Reports for All Exporters";

  // Get data for the last 30 days
  const sinceDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const jobCards = await prisma.jobCard.findMany({
    where: { createdAt: { gte: sinceDate } },
    include: {
      exporter: true,
      assays: {
        include: {
          measurements: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const htmlContent = `
    <div class="report-content">
      <h1>${title}</h1>
      <p class="report-period">Period: ${sinceDate.toLocaleDateString()} to ${new Date().toLocaleDateString()}</p>

      <table class="report-table">
        <thead>
          <tr>
            <th>Exporter</th>
            <th>Job Card ID</th>
            <th>Date</th>
            <th>Net Gold (g)</th>
            <th>Net Silver (g)</th>
            <th>Estimated Value (USD)</th>
          </tr>
        </thead>
        <tbody>
          ${jobCards
            .map((card) => {
              const netGold = card.assays.reduce(
                (sum, assay) =>
                  sum +
                  (assay.measurements?.reduce(
                    (s, measurement) => s + (measurement.netWeight || 0),
                    0
                  ) || 0),
                0
              );
              const netSilver = card.assays.reduce(
                (sum, assay) =>
                  sum +
                  (assay.measurements?.reduce(
                    (s, measurement) => s + (measurement.netWeight || 0),
                    0
                  ) || 0),
                0
              );
              const estimatedValue =
                netGold * (1 / GRAMS_PER_TROY_OUNCE) * 2000; // Using sample price

              return `
              <tr>
                <td>${card.exporter?.name || "Unknown"}</td>
                <td>${card.id}</td>
                <td>${new Date(card.createdAt).toLocaleDateString()}</td>
                <td>${netGold.toFixed(2)}</td>
                <td>${netSilver.toFixed(2)}</td>
                <td>${formatCurrency(estimatedValue)}</td>
              </tr>
            `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  return { htmlContent, title };
}

async function generateMonthlyShipmentGoldExporters() {
  const title = "Monthly Shipment Report for Gold Exporters";

  // Similar implementation but filtered for gold exporters
  const sinceDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const jobCards = await prisma.jobCard.findMany({
    where: {
      createdAt: { gte: sinceDate },
      exporter: {
        type: "GOLD",
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
    orderBy: { createdAt: "desc" },
  });

  const htmlContent = `
    <div class="report-content">
      <h1>${title}</h1>
      <p class="report-period">Period: ${sinceDate.toLocaleDateString()} to ${new Date().toLocaleDateString()}</p>

      <table class="report-table">
        <thead>
          <tr>
            <th>Exporter</th>
            <th>Job Card ID</th>
            <th>Date</th>
            <th>Net Gold (g)</th>
            <th>Estimated Value (USD)</th>
          </tr>
        </thead>
        <tbody>
          ${jobCards
            .map((card) => {
              const netGold = card.assays.reduce(
                (sum, assay) =>
                  sum +
                  (assay.measurements?.reduce(
                    (s, measurement) => s + (measurement.netWeight || 0),
                    0
                  ) || 0),
                0
              );
              const estimatedValue =
                netGold * (1 / GRAMS_PER_TROY_OUNCE) * 2000;

              return `
              <tr>
                <td>${card.exporter?.name || "Unknown"}</td>
                <td>${card.id}</td>
                <td>${new Date(card.createdAt).toLocaleDateString()}</td>
                <td>${netGold.toFixed(2)}</td>
                <td>${formatCurrency(estimatedValue)}</td>
              </tr>
            `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  return { htmlContent, title };
}

async function generateWeeklyShipmentExporter(
  exporterId: string,
  weekStart: string
) {
  const title = `Weekly Shipment Report for Exporter - Week of ${weekStart}`;

  const weekStartDate = new Date(weekStart);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 7);

  const jobCards = await prisma.jobCard.findMany({
    where: {
      exporterId: exporterId,
      createdAt: {
        gte: weekStartDate,
        lt: weekEndDate,
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
    orderBy: { createdAt: "desc" },
  });

  const htmlContent = `
    <div class="report-content">
      <h1>${title}</h1>
      <p class="report-period">Period: ${weekStartDate.toLocaleDateString()} to ${weekEndDate.toLocaleDateString()}</p>

      <table class="report-table">
        <thead>
          <tr>
            <th>Job Card ID</th>
            <th>Date</th>
            <th>Net Gold (g)</th>
            <th>Net Silver (g)</th>
            <th>Estimated Value (USD)</th>
          </tr>
        </thead>
        <tbody>
          ${jobCards
            .map((card) => {
              const netGold = card.assays.reduce(
                (sum, assay) =>
                  sum +
                  (assay.measurements?.reduce(
                    (s, measurement) => s + (measurement.netWeight || 0),
                    0
                  ) || 0),
                0
              );
              const netSilver = card.assays.reduce(
                (sum, assay) =>
                  sum +
                  (assay.measurements?.reduce(
                    (s, measurement) => s + (measurement.netWeight || 0),
                    0
                  ) || 0),
                0
              );
              const estimatedValue =
                netGold * (1 / GRAMS_PER_TROY_OUNCE) * 2000;

              return `
              <tr>
                <td>${card.id}</td>
                <td>${new Date(card.createdAt).toLocaleDateString()}</td>
                <td>${netGold.toFixed(2)}</td>
                <td>${netSilver.toFixed(2)}</td>
                <td>${formatCurrency(estimatedValue)}</td>
              </tr>
            `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  return { htmlContent, title };
}

async function generateMonthlyAnalysisExporter(
  exporterId: string,
  weekStart: string
) {
  const title = `Monthly Sample Analysis Report for Exporter - Week of ${weekStart}`;

  const weekStartDate = new Date(weekStart);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 7);

  const assays = await prisma.assay.findMany({
    where: {
      jobCard: {
        exporterId: exporterId,
        createdAt: {
          gte: weekStartDate,
          lt: weekEndDate,
        },
      },
    },
    include: {
      measurements: true,
      jobCard: {
        include: {
          exporter: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const htmlContent = `
    <div class="report-content">
      <h1>${title}</h1>
      <p class="report-period">Period: ${weekStartDate.toLocaleDateString()} to ${weekEndDate.toLocaleDateString()}</p>

      <table class="report-table">
        <thead>
          <tr>
            <th>Job Card ID</th>
            <th>Sample ID</th>
            <th>Piece Number</th>
            <th>Fineness</th>
            <th>Net Weight (g)</th>
            <th>Analysis Date</th>
          </tr>
        </thead>
        <tbody>
          ${assays
            .flatMap(
              (assay) =>
                assay.measurements?.map(
                  (measurement) => `
              <tr>
                <td>${assay.jobCard?.id || "Unknown"}</td>
                <td>${assay.id}</td>
                <td>${measurement.pieceNumber}</td>
                <td>${measurement.fineness?.toFixed(2) || "-"}</td>
                <td>${measurement.netWeight?.toFixed(2) || "-"}</td>
                <td>${new Date(assay.createdAt).toLocaleDateString()}</td>
              </tr>
            `
                ) || []
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  return { htmlContent, title };
}

async function generateMonthlyAnalysisAllExporters(weekStart: string) {
  const title = `Monthly Sample Analysis Report for All Exporters - Week of ${weekStart}`;

  const weekStartDate = new Date(weekStart);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 7);

  const assays = await prisma.assay.findMany({
    where: {
      createdAt: {
        gte: weekStartDate,
        lt: weekEndDate,
      },
    },
    include: {
      measurements: true,
      jobCard: {
        include: {
          exporter: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const htmlContent = `
    <div class="report-content">
      <h1>${title}</h1>
      <p class="report-period">Period: ${weekStartDate.toLocaleDateString()} to ${weekEndDate.toLocaleDateString()}</p>

      <table class="report-table">
        <thead>
          <tr>
            <th>Exporter</th>
            <th>Job Card ID</th>
            <th>Sample ID</th>
            <th>Piece Number</th>
            <th>Fineness</th>
            <th>Net Weight (g)</th>
            <th>Analysis Date</th>
          </tr>
        </thead>
        <tbody>
          ${assays
            .flatMap(
              (assay) =>
                assay.measurements?.map(
                  (measurement) => `
              <tr>
                <td>${assay.jobCard?.exporter?.name || "Unknown"}</td>
                <td>${assay.jobCard?.id || "Unknown"}</td>
                <td>${assay.id}</td>
                <td>${measurement.pieceNumber}</td>
                <td>${measurement.fineness?.toFixed(2) || "-"}</td>
                <td>${measurement.netWeight?.toFixed(2) || "-"}</td>
                <td>${new Date(assay.createdAt).toLocaleDateString()}</td>
              </tr>
            `
                ) || []
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  return { htmlContent, title };
}

function generateFullHtml(content: string, title: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            @page {
                size: A4 landscape;
                margin: 1cm;
            }
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background: white;
                color: #333;
            }
            .report-content {
                max-width: none;
            }
            h1 {
                color: #1f2937;
                font-size: 24px;
                margin-bottom: 10px;
                text-align: center;
            }
            .report-period {
                text-align: center;
                color: #6b7280;
                margin-bottom: 30px;
                font-size: 14px;
            }
            .report-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
                font-size: 12px;
            }
            .report-table th,
            .report-table td {
                border: 1px solid #d1d5db;
                padding: 8px 12px;
                text-align: left;
            }
            .report-table th {
                background-color: #f3f4f6;
                font-weight: 600;
                color: #374151;
            }
            .report-table tbody tr:nth-child(even) {
                background-color: #f9fafb;
            }
            .report-table tbody tr:hover {
                background-color: #f3f4f6;
            }
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
                }
                .report-table {
                    page-break-inside: avoid;
                }
                .report-table thead {
                    display: table-header-group;
                }
                .report-table tbody tr {
                    page-break-inside: avoid;
                    page-break-after: auto;
                }
            }
        </style>
    </head>
    <body>
        ${content}
    </body>
    </html>
  `;
}
