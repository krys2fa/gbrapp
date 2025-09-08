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
  const [currentWeekExchangeEntry, setCurrentWeekExchangeEntry] = useState<
    any | null
  >(null);

  const [form, setForm] = useState({
    method: "X_RAY" as AssayMethod,
    pieces: 1,
    signatory: "",
    comments: "",
    shipmentTypeId: "",
    securitySealNo: "",
    goldbodSealNo: "",
    customsSealNo: "",
    shipmentNumber: "",
    dateOfAnalysis: new Date().toISOString().split("T")[0],
    dataSheetDates: "",
    sampleBottleDates: "",
    numberOfSamples: 1,
    numberOfBars: 1,
    sampleType: "capillary",
  });

  // rows for each piece: bar number, gross weight, gold assay, net gold weight, silver assay, net silver weight
  const [rows, setRows] = useState<
    Array<{
      barNumber?: string;
      grossWeight?: number;
      goldAssay?: number;
      netGoldWeight?: number;
      silverAssay?: number;
      netSilverWeight?: number;
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

  // Update rows when pieces changes
  useEffect(() => {
    const currentPieces = Number(form.pieces) || 1;
    setRows((prevRows) => {
      const newRows = [...prevRows];
      // If we need more rows, add them
      while (newRows.length < currentPieces) {
        newRows.push({});
      }
      // If we need fewer rows, remove them
      while (newRows.length > currentPieces) {
        newRows.pop();
      }
      return newRows;
    });

    // Also update fineness warnings array
    setFinenessWarnings((prevWarnings) => {
      const newWarnings = [...prevWarnings];
      while (newWarnings.length < currentPieces) {
        newWarnings.push({ hasWarning: false });
      }
      while (newWarnings.length > currentPieces) {
        newWarnings.pop();
      }
      return newWarnings;
    });
  }, [form.pieces]);

  // Helper function to calculate net weights from assays
  const calculateNetWeight = (gross: number, assay: number): number => {
    if (typeof gross === "number" && typeof assay === "number") {
      return Number(((gross * assay) / 100).toFixed(4));
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
        console.log("Exchange API response status:", exRes.status);
        console.log("Exchange API response ok:", exRes.ok);
        if (exRes && exRes.ok)
          exchangePrices = await exRes.json().catch(() => []);
        else console.log("Exchange API call failed or returned error");

        console.log("Approved exchange prices from API:", exchangePrices);
        console.log("Number of exchange prices:", exchangePrices?.length || 0);
        exchangePrices?.forEach((price, index) => {
          console.log(`Exchange ${index}:`, {
            id: price.id,
            weekStartDate: price.weekStartDate,
            status: price.status,
            price: price.price,
          });
        });

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
        console.log("Day of week:", todayDate.getUTCDay());
        console.log("Diff calculated:", diff);

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
        console.log("Number of matches:", todaysExchangeMatches?.length || 0);

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

        // Fallback to most recent approved exchange rate for display purposes
        const fallbackExchangeEntry =
          exchangeEntry ||
          latestByDate(
            (exchangePrices || []).filter(
              (p: any) => p.type === "EXCHANGE" && p.status === "APPROVED"
            )
          );

        console.log("Selected exchange entry:", exchangeEntry);
        console.log("Exchange entry price:", exchangeEntry?.price);
        console.log("Exchange entry status:", exchangeEntry?.status);
        console.log("Fallback exchange entry:", fallbackExchangeEntry);
        console.log("Current week start:", currentWeekStart);

        setCommodityPrices(commodityPrices);
        setWeeklyExchange(fallbackExchangeEntry);
        setCurrentWeekExchangeEntry(exchangeEntry);

        // Set missing flags - check if we have prices for all commodities in the job card
        const hasAllCommodityPrices =
          jobBody?.commodities?.every((commodityItem) =>
            commodityPrices.some(
              (price) => price.commodityId === commodityItem.commodity.id
            )
          ) || false;
        setMissingTodayCommodity(!hasAllCommodityPrices);
        setMissingTodayExchange(!currentWeekExchangeEntry); // Updated to use current week logic
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
      next[index] = {
        ...next[index],
        [field]: field === "barNumber" ? value : parsed,
      };

      // Auto-calculate net gold weight when gross weight and gold assay are available (only if not manually set)
      if (field === "grossWeight" || field === "goldAssay") {
        const gross = next[index].grossWeight;
        const goldAssay = next[index].goldAssay;
        if (typeof gross === "number" && typeof goldAssay === "number") {
          // Only auto-calculate if netGoldWeight hasn't been manually set
          if (
            next[index].netGoldWeight === undefined ||
            next[index].netGoldWeight === null
          ) {
            next[index].netGoldWeight = Number(
              ((gross * goldAssay) / 100).toFixed(4)
            );
          }
        }
      }

      // Auto-calculate net silver weight when gross weight and silver assay are available (only if not manually set)
      if (field === "grossWeight" || field === "silverAssay") {
        const gross = next[index].grossWeight;
        const silverAssay = next[index].silverAssay;
        if (typeof gross === "number" && typeof silverAssay === "number") {
          // Only auto-calculate if netSilverWeight hasn't been manually set
          if (
            next[index].netSilverWeight === undefined ||
            next[index].netSilverWeight === null
          ) {
            next[index].netSilverWeight = Number(
              ((gross * silverAssay) / 100).toFixed(4)
            );
          }
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
    (s, r) => s + (Number(r.netGoldWeight) || 0),
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
    displayUsdValue * (Number(currentWeekExchangeEntry?.price) || 0);

  // Summary calculations for measurement totals
  const totalNetGoldWeight = rows.reduce(
    (sum, r) => sum + (Number(r.netGoldWeight) || 0),
    0
  );
  const totalNetSilverWeight = rows.reduce(
    (sum, r) => sum + (Number(r.netSilverWeight) || 0),
    0
  );

  const totalNetGoldWeightOz = toOunces(totalNetGoldWeight, unitOfMeasure);
  const totalNetSilverWeightOz = toOunces(totalNetSilverWeight, unitOfMeasure);

  // Find daily prices for gold and silver commodities
  const goldCommodity = jobCard?.commodities?.find(
    (c) =>
      c.commodity.name.toLowerCase().includes("gold") ||
      c.commodity.symbol.toLowerCase().includes("au")
  );
  const silverCommodity = jobCard?.commodities?.find(
    (c) =>
      c.commodity.name.toLowerCase().includes("silver") ||
      c.commodity.symbol.toLowerCase().includes("ag")
  );

  const goldDailyPrice = goldCommodity
    ? commodityPrices.find((p) => p.commodityId === goldCommodity.commodity.id)
        ?.price
    : null;

  const silverDailyPrice = silverCommodity
    ? commodityPrices.find(
        (p) => p.commodityId === silverCommodity.commodity.id
      )?.price
    : null;

  const totalGoldValue =
    goldDailyPrice && totalNetGoldWeightOz
      ? Number(goldDailyPrice) * totalNetGoldWeightOz
      : 0;
  const totalSilverValue =
    silverDailyPrice && totalNetSilverWeightOz
      ? Number(silverDailyPrice) * totalNetSilverWeightOz
      : 0;

  // Calculate combined total value and GHS conversion
  const totalCombinedValue = totalGoldValue + totalSilverValue;
  const totalValueGhs =
    totalCombinedValue * (Number(currentWeekExchangeEntry?.price) || 0);

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
            typeof r.netGoldWeight === "number" ||
            typeof r.netSilverWeight === "number"
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

      // Block saving if weekly exchange rate for current week is not approved
      // For debugging: allow submission if there's any approved exchange rate
      if (!currentWeekExchangeEntry && weeklyExchange) {
        console.log(
          "DEBUG: No current week exchange rate but found fallback rate:",
          weeklyExchange
        );
        // For now, allow submission but log the issue
      } else if (!currentWeekExchangeEntry) {
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
        shipmentNumber: form.shipmentNumber,
        dateOfAnalysis: form.dateOfAnalysis,
        dataSheetDates: form.dataSheetDates,
        sampleBottleDates: form.sampleBottleDates,
        numberOfSamples: Number(form.numberOfSamples),
        numberOfBars: Number(form.numberOfBars),
        sampleType: form.sampleType,
        exchangeRate: Number(currentWeekExchangeEntry?.price) || null,
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
          barNumber: r.barNumber || "",
          grossWeight: r.grossWeight || 0,
          goldAssay: r.goldAssay || 0,
          netGoldWeight: r.netGoldWeight || 0,
          silverAssay: r.silverAssay || 0,
          netSilverWeight: r.netSilverWeight || 0,
        })),
        // persist a JSON blob in comments so server can store structured metadata
        comments: JSON.stringify({
          note: form.comments || "",
          meta: {
            unit: unitOfMeasure,
            totalNetWeightOz: Number(totalNetWeightOzDisplay.toFixed(4)),
            valueUsd: Number(displayUsdValue.toFixed(4)),
            valueGhs: Number(displayGhsValue.toFixed(4)),
            weeklyExchange: Number(currentWeekExchangeEntry?.price) || null,
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
          New Assay - Large Scale
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
                    !currentWeekExchangeEntry ? "text-red-600" : "text-gray-900"
                  }`}
                >
                  {!currentWeekExchangeEntry ? (
                    <span className="flex items-center">
                      <span className="mr-1">❌</span>
                      Not Approved
                    </span>
                  ) : currentWeekExchangeEntry?.price ? (
                    <div>
                      <div>
                        {formatExchangeRate(currentWeekExchangeEntry.price)}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400">No Rate</span>
                  )}
                </div>
                {!currentWeekExchangeEntry && weeklyExchange && (
                  <div className="text-xs text-amber-600 mt-1">
                    Using previous week's rate (DEBUG MODE)
                  </div>
                )}
                {!currentWeekExchangeEntry && !weeklyExchange && (
                  <div className="text-xs text-red-500 mt-1">
                    Contact super admin to approve current week's rate
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
                  {/* <option value="WATER_DENSITY">Water density</option> */}
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

              {/* <div>
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
              </div> */}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Shipment Number
                </label>
                <input
                  name="shipmentNumber"
                  type="text"
                  value={form.shipmentNumber}
                  onChange={handleFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="Enter shipment number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date of Analysis
                </label>
                <input
                  name="dateOfAnalysis"
                  type="date"
                  value={form.dateOfAnalysis}
                  onChange={handleFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Data Sheet Dates
                </label>
                <input
                  name="dataSheetDates"
                  type="date"
                  value={form.dataSheetDates}
                  onChange={handleFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Sample Bottle Dates
                </label>
                <input
                  name="sampleBottleDates"
                  type="date"
                  value={form.sampleBottleDates}
                  onChange={handleFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Number of Samples
                </label>
                <input
                  name="numberOfSamples"
                  type="number"
                  min={1}
                  value={form.numberOfSamples}
                  onChange={handleFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Number of Bars
                </label>
                <input
                  name="numberOfBars"
                  type="number"
                  min={1}
                  value={form.numberOfBars}
                  onChange={handleFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Sample Type
                </label>
                <select
                  name="sampleType"
                  value={form.sampleType}
                  onChange={handleFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="capillary">Capillary</option>
                  <option value="bulk">Bulk</option>
                  <option value="powder">Powder</option>
                  <option value="other">Other</option>
                </select>
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
                Provide measurements for each bar including assay percentages
                and calculated net weights.
              </p>

              <div className="mt-3 space-y-2">
                {rows.map((r, i) => (
                  <div key={i} className="grid grid-cols-6 gap-3 items-end">
                    <div>
                      <label className="block text-xs text-gray-600">
                        Bar Number (NGGL)
                      </label>
                      <input
                        type="text"
                        value={r.barNumber ?? ""}
                        onChange={(e) =>
                          handleRowChange(i, "barNumber", e.target.value)
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        placeholder="Enter bar number"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">
                        Gross Weight
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
                    <div>
                      <label className="block text-xs text-gray-600">
                        GOLDBOD Gold Assay (%)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        max="100"
                        value={r.goldAssay ?? ""}
                        onChange={(e) =>
                          handleRowChange(i, "goldAssay", e.target.value)
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">
                        Net Gold Weight
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={r.netGoldWeight ?? ""}
                        onChange={(e) =>
                          handleRowChange(i, "netGoldWeight", e.target.value)
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        placeholder={
                          r.grossWeight && r.goldAssay
                            ? Number(
                                ((r.grossWeight * r.goldAssay) / 100).toFixed(4)
                              ).toString()
                            : "Auto-calculated from gross × assay"
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">
                        GOLDBOD Silver Assay (%)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        max="100"
                        value={r.silverAssay ?? ""}
                        onChange={(e) =>
                          handleRowChange(i, "silverAssay", e.target.value)
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">
                        Net Silver Weight
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={r.netSilverWeight ?? ""}
                        onChange={(e) =>
                          handleRowChange(i, "netSilverWeight", e.target.value)
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        placeholder={
                          r.grossWeight && r.silverAssay
                            ? Number(
                                ((r.grossWeight * r.silverAssay) / 100).toFixed(
                                  4
                                )
                              ).toString()
                            : "Auto-calculated from gross × assay"
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary section for measurement totals */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-900">
                Measurement Summary
              </h4>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-xs text-gray-500">
                    Total Net Gold Weight
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {totalNetGoldWeightOz.toFixed(4)} oz
                  </div>
                  <div className="text-xs text-gray-500">
                    ({totalNetGoldWeight.toFixed(2)} {unitOfMeasure})
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-xs text-gray-500">
                    Total Net Silver Weight
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {totalNetSilverWeightOz.toFixed(4)} oz
                  </div>
                  <div className="text-xs text-gray-500">
                    ({totalNetSilverWeight.toFixed(2)} {unitOfMeasure})
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="text-xs text-gray-500">Gold Value (USD)</div>
                  <div className="text-lg font-semibold text-blue-900">
                    ${totalGoldValue.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    @ $
                    {goldDailyPrice ? Number(goldDailyPrice).toFixed(2) : "N/A"}
                    /oz
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-xs text-gray-500">
                    Silver Value (USD)
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    ${totalSilverValue.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    @ $
                    {silverDailyPrice
                      ? Number(silverDailyPrice).toFixed(2)
                      : "N/A"}
                    /oz
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded-md">
                  <div className="text-xs text-gray-500">Total Value (USD)</div>
                  <div className="text-lg font-semibold text-green-900">
                    ${totalCombinedValue.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Gold + Silver combined
                  </div>
                </div>
                <div className="bg-purple-50 p-3 rounded-md">
                  <div className="text-xs text-gray-500">Total Value (GHS)</div>
                  <div className="text-lg font-semibold text-purple-900">
                    ₵{totalValueGhs.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    @{" "}
                    {currentWeekExchangeEntry
                      ? formatExchangeRate(currentWeekExchangeEntry.price)
                      : "N/A"}
                  </div>
                </div>
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
              disabled={
                saving || (!currentWeekExchangeEntry && !weeklyExchange)
              }
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                !currentWeekExchangeEntry && !weeklyExchange
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {saving ? "Saving..." : "Save Valuation"}
            </button>
            {!currentWeekExchangeEntry && !weeklyExchange && (
              <p className="text-sm text-red-600 mt-2">
                Cannot save: No approved exchange rate available
              </p>
            )}
            {currentWeekExchangeEntry && (
              <p className="text-sm text-green-600 mt-2">
                ✓ Current week approved exchange rate available
              </p>
            )}
            {!currentWeekExchangeEntry && weeklyExchange && (
              <p className="text-sm text-amber-600 mt-2">
                ⚠ DEBUG: Using previous week's rate
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

export default withClientAuth(NewLargeScaleAssayPage);
