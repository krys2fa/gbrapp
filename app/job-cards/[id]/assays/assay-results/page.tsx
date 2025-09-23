"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BackLink from "@/app/components/ui/BackLink";
import AssayActions from "../AssayActions";
import { formatDate, formatCurrency } from "@/app/lib/utils";

export default function AssayResultsPage() {
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
      {/* Print styles for QR Code */}
      <style jsx>{`
        @media print {
          /* QR Code print styles */
          img[alt*="QR Code"] {
            width: 16pt !important;
            height: 16pt !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
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
            <AssayActions
              jobCardId={id}
              //   signatoryName="Dr. John Smith"
              //   signatoryPosition="Chief Assayer"
            />
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
              <div className="title-section uppercase mx-auto text-center">
                <p className="font-bold text-2xl">ASSAY REPORT</p>
                <p className="text-sm">SMALL SCALE OPERATIONS</p>
              </div>
              {/* QR Code */}
              <div className="text-center flex-shrink-0 mr-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                    "https://goldbod.gov.gh/"
                  )}`}
                  alt="QR Code - Visit GoldBod Website"
                  className="w-16 h-16"
                />
              </div>
            </div>

            <div className="px-4 sm:px-6 lg:px-8 grid grid-cols-2 gap-4 mb-4">
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

              <div className="justify-end flex">
                <span className="text-sm font-medium text-gray-500 mr-2 ">
                  Assay Date:
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatDate(jobCard.receivedDate)}
                </span>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-500 mr-2">
                  Job ID:
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {jobCard?.humanReadableId || "N/A"}
                </span>
              </div>

              <div className="justify-end flex">
                <span className="text-sm font-medium text-gray-500 mr-2">
                  Destination:
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {jobCard?.destinationCountry || "N/A"}
                </span>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-500 mr-2">
                  Type of Shipment:
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {assays[0]?.shipmentType.name || "N/A"}
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
            </div>

            <div className="px-4 sm:px-6 lg:px-8 py-4">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2">
                    <dt className="text-sm font-medium text-gray-500">
                      NET WT. OF{" "}
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
                          : "0.00";
                      })()}
                      {jobCard?.unitOfMeasure}:
                    </dt>
                    <dd className="text-sm font-semibold text-gray-900">
                      {(() => {
                        const totalGrams = assays.reduce(
                          (acc: number, assay: any) =>
                            acc +
                            (assay.measurements || []).reduce(
                              (subAcc: number, m: any) =>
                                subAcc +
                                convertToGrams(
                                  m.netWeight,
                                  m?.unitOfMeasure ?? jobCard?.unitOfMeasure
                                ),
                              0
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
                      LME PRICE/oz:
                    </dt>
                    <dd className="text-sm font-semibold text-gray-900">
                      {(() => {
                        // Get price from assay or job card
                        const pricePerOz =
                          assays[0]?.pricePerOz ||
                          assays[0]?.commodityPrice ||
                          jobCard?.pricePerOunce ||
                          0;
                        return formatCurrency(pricePerOz, "USD");
                      })()}
                    </dd>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <dt className="text-sm font-medium text-gray-500">
                      TOTAL VALUE IN US$:
                    </dt>
                    <dd className="text-sm font-semibold text-gray-900">
                      {(() => {
                        const totalGrams = assays.reduce(
                          (acc: number, assay: any) =>
                            acc +
                            (assay.measurements || []).reduce(
                              (subAcc: number, m: any) =>
                                subAcc +
                                convertToGrams(
                                  m.netWeight,
                                  m?.unitOfMeasure ?? jobCard?.unitOfMeasure
                                ),
                              0
                            ),
                          0
                        );
                        const GRAMS_PER_TROY_OUNCE = 31.1035;
                        const totalOz = totalGrams / GRAMS_PER_TROY_OUNCE;

                        const pricePerOz =
                          assays[0]?.pricePerOz ||
                          assays[0]?.commodityPrice ||
                          jobCard?.pricePerOunce ||
                          0;

                        const totalValue =
                          Number(totalOz.toFixed(3)) * Number(pricePerOz || 0);
                        return formatCurrency(totalValue, "USD");
                      })()}
                    </dd>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <dt className="text-sm font-medium text-gray-500">
                      TOTAL VALUE IN GHS:
                    </dt>
                    <dd className="text-sm font-semibold text-gray-900">
                      {(() => {
                        const totalGrams = assays.reduce(
                          (acc: number, assay: any) =>
                            acc +
                            (assay.measurements || []).reduce(
                              (subAcc: number, m: any) =>
                                subAcc +
                                convertToGrams(
                                  m.netWeight,
                                  m?.unitOfMeasure ?? jobCard?.unitOfMeasure
                                ),
                              0
                            ),
                          0
                        );
                        const GRAMS_PER_TROY_OUNCE = 31.1035;
                        const totalOz = totalGrams / GRAMS_PER_TROY_OUNCE;

                        const pricePerOz =
                          assays[0]?.pricePerOz ||
                          assays[0]?.commodityPrice ||
                          jobCard?.pricePerOunce ||
                          0;

                        const exchangeRate = assays[0]?.exchangeRate;
                        const totalValueUSD =
                          Number(totalOz.toFixed(3)) * Number(pricePerOz || 0);

                        const totalValueGHS = totalValueUSD * exchangeRate;

                        return formatCurrency(totalValueGHS, "GHS");
                      })()}
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            {/* Official Seal */}
            <div className="bg-white py-4 flex justify-end">
              <img src="/seal.png" alt="Seal" className="h-20 w-auto" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
