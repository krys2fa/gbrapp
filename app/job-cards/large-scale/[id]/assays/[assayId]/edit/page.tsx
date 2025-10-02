"use client";

import { withClientAuth } from "@/app/lib/with-client-auth";
import { useApiClient } from "@/app/lib/api-client";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useRouter, useParams } from "next/navigation";
import BackLink from "@/app/components/ui/BackLink";
import { formatExchangeRate, formatCurrency } from "@/app/lib/utils";
import { logger, type LogCategory } from "@/lib/logger";

type AssayMethod = "X_RAY" | "WATER_DENSITY";

interface LargeScaleJobCard {
  id: string;
  referenceNumber: string;
  humanReadableId: string;
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
  numberOfBars: number;
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

interface AssayFormData {
  method: AssayMethod;
  pieces: number;
  signatory: string;
  comments: string;
  shipmentTypeId: string;
  securitySealNo: string;
  goldbodSealNo: string;
  customsSealNo: string;
  shipmentNumber: string;
  dateOfAnalysis: string;
  dataSheetDates: string;
  sampleBottleDates: string;
  numberOfSamples: number;
  numberOfBars: number;
  sampleType: string;
  exchangeRate: number;
  commodityPrice: number;
  pricePerOz: number;
  totalNetGoldWeight: number;
  totalNetSilverWeight: number;
  totalNetGoldWeightOz: number;
  totalNetSilverWeightOz: number;
  totalGoldValue: number;
  totalSilverValue: number;
  totalCombinedValue: number;
  totalValueGhs: number;
}

function EditLargeScaleAssayPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const assayId = (params?.assayId as string) || "";
  const router = useRouter();
  const apiClient = useApiClient();

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

  const [form, setForm] = useState<AssayFormData>({
    method: "X_RAY",
    pieces: 1,
    signatory: "",
    comments: "",
    shipmentTypeId: "",
    securitySealNo: "",
    goldbodSealNo: "",
    customsSealNo: "",
    shipmentNumber: "",
    dateOfAnalysis: "",
    dataSheetDates: "",
    sampleBottleDates: "",
    numberOfSamples: 1,
    numberOfBars: 1,
    sampleType: "capillary",
    exchangeRate: 0,
    commodityPrice: 0,
    pricePerOz: 0,
    totalNetGoldWeight: 0,
    totalNetSilverWeight: 0,
    totalNetGoldWeightOz: 0,
    totalNetSilverWeightOz: 0,
    totalGoldValue: 0,
    totalSilverValue: 0,
    totalCombinedValue: 0,
    totalValueGhs: 0,
  });

  useEffect(() => {
    if (!id || !assayId) {
      setError("Missing job card ID or assay ID");
      setMetaLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        // Load job card
        const jobCardRes = await apiClient.get(`/large-scale-job-cards/${id}`);
        setJobCard(jobCardRes);

        // Load shipment types
        const shipmentTypesRes = await apiClient.get("/shipment-types");
        setShipmentTypes(shipmentTypesRes);

        // Load current assay data
        const assayRes = await apiClient.get(
          `/large-scale-job-cards/${id}/assays/${assayId}`
        );
        const assay = assayRes;

        // Populate form with existing data
        setForm({
          method: assay.method || "X_RAY",
          pieces: assay.pieces || 1,
          signatory: assay.signatory || "",
          comments: assay.comments || "",
          shipmentTypeId: assay.shipmentTypeId || "",
          securitySealNo: assay.securitySealNo || "",
          goldbodSealNo: assay.goldbodSealNo || "",
          customsSealNo: assay.customsSealNo || "",
          shipmentNumber: assay.shipmentNumber || "",
          dateOfAnalysis: assay.dateOfAnalysis
            ? new Date(assay.dateOfAnalysis).toISOString().split("T")[0]
            : "",
          dataSheetDates: assay.dataSheetDates || "",
          sampleBottleDates: assay.sampleBottleDates || "",
          numberOfSamples: assay.numberOfSamples || 1,
          numberOfBars: assay.numberOfBars || 1,
          sampleType: assay.sampleType || "capillary",
          exchangeRate: assay.exchangeRate || 0,
          commodityPrice: assay.commodityPrice || 0,
          pricePerOz: assay.pricePerOz || 0,
          totalNetGoldWeight: assay.totalNetGoldWeight || 0,
          totalNetSilverWeight: assay.totalNetSilverWeight || 0,
          totalNetGoldWeightOz: assay.totalNetGoldWeightOz || 0,
          totalNetSilverWeightOz: assay.totalNetSilverWeightOz || 0,
          totalGoldValue: assay.totalGoldValue || 0,
          totalSilverValue: assay.totalSilverValue || 0,
          totalCombinedValue: assay.totalCombinedValue || 0,
          totalValueGhs: assay.totalValueGhs || 0,
        });

        // Load commodity prices and exchange rates
        await loadCommodityPricesAndExchange();
      } catch (err: any) {
        console.error("Error loading data:", err);
        setError(err.message || "Failed to load data");
        toast.error("Failed to load assay data");
      } finally {
        setMetaLoading(false);
      }
    };

    loadData();
  }, [id, assayId, apiClient]);

  const loadCommodityPricesAndExchange = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];

      // Load today's commodity prices
      const commodityPricesRes = await apiClient.get(
        `/daily-prices?date=${today}&type=COMMODITY`
      );
      setCommodityPrices(commodityPricesRes);

      // Load today's exchange rate
      const exchangeRes = await apiClient.get(
        `/daily-prices?date=${today}&type=EXCHANGE`
      );
      if (exchangeRes.length > 0) {
        setWeeklyExchange(exchangeRes[0]);
      } else {
        setMissingTodayExchange(true);
      }

      // Load current week exchange rate
      const currentWeekRes = await apiClient.get("/weekly-exchange/current");
      setCurrentWeekExchangeEntry(currentWeekRes);

      if (commodityPricesRes.length === 0) {
        setMissingTodayCommodity(true);
      }
    } catch (err) {
      console.error("Error loading prices:", err);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? 0 : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        method: form.method,
        pieces: form.pieces,
        signatory: form.signatory,
        comments: form.comments,
        shipmentTypeId: form.shipmentTypeId || null,
        securitySealNo: form.securitySealNo,
        goldbodSealNo: form.goldbodSealNo,
        customsSealNo: form.customsSealNo,
        shipmentNumber: form.shipmentNumber,
        dateOfAnalysis: form.dateOfAnalysis
          ? new Date(form.dateOfAnalysis).toISOString()
          : null,
        dataSheetDates: form.dataSheetDates,
        sampleBottleDates: form.sampleBottleDates,
        numberOfSamples: form.numberOfSamples,
        numberOfBars: form.numberOfBars,
        sampleType: form.sampleType,
        exchangeRate: form.exchangeRate,
        commodityPrice: form.commodityPrice,
        pricePerOz: form.pricePerOz,
        totalNetGoldWeight: form.totalNetGoldWeight,
        totalNetSilverWeight: form.totalNetSilverWeight,
        totalNetGoldWeightOz: form.totalNetGoldWeightOz,
        totalNetSilverWeightOz: form.totalNetSilverWeightOz,
        totalGoldValue: form.totalGoldValue,
        totalSilverValue: form.totalSilverValue,
        totalCombinedValue: form.totalCombinedValue,
        totalValueGhs: form.totalValueGhs,
      };

      await apiClient.put(
        `/large-scale-job-cards/${id}/assays/${assayId}`,
        payload
      );

      toast.success("Assay updated successfully");
      router.push(`/job-cards/large-scale/${id}/assays/${assayId}`);
    } catch (err: any) {
      console.error("Error updating assay:", err);
      setError(err.message || "Failed to update assay");
      toast.error("Failed to update assay");
    } finally {
      setSaving(false);
    }
  };

  if (metaLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !jobCard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <BackLink href={`/job-cards/large-scale/${id}/assays/${assayId}`}>
          Back to Assay Results
        </BackLink>

        <div className="mt-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Edit Large Scale Assay
          </h1>

          {jobCard && (
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Job Card: {jobCard.humanReadableId}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Reference:</span>{" "}
                  {jobCard.referenceNumber}
                </div>
                <div>
                  <span className="font-medium">Exporter:</span>{" "}
                  {jobCard.exporter.name}
                </div>
                <div>
                  <span className="font-medium">Received:</span>{" "}
                  {new Date(jobCard.receivedDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="method"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Assay Method
                  </label>
                  <select
                    id="method"
                    name="method"
                    value={form.method}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="X_RAY">X-Ray</option>
                    <option value="WATER_DENSITY">Water Density</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="pieces"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Number of Pieces
                  </label>
                  <input
                    type="number"
                    id="pieces"
                    name="pieces"
                    value={form.pieces}
                    onChange={handleInputChange}
                    min="1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="signatory"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Signatory
                  </label>
                  <input
                    type="text"
                    id="signatory"
                    name="signatory"
                    value={form.signatory}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="dateOfAnalysis"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Date of Analysis
                  </label>
                  <input
                    type="date"
                    id="dateOfAnalysis"
                    name="dateOfAnalysis"
                    value={form.dateOfAnalysis}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="dataSheetDates"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Data Sheet Dates
                  </label>
                  <input
                    type="text"
                    id="dataSheetDates"
                    name="dataSheetDates"
                    value={form.dataSheetDates}
                    onChange={handleInputChange}
                    placeholder="e.g., 15/09/2025, 16/09/2025"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="sampleBottleDates"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Sample Bottle Dates
                  </label>
                  <input
                    type="text"
                    id="sampleBottleDates"
                    name="sampleBottleDates"
                    value={form.sampleBottleDates}
                    onChange={handleInputChange}
                    placeholder="e.g., 15/09/2025, 16/09/2025"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label
                  htmlFor="comments"
                  className="block text-sm font-medium text-gray-700"
                >
                  Comments
                </label>
                <textarea
                  id="comments"
                  name="comments"
                  rows={3}
                  value={form.comments}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Seal Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Seal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="securitySealNo"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Security Seal No.
                  </label>
                  <input
                    type="text"
                    id="securitySealNo"
                    name="securitySealNo"
                    value={form.securitySealNo}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="goldbodSealNo"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Goldbod Seal No.
                  </label>
                  <input
                    type="text"
                    id="goldbodSealNo"
                    name="goldbodSealNo"
                    value={form.goldbodSealNo}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="customsSealNo"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Customs Seal No.
                  </label>
                  <input
                    type="text"
                    id="customsSealNo"
                    name="customsSealNo"
                    value={form.customsSealNo}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="shipmentNumber"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Shipment Number
                  </label>
                  <input
                    type="text"
                    id="shipmentNumber"
                    name="shipmentNumber"
                    value={form.shipmentNumber}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="shipmentTypeId"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Shipment Type
                  </label>
                  <select
                    id="shipmentTypeId"
                    name="shipmentTypeId"
                    value={form.shipmentTypeId}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select Shipment Type</option>
                    {shipmentTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Sample Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Sample Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="numberOfSamples"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Number of Samples
                  </label>
                  <input
                    type="number"
                    id="numberOfSamples"
                    name="numberOfSamples"
                    value={form.numberOfSamples}
                    onChange={handleInputChange}
                    min="1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="numberOfBars"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Number of Bars
                  </label>
                  <input
                    type="number"
                    id="numberOfBars"
                    name="numberOfBars"
                    value={form.numberOfBars}
                    onChange={handleInputChange}
                    min="1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="sampleType"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Sample Type
                  </label>
                  <select
                    id="sampleType"
                    name="sampleType"
                    value={form.sampleType}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="capillary">Capillary</option>
                    <option value="bulk">Bulk</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Financial Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="exchangeRate"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Exchange Rate (GHS/USD)
                  </label>
                  <input
                    type="number"
                    id="exchangeRate"
                    name="exchangeRate"
                    value={form.exchangeRate}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="commodityPrice"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Commodity Price (USD/oz)
                  </label>
                  <input
                    type="number"
                    id="commodityPrice"
                    name="commodityPrice"
                    value={form.commodityPrice}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="pricePerOz"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Price per Ounce (GHS)
                  </label>
                  <input
                    type="number"
                    id="pricePerOz"
                    name="pricePerOz"
                    value={form.pricePerOz}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Assay Results */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Assay Results
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label
                    htmlFor="totalNetGoldWeight"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Total Net Gold Weight (g)
                  </label>
                  <input
                    type="number"
                    id="totalNetGoldWeight"
                    name="totalNetGoldWeight"
                    value={form.totalNetGoldWeight}
                    onChange={handleInputChange}
                    step="0.001"
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="totalNetSilverWeight"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Total Net Silver Weight (g)
                  </label>
                  <input
                    type="number"
                    id="totalNetSilverWeight"
                    name="totalNetSilverWeight"
                    value={form.totalNetSilverWeight}
                    onChange={handleInputChange}
                    step="0.001"
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="totalNetGoldWeightOz"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Total Net Gold Weight (oz)
                  </label>
                  <input
                    type="number"
                    id="totalNetGoldWeightOz"
                    name="totalNetGoldWeightOz"
                    value={form.totalNetGoldWeightOz}
                    onChange={handleInputChange}
                    step="0.001"
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="totalNetSilverWeightOz"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Total Net Silver Weight (oz)
                  </label>
                  <input
                    type="number"
                    id="totalNetSilverWeightOz"
                    name="totalNetSilverWeightOz"
                    value={form.totalNetSilverWeightOz}
                    onChange={handleInputChange}
                    step="0.001"
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="totalGoldValue"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Total Gold Value (USD)
                  </label>
                  <input
                    type="number"
                    id="totalGoldValue"
                    name="totalGoldValue"
                    value={form.totalGoldValue}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="totalSilverValue"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Total Silver Value (USD)
                  </label>
                  <input
                    type="number"
                    id="totalSilverValue"
                    name="totalSilverValue"
                    value={form.totalSilverValue}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="totalCombinedValue"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Total Combined Value (USD)
                  </label>
                  <input
                    type="number"
                    id="totalCombinedValue"
                    name="totalCombinedValue"
                    value={form.totalCombinedValue}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="totalValueGhs"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Total Value (GHS)
                  </label>
                  <input
                    type="number"
                    id="totalValueGhs"
                    name="totalValueGhs"
                    value={form.totalValueGhs}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-red-800">{error}</div>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() =>
                  router.push(`/job-cards/large-scale/${id}/assays/${assayId}`)
                }
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Updating..." : "Update Assay"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default withClientAuth(EditLargeScaleAssayPage);
