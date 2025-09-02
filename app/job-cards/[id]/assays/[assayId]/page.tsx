"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import BackLink from "@/app/components/ui/BackLink";
import { formatDate } from "@/app/lib/utils";

export default function AssayDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "";
  const assayId = (params?.assayId as string) || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [jobCard, setJobCard] = useState<any | null>(null);
  const [commodityPrice, setCommodityPrice] = useState<number | null>(null);
  const [commodityName, setCommodityName] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null); // USD -> GHS
  const [totalUsd, setTotalUsd] = useState<number | null>(null);
  const [totalGhs, setTotalGhs] = useState<number | null>(null);

  // Helper to normalize units and convert a numeric value to grams
  const convertToGrams = (value: any, unit?: string) => {
    const n = Number(value) || 0;
    if (n === 0) return 0;
    const u = (unit || jobCard?.unitOfMeasure || "")
      .toString()
      .toLowerCase()
      .trim();
    if (!u) return n; // assume grams
    if (u === "kg" || u === "kilogram" || u === "kilograms") return n * 1000;
    if (u === "g" || u === "gram" || u === "grams") return n;
    // support common variations
    if (u === "kgs") return n * 1000;
    if (u === "lb" || u === "lbs" || u === "pound" || u === "pounds")
      return n * 453.59237;
    return n; // fallback: assume grams
  };

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/job-cards/${id}`);
        if (!res.ok) throw new Error("Failed to load job card");
        const jc = await res.json();
        if (!mounted) return;
        setJobCard(jc);
        // After loading the job card, attempt to fetch commodity price and exchange rate
        try {
          // load available commodities
          const comRes = await fetch(`/api/commodity`);
          const comList = comRes.ok ? await comRes.json() : [];
          // try to pick a commodity that looks like gold
          const chosen =
            comList.find((c: any) => /gold/i.test(c.name)) || comList[0];
          if (chosen) {
            setCommodityName(chosen.name || null);
            const priceRes = await fetch(
              `/api/daily-prices?type=COMMODITY&itemId=${chosen.id}`
            );
            if (priceRes.ok) {
              const prices = await priceRes.json();
              const todayPrice = prices?.[0];
              if (todayPrice) setCommodityPrice(Number(todayPrice.price));
            }
          }
          // fetch latest exchange rate (USD->GHS) - fallback to jobCard provided values
          const exRes = await fetch(`/api/daily-prices?type=EXCHANGE`);
          if (exRes.ok) {
            const exPrices = await exRes.json();
            // try to find an exchange with symbol GHS or name containing Ghana
            const exPick =
              exPrices.find((p: any) => p.exchange?.symbol === "GHS") ||
              exPrices[0];
            if (exPick) setExchangeRate(Number(exPick.price));
          }
        } catch (e) {
          // ignore optional pricing failures
          console.debug("Failed to fetch commodity/exchange prices", e);
        }
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "Failed to load data");
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
      {/* Header: centered title only (logo and coat omitted for now) */}
      <div className="mb-4">
        <div className="flex justify-center">
          <h1 className="text-2xl font-bold tracking-wider">ASSAY REPORT</h1>
        </div>
      </div>
      <div className="mb-6 flex items-center justify-between">
        <BackLink href={`/job-cards/${id}`} label="Back to Job Card" />
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-medium">Valuation Details</h2>
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
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Certificate #{assay.certificateNumber || "-"}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Assay details and measurements
          </p>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          {/* Top: show exporter and assay date above the measurements table */}
          <div className="flex items-center justify-between mb-6">
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

          <div className="flex items-center justify-between mb-6">
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

          <div className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Exporter Values (left column) - styled table, only specific fields */}
              <div className="bg-white border rounded overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900">
                    Exporter Values
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Net Weight (g)
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Gross Weight (g)
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Fineness
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {jobCard?.totalNetWeight ?? "-"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {jobCard?.totalGrossWeight ??
                            jobCard?.grossWeight ??
                            "-"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {jobCard?.fineness ??
                            jobCard?.declaredFineness ??
                            "-"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Measurements table (right) */}
              <div>
                <div className="bg-white border rounded overflow-hidden">
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900">
                      GoldBod Values
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Piece
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Gross Weight
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Water Weight
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
                        {(assay.measurements || []).map(
                          (m: any, idx: number) => (
                            <tr key={m.id || idx}>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                {m.piece ?? m.pieceNumber ?? idx + 1}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                {m.grossWeight ?? "-"}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                {m.waterWeight ?? "-"}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                {m.fineness ?? "-"}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                {m.netWeight ?? "-"}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-2 text-sm font-medium text-gray-700"
                          >
                            Total Net Weight
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {(() => {
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
                              const GRAMS_PER_TROY_OUNCE = 31.1034768;
                              const oz = totalGrams / GRAMS_PER_TROY_OUNCE;
                              return totalGrams > 0
                                ? `${totalGrams.toFixed(3)} g (${oz.toFixed(
                                    3
                                  )} oz)`
                                : "-";
                            })()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Assay details moved to bottom with labels */}
          <div className="mt-6 border-t pt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">
              Assay Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* <div>
                <dt className="text-sm font-medium text-gray-500">Assay Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {assay.assayDate
                    ? formatDate(new Date(assay.assayDate))
                    : formatDate(new Date(assay.createdAt || Date.now()))}
                </dd>
              </div> */}
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Authorized Signatory
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {assay.signatory || assay.comments?.signatory || "-"}
                </dd>
              </div>
              {/* <div>
                <dt className="text-sm font-medium text-gray-500">
                  Gold / Silver
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {assay.goldContent ?? "-"}% / {assay.silverContent ?? "-"}%
                </dd>
              </div> */}
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* <div>
                <dt className="text-sm font-medium text-gray-500">Shipment Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{jobCard?.shipmentType?.name || "-"}</dd>
              </div> */}
              {/* <div>
                <dt className="text-sm font-medium text-gray-500">Job Card</dt>
                <dd className="mt-1 text-sm text-gray-900">{jobCard?.referenceNumber || "-"}</dd>
              </div> */}
              {/* <div>
                <dt className="text-sm font-medium text-gray-500">
                  Destination Country
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {jobCard?.destinationCountry || "-"}
                </dd>
              </div> */}
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* <div>
                <dt className="text-sm font-medium text-gray-500">Exporter</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {jobCard?.exporter?.name || "-"}
                </dd>
              </div> */}
              {/* <div>
                <dt className="text-sm font-medium text-gray-500">
                  Assay Number
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {assay.certificateNumber || "-"}
                </dd>
              </div> */}
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Commodity Price (per oz)
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {assay.comments && typeof assay.comments === "string"
                    ? (() => {
                        try {
                          const parsed = JSON.parse(assay.comments || "{}");
                          const mp = parsed?.meta?.dailyPrice;
                          return mp != null
                            ? `$${Number(mp).toFixed(2)}`
                            : commodityPrice != null
                            ? `$${commodityPrice.toFixed(2)}`
                            : "-";
                        } catch {
                          return commodityPrice != null
                            ? `$${commodityPrice.toFixed(2)}`
                            : "-";
                        }
                      })()
                    : assay.comments?.meta?.dailyPrice != null
                    ? `$${Number(assay.comments.meta.dailyPrice).toFixed(2)}`
                    : commodityPrice != null
                    ? `$${commodityPrice.toFixed(2)}`
                    : "-"}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Exchange Rate (USD→GHS)
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {assay.comments && typeof assay.comments === "string"
                    ? (() => {
                        try {
                          const parsed = JSON.parse(assay.comments || "{}");
                          const v = parsed?.meta?.dailyExchange;
                          return v != null
                            ? v
                            : exchangeRate != null
                            ? exchangeRate
                            : "-";
                        } catch {
                          return exchangeRate != null ? exchangeRate : "-";
                        }
                      })()
                    : assay.comments?.meta?.dailyExchange != null
                    ? assay.comments.meta.dailyExchange
                    : exchangeRate != null
                    ? exchangeRate
                    : "-"}
                </dd>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Total Value (USD)
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {assay.comments && typeof assay.comments === "string"
                    ? (() => {
                        try {
                          const parsed = JSON.parse(assay.comments || "{}");
                          const v = parsed?.meta?.valueUsd;
                          return v != null
                            ? `$${Number(v).toFixed(2)}`
                            : totalUsd != null
                            ? `$${totalUsd.toFixed(2)}`
                            : "-";
                        } catch {
                          return totalUsd != null
                            ? `$${totalUsd.toFixed(2)}`
                            : "-";
                        }
                      })()
                    : assay.comments?.meta?.valueUsd != null
                    ? `$${Number(assay.comments.meta.valueUsd).toFixed(2)}`
                    : totalUsd != null
                    ? `$${totalUsd.toFixed(2)}`
                    : "-"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Total Value (GHS)
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {assay.comments && typeof assay.comments === "string"
                    ? (() => {
                        try {
                          const parsed = JSON.parse(assay.comments || "{}");
                          const v = parsed?.meta?.valueGhs;
                          return v != null
                            ? `GHS ${Number(v).toFixed(2)}`
                            : totalGhs != null
                            ? `GHS ${totalGhs.toFixed(2)}`
                            : "-";
                        } catch {
                          return totalGhs != null
                            ? `GHS ${totalGhs.toFixed(2)}`
                            : "-";
                        }
                      })()
                    : assay.comments?.meta?.valueGhs != null
                    ? `GHS ${Number(assay.comments.meta.valueGhs).toFixed(2)}`
                    : totalGhs != null
                    ? `GHS ${totalGhs.toFixed(2)}`
                    : "-"}
                </dd>
              </div>
              {/* <div>
                <dt className="text-sm font-medium text-gray-500">
                  Exchange Rate (USD→GHS)
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {assay.comments && typeof assay.comments === "string"
                    ? (() => {
                        try {
                          const parsed = JSON.parse(assay.comments || "{}");
                          const v = parsed?.meta?.dailyExchange;
                          return v != null
                            ? v
                            : exchangeRate != null
                            ? exchangeRate
                            : "-";
                        } catch {
                          return exchangeRate != null ? exchangeRate : "-";
                        }
                      })()
                    : assay.comments?.meta?.dailyExchange != null
                    ? assay.comments.meta.dailyExchange
                    : exchangeRate != null
                    ? exchangeRate
                    : "-"}
                </dd>
              </div> */}
            </div>

            <div className="mt-4">
              <dt className="text-sm font-medium text-gray-500">
                Total Net Weight (oz)
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {(() => {
                  // Accumulate net weight from assay measurements only,
                  // converting each measurement into grams according to the job card unit
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
                  return totalGrams > 0 ? oz.toFixed(3) : "-";
                })()}
              </dd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function downloadCertificate() {
  // locate the assay and jobCard from the DOM by expecting the page to have global variables is not possible,
  // so we'll read values from the opener window via document if available. Simpler: serialize content from the current window.
  try {
    const root = document.querySelector("main") || document.body;
    // Build certificate HTML from visible content on the page
    const certificateTitle =
      document.querySelector("h3")?.textContent || "Certificate";
    const detailsElems = Array.from(
      document.querySelectorAll(".px-4.py-5, .border-t")
    );
    // We'll construct a clean certificate using the same visible fields
    const assayHeader =
      document.querySelector("h3")?.outerHTML || `<h3>${certificateTitle}</h3>`;
    // build measurements table rows
    let tableRows = "";
    const rows = document.querySelectorAll("table tbody tr");
    if (rows && rows.length) {
      rows.forEach((r) => {
        tableRows += `<tr>${Array.from(r.querySelectorAll("td"))
          .map(
            (td) =>
              `<td style=\"padding:8px;border:1px solid #ccc\">${
                td.textContent || ""
              }</td>`
          )
          .join("")}</tr>`;
      });
    }

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${certificateTitle}</title><style>body{font-family:Segoe UI,Roboto,Arial,sans-serif;padding:24px;color:#111}h1,h2,h3{margin:0 0 8px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #ccc;padding:8px;text-align:left} .meta{margin-top:12px}</style></head><body><div><h1>Valuation Certificate</h1>${assayHeader}<div class="meta">${Array.from(
      document.querySelectorAll(".grid .text-sm.text-gray-900")
    )
      .map((el) => `<div>${el.textContent}</div>`)
      .join("")}</div><div>${
      document.querySelector("div[ class*='mt-6']")?.innerHTML || ""
    }</div><table><thead><tr><th>Piece</th><th>Gross Weight</th><th>Water Weight</th><th>Fineness</th><th>Net Weight</th></tr></thead><tbody>${tableRows}</tbody></table></div></body></html>`;

    const w = window.open("", "_blank");
    if (!w) {
      alert("Please allow popups to download the certificate.");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    // Delay slightly to ensure resources render then open print dialog
    setTimeout(() => {
      w.print();
    }, 250);
  } catch (e) {
    console.error(e);
    alert("Failed to generate certificate.");
  }
}
