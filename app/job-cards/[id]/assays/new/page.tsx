"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useRouter, useParams } from "next/navigation";
import BackLink from "@/app/components/ui/BackLink";
import { formatExchangeRate, formatCurrency } from "@/app/lib/utils";
import { useAuth } from "@/app/context/auth-context";

type AssayMethod = "X_RAY" | "WATER_DENSITY";

export default function NewAssayPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const router = useRouter();
  const { user } = useAuth();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
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
  const [missingJobCardDateCommodity, setMissingJobCardDateCommodity] =
    useState(false);
  const [missingJobCardWeekExchange, setMissingJobCardWeekExchange] =
    useState(false);

  const [form, setForm] = useState({
    method: "X_RAY" as AssayMethod,
    pieces: 1,
    signatory: user?.name || "",
    comments: "",
    certificateNumber: "",
    shipmentTypeId: "",
    securitySealNo: "",
    goldbodSealNo: "",
    customsSealNo: "",
    customsOfficer: "",
    technicalDirector: "",
    dateOfAnalysis: new Date().toISOString().split("T")[0], // Default to today
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

  // Update signatory when user data becomes available
  useEffect(() => {
    if (user?.name && !form.signatory) {
      setForm((prev) => ({ ...prev, signatory: user.name }));
    }
  }, [user, form.signatory]);

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

        // Fetch commodity prices specifically for this job card's commodity.
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

        // Fetch exchange prices (only approved ones for production)
        let exchangePrices: any[] = [];
        const exRes = await fetch(
          `/api/weekly-prices?type=EXCHANGE&approvedOnly=true`
        );
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

        // Use date of analysis from form instead of job card's received date
        const analysisDate = form.dateOfAnalysis || date;

        // Calculate the start of the week for the analysis date (Monday) in UTC
        const analysisDateObj = new Date(analysisDate + "T00:00:00.000Z");
        const analysisDayOfWeek = analysisDateObj.getUTCDay();
        const analysisDiff =
          analysisDayOfWeek === 0 ? 6 : analysisDayOfWeek - 1;
        const analysisWeekStart = new Date(analysisDateObj);
        analysisWeekStart.setUTCDate(
          analysisDateObj.getUTCDate() - analysisDiff
        );
        analysisWeekStart.setUTCHours(0, 0, 0, 0);
        const analysisWeekStartStr = analysisWeekStart
          .toISOString()
          .split("T")[0];

        const analysisDateCommodityMatches = (commodityPrices || []).filter(
          (p: any) => String(p?.createdAt || "").split("T")[0] === analysisDate
        );
        const analysisWeekExchangeMatches = (exchangePrices || []).filter(
          (p: any) => {
            const priceWeekStart = String(p?.weekStartDate || "").split("T")[0];
            const matches = priceWeekStart === analysisWeekStartStr;
            return matches;
          }
        );
        // Get commodity entry only for the analysis date (no fallback)
        const commodityEntry =
          latestByDate(
            analysisDateCommodityMatches.filter(
              (p: any) => p.type === "COMMODITY"
            )
          ) || null;

        // Only use exchange rates from the analysis date week - no fallback
        const exchangeEntry =
          analysisWeekExchangeMatches.length > 0
            ? latestByDate(
                analysisWeekExchangeMatches.filter(
                  (p: any) => p.type === "EXCHANGE" && p.status === "APPROVED"
                )
              )
            : null; // No approved rate for analysis week

        setMissingJobCardDateCommodity(
          analysisDateCommodityMatches.length === 0
        );
        setMissingJobCardWeekExchange(analysisWeekExchangeMatches.length === 0);

        setDailyPrice({
          value: commodityEntry ? Number(commodityEntry.price) : null,
        });
        setWeeklyExchange({
          value: exchangeEntry ? Number(exchangeEntry.price) : null, // null when no approved rate for current week
        });
      } catch (err) {
        console.error(err);
      } finally {
        setMetaLoading(false);
      }
    };

    fetchMeta();
  }, [id, form.dateOfAnalysis]);

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

      // If grossWeight and fineness are provided, auto-calculate net weight
      if (
        (field === "grossWeight" || field === "fineness") &&
        typeof gross === "number" &&
        gross > 0 &&
        typeof manualFineness === "number" &&
        manualFineness > 0
      ) {
        // calculate net weight from fineness and gross; round to 2 decimal places
        const calculatedNet = (manualFineness / 100) * gross;
        next[index].netWeight = Number(calculatedNet.toFixed(2));

        // Clear fineness warnings since we're using the entered fineness value
        setFinenessWarnings((prev) => {
          const newWarnings = [...prev];
          newWarnings[index] = { hasWarning: false };
          return newWarnings;
        });
      }
      // If grossWeight or netWeight changed, recompute expected fineness
      else if (field === "netWeight" || field === "grossWeight") {
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

      // If fineness is manually edited, check for discrepancy (only if net weight wasn't auto-calculated)
      if (field === "fineness" && typeof gross === "number" && gross > 0) {
        // If we have existing net weight, check for discrepancy
        if (typeof net === "number") {
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
          // No net weight to compare against, no warning
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

  // Calculate totals for the measurements table
  const totalGrossWeight = rows.reduce(
    (s, r) => s + (Number(r.grossWeight) || 0),
    0
  );
  const totalWaterWeight = rows.reduce(
    (s, r) => s + (Number(r.waterWeight) || 0),
    0
  );
  const averageFineness = (totalInputNetWeight / totalGrossWeight) * 100 || 0;

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
    setError("");

    toast.loading("Loading preview...", { id: "loading-preview" });

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
      // Weekly exchange is now required for data integrity - block saving if missing
      if (!(jobCard?.referenceNumber || jobCard?.reference))
        metaMissing.push("reference number");
      if (!jobCard?.exporter?.buyerName) metaMissing.push("buyer");
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
        const msg = `Cannot save valuation. Missing: ${metaMissing.join(", ")}`;
        setError(msg);
        toast.dismiss("loading-preview");
        toast.error(msg);
        return;
      }

      // If commodity price for analysis date is missing, show toast and return
      if (missingJobCardDateCommodity) {
        const analysisDate = form.dateOfAnalysis
          ? new Date(form.dateOfAnalysis).toLocaleDateString()
          : "the analysis date";
        const msg = `No commodity price set for ${analysisDate}. Cannot perform valuation.`;
        toast.dismiss("loading-preview");
        toast.error(msg);
        return;
      }

      // Block saving if weekly exchange rate is missing - this ensures data integrity
      if (missingJobCardWeekExchange) {
        const analysisDate = form.dateOfAnalysis
          ? new Date(form.dateOfAnalysis).toLocaleDateString()
          : "the analysis date";
        const msg = `Cannot create assay: No exchange rate available for the week of ${analysisDate}. Please add the required exchange rate before proceeding.`;
        setError(msg);
        toast.dismiss("loading-preview");
        toast.error(msg);
        return;
      }

      // Show preview modal instead of saving directly
      toast.dismiss("loading-preview");
      setShowPreviewModal(true);
    } catch (err: any) {
      console.error(err);
      const errorMessage =
        err?.message || "An error occurred while preparing the preview";
      setError(errorMessage);
      toast.dismiss("loading-preview");
      toast.error(errorMessage);
    }
  };

  // Separate function to handle the actual save after preview confirmation
  const handleConfirmSave = async () => {
    setSaving(true);
    toast.loading("Saving assay...", { id: "assay-save" });

    try {
      // fetch current job card again
      const res = await fetch(`/api/job-cards/${id}`);
      if (!res.ok) throw new Error("Failed to load job card");
      const jobCard = await res.json();

      const newAssay = {
        id: `local-${Date.now()}`,
        certificateNumber: form.certificateNumber || undefined,
        dateOfAnalysis: form.dateOfAnalysis,
        method: form.method,
        pieces: Number(form.pieces),
        signatory: form.signatory,
        securitySealNo: form.securitySealNo,
        goldbodSealNo: form.goldbodSealNo,
        customsSealNo: form.customsSealNo,
        exchangeRate: Number(weeklyExchange?.value) || null,
        commodityPrice: Number(dailyPrice?.value) || null,
        pricePerOz: Number(dailyPrice?.value) || null,
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
          customsOfficer: form.customsOfficer || "",
          technicalDirector: form.technicalDirector || "",
          signatory: form.signatory || "",
          meta: {
            unit: unitOfMeasure,
            totalNetWeightOz: Number(totalNetWeightOzDisplay.toFixed(3)),
            valueUsd: Number(displayUsdValue.toFixed(2)),
            valueGhs: Number(displayGhsValue.toFixed(2)),
            weeklyExchange: Number(weeklyExchange?.value) || null,
            dailyPrice: Number(dailyPrice?.value) || null,
          },
        }),
        shipmentTypeId: form.shipmentTypeId || null,
        createdAt: new Date().toISOString(),
      };

      const updated = {
        ...jobCard,
        // Only one assay per job card - replace existing assay
        assays: [newAssay],
        // Save officer information in the job card
        customsOfficerName: form.customsOfficer,
        technicalDirectorName: form.technicalDirector,
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

      // If certificateNumber provided on assay, ensure it's passed as part of the update payload
      if (form.certificateNumber && !updated.certificateNumber) {
        updated.certificateNumber = form.certificateNumber;
      }

      const put = await fetch(`/api/job-cards/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!put.ok) {
        const err = await put.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save assay");
      }

      toast.dismiss("assay-save");
      toast.success("Assay saved successfully!");
      router.push(`/job-cards/${id}`);
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
        <BackLink href={`/job-cards/${id}`} label="Back" />
      </div>

      {/* Meta info bar: exporter, today's price/exchange, reference, buyer, destination, shipment */}
      <div className="mb-4">
        {metaLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
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
                  Daily Commodity Price (
                  {form.dateOfAnalysis
                    ? new Date(form.dateOfAnalysis).toLocaleDateString()
                    : "analysis date"}
                  )
                </div>
                <div
                  className={`font-medium ${
                    missingJobCardDateCommodity
                      ? "text-red-600"
                      : "text-gray-900"
                  }`}
                >
                  {missingJobCardDateCommodity ? (
                    <span className="flex items-center">
                      <span className="mr-1">❌</span>
                      No Price Set
                    </span>
                  ) : dailyPrice?.value != null ? (
                    formatCurrency(dailyPrice.value, "USD", false)
                  ) : (
                    "-"
                  )}
                </div>
                {missingJobCardDateCommodity && (
                  <div className="text-xs text-red-500 mt-1">
                    Add commodity price for this date
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs text-gray-500">
                  Weekly Exchange Price (
                  {form.dateOfAnalysis
                    ? `week of ${new Date(
                        form.dateOfAnalysis
                      ).toLocaleDateString()}`
                    : "analysis date week"}
                  )
                </div>
                <div
                  className={`font-medium ${
                    missingJobCardWeekExchange
                      ? "text-red-600"
                      : "text-gray-900"
                  }`}
                >
                  {missingJobCardWeekExchange ? (
                    <span className="flex items-center">
                      <span className="mr-1">❌</span>
                      No Rate Set
                    </span>
                  ) : weeklyExchange?.value ? (
                    formatExchangeRate(weeklyExchange.value)
                  ) : (
                    <span className="text-gray-400">No Rate</span>
                  )}
                </div>
                {missingJobCardWeekExchange && (
                  <div className="text-xs text-red-500 mt-1">
                    Add exchange rate for this week
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs text-gray-500">
                  Exporter Net weight (oz)
                </div>
                <div className="font-medium text-gray-900">
                  {displayNetWeightOz
                    ? displayNetWeightOz.toLocaleString(undefined, {
                        minimumFractionDigits: 3,
                        maximumFractionDigits: 3,
                      })
                    : "0.000"}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">
                  Exporter Value (USD)
                </div>
                <div className="font-medium text-gray-900">
                  {displayUsdValue
                    ? formatCurrency(displayUsdValue, "USD", false)
                    : formatCurrency(0, "USD", false)}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">
                  Exporter Value (GHS)
                </div>
                <div className="font-medium text-gray-900">
                  {displayGhsValue
                    ? formatCurrency(displayGhsValue, "GHS", false)
                    : formatCurrency(0, "GHS", false)}
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
                  {jobCard?.exporter?.buyerName || "-"}
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
                  Date of Analysis
                </label>
                <input
                  name="dateOfAnalysis"
                  type="date"
                  value={form.dateOfAnalysis}
                  onChange={handleFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  required
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

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Customs Officer
                </label>
                <input
                  name="customsOfficer"
                  type="text"
                  value={form.customsOfficer || ""}
                  onChange={handleFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="Enter customs officer name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Technical Director
                </label>
                <input
                  name="technicalDirector"
                  type="text"
                  value={form.technicalDirector || ""}
                  onChange={handleFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="Enter technical director name"
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
                  Certificate Number
                </label>
                <input
                  name="certificateNumber"
                  type="text"
                  value={form.certificateNumber || ""}
                  onChange={handleFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="Enter certificate number"
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
                        Gross weight ({unitOfMeasure})
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
                          Water weight ({unitOfMeasure})
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
                        Fineness (%)
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
                        Net weight ({unitOfMeasure})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={
                          typeof r.netWeight === "number"
                            ? r.netWeight.toFixed(2)
                            : ""
                        }
                        onChange={(e) =>
                          handleRowChange(i, "netWeight", e.target.value)
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      />
                    </div>
                  </div>
                ))}

                {/* Totals Row */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    Totals
                  </h5>
                  <div
                    className={`grid grid-cols-1 sm:grid-cols-${
                      form.method === "X_RAY" ? "3" : "4"
                    } gap-3 items-end bg-gray-50 p-3 rounded`}
                  >
                    <div>
                      <label className="block text-xs text-gray-600 font-medium">
                        Total Gross Weight ({unitOfMeasure})
                      </label>
                      <div className="mt-1 text-sm font-semibold text-gray-900">
                        {totalGrossWeight.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                    {form.method !== "X_RAY" && (
                      <div>
                        <label className="block text-xs text-gray-600 font-medium">
                          Total Water Weight ({unitOfMeasure})
                        </label>
                        <div className="mt-1 text-sm font-semibold text-gray-900">
                          {totalWaterWeight.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs text-gray-600 font-medium">
                        Average Fineness (%)
                      </label>
                      <div className="mt-1 text-sm font-semibold text-gray-900">
                        {averageFineness.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 font-medium">
                        Total Net Weight ({unitOfMeasure})
                      </label>
                      <div className="mt-1 text-sm font-semibold text-gray-900">
                        {totalInputNetWeight.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <button
              type="submit"
              disabled={saving || missingJobCardWeekExchange}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                missingJobCardWeekExchange
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {saving ? "Saving..." : "Save Valuation"}
            </button>
            {missingJobCardWeekExchange && (
              <p className="text-sm text-red-600 mt-2">
                Cannot save: Missing exchange rate for the week of{" "}
                {form.dateOfAnalysis
                  ? new Date(form.dateOfAnalysis).toLocaleDateString()
                  : "analysis date"}
              </p>
            )}
          </div>
        </div>
      </form>

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={() => setShowPreviewModal(false)}
              ></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Assay Valuation Preview
                    </h3>

                    {/* Preview Content */}
                    <div className="bg-white overflow-hidden border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                      <div className="flex items-center justify-between mb-1 px-8">
                        <div className="p-2">
                          <img
                            src="/goldbod-logo-green.png"
                            alt="GoldBod Logo"
                            className="h-12 w-auto"
                          />
                        </div>
                      </div>

                      <div className="border-t border-gray-200 px-4 py-3 sm:p-4">
                        <div className="flex justify-center">
                          <h1 className="text-xl font-bold tracking-wider">
                            ASSAY VALUATION REPORT
                          </h1>
                        </div>

                        {/* Basic Information Display */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Exporter
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {jobCard?.exporter?.name || "N/A"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Job ID
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {jobCard?.humanReadableId || "N/A"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Reference Number
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {jobCard?.referenceNumber || "N/A"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Date of Analysis
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {form.dateOfAnalysis
                                ? new Date(
                                    form.dateOfAnalysis
                                  ).toLocaleDateString()
                                : "N/A"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Commodity
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {jobCard?.commodity?.name ||
                                commodities.find(
                                  (c) => c.id === jobCard?.commodityId
                                )?.name ||
                                "N/A"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Assay Method
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {form.method === "X_RAY"
                                ? "X-Ray"
                                : "Water Density"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Number of Pieces
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {form.pieces}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Type of Shipment
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {form.shipmentTypeId
                                ? shipmentTypes.find(
                                    (st) => st.id === form.shipmentTypeId
                                  )?.name
                                : "N/A"}
                            </dd>
                          </div>
                          {/* <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Authorized Signatory
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {form.signatory || "N/A"}
                            </dd>
                          </div> */}
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Customs Officer
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {form.customsOfficer || "N/A"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Technical Director
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {form.technicalDirector || "N/A"}
                            </dd>
                          </div>
                        </div>

                        {/* Measurements Table */}
                        <div className="mt-6">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">
                            Piece Measurements
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Piece
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Gross Weight ({unitOfMeasure})
                                  </th>
                                  {form.method !== "X_RAY" && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Water Weight ({unitOfMeasure})
                                    </th>
                                  )}
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fineness (%)
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Net Weight ({unitOfMeasure})
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {rows.map((row, index) => (
                                  <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {index + 1}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {row.grossWeight?.toFixed(2) || "0.00"}
                                    </td>
                                    {form.method !== "X_RAY" && (
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {row.waterWeight?.toFixed(2) || "0.00"}
                                      </td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {row.fineness?.toFixed(2) || "0.00"}%
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {row.netWeight?.toFixed(2) || "0.00"}
                                    </td>
                                  </tr>
                                ))}
                                {/* Totals Row */}
                                <tr className="bg-gray-50 border-t-2 border-gray-300">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                    TOTALS
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                    {totalGrossWeight.toFixed(2)}
                                  </td>
                                  {form.method !== "X_RAY" && (
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                      {totalWaterWeight.toFixed(2)}
                                    </td>
                                  )}
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                    {averageFineness.toFixed(2)}% (avg)
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                    {totalInputNetWeight.toFixed(2)}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Exporter Valuation Summary */}
                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-4">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Exporter Total Net Weight (oz)
                            </dt>
                            <dd className="mt-1 text-lg font-semibold text-gray-900">
                              {displayNetWeightOz
                                ? displayNetWeightOz.toLocaleString(undefined, {
                                    minimumFractionDigits: 3,
                                    maximumFractionDigits: 3,
                                  })
                                : "0.000"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Exporter Value (USD)
                            </dt>
                            <dd className="mt-1 text-lg font-semibold text-gray-900">
                              {displayUsdValue
                                ? formatCurrency(displayUsdValue, "USD", false)
                                : formatCurrency(0, "USD", false)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Exporter Value (GHS)
                            </dt>
                            <dd className="mt-1 text-lg font-semibold text-gray-900">
                              {displayGhsValue
                                ? formatCurrency(displayGhsValue, "GHS", false)
                                : formatCurrency(0, "GHS", false)}
                            </dd>
                          </div>
                        </div>

                        {/* GoldBod Valuation Summary */}
                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-4 bg-yellow-50 p-4 rounded-lg">
                          <div className="col-span-3">
                            <h4 className="text-lg font-semibold text-gray-900 mb-3">
                              GOLDBOD Official Valuation
                            </h4>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Total Net Weight (oz)
                            </dt>
                            <dd className="mt-1 text-lg font-semibold text-gray-900">
                              {totalNetWeightOzDisplay
                                ? totalNetWeightOzDisplay.toLocaleString(
                                    undefined,
                                    {
                                      minimumFractionDigits: 3,
                                      maximumFractionDigits: 3,
                                    }
                                  )
                                : "0.000"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Total Value (USD)
                            </dt>
                            <dd className="mt-1 text-lg font-semibold text-gray-900">
                              {dailyPrice?.value && totalNetWeightOzDisplay
                                ? formatCurrency(
                                    Number(dailyPrice.value) *
                                      Number(
                                        totalNetWeightOzDisplay.toFixed(3)
                                      ),
                                    "USD",
                                    false
                                  )
                                : formatCurrency(0, "USD", false)}
                            </dd>
                            <dt className="text-xs text-gray-400 mt-1">
                              @{" "}
                              {dailyPrice?.value
                                ? formatCurrency(dailyPrice.value, "USD", false)
                                : "0.00"}
                              /oz
                              {jobCard?.receivedDate && (
                                <span>
                                  {" "}
                                  (
                                  {new Date(
                                    jobCard.receivedDate
                                  ).toLocaleDateString()}
                                  )
                                </span>
                              )}
                            </dt>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Total Value (GHS)
                            </dt>
                            <dd className="mt-1 text-lg font-semibold text-gray-900">
                              {dailyPrice?.value &&
                              weeklyExchange?.value &&
                              totalNetWeightOzDisplay
                                ? formatCurrency(
                                    Number(dailyPrice.value) *
                                      Number(
                                        totalNetWeightOzDisplay.toFixed(3)
                                      ) *
                                      Number(weeklyExchange.value),
                                    "GHS",
                                    false
                                  )
                                : formatCurrency(0, "GHS", false)}
                            </dd>
                            <dt className="text-xs text-gray-400 mt-1">
                              @{" "}
                              {weeklyExchange?.value
                                ? formatExchangeRate(weeklyExchange.value)
                                : "0.0000"}
                              {jobCard?.receivedDate && (
                                <span>
                                  {" "}
                                  (week of{" "}
                                  {new Date(
                                    jobCard.receivedDate
                                  ).toLocaleDateString()}
                                  )
                                </span>
                              )}
                            </dt>
                          </div>
                        </div>

                        {/* Seal Information */}
                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-4">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Security Seal No.
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {form.securitySealNo || "N/A"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              GOLDBOD Seal No.
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {form.goldbodSealNo || "N/A"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Customs Seal No.
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {form.customsSealNo || "N/A"}
                            </dd>
                          </div>
                        </div>

                        {/* Comments */}
                        {form.comments && (
                          <div className="mt-6 border-t pt-4">
                            <dt className="text-sm font-medium text-gray-500">
                              Comments
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {form.comments}
                            </dd>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => {
                    setShowPreviewModal(false);
                    handleConfirmSave();
                  }}
                  disabled={saving}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Confirm & Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
