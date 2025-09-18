import Link from "next/link";
import { Header } from "@/app/components/layout/header";
import { FileText } from "lucide-react";
import { prisma } from "@/app/lib/prisma";
import { formatCurrency } from "@/app/lib/utils";
import { PrinterIcon } from "@heroicons/react/24/outline";

const GRAMS_PER_TROY_OUNCE = 31.1035;

function formatNumber(v?: number) {
  if (v == null) return "-";
  return v.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default async function ReportsPage(props: any) {
  const resolvedProps = await props;
  const searchParams = await (resolvedProps?.searchParams || {});
  const reportParam = (searchParams?.report as string) || "weekly-summary";
  const feesReportParam =
    (searchParams?.feesReport as string) || "daily-summary";
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
  let largeScaleJobCards: any[] = [];

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
        exporter: { select: { id: true, name: true } },
        assays: {
          select: {
            id: true,
            silverContent: true,
            jbGrossWeight: true,
            jbNetWeight: true,
            jbFineness: true,
            jbWeightInOz: true,
            jbPricePerOz: true,
            jbTotalUsdValue: true,
            jbTotalGhsValue: true,
            measurements: { select: { id: true, netWeight: true } },
          },
        },
      },
    });

    // Fetch large scale job cards
    largeScaleJobCards = await prisma.largeScaleJobCard.findMany({
      where: { createdAt: { gte: sinceDate } },
      orderBy: { createdAt: "desc" },
      take: 1000,
      select: {
        id: true,
        createdAt: true,
        exporter: { select: { id: true, name: true } },
        assays: {
          select: {
            id: true,
            totalNetGoldWeight: true,
            totalNetSilverWeight: true,
            totalNetGoldWeightOz: true,
            totalNetSilverWeightOz: true,
            pricePerOz: true,
            totalGoldValue: true,
            totalSilverValue: true,
            totalCombinedValue: true,
            totalValueGhs: true,
            measurements: {
              select: {
                id: true,
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
    // Defensive: log and continue with empty jobCards so the Reports page doesn't crash
    // Common cause: production DB schema is older and missing recently added columns
    console.error("Failed to load job cards for reports page:", e);
    jobCards = [];
    largeScaleJobCards = [];
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
      storedValues: isLargeScale
        ? {
            // Large scale stored values
            grossWeight: null, // Not available in large scale
            netWeight: assay?.totalNetGoldWeight,
            fineness: null, // Not available in large scale
            weightInOz: assay?.totalNetGoldWeightOz,
            pricePerOz: assay?.pricePerOz,
            totalUsdValue: assay?.totalCombinedValue || assay?.totalGoldValue,
            totalGhsValue: assay?.totalValueGhs,
          }
        : {
            // Regular job card stored values
            grossWeight: assay?.jbGrossWeight,
            netWeight: assay?.jbNetWeight,
            fineness: assay?.jbFineness,
            weightInOz: assay?.jbWeightInOz,
            pricePerOz: assay?.jbPricePerOz,
            totalUsdValue: assay?.jbTotalUsdValue,
            totalGhsValue: assay?.jbTotalGhsValue,
          },
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

  return (
    <>
      <Header
        title="Reports"
        icon={<FileText className="h-5 w-5" />}
        subtitle="Generated reports from database data"
      />
      <main className="py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h2 className="text-2xl font-semibold mb-4">
            Exporter Performance Analytics Dashboard
          </h2>

          <div className="text-sm text-gray-600 mb-3">
            Showing: <strong>{isWeekly ? "Weekly" : "Monthly"}</strong>{" "}
            <strong>{isSummary ? "Summary" : "Comprehensive"}</strong> —{" "}
            {sinceDate.toLocaleDateString()} to {until.toLocaleDateString()}
          </div>

          {/* Performance Overview Cards */}
          {(() => {
            const totalGold = rows.reduce(
              (sum, r) => sum + (r.netGoldGrams || 0),
              0
            );
            const totalSilver = rows.reduce(
              (sum, r) => sum + (r.netSilverGrams || 0),
              0
            );
            const totalValue = rows.reduce(
              (sum, r) => sum + (r.estimatedValue || 0),
              0
            );
            const avgGoldPerExporter =
              rows.length > 0 ? totalGold / rows.length : 0;
            const topExporter =
              rows.length > 0
                ? rows.reduce(
                    (max, r) =>
                      r.estimatedValue > max.estimatedValue ? r : max,
                    rows[0]
                  )
                : null;

            return (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="text-sm font-medium text-yellow-700">
                    Total Gold Processed
                  </h3>
                  <p className="text-lg font-bold text-yellow-900">
                    {formatNumber(totalGold)}g
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    {(totalGold / GRAMS_PER_TROY_OUNCE).toFixed(2)} oz
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700">
                    Total Silver Processed
                  </h3>
                  <p className="text-lg font-bold text-gray-900">
                    {formatNumber(totalSilver)}g
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {(totalSilver / GRAMS_PER_TROY_OUNCE).toFixed(2)} oz
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="text-sm font-medium text-green-700">
                    Total Market Value
                  </h3>
                  <p className="text-lg font-bold text-green-900">
                    {formatCurrency(totalValue)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Combined precious metals
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-medium text-blue-700">
                    Avg Gold/Exporter
                  </h3>
                  <p className="text-lg font-bold text-blue-900">
                    {formatNumber(avgGoldPerExporter)}g
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Processing efficiency
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h3 className="text-sm font-medium text-purple-700">
                    Top Performer
                  </h3>
                  <p className="text-lg font-bold text-purple-900">
                    {topExporter?.exporter || "N/A"}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    {topExporter
                      ? formatCurrency(topExporter.estimatedValue)
                      : "No data"}
                  </p>
                </div>
              </div>
            );
          })()}

          <div className="mb-4 flex gap-2 flex-wrap">
            <Link
              href="?report=weekly-summary"
              className={`px-3 py-1 rounded-md border ${
                reportParam === "weekly-summary"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              Weekly Summary
            </Link>
            <Link
              href="?report=weekly-comprehensive"
              className={`px-3 py-1 rounded-md border ${
                reportParam === "weekly-comprehensive"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              Weekly Comprehensive
            </Link>
            <Link
              href="?report=monthly-summary"
              className={`px-3 py-1 rounded-md border ${
                reportParam === "monthly-summary"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              Monthly Summary
            </Link>
            <Link
              href="?report=monthly-comprehensive"
              className={`px-3 py-1 rounded-md border ${
                reportParam === "monthly-comprehensive"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              Monthly Comprehensive
            </Link>
          </div>

          <div className="mb-4">
            <a
              href={`/api/reports?report=${encodeURIComponent(reportParam)}`}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-green-600 text-white"
            >
              <PrinterIcon className="h-4 w-4 mr-1" />
              Download  CSV
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {!isSummary && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exporter
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Gold (g)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gold (oz)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Silver (g)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Market Value (USD)
                  </th>
                  {isSummary && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Market Share %
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rows.map((r, index) => {
                  const goldOz = r.netGoldGrams / GRAMS_PER_TROY_OUNCE;
                  const totalValue = rows.reduce(
                    (sum, row) => sum + (row.estimatedValue || 0),
                    0
                  );
                  const marketShare =
                    totalValue > 0 ? (r.estimatedValue / totalValue) * 100 : 0;

                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      {!isSummary && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {r.createdAt
                            ? new Date(r.createdAt).toLocaleDateString()
                            : "-"}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {isSummary && (
                            <div
                              className={`w-3 h-3 rounded-full mr-3 ${
                                index === 0
                                  ? "bg-yellow-400"
                                  : index === 1
                                  ? "bg-gray-400"
                                  : index === 2
                                  ? "bg-orange-400"
                                  : "bg-blue-400"
                              }`}
                            ></div>
                          )}
                          <span className="text-sm font-medium text-indigo-600">
                            {r.exporter}
                          </span>
                          {!isSummary && r.isLargeScale && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              LS
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                        {formatNumber(r.netGoldGrams)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {formatNumber(goldOz)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {formatNumber(r.netSilverGrams)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                        {formatCurrency(r.estimatedValue, "USD", false)}
                      </td>
                      {isSummary && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              marketShare >= 25
                                ? "bg-green-100 text-green-800"
                                : marketShare >= 15
                                ? "bg-yellow-100 text-yellow-800"
                                : marketShare >= 5
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {marketShare.toFixed(1)}%
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      {/* Financial Analytics section */}
      <main className="py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mt-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h2 className="text-2xl font-semibold mb-4">
            Revenue Analytics Dashboard
          </h2>

          {/* Fees controls */}
          {(() => {
            const feesIsDaily = feesReportParam.startsWith("daily");
            const feesIsSummary = feesReportParam.includes("summary");
            const feesPeriodDays = feesIsDaily
              ? 1
              : feesReportParam.startsWith("weekly")
              ? 7
              : 30;
            const feesUntil = new Date();
            const feesSinceDate = new Date(
              Date.now() - feesPeriodDays * 24 * 60 * 60 * 1000
            );

            return (
              <>
                <div className="text-sm text-gray-600 mb-3">
                  Showing:{" "}
                  <strong>
                    {feesIsDaily
                      ? "Daily"
                      : feesPeriodDays === 7
                      ? "Weekly"
                      : "Monthly"}
                  </strong>{" "}
                  <strong>{feesIsSummary ? "Summary" : "Comprehensive"}</strong>{" "}
                  — {feesSinceDate.toLocaleDateString()} to{" "}
                  {feesUntil.toLocaleDateString()}
                </div>

                <div className="mb-4 flex gap-2 flex-wrap">
                  <Link
                    href={`?report=${encodeURIComponent(
                      reportParam
                    )}&feesReport=daily-summary`}
                    className={`px-3 py-1 rounded-md border ${
                      feesReportParam === "daily-summary"
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-gray-700"
                    }`}
                  >
                    Daily Summary
                  </Link>
                  <Link
                    href={`?report=${encodeURIComponent(
                      reportParam
                    )}&feesReport=daily-comprehensive`}
                    className={`px-3 py-1 rounded-md border ${
                      feesReportParam === "daily-comprehensive"
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-gray-700"
                    }`}
                  >
                    Daily Comprehensive
                  </Link>
                  <Link
                    href={`?report=${encodeURIComponent(
                      reportParam
                    )}&feesReport=weekly-summary`}
                    className={`px-3 py-1 rounded-md border ${
                      feesReportParam === "weekly-summary"
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-gray-700"
                    }`}
                  >
                    Weekly Summary
                  </Link>
                  <Link
                    href={`?report=${encodeURIComponent(
                      reportParam
                    )}&feesReport=weekly-comprehensive`}
                    className={`px-3 py-1 rounded-md border ${
                      feesReportParam === "weekly-comprehensive"
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-gray-700"
                    }`}
                  >
                    Weekly Comprehensive
                  </Link>
                  <Link
                    href={`?report=${encodeURIComponent(
                      reportParam
                    )}&feesReport=monthly-summary`}
                    className={`px-3 py-1 rounded-md border ${
                      feesReportParam === "monthly-summary"
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-gray-700"
                    }`}
                  >
                    Monthly Summary
                  </Link>
                  <Link
                    href={`?report=${encodeURIComponent(
                      reportParam
                    )}&feesReport=monthly-comprehensive`}
                    className={`px-3 py-1 rounded-md border ${
                      feesReportParam === "monthly-comprehensive"
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-gray-700"
                    }`}
                  >
                    Monthly Comprehensive
                  </Link>
                </div>

                <div className="mb-4">
                  <a
                    href={`/api/reports?report=revenue-analytics&feesReport=${encodeURIComponent(
                      feesReportParam
                    )}`}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-green-600 text-white"
                  >
                    <PrinterIcon className="h-4 w-4 mr-1" />
                    Download CSV
                  </a>
                </div>
              </>
            );
          })()}

          {/* Fees table - server data fetch */}
          <FeesTable feesReportParam={feesReportParam} />
        </div>
      </main>
    </>
  );
}

async function FeesTable({ feesReportParam }: any) {
  const feesReport = (feesReportParam as string) || "daily-summary";
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

  // Calculate financial metrics
  const totalRevenue = fees.reduce(
    (sum, f) => sum + Number(f.amountPaid || 0),
    0
  );
  const totalJobCards = jobCards.length + largeScaleJobCards.length;
  const avgRevenuePerJobCard =
    totalJobCards > 0 ? totalRevenue / totalJobCards : 0;

  // Revenue by exporter with additional metrics
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

  // Add job card counts and assay counts
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

  if (feesIsSummary) {
    return (
      <div className="space-y-6">
        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-700">Total Revenue</h3>
            <p className="text-2xl font-bold text-blue-900">
              {formatCurrency(totalRevenue)}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {feesPeriodDays === 1 ? "Today" : `Last ${feesPeriodDays} days`}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-sm font-medium text-green-700">
              Job Cards Processed
            </h3>
            <p className="text-2xl font-bold text-green-900">
              {totalJobCards.toLocaleString()}
            </p>
            <p className="text-xs text-green-600 mt-1">Regular + Large Scale</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="text-sm font-medium text-purple-700">
              Avg Revenue/Job Card
            </h3>
            <p className="text-2xl font-bold text-purple-900">
              {formatCurrency(avgRevenuePerJobCard)}
            </p>
            <p className="text-xs text-purple-600 mt-1">Revenue efficiency</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h3 className="text-sm font-medium text-orange-700">
              Active Exporters
            </h3>
            <p className="text-2xl font-bold text-orange-900">
              {exporterStats.length}
            </p>
            <p className="text-xs text-orange-600 mt-1">Generating revenue</p>
          </div>
        </div>

        {/* Exporter Performance Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Exporter
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Revenue
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Cards
                </th>
                {/* <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assays
                </th> */}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Value/Card
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Market Share %
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {exporterStats.map((stat, index) => {
                const marketShare =
                  totalRevenue > 0 ? (stat.revenue / totalRevenue) * 100 : 0;
                return (
                  <tr
                    key={`${stat.exporter}-${index}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 ${
                            index === 0
                              ? "bg-yellow-400"
                              : index === 1
                              ? "bg-gray-400"
                              : index === 2
                              ? "bg-orange-400"
                              : "bg-blue-400"
                          }`}
                        ></div>
                        <span className="text-sm font-medium text-indigo-600">
                          {stat.exporter}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                      {formatCurrency(stat.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {stat.jobCardCount.toLocaleString()}
                    </td>
                    {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {stat.assayCount.toLocaleString()}
                    </td> */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {formatCurrency(stat.avgJobCardValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          marketShare >= 25
                            ? "bg-green-100 text-green-800"
                            : marketShare >= 15
                            ? "bg-yellow-100 text-yellow-800"
                            : marketShare >= 5
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {marketShare.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {stat.lastActivity.toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

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

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Transaction Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Exporter
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Job Card Type
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Receipt #
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Payment Date
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactionDetails.map((tx) => (
            <tr key={tx.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {tx.date ? new Date(tx.date).toLocaleDateString() : "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                {tx.exporter}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    tx.jobCardType === "Regular"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {tx.jobCardType}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                {formatCurrency(tx.amount)} {tx.currency}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    tx.status === "paid"
                      ? "bg-green-100 text-green-800"
                      : tx.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {tx.receiptNumber}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                {tx.paymentDate
                  ? new Date(tx.paymentDate).toLocaleDateString()
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
