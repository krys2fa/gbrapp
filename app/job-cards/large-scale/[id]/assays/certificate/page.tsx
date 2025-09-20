"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BackLink from "@/app/components/ui/BackLink";
import { formatDate } from "@/app/lib/utils";

export default function CertificateOfAssayPage() {
  const params = useParams();
  const id = (params?.id as string) || "";

  const [jobCard, setJobCard] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function printCertificate() {
    try {
      const content = document.getElementById("assay-content");
      if (!content) {
        alert("Certificate content not found to print.");
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

      // Enhanced CSS for proper print styling - exact match to web page
      const enhancedStyles = `
        @page { size: A4; margin: 15mm; }
        html, body {
          height: 100%;
          margin: 0;
          padding: 0;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          color: #000;
          line-height: 1.5;
          font-size: 12pt;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        * { box-sizing: border-box; }
        
        /* Layout and positioning - exact web page matching */
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
        .bg-white { background-color: #ffffff; }
        .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
        .mx-auto { margin-left: auto; margin-right: auto; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .uppercase { text-transform: uppercase; }

        /* Spacing - exact web page matching */
        .p-4 { padding: 1rem; }
        .px-4 { padding-left: 1rem; padding-right: 1rem; }
        .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
        .px-8 { padding-left: 2rem; padding-right: 2rem; }
        .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
        .py-8 { padding-top: 2rem; padding-bottom: 2rem; }
        .pt-4 { padding-top: 1rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mr-2 { margin-right: 0.5rem; }
        .gap-4 { gap: 1rem; }
        .mt-8 { margin-top: 2rem; }

        /* Grid system - exact web page matching */
        .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        
        /* Spacing utilities */
        .space-x-12 > * + * { margin-left: 3rem; }
        .py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
        .py-8 { padding-top: 2rem; padding-bottom: 2rem; }
        .pt-4 { padding-top: 1rem; }
        .w-64 { width: 16rem; }

        /* Typography - exact web page matching */
        .text-xs { font-size: 0.75rem; line-height: 1rem; }
        .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
        .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
        .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
        .text-2xl { font-size: 1.5rem; line-height: 2rem; }
        .font-medium { font-weight: 500; }
        .font-semibold { font-weight: 600; }
        .font-bold { font-weight: 700; }

        /* Colors - exact web page matching */
        .text-gray-500 { color: #6b7280; }
        .text-gray-700 { color: #374151; }
        .text-gray-900 { color: #111827; }
        .bg-gray-50 { background-color: #f9fafb; }
        .bg-gray-200 { background-color: #e5e7eb; }
        .border-gray-200 { border-color: #e5e7eb; }
        .border-gray-300 { border-color: #d1d5db; }
        .border-gray-400 { border-color: #9ca3af; }
        .divide-gray-200 > * + * { border-top: 1px solid #e5e7eb; }

        /* Borders - exact web page matching */
        .border { border-width: 1px; }
        .border-b { border-bottom-width: 1px; }
        .border-t { border-top-width: 1px; }

        /* Table styling - exact web page matching */
        .min-w-full { min-width: 100%; }
        .overflow-x-auto { overflow-x: auto; }
        .overflow-hidden { overflow: hidden; }
        .divide-y { border-collapse: separate; }
        table {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 1rem;
        }
        th, td {
          border: 1px solid #d1d5db;
          padding: 0.5rem 1rem;
          text-align: center;
          font-size: 0.75rem;
        }
        th {
          background-color: #d4af37;
          font-weight: bold;
          text-transform: uppercase;
          color: #000;
        }
        .bg-\\[\\#d4af37\\] { background-color: #d4af37; }
        tbody tr:nth-child(even) td {
          background-color: #f9fafb;
        }
        tbody tr.bg-gray-50 td {
          background-color: #f9fafb;
          font-weight: 600;
        }

        /* Image styling */
        img {
          max-width: 100%;
          height: auto;
        }
        .h-12 { height: 3rem; }
        .h-24 { height: 6rem; }
        .w-24 { width: 6rem; }
        .w-auto { width: auto; }
        .w-32 { width: 8rem; }
        
        /* QR Code specific styling - same size as web view */
        img[alt*="QR Code"] {
          width: 6rem !important;
          height: 6rem !important;
          object-fit: contain !important;
        }
        
        /* Seal specific styling - maintain aspect ratio */
        img[alt*="Official Seal"] {
          width: auto !important;
          height: 4rem !important;
          max-width: 8rem !important;
          object-fit: contain !important;
        }

        /* Title section styling */
        .title-section {
          margin: 0 auto;
          text-align: center;
        }

        /* Financial section styling */
        .space-y-3 > * + * { margin-top: 0.75rem; }

        /* Signature section */
        .justify-center { justify-content: center; }

        /* Hide elements not needed for print */
        .print\\:hidden { display: none !important; }
        
        /* Remove any potential watermarks */
        body { background: none !important; }
        body::before { display: none !important; }
        #assay-content::before { display: none !important; }
        
        /* Ensure clean background */
        #assay-content {
          background: white !important;
          background-image: none !important;
        }
      `;

      const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Certificate of Assay</title>
  ${stylesheets}
  <style>${enhancedStyles}</style>
</head>
<body>
  ${clonedContent.innerHTML}
</body>
</html>`;

      const w = window.open("", "_blank");
      if (!w) {
        alert("Please allow popups to print the certificate.");
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
      alert("Failed to generate certificate for printing.");
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
        if (mounted) setJobCard(data);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
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

  const assays = jobCard?.assays || [];

  return (
    <>
      {/* Clean styles without watermark */}
      <style jsx>{`
        #assay-content {
          position: relative;
          background: white;
        }
        #assay-content > * {
          position: relative;
          z-index: 2;
        }

        /* Print-specific styles for better layout - no watermark */
        @media print {
          body {
            background: none !important;
          }
          body::before {
            display: none !important;
          }

          /* Print-specific styles for better layout */
          .grid {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
          }

          .grid-cols-3 > div {
            flex: 1 !important;
          }

          /* QR Code and Seal print styles */
          img[alt*="QR Code"],
          img[alt*="Official Seal"] {
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }

          /* Signature line print styles */
          .border-t {
            border-top: 1pt solid #000 !important;
          }

          /* Text styles for print */
          .text-xs {
            font-size: 8pt !important;
            line-height: 1.2 !important;
          }

          .text-sm {
            font-size: 10pt !important;
            line-height: 1.3 !important;
          }

          .font-bold {
            font-weight: bold !important;
          }
        }
      `}</style>

      {/* Header with Logo and Navigation */}
      <div className="bg-white shadow-sm rounded-t-lg print:hidden">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="print:hidden">
              <BackLink
                href={`/job-cards/large-scale/${id}`}
                label="Back to Job Card"
              />
            </div>
            <button
              onClick={printCertificate}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg
                className="-ml-1 mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Print Certificate
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Content */}
          <div
            id="assay-content"
            className="bg-white shadow-sm"
            style={{
              background: "white !important",
              backgroundImage: "none !important",
            }}
          >
            <div className="flex justify-between items-center p-4">
              <div className="flex items-center">
                <img
                  src="/goldbod-logo-black.png"
                  alt="GoldBod Logo"
                  className="h-12 w-auto"
                />
              </div>
              {/* <h1 className="text-xl font-bold tracking-wider ml-4">
                CERTIFICATE OF ASSAY
              </h1> */}
              <div className="title-section uppercase mx-auto text-center">
                <p className="font-bold text-2xl">CERTIFICATE OF ASSAY</p>
                <p className="text-sm">LARGE SCALE OPERATIONS</p>
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

            <div className="px-4 sm:px-6 lg:px-8 mb-4">
              {/* Client and Certificate Number on same row */}
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="text-sm font-medium text-gray-500 mr-2">
                    Client:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {jobCard?.exporter?.name && jobCard?.exporter?.exporterCode
                      ? `${jobCard.exporter.name} (${jobCard.exporter.exporterCode})`
                      : jobCard?.exporter?.name || "N/A"}
                  </span>
                </div>

                <div>
                  <span className="text-sm text-gray-500 mr-2 font-medium">
                    Certificate Number:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {assays[0]?.humanReadableAssayNumber || "N/A"}
                  </span>
                </div>
              </div>

              {/* Date and Data Sheet Dates on separate row */}
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-gray-500 font-medium mr-2">
                    Date:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatDate(
                      jobCard?.dataSheetDate || jobCard?.receivedDate
                    )}
                  </span>
                </div>

                <div>
                  <span className="text-sm text-gray-500 font-medium mr-2">
                    Data Sheet Dates:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {assays[0]?.dataSheetDates
                      ? formatDate(assays[0].dataSheetDates)
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Assay Measurements Table */}
            <div className="px-4 sm:px-6 lg:px-8 pt-4">
              <div className="bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-center text-xs font-bold uppercase bg-[#d4af37] border border-gray-300">
                          SN
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-bold uppercase bg-[#d4af37] border border-gray-300">
                          Bar No. NGGL
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-bold uppercase bg-[#d4af37] border border-gray-300">
                          Gross Weight ({jobCard?.unitOfMeasure})
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-bold uppercase bg-[#d4af37] border border-gray-300">
                          Gold Fineness (%)
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-bold uppercase bg-[#d4af37] border border-gray-300">
                          Gold Net Weight ({jobCard?.unitOfMeasure})
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-bold uppercase bg-[#d4af37] border border-gray-300">
                          Silver Fineness (%)
                        </th>
                        <th className="px-4 py-2  text-right text-xs font-bold uppercase bg-[#d4af37] border border-gray-300">
                          Silver Net Weight ({jobCard?.unitOfMeasure})
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {assays.map((assay: any) =>
                        (assay.measurements || []).map(
                          (m: any, idx: number) => (
                            <tr key={`${assay.id}-${idx}`}>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 text-center border border-gray-300">
                                {idx + 1}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700  text-right border border-gray-300">
                                {m.barNumber || "-"}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700  text-right border border-gray-300">
                                {m.grossWeight != null
                                  ? Number(m.grossWeight).toLocaleString(
                                      undefined,
                                      {
                                        minimumFractionDigits: 4,
                                        maximumFractionDigits: 4,
                                      }
                                    )
                                  : "-"}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700  text-right border border-gray-300">
                                {m.goldAssay != null
                                  ? Number(m.goldAssay).toLocaleString(
                                      undefined,
                                      {
                                        minimumFractionDigits: 4,
                                        maximumFractionDigits: 4,
                                      }
                                    )
                                  : "-"}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 text-right border border-gray-300">
                                {m.netGoldWeight != null
                                  ? Number(m.netGoldWeight).toLocaleString(
                                      undefined,
                                      {
                                        minimumFractionDigits: 4,
                                        maximumFractionDigits: 4,
                                      }
                                    )
                                  : "-"}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 text-right border border-gray-300">
                                {m.silverAssay != null
                                  ? Number(m.silverAssay).toLocaleString(
                                      undefined,
                                      {
                                        minimumFractionDigits: 4,
                                        maximumFractionDigits: 4,
                                      }
                                    )
                                  : "-"}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 text-right border border-gray-300">
                                {m.netSilverWeight != null
                                  ? Number(m.netSilverWeight).toLocaleString(
                                      undefined,
                                      {
                                        minimumFractionDigits: 4,
                                        maximumFractionDigits: 4,
                                      }
                                    )
                                  : "-"}
                              </td>
                            </tr>
                          )
                        )
                      )}
                      {/* Total Row */}
                      <tr className="bg-gray-50 font-semibold">
                        <td
                          className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-center border border-gray-300"
                          colSpan={2}
                        >
                          TOTAL
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right border border-gray-300">
                          {(() => {
                            const total = assays.reduce(
                              (acc: number, assay: any) =>
                                acc +
                                (assay.measurements || []).reduce(
                                  (subAcc: number, m: any) =>
                                    subAcc + (Number(m.grossWeight) || 0),
                                  0
                                ),
                              0
                            );
                            return total > 0
                              ? total.toLocaleString(undefined, {
                                  minimumFractionDigits: 4,
                                  maximumFractionDigits: 4,
                                })
                              : "-";
                          })()}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right border border-gray-300">
                          {(() => {
                            const grossTotal = assays.reduce(
                              (acc: number, assay: any) =>
                                acc +
                                (assay.measurements || []).reduce(
                                  (subAcc: number, m: any) =>
                                    subAcc + (Number(m.grossWeight) || 0),
                                  0
                                ),
                              0
                            );
                            const goldTotal = assays.reduce(
                              (acc: number, assay: any) =>
                                acc +
                                (assay.measurements || []).reduce(
                                  (subAcc: number, m: any) =>
                                    subAcc + (Number(m.netGoldWeight) || 0),
                                  0
                                ),
                              0
                            );
                            if (grossTotal > 0 && goldTotal > 0) {
                              const fineness = (goldTotal / grossTotal) * 100;
                              return fineness.toLocaleString(undefined, {
                                minimumFractionDigits: 4,
                                maximumFractionDigits: 4,
                              });
                            }
                            return "-";
                          })()}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right border border-gray-300">
                          {(() => {
                            const total = assays.reduce(
                              (acc: number, assay: any) =>
                                acc +
                                (assay.measurements || []).reduce(
                                  (subAcc: number, m: any) =>
                                    subAcc + (Number(m.netGoldWeight) || 0),
                                  0
                                ),
                              0
                            );
                            return total > 0
                              ? total.toLocaleString(undefined, {
                                  minimumFractionDigits: 4,
                                  maximumFractionDigits: 4,
                                })
                              : "-";
                          })()}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right border border-gray-300">
                          {(() => {
                            const grossTotal = assays.reduce(
                              (acc: number, assay: any) =>
                                acc +
                                (assay.measurements || []).reduce(
                                  (subAcc: number, m: any) =>
                                    subAcc + (Number(m.grossWeight) || 0),
                                  0
                                ),
                              0
                            );
                            const silverTotal = assays.reduce(
                              (acc: number, assay: any) =>
                                acc +
                                (assay.measurements || []).reduce(
                                  (subAcc: number, m: any) =>
                                    subAcc + (Number(m.netSilverWeight) || 0),
                                  0
                                ),
                              0
                            );
                            if (grossTotal > 0 && silverTotal > 0) {
                              const fineness = (silverTotal / grossTotal) * 100;
                              return fineness.toLocaleString(undefined, {
                                minimumFractionDigits: 4,
                                maximumFractionDigits: 4,
                              });
                            }
                            return "-";
                          })()}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right border border-gray-300">
                          {(() => {
                            const total = assays.reduce(
                              (acc: number, assay: any) =>
                                acc +
                                (assay.measurements || []).reduce(
                                  (subAcc: number, m: any) =>
                                    subAcc + (Number(m.netSilverWeight) || 0),
                                  0
                                ),
                              0
                            );
                            return total > 0
                              ? total.toLocaleString(undefined, {
                                  minimumFractionDigits: 4,
                                  maximumFractionDigits: 4,
                                })
                              : "-";
                          })()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Net Weight Summary Section */}
            <div className="px-4 sm:px-6 lg:px-8 py-6 border-t border-gray-200">
              <div className="flex justify-between space-x-12">
                {/* Net Gold Weight */}
                <div className="text-left flex">
                  <div className="text-sm text-black uppercase ">
                    Net Weight of Gold:
                  </div>
                  <div className="text-sm font-bold text-black ml-1">
                    {(() => {
                      const totalGoldInFormUnit = assays.reduce(
                        (acc: number, assay: any) =>
                          acc +
                          (assay.measurements || []).reduce(
                            (subAcc: number, m: any) =>
                              subAcc + (Number(m.netGoldWeight) || 0),
                            0
                          ),
                        0
                      );

                      // Convert to grams based on unit of measure
                      let totalGoldGrams = totalGoldInFormUnit;
                      const unitOfMeasure =
                        jobCard?.unitOfMeasure?.toLowerCase();
                      if (
                        unitOfMeasure === "kg" ||
                        unitOfMeasure === "kilograms"
                      ) {
                        totalGoldGrams = totalGoldInFormUnit * 1000; // Convert kg to grams
                      }
                      // If already in grams, no conversion needed

                      const GRAMS_PER_TROY_OUNCE = 31.1035;
                      const goldOz = totalGoldGrams / GRAMS_PER_TROY_OUNCE;
                      return goldOz > 0
                        ? goldOz.toLocaleString(undefined, {
                            minimumFractionDigits: 3,
                            maximumFractionDigits: 3,
                          })
                        : "0.000";
                    })()}{" "}
                    oz
                  </div>
                </div>

                {/* Net Silver Weight */}
                <div className="text-right flex">
                  <div className="text-sm text-gray-800 uppercase ">
                    Net Weight of Silver:
                  </div>
                  <div className="text-sm font-bold text-gray-900 ml-1">
                    {(() => {
                      const totalSilverInFormUnit = assays.reduce(
                        (acc: number, assay: any) =>
                          acc +
                          (assay.measurements || []).reduce(
                            (subAcc: number, m: any) =>
                              subAcc + (Number(m.netSilverWeight) || 0),
                            0
                          ),
                        0
                      );

                      // Convert to grams based on unit of measure
                      let totalSilverGrams = totalSilverInFormUnit;
                      const unitOfMeasure =
                        jobCard?.unitOfMeasure?.toLowerCase();
                      if (
                        unitOfMeasure === "kg" ||
                        unitOfMeasure === "kilograms"
                      ) {
                        totalSilverGrams = totalSilverInFormUnit * 1000; // Convert kg to grams
                      }
                      // If already in grams, no conversion needed

                      const GRAMS_PER_TROY_OUNCE = 31.1035;
                      const silverOz = totalSilverGrams / GRAMS_PER_TROY_OUNCE;
                      return silverOz > 0
                        ? silverOz.toLocaleString(undefined, {
                            minimumFractionDigits: 3,
                            maximumFractionDigits: 3,
                          })
                        : "0.000";
                    })()}{" "}
                    oz
                  </div>
                </div>
              </div>

              {/* Technical Director Signature Section */}
              <div className="px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center">
                  <div className="border-t border-gray-300 pt-4 w-64">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700 mb-2 uppercase">
                        Technical Director
                      </p>
                    </div>
                  </div>

                  {/* Official Seal */}
                  <div className="justify-end">
                    <img
                      src="/seal.png"
                      alt="Official Seal"
                      className="w-32 h-24 mb-2 print:w-16 print:h-16"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
