import Link from "next/link";
import { Header } from "@/app/components/layout/header";
import { FileText } from "lucide-react";
import { prisma } from "@/app/lib/prisma";

const GRAMS_PER_TROY_OUNCE = 31.1034768;

function formatNumber(v?: number) {
  if (v == null) return "-";
  return v.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default async function ReportsPage(props: any) {
  const { searchParams } = await props;
  const reportParam = (searchParams?.report as string) || "weekly-summary";
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

  // Fetch job cards within the selected period with exporter and assays/measurements
  const jobCards = await prisma.jobCard.findMany({
    where: { createdAt: { gte: sinceDate } },
    include: { exporter: true, assays: { include: { measurements: true } } },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  let rows: any[] = [];

  const computed = jobCards.map((jc: any) => {
    const storedNet = Number(jc.totalNetWeight) || 0; // grams
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

  if (isSummary) {
    // aggregate by exporter
    const map = new Map<string, { exporter: string; netGoldGrams: number; netSilverGrams: number; estimatedValue: number }>();
    for (const c of computed) {
      const key = c.exporter || "-";
      const prev = map.get(key);
      if (prev) {
        prev.netGoldGrams += c.netGoldGrams;
        prev.netSilverGrams += c.netSilverGrams;
        prev.estimatedValue += c.estimatedValue;
      } else {
        map.set(key, { exporter: key, netGoldGrams: c.netGoldGrams, netSilverGrams: c.netSilverGrams, estimatedValue: c.estimatedValue });
      }
    }
    rows = Array.from(map.values()).map((v, i) => ({ id: `agg-${i}-${v.exporter}`, exporter: v.exporter, netGoldGrams: v.netGoldGrams, netSilverGrams: v.netSilverGrams, estimatedValue: v.estimatedValue }));
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
          <h2 className="text-lg font-semibold mb-4">Exporters & Weights</h2>

      <div className="text-sm text-gray-600 mb-3">Showing: <strong>{isWeekly ? 'Weekly' : 'Monthly'}</strong> <strong>{isSummary ? 'Summary' : 'Comprehensive'}</strong> — {sinceDate.toLocaleDateString()} to {until.toLocaleDateString()}</div>

      <div className="mb-4 flex gap-2 flex-wrap">
            <Link href="?report=weekly-summary" className={`px-3 py-1 rounded-md border ${reportParam === 'weekly-summary' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}>
              Weekly Summary
            </Link>
            <Link href="?report=weekly-comprehensive" className={`px-3 py-1 rounded-md border ${reportParam === 'weekly-comprehensive' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}>
              Weekly Comprehensive
            </Link>
            <Link href="?report=monthly-summary" className={`px-3 py-1 rounded-md border ${reportParam === 'monthly-summary' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}>
              Monthly Summary
            </Link>
            <Link href="?report=monthly-comprehensive" className={`px-3 py-1 rounded-md border ${reportParam === 'monthly-comprehensive' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}>
              Monthly Comprehensive
            </Link>
          </div>

          <div className="mb-4">
            <a href={`/api/reports?report=${encodeURIComponent(reportParam)}`} className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-green-600 text-white">
              Download CSV
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {!isSummary && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exporter
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Gold (g)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Silver (g)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estimated Value (USD)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    {!isSummary && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'}</td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                      {r.exporter}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {formatNumber(r.netGoldGrams)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {formatNumber(r.netSilverGrams)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {formatNumber(r.estimatedValue)} USD
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
