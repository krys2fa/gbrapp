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
        <div className="px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="print:hidden">
              <BackLink
                href={`/job-cards/large-scale/${id}`}
                label="Back to Job Card"
              />
            </div>
            <button
              onClick={() => window.print()}
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
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
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
