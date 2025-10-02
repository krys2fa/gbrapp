"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PrinterIcon } from "@heroicons/react/24/outline";
import BackLink from "@/app/components/ui/BackLink";
import { formatDate, formatCurrency } from "@/app/lib/utils";
import toast from "react-hot-toast";
import Link from "next/link";

export default function AssayResultsPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const assayId = (params?.assayId as string) || "";
  const [jobCard, setJobCard] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait"
  );

  function printAssayResults(
    printOrientation: "portrait" | "landscape" = "portrait"
  ) {
    try {
      // Apply print styles to current page for full print dialog
      const printStyles = document.createElement("style");
      const pageSize = printOrientation === "landscape" ? "A4 landscape" : "A4";
      printStyles.innerHTML = `
        @media print {
          @page { size: ${pageSize}; margin: 20mm; }
          body {
            margin: 0;
            padding: 0;
          }
          body * { visibility: hidden; }
          #assay-content, #assay-content * { visibility: visible; }
          #assay-content {
            position: static;
            margin: 0;
            padding: 0;
          }

          /* QR Code print styles */
          img[alt*="QR Code"] {
            width: 48pt !important;
            height: 48pt !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          /* Remove borders from printed content but keep table borders */
          #assay-content {
            border: none !important;
            box-shadow: none !important;
          }
          #assay-content > div:not(table):not(thead):not(tbody):not(tr):not(th):not(td) {
            border: none !important;
            box-shadow: none !important;
          }
          /* Keep table borders and header styling - high specificity */
          #assay-content table th,
          #assay-content th {
            background-color: #d4af37 !important;
            color: #111827 !important;
            border: 1px solid #d1d5db !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #assay-content table td,
          #assay-content td {
            border: 1px solid #d1d5db !important;
          }
          /* Override any Tailwind background utilities that might interfere */
          #assay-content th[class*="bg-"] {
            background-color: #d4af37 !important;
          }
        }
      `;
      document.head.appendChild(printStyles);

      // Trigger print dialog on current page
      window.print();

      // Clean up styles after printing
      setTimeout(() => {
        document.head.removeChild(printStyles);
      }, 1000);
    } catch (e) {
      console.error(e);
      alert("Failed to prepare assay results for printing.");
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
            toast.success("Assay loaded successfully");
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
              <div className="flex items-center gap-2">
                <label
                  htmlFor="orientation-select"
                  className="text-sm font-medium text-gray-700"
                >
                  Orientation:
                </label>
                <select
                  id="orientation-select"
                  value={orientation}
                  onChange={(e) =>
                    setOrientation(e.target.value as "portrait" | "landscape")
                  }
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
              <button
                onClick={() => printAssayResults(orientation)}
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
              <div className="grid grid-cols-3 gap-4 px-6 py-4">
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

                <div className="flex justify-end">
                  {(() => {
                    // Calculate total weight from assay measurements
                    const totalWeight = (assay?.measurements || []).reduce(
                      (acc: number, m: any) =>
                        acc + (Number(m.grossWeight) || 0),
                      0
                    );

                    // Create QR code data with job card information
                    const qrData = {
                      destination: jobCard?.destinationCountry || "N/A",
                      weight:
                        totalWeight > 0
                          ? `${totalWeight.toFixed(4)} ${
                              jobCard?.unitOfMeasure || "kg"
                            }`
                          : "N/A",
                      dateOfAnalysis: assay?.dateOfAnalysis
                        ? new Date(assay.dateOfAnalysis)
                            .toISOString()
                            .split("T")[0]
                        : "N/A",
                      exporter: jobCard?.exporter?.name || "N/A",
                      countryOfOrigin: jobCard?.sourceOfGold || "N/A",
                      jobCardId: jobCard?.humanReadableId || "N/A",
                    };

                    return (
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(
                          JSON.stringify(qrData)
                        )}`}
                        alt="QR Code - Job Card Information"
                        className="w-16 h-16"
                      />
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Professional Assay Information */}
            <div className="px-4 sm:px-6 lg:px-8 pt-4">
              {/* Row 1: Exporter - Reference Number - Date of Analysis */}
              <div className="grid grid-cols-3 gap-4 items-center mb-4">
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
                <div className="text-center">
                  <span className="text-sm font-medium text-gray-500 mr-2">
                    Reference No.:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {jobCard?.referenceNumber || "N/A"}
                  </span>
                </div>
                <div className="text-right">
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

              {/* Row 2: Number of Samples - Sample Type - Shipment Number */}
              <div className="grid grid-cols-3 gap-4 mb-2">
                <div>
                  <span className="text-sm font-medium text-gray-500 mr-2">
                    Number of Samples:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {assay?.measurements?.length || 0}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-sm font-medium text-gray-500 mr-2">
                    Sample Type:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {assay?.sampleType || "N/A"}
                  </span>
                </div>
                <div className="flex justify-end">
                  <span className="text-sm font-medium text-gray-500 mr-2">
                    Shipment Number:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {assay?.shipmentNumber || "N/A"}
                  </span>
                </div>
              </div>

              {/* Row 3: Data Sheet Dates - Sample Bottle Dates - Number of Bars */}
              <div className="grid grid-cols-3 gap-4 mb-2">
                <div>
                  <span className="text-sm font-medium text-gray-500 mr-2">
                    Data Sheet Dates:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {assay?.dataSheetDates || "N/A"}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-sm font-medium text-gray-500 mr-2">
                    Sample Bottle Dates:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {assay?.sampleBottleDates || "N/A"}
                  </span>
                </div>
                <div className="flex justify-end">
                  <span className="text-sm font-medium text-gray-500 mr-2">
                    Number of Bars:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {jobCard?.numberOfBoxes || "N/A"}
                  </span>
                </div>
              </div>

              {/* Row 4: Job ID */}
              <div className="grid grid-cols-3 gap-4 mb-2">
                {/* <div>
                  <span className="text-sm font-medium text-gray-500 mr-2">
                    Job ID:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {jobCard?.humanReadableId || "N/A"}
                  </span>
                </div> */}
                <div></div>
                <div></div>
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
                    <p className="text-sm text-gray-700 mb-2 font-bold">
                      {jobCard?.technicalDirector || "-"}
                    </p>
                  </div>
                </div>

                {/* Official Seal */}
                <div className="justify-end">
                  <img
                    src="/seal.png"
                    alt="Official Seal"
                    className="h-20 w-auto"
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
