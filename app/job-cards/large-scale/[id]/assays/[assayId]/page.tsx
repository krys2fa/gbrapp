"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PrinterIcon } from "@heroicons/react/24/outline";
import BackLink from "@/app/components/ui/BackLink";
import { formatDate, formatCurrency } from "@/app/lib/utils";
import toast from "react-hot-toast";

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

      // Enhanced CSS for proper print styling - matching web page exactly
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

        /* Spacing - exact web page matching */
        .px-4 { padding-left: 1rem; padding-right: 1rem; }
        .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
        .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
        .py-8 { padding-top: 2rem; padding-bottom: 2rem; }
        .pt-4 { padding-top: 1rem; }
        .mb-4 { margin-bottom: 1rem; }
        .ml-1 { margin-left: 0.25rem; }
        .ml-2 { margin-left: 0.5rem; }
        .mr-2 { margin-right: 0.5rem; }
        .gap-4 { gap: 1rem; }

        /* Grid system - exact web page matching */
        .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }

        /* Typography - exact web page matching */
        .text-xs { font-size: 0.75rem; line-height: 1rem; }
        .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
        .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
        .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
        .text-2xl { font-size: 1.5rem; line-height: 2rem; }
        .font-medium { font-weight: 500; }
        .font-semibold { font-weight: 600; }
        .font-bold { font-weight: 700; }
        .uppercase { text-transform: uppercase; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }

        /* Colors - exact web page matching */
        .text-gray-500 { color: #6b7280; }
        .text-gray-700 { color: #374151; }
        .text-gray-900 { color: #111827; }
        .bg-gray-50 { background-color: #f9fafb; }
        .bg-gray-200 { background-color: #e5e7eb; }
        .border-gray-200 { border-color: #e5e7eb; }
        .border-gray-300 { border-color: #d1d5db; }
        .divide-gray-200 > * + * { border-top: 1px solid #e5e7eb; }

        /* Borders - exact web page matching */
        .border { border-width: 1px; }
        .border-b { border-bottom-width: 1px; }
        .border-t { border-top-width: 1px; }

        /* Header section styling */
        .header-section {
          border-bottom: 2px solid #000;
          padding-bottom: 1rem;
          margin-bottom: 1.5rem;
        }
        .title-section {
          text-align: center;
          margin: 1rem 0;
        }

        /* Table styling - exact web page matching */
        .min-w-full { min-width: 100%; }
        .overflow-x-auto { overflow-x: auto; }
        .overflow-hidden { overflow: hidden; }
        table {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 1rem;
        }
        th, td {
          border: 1px solid #d1d5db;
          padding: 0.5rem;
          text-align: center;
          font-size: 0.75rem;
        }
        th {
          background-color: #d4af37;
          font-weight: bold;
          text-transform: uppercase;
          color: #000;
        }
        .text-right { text-align: right; }
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
        .h-16 { height: 4rem; }
        .w-16 { width: 4rem; }
        .w-auto { width: auto; }

        /* Financial section styling */
        .space-y-3 > * + * { margin-top: 0.75rem; }

        /* Hide elements not needed for print */
        .print\\:hidden { display: none !important; }
        
        /* Remove any potential watermarks */
        body { background: none !important; }
        body::before { display: none !important; }
        #assay-content::before { display: none !important; }
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
  ${clonedContent.innerHTML}
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
      const errorMsg = "No job card ID provided in URL parameters";
      console.error(errorMsg);
      toast.error(errorMsg);
      setError(errorMsg);
      setLoading(false);
      return;
    }

    if (!assayId) {
      const errorMsg = "No assay ID provided in URL parameters";
      console.error(errorMsg);
      toast.error(errorMsg);
      setError(errorMsg);
      setLoading(false);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const token = localStorage.getItem("auth-token");
        if (!token) {
          const errorMsg =
            "No authentication token found. Please log in again.";
          console.error(errorMsg);
          toast.error(errorMsg);
          if (mounted) setError(errorMsg);
          if (mounted) setLoading(false);
          return;
        }

        const res = await fetch(`/api/large-scale-job-cards/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          let errorMsg = `Failed to fetch job card (Status: ${res.status})`;
          try {
            const errorData = await res.json();
            if (errorData.error) {
              errorMsg += `: ${errorData.error}`;
            }
          } catch (parseError) {
            console.warn("Could not parse error response as JSON:", parseError);
          }
          console.error(`API Error ${res.status}:`, errorMsg);
          toast.error(errorMsg);
          if (mounted) setError(errorMsg);
        } else {
          const data = await res.json();
          if (mounted) {
            setJobCard(data);
            toast.success("Assay data loaded successfully");
          }
        }
      } catch (e: any) {
        const errorMsg =
          e instanceof Error
            ? `Network error: ${e.message}`
            : "An unexpected error occurred while loading assay data";
        console.error("Fetch error:", e);
        toast.error(errorMsg);
        if (mounted) setError(errorMsg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, assayId]);

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          {/* <span className="ml-2 text-gray-500">Loading assay results...</span> */}
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
      <div className="bg-white shadow-sm rounded-t-lg print:hidden max-w-7xl mx-auto">
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
                    src="/goldbod-logo-black.png"
                    alt="GoldBod Logo"
                    className="h-16 w-auto"
                  />
                </div>

                <div className="title-section uppercase mx-auto text-center">
                  <p className="font-bold text-2xl">ASSAY REPORT</p>
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
            </div>

            {/* Professional Assay Information */}
            <div className="px-4 sm:px-6 lg:px-8 pt-4">
              {/* Row 1: Exporter - Number of samples */}
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="text-sm font-medium text-gray-500 mr-2">
                    Exporter:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {jobCard?.exporter?.name && jobCard?.exporter?.exporterCode
                      ? `${jobCard.exporter.name}`
                      : jobCard?.exporter?.name || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500 mr-2 font-medium">
                    Number of Samples:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {assay?.measurements?.length || 0}
                  </span>
                </div>
              </div>

              {/* Row 2: Sample Type - Date of Analysis */}
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="text-sm font-medium text-gray-500 mr-2">
                    Sample Type:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {assay?.sampleType || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500 mr-2 font-medium">
                    Date of Analysis:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {assay?.dateOfAnalysis
                      ? formatDate(assay.dateOfAnalysis)
                      : "N/A"}
                  </span>
                </div>
              </div>

              {/* Row 3: Shipment Number - Data Sheet Dates */}
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="text-sm font-medium text-gray-500 mr-2">
                    Shipment Number:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {assay?.shipmentNumber || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500 mr-2 font-medium">
                    Data Sheet Dates:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {assay?.dataSheetDates || "N/A"}
                  </span>
                </div>
              </div>

              {/* Row 4: Sample Bottle Dates - Number of Bars */}
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="text-sm font-medium text-gray-500 mr-2">
                    Sample Bottle Dates:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {assay?.sampleBottleDates || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500 mr-2 font-medium">
                    Number of Bars:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {assay?.numberOfBars || "N/A"}
                  </span>
                </div>
              </div>

              {/* Row 5: Job Card ID - Assay Number */}
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="text-sm font-medium text-gray-500 mr-2">
                    Job ID:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {jobCard?.humanReadableId || "N/A"}
                  </span>
                </div>
                {/* <div>
                  <span className="text-sm text-gray-500 mr-2 font-medium">
                    Certificate Number:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {jobCard?.certificateNumber || "N/A"}
                  </span>
                </div> */}
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
                          Bar No.
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
                      {(assay.measurements || []).map((m: any, idx: number) => (
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
                              ? Number(m.goldAssay).toLocaleString(undefined, {
                                  minimumFractionDigits: 4,
                                  maximumFractionDigits: 4,
                                })
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
                      ))}
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
                            const total = (assay.measurements || []).reduce(
                              (acc: number, m: any) =>
                                acc + (Number(m.grossWeight) || 0),
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
                            const grossTotal = (
                              assay.measurements || []
                            ).reduce(
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
                              const fineness =
                                (netGoldTotal / grossTotal) * 100;
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
                            const total = (assay.measurements || []).reduce(
                              (acc: number, m: any) =>
                                acc + (Number(m.netGoldWeight) || 0),
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
                            const grossTotal = (
                              assay.measurements || []
                            ).reduce(
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
                            const total = (assay.measurements || []).reduce(
                              (acc: number, m: any) =>
                                acc + (Number(m.netSilverWeight) || 0),
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

            {/* Financial Information Section */}
            <div className="px-4 sm:px-6 lg:px-8 py-4 mx-auto">
              <div className="space-y-3 mx-auto">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <dt className="text-sm font-medium text-gray-500">
                        NET WEIGHT OF GOLD (Oz):
                      </dt>
                      <dd className="text-sm font-semibold text-gray-900 ml-1">
                        {assay?.totalNetGoldWeightOz.toLocaleString(undefined, {
                          minimumFractionDigits: 3,
                          maximumFractionDigits: 3,
                        })}
                      </dd>
                    </div>
                  </div>
                  <div className="flex-1 text-right pr-0 mr-0">
                    <dt className="text-sm font-medium text-gray-500 inline">
                      NET WEIGHT OF SILVER (Oz):
                    </dt>
                    <dd className="text-sm font-semibold text-gray-900 ml-1 inline">
                      {assay?.totalNetSilverWeightOz.toLocaleString(undefined, {
                        minimumFractionDigits: 3,
                        maximumFractionDigits: 3,
                      })}
                    </dd>
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
                  <div className="flex-1 text-right pr-0 mr-0">
                    <dt className="text-sm font-medium text-gray-500 uppercase inline">
                      Unit price per ounce:
                    </dt>
                    <dd className="text-sm font-semibold text-gray-900 ml-1 inline">
                      {(() => {
                        const pricePerOz = assay?.pricePerOz || 0;
                        return formatCurrency(pricePerOz, "USD");
                      })()}
                    </dd>
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
                  <div className="flex-1 text-right pr-0 mr-0">
                    <dt className="text-sm font-medium text-gray-500 inline">
                      VALUE OF SILVER (US$):
                    </dt>
                    <dd className="text-sm font-semibold text-gray-900 ml-1 inline">
                      {formatCurrency(assay?.totalSilverValue, "USD")}
                    </dd>
                  </div>
                </div>

                <div className="flex mt-4 pt-4">
                  <div className="flex justify-between items-center">
                    <dt className="text-sm font-medium text-gray-500">
                      PREVAILING BOG EXCHANGE RATE:
                    </dt>
                    <dd className="text-sm font-semibold text-gray-900 ml-1">
                      {Number(assay?.exchangeRate).toLocaleString(undefined, {
                        minimumFractionDigits: 4,
                        maximumFractionDigits: 4,
                      })}
                    </dd>
                  </div>
                </div>

                <div className="flex mb-4">
                  <div className="text-center justify-between flex">
                    <dt className="text-sm font-medium text-gray-500">
                      TOTAL VALUE OF SHIPMENT (GOLD & SILVER):
                    </dt>
                    <dd className="text-sm font-semibold text-gray-900 ml-1">
                      {formatCurrency(assay?.totalCombinedValue, "USD")}
                    </dd>
                  </div>
                </div>

                <div className="flex">
                  <div className="text-center justify-between flex">
                    <dt className="text-sm font-medium text-gray-500">
                      TOTAL VALUE OF SHIPMENT (GOLD & SILVER):
                    </dt>
                    <dd className="text-sm font-semibold text-gray-900 ml-1">
                      {formatCurrency(assay?.totalValueGhs, "GHS")}
                    </dd>
                  </div>
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
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {jobCard?.technicalDirector || "-"}
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

          {/* Technical Director Signature Section */}
        </div>
      </div>
    </>
  );
}
