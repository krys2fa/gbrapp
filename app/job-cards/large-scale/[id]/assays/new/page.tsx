"use client";

import { withClientAuth } from "@/app/lib/with-client-auth";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useRouter, useParams } from "next/navigation";
import BackLink from "@/app/components/ui/BackLink";
import { formatExchangeRate } from "@/app/lib/utils";

type AssayMethod = "X_RAY" | "WATER_DENSITY";

interface LargeScaleJobCard {
  id: string;
  referenceNumber: string;
  receivedDate: string;
  exporter: {
    id: string;
    name: string;
    exporterType: {
      id: string;
      name: string;
    };
  };
  unitOfMeasure: string;
  status: string;
  notes: string;
  destinationCountry: string;
  sourceOfGold: string;
  numberOfBoxes: number;
  customsOfficer?: {
    id: string;
    name: string;
    badgeNumber: string;
  };
  assayOfficer?: {
    id: string;
    name: string;
    badgeNumber: string;
  };
  technicalDirector?: {
    id: string;
    name: string;
    badgeNumber: string;
  };
  nacobOfficer?: {
    id: string;
    name: string;
    badgeNumber: string;
  };
  nationalSecurityOfficer?: {
    id: string;
    name: string;
    badgeNumber: string;
  };
  consigneeAddress: string;
  consigneeTelephone: string;
  consigneeMobile: string;
  consigneeEmail: string;
  deliveryLocation: string;
  exporterTelephone: string;
  exporterEmail: string;
  exporterWebsite: string;
  exporterLicenseNumber: string;
  notifiedPartyName: string;
  notifiedPartyAddress: string;
  notifiedPartyEmail: string;
  notifiedPartyContactPerson: string;
  notifiedPartyTelephone: string;
  notifiedPartyMobile: string;
  commodities: {
    id: string;
    commodity: {
      id: string;
      name: string;
      symbol: string;
    };
    grossWeight: number;
    netWeight: number;
    fineness: number;
    valueGhs: number;
    valueUsd: number;
    pricePerOunce: number;
    numberOfOunces: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

function NewLargeScaleAssayPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [shipmentTypes, setShipmentTypes] = useState<
    { id: string; name: string }[]
  >([]);

  const [jobCard, setJobCard] = useState<LargeScaleJobCard | null>(null);
  const [commodityPrices, setCommodityPrices] = useState<any[]>([]);
  const [weeklyExchange, setWeeklyExchange] = useState<any | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
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
        const jobRes = await fetch(`/api/large-scale-job-cards/${id}`);
        let jobBody: LargeScaleJobCard | null = null;
        if (jobRes.ok) {
          jobBody = await jobRes.json();
          if (jobBody) setJobCard(jobBody);
        }

        // Fetch commodity prices - for large scale, we need to get prices for all commodities in the job card
        let commodityPrices: any[] = [];
        if (jobBody?.commodities && jobBody.commodities.length > 0) {
          // Get prices for all commodities in the job card
          const commodityIds = jobBody.commodities.map(
            (c: any) => c.commodity.id
          );
          const pricePromises = commodityIds.map((commodityId: string) =>
            fetch(`/api/daily-prices?type=COMMODITY&itemId=${commodityId}`)
              .then((res) => (res.ok ? res.json().catch(() => []) : []))
              .catch(() => [])
          );

          const priceResults = await Promise.all(pricePromises);
          commodityPrices = priceResults.flat(); // Flatten all results into one array
        } else {
          // fallback: fetch all commodity prices
          const cpRes = await fetch(`/api/daily-prices?type=COMMODITY`);
          if (cpRes && cpRes.ok)
            commodityPrices = await cpRes.json().catch(() => []);
        }

        // Fetch exchange prices (only approved ones for production)
        let exchangePrices: any[] = [];
        const exRes = await fetch(
          `/api/weekly-prices?type=EXCHANGE&approvedOnly=true`
        );
        if (exRes && exRes.ok)
          exchangePrices = await exRes.json().catch(() => []);

        console.log("Approved exchange prices from API:", exchangePrices);

        const latestByDate = (items: any[]) =>
          items
            .slice()
            .sort(
              (a: any, b: any) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )[0];

        const today = date;

        // Calculate the start of the current week (Monday) in UTC
        const todayDate = new Date(today + "T00:00:00.000Z");
        const dayOfWeek = todayDate.getUTCDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const weekStart = new Date(todayDate);
        weekStart.setUTCDate(todayDate.getUTCDate() - diff);
        weekStart.setUTCHours(0, 0, 0, 0);
        const currentWeekStart = weekStart.toISOString().split("T")[0];
        console.log("Current week start:", currentWeekStart);
        console.log("Today date:", today);

        const todayCommodityMatches = (commodityPrices || []).filter(
          (p: any) => String(p?.createdAt || "").split("T")[0] === today
        );
        const todaysExchangeMatches = (exchangePrices || []).filter(
          (p: any) => {
            const priceWeekStart = String(p?.weekStartDate || "").split("T")[0];
            const matches = priceWeekStart === currentWeekStart;
            console.log(
              `Exchange rate ${p?.id}: weekStart=${priceWeekStart}, currentWeek=${currentWeekStart}, matches=${matches}`
            );
            return matches;
          }
        );

        console.log("Today's exchange matches:", todaysExchangeMatches);

        // Get commodity entry (can fall back to latest if today's is missing)
        const commodityEntry =
          latestByDate(
            todayCommodityMatches.filter((p: any) => p.type === "COMMODITY")
          ) ||
          latestByDate(
            (commodityPrices || []).filter((p: any) => p.type === "COMMODITY")
          ) ||
          null;

        // Only use exchange rates from the current week - don't fall back to old rates
        const exchangeEntry =
          todaysExchangeMatches.length > 0
            ? latestByDate(
                todaysExchangeMatches.filter(
                  (p: any) => p.type === "EXCHANGE" && p.status === "APPROVED"
                )
              )
            : null; // No approved rate for current week

        console.log("Selected exchange entry:", exchangeEntry);
        console.log("Current week start:", currentWeekStart);

        setCommodityPrices(commodityPrices);
        setWeeklyExchange(exchangeEntry);

        // Set missing flags - check if we have prices for all commodities in the job card
        const hasAllCommodityPrices =
          jobBody?.commodities?.every((commodityItem) =>
            commodityPrices.some(
              (price) => price.commodityId === commodityItem.commodity.id
            )
          ) || false;
        setMissingTodayCommodity(!hasAllCommodityPrices);
        setMissingTodayExchange(!exchangeEntry);
      } catch (error) {
        console.error("Error fetching meta data:", error);
      } finally {
        setMetaLoading(false);
      }
    };

    fetchMeta();
  }, [id]);

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRowChange = (index: number, field: string, value: string) => {
    const parsed = value === "" ? undefined : Number(value);

    setRows((prev) => {
      const next = [...prev];
      if (!next[index]) next[index] = {};
      next[index] = { ...next[index], [field]: parsed };

      const gross = next[index].grossWeight;
      const net = next[index].netWeight;

      // If grossWeight or netWeight changed, recompute expected fineness
      if (field === "netWeight" || field === "grossWeight") {
        if (typeof gross === "number" && gross > 0 && typeof net === "number") {
          const expectedFineness = calculateExpectedFineness(gross, net);
          // Only auto-set fineness if it hasn't been manually edited or if it matches expected
          if (
            typeof next[index].fineness !== "number" ||
            next[index].fineness === expectedFineness
          ) {
            next[index].fineness = expectedFineness;
          }
          // Update warning state - check if manual fineness differs from expected
          const manualFineness = next[index].fineness;
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
    if (u === "kg" || u === "kilograms") return (value * 1000) / 31.1035; // Convert kg to grams first, then to troy ounces
    // default grams to troy ounces
    return value / 31.1035;
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
  const displayNetWeightOz =
    jobCard?.commodities?.reduce(
      (sum, com) => sum + (com.numberOfOunces || 0),
      0
    ) || totalNetWeightOzDisplay;
  const displayUsdValue =
    jobCard?.commodities?.reduce((sum, com) => sum + (com.valueUsd || 0), 0) ||
    (Number(
      commodityPrices.find(
        (p) => p.commodityId === jobCard?.commodities?.[0]?.commodity?.id
      )?.price
    ) || 0) * totalNetWeightOzDisplay;
  const displayGhsValue =
    jobCard?.commodities?.reduce((sum, com) => sum + (com.valueGhs || 0), 0) ||
    displayUsdValue * (Number(weeklyExchange?.value) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    toast.loading("Saving assay...", { id: "assay-save" });

    try {
      // Validation: require meta bar fields and at least one measurement row
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
      if (!hasMeasurement) {
        setError("At least one measurement row is required");
        toast.dismiss("assay-save");
        toast.error("At least one measurement row is required");
        setSaving(false);
        return;
      }

      // If today's price is missing, block saving and show an error
      if (missingTodayCommodity) {
        const msg = `Cannot save valuation: no daily commodity price for today set. Please add the required price before saving.`;
        setError(msg);
        toast.dismiss("assay-save");
        toast(msg, { icon: "⚠️" });
        setSaving(false);
        return;
      }

      // Block saving if weekly exchange rate is missing - this ensures data integrity
      if (missingTodayExchange) {
        const msg = `Cannot create assay: No approved exchange rate available for the current week. Please contact a super admin to approve the pending exchange rate before proceeding.`;
        setError(msg);
        toast.dismiss("assay-save");
        toast.error(msg);
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
        exchangeRate: Number(weeklyExchange?.value) || null,
        commodityPrice:
          Number(
            commodityPrices.find(
              (p) => p.commodityId === jobCard?.commodities?.[0]?.commodity?.id
            )?.price
          ) || null,
        pricePerOz:
          Number(
            commodityPrices.find(
              (p) => p.commodityId === jobCard?.commodities?.[0]?.commodity?.id
            )?.price
          ) || null,
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
            dailyPrice:
              Number(
                commodityPrices.find(
                  (p) =>
                    p.commodityId === jobCard?.commodities?.[0]?.commodity?.id
                )?.price
              ) || null,
          },
        }),
        shipmentTypeId: form.shipmentTypeId || null,
        createdAt: new Date().toISOString(),
      };

      // For now, we'll store the assay data in the job card's notes or a separate field
      // In a full implementation, you'd want to create a separate Assay model for large scale
      const updatedJobCard = {
        ...jobCard,
        notes: jobCard?.notes
          ? `${
              jobCard.notes
            }\n\n[ASSAY DATA - ${new Date().toISOString()}]\n${JSON.stringify(
              newAssay,
              null,
              2
            )}`
          : `[ASSAY DATA - ${new Date().toISOString()}]\n${JSON.stringify(
              newAssay,
              null,
              2
            )}`,
      };

      const put = await fetch(`/api/large-scale-job-cards/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedJobCard),
      });

      if (!put.ok) {
        const err = await put.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save assay");
      }

      toast.dismiss("assay-save");
      toast.success("Assay saved successfully!");
      router.push(`/job-cards/large-scale/${id}`);
    } catch (err: any) {
      console.error(err);
      const errorMessage =
        err?.message || "An error occurred while saving the assay";
      setError(errorMessage);
      toast.dismiss("assay-save");
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <BackLink
          href={`/job-cards/large-scale/${id}`}
          label="Back to Job Card"
        />
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          New Assay - Large Scale Job Card
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Create a new assay valuation for large scale job card:{" "}
          {jobCard?.referenceNumber}
        </p>
      </div>

      {/* Meta info bar: exporter, today's price/exchange, reference, destination, shipment */}
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
                  {jobCard?.commodities && jobCard.commodities.length > 0
                    ? jobCard.commodities
                        .map((c) => c.commodity.name)
                        .join(", ")
                    : "-"}
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
                  Daily Commodity Prices (today)
                </div>
                <div className="font-medium text-gray-900">
                  {jobCard?.commodities && jobCard.commodities.length > 0 ? (
                    <div className="space-y-1">
                      {jobCard.commodities.map(
                        (commodityItem: any, index: number) => {
                          // Find the latest price for this commodity
                          const commodityPrice = commodityPrices
                            .filter(
                              (p: any) =>
                                p.commodityId === commodityItem.commodity.id
                            )
                            .sort(
                              (a: any, b: any) =>
                                new Date(b.createdAt).getTime() -
                                new Date(a.createdAt).getTime()
                            )[0];

                          return (
                            <div key={commodityItem.id} className="text-xs">
                              <span className="font-medium">
                                {commodityItem.commodity.name}:
                              </span>{" "}
                              {commodityPrice?.price != null
                                ? `$${Number(commodityPrice.price).toFixed(2)}`
                                : "-"}
                            </div>
                          );
                        }
                      )}
                    </div>
                  ) : (
                    "-"
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">
                  Weekly Exchange Price (current week)
                </div>
                <div
                  className={`font-medium ${
                    missingTodayExchange ? "text-red-600" : "text-gray-900"
                  }`}
                >
                  {missingTodayExchange ? (
                    <span className="flex items-center">
                      <span className="mr-1">❌</span>
                      Not Approved
                    </span>
                  ) : weeklyExchange?.value ? (
                    formatExchangeRate(weeklyExchange.value)
                  ) : (
                    <span className="text-gray-400">No Rate</span>
                  )}
                </div>
                {missingTodayExchange && (
                  <div className="text-xs text-red-500 mt-1">
                    Contact super admin to approve pending rate
                  </div>
                )}
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
                  {jobCard?.referenceNumber || "-"}
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
              disabled={saving || missingTodayExchange}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                missingTodayExchange
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {saving ? "Saving..." : "Save Valuation"}
            </button>
            {missingTodayExchange && (
              <p className="text-sm text-red-600 mt-2">
                Cannot save: Missing approved exchange rate for current week
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

export default withClientAuth(NewLargeScaleAssayPage);
