"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import BackLink from "@/app/components/ui/BackLink";
import AssayDetailActions from "./AssayDetailActions";
import { formatDate, formatCurrency } from "@/app/lib/utils";

export default function AssayDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const assayId = (params?.assayId as string) || "";
  const router = useRouter();

  const [jobCard, setJobCard] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commodityPrice, setCommodityPrice] = useState<number | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [totalUsd, setTotalUsd] = useState<number | null>(null);
  const [totalGhs, setTotalGhs] = useState<number | null>(null);

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
          // Use stored commodity price from assay if available
          const assay = data?.assays?.find(
            (a: any) => String(a.id) === String(assayId)
          );
          if (assay?.commodityPrice != null) {
            setCommodityPrice(Number(assay.commodityPrice));
          } else {
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

  // Compute totals whenever assay, commodityPrice or exchangeRate change
  useEffect(() => {
    if (!jobCard) return;
    const assay = jobCard?.assays?.find(
      (a: any) => String(a.id) === String(assayId)
    );
    if (!assay) return;

    // Use stored values from database if available, otherwise calculate
    if (assay.totalUsdValue != null) {
      setTotalUsd(assay.totalUsdValue);
    } else {
      // Fallback calculation if stored value not available
      const measuredSum = (assay.measurements || []).reduce(
        (acc: number, m: any) =>
          acc +
          convertToGrams(
            m.netWeight,
            m?.unitOfMeasure ?? jobCard?.unitOfMeasure
          ),
        0
      );
      const netWeightGrams = measuredSum;
      const GRAMS_PER_TROY_OUNCE = 31.1035;
      if (commodityPrice != null && netWeightGrams > 0) {
        const ounces = netWeightGrams / GRAMS_PER_TROY_OUNCE;
        const usd = ounces * commodityPrice;
        setTotalUsd(usd);
      }
    }

    // Use stored GHS value if available
    if (assay.totalGhsValue != null) {
      setTotalGhs(assay.totalGhsValue);
    } else if (exchangeRate != null && totalUsd != null) {
      setTotalGhs(totalUsd * exchangeRate);
    }
  }, [jobCard, assayId, commodityPrice, exchangeRate, totalUsd]);

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <span className="ml-2 text-gray-500">Loading assay...</span>
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
          <button
            className="px-3 py-1 bg-gray-100 rounded"
            onClick={() => router.back()}
          >
            Back
          </button>
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
        <div className="mt-4">
          <BackLink href={`/job-cards/${id}`} label="Back to Job Card" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <BackLink href={`/job-cards/${id}`} label="Back to Job Card" />
        <div className="flex items-center gap-3">
          <AssayDetailActions
            jobCardId={id}
            assayId={assayId}
            // signatoryName="Dr. John Smith"
            // signatoryPosition="Chief Assayer"
          />
        </div>
      </div>

      <div id="assay-detail-content" className="bg-white overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-base leading-6 font-medium text-gray-900">
            Certificate #{assay.certificateNumber || "-"}
          </h3>
        </div>

        <div className="flex items-center justify-between mb-1 px-8">
          <div className="p-2">
            <img
              src="/goldbod-logo-green.png"
              alt="GoldBod Logo"
              className="h-12 w-auto"
            />
          </div>

          {/* <div className="bg-white p-4">
            <img
              src="/coat-of-arms.jpg"
              alt="Coat of Arms"
              className="h-20 w-auto"
            />
          </div> */}

          {/* <div className="bg-white p-4">
            <img src="/seal.png" alt="Seal" className="h-20 w-auto" />
          </div> */}
        </div>

        <div className="border-t border-gray-200 px-4 py-3 sm:p-4">
          <div className="flex justify-center">
            <h1 className="text-xl font-bold tracking-wider">
              ASSAY REPORT ANALYSIS
            </h1>
          </div>
          {/* Top: show exporter and assay date above the measurements table */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Exporter</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {jobCard?.exporter?.name || "-"}
              </dd>
            </div>
            <div className="text-right">
              <dt className="text-sm font-medium text-gray-500">Assay Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {assay.assayDate
                  ? formatDate(new Date(assay.assayDate))
                  : formatDate(new Date(assay.createdAt || Date.now()))}
              </dd>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Reference</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {jobCard?.referenceNumber || "-"}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">
                Shipment Type
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {assay?.shipmentType?.name || "-"}
              </dd>
            </div>
          </div>

          <div className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Exporter Values (top left) */}
              <div className="bg-white overflow-hidden">
                <div className="px-4 py-2 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-900">
                    EXPORTER VALUES
                  </h4>
                </div>
                <div>
                  <table className="w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Gross Weight
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Fineness
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Net Weight
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {jobCard?.totalGrossWeight != null
                            ? Number(jobCard.totalGrossWeight).toFixed(2)
                            : assay.jbGrossWeight != null
                            ? Number(assay.jbGrossWeight).toFixed(2)
                            : "-"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {jobCard?.fineness != null
                            ? Number(jobCard.fineness).toFixed(2)
                            : assay.jbFineness != null
                            ? Number(assay.jbFineness).toFixed(2)
                            : "-"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {jobCard?.totalNetWeight != null
                            ? Number(jobCard.totalNetWeight).toFixed(2)
                            : assay.jbNetWeight != null
                            ? Number(assay.jbNetWeight).toFixed(2)
                            : "-"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* GoldBod Values (top right) */}
              <div className="bg-white overflow-hidden">
                <div className="px-4 py-2 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-900">
                    GOLDBOD VALUES
                  </h4>
                </div>
                <div>
                  <table className="w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Gross Weight
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Fineness
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Net Weight
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(assay.measurements || []).map((m: any, idx: number) => (
                        <tr key={m.id || idx}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                            {m.grossWeight != null
                              ? Number(m.grossWeight).toFixed(2)
                              : "-"}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                            {m.fineness ?? "-"}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                            {m.netWeight != null
                              ? Number(m.netWeight).toFixed(2)
                              : "-"}
                          </td>
                        </tr>
                      ))}
                      {/* Total Row */}
                      <tr className="bg-gray-50 font-semibold">
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {(() => {
                            const total = (assay.measurements || []).reduce(
                              (acc: number, m: any) =>
                                acc + (Number(m.grossWeight) || 0),
                              0
                            );
                            return total > 0 ? total.toFixed(2) : "-";
                          })()}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {(() => {
                            const grossTotal = (
                              assay.measurements || []
                            ).reduce(
                              (acc: number, m: any) =>
                                acc + (Number(m.grossWeight) || 0),
                              0
                            );
                            const netTotal = (assay.measurements || []).reduce(
                              (acc: number, m: any) =>
                                acc + (Number(m.netWeight) || 0),
                              0
                            );
                            if (grossTotal > 0 && netTotal > 0) {
                              const fineness = (netTotal / grossTotal) * 100;
                              return fineness.toFixed(2) + "%";
                            }
                            return "-";
                          })()}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {(() => {
                            const total = (assay.measurements || []).reduce(
                              (acc: number, m: any) =>
                                acc + (Number(m.netWeight) || 0),
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

              {/* Exporter Summary (bottom left) */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-3">
                  Exporter Valuation Summary
                </h5>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <dt className="text-sm font-medium text-gray-500">
                        Weight in Ounces:
                      </dt>
                      <dd className="text-sm font-semibold text-gray-900">
                        {jobCard?.numberOfOunces != null
                          ? Number(jobCard.numberOfOunces).toFixed(3)
                          : assay.jbWeightInOz != null
                          ? Number(assay.jbWeightInOz).toFixed(3)
                          : "0.000"}{" "}
                        oz
                      </dd>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <dt className="text-sm font-medium text-gray-500">
                        Price per Ounce:
                      </dt>
                      <dd className="text-sm font-semibold text-gray-900">
                        {jobCard?.pricePerOunce != null
                          ? formatCurrency(jobCard.pricePerOunce, "USD")
                          : assay.jbPricePerOz != null
                          ? formatCurrency(assay.jbPricePerOz, "USD")
                          : formatCurrency(0, "USD")}
                      </dd>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <dt className="text-sm font-medium text-gray-500">
                        Total USD Value:
                      </dt>
                      <dd className="text-sm font-semibold text-gray-900">
                        {jobCard?.valueUsd != null
                          ? formatCurrency(jobCard.valueUsd, "USD")
                          : assay.jbTotalUsdValue != null
                          ? formatCurrency(assay.jbTotalUsdValue, "USD")
                          : formatCurrency(0, "USD")}
                      </dd>
                    </div>
                  </div>

                  {/* <div>
                    <div className="flex items-center gap-2">
                      <dt className="text-sm font-medium text-gray-500">
                        Total GHS Value:
                      </dt>
                      <dd className="text-sm font-semibold text-gray-900">
                        {jobCard?.valueGhs != null
                          ? formatCurrency(jobCard.valueGhs, "GHS")
                          : assay.jbTotalGhsValue != null
                          ? formatCurrency(assay.jbTotalGhsValue, "GHS")
                          : formatCurrency(0, "GHS")}
                      </dd>
                    </div>
                  </div> */}
                </div>
              </div>

              {/* GoldBod Valuation Summary (bottom right) */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-3">
                  GOLDBOD Valuation Summary
                </h5>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <dt className="text-sm font-medium text-gray-500">
                        Weight in Ounces:
                      </dt>
                      <dd className="text-sm font-semibold text-gray-900">
                        {assay.weightInOz != null
                          ? Number(assay.weightInOz).toFixed(3)
                          : (() => {
                              const totalGrams = (
                                assay.measurements || []
                              ).reduce(
                                (acc: number, m: any) =>
                                  acc +
                                  convertToGrams(
                                    m.netWeight,
                                    m?.unitOfMeasure ?? jobCard?.unitOfMeasure
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
                        Price per Ounce:
                      </dt>
                      <dd className="text-sm font-semibold text-gray-900">
                        {assay.pricePerOz != null
                          ? formatCurrency(assay.pricePerOz, "USD")
                          : assay.comments && typeof assay.comments === "string"
                          ? (() => {
                              try {
                                const parsed = JSON.parse(
                                  assay.comments || "{}"
                                );
                                const mp = parsed?.meta?.dailyPrice;
                                return mp != null
                                  ? formatCurrency(mp, "USD")
                                  : commodityPrice != null
                                  ? formatCurrency(commodityPrice, "USD")
                                  : formatCurrency(0, "USD");
                              } catch {
                                return commodityPrice != null
                                  ? formatCurrency(commodityPrice, "USD")
                                  : formatCurrency(0, "USD");
                              }
                            })()
                          : assay.comments?.meta?.dailyPrice != null
                          ? formatCurrency(
                              assay.comments.meta.dailyPrice,
                              "USD"
                            )
                          : commodityPrice != null
                          ? formatCurrency(commodityPrice, "USD")
                          : formatCurrency(0, "USD")}
                      </dd>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <dt className="text-sm font-medium text-gray-500">
                        Total USD Value:
                      </dt>
                      <dd className="text-sm font-semibold text-gray-900">
                        {assay.totalUsdValue != null
                          ? formatCurrency(assay.totalUsdValue, "USD")
                          : assay.comments && typeof assay.comments === "string"
                          ? (() => {
                              try {
                                const parsed = JSON.parse(
                                  assay.comments || "{}"
                                );
                                const v = parsed?.meta?.valueUsd;
                                return v != null
                                  ? formatCurrency(v, "USD")
                                  : totalUsd != null
                                  ? formatCurrency(totalUsd, "USD")
                                  : formatCurrency(0, "USD");
                              } catch {
                                return totalUsd != null
                                  ? formatCurrency(totalUsd, "USD")
                                  : formatCurrency(0, "USD");
                              }
                            })()
                          : assay.comments?.meta?.valueUsd != null
                          ? formatCurrency(assay.comments.meta.valueUsd, "USD")
                          : totalUsd != null
                          ? formatCurrency(totalUsd, "USD")
                          : formatCurrency(0, "USD")}
                      </dd>
                    </div>
                  </div>

                  {/* <div>
                    <div className="flex items-center gap-2">
                      <dt className="text-sm font-medium text-gray-500">
                        Total GHS Value:
                      </dt>
                      <dd className="text-sm font-semibold text-gray-900">
                        {assay.totalGhsValue != null
                          ? formatCurrency(assay.totalGhsValue, "GHS")
                          : totalGhs != null
                          ? formatCurrency(totalGhs, "GHS")
                          : formatCurrency(0, "GHS")}
                      </dd>
                    </div>
                  </div> */}
                </div>
              </div>
            </div>
          </div>

          {/* Assay details moved to bottom with labels */}
          <div className="mt-4 border-t pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {/* <div>
                <div className="border-b border-gray-400 mb-2 pt-4"></div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-medium text-gray-500 text-center">
                    GOLDBOD Authorized Signatory
                  </dt>
                  <dd className="text-xs text-gray-900 text-center">
                    {assay.signatory || assay.comments?.signatory || "-"}
                  </dd>
                </div>
              </div> */}

              <div>
                <div className="flex items-center gap-2">
                  <dt className="text-xs font-medium text-gray-500 text-center">
                    Security Seal No.:
                  </dt>
                  <dd className="text-xs text-gray-900 text-center">
                    {assay.securitySealNo || "-"}
                  </dd>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <dt className="text-xs font-medium text-gray-500 text-center">
                    GOLDBOD Seal No.:
                  </dt>
                  <dd className="text-xs text-gray-900 text-center">
                    {assay.goldbodSealNo || "-"}
                  </dd>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <dt className="text-xs font-medium text-gray-500 text-center">
                    Customs Seal No.:
                  </dt>
                  <dd className="text-xs text-gray-900 text-center">
                    {assay.customsSealNo || "-"}
                  </dd>
                </div>
              </div>
            </div>

            {/* Signatories */}
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <div className="border-b border-gray-400 mb-2 pt-4"></div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-medium text-gray-500 text-center">
                    Exporter Authorized Signatory
                  </dt>
                  <dd className="text-xs text-gray-900 text-center">
                    {jobCard?.exporter?.authorizedSignatory ||
                      jobCard?.exporter?.contactPerson ||
                      "-"}
                  </dd>
                </div>
              </div>

              <div>
                <div className="border-b border-gray-400 mb-2 pt-4"></div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-medium text-gray-500 text-center">
                    Customs Officer
                  </dt>
                  <dd className="text-xs text-gray-900 text-center">
                    {jobCard?.customsOfficer?.name || "-"}
                  </dd>
                </div>
              </div>

              <div>
                <div className="border-b border-gray-400 mb-2 pt-4"></div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-medium text-gray-500 text-center">
                    Technical Director
                  </dt>
                  <dd className="text-xs text-gray-900 text-center">
                    {jobCard?.technicalDirector?.name || "-"}
                  </dd>
                </div>
              </div>

              <div>
                <div className="border-b border-gray-400 mb-2 pt-4"></div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-medium text-gray-500 text-center">
                    Assay Officer
                  </dt>
                  <dd className="text-xs text-gray-900 text-center">
                    {assay.signatory || assay.comments?.signatory || "-"}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
