"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BackLink from "@/app/components/ui/BackLink";
import CertificateActions from "./CertificateActions";
import { formatDate } from "@/app/lib/utils";

export default function CertificateOfAssayPage() {
  const params = useParams();
  const id = (params?.id as string) || "";

  const [jobCard, setJobCard] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          <BackLink href={`/job-cards/${id}`} label="Back to Job Card" />
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
          <BackLink href={`/job-cards/${id}`} label="Back to Job Card" />
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

          /* Remove top border under the table when printing */
          .no-print-border-top {
            border-top: none !important;
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
              <BackLink href={`/job-cards/${id}`} label="Back to Job Card" />
            </div>
            <CertificateActions jobCardId={id} />
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
              <div className="title-section uppercase mx-auto text-center">
                <p className="font-bold text-2xl">CERTIFICATE OF ASSAY</p>
                <p className="text-sm">SMALL SCALE OPERATIONS</p>
              </div>
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

            <div className="px-4 sm:px-6 lg:px-8 mb-4">
              {/* Client and Certificate Number on same row */}
              {assays.length > 0 && (
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="text-sm font-medium text-gray-500 mr-2">
                      Exporter:
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {jobCard?.exporter?.name &&
                      jobCard?.exporter?.exporterCode
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
              )}

              {/* Date and Job Card Reference on separate row */}
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-gray-500 font-medium mr-2">
                    Date:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatDate(jobCard?.receivedDate)}
                  </span>
                </div>

                {/* <div>
                  <span className="text-sm text-gray-500 font-medium mr-2">
                    Job Id:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {jobCard?.humanReadableId ||
                      jobCard?.referenceNumber ||
                      "N/A"}
                  </span>
                </div> */}
              </div>
            </div>

            {/* Assay Results Table for Small Scale */}
            {assays.length > 0 && (
              <div className="px-4 sm:px-6 lg:px-8 pt-4">
                <div className="bg-white overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-center text-xs font-bold uppercase bg-[#d4af37] border border-gray-300">
                            SN
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-bold uppercase bg-[#d4af37] border border-gray-300">
                            Gross Weight ({jobCard?.unitOfMeasure})
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-bold uppercase bg-[#d4af37] border border-gray-300">
                            Fineness (%)
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-bold uppercase bg-[#d4af37] border border-gray-300">
                            Net Weight ({jobCard?.unitOfMeasure})
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {assays.map((assay: any) =>
                          (assay.measurements || []).map(
                            (m: any, idx: number) => (
                              <tr key={`${assay.id}-${idx}`}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 text-center border border-gray-300">
                                  {`${idx + 1}`}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 text-right border border-gray-300">
                                  {m.grossWeight != null
                                    ? Number(m.grossWeight).toFixed(2)
                                    : "-"}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 text-right border border-gray-300">
                                  {m.fineness ?? "-"}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 text-right border border-gray-300">
                                  {m.netWeight != null
                                    ? Number(m.netWeight).toFixed(2)
                                    : "-"}
                                </td>
                              </tr>
                            )
                          )
                        )}
                        {/* Total Row */}
                        <tr className="bg-gray-50 font-semibold">
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-center border border-gray-300">
                            {"TOTAL"}
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
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
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
                              const netTotal = assays.reduce(
                                (acc: number, assay: any) =>
                                  acc +
                                  (assay.measurements || []).reduce(
                                    (subAcc: number, m: any) =>
                                      subAcc + (Number(m.netWeight) || 0),
                                    0
                                  ),
                                0
                              );
                              if (grossTotal > 0 && netTotal > 0) {
                                const fineness = (netTotal / grossTotal) * 100;
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
                                      subAcc + (Number(m.netWeight) || 0),
                                    0
                                  ),
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

                {/* Summary Information - Net Weight in Ounces */}
                <div className="py-4 sm:py-6 lg:pxy-8 no-print-border-top">
                  <div className="flex justify-start">
                    <div className="flex text-center ">
                      <h4 className="text-sm font-medium text-gray-500 uppercase">
                        Total Net Weight:
                      </h4>
                      <div className="ml-2 text-sm font-semibold text-gray-900">
                        {(() => {
                          const netWeightTotal = assays.reduce(
                            (acc: number, assay: any) =>
                              acc +
                              (assay.measurements || []).reduce(
                                (subAcc: number, m: any) =>
                                  subAcc + (Number(m.netWeight) || 0),
                                0
                              ),
                            0
                          );
                          if (netWeightTotal > 0) {
                            // Convert grams to troy ounces (1 troy ounce = 31.1035 grams)
                            const ounces = netWeightTotal / 31.1035;
                            return `${ounces.toLocaleString(undefined, {
                              minimumFractionDigits: 3,
                              maximumFractionDigits: 3,
                            })} oz`;
                          }
                          return "0.0000 oz";
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <div className="pr-1 sm:pr-2 lg:pr-3 py-2">
                    <div className="flex justify-start">
                      <div className="flex text-center ">
                        <h4 className="text-sm font-medium text-gray-500 uppercase">
                          Customs Seal:
                        </h4>
                        <div className="ml-2 text-sm font-semibold text-gray-900">
                          {jobCard.assays[0]?.customsSealNo || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-1 sm:px-2 lg:px-3 py-2">
                    <div className="flex justify-start">
                      <div className="flex text-center ">
                        <h4 className="text-sm font-medium text-gray-500 uppercase">
                          GOLDBOD Seal:
                        </h4>
                        <div className="ml-2 text-sm font-semibold text-gray-900">
                          {jobCard.assays[0]?.goldbodSealNo || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-1 sm:px-2 lg:px-3 py-2">
                    <div className="flex justify-start">
                      <div className="flex">
                        <h4 className="text-sm font-medium text-gray-500 uppercase">
                          Security Seal:
                        </h4>
                        <div className="ml-2 text-sm font-semibold text-gray-900">
                          {jobCard.assays[0]?.securitySealNo || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Technical Director Signature Section */}
            <div className="px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex justify-between items-center">
                <div className="border-t border-gray-300 pt-4 w-64">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700 mb-2 uppercase">
                      Technical Director
                    </p>
                    <p className="text-sm font-bold text-gray-700 mb-2 uppercase">
                      {jobCard?.technicalDirectorName || "-"}
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
