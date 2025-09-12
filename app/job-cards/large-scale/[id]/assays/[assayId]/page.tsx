"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import BackLink from "@/app/components/ui/BackLink";
import { formatDate, formatCurrency } from "@/app/lib/utils";
import countryList from "react-select-country-list";

export default function AssayResultsPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const assayId = (params?.assayId as string) || "";
  // const router = useRouter();

  const [jobCard, setJobCard] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const countryOptions = useMemo(() => countryList().getData(), []);

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
                onClick={() => window.print()}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
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
            {/* QR Code Section */}
            <div className="bg-white shadow-sm rounded-b-lg">
              <div className="my-6 px-4 sm:px-6 lg:px-8 pb-6">
                <div className="flex items-center justify-between gap-8">
                  <div className="px-4 sm:px-6 lg:px-8 py-6 pb-2">
                    <img
                      src="/goldbod-logo-green.png"
                      alt="GoldBod Logo"
                      className="h-12 w-auto"
                    />
                  </div>

                  <div className="text-center uppercase underline font-bold text-lg flex items-center">
                    Ghana Gold Board
                  </div>

                  {/* QR Code */}
                  <div className="text-center flex-shrink-0 my-2 flex items-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                        "https://goldbod.gov.gh/"
                      )}`}
                      alt="QR Code - Visit GoldBod Website"
                      className="w-20 h-20 mx-auto mb-2"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-6 lg:px-8 pt-2 py-6 flex justify-center mb-2">
              <h1 className="text-xl font-bold tracking-wider">
                REPORT OF GOLD SAMPLE ANALYSIS FROM LARGE SCALE GOLD MINING
                COMPANY
              </h1>
            </div>

            <div className="px-4 sm:px-6 lg:px-8 mb-4">
              <div>
                <div className="mb-2">
                  <span className="text-sm text-gray-500 mr-2 uppercase">
                    Name of mining company:
                  </span>
                  <span className="text-sm uppercase">
                    {jobCard?.exporter?.name || "N/A"}
                  </span>
                </div>
                <div className="mb-2 flex justify-between items-start">
                  <div className="flex-1">
                    <span className="text-sm text-gray-500 mr-2 uppercase">
                      Number of Samples:
                    </span>
                    <span className="text-sm">
                      {assay?.measurements?.length || 0}
                    </span>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm text-gray-500 mr-2 uppercase">
                      Sample Type:
                    </span>
                    <span className="text-sm">
                      {assay?.sampleType || "N/A"}
                    </span>
                  </div>
                </div>
                <div className="mb-2 flex justify-between items-start">
                  <div className="flex-1">
                    <span className="text-sm text-gray-500 mr-2 uppercase">
                      Date of Analysis:
                    </span>
                    <span className="text-sm">
                      {assay?.dateOfAnalysis
                        ? formatDate(assay.dateOfAnalysis)
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm text-gray-500 mr-2 uppercase">
                      Shipment Number:
                    </span>
                    <span className="text-sm">
                      {assay?.shipmentNumber || "N/A"}
                    </span>
                  </div>
                </div>

                <div className="mb-2 flex justify-between items-start">
                  <div className="flex-1">
                    <span className="text-sm text-gray-500 mr-2 uppercase">
                      Data Sheet Dates:
                    </span>
                    <span className="text-sm">
                      {assay?.dataSheetDates
                        ? formatDate(assay.dataSheetDates)
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm text-gray-500 mr-2 uppercase">
                      Sample Bottle Dates:
                    </span>
                    <span className="text-sm">
                      {assay?.sampleBottleDates
                        ? formatDate(assay.sampleBottleDates)
                        : "N/A"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <span className="text-sm text-gray-500 mr-2 uppercase">
                      Number of Bars:
                    </span>
                    <span className="text-sm">
                      {assay?.numberOfBars || "N/A"}
                    </span>
                  </div>
                  <div className="flex-1">
                    {/* Reserved for future field */}
                  </div>
                </div>
              </div>

              {/* <div>
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
                <span className="text-sm">{assay.id.slice(-8) || "N/A"}</span>
              </div>

              <div>
                <span className="text-sm text-gray-500 mr-2">Destination:</span>
                <span className="text-sm">
                  {jobCard?.destinationCountry
                    ? countryOptions.find(
                        (option: any) =>
                          option.value === jobCard.destinationCountry
                      )?.label || jobCard.destinationCountry
                    : "N/A"}
                </span>
              </div>

              <div>
                <span className="text-sm text-gray-500 mr-2">
                  Type of Shipment:
                </span>
                <span className="text-sm">
                  {assay?.shipmentType?.name || "N/A"}
                </span>
              </div> */}
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
                          Bar No
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

            <div className="px-4 sm:px-6 lg:px-8 py-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">

                </div>

                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <dt className="text-sm font-medium text-gray-500">
                        NET WEIGHT OF GOLD (Oz):
                      </dt>
                      <dd className="text-sm font-semibold text-gray-900">
                        {assay?.totalNetGoldWeightOz}
                        oz
                      </dd>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <dt className="text-sm font-medium text-gray-500">
                        NET WEIGHT OF SILVER (Oz):
                      </dt>
                      <dd className="text-sm font-semibold text-gray-900">
                        {assay?.totalNetSilverWeightOz}
                        oz
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
                        {assay?.totalGoldValue}
                      </dd>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <dt className="text-sm font-medium text-gray-500">
                        VALUE OF SILVER (US$):
                      </dt>
                      <dd className="text-sm font-semibold text-gray-900">
                        {assay?.totalSilverValue}
                      </dd>
                    </div>
                  </div>
                </div>

                <div className="flex mb-4">
                  <div className="flex justify-between items-center w-1/2">
                    <dt className="text-sm font-medium text-gray-900">
                      PREVAILING BOG EXCHANGE RATE:
                    </dt>
                    <dd className="text-sm font-semibold text-gray-900">
                      {Number(assay?.exchangeRate).toFixed(4)}
                    </dd>
                  </div>
                </div>

                <div className="flex mb-4">
                  <div className="text-center justify-between flex">
                    <dt className="text-sm font-medium text-gray-900">
                      TOTAL VALUE OF SHIPMENT (GOLD & SILVER) US$:
                    </dt>
                    <dd className="text-sm font-semibold text-gray-900">
                      {assay?.totalValueGhs}
                    </dd>
                  </div>
                </div>

                <div className="flex">
                  <div className="text-center justify-between flex">
                    <dt className="text-sm font-medium text-gray-900">
                      TOTAL VALUE OF SHIPMENT (GOLD & SILVER) GHS:
                    </dt>
                    <dd className="text-sm font-semibold text-gray-900">
                      {assay?.totalCombinedValue}
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
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Technical Director
                    </p>
                    {/* <div className="h-16 border-b border-gray-300 mb-2"></div>
                    <p className="text-xs text-gray-500">Signature & Date</p> */}
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
