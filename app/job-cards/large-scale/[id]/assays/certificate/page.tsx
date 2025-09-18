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

      // Enhanced CSS for proper print styling - matching large scale assay results
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
        
        /* A4 Document Layout - Only for Print */
        body {
          width: 210mm !important;
          max-width: 100% !important;
          margin: 0 auto !important;
        }
        #assay-content {
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 15mm !important;
          position: relative;
          background: transparent;
        }

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
        .mt-8 { margin-top: 2rem; }
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
        .gap-4 { gap: 1rem; }
        .gap-8 { gap: 2rem; }
        .ml-2 { margin-left: 0.5rem; }
        .ml-auto { margin-left: auto; }
        .mx-8 { margin-left: 2rem; margin-right: 2rem; }

        /* Grid */
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }

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
        .text-left { text-align: left; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }

        /* Colors */
        .text-gray-500 { color: #666666; }
        .text-gray-600 { color: #555555; }
        .text-gray-700 { color: #333333; }
        .text-gray-800 { color: #222222; }
        .text-gray-900 { color: #000000; }
        .text-black { color: #000000; }
        .bg-gray-50 { background-color: rgba(249, 250, 251, 0.9); }
        .bg-white { background-color: rgba(255, 255, 255, 0.9); }

        /* Borders */
        .border { border-width: 1px; border-color: #000; }
        .border-t { border-top: 1px solid #000; }
        .border-b { border-bottom: 1px solid #000; }
        .border-gray-200 { border-color: #cccccc; }
        .border-gray-300 { border-color: #000; }
        .border-gray-400 { border-color: #000; }

        /* Table styling */
        table {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 15pt;
          background: transparent;
          position: relative;
          z-index: 2;
        }
        th, td {
          border: 1px solid #000;
          padding: 6pt;
          text-align: center;
          font-size: 10pt;
          background: rgba(255, 255, 255, 0.9);
        }
        th {
          background-color: rgba(240, 240, 240, 0.9);
          font-weight: bold;
        }

        /* Images */
        .w-24 { width: 6rem; }
        .h-24 { height: 6rem; }
        .w-auto { width: auto; }
        .h-12 { height: 3rem; }
        .h-20 { height: 5rem; }
        img {
          max-width: 100%;
          height: auto;
        }

        /* Watermark - Multi-page support */
        body {
          background: url('/seal.png') no-repeat center 30%;
          background-size: 280px 280px;
          background-attachment: fixed;
          opacity: 1;
        }
        body::before {
          content: "";
          position: fixed;
          top: 30%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 280px;
          height: 280px;
          background: url('/seal.png') no-repeat center center;
          background-size: contain;
          opacity: 0.15;
          z-index: 1;
          pointer-events: none;
        }
        #assay-content::before {
          content: "";
          position: absolute;
          top: 30%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          width: 280px;
          height: 280px;
          background: url('/seal.png') no-repeat center center;
          background-size: contain;
          opacity: 0.15;
          z-index: 1;
          pointer-events: none;
        }
        #assay-content > * {
          position: relative;
          z-index: 3;
        }

        /* Hide elements not needed for print */
        .no-print { display: none; }
        .print\\:hidden { display: none; }

        /* Remove border line under table */
        .border-t.border-gray-200 {
          border-top: none !important;
        }

        /* Certificate specific styling */
        .title-section {
          text-align: center;
          font-size: 18pt;
          font-weight: bold;
          margin: 15pt 0;
          text-transform: uppercase;
          letter-spacing: 1pt;
        }
      `;

      // Modify the cloned content to adjust the layout for print
      const clientInfoSection =
        clonedContent.querySelector(".grid.grid-cols-2");
      if (clientInfoSection) {
        clientInfoSection.innerHTML = `
          <div>
            <div style="margin-bottom: 8px;">
              <span class="text-sm text-gray-500 mr-2">Client:</span>
              <span class="text-sm">${jobCard?.exporter?.name || "N/A"}</span>
            </div>
            <div>
              <span class="text-sm text-gray-500 mr-2">Date:</span>
              <span class="text-sm">${formatDate(jobCard.receivedDate)}</span>
            </div>
          </div>
          <div class="text-right">
            <span class="text-sm text-gray-500 mr-2">Certificate Number:</span>
            <span class="text-sm">${
              assays[0]?.certificateNumber || "N/A"
            }</span>
          </div>
        `;
      }

      const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Certificate of Assay</title>
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
      {/* Watermark Styles */}
      <style jsx>{`
        #assay-content {
          position: relative;
        }
        #assay-content::before {
          content: "";
          position: absolute;
          top: 30%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 280px;
          height: 280px;
          background: url("/seal.png") no-repeat center center;
          background-size: contain;
          opacity: 0.15;
          z-index: 1;
          pointer-events: none;
        }
        #assay-content > * {
          position: relative;
          z-index: 2;
        }

        /* Multi-page watermark for print */
        @media print {
          body {
            background: url("/seal.png") no-repeat center 30%;
            background-size: 280px 280px;
            background-attachment: fixed;
          }
          body::before {
            content: "";
            position: fixed;
            top: 30%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 280px;
            height: 280px;
            background: url("/seal.png") no-repeat center center;
            background-size: contain;
            opacity: 0.08;
            z-index: 1;
            pointer-events: none;
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
          <div id="assay-content" className="bg-white shadow-sm">
            <div className="flex justify-between items-center p-4">
              <div className="flex items-center">
                <img
                  src="/goldbod-logo-black.png"
                  alt="GoldBod Logo"
                  className="h-12 w-auto"
                />
              </div>
              <h1 className="text-xl font-bold tracking-wider ml-4">
                CERTIFICATE OF ASSAY
              </h1>
              <div className="flex items-center">
                <img
                  src="/coat-of-arms.jpg"
                  alt="Coat of Arms"
                  className="h-20 w-auto"
                />
              </div>
            </div>

            <div className="px-4 sm:px-6 lg:px-8 grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-sm text-gray-500 mr-2">Client:</span>
                <span className="text-sm">
                  {jobCard?.exporter?.name || "N/A"}
                </span>
              </div>

              <div className="text-right">
                <span className="text-sm text-gray-500 mr-2">
                  Certificate Number:
                </span>
                <span className="text-sm">
                  {assays[0]?.certificateNumber || "N/A"}
                </span>
              </div>

              <div>
                <span className="text-sm text-gray-500 mr-2">Date:</span>
                <span className="text-sm">
                  {formatDate(jobCard.receivedDate)}
                </span>
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
                                  ? Number(m.grossWeight).toFixed(2)
                                  : "-"}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700  text-right border border-gray-300">
                                {m.goldAssay != null
                                  ? Number(m.goldAssay).toFixed(2)
                                  : "-"}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 text-right border border-gray-300">
                                {m.netGoldWeight != null
                                  ? Number(m.netGoldWeight).toFixed(2)
                                  : "-"}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 text-right border border-gray-300">
                                {m.silverAssay != null
                                  ? Number(m.silverAssay).toFixed(2)
                                  : "-"}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 text-right border border-gray-300">
                                {m.netSilverWeight != null
                                  ? Number(m.netSilverWeight).toFixed(2)
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
                            return total > 0 ? total.toFixed(2) : "-";
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
                              return fineness.toFixed(2);
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
                            return total > 0 ? total.toFixed(2) : "-";
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
                              return fineness.toFixed(2);
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
                            return total > 0 ? total.toFixed(2) : "-";
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
                      const totalGoldGrams = assays.reduce(
                        (acc: number, assay: any) =>
                          acc +
                          (assay.measurements || []).reduce(
                            (subAcc: number, m: any) =>
                              subAcc + (Number(m.netGoldWeight) || 0),
                            0
                          ),
                        0
                      );
                      const GRAMS_PER_TROY_OUNCE = 31.1035;
                      const goldOz = totalGoldGrams / GRAMS_PER_TROY_OUNCE;
                      return goldOz > 0 ? goldOz.toFixed(3) : "0.000";
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
                      const totalSilverGrams = assays.reduce(
                        (acc: number, assay: any) =>
                          acc +
                          (assay.measurements || []).reduce(
                            (subAcc: number, m: any) =>
                              subAcc + (Number(m.netSilverWeight) || 0),
                            0
                          ),
                        0
                      );
                      const GRAMS_PER_TROY_OUNCE = 31.1035;
                      const silverOz = totalSilverGrams / GRAMS_PER_TROY_OUNCE;
                      return silverOz > 0 ? silverOz.toFixed(3) : "0.000";
                    })()}{" "}
                    oz
                  </div>
                </div>
              </div>

              {/* Bottom Row: QR Code, Technical Director Signature, and Seal */}
              <div className="mt-8 print:mt-6">
                <div className="grid grid-cols-3 gap-8 items-center">
                  {/* QR Code */}
                  <div className="text-left">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                        `https://goldbod.gov.gh/job-cards/large-scale/${id}/assays/certificate`
                      )}`}
                      alt="QR Code - Certificate Verification"
                      className="w-24 h-24 mb-2 print:w-16 print:h-16"
                    />
                    {/* <p className="text-xs text-gray-500 print:block">
                      Scan to verify certificate
                    </p> */}
                  </div>

                  {/* Technical Director Signature */}
                  <div className="text-center">
                    {jobCard.technicalDirector ? (
                      <div>
                        <div className="border-t border-gray-400 mt-8 mb-2 mx-8"></div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {jobCard.technicalDirector.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          Technical Director
                        </p>
                        <p className="text-xs text-gray-500">
                          Badge: {jobCard.technicalDirector.badgeNumber}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="border-t border-gray-400 mt-8 mb-2 mx-8"></div>
                        <p className="font-semibold text-gray-900 text-sm">
                          Technical Director
                        </p>
                        {/* <p className="text-xs text-gray-600">
                          Ghana Boundary Commission
                        </p> */}
                      </div>
                    )}
                  </div>

                  {/* Official Seal */}
                  <div className="text-right">
                    <img
                      src="/seal.png"
                      alt="Official Seal"
                      className="w-24 h-24 ml-auto mb-2 print:w-16 print:h-16"
                    />
                    {/* <p className="text-xs text-gray-500 print:block">
                      Official Seal
                    </p> */}
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
