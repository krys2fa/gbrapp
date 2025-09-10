"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowPathIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import BackLink from "@/app/components/ui/BackLink";
import {
  formatDate,
  formatExchangeRate,
  formatCurrency,
} from "@/app/lib/utils";

export default function AssayResultsPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const router = useRouter();

  const [jobCard, setJobCard] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  console.log("Job Card Data:", jobCard); // Debug log
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
        <div className="mt-4">
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
        <div className="mt-4">
          <BackLink href={`/job-cards/${id}`} label="Back to Job Card" />
        </div>
      </div>
    );
  }

  const assays = jobCard?.assays || [];

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header with Logo and Navigation */}
          <div className="bg-white shadow-sm rounded-t-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                {/* <div className="flex items-center space-x-4">
                  <img
                    src="/goldbod-logo-green.png"
                    alt="GoldBod Logo"
                    className="h-12 w-auto"
                  />
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      Gold Assay Results 
                    </h1>
                  </div>
                </div> */}
                {/* <div className="flex items-center space-x-4 justify-between"> */}
                <BackLink href={`/job-cards/${id}`} label="Back to Job Card" />
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Print Certificate
                </button>
                {/* </div> */}
              </div>
            </div>

            {/* Information Grid */}
            {/* <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <img
                  src="/goldbod-logo-green.png"
                  alt="GoldBod Logo"
                  className="h-12 w-auto"
                />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Gold Assay Results
                  </h1>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Client</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {jobCard?.exporter?.name || "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(new Date())}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Job Card #
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {jobCard?.referenceNumber || "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Assay #</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {assays.length > 0
                      ? assays[0]?.certificateNumber || "N/A"
                      : "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Destination
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {jobCard?.destination || "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Commodity
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {jobCard?.commodity?.name || "N/A"}
                  </dd>
                </div>
              </div>
            </div> */}
          </div>

          {/* Main Content */}
          <div className="bg-white shadow-sm">
            <div className="py-2">
              <img
                src="/goldbod-logo-green.png"
                alt="GoldBod Logo"
                className="h-12 w-auto"
              />
            </div>

            <div className="flex justify-center mb-4">
              <h1 className="text-xl font-bold tracking-wider">
                GOLD ASSAY RESULTS
              </h1>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <span className="text-sm text-gray-500 mr-2">Client:</span>
                <span className="text-sm">
                  {jobCard?.exporter?.name || "N/A"}
                </span>
              </div>

              <div>
                <span className="text-sm text-gray-500 mr-2">Date:</span>
                <span className="text-sm">
                  {formatDate(jobCard.receivedDate)}
                </span>
              </div>

              <div>
                <span className="text-sm text-gray-500 mr-2">Job Number:</span>
                <span className="text-sm">
                  {jobCard?.referenceNumber || "N/A"}
                </span>
              </div>

              <div>
                <span className="text-sm text-gray-500 mr-2">
                  Assay Number:
                </span>
                <span className="text-sm">
                  {assays[0]?.certificateNumber || "N/A"}
                </span>
              </div>

              <div>
                <span className="text-sm text-gray-500 mr-2">Destination:</span>
                <span className="text-sm">
                  {jobCard?.destinationCountry || "N/A"}
                </span>
              </div>

              <div>
                <span className="text-sm text-gray-500 mr-2">
                  Type of Shipment:
                </span>
                <span className="text-sm">
                  {assays[0]?.shipmentType.name || "N/A"}
                </span>
              </div>
            </div>

            {/* Assay Measurements Table */}
            <div className="px-6 py-6">
              {/* <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Certificate #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Assay Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Sample ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Gross Weight
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Net Weight
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Gold Content (%)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Silver Content (%)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Unit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assays.map((assay: any) =>
                      (assay.measurements || []).map(
                        (measurement: any, index: number) => (
                          <tr
                            key={`${assay.id}-${index}`}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200">
                              {assay.certificateNumber || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">
                              {formatDate(
                                new Date(assay.assayDate || assay.createdAt)
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                              {measurement.sampleId || `Sample ${index + 1}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                              {measurement.grossWeight
                                ? Number(measurement.grossWeight).toFixed(3)
                                : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                              {measurement.netWeight
                                ? Number(measurement.netWeight).toFixed(3)
                                : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                              {measurement.goldContent
                                ? Number(measurement.goldContent).toFixed(2)
                                : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                              {measurement.silverContent
                                ? Number(measurement.silverContent).toFixed(2)
                                : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">
                              {measurement.unitOfMeasure ||
                                jobCard.unitOfMeasure ||
                                "g"}
                            </td>
                          </tr>
                        )
                      )
                    )}
                    {assays.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-6 py-4 text-center text-sm text-gray-500 border-t border-gray-200"
                        >
                          No assay measurements found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div> */}

              <div className="bg-white border rounded overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-center text-xs font-bold uppercase bg-[#d4af37]">
                          SN
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-bold uppercase bg-[#d4af37]">
                          Gross Weight ({jobCard?.unitOfMeasure})
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-bold uppercase bg-[#d4af37]">
                          Fineness (%)
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-bold uppercase bg-[#d4af37]">
                          Net Weight ({jobCard?.unitOfMeasure})
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {assays.map((assay: any) =>
                        (assay.measurements || []).map(
                          (m: any, idx: number) => (
                            <tr key={`${assay.id}-${idx}`}>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 text-center">
                                {`${idx + 1}`}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 text-right">
                                {m.grossWeight != null
                                  ? Number(m.grossWeight).toFixed(2)
                                  : "-"}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 text-right">
                                {m.fineness ?? "-"}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 text-right">
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
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                          {"TOTAL"}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
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
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
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
                              return fineness.toFixed(2) + "%";
                            }
                            return "-";
                          })()}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
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
                            return total > 0 ? total.toFixed(2) : "-";
                          })()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4">
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
                        return total > 0 ? total.toFixed(2) : "0.00";
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
                        return totalGrams > 0 ? oz.toFixed(3) : "0.000";
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

                        const totalValue = totalOz * pricePerOz;
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

                        const exchangeRate = assays[0]?.exchangeRate || 1;
                        const totalValueUSD = totalOz * pricePerOz;
                        const totalValueGHS = totalValueUSD * exchangeRate;

                        return formatCurrency(totalValueGHS, "GHS");
                      })()}
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="bg-white shadow-sm rounded-b-lg">
              <div className="my-6 px-6 pb-6">
                <div className="flex items-start justify-between gap-8">
                  {/* QR Code */}
                  <div className="text-center flex-shrink-0">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                        "https://goldbod.gov.gh/"
                      )}`}
                      alt="QR Code - Visit GoldBod Website"
                      className="w-40 h-40 mx-auto mb-2"
                    />
                  </div>

                  {/* Comments Section */}
                  <div className="flex-1 max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comments
                    </label>
                    <div className="bg-gray-50 border border-gray-300 rounded-md p-3 min-h-[160px]">
                      {/* <p className="text-sm text-gray-900 whitespace-pre-wrap">
                        {assays.length > 0 && assays[0]?.comments
                          ? assays[0].comments
                          : "No comments available for this assay."}
                      </p> */}
                    </div>
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
