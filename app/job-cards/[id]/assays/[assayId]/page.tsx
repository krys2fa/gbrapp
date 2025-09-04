"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import BackLink from "@/app/components/ui/BackLink";
import { formatDate, formatExchangeRate } from "@/app/lib/utils";

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

  // Compute totals whenever assay, commodityPrice or exchangeRate change
  useEffect(() => {
    if (!jobCard) return;
    const assay = jobCard?.assays?.find(
      (a: any) => String(a.id) === String(assayId)
    );
    if (!assay) return;
    // sum net weight from measurements only, converting each measurement to grams
    const measuredSum = (assay.measurements || []).reduce(
      (acc: number, m: any) =>
        acc +
        convertToGrams(m.netWeight, m?.unitOfMeasure ?? jobCard?.unitOfMeasure),
      0
    );
    const netWeightGrams = measuredSum; // do not fall back to jobCard values
    // commodityPrice is expected to be price per troy ounce. Convert grams -> troy ounces
    const GRAMS_PER_TROY_OUNCE = 31.1034768;
    if (commodityPrice != null && netWeightGrams > 0) {
      const ounces = netWeightGrams / GRAMS_PER_TROY_OUNCE;
      const usd = ounces * commodityPrice;
      setTotalUsd(usd);
      // Only compute GHS if a valid exchangeRate is present; do not use jobCard values
      if (exchangeRate != null) {
        setTotalGhs(usd * exchangeRate);
      } else {
        setTotalGhs(null);
      }
    }
  }, [jobCard, assayId, commodityPrice, exchangeRate]);

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center">
          <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin" />
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              try {
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                downloadCertificate();
              } catch (e) {
                console.error(e);
                alert("Failed to generate certificate for printing.");
              }
            }}
            className="inline-flex items-center px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
          >
            Download
          </button>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-base leading-6 font-medium text-gray-900">
            Certificate #{assay.certificateNumber || "-"}
          </h3>
          {/* <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Assay details and measurements
          </p> */}
        </div>

        <div className="flex items-center justify-between mb-1 px-8">
          <div className="p-2">
            <img
              src="/goldbod-logo-black.png"
              alt="GoldBod Logo"
              className="h-12 w-auto"
            />
          </div>

          <div className="flex justify-center">
            <h1 className="text-xl font-bold tracking-wider">
              ASSAY REPORT ANALYSIS
            </h1>
          </div>

          <div className="bg-white p-4">
            <img
              src="/coat-of-arms.jpg"
              alt="Coat of Arms"
              className="h-20 w-auto"
            />
          </div>

          <div className="bg-white p-4">
            <img
              src="/seal.png"
              alt="Seal"
              className="h-20 w-auto"
            />
          </div>
        </div>

        <div className="border-t border-gray-200 px-4 py-3 sm:p-4">
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
                {jobCard?.shipmentType?.name || "-"}
              </dd>
            </div>
          </div>

          <div className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Exporter Values (top left) */}
              <div className="bg-white border rounded overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900">
                    EXPORTER VALUES
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
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
                            : jobCard?.grossWeight != null
                            ? Number(jobCard.grossWeight).toFixed(2)
                            : "-"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {jobCard?.fineness ??
                            jobCard?.declaredFineness ??
                            "-"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {jobCard?.totalNetWeight != null
                            ? Number(jobCard.totalNetWeight).toFixed(2)
                            : "-"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* GoldBod Values (top right) */}
              <div className="bg-white border rounded overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900">
                    GOLDBOD VALUES
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
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
                        {jobCard?.totalNetWeight != null
                          ? (() => {
                              const netWeightGrams = convertToGrams(
                                jobCard.totalNetWeight,
                                jobCard?.unitOfMeasure
                              );
                              const GRAMS_PER_TROY_OUNCE = 31.1034768;
                              const oz = netWeightGrams / GRAMS_PER_TROY_OUNCE;
                              return netWeightGrams > 0
                                ? oz.toFixed(3)
                                : "0.000";
                            })()
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
                          ? `$${Number(jobCard.pricePerOunce).toFixed(2)}`
                          : "$0.00"}
                      </dd>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <dt className="text-sm font-medium text-gray-500">
                        Total USD Value:
                      </dt>
                      <dd className="text-sm font-semibold text-gray-900">
                        {jobCard?.totalUsdValue != null
                          ? `$${Number(jobCard.totalUsdValue).toFixed(2)}`
                          : "$0.00"}
                      </dd>
                    </div>
                  </div>
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
                        {(() => {
                          const totalGrams = (assay.measurements || []).reduce(
                            (acc: number, m: any) =>
                              acc +
                              convertToGrams(
                                m.netWeight,
                                m?.unitOfMeasure ?? jobCard?.unitOfMeasure
                              ),
                            0
                          );
                          const GRAMS_PER_TROY_OUNCE = 31.1034768;
                          const oz = totalGrams / GRAMS_PER_TROY_OUNCE;
                          return totalGrams > 0 ? oz.toFixed(2) : "0.00";
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
                        {assay.comments && typeof assay.comments === "string"
                          ? (() => {
                              try {
                                const parsed = JSON.parse(
                                  assay.comments || "{}"
                                );
                                const mp = parsed?.meta?.dailyPrice;
                                return mp != null
                                  ? `$${Number(mp).toFixed(2)}`
                                  : commodityPrice != null
                                  ? `$${commodityPrice.toFixed(2)}`
                                  : "$0.00";
                              } catch {
                                return commodityPrice != null
                                  ? `$${commodityPrice.toFixed(2)}`
                                  : "$0.00";
                              }
                            })()
                          : assay.comments?.meta?.dailyPrice != null
                          ? `$${Number(assay.comments.meta.dailyPrice).toFixed(
                              2
                            )}`
                          : commodityPrice != null
                          ? `$${commodityPrice.toFixed(2)}`
                          : "$0.00"}
                      </dd>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <dt className="text-sm font-medium text-gray-500">
                        Total USD Value:
                      </dt>
                      <dd className="text-sm font-semibold text-gray-900">
                        {assay.comments && typeof assay.comments === "string"
                          ? (() => {
                              try {
                                const parsed = JSON.parse(
                                  assay.comments || "{}"
                                );
                                const v = parsed?.meta?.valueUsd;
                                return v != null
                                  ? `$${Number(v).toFixed(2)}`
                                  : totalUsd != null
                                  ? `$${totalUsd.toFixed(2)}`
                                  : "$0.00";
                              } catch {
                                return totalUsd != null
                                  ? `$${totalUsd.toFixed(2)}`
                                  : "$0.00";
                              }
                            })()
                          : assay.comments?.meta?.valueUsd != null
                          ? `$${Number(assay.comments.meta.valueUsd).toFixed(
                              2
                            )}`
                          : totalUsd != null
                          ? `$${totalUsd.toFixed(2)}`
                          : "$0.00"}
                      </dd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Assay details moved to bottom with labels */}
          <div className="mt-4 border-t pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <div className="border-b border-gray-400 mb-2 pt-4"></div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-medium text-gray-500 text-center">
                    GOLDBOD Authorized Signatory
                  </dt>
                  <dd className="text-xs text-gray-900 text-center">
                    {assay.signatory || assay.comments?.signatory || "-"}
                  </dd>
                </div>
              </div>

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
                    {jobCard?.customsOfficer || "-"}
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
                    {jobCard?.technicalDirector || "-"}
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

function downloadCertificate() {
  // Clone the visible certificate card and open a print window that includes the page's styles
  try {
    const card =
      document.querySelector(".bg-white.shadow") ||
      document.querySelector("main") ||
      document.body;
    if (!card) {
      alert("Certificate content not found on page.");
      return;
    }

    const cloned = card.cloneNode(true) as HTMLElement;

    // Find the two-column grid wrapper and mark it for print layout
    try {
      const elements = Array.from(cloned.querySelectorAll("*"));
      for (const el of elements) {
        if (
          el.classList &&
          el.classList.contains("grid") &&
          el.classList.contains("grid-cols-1") &&
          el.classList.contains("sm:grid-cols-2")
        ) {
          el.classList.add("print-two-column");
          break;
        }
      }
      // Also find the assay details 4-column grid and mark it so print forces 4 columns
      try {
        const assayGrids = Array.from(
          cloned.querySelectorAll(".grid.grid-cols-1.sm\\:grid-cols-4")
        );
        assayGrids.forEach((g) => g.classList.add("print-grid-cols-4"));
      } catch (e) {
        // ignore
      }
    } catch (e) {
      // ignore
    }

    // Collect stylesheet and style tags from the current document head to preserve page styles
    const headStyles = Array.from(
      document.querySelectorAll('link[rel="stylesheet"], style')
    )
      .map((n) => n.outerHTML)
      .join("\n");

    const title =
      document.querySelector("h3")?.textContent?.trim() ||
      document.title ||
      "Certificate";

    // Print-specific tweaks: force two-column flex for print, keep table borders
    const printTweaks = `@page{size:auto;margin:20mm;} .print-two-column{display:flex;gap:16px;align-items:flex-start} .print-two-column > div{flex:1} table{border-collapse:collapse} th,td{border:1px solid #ccc;padding:8px;text-align:left} .print-grid-cols-4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}`;

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>${headStyles}<style>${printTweaks}</style></head><body>${
      (cloned as HTMLElement).outerHTML
    }</body></html>`;

    const w = window.open("", "_blank");
    if (!w) {
      alert("Please allow popups to download the certificate.");
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
    }, 400);
  } catch (e) {
    console.error(e);
    alert("Failed to generate certificate.");
  }
}
