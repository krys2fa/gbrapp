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

export default async function ReportsPage() {
  // Fetch latest commodity price (best-effort)
  const dailyPrice = await prisma.dailyPrice.findFirst({
    where: { type: "COMMODITY" },
    orderBy: { createdAt: "desc" },
  });
  const commodityPrice = dailyPrice?.price || 0; // assumed per troy ounce

  // Fetch job cards with exporter and assays/measurements
  const jobCards = await prisma.jobCard.findMany({
    include: { exporter: true, assays: { include: { measurements: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const rows = jobCards.map((jc: any) => {
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
      netGoldGrams,
      netSilverGrams,
      estimatedValue,
    };
  });

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

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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
