"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useRouter, useParams } from "next/navigation";
import BackLink from "@/app/components/ui/BackLink";
import { formatExchangeRate } from "@/app/lib/utils";

type AssayMethod = "X_RAY" | "WATER_DENSITY";

export default function NewAssayPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [shipmentTypes, setShipmentTypes] = useState<
    { id: string; name: string }[]
  >([]);

  const [commodities, setCommodities] = useState<
    { id: string; name: string }[]
  >([]);

  const [jobCard, setJobCard] = useState<any | null>(null);
  const [dailyPrice, setDailyPrice] = useState<any | null>(null);
  const [weeklyExchange, setWeeklyExchange] = useState<any | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [warning, setWarning] = useState("");
  const [missingTodayCommodity, setMissingTodayCommodity] = useState(false);
  const [missingTodayExchange, setMissingTodayExchange] = useState(false);

  const [form, setForm] = useState({
    method: "X_RAY" as AssayMethod,
    pieces: 1,
    signatory: "",
    comments: "",
    shipmentTypeId: "",
    securitySealNo: "",
    goldbodSealNo: "",
    customsSealNo: "",
  });

  // rows for each piece: grossWeight, waterWeight, fineness (auto), netWeight
  const [rows, setRows] = useState<
    Array<{
      grossWeight?: number;
      waterWeight?: number;
      fineness?: number;
      netWeight?: number;
    }>
  >([{}]);

  // Track fineness warnings with expected values and differences
  const [finenessWarnings, setFinenessWarnings] = useState<
    Array<{
      hasWarning: boolean;
      expectedFineness?: number;
      difference?: number;
    }>
  >([{ hasWarning: false }]);

  // Helper function to calculate expected fineness
  const calculateExpectedFineness = (gross: number, net: number): number => {
    if (typeof gross === "number" && gross > 0 && typeof net === "number") {
      return Number(((net / gross) * 100).toFixed(2));
    }
    return 0;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [shipmentRes] = await Promise.all([fetch("/api/shipment-types")]);
        if (shipmentRes.ok) {
          setShipmentTypes(await shipmentRes.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // fetch job card and today's daily price/exchange for quick meta display
  useEffect(() => {
    if (!id) return;

    const fetchMeta = async () => {
      setMetaLoading(true);
      try {
        const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

        // fetch job card first so we know the commodityId to query
        const jobRes = await fetch(`/api/job-cards/${id}`);
        let jobBody: any = null;
        if (jobRes.ok) {
          jobBody = await jobRes.json().catch(() => null);
          if (jobBody) setJobCard(jobBody);
        }

        // fetch commodities list for name resolution
        const commoditiesRes = await fetch(`/api/commodity`);
        let commoditiesBody: any[] = [];
        if (commoditiesRes && commoditiesRes.ok) {
          commoditiesBody = await commoditiesRes.json().catch(() => []);
        }
        if (commoditiesBody && Array.isArray(commoditiesBody)) {
          setCommodities(commoditiesBody);
        }

        // Fetch commodity prices specifically for this job card's commodity so the
        // server can attempt to fetch & persist today's price if missing.
        let commodityPrices: any[] = [];
        if (jobBody?.commodityId) {
          const cpRes = await fetch(
            `/api/daily-prices?type=COMMODITY&itemId=${jobBody.commodityId}`
          );
          if (cpRes && cpRes.ok) {
            commodityPrices = await cpRes.json().catch(() => []);
          }
        } else {
          // fallback: fetch all commodity prices
          const cpRes = await fetch(`/api/daily-prices?type=COMMODITY`);
          if (cpRes && cpRes.ok)
            commodityPrices = await cpRes.json().catch(() => []);
        }

        // Fetch exchange prices (no itemId) and use latest/existing entries
        let exchangePrices: any[] = [];
        const exRes = await fetch(`/api/weekly-prices?type=EXCHANGE`);
        if (exRes && exRes.ok)
          exchangePrices = await exRes.json().catch(() => []);

        const latestByDate = (items: any[]) =>
          items
            .slice()
            .sort(
              (a: any, b: any) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )[0];

        const today = date;

        const todayCommodityMatches = (commodityPrices || []).filter(
          (p: any) => String(p?.createdAt || "").split("T")[0] === today
        );
        const todaysExchangeMatches = (exchangePrices || []).filter(
          (p: any) => String(p?.weekStartDate || "").split("T")[0] === today
        );

        const commodityEntry =
          latestByDate(
            todayCommodityMatches.filter((p: any) => p.type === "COMMODITY")
          ) ||
          latestByDate(
            (commodityPrices || []).filter((p: any) => p.type === "COMMODITY")
          ) ||
          null;

        const exchangeEntry =
          latestByDate(
            todaysExchangeMatches.filter((p: any) => p.type === "EXCHANGE")
          ) ||
          latestByDate(
            (exchangePrices || []).filter((p: any) => p.type === "EXCHANGE")
          ) ||
          null;

        setMissingTodayCommodity(todayCommodityMatches.length === 0);
        setMissingTodayExchange(todaysExchangeMatches.length === 0);

        setDailyPrice({
          value: commodityEntry ? Number(commodityEntry.price) : null,
        });
        setWeeklyExchange({
          value: exchangeEntry ? Number(exchangeEntry.price) : null,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setMetaLoading(false);
      }
    };

    fetchMeta();
  }, [id]);

  // Auto-populate signatory fields from job card data
  useEffect(() => {
    if (jobCard) {
      setForm((prevForm) => ({
        ...prevForm,
        signatory:
          jobCard.customsOfficer?.name ||
          jobCard.assayOfficer?.name ||
          prevForm.signatory,
        securitySealNo:
          jobCard.seals?.find((s: any) => s.sealType === "CUSTOMS_SEAL")
            ?.sealNumber || prevForm.securitySealNo,
        goldbodSealNo:
          jobCard.seals?.find((s: any) => s.sealType === "PMMC_SEAL")
            ?.sealNumber || prevForm.goldbodSealNo,
        customsSealNo:
          jobCard.seals?.find((s: any) => s.sealType === "OTHER_SEAL")
            ?.sealNumber || prevForm.customsSealNo,
      }));
    }
  }, [jobCard]);

  // adjust rows when pieces changes
  useEffect(() => {
    const n = Math.max(0, Number(form.pieces) || 0);
    setRows((prev) => {
      const next = [...prev];
      if (n > next.length) {
        for (let i = next.length; i < n; i++) next.push({});
      } else if (n < next.length) {
        next.length = n;
      }
      return next;
    });
    setFinenessWarnings((prev) => {
      const next = [...prev];
      if (n > next.length) {
        for (let i = next.length; i < n; i++) next.push({ hasWarning: false });
      } else if (n < next.length) {
        next.length = n;
      }
      return next;
    });
  }, [form.pieces]);

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((p) => ({
      ...p,
      [name]: name === "pieces" ? Number(value) : value,
    }));
  };

  const handleRowChange = (index: number, field: string, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      const parsed = value === "" ? undefined : Number(value);
      next[index] = {
        ...next[index],
        [field]: parsed,
      };

      // Get current values for calculation
      const gross = next[index].grossWeight;
      const net = next[index].netWeight;
      const manualFineness = next[index].fineness;

      // If grossWeight or netWeight changed, recompute expected fineness
      if (field === "netWeight" || field === "grossWeight") {
        if (typeof gross === "number" && gross > 0 && typeof net === "number") {
          const expectedFineness = calculateExpectedFineness(gross, net);
          // Only auto-set fineness if it hasn't been manually edited or if it matches expected
          if (
            typeof manualFineness !== "number" ||
            manualFineness === expectedFineness
          ) {
            next[index].fineness = expectedFineness;
          }
          // Update warning state - check if manual fineness differs from expected
          const hasDiscrepancy =
            typeof manualFineness === "number" &&
            manualFineness !== expectedFineness;
          const difference = hasDiscrepancy
            ? manualFineness! - expectedFineness
            : 0;
          setFinenessWarnings((prev) => {
            const newWarnings = [...prev];
            newWarnings[index] = {
              hasWarning: hasDiscrepancy,
              expectedFineness: expectedFineness,
              difference: difference,
            };
            return newWarnings;
          });
        } else {
          // Not enough info to compute
          next[index].fineness = undefined;
          setFinenessWarnings((prev) => {
            const newWarnings = [...prev];
            newWarnings[index] = { hasWarning: false };
            return newWarnings;
          });
        }
      }

      // If fineness is manually edited, check for discrepancy
      if (field === "fineness") {
        if (typeof gross === "number" && gross > 0 && typeof net === "number") {
          const expectedFineness = calculateExpectedFineness(gross, net);
          const hasDiscrepancy =
            typeof parsed === "number" && parsed !== expectedFineness;
          const difference = hasDiscrepancy ? parsed! - expectedFineness : 0;
          setFinenessWarnings((prev) => {
            const newWarnings = [...prev];
            newWarnings[index] = {
              hasWarning: hasDiscrepancy,
              expectedFineness: expectedFineness,
              difference: difference,
            };
            return newWarnings;
          });
        } else {
          // No gross/net to compare against, no warning
          setFinenessWarnings((prev) => {
            const newWarnings = [...prev];
            newWarnings[index] = { hasWarning: false };
            return newWarnings;
          });
        }
      }

      return next;
    });
  };

  // conversion helpers and computed totals for meta bar
  const toOunces = (value: number, unit: string) => {
    if (!value) return 0;
    const u = (unit || "g").toLowerCase();
    if (u === "kg" || u === "kilograms") return value * 35.2739619495804;
    // default grams
    return value / 28.349523125;
  };

  const totalInputNetWeight = rows.reduce(
    (s, r) => s + (Number(r.netWeight) || 0),
    0
  );
  const unitOfMeasure = jobCard?.unitOfMeasure || "g"; // expect 'g' or 'kg' stored on jobCard
  const totalNetWeightOz = toOunces(totalInputNetWeight, unitOfMeasure);
  const totalNetWeightOzDisplay = Number.isFinite(totalNetWeightOz)
    ? totalNetWeightOz
    : 0;

  // Use existing job card values for meta display instead of current form calculations
  const displayNetWeightOz = jobCard?.numberOfOunces || totalNetWeightOzDisplay;
  const displayUsdValue =
    jobCard?.valueUsd ||
    (Number(dailyPrice?.value) || 0) * totalNetWeightOzDisplay;
  const displayGhsValue =
    jobCard?.valueGhs || displayUsdValue * (Number(weeklyExchange?.value) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      // fetch current job card
      const res = await fetch(`/api/job-cards/${id}`);
      if (!res.ok) throw new Error("Failed to load job card");
      const jobCard = await res.json();

      // --- Validation: require meta bar fields and at least one measurement row ---
      const commodityName =
        jobCard?.commodity?.name ||
        commodities.find((c) => c.id === jobCard?.commodityId)?.name ||
        null;

      const metaMissing: string[] = [];
      if (!jobCard?.exporter?.name) metaMissing.push("exporter");
      if (dailyPrice?.value == null) metaMissing.push("daily price");
      if (weeklyExchange?.value == null) metaMissing.push("weekly exchange");
      if (!(jobCard?.referenceNumber || jobCard?.reference))
        metaMissing.push("reference number");
      if (!jobCard?.buyerName) metaMissing.push("buyer");
      if (!jobCard?.destinationCountry) metaMissing.push("destination");
      if (!commodityName) metaMissing.push("commodity");
      if (jobCard?.numberOfBoxes == null) metaMissing.push("number of boxes");
      if (!jobCard?.unitOfMeasure) metaMissing.push("unit of measure");

      const hasMeasurement =
        rows &&
        rows.length > 0 &&
        rows.some((r) => {
          return (
            typeof r.grossWeight === "number" ||
            typeof r.netWeight === "number" ||
            typeof r.waterWeight === "number"
          );
        });
      if (!hasMeasurement) metaMissing.push("at least one measurement row");

      if (metaMissing.length > 0) {
        setError(`Cannot save valuation. Missing: ${metaMissing.join(", ")}`);
        setSaving(false);
        return;
      }

      // If today's price or exchange are missing, block saving and show an error
      if (missingTodayCommodity || missingTodayExchange) {
        const parts: string[] = [];
        if (missingTodayCommodity)
          parts.push("daily commodity price for today");
        if (missingTodayExchange)
          parts.push("weekly exchange rate for current week");
        const msg = `Cannot save valuation: no ${parts.join(
          " and "
        )} set for today. Please add today's prices before saving.`;
        setError(msg);
        toast(msg, { icon: "⚠️" });
        setSaving(false);
        return;
      }

      const newAssay = {
        id: `local-${Date.now()}`,
        method: form.method,
        pieces: Number(form.pieces),
        signatory: form.signatory,
        securitySealNo: form.securitySealNo,
        goldbodSealNo: form.goldbodSealNo,
        customsSealNo: form.customsSealNo,
        measurements: rows.map((r, i) => ({
          piece: i + 1,
          grossWeight: r.grossWeight || 0,
          waterWeight: r.waterWeight || 0,
          fineness: r.fineness || 0,
          netWeight: r.netWeight || 0,
        })),
        // persist a JSON blob in comments so server can store structured metadata
        comments: JSON.stringify({
          note: form.comments || "",
          meta: {
            unit: unitOfMeasure,
            totalNetWeightOz: Number(totalNetWeightOzDisplay.toFixed(4)),
            valueUsd: Number(displayUsdValue.toFixed(4)),
            valueGhs: Number(displayGhsValue.toFixed(4)),
            weeklyExchange: Number(weeklyExchange?.value) || null,
            dailyPrice: Number(dailyPrice?.value) || null,
          },
        }),
        shipmentTypeId: form.shipmentTypeId || null,
        createdAt: new Date().toISOString(),
      };

      const updated = {
        ...jobCard,
        assays: [...(jobCard.assays || []), newAssay],
      };

      // include totals and computed values on the job card update so server persists them
      updated.totalNetWeight =
        totalInputNetWeight || jobCard.totalNetWeight || 0;
      updated.totalNetWeightOz =
        totalNetWeightOzDisplay || jobCard.totalNetWeightOz || 0;
      updated.exporterValueUsd =
        displayUsdValue || jobCard.exporterValueUsd || 0;
      updated.exporterValueGhs =
        displayGhsValue || jobCard.exporterValueGhs || 0;

      const put = await fetch(`/api/job-cards/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!put.ok) {
        const err = await put.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save assay");
      }

      router.push(`/job-cards/${id}`);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <BackLink href={`/job-cards/${id}`} label="Back" />
      </div>

      {/* Meta info bar: exporter, today's price/exchange, reference, buyer, destination, shipment */}
      <div className="mb-4">
        {metaLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-gray-500">Commodity</div>
                <div className="font-medium text-gray-900">
                  {jobCard?.commodity?.name ||
                    commodities.find((c) => c.id === jobCard?.commodityId)
                      ?.name ||
                    "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Unit</div>
                <div className="font-medium text-gray-900">
                  {unitOfMeasure === "kg"
                    ? "kg"
                    : unitOfMeasure === "g"
                    ? "g"
                    : unitOfMeasure}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Exporter</div>
                <div className="font-medium text-gray-900">
                  {jobCard?.exporter?.name || "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">
                  Daily Commodity Price (today)
                </div>
                <div className="font-medium text-gray-900">
                  {dailyPrice?.value != null
                    ? Number(dailyPrice.value).toFixed(2)
                    : "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">
                  Weekly Exchange Price (current week)
                </div>
                <div className="font-medium text-gray-900">
                  {formatExchangeRate(weeklyExchange?.value)}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">Net weight (oz)</div>
                <div className="font-medium text-gray-900">
                  {displayNetWeightOz ? displayNetWeightOz.toFixed(2) : "0.00"}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">Value (USD)</div>
                <div className="font-medium text-gray-900">
                  {displayUsdValue ? displayUsdValue.toFixed(2) : "0.00"}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">Value (GHS)</div>
                <div className="font-medium text-gray-900">
                  {displayGhsValue ? displayGhsValue.toFixed(2) : "0.00"}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">Reference #</div>
                <div className="font-medium text-gray-900">
                  {jobCard?.referenceNumber || jobCard?.reference || "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Buyer</div>
                <div className="font-medium text-gray-900">
                  {jobCard?.buyerName || "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Destination</div>
                <div className="font-medium text-gray-900">
                  {jobCard?.destinationCountry || "-"}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">Number of boxes</div>
                <div className="font-medium text-gray-900">
                  {jobCard?.numberOfBoxes ?? "-"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow sm:rounded-md sm:overflow-hidden">
          <div className="px-4 py-5 sm:p-6 space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* warning is shown via toast; keep warning state for potential future UI needs */}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Assay Method
                </label>
                <select
                  name="method"
                  value={form.method}
                  onChange={handleFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="X_RAY">X-ray</option>
                  <option value="WATER_DENSITY">Water density</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Pieces
                </label>
                <input
                  name="pieces"
                  type="number"
                  min={1}
                  value={form.pieces}
                  onChange={handleFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Authorized Signatory
                </label>
                <input
                  name="signatory"
                  type="text"
                  value={form.signatory}
                  onChange={handleFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Security Seal No.
                </label>
                <input
                  name="securitySealNo"
                  type="text"
                  value={form.securitySealNo}
                  onChange={handleFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="Enter security seal number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  GOLDBOD Seal No.
                </label>
                <input
                  name="goldbodSealNo"
                  type="text"
                  value={form.goldbodSealNo}
                  onChange={handleFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="Enter GOLDBOD seal number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Customs Seal No.
                </label>
                <input
                  name="customsSealNo"
                  type="text"
                  value={form.customsSealNo}
                  onChange={handleFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="Enter customs seal number"
                />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900">
                Piece measurements
              </h4>
              <p className="text-xs text-gray-500">
                Provide measurements for each piece saved.
              </p>
              {/* fineness is always auto-calculated from gross/net */}

              <div className="mt-3 space-y-2">
                {rows.map((r, i) => (
                  <div
                    key={i}
                    className={`grid grid-cols-1 sm:grid-cols-${
                      form.method === "X_RAY" ? "3" : "4"
                    } gap-3 items-end`}
                  >
                    <div>
                      <label className="block text-xs text-gray-600">
                        Gross weight
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={r.grossWeight ?? ""}
                        onChange={(e) =>
                          handleRowChange(i, "grossWeight", e.target.value)
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      />
                    </div>
                    {form.method !== "X_RAY" && (
                      <div>
                        <label className="block text-xs text-gray-600">
                          Water weight
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={r.waterWeight ?? ""}
                          onChange={(e) =>
                            handleRowChange(i, "waterWeight", e.target.value)
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs text-gray-600">
                        Fineness
                      </label>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="number"
                          step="any"
                          value={r.fineness ?? ""}
                          onChange={(e) =>
                            handleRowChange(i, "fineness", e.target.value)
                          }
                          className={`flex-1 rounded-md border-gray-300 shadow-sm ${
                            finenessWarnings[i]?.hasWarning
                              ? "border-yellow-400 bg-yellow-50"
                              : ""
                          }`}
                        />
                        {finenessWarnings[i]?.hasWarning && (
                          <div className="text-yellow-600 text-xs flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span>Different from calculated</span>
                            </div>
                            <div className="text-xs text-yellow-700 ml-5">
                              Expected:{" "}
                              {finenessWarnings[i]?.expectedFineness?.toFixed(
                                2
                              )}
                              %
                              {finenessWarnings[i]?.difference !==
                                undefined && (
                                <span className="ml-2">
                                  (
                                  {finenessWarnings[i]!.difference > 0
                                    ? "+"
                                    : ""}
                                  {finenessWarnings[i]!.difference.toFixed(2)}%)
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">
                        Net weight
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={r.netWeight ?? ""}
                        onChange={(e) =>
                          handleRowChange(i, "netWeight", e.target.value)
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-900">Additional</h4>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Comments
                  </label>
                  <textarea
                    name="comments"
                    value={form.comments}
                    onChange={handleFormChange}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Type of shipment
                  </label>
                  <select
                    name="shipmentTypeId"
                    value={form.shipmentTypeId}
                    onChange={handleFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  >
                    <option value="">Select shipment type</option>
                    {shipmentTypes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              {saving ? "Saving..." : "Save Valuation"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
