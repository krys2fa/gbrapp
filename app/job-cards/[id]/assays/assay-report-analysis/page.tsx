"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowPathIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  BeakerIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import BackLink from "@/app/components/ui/BackLink";
import {
  formatDate,
  formatExchangeRate,
  formatCurrency,
} from "@/app/lib/utils";

export default function AssayReportAnalysisPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const router = useRouter();

  const [jobCard, setJobCard] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commodityPrice, setCommodityPrice] = useState<number | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

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

        // fetch commodity price for this job card's commodity if present
        if (data?.commodityId) {
          try {
            const cpRes = await fetch(
              `/api/daily-prices?type=COMMODITY&itemId=${data.commodityId}`
            );
            if (cpRes.ok) {
              const cpBody = await cpRes.json().catch(() => []);
              const latest =
                Array.isArray(cpBody) && cpBody.length
                  ? cpBody
                      .slice()
                      .sort(
                        (a: any, b: any) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime()
                      )[0]
                  : null;
              if (mounted && latest) setCommodityPrice(Number(latest.price));
            }
          } catch (e) {
            // ignore
          }
        }

        // fetch latest exchange rates
        try {
          const exRes = await fetch(`/api/daily-prices?type=EXCHANGE`);
          if (exRes.ok) {
            const exBody = await exRes.json().catch(() => []);
            const latestEx =
              Array.isArray(exBody) && exBody.length
                ? exBody
                    .slice()
                    .sort(
                      (a: any, b: any) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    )[0]
                : null;
            if (mounted && latestEx) setExchangeRate(Number(latestEx.price));
          }
        } catch (e) {
          // ignore
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <span className="ml-2 text-gray-500">Loading assay analysis...</span>
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

  // Calculate analysis metrics
  const totalSamples = assays.reduce(
    (acc: number, assay: any) => acc + (assay.measurements?.length || 0),
    0
  );

  const allMeasurements = assays.flatMap(
    (assay: any) => assay.measurements || []
  );
  const validGoldMeasurements = allMeasurements.filter(
    (m: any) => m.goldContent != null
  );
  const validSilverMeasurements = allMeasurements.filter(
    (m: any) => m.silverContent != null
  );

  const avgGoldContent =
    validGoldMeasurements.length > 0
      ? validGoldMeasurements.reduce(
          (acc: number, m: any) => acc + Number(m.goldContent),
          0
        ) / validGoldMeasurements.length
      : 0;

  const avgSilverContent =
    validSilverMeasurements.length > 0
      ? validSilverMeasurements.reduce(
          (acc: number, m: any) => acc + Number(m.silverContent),
          0
        ) / validSilverMeasurements.length
      : 0;

  const goldContentRange =
    validGoldMeasurements.length > 0
      ? {
          min: Math.min(
            ...validGoldMeasurements.map((m: any) => Number(m.goldContent))
          ),
          max: Math.max(
            ...validGoldMeasurements.map((m: any) => Number(m.goldContent))
          ),
        }
      : { min: 0, max: 0 };

  return (
    <>
      {/* Watermark Styles */}
      <style jsx>{`
        #assay-analysis-content {
          position: relative;
        }
        #assay-analysis-content::before {
          content: "";
          position: absolute;
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
        #assay-analysis-content > * {
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
          /* QR Code print styles */
          img[alt*="QR Code"] {
            width: 16pt !important;
            height: 16pt !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>

      <div id="assay-analysis-content" className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <BackLink href={`/job-cards/${id}`} label="Back to Job Card" />
            <h1 className="mt-2 text-2xl font-bold text-gray-900">
              Assay Report Analysis
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Comprehensive analysis and insights for {jobCard.referenceNumber}
            </p>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BeakerIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Assays
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {assays.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Samples
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {totalSamples}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Avg Gold Content
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {avgGoldContent.toFixed(2)}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 rounded-full bg-purple-400"></div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Gold Range
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {goldContentRange.min.toFixed(1)}% -{" "}
                      {goldContentRange.max.toFixed(1)}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gold Content Analysis */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Gold Content Analysis
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Statistical analysis of gold content across all samples
              </p>
            </div>

            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Average Gold Content
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <span className="text-lg font-semibold text-green-600">
                      {avgGoldContent.toFixed(3)}%
                    </span>
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Gold Content Range
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {goldContentRange.min.toFixed(3)}% -{" "}
                    {goldContentRange.max.toFixed(3)}%
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Standard Deviation
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {validGoldMeasurements.length > 1
                      ? (() => {
                          const mean = avgGoldContent;
                          const variance =
                            validGoldMeasurements.reduce(
                              (acc: number, m: any) =>
                                acc + Math.pow(Number(m.goldContent) - mean, 2),
                              0
                            ) / validGoldMeasurements.length;
                          return Math.sqrt(variance).toFixed(3);
                        })()
                      : "N/A"}
                    %
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Samples Analyzed
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {validGoldMeasurements.length} of {totalSamples}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Silver Content Analysis */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Silver Content Analysis
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Statistical analysis of silver content across all samples
              </p>
            </div>

            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Average Silver Content
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <span className="text-lg font-semibold text-blue-600">
                      {avgSilverContent.toFixed(3)}%
                    </span>
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Silver Content Range
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {validSilverMeasurements.length > 0
                      ? `${Math.min(
                          ...validSilverMeasurements.map((m: any) =>
                            Number(m.silverContent)
                          )
                        ).toFixed(3)}% - ${Math.max(
                          ...validSilverMeasurements.map((m: any) =>
                            Number(m.silverContent)
                          )
                        ).toFixed(3)}%`
                      : "N/A"}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Samples Analyzed
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {validSilverMeasurements.length} of {totalSamples}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Valuation Analysis */}
        {commodityPrice && (
          <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Valuation Analysis
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Estimated value calculations based on current market prices
              </p>
            </div>

            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Current Gold Price (USD/oz)
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    ${commodityPrice.toLocaleString()}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Exchange Rate (GHS/USD)
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {exchangeRate ? exchangeRate.toFixed(2) : "N/A"}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Estimated Total Value (USD)
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <span className="text-lg font-semibold text-green-600">
                      $
                      {(() => {
                        const totalGrams = allMeasurements.reduce(
                          (acc: number, m: any) => {
                            const grams = convertToGrams(
                              m.netWeight,
                              m.unitOfMeasure || jobCard.unitOfMeasure
                            );
                            const goldGrams =
                              grams * (Number(m.goldContent || 0) / 100);
                            return acc + goldGrams;
                          },
                          0
                        );
                        const GRAMS_PER_TROY_OUNCE = 31.1035;
                        const ounces = totalGrams / GRAMS_PER_TROY_OUNCE;
                        return (ounces * commodityPrice).toLocaleString();
                      })()}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {/* Quality Assessment */}
        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Quality Assessment
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Assessment of assay quality and consistency
            </p>
          </div>

          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Data Completeness
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      validGoldMeasurements.length / totalSamples > 0.8
                        ? "bg-green-100 text-green-800"
                        : validGoldMeasurements.length / totalSamples > 0.5
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {Math.round(
                      (validGoldMeasurements.length / totalSamples) * 100
                    )}
                    % Complete
                  </span>
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Assay Consistency
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      goldContentRange.max - goldContentRange.min < 5
                        ? "bg-green-100 text-green-800"
                        : goldContentRange.max - goldContentRange.min < 15
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {goldContentRange.max - goldContentRange.min < 5
                      ? "High Consistency"
                      : goldContentRange.max - goldContentRange.min < 15
                      ? "Moderate Consistency"
                      : "Variable Results"}
                  </span>
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Analysis Date Range
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {assays.length > 0
                    ? `${formatDate(
                        new Date(
                          Math.min(
                            ...assays.map((a: any) =>
                              new Date(a.assayDate || a.createdAt).getTime()
                            )
                          )
                        )
                      )} - ${formatDate(
                        new Date(
                          Math.max(
                            ...assays.map((a: any) =>
                              new Date(a.assayDate || a.createdAt).getTime()
                            )
                          )
                        )
                      )}`
                    : "N/A"}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="mt-8 flex justify-end">
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
    </>
  );
}
