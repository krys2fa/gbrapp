"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { ArrowPathIcon, PrinterIcon } from "@heroicons/react/24/outline";
import BackLink from "@/app/components/ui/BackLink";
import { formatDate, formatCurrency } from "@/app/lib/utils";

export default function AssayResultsPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const assayId = (params?.assayId as string) || "";
  const [jobCard, setJobCard] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function printAssayResults() {
    try {
      const content = document.getElementById("assay-content");
      if (!content) {
        alert("Assay content not found to print.");
        return;
      }

      // Clone the content to preserve all styles
      const clonedContent = content.cloneNode(true) as HTMLElement;

      // Collect all stylesheet links and inline styles from the document
      const stylesheets = Array.from(
        document.querySelectorAll('link[rel="stylesheet"], style')
      )
        .map((style) => style.outerHTML)
        .join("\n");

      // Enhanced CSS for proper print styling
      const enhancedStyles = `
        @page { size: A4; margin: 20mm; }
        html, body {
          height: 100%;
          margin: 0;
          padding: 0;
          font-family: 'Times New Roman', serif;
          color: #000;
          line-height: 1.4;
          font-size: 12pt;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        * { box-sizing: border-box; }

        /* Layout and positioning */
        .flex { display: flex; }
        .inline-flex { display: inline-flex; }
        .grid { display: grid; }
        .hidden { display: none; }
        .block { display: block; }
        .items-start { align-items: flex-start; }
        .items-center { align-items: center; }
        .items-end { align-items: flex-end; }
        .justify-start { justify-content: flex-start; }
        .justify-center { justify-content: center; }
        .justify-between { justify-content: space-between; }
        .justify-end { justify-content: flex-end; }
        .flex-1 { flex: 1 1 0%; }
        .whitespace-nowrap { white-space: nowrap; }

        /* Spacing */
        .mb-1 { margin-bottom: 0.25rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .mt-4 { margin-top: 1rem; }
        .my-6 { margin: 1.5rem 0; }
        .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
        .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
        .py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
        .py-8 { padding-top: 2rem; padding-bottom: 2rem; }
        .pb-2 { padding-bottom: 0.5rem; }
        .pb-6 { padding-bottom: 1.5rem; }
        .pt-2 { padding-top: 0.5rem; }
        .pt-4 { padding-top: 1rem; }
        .px-4 { padding-left: 1rem; padding-right: 1rem; }
        .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
        .px-8 { padding-left: 2rem; padding-right: 2rem; }
        .gap-2 { gap: 0.5rem; }
        .gap-3 { gap: 0.75rem; }
        .gap-8 { gap: 2rem; }
        .ml-2 { margin-left: 0.5rem; }

        /* Grid */
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .gap-4 { gap: 1rem; }

        /* Typography */
        .text-xs { font-size: 10pt; line-height: 1.3; }
        .text-sm { font-size: 11pt; line-height: 1.4; }
        .text-lg { font-size: 14pt; line-height: 1.4; }
        .text-xl { font-size: 16pt; line-height: 1.4; }
        .font-medium { font-weight: 500; }
        .font-semibold { font-weight: 600; }
        .font-bold { font-weight: 700; }
        .uppercase { text-transform: uppercase; }
        .underline { text-decoration: underline; }
        .tracking-wider { letter-spacing: 0.05em; }

        /* Colors */
        .text-gray-500 { color: #666666; }
        .text-gray-700 { color: #333333; }
        .text-gray-900 { color: #000000; }
        .text-indigo-600 { color: #000000; }
        .text-indigo-700 { color: #000000; }
        .text-yellow-700 { color: #000000; }
        .bg-gray-50 { background-color: #f9fafb; }
        .bg-gray-200 { background-color: #e5e7eb; }
        .bg-indigo-600 { background-color: #000000; }
        .bg-indigo-700 { background-color: #000000; }
        .bg-yellow-50 { background-color: #ffffff; }
        .bg-yellow-400 { background-color: #000000; }
        .bg-[#d4af37] { background-color: #000000; }

        /* Borders */
        .border { border-width: 1px; }
        .border-t { border-top-width: 1px; }
        .border-b { border-bottom-width: 1px; }
        .border-l-4 { border-left-width: 4px; }
        .border-collapse { border-collapse: collapse; }
        .divide-gray-200 > * + * { border-color: #cccccc; }

        /* Header section */
        .header-section {
          border-bottom: 2px solid #000;
          padding-bottom: 15pt;
          margin-bottom: 20pt;
        }
        .title-section {
          text-align: center;
          font-size: 14pt;
          font-weight: bold;
          margin: 15pt 0;
          text-transform: uppercase;
          letter-spacing: 1pt;
        }

        /* Info section */
        .header-info {
          margin-bottom: 8pt;
          line-height: 1.6;
        }
        .info-label {
          font-weight: bold;
          display: inline-block;
          min-width: 120pt;
        }
        .info-value {
          display: inline-block;
        }

        /* Table styling */
        .min-w-full { min-width: 100%; }
        .divide-y > * + * { border-top-width: 1px; }
        table {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 15pt;
        }
        th, td {
          border: 1px solid #000;
          padding: 6pt;
          text-align: center;
          font-size: 10pt;
        }
        th {
          background-color: #f0f0f0;
          font-weight: bold;
          text-transform: uppercase;
        }

        /* Image styling */
        img {
          max-width: 100%;
          height: auto;
        }
        .h-16 { height: 4rem; }
        .w-16 { width: 4rem; }
        .w-auto { width: auto; }
        .mx-auto { margin-left: auto; margin-right: auto; }

        /* Signature section */
        .signature-section {
          margin-top: 40pt;
          border-top: 1px solid #000;
          padding-top: 20pt;
        }

        /* Print-specific overrides */
        @media print {
          .print\\:hidden { display: none !important; }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .header-section { page-break-after: avoid; }
          .table-section { page-break-inside: avoid; }
          .signature-section { page-break-inside: avoid; }
        }

        /* Hide elements not needed for print */
        .no-print { display: none; }
        .print\\:hidden { display: none; }
      `;

      const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Large Scale Assay Results</title>
  ${stylesheets}
  <style>${enhancedStyles}</style>
</head>
<body>
  <div class="bg-white py-2">
    ${clonedContent.innerHTML}
  </div>
</body>
</html>`;

      const w = window.open("", "_blank");
      if (!w) {
        alert("Please allow popups to print the assay results.");
        return;
      }
      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => {
        try {
          w.print();
        } catch (e) {
          console.error(e);
        }
      }, 500);
    } catch (e) {
      console.error(e);
      alert("Failed to generate assay results for printing.");
    }
  }

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
        const res = await fetch(`/api/large-scale-job-cards/${id}`);
        if (!res.ok) throw new Error("Failed to fetch job card");
        const data = await res.json();
        if (mounted) {
          setJobCard(data);
          console.log("Job Card Details:", data);
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

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center">
          <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin" />
          <span className="ml-2 text-gray-500">Loading assay results...</span>
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
        <div className="mt-4 print:hidden">
          <BackLink
            href={`/job-cards/large-scale/${id}`}
            label="Back to Job Card"
          />
        </div>
      </div>
    );
  }

  if (!jobCard) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-sm text-yellow-700">Job card not found.</p>
        </div>
        <div className="mt-4 print:hidden">
          <BackLink
            href={`/job-cards/large-scale/${id}`}
            label="Back to Job Card"
          />
        </div>
      </div>
    );
  }

  const assay = jobCard?.assays?.find(
    (a: any) => String(a.id) === String(assayId)
  );

  console.log("Assay Details:", assay);
  console.log("Assay ID from URL:", assayId);
  console.log("Available assays:", jobCard?.assays);

  if (!assay) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-sm text-yellow-700">Assay not found.</p>
        </div>
        <div className="mt-4 print:hidden">
          <BackLink
            href={`/job-cards/large-scale/${id}`}
            label="Back to Job Card"
          />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header with Logo and Navigation */}
      <div className="bg-white shadow-sm rounded-t-lg print:hidden">
        <div className="px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="print:hidden">
              <BackLink
                href={`/job-cards/large-scale/${id}`}
                label="Back to Job Card"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => printAssayResults()}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <PrinterIcon className="h-4 w-4 mr-2" />
                Print Results
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Content */}
          <div id="assay-content" className="bg-white shadow-sm">
            {/* Professional Header Section */}
            <div className="header-section">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center">
                  <img
                    src="/goldbod-logo-green.png"
                    alt="GoldBod Logo"
                    className="h-16 w-auto"
                  />
                </div>

                <div className="flex-1 text-center">
                  <div className="title-section font-bold uppercase underline">Ghana Gold Board</div>
                </div>

                <div className="flex items-center">
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

            <div className="title-section uppercase mx-auto text-center font-bold">
              REPORT OF GOLD SAMPLE ANALYSIS FROM LARGE SCALE GOLD MINING
              COMPANIES
            </div>

            {/* Professional Assay Information */}
            <div className="px-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="header-info">
                  <span className="info-label uppercase">Mining company:</span>
                  <span className="info-value font-bold ml-2">
                    {jobCard?.exporter?.name || "N/A"}
                  </span>
                </div>

                <div className="header-info">
                  <span className="info-label uppercase">
                    Number of Samples:
                  </span>
                  <span className="info-value font-bold ml-2">
                    {assay?.measurements?.length || 0}
                  </span>
                </div>

                <div className="header-info">
                  <span className="info-label uppercase">Sample Type:</span>
                  <span className="info-value font-bold ml-2">
                    {assay?.sampleType || "N/A"}
                  </span>
                </div>

                <div className="header-info">
                  <span className="info-label uppercase">
                    Date of Analysis:
                  </span>
                  <span className="info-value font-bold ml-2">
                    {assay?.dateOfAnalysis
                      ? formatDate(assay.dateOfAnalysis)
                      : "N/A"}
                  </span>
                </div>

                <div className="header-info">
                  <span className="info-label uppercase">Shipment Number:</span>
                  <span className="info-value font-bold ml-2">
                    {assay?.shipmentNumber || "N/A"}
                  </span>
                </div>

                <div className="header-info">
                  <span className="info-label uppercase">
                    Data Sheet Dates:
                  </span>
                  <span className="info-value font-bold ml-2">
                    {assay?.dataSheetDates
                      ? formatDate(assay.dataSheetDates)
                      : "N/A"}
                  </span>
                </div>

                <div className="header-info">
                  <span className="info-label uppercase">
                    Sample Bottle Dates:
                  </span>
                  <span className="info-value font-bold ml-2">
                    {assay?.sampleBottleDates
                      ? formatDate(assay.sampleBottleDates)
                      : "N/A"}
                  </span>
                </div>

                <div className="header-info">
                  <span className="info-label uppercase">Number of Bars:</span>
                  <span className="info-value font-bold ml-2">
                    {assay?.numberOfBars || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Assay Measurements Table */}
          <div className="px-4 sm:px-6 lg:px-8 pt-4">
            <div className="bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-center text-xs font-bold uppercase bg-[#d4af37]">
                        SN
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-bold uppercase bg-[#d4af37]">
                        Bar No. NGGL
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-bold uppercase bg-[#d4af37]">
                        Gross Weight ({jobCard?.unitOfMeasure})
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-bold uppercase bg-[#d4af37]">
                        Gold Fineness (%)
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-bold uppercase bg-[#d4af37]">
                        Gold Net Weight ({jobCard?.unitOfMeasure})
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-bold uppercase bg-[#d4af37]">
                        Silver Fineness (%)
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-bold uppercase bg-[#d4af37]">
                        Silver Net Weight ({jobCard?.unitOfMeasure})
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(assay.measurements || []).map((m: any, idx: number) => (
                      <tr key={`${assay.id}-${idx}`}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 text-center">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 text-center">
                          {m.barNumber || "-"}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 text-center">
                          {m.grossWeight != null
                            ? Number(m.grossWeight).toFixed(2)
                            : "-"}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 text-center">
                          {m.goldAssay != null
                            ? Number(m.goldAssay).toFixed(2)
                            : "-"}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 text-center">
                          {m.netGoldWeight != null
                            ? Number(m.netGoldWeight).toFixed(2)
                            : "-"}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 text-center">
                          {m.silverAssay != null
                            ? Number(m.silverAssay).toFixed(2)
                            : "-"}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 text-center">
                          {m.netSilverWeight != null
                            ? Number(m.netSilverWeight).toFixed(2)
                            : "-"}
                        </td>
                      </tr>
                    ))}
                    {/* Total Row */}
                    <tr className="bg-gray-50 font-semibold">
                      <td
                        className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-center"
                        colSpan={2}
                      >
                        TOTAL
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                        {(() => {
                          const total = (assay.measurements || []).reduce(
                            (acc: number, m: any) =>
                              acc + (Number(m.grossWeight) || 0),
                            0
                          );
                          return total > 0 ? total.toFixed(2) : "-";
                        })()}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                        {(() => {
                          const grossTotal = (assay.measurements || []).reduce(
                            (acc: number, m: any) =>
                              acc + (Number(m.grossWeight) || 0),
                            0
                          );
                          const netGoldTotal = (
                            assay.measurements || []
                          ).reduce(
                            (acc: number, m: any) =>
                              acc + (Number(m.netGoldWeight) || 0),
                            0
                          );
                          if (grossTotal > 0 && netGoldTotal > 0) {
                            const fineness = (netGoldTotal / grossTotal) * 100;
                            return fineness.toFixed(2);
                          }
                          return "-";
                        })()}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                        {(() => {
                          const total = (assay.measurements || []).reduce(
                            (acc: number, m: any) =>
                              acc + (Number(m.netGoldWeight) || 0),
                            0
                          );
                          return total > 0 ? total.toFixed(2) : "-";
                        })()}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                        {(() => {
                          const grossTotal = (assay.measurements || []).reduce(
                            (acc: number, m: any) =>
                              acc + (Number(m.grossWeight) || 0),
                            0
                          );
                          const netSilverTotal = (
                            assay.measurements || []
                          ).reduce(
                            (acc: number, m: any) =>
                              acc + (Number(m.netSilverWeight) || 0),
                            0
                          );
                          if (grossTotal > 0 && netSilverTotal > 0) {
                            const fineness =
                              (netSilverTotal / grossTotal) * 100;
                            return fineness.toFixed(2);
                          }
                          return "-";
                        })()}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                        {(() => {
                          const total = (assay.measurements || []).reduce(
                            (acc: number, m: any) =>
                              acc + (Number(m.netSilverWeight) || 0),
                            0
                          );
                          return total > 0 ? total.toFixed(2) : "-";
                        })()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-6 lg:px-8 py-4 mx-auto">
            <div className="space-y-3 mx-auto">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center">
                    <dt className="text-sm font-medium text-gray-500">
                      NET WEIGHT OF GOLD (Oz):
                    </dt>
                    <dd className="text-sm font-semibold text-gray-900">
                      {assay?.totalNetGoldWeightOz.toFixed(3)}
                    </dd>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <dt className="text-sm font-medium text-gray-500">
                      NET WEIGHT OF SILVER (Oz):
                    </dt>
                    <dd className="text-sm font-semibold text-gray-900">
                      {assay?.totalNetSilverWeightOz.toFixed(3)}
                    </dd>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-end">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <dt className="text-sm font-medium text-gray-500 uppercase">
                      Unit price per ounce:
                    </dt>
                    <dd className="text-sm font-semibold text-gray-900">
                      {(() => {
                        const pricePerOz = assay?.commodityPrice || 0;
                        return formatCurrency(pricePerOz, "USD");
                      })()}
                    </dd>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <dt className="text-sm font-medium text-gray-500 uppercase">
                      Unit price per ounce:
                    </dt>
                    <dd className="text-sm font-semibold text-gray-900">
                      {(() => {
                        const pricePerOz = assay?.pricePerOz || 0;
                        return formatCurrency(pricePerOz, "USD");
                      })()}
                    </dd>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <dt className="text-sm font-medium text-gray-500">
                      VALUE OF GOLD (US$):
                    </dt>
                    <dd className="text-sm font-semibold text-gray-900">
                      {formatCurrency(assay?.totalGoldValue, "USD")}
                    </dd>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <dt className="text-sm font-medium text-gray-500">
                      VALUE OF SILVER (US$):
                    </dt>
                    <dd className="text-sm font-semibold text-gray-900">
                      {formatCurrency(assay?.totalSilverValue, "USD")}
                    </dd>
                  </div>
                </div>
              </div>

              <div className="flex mt-4 pt-4">
                <div className="flex justify-between items-center">
                  <dt className="text-sm font-medium text-gray-900">
                    PREVAILING BOG EXCHANGE RATE:
                  </dt>
                  <dd className="text-sm font-semibold text-gray-900 ml-1">
                    {Number(assay?.exchangeRate).toFixed(4)}
                  </dd>
                </div>
              </div>

              <div className="flex mb-4">
                <div className="text-center justify-between flex">
                  <dt className="text-sm font-medium text-gray-900">
                    TOTAL VALUE OF SHIPMENT (GOLD & SILVER):
                  </dt>
                  <dd className="text-sm font-semibold text-gray-900 ml-1">
                    {formatCurrency(assay?.totalValueGhs, "USD")}
                  </dd>
                </div>
              </div>

              <div className="flex">
                <div className="text-center justify-between flex">
                  <dt className="text-sm font-medium text-gray-900">
                    TOTAL VALUE OF SHIPMENT (GOLD & SILVER):
                  </dt>
                  <dd className="text-sm font-semibold text-gray-900 ml-1">
                    {formatCurrency(assay?.totalCombinedValue, "GHS")}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Director Signature Section */}
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-start">
              <div className="border-t border-gray-300 pt-4 w-64">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 mb-2 uppercase">
                    Technical Director
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
