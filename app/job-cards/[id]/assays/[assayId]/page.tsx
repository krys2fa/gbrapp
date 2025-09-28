"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BackLink from "@/app/components/ui/BackLink";
import AssayDetailActions from "./AssayDetailActions";
import { formatDate, formatCurrency } from "@/app/lib/utils";

export default function AssayDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const assayId = (params?.assayId as string) || "";
  const router = useRouter();

  const [jobCard, setJobCard] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commodityPrice, setCommodityPrice] = useState<number | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [totalUsd, setTotalUsd] = useState<number | null>(null);
  const [totalGhs, setTotalGhs] = useState<number | null>(null);

  // helper: normalize common units to grams
  function convertToGrams(v: any, unit?: string) {
    const value = Number(v) || 0;
    if (!value) return 0;
    const u = (unit || "g").toString().toLowerCase();
    if (u === "kg" || u === "kilogram" || u === "kilograms")
      return value * 1000;
    if (u === "g" || u === "gram" || u === "grams") return value;
    if (u === "lb" || u === "lbs" || u === "pound" || u === "pounds")
      return value * 453.59237;
    // default: treat as grams
    return value;
  }

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/job-cards/${id}`);
        if (!res.ok) throw new Error("Failed to fetch job card");
        const data = await res.json();
        if (mounted) setJobCard(data);

        console.log(data);

        // fetch commodity price for this job card's commodity if present
        if (data?.commodityId) {
          // Use stored commodity price from assay if available
          const assay = data?.assays?.find(
            (a: any) => String(a.id) === String(assayId)
          );
          if (assay?.commodityPrice != null) {
            setCommodityPrice(Number(assay.commodityPrice));
          } else {
            try {
              const cpRes = await fetch(
                `/api/daily-prices?type=COMMODITY&itemId=${data.commodityId}`
              );
              if (cpRes.ok) {
                const cpBody = await cpRes.json().catch(() => []);
                const latest =
                  Array.isArray(cpBody) && cpBody.length
                    ? cpBody
                        .slice()
                        .sort(
                          (a: any, b: any) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime()
                        )[0]
                    : null;
                if (mounted && latest) setCommodityPrice(Number(latest.price));
              }
            } catch (e) {
              // ignore
            }
          }
        }

        // fetch latest exchange rates
        try {
          const exRes = await fetch(`/api/daily-prices?type=EXCHANGE`);
          if (exRes.ok) {
            const exBody = await exRes.json().catch(() => []);
            const latestEx =
              Array.isArray(exBody) && exBody.length
                ? exBody
                    .slice()
                    .sort(
                      (a: any, b: any) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    )[0]
                : null;
            if (mounted && latestEx) setExchangeRate(Number(latestEx.price));
          }
        } catch (e) {
          // ignore
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load data");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  // Compute totals whenever assay, commodityPrice or exchangeRate change
  useEffect(() => {
    if (!jobCard) return;
    const assay = jobCard?.assays?.find(
      (a: any) => String(a.id) === String(assayId)
    );
    if (!assay) return;

    // Use stored values from database if available, otherwise calculate
    if (assay.totalUsdValue != null) {
      setTotalUsd(assay.totalUsdValue);
    } else {
      // Fallback calculation if stored value not available
      const measuredSum = (assay.measurements || []).reduce(
        (acc: number, m: any) =>
          acc +
          convertToGrams(
            m.netWeight,
            m?.unitOfMeasure ?? jobCard?.unitOfMeasure
          ),
        0
      );
      const netWeightGrams = measuredSum;
      const GRAMS_PER_TROY_OUNCE = 31.1035;
      if (commodityPrice != null && netWeightGrams > 0) {
        const ounces = netWeightGrams / GRAMS_PER_TROY_OUNCE;
        const usd = ounces * commodityPrice;
        setTotalUsd(usd);
      }
    }

    // Use stored GHS value if available
    if (assay.totalGhsValue != null) {
      setTotalGhs(assay.totalGhsValue);
    } else if (exchangeRate != null && totalUsd != null) {
      setTotalGhs(totalUsd * exchangeRate);
    }
  }, [jobCard, assayId, commodityPrice, exchangeRate, totalUsd]);

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          {/* <span className="ml-2 text-gray-500">Loading assay...</span> */}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
        <div className="mt-4">
          <button
            className="px-3 py-1 bg-gray-100 rounded"
            onClick={() => router.back()}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  const assay = jobCard?.assays?.find(
    (a: any) => String(a.id) === String(assayId)
  );

  if (!assay) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-sm text-yellow-700">Assay not found.</p>
        </div>
        <div className="mt-4">
          <BackLink href={`/job-cards/${id}`} label="Back to Job Card" />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Comprehensive Print Styles - Match Web Page Exactly */}
      <style jsx>{`
        @media print {
          /* Force color printing */
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Page setup */
          @page {
            margin: 0.5in;
          }

          /* Hide screen-only elements */
          .print\\:hidden {
            display: none !important;
          }

          /* Main container */
          .px-4.sm\\:px-6.lg\\:px-8.py-8 {
            padding: 0 !important;
          }

          /* Main content container */
          #assay-detail-content {
            background: white !important;
            overflow: visible !important;
          }

          /* Header section with logo, title, and QR code */
          .flex.items-center.justify-between.mb-1.px-8 {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            margin-bottom: 0.25rem !important;
            padding-left: 2rem !important;
            padding-right: 2rem !important;
          }

          /* Logo */
          img[alt="GoldBod Logo"] {
            height: 3rem !important;
            width: auto !important;
          }

          /* Title section */
          .title-section {
            text-transform: uppercase !important;
            margin-left: auto !important;
            margin-right: auto !important;
            text-align: center !important;
          }

          .title-section p:first-child {
            font-weight: bold !important;
            font-size: 1.5rem !important;
            line-height: 2rem !important;
          }

          .title-section p:last-child {
            font-size: 0.875rem !important;
            line-height: 1.25rem !important;
          }

          /* QR Code */
          img[alt*="QR Code"] {
            width: 4rem !important;
            height: 4rem !important;
          }

          /* Content padding */
          .px-4.py-3.sm\\:p-4 {
            padding: 1rem !important;
          }

          /* Top info rows */
          .flex.items-center.justify-between.mb-4 {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            margin-bottom: 1rem !important;
          }

          /* Labels and values */
          .text-sm.font-medium.text-gray-500 {
            font-size: 0.875rem !important;
            line-height: 1.25rem !important;
            font-weight: 500 !important;
            color: #6b7280 !important;
          }

          .text-sm.font-semibold.text-gray-900 {
            font-size: 0.875rem !important;
            line-height: 1.25rem !important;
            font-weight: 600 !important;
            color: #111827 !important;
          }

          /* Grid layout */
          .grid.grid-cols-1.sm\\:grid-cols-2.gap-6 {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 1.5rem !important;
          }

          /* Table containers */
          .bg-white.overflow-hidden {
            background-color: white !important;
            overflow: visible !important;
          }

          /* Table headers */
          .px-4.py-2.bg-gray-50 {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
            padding-top: 0.5rem !important;
            padding-bottom: 0.5rem !important;
            background-color: #f9fafb !important;
          }

          .text-sm.font-medium.text-gray-900 {
            font-size: 0.875rem !important;
            line-height: 1.25rem !important;
            font-weight: 500 !important;
            color: #111827 !important;
          }

          /* Tables */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }

          .border.border-gray-300 {
            border: 1px solid #d1d5db !important;
          }

          /* Table headers */
          thead {
            background-color: #d4af37 !important;
          }

          th {
            padding: 0.5rem 1rem !important;
            text-align: right !important;
            font-size: 0.75rem !important;
            line-height: 1rem !important;
            font-weight: 500 !important;
            color: #6b7280 !important;
            text-transform: uppercase !important;
            border: 1px solid #d1d5db !important;
          }

          /* Table cells */
          td {
            padding: 0.5rem 1rem !important;
            font-size: 0.875rem !important;
            line-height: 1.25rem !important;
            color: #374151 !important;
            border: 1px solid #d1d5db !important;
            text-align: right !important;
          }

          /* Total row styling */
          .bg-gray-50.font-semibold td {
            background-color: #f9fafb !important;
            font-weight: 600 !important;
            color: #111827 !important;
          }

          /* Summary boxes */
          .bg-gray-50.rounded-lg.p-4 {
            background-color: #f9fafb !important;
            border-radius: 0.5rem !important;
            padding: 1rem !important;
          }

          .bg-blue-50.rounded-lg.p-4 {
            background-color: #eff6ff !important;
            border-radius: 0.5rem !important;
            padding: 1rem !important;
          }

          /* Summary headers */
          .text-sm.font-medium.text-gray-900.mb-3 {
            font-size: 0.875rem !important;
            line-height: 1.25rem !important;
            font-weight: 500 !important;
            color: #111827 !important;
            margin-bottom: 0.75rem !important;
          }

          /* Summary content spacing */
          .space-y-3 > * + * {
            margin-top: 0.75rem !important;
          }

          .flex.items-center.gap-2 {
            display: flex !important;
            align-items: center !important;
            gap: 0.5rem !important;
          }

          /* Bottom section */
          .mt-4.border-t.pt-4 {
            margin-top: 1rem !important;
            border-top: 1px solid #e5e7eb !important;
            padding-top: 1rem !important;
          }

          /* Seal numbers grid */
          .grid.grid-cols-1.sm\\:grid-cols-4.gap-4 {
            display: grid !important;
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
            gap: 1rem !important;
          }

          /* Small text for seal numbers */
          .text-xs.font-medium.text-gray-500.text-center {
            font-size: 0.75rem !important;
            line-height: 1rem !important;
            font-weight: 500 !important;
            color: #6b7280 !important;
            text-align: center !important;
          }

          .text-xs.text-gray-900.text-center {
            font-size: 0.75rem !important;
            line-height: 1rem !important;
            color: #111827 !important;
            text-align: center !important;
          }

          /* Signatures section */
          .mt-24 {
            margin-top: 6rem !important;
          }

          /* Signature lines */
          .border-b.border-gray-400.mb-2.pt-4 {
            border-bottom: 1px solid #9ca3af !important;
            margin-bottom: 0.5rem !important;
            padding-top: 1rem !important;
          }

          /* Signature labels */
          .flex.flex-col.gap-1 {
            display: flex !important;
            flex-direction: column !important;
            gap: 0.25rem !important;
          }

          /* Ensure proper page breaks */
          .page-break-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Force backgrounds and colors to print */
          .bg-gray-50,
          .bg-blue-50,
          .bg-white {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Completely remove all watermarks and backgrounds */
          img[alt="Seal"],
          img[src="/seal.png"],
          .print\\:hidden {
            display: none !important;
            visibility: hidden !important;
          }

          /* OVERRIDE GLOBAL WATERMARK CSS - Remove all watermarks completely */
          html,
          body {
            background: white !important;
            background-image: none !important;
            background-attachment: initial !important;
          }

          /* Remove global body watermark pseudo-elements */
          body::before,
          body::after {
            content: none !important;
            display: none !important;
            background: none !important;
            background-image: none !important;
          }

          /* Override watermark-container styles */
          .watermark-container::before,
          .watermark-container::after {
            content: none !important;
            display: none !important;
            background: none !important;
            background-image: none !important;
          }

          /* Remove all pseudo-element watermarks */
          *::before,
          *::after {
            content: none !important;
            display: none !important;
            background: none !important;
            background-image: none !important;
          }

          /* Override any container backgrounds */
          #__next,
          .page-container,
          .main-content,
          #assay-detail-content {
            background: white !important;
            background-image: none !important;
          }

          /* Ensure content backgrounds are solid white */
          .bg-white,
          .bg-gray-50,
          .bg-blue-50 {
            background-image: none !important;
            background-color: white !important;
          }

          .bg-gray-50 {
            background-color: #f9fafb !important;
          }

          .bg-blue-50 {
            background-color: #eff6ff !important;
          }
        }
      `}</style>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <BackLink href={`/job-cards/${id}`} label="Back to Job Card" />
          <div className="flex items-center gap-3">
            <AssayDetailActions
              jobCardId={id}
              assayId={assayId}
              // signatoryName="Dr. John Smith"
              // signatoryPosition="Chief Assayer"
            />
          </div>
        </div>

        <div id="assay-detail-content" className="bg-white overflow-hidden">
          <div className="flex items-center justify-between mb-1 py-2">
            <div className="py-2 justify-start">
              <img
                src="/goldbod-logo-black.png"
                alt="GoldBod Logo"
                className="h-12 w-auto"
              />
            </div>

            <div className="flex justify-center">
              <div className="title-section uppercase mx-auto text-center">
                <p className="font-bold text-2xl">ASSAY REPORT ANALYSIS</p>
                <p className="text-sm">SMALL SCALE OPERATIONS</p>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="mr-4">
              <div className="flex justify-end">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(
                    "https://goldbod.gov.gh/"
                  )}`}
                  alt="QR Code - Visit GoldBod Website"
                  className="w-16 h-16"
                />
              </div>
            </div>
          </div>

          <div className="px-4 py-3 sm:p-4">
            {/* Top: show exporter and assay date above the measurements table */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex">
                <dt className="text-sm font-medium text-gray-500">Exporter:</dt>
                <dd className="ml-1 text-sm font-semibold text-gray-900">
                  {jobCard?.exporter?.name && jobCard?.exporter?.exporterCode
                    ? `${jobCard.exporter.name}`
                    : jobCard?.exporter?.name || "N/A"}
                </dd>
              </div>
              <div className="text-right flex">
                <dt className="text-sm font-medium text-gray-500">
                  Assay Date:
                </dt>
                <dd className="ml-1 text-sm font-semibold text-gray-900">
                  {assay.assayDate
                    ? formatDate(new Date(assay.assayDate))
                    : formatDate(new Date(assay.createdAt || Date.now()))}
                </dd>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex">
                <dt className="text-sm font-medium text-gray-500">
                  Destination:
                </dt>
                <dd className="ml-1 text-sm font-semibold text-gray-900">
                  {jobCard?.destinationCountry || "-"}
                </dd>
              </div>

              <div className="flex">
                <dt className="text-sm font-medium text-gray-500">
                  Shipment Type:
                </dt>
                <dd className="ml-1 text-sm font-semibold text-gray-900">
                  {assay?.shipmentType?.name || "-"}
                </dd>
              </div>
            </div>

            <div className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Exporter Values (top left) */}
                <div className="bg-white overflow-hidden">
                  <div className="px-4 py-2 bg-gray-50">
                    <h4 className="text-sm font-medium text-gray-900">
                      EXPORTER VALUES
                    </h4>
                  </div>
                  <div>
                    <table className="w-full divide-y divide-gray-200 border border-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase bg-[#d4af37] border border-gray-300">
                            Gross Weight ({jobCard?.unitOfMeasure || "g"})
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase bg-[#d4af37] border border-gray-300">
                            Fineness (%)
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase bg-[#d4af37] border border-gray-300">
                            Net Weight ({jobCard?.unitOfMeasure || "g"})
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-4 py-2 text-sm text-right text-gray-700 border border-gray-300">
                            {jobCard?.totalGrossWeight != null
                              ? Number(jobCard.totalGrossWeight).toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )
                              : assay.jbGrossWeight != null
                              ? Number(assay.jbGrossWeight).toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )
                              : "-"}
                          </td>
                          <td className="px-4 py-2 text-sm text-right text-gray-700 border border-gray-300">
                            {jobCard?.fineness != null
                              ? Number(jobCard.fineness).toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )
                              : assay.jbFineness != null
                              ? Number(assay.jbFineness).toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )
                              : "-"}
                          </td>
                          <td className="px-4 py-2 text-sm text-right text-gray-700 border border-gray-300">
                            {jobCard?.totalNetWeight != null
                              ? Number(jobCard.totalNetWeight).toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )
                              : assay.jbNetWeight != null
                              ? Number(assay.jbNetWeight).toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )
                              : "-"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* GoldBod Values (top right) */}
                <div className="bg-white overflow-hidden">
                  <div className="px-4 py-2 bg-gray-50">
                    <h4 className="text-sm font-medium text-gray-900">
                      GOLDBOD VALUES
                    </h4>
                  </div>
                  <div>
                    <table className="w-full divide-y divide-gray-200 border border-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase bg-[#d4af37] border border-gray-300">
                            Gross Weight ({jobCard?.unitOfMeasure || "g"})
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase bg-[#d4af37] border border-gray-300">
                            Fineness (%)
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase bg-[#d4af37] border border-gray-300">
                            Net Weight ({jobCard?.unitOfMeasure || "g"})
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(assay.measurements || []).map(
                          (m: any, idx: number) => (
                            <tr key={m.id || idx}>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700 border border-gray-300">
                                {m.grossWeight != null
                                  ? Number(m.grossWeight).toFixed(2)
                                  : "-"}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700 border border-gray-300">
                                {m.fineness ?? "-"}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700 border border-gray-300">
                                {m.netWeight != null
                                  ? Number(m.netWeight).toFixed(2)
                                  : "-"}
                              </td>
                            </tr>
                          )
                        )}
                        {/* Total Row */}
                        <tr className="bg-gray-50 font-semibold">
                          <td className="px-4 py-2 whitespace-nowrap text-right text-sm text-gray-900 border border-gray-300">
                            {(() => {
                              const total = (assay.measurements || []).reduce(
                                (acc: number, m: any) =>
                                  acc + (Number(m.grossWeight) || 0),
                                0
                              );
                              return total > 0
                                ? total.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })
                                : "-";
                            })()}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-right text-sm text-gray-900 border border-gray-300">
                            {(() => {
                              const grossTotal = (
                                assay.measurements || []
                              ).reduce(
                                (acc: number, m: any) =>
                                  acc + (Number(m.grossWeight) || 0),
                                0
                              );
                              const netTotal = (
                                assay.measurements || []
                              ).reduce(
                                (acc: number, m: any) =>
                                  acc + (Number(m.netWeight) || 0),
                                0
                              );
                              if (grossTotal > 0 && netTotal > 0) {
                                const fineness = (netTotal / grossTotal) * 100;
                                return fineness.toFixed(2) + "%";
                              }
                              return "-";
                            })()}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-right text-sm text-gray-900 border border-gray-300">
                            {(() => {
                              const total = (assay.measurements || []).reduce(
                                (acc: number, m: any) =>
                                  acc + (Number(m.netWeight) || 0),
                                0
                              );
                              return total > 0
                                ? total.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })
                                : "-";
                            })()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Exporter Summary (bottom left) */}
                <div className="bg-gray-50 rounded-lg px-4">
                  <h5 className="text-sm font-bold text-gray-900">
                    Exporter Valuation Summary
                  </h5>
                  <div>
                    <div>
                      <div className="flex items-center gap-2">
                        <dt className="text-sm font-medium text-gray-500">
                          Weight in Ounces:
                        </dt>
                        <dd className="text-sm font-semibold text-gray-900">
                          {jobCard?.numberOfOunces != null
                            ? Number(jobCard.numberOfOunces).toLocaleString(
                                undefined,
                                {
                                  minimumFractionDigits: 3,
                                  maximumFractionDigits: 3,
                                }
                              )
                            : assay.jbWeightInOz != null
                            ? Number(assay.jbWeightInOz).toLocaleString(
                                undefined,
                                {
                                  minimumFractionDigits: 3,
                                  maximumFractionDigits: 3,
                                }
                              )
                            : "0.000"}{" "}
                          oz
                        </dd>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <dt className="text-sm font-medium text-gray-500">
                          Price per Ounce:
                        </dt>
                        <dd className="text-sm font-semibold text-gray-900">
                          {jobCard?.pricePerOunce != null
                            ? formatCurrency(jobCard.pricePerOunce, "USD")
                            : assay.jbPricePerOz != null
                            ? formatCurrency(assay.jbPricePerOz, "USD")
                            : formatCurrency(0, "USD")}
                        </dd>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <dt className="text-sm font-medium text-gray-500">
                          Total USD Value:
                        </dt>
                        <dd className="text-sm font-semibold text-gray-900">
                          {jobCard?.valueUsd != null
                            ? formatCurrency(jobCard.valueUsd, "USD")
                            : assay.jbTotalUsdValue != null
                            ? formatCurrency(assay.jbTotalUsdValue, "USD")
                            : formatCurrency(0, "USD")}
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>

                {/* GoldBod Valuation Summary (bottom right) */}
                <div className="bg-blue-50 rounded-lg px-4">
                  <h5 className="text-sm font-bold text-gray-900">
                    GOLDBOD Valuation Summary
                  </h5>
                  <div>
                    <div>
                      <div className="flex items-center gap-2">
                        <dt className="text-sm font-medium text-gray-500">
                          Weight in Ounces:
                        </dt>
                        <dd className="text-sm font-semibold text-gray-900">
                          {assay.weightInOz != null
                            ? Number(assay.weightInOz).toLocaleString(
                                undefined,
                                {
                                  minimumFractionDigits: 3,
                                  maximumFractionDigits: 3,
                                }
                              )
                            : (() => {
                                const totalGrams = (
                                  assay.measurements || []
                                ).reduce(
                                  (acc: number, m: any) =>
                                    acc +
                                    convertToGrams(
                                      m.netWeight,
                                      m?.unitOfMeasure ?? jobCard?.unitOfMeasure
                                    ),
                                  0
                                );
                                const GRAMS_PER_TROY_OUNCE = 31.1035;
                                const oz = totalGrams / GRAMS_PER_TROY_OUNCE;
                                return totalGrams > 0
                                  ? oz.toLocaleString(undefined, {
                                      minimumFractionDigits: 3,
                                      maximumFractionDigits: 3,
                                    })
                                  : "0.000";
                              })()}{" "}
                          oz
                        </dd>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <dt className="text-sm font-medium text-gray-500">
                          Price per Ounce:
                        </dt>
                        <dd className="text-sm font-semibold text-gray-900">
                          {assay.pricePerOz != null
                            ? formatCurrency(assay.pricePerOz, "USD")
                            : assay.comments &&
                              typeof assay.comments === "string"
                            ? (() => {
                                try {
                                  const parsed = JSON.parse(
                                    assay.comments || "{}"
                                  );
                                  const mp = parsed?.meta?.dailyPrice;
                                  return mp != null
                                    ? formatCurrency(mp, "USD")
                                    : commodityPrice != null
                                    ? formatCurrency(commodityPrice, "USD")
                                    : formatCurrency(0, "USD");
                                } catch {
                                  return commodityPrice != null
                                    ? formatCurrency(commodityPrice, "USD")
                                    : formatCurrency(0, "USD");
                                }
                              })()
                            : assay.comments?.meta?.dailyPrice != null
                            ? formatCurrency(
                                assay.comments.meta.dailyPrice,
                                "USD"
                              )
                            : commodityPrice != null
                            ? formatCurrency(commodityPrice, "USD")
                            : formatCurrency(0, "USD")}
                        </dd>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <dt className="text-sm font-medium text-gray-500">
                          Total USD Value:
                        </dt>
                        <dd className="text-sm font-semibold text-gray-900">
                          {assay.totalUsdValue != null
                            ? formatCurrency(assay.totalUsdValue, "USD")
                            : assay.comments &&
                              typeof assay.comments === "string"
                            ? (() => {
                                try {
                                  const parsed = JSON.parse(
                                    assay.comments || "{}"
                                  );
                                  const v = parsed?.meta?.valueUsd;
                                  return v != null
                                    ? formatCurrency(v, "USD")
                                    : totalUsd != null
                                    ? formatCurrency(totalUsd, "USD")
                                    : formatCurrency(0, "USD");
                                } catch {
                                  return totalUsd != null
                                    ? formatCurrency(totalUsd, "USD")
                                    : formatCurrency(0, "USD");
                                }
                              })()
                            : assay.comments?.meta?.valueUsd != null
                            ? formatCurrency(
                                assay.comments.meta.valueUsd,
                                "USD"
                              )
                            : totalUsd != null
                            ? formatCurrency(totalUsd, "USD")
                            : formatCurrency(0, "USD")}
                        </dd>
                      </div>
                    </div>

                    {/* <div>
                    <div className="flex items-center gap-2">
                      <dt className="text-sm font-medium text-gray-500">
                        Total GHS Value:
                      </dt>
                      <dd className="text-sm font-semibold text-gray-900">
                        {assay.totalGhsValue != null
                          ? formatCurrency(assay.totalGhsValue, "GHS")
                          : totalGhs != null
                          ? formatCurrency(totalGhs, "GHS")
                          : formatCurrency(0, "GHS")}
                      </dd>
                    </div>
                  </div> */}
                  </div>
                </div>
              </div>
            </div>

            {/* Assay details moved to bottom with labels */}
            <div className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <dt className="text-xs font-medium text-gray-500 text-center">
                      Security Seal No.:
                    </dt>
                    <dd className="text-xs text-gray-900 text-center font-bold">
                      {assay.securitySealNo || "-"}
                    </dd>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <dt className="text-xs font-medium text-gray-500 text-center">
                      GOLDBOD Seal No.:
                    </dt>
                    <dd className="text-xs text-gray-900 text-center font-bold">
                      {assay.goldbodSealNo || "-"}
                    </dd>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <dt className="text-xs font-medium text-gray-500 text-center">
                      Customs Seal No.:
                    </dt>
                    <dd className="text-xs text-gray-900 text-center font-bold">
                      {assay.customsSealNo || "-"}
                    </dd>
                  </div>
                </div>
              </div>

              {/* Signatories */}
              <div className="mt-16 grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <div className="border-b border-gray-400 mb-2 pt-4"></div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-medium text-gray-500 text-center">
                      Exporter Authorized Signatory
                    </dt>
                    <dd className="text-xs text-gray-900 text-center uppercase font-bold">
                      {jobCard?.teamLeader ||
                        jobCard?.assays[0].exporterSignatory ||
                        jobCard?.exporter?.authorizedSignatory ||
                        jobCard?.exporter?.contactPerson ||
                        "-"}
                    </dd>
                  </div>
                </div>

                <div>
                  <div className="border-b border-gray-400 mb-2 pt-4"></div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-medium text-gray-500 text-center">
                      Customs Officer
                    </dt>
                    <dd className="text-xs text-gray-900 text-center uppercase font-bold">
                      {(() => {
                        // First priority: Check dedicated customs officer name field
                        if (jobCard?.customsOfficerName) {
                          return jobCard.customsOfficerName;
                        }

                        // Second priority: Try to parse assay comments as JSON for assay-specific officer
                        if (assay?.comments) {
                          try {
                            const parsed =
                              typeof assay.comments === "string"
                                ? JSON.parse(assay.comments)
                                : assay.comments;
                            if (parsed?.customsOfficer) {
                              return parsed.customsOfficer;
                            }
                          } catch (e) {
                            // If parsing fails, ignore and continue to fallback
                          }
                        }

                        // Third priority: Check job card notes for "Customs Officer: [name]" pattern
                        if (jobCard?.notes) {
                          const match = jobCard.notes.match(
                            /Customs Officer:\s*([^\n;]+)/i
                          );
                          if (match && match[1]) {
                            return match[1].trim();
                          }
                        }

                        // Fallback to job card customs officer relation
                        return jobCard?.customsOfficer?.name || "-";
                      })()}
                    </dd>
                  </div>
                </div>

                <div>
                  <div className="border-b border-gray-400 mb-2 pt-4"></div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-medium text-gray-500 text-center">
                      Technical Director
                    </dt>
                    <dd className="text-xs text-gray-900 text-center uppercase font-bold">
                      {(() => {
                        // First priority: Check dedicated technical director name field
                        if (jobCard?.technicalDirectorName) {
                          return jobCard.technicalDirectorName;
                        }

                        // Second priority: Try to parse assay comments as JSON for assay-specific director
                        if (assay?.comments) {
                          try {
                            const parsed =
                              typeof assay.comments === "string"
                                ? JSON.parse(assay.comments)
                                : assay.comments;
                            if (parsed?.technicalDirector) {
                              return parsed.technicalDirector;
                            }
                          } catch (e) {
                            // If parsing fails, ignore and continue to fallback
                          }
                        }

                        // Third priority: Check job card notes for "Technical Director: [name]" pattern
                        if (jobCard?.notes) {
                          const match = jobCard.notes.match(
                            /Technical Director:\s*([^\n;]+)/i
                          );
                          if (match && match[1]) {
                            return match[1].trim();
                          }
                        }

                        // Fallback to job card technical director relation
                        return jobCard?.technicalDirector?.name || "-";
                      })()}
                    </dd>
                  </div>
                </div>

                <div>
                  <div className="border-b border-gray-400 mb-2 pt-4"></div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-medium text-gray-500 text-center">
                      Assay Officer
                    </dt>
                    <dd className="text-xs text-gray-900 text-center uppercase font-bold">
                      {(() => {
                        // First priority: Check assay comments for the actual user who performed the assay
                        if (assay?.comments) {
                          try {
                            const parsed =
                              typeof assay.comments === "string"
                                ? JSON.parse(assay.comments)
                                : assay.comments;
                            if (parsed?.signatory) {
                              return parsed.signatory;
                            }
                            if (parsed?.assayedBy) {
                              return parsed.assayedBy;
                            }
                          } catch (e) {
                            // If parsing fails, ignore and continue to fallback
                          }
                        }

                        // Second priority: Check direct signatory field
                        if (assay?.signatory) {
                          return assay.signatory;
                        }

                        // Third priority: Check job card assay officer relation
                        if (jobCard?.assayOfficer?.name) {
                          return jobCard.assayOfficer.name;
                        }

                        // Fourth priority: Check assay officer relation from assay
                        if (assay?.assayOfficer?.name) {
                          return assay.assayOfficer.name;
                        }

                        return "-";
                      })()}
                    </dd>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 flex justify-end print:hidden">
                <img src="/seal.png" alt="Seal" className="h-20 w-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
