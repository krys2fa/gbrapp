"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BackLink from "@/app/components/ui/BackLink";
import { formatDate } from "@/app/lib/utils";
import toast from "react-hot-toast";

export default function CertificateOfAssayPage() {
  const params = useParams();
  const id = (params?.id as string) || "";

  const [jobCard, setJobCard] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait"
  );

  function printCertificate(
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

          /* Position signature and seal at bottom of each printed page */
          #assay-content .signature-section {
            page-break-inside: avoid !important;
            page-break-before: auto !important; /* Allow it to break to next page if needed */
            margin-top: auto !important; /* Push to bottom if container is flex */
            clear: both !important; /* Ensure it starts on a new line */
          }

          /* Ensure the container can accommodate natural flow */
          #assay-content {
            position: static !important;
            min-height: auto !important; /* Remove fixed height to allow natural flow */
          }

          /* Remove the forced spacing that was causing overlap */
          #assay-content > *:not(.signature-section):last-of-type {
            margin-bottom: 0 !important;
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
      alert("Failed to prepare certificate for printing.");
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
          let errorMsg = `Failed to fetch job card for certificate (Status: ${res.status})`;
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
            toast.success("Certificate loaded successfully");
          }
        }
      } catch (e: any) {
        const errorMsg =
          e instanceof Error
            ? `Network error: ${e.message}`
            : "An unexpected error occurred while loading certificate data";
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
  }, [id]);

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
            <div className="flex items-center gap-3 print:hidden">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="orientation-select-certificate"
                  className="text-sm font-medium text-gray-700"
                >
                  Orientation:
                </label>
                <select
                  id="orientation-select-certificate"
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
                onClick={() => printCertificate(orientation)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <svg
                  className="h-4 w-4 mr-2"
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
            <div className="grid grid-cols-3 p-4">
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
              <div className="flex justify-end">
                {(() => {
                  // Calculate total weight from all assay measurements
                  const totalWeight = assays.reduce(
                    (assayAcc: number, assay: any) => {
                      return (
                        assayAcc +
                        (assay.measurements || []).reduce(
                          (acc: number, m: any) =>
                            acc + (Number(m.grossWeight) || 0),
                          0
                        )
                      );
                    },
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
                    dateOfAnalysis: assays[0]?.dateOfAnalysis
                      ? new Date(assays[0].dateOfAnalysis)
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

            <div className="px-4 sm:px-6 lg:px-8 mb-4">
              {/* Client and Certificate Number on same row */}
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
                    Certificate Number:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {jobCard?.certificateNumber || "N/A"}
                  </span>
                </div>
              </div>

              {/* Date and Data Sheet Dates on separate row */}
              <div className="flex justify-between items-center">
                {/* Reference Number*/}
                <div className="flex justify-start items-center mt-2">
                  <div>
                    <span className="text-sm text-gray-500 font-medium mr-2">
                      Reference No.:
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {jobCard?.referenceNumber || "N/A"}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-sm text-gray-500 font-medium mr-2">
                    Date of Analysis:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {assays[0]?.dateOfAnalysis
                      ? formatDate(assays[0].dateOfAnalysis)
                      : "N/A"}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                {/* Reference Number*/}
                <div className="flex justify-start items-center mt-2">
                  <div>
                    <span className="text-sm text-gray-500 font-medium mr-2">
                      Job Id:
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {jobCard?.humanReadableId || "N/A"}
                    </span>
                  </div>
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

              <div className="grid grid-cols-3 gap-4">
                <div className="pr-1 sm:pr-2 lg:pr-3 py-2">
                  <div className="flex justify-start">
                    <div className="flex text-center ">
                      <h4 className="text-xs font-medium text-gray-500 uppercase">
                        Customs Seal:
                      </h4>
                      <div className="ml-2 text-xs font-medium text-gray-900">
                        {jobCard.assays[0]?.customsSealNo || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-1 sm:px-2 lg:px-3 py-2">
                  <div className="flex justify-center">
                    <div className="flex text-center ">
                      <h4 className="text-xs font-medium text-gray-500 uppercase">
                        GOLDBOD Seal:
                      </h4>
                      <div className="ml-2 text-xs font-medium text-gray-900">
                        {jobCard.assays[0]?.goldbodSealNo || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-1 sm:px-2 lg:px-3 py-2">
                  <div className="flex justify-end">
                    <div className="flex">
                      <h4 className="text-xs font-medium text-gray-500 uppercase">
                        Security Seal:
                      </h4>
                      <div className="ml-2 text-xs text-gray-900">
                        {jobCard.assays[0]?.securitySealNo || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Director Signature Section - Moved to bottom */}
            <div className="px-4 sm:px-6 lg:px-8 py-8 mt-auto signature-section">
              <div className="flex justify-between items-end">
                <div className="border-t border-gray-300 pt-4 w-64">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700 mb-2 uppercase">
                      Technical Director
                    </p>
                    <p className="text-sm font-medium text-gray-700 mb-2 uppercase">
                      {jobCard?.technicalDirector || "-"}
                    </p>
                  </div>
                </div>

                {/* Official Seal */}
                <div className="bg-white py-4 flex justify-end">
                  <img src="/seal.png" alt="Seal" className="h-20 w-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
