"use client";

import { withClientAuth } from "@/app/lib/with-client-auth";
import { useAuth } from "@/app/context/auth-context";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BackLink from "@/app/components/ui/BackLink";
import Select from "react-select";
import countryList from "react-select-country-list";
import { formatDate } from "@/app/lib/utils";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { ClientLogger, LogLevel, LogCategory } from "@/lib/client-logger";

enum UnitOfMeasure {
  GRAMS = "g",
  KILOGRAMS = "kg",
}

function NewLargeScaleJobCardPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Logger instance for file logging
  const logger = ClientLogger.getInstance();

  // Helper function to log both to console and file
  const logInfo = async (message: string, metadata?: Record<string, any>) => {
    await logger.info(LogCategory.JOB_CARD, message, metadata);
  };

  const logError = async (message: string, metadata?: Record<string, any>) => {
    await logger.error(LogCategory.JOB_CARD, message, metadata);
  };

  const logWarn = async (message: string, metadata?: Record<string, any>) => {
    console.warn(message, metadata || "");
    await logger.warn(LogCategory.JOB_CARD, message, metadata);
  };
  const [exporters, setExporters] = useState<
    {
      id: string;
      name: string;
      exporterCode: string;
      exporterType: { id: string; name: string };
    }[]
  >([]);
  const [commodities, setCommodities] = useState<
    { id: string; name: string }[]
  >([]);
  const [shipmentTypes, setShipmentTypes] = useState<
    { id: string; name: string; description: string }[]
  >([]);
  const [officers, setOfficers] = useState<{
    customsOfficers: { id: string; name: string; badgeNumber: string }[];
    assayOfficers: { id: string; name: string; badgeNumber: string }[];
    technicalDirectors: { id: string; name: string; badgeNumber: string }[];
  }>({
    customsOfficers: [],
    assayOfficers: [],
    technicalDirectors: [],
  });

  // Excel processing state
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [processedData, setProcessedData] = useState<any[]>([]);
  const [excelProcessing, setExcelProcessing] = useState(false);
  const [excelError, setExcelError] = useState("");

  // Assayers data entry state
  const [assayersData, setAssayersData] = useState<
    {
      barNo: string;
      grossWeight: string;
      goldFineness: string;
      goldNetWeight: string;
      silverFineness: string;
      silverNetWeight: string;
    }[]
  >([]);

  // Modal state
  const [showProcessedResultsModal, setShowProcessedResultsModal] =
    useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Meta bar state
  const [selectedExporter, setSelectedExporter] = useState<any>(null);
  const [exchangeRate, setExchangeRate] = useState<string>("");
  const [goldPrice, setGoldPrice] = useState<string>("");
  const [silverPrice, setSilverPrice] = useState<string>("");
  const [assayMethod, setAssayMethod] = useState<string>("x-ray");
  const [authorizedSignatory, setAuthorizedSignatory] = useState<string>("");

  // Loading states for visual cues
  const [isLoadingExporter, setIsLoadingExporter] = useState<boolean>(false);
  const [isLoadingExchangeRate, setIsLoadingExchangeRate] =
    useState<boolean>(false);
  const [isLoadingCommodityPrices, setIsLoadingCommodityPrices] =
    useState<boolean>(false);

  // Ref for hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get countries list for the dropdown
  const countryOptions = useMemo(() => countryList().getData(), []);

  // Custom styles for React Select to match other form inputs
  const customSelectStyles = {
    container: (provided: Record<string, unknown>) => ({
      ...provided,
      width: "100%",
    }),
    control: (provided: Record<string, unknown>) => ({
      ...provided,
      borderColor: "#d1d5db",
      "&:hover": {
        borderColor: "#9ca3af",
      },
      "&:focus-within": {
        borderColor: "#6366f1",
        boxShadow: "0 0 0 1px #6366f1",
      },
    }),
    input: (provided: Record<string, unknown>) => ({
      ...provided,
      fontSize: "14px",
    }),
    placeholder: (provided: Record<string, unknown>) => ({
      ...provided,
      color: "#9ca3af",
      fontSize: "14px",
    }),
    singleValue: (provided: Record<string, unknown>) => ({
      ...provided,
      fontSize: "14px",
    }),
    option: (provided: Record<string, unknown>) => ({
      ...provided,
      fontSize: "14px",
    }),
  };

  const [form, setForm] = useState({
    receivedDate: new Date().toISOString().split("T")[0], // Today's date as default
    exporterId: "",
    unitOfMeasure: UnitOfMeasure.KILOGRAMS,
    destinationCountry: "",
    sourceOfGold: "Ghana", // Default to Ghana
    numberOfBars: "",
    typeOfShipment: "",
    dateOfAnalysis: "",
    sampleBottleDates: "",
    dataSheetDates: "",
    numberOfSamples: "",
    sampleType: "",
    shipmentNumber: "",
    status: "pending",
    notes: "",
    certificateNumber: "",
    commodities: [
      {
        id: "",
        name: "",
        grossWeight: "",
        netWeight: "",
        fineness: "",
        valueGhs: "",
        valueUsd: "",
        pricePerOunce: "",
        numberOfOunces: "",
      },
    ],
  });

  useEffect(() => {
    // Fetch exporters, shipment types
    const fetchData = async () => {
      try {
        const [exportersRes, shipmentTypesRes] = await Promise.all([
          fetch("/api/exporters"),
          fetch("/api/shipment-types"),
        ]);

        if (exportersRes.ok) {
          const exportersData = await exportersRes.json();
          setExporters(exportersData);
        }

        if (shipmentTypesRes.ok) {
          const shipmentTypesData = await shipmentTypesRes.json();
          setShipmentTypes(
            Array.isArray(shipmentTypesData) ? shipmentTypesData : []
          );
        }

        // Load initial exchange rate from weekly prices
        await logInfo("Loading initial exchange rate...");
        const initialExchangeRes = await fetch(
          `/api/weekly-prices?type=EXCHANGE&approvedOnly=true`
        );
        await logInfo("Initial exchange response received", {
          status: initialExchangeRes.status,
        });

        if (initialExchangeRes.ok) {
          const initialExchangeData = await initialExchangeRes.json();
          await logInfo("Initial exchange data received", {
            dataLength: initialExchangeData.length,
            firstRate: initialExchangeData[0]?.price || null,
          });
          if (initialExchangeData.length > 0) {
            await logInfo("Setting initial exchange rate", {
              price: initialExchangeData[0].price,
            });
            setExchangeRate(initialExchangeData[0].price || "");
          }
        } else {
          await logError("Failed to fetch initial exchange rate", {
            status: initialExchangeRes.status,
          });
        }
      } catch (error) {
        await logError("Error fetching initial data", {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        setError("Failed to load form data. Please try again.");
      }
    };
    fetchData();
  }, []);

  // Fetch meta bar data when exporter or data sheet date changes
  // This ensures that market data (exchange rates and commodity prices) update
  // whenever the data sheet date changes, providing real-time pricing information
  useEffect(() => {
    const fetchMetaData = async () => {
      try {
        // Fetch exporter details only if an exporter is selected
        if (form.exporterId) {
          setIsLoadingExporter(true);
          const exporterRes = await fetch(`/api/exporters/${form.exporterId}`);
          if (exporterRes.ok) {
            const exporterData = await exporterRes.json();
            setSelectedExporter(exporterData);
          }
          setIsLoadingExporter(false);
        } else {
          // Clear exporter data if no exporter is selected
          setSelectedExporter(null);
          setIsLoadingExporter(false);
        }

        // Fetch latest exchange rate from weekly prices
        setIsLoadingExchangeRate(true);
        await logInfo("Fetching exchange rate...");
        const exchangeRes = await fetch(
          `/api/weekly-prices?type=EXCHANGE&approvedOnly=true`
        );
        await logInfo("Exchange response received", {
          status: exchangeRes.status,
        });

        if (exchangeRes.ok) {
          const exchangeData = await exchangeRes.json();
          await logInfo("Exchange data received", {
            dataLength: exchangeData.length,
            firstEntry: exchangeData[0] || null,
          });
          // Get the latest exchange rate
          if (exchangeData.length > 0) {
            await logInfo("Setting exchange rate", {
              price: exchangeData[0].price,
            });
            setExchangeRate(exchangeData[0].price || "");
          } else {
            await logWarn("No weekly exchange data available");
            toast.error("No weekly exchange rate data available");
          }
        } else {
          const errorText = await exchangeRes.text();
          await logError("Failed to fetch exchange rate", {
            status: exchangeRes.status,
            statusText: exchangeRes.statusText,
            errorResponse: errorText,
          });
          toast.error("Failed to load weekly exchange rate");
        }
        setIsLoadingExchangeRate(false);

        // Fetch commodity prices based on data sheet date (if available)
        if (form.dataSheetDates) {
          setIsLoadingCommodityPrices(true);
          await logInfo("Fetching commodity prices for data sheet date", {
            pricingDate: form.dataSheetDates,
          });

          try {
            // Fetch gold price for the data sheet date
            const goldResponse = await fetch(
              `/api/commodities/Au/price?date=${form.dataSheetDates}`
            );
            if (goldResponse.ok) {
              const goldData = await goldResponse.json();
              if (goldData.available) {
                setGoldPrice(goldData.price?.toString() || "");
                await logInfo("Gold price set successfully", {
                  price: goldData.price,
                  date: form.dataSheetDates,
                });
              } else {
                setGoldPrice("Not Available");
                await logWarn("Gold price not available for data sheet date", {
                  date: form.dataSheetDates,
                  error: goldData.error,
                });
              }
            } else {
              setGoldPrice("Not Available");
              await logError("Failed to fetch gold price", {
                status: goldResponse.status,
                date: form.dataSheetDates,
              });
            }

            // Fetch silver price for the data sheet date
            const silverResponse = await fetch(
              `/api/commodities/Ag/price?date=${form.dataSheetDates}`
            );
            if (silverResponse.ok) {
              const silverData = await silverResponse.json();
              if (silverData.available) {
                setSilverPrice(silverData.price?.toString() || "");
                await logInfo("Silver price set successfully", {
                  price: silverData.price,
                  date: form.dataSheetDates,
                });
              } else {
                setSilverPrice("Not Available");
                await logWarn(
                  "Silver price not available for data sheet date",
                  {
                    date: form.dataSheetDates,
                    error: silverData.error,
                  }
                );
              }
            } else {
              setSilverPrice("Not Available");
              await logError("Failed to fetch silver price", {
                status: silverResponse.status,
                date: form.dataSheetDates,
              });
            }
          } catch (error) {
            await logError(
              "Error fetching commodity prices for data sheet date",
              {
                error: error instanceof Error ? error.message : String(error),
                date: form.dataSheetDates,
              }
            );
            setGoldPrice("Not Available");
            setSilverPrice("Not Available");
          }
          setIsLoadingCommodityPrices(false);
        } else {
          // No data sheet date selected, show placeholder values
          setGoldPrice("Select data sheet date");
          setSilverPrice("Select data sheet date");
          setIsLoadingCommodityPrices(false);
          await logInfo(
            "No data sheet date selected, showing placeholder values"
          );
        }
      } catch (error) {
        await logError("Error fetching meta data", {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        // Reset loading states in case of error
        setIsLoadingExporter(false);
        setIsLoadingExchangeRate(false);
        setIsLoadingCommodityPrices(false);
      }
    };

    fetchMetaData();
  }, [form.exporterId, form.dataSheetDates]);

  // Excel processing functions
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setExcelFile(file);
      setExcelError("");
      setProcessedData([]);
    }
  };

  const processExcelFile = async () => {
    if (!excelFile) return;

    setExcelProcessing(true);
    setExcelError("");

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });

          // Get the first worksheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          // Find Ag and Au columns on row 2 (index 1)
          const headers = jsonData[1] as string[];
          const agIndex = headers.findIndex(
            (header) => header?.toString().trim() === "Ag"
          );
          const auIndex = headers.findIndex(
            (header) => header?.toString().trim() === "Au"
          );

          if (agIndex === -1 || auIndex === -1) {
            throw new Error(
              'Could not find Ag or Au columns in the Excel file. Please ensure column headers are exactly "Ag" and "Au".'
            );
          }

          // Process data in groups of 3 rows starting from row 3 (index 2)
          const processedRows: any[] = [];
          for (let i = 2; i < jsonData.length; i += 3) {
            const group: any[] = [];
            for (let j = 0; j < 3 && i + j < jsonData.length; j++) {
              const row = jsonData[i + j] as any[];
              if (
                row &&
                row[agIndex] !== undefined &&
                row[auIndex] !== undefined
              ) {
                group.push({
                  ag: parseFloat(row[agIndex]) || 0,
                  au: parseFloat(row[auIndex]) || 0,
                  rowNumber: i + j + 1,
                });
              }
            }

            if (group.length > 0) {
              const avgAg =
                group.reduce((sum, item) => sum + item.ag, 0) / group.length;
              const avgAu =
                group.reduce((sum, item) => sum + item.au, 0) / group.length;

              processedRows.push({
                groupNumber: Math.floor(i / 3) + 1,
                avgAg: avgAg.toFixed(4),
                avgAu: avgAu.toFixed(4),
                sampleCount: group.length,
                rows: group.map((item) => item.rowNumber).join(", "),
              });
            }
          }

          setProcessedData(processedRows);

          // Initialize assayers data with the same number of rows as processed results
          if (processedRows.length > 0) {
            const initialAssayersData = processedRows.map((processedRow) => ({
              barNo: "",
              grossWeight: "",
              goldFineness: processedRow.avgAu,
              goldNetWeight: "",
              silverFineness: processedRow.avgAg,
              silverNetWeight: "",
            }));
            setAssayersData(initialAssayersData);
          }
        } catch (error: any) {
          setExcelError(error.message || "Error processing Excel file");
        } finally {
          setExcelProcessing(false);
        }
      };

      reader.readAsArrayBuffer(excelFile);
    } catch (error: any) {
      setExcelError(error.message || "Error reading file");
      setExcelProcessing(false);
    }
  };

  // Assayers data entry functions
  const updateAssayersRow = (index: number, field: string, value: string) => {
    setAssayersData((prev) =>
      prev.map((row, i) => {
        if (i === index) {
          const updatedRow = { ...row, [field]: value };

          // Calculate net weights when gross weight or fineness changes
          if (field === "grossWeight" || field === "goldFineness") {
            const grossWeight = parseFloat(updatedRow.grossWeight) || 0;
            const goldFineness = parseFloat(updatedRow.goldFineness) || 0;
            updatedRow.goldNetWeight = (
              (goldFineness / 100) *
              grossWeight
            ).toFixed(4);
          }

          if (field === "grossWeight" || field === "silverFineness") {
            const grossWeight = parseFloat(updatedRow.grossWeight) || 0;
            const silverFineness = parseFloat(updatedRow.silverFineness) || 0;
            updatedRow.silverNetWeight = (
              (silverFineness / 100) *
              grossWeight
            ).toFixed(4);
          }

          return updatedRow;
        }
        return row;
      })
    );
  };

  const calculateAssayersTotals = () => {
    const totals = {
      grossWeight: 0,
      goldNetWeight: 0,
      silverNetWeight: 0,
    };

    assayersData.forEach((row) => {
      totals.grossWeight += parseFloat(row.grossWeight) || 0;
      totals.goldNetWeight += parseFloat(row.goldNetWeight) || 0;
      totals.silverNetWeight += parseFloat(row.silverNetWeight) || 0;
    });

    // Calculate total fineness: (net total / gross total) * 100
    const goldFineness =
      totals.grossWeight > 0
        ? (totals.goldNetWeight / totals.grossWeight) * 100
        : 0;
    const silverFineness =
      totals.grossWeight > 0
        ? (totals.silverNetWeight / totals.grossWeight) * 100
        : 0;

    return {
      grossWeight: totals.grossWeight.toLocaleString(undefined, {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      }),
      goldNetWeight: totals.goldNetWeight.toLocaleString(undefined, {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      }),
      silverNetWeight: totals.silverNetWeight.toLocaleString(undefined, {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      }),
      goldFineness: goldFineness.toLocaleString(undefined, {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      }),
      silverFineness: silverFineness.toLocaleString(undefined, {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      }),
    };
  };

  // Helper function to calculate valuation details
  const calculateValuationDetails = (
    measurements: any[],
    unitOfMeasure: string,
    commodityPrice: number = 0,
    pricePerOz: number = 0,
    exchangeRate: number = 1
  ) => {
    const GRAMS_PER_TROY_OUNCE = 31.1035;

    // Helper function to convert to grams
    const convertToGrams = (value: any, unit?: string) => {
      const numValue = Number(value) || 0;
      if (!numValue) return 0;
      const u = (unit || "g").toString().toLowerCase();
      if (u === "kg" || u === "kilogram" || u === "kilograms")
        return numValue * 1000;
      if (u === "g" || u === "gram" || u === "grams") return numValue;
      if (u === "lb" || u === "lbs" || u === "pound" || u === "pounds")
        return numValue * 453.59237;
      return numValue; // default: treat as grams
    };

    // Calculate total net weights in grams
    const totalNetGoldWeightGrams = measurements.reduce(
      (acc: number, m: any) =>
        acc + convertToGrams(m.netGoldWeight, unitOfMeasure),
      0
    );

    const totalNetSilverWeightGrams = measurements.reduce(
      (acc: number, m: any) =>
        acc + convertToGrams(m.netSilverWeight, unitOfMeasure),
      0
    );

    // Convert to ounces
    const totalNetGoldWeightOz = totalNetGoldWeightGrams / GRAMS_PER_TROY_OUNCE;
    const totalNetSilverWeightOz =
      totalNetSilverWeightGrams / GRAMS_PER_TROY_OUNCE;

    // Calculate values
    const totalGoldValue = totalNetGoldWeightOz * commodityPrice;
    const totalSilverValue = totalNetSilverWeightOz * pricePerOz;
    const totalCombinedValue = totalGoldValue + totalSilverValue;
    const totalValueGhs = totalCombinedValue * exchangeRate;

    return {
      totalNetGoldWeight: totalNetGoldWeightGrams,
      totalNetGoldWeightOz,
      totalNetSilverWeight: totalNetSilverWeightGrams,
      totalNetSilverWeightOz,
      totalGoldValue,
      totalSilverValue,
      totalCombinedValue,
      totalValueGhs,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate required fields
      if (!form.receivedDate || !form.exporterId) {
        const errorMessage =
          "Please fill in all required fields: Received Date and Exporter.";
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
        return;
      }

      // Validate new required fields
      const requiredFields = [
        { field: form.destinationCountry, name: "Destination Country" },
        { field: form.sourceOfGold, name: "Source of Gold" },
        { field: form.numberOfBars, name: "Number of Bars" },
        { field: form.typeOfShipment, name: "Type of Shipment" },
        { field: form.dateOfAnalysis, name: "Date of Analysis" },
        { field: form.sampleBottleDates, name: "Sample Bottle Dates" },
        { field: form.dataSheetDates, name: "Data Sheet Dates" },
        { field: form.numberOfSamples, name: "Number of Samples" },
        { field: form.sampleType, name: "Sample Type" },
        { field: form.shipmentNumber, name: "Shipment Number" },
      ];

      const missingFields = requiredFields
        .filter(({ field }) => !field || field.toString().trim() === "")
        .map(({ name }) => name);

      if (missingFields.length > 0) {
        const errorMessage = `Please fill in all required fields: ${missingFields.join(
          ", "
        )}.`;
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
        return;
      }

      // Validate assay information
      if (!authorizedSignatory.trim()) {
        const errorMessage = "Please enter the Authorized Signatory.";
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
        return;
      }

      // Validate assay data entry if processed data exists
      if (processedData.length > 0 && assayersData.length > 0) {
        const incompleteRows = assayersData.filter((row, index) => {
          return (
            !row.barNo.trim() ||
            !row.grossWeight.trim() ||
            !row.goldFineness.trim() ||
            !row.silverFineness.trim()
          );
        });

        if (incompleteRows.length > 0) {
          const errorMessage = `Please fill in all required fields for assay data entry. ${incompleteRows.length} row(s) have missing information.`;
          setError(errorMessage);
          toast.error(errorMessage);
          setLoading(false);
          return;
        }
      }

      // Show preview modal instead of saving
      setShowPreviewModal(true);
    } catch (error) {
      await logError("Error preparing preview", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      const errorMessage = "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSave = async () => {
    setLoading(true);
    setError("");

    try {
      // Validate that data sheet date is provided (required for pricing lookups)
      if (!form.dataSheetDates) {
        const errorMessage =
          "Data Sheet Date is required for commodity price and exchange rate calculations. Please select a date.";
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
        return;
      }

      // Calculate valuation details if assay data exists
      let valuationDetails = null;
      if (assayersData.length > 0) {
        // Fetch pricing information based on data sheet date
        // IMPORTANT: All pricing (commodity prices and exchange rates) are fetched
        // based on the data sheet date, not the received date or current date.
        // This ensures accurate pricing for the specific assaying date.
        let commodityPrice = 0;
        let pricePerOz = 0;
        let exchangeRate = 1;

        try {
          // Use data sheet date for all pricing calculations (commodity prices and exchange rates)
          // This ensures pricing is based on the date the data sheet was prepared, not the received date
          const pricingDate = form.dataSheetDates;
          const goldResponse = await fetch(
            `/api/commodities/Au/price?date=${pricingDate}`
          );
          if (goldResponse.ok) {
            const goldData = await goldResponse.json();
            if (goldData.available) {
              commodityPrice = goldData.price || 0;
            } else {
              throw new Error(
                `Gold price not available for ${pricingDate}: ${goldData.error}`
              );
            }
          } else {
            throw new Error("Failed to fetch gold price");
          }

          // Fetch silver price for the data sheet date
          const silverResponse = await fetch(
            `/api/commodities/Ag/price?date=${pricingDate}`
          );
          if (silverResponse.ok) {
            const silverData = await silverResponse.json();
            if (silverData.available) {
              pricePerOz = silverData.price || 0;
            } else {
              throw new Error(
                `Silver price not available for ${pricingDate}: ${silverData.error}`
              );
            }
          } else {
            throw new Error("Failed to fetch silver price");
          }

          // Fetch exchange rate from weekly prices
          await logInfo("Fetching weekly exchange rate for job card creation", {
            pricingDate,
            apiEndpoint: `/api/weekly-prices?type=EXCHANGE&approvedOnly=true`,
          });

          const exchangeResponse = await fetch(
            `/api/weekly-prices?type=EXCHANGE&approvedOnly=true`
          );
          await logInfo("Weekly exchange rate API response received", {
            status: exchangeResponse.status,
            statusText: exchangeResponse.statusText,
          });

          if (exchangeResponse.ok) {
            const exchangeData = await exchangeResponse.json();
            await logInfo("Weekly exchange rate data received", {
              dataLength: exchangeData.length,
              firstEntry: exchangeData[0] || null,
              allEntries: exchangeData.map((entry: any) => ({
                id: entry.id,
                price: entry.price,
                status: entry.status,
                weekStart: entry.weekStartDate,
                weekEnd: entry.weekEndDate,
              })),
            });

            if (exchangeData.length > 0) {
              // Use the most recent approved weekly exchange rate
              const latestRate = exchangeData[0];
              exchangeRate = latestRate.price || 1;
              await logInfo(
                "Exchange rate set successfully from weekly prices",
                {
                  exchangeRate,
                  rateId: latestRate.id,
                  weekStart: latestRate.weekStartDate,
                  weekEnd: latestRate.weekEndDate,
                  status: latestRate.status,
                }
              );
            } else {
              await logError(
                "No approved weekly exchange rates found in response",
                {
                  pricingDate,
                  responseData: exchangeData,
                  apiUrl: `/api/weekly-prices?type=EXCHANGE&approvedOnly=true`,
                }
              );
              throw new Error(
                `No approved weekly exchange rates available. Please go to Setup → Weekly Exchange Rates to add and approve a USD to GHS exchange rate.`
              );
            }
          } else {
            const errorText = await exchangeResponse.text();
            await logError("Failed to fetch weekly exchange rate - API error", {
              status: exchangeResponse.status,
              statusText: exchangeResponse.statusText,
              errorResponse: errorText,
              pricingDate,
            });
            throw new Error(
              `Failed to fetch weekly exchange rate (${exchangeResponse.status}): ${errorText}`
            );
          }
        } catch (error) {
          const errorDetails = {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : "UnknownError",
          };

          await logError(
            "Pricing data error during job card creation",
            errorDetails
          );

          // Log the specific error for debugging
          console.error(
            "Full error details during job card creation:",
            errorDetails
          );

          const originalErrorMessage =
            error instanceof Error ? error.message : "Unknown error";
          let userFriendlyMessage = originalErrorMessage;

          // Provide more specific guidance based on the error
          if (originalErrorMessage.includes("weekly exchange rate")) {
            userFriendlyMessage = `${originalErrorMessage} Please check that you have approved weekly exchange rates in Setup → Weekly Exchange Rates.`;
          } else if (
            originalErrorMessage.includes("Gold price not available") ||
            originalErrorMessage.includes("Silver price not available")
          ) {
            userFriendlyMessage = `${originalErrorMessage} Please ensure commodity prices are available for the selected date.`;
          }

          const errorMessage = `Cannot save job card: ${userFriendlyMessage}`;
          setError(errorMessage);
          toast.error(errorMessage);
          setLoading(false);
          return; // Prevent saving
        }

        // Convert assayersData to measurements format expected by the calculation function
        const measurements = assayersData.map((row, index) => ({
          id: index + 1,
          barNumber: row.barNo,
          grossWeight: parseFloat(row.grossWeight) || 0,
          goldAssay: parseFloat(row.goldFineness) || 0,
          silverAssay: parseFloat(row.silverFineness) || 0,
          netGoldWeight: parseFloat(row.goldNetWeight) || 0,
          netSilverWeight: parseFloat(row.silverNetWeight) || 0,
        }));

        valuationDetails = {
          ...calculateValuationDetails(
            measurements,
            form.unitOfMeasure,
            commodityPrice,
            pricePerOz,
            exchangeRate
          ),
          exchangeRate,
          commodityPrice,
          pricePerOz,
        };
      }

      const jobCardData = {
        receivedDate: form.receivedDate,
        exporterId: form.exporterId,
        unitOfMeasure: form.unitOfMeasure,
        notes: form.notes,
        destinationCountry: form.destinationCountry,
        sourceOfGold: form.sourceOfGold,
        numberOfBars: form.numberOfBars
          ? parseInt(form.numberOfBars)
          : undefined,
        // Assay-related fields
        assayMethod: assayMethod,
        authorizedSignatory: authorizedSignatory,
        typeOfShipment: form.typeOfShipment,
        dateOfAnalysis: form.dateOfAnalysis,
        sampleBottleDates: form.sampleBottleDates,
        dataSheetDates: form.dataSheetDates,
        numberOfSamples: form.numberOfSamples,
        sampleType: form.sampleType,
        shipmentNumber: form.shipmentNumber,
        certificateNumber: form.certificateNumber || undefined,
        assayersData: assayersData.length > 0 ? assayersData : undefined,
        // Include valuation details
        ...valuationDetails,
      };

      const response = await fetch("/api/large-scale-job-cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobCardData),
      });

      if (response.ok) {
        const newJobCard = await response.json();
        await logInfo("Large scale job card created successfully", {
          jobCardId: newJobCard.id,
          exporterId: form.exporterId,
          commodityCount: newJobCard.commodities?.length || 0,
        });
        toast.success("Valuation saved successfully!");
        setShowPreviewModal(false);
        router.push(`/job-cards/large-scale/${newJobCard.id}`);
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || "Failed to create job card.";
        setError(errorMessage);
        toast.error(errorMessage);
        setShowPreviewModal(false);
      }
    } catch (error) {
      await logError("Error creating job card", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      const errorMessage = "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
      setShowPreviewModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackLink
          href="/job-cards/large-scale"
          label="Back to Large Scale Job Cards"
        />

        <div className="mt-8">
          <h1 className="text-3xl font-bold text-gray-900">New Job</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create a new large scale mining operation job card with all required
            details.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-2xl font-medium leading-6 text-gray-900 mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* <div>
                  <label
                    htmlFor="referenceNumber"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Reference Number *
                  </label>
                  <input
                    type="text"
                    name="referenceNumber"
                    id="referenceNumber"
                    required
                    value={form.referenceNumber}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter reference number"
                  />
                </div> */}

                {/* <div>
                  <label
                    htmlFor="receivedDate"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Received Date *
                  </label>
                  <input
                    type="date"
                    name="receivedDate"
                    id="receivedDate"
                    required
                    value={form.receivedDate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Required for pricing calculations. Gold, silver, and
                    exchange rates must be available for this date.
                  </p>
                </div> */}

                <div>
                  <label
                    htmlFor="exporterId"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Exporter *
                  </label>
                  <select
                    name="exporterId"
                    id="exporterId"
                    required
                    value={form.exporterId}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Select an exporter</option>
                    {exporters
                      .filter((exp) => {
                        const anyExp = exp as any;
                        const typeId =
                          anyExp.exporterType?.id ?? anyExp.exporterType;
                        const typeName = anyExp.exporterType?.name ?? "";
                        // Accept explicit id '1' OR types whose name indicates large-scale operations
                        if (String(typeId) === "1") return true;
                        if (
                          typeof typeName === "string" &&
                          /large/i.test(typeName)
                        )
                          return true;
                        return false;
                      })
                      .map((exporter) => (
                        <option key={exporter.id} value={exporter.id}>
                          {exporter.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="unitOfMeasure"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Unit of Measure
                  </label>
                  <select
                    name="unitOfMeasure"
                    id="unitOfMeasure"
                    value={form.unitOfMeasure}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value={UnitOfMeasure.GRAMS}>Grams</option>
                    <option value={UnitOfMeasure.KILOGRAMS}>Kilograms</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="destinationCountry"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Destination Country
                  </label>
                  <Select
                    options={countryOptions}
                    value={countryOptions.find(
                      (option: { value: string; label: string }) =>
                        option.label === form.destinationCountry
                    )}
                    onChange={(selectedOption) =>
                      setForm((prev) => ({
                        ...prev,
                        destinationCountry: selectedOption?.label || "",
                      }))
                    }
                    placeholder="Select destination country"
                    styles={customSelectStyles}
                    isClearable
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
                    name="numberOfBars"
                    id="numberOfBars"
                    value={form.numberOfBars}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter number of bars"
                    min="0"
                  />
                </div>

                <div>
                  <label
                    htmlFor="sourceOfGold"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Source of Gold
                  </label>
                  <input
                    type="text"
                    name="sourceOfGold"
                    id="sourceOfGold"
                    value={form.sourceOfGold}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter source of gold"
                  />
                </div>

                <div>
                  <label
                    htmlFor="typeOfShipment"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Type of Shipment
                  </label>
                  <select
                    name="typeOfShipment"
                    id="typeOfShipment"
                    value={form.typeOfShipment}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Select shipment type</option>
                    {shipmentTypes.map((shipmentType) => (
                      <option key={shipmentType.id} value={shipmentType.id}>
                        {shipmentType.name}
                      </option>
                    ))}
                  </select>
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
                    name="dateOfAnalysis"
                    id="dateOfAnalysis"
                    value={form.dateOfAnalysis}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                    type="date"
                    name="sampleBottleDates"
                    id="sampleBottleDates"
                    value={form.sampleBottleDates}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="dataSheetDates"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Data Sheet Dates *
                    <span className="text-xs text-gray-500 block">
                      (Used for commodity pricing and exchange rate
                      calculations)
                    </span>
                  </label>
                  <input
                    type="date"
                    name="dataSheetDates"
                    id="dataSheetDates"
                    value={form.dataSheetDates}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="numberOfSamples"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Number of Samples
                  </label>
                  <input
                    type="number"
                    name="numberOfSamples"
                    id="numberOfSamples"
                    value={form.numberOfSamples}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter number of samples"
                    min="0"
                  />
                </div>

                <div>
                  <label
                    htmlFor="sampleType"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Sample Type
                  </label>
                  <input
                    type="text"
                    name="sampleType"
                    id="sampleType"
                    value={form.sampleType}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter sample type"
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
                    name="shipmentNumber"
                    id="shipmentNumber"
                    value={form.shipmentNumber}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter shipment number"
                  />
                </div>

                <div>
                  <label
                    htmlFor="certificateNumber"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Certificate Number
                  </label>
                  <input
                    type="text"
                    name="certificateNumber"
                    id="certificateNumber"
                    value={form.certificateNumber}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter certificate number"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Meta Bar - Show when exporter is selected or data sheet date is set */}
          {(form.exporterId || form.dataSheetDates) && (
            <div
              className={`bg-blue-50 border border-blue-200 rounded-lg p-4 transition-all duration-300 ${
                isLoadingExporter ||
                isLoadingExchangeRate ||
                isLoadingCommodityPrices
                  ? "shadow-lg ring-2 ring-blue-300 ring-opacity-50"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-medium text-blue-900">
                  Exporter Information & Market Data
                </h3>
                {(isLoadingExporter ||
                  isLoadingExchangeRate ||
                  isLoadingCommodityPrices) && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="animate-pulse flex items-center gap-1">
                      <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div
                        className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-blue-700 font-medium">
                      {isLoadingExporter && "Loading exporter details..."}
                      {!isLoadingExporter &&
                        isLoadingExchangeRate &&
                        "Loading exchange rate..."}
                      {!isLoadingExporter &&
                        !isLoadingExchangeRate &&
                        isLoadingCommodityPrices &&
                        "Loading commodity prices..."}
                    </span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Exporter Details */}
                <div className="space-y-2">
                  <h4 className="text-2xl font-medium text-blue-800 flex items-center gap-2">
                    Exporter Details
                    {isLoadingExporter && (
                      <div className="inline-flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span className="text-xs text-blue-600">
                          Updating...
                        </span>
                      </div>
                    )}
                  </h4>
                  {isLoadingExporter ? (
                    <div className="text-sm text-gray-500 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </div>
                  ) : selectedExporter ? (
                    <div className="text-sm text-black">
                      <p>
                        <strong className="text-blue-700">Name:</strong>{" "}
                        <strong>{selectedExporter.name}</strong>
                      </p>
                      <p>
                        <strong className="text-blue-700">Type:</strong>{" "}
                        <strong>{selectedExporter.exporterType?.name}</strong>
                      </p>
                      {/* <p>
                        <strong className="text-blue-700">License:</strong>{" "}
                        <strong>
                          {selectedExporter.licenseNumber || "N/A"}
                        </strong>
                      </p> */}
                      <p>
                        <strong className="text-blue-700">Email:</strong>{" "}
                        <strong>{selectedExporter.email || "N/A"}</strong>
                      </p>
                      <p>
                        <strong className="text-blue-700">Phone:</strong>{" "}
                        <strong>{selectedExporter.phone || "N/A"}</strong>
                      </p>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      <p>No exporter selected</p>
                    </div>
                  )}
                </div>

                {/* Market Data */}
                <div className="space-y-2">
                  <h4 className="text-xl font-medium text-blue-800 flex items-center gap-2">
                    Latest Market Data
                    {(isLoadingExchangeRate || isLoadingCommodityPrices) && (
                      <div className="inline-flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span className="text-xs text-blue-600">
                          Updating prices...
                        </span>
                      </div>
                    )}
                  </h4>
                  <div className="text-sm text-blue-700">
                    <p className="flex items-center gap-2">
                      <strong>Exchange Rate:</strong>{" "}
                      {isLoadingExchangeRate ? (
                        <div className="flex items-center gap-1">
                          <div className="animate-spin h-3 w-3 border border-blue-500 rounded-full border-t-transparent"></div>
                          <span className="text-gray-500 text-xs">
                            Loading...
                          </span>
                        </div>
                      ) : (
                        <strong
                          className={
                            exchangeRate && exchangeRate !== "Loading..."
                              ? "text-black"
                              : "text-gray-500"
                          }
                        >
                          {exchangeRate || "Loading..."}
                        </strong>
                      )}
                    </p>
                    <p className="flex items-center gap-2">
                      <strong>Gold Price:</strong>{" "}
                      {isLoadingCommodityPrices ? (
                        <div className="flex items-center gap-1">
                          <div className="animate-spin h-3 w-3 border border-blue-500 rounded-full border-t-transparent"></div>
                          <span className="text-gray-500 text-xs">
                            Loading...
                          </span>
                        </div>
                      ) : (
                        <strong
                          className={
                            goldPrice &&
                            goldPrice !== "Loading..." &&
                            goldPrice !== "Not Available"
                              ? "text-black"
                              : goldPrice === "Not Available"
                              ? "text-red-500"
                              : "text-gray-500"
                          }
                        >
                          {goldPrice || "Loading..."}
                          {goldPrice === "Not Available" && " (Setup Required)"}
                        </strong>
                      )}
                    </p>
                    <p className="flex items-center gap-2">
                      <strong>Silver Price:</strong>{" "}
                      {isLoadingCommodityPrices ? (
                        <div className="flex items-center gap-1">
                          <div className="animate-spin h-3 w-3 border border-blue-500 rounded-full border-t-transparent"></div>
                          <span className="text-gray-500 text-xs">
                            Loading...
                          </span>
                        </div>
                      ) : (
                        <strong
                          className={
                            silverPrice &&
                            silverPrice !== "Loading..." &&
                            silverPrice !== "Not Available"
                              ? "text-black"
                              : silverPrice === "Not Available"
                              ? "text-red-500"
                              : "text-gray-500"
                          }
                        >
                          {silverPrice || "Loading..."}
                          {silverPrice === "Not Available" &&
                            " (Setup Required)"}
                        </strong>
                      )}
                    </p>
                  </div>
                </div>

                {/* Assay Inputs */}
                <div className="space-y-2">
                  <h4 className="text-2xl font-medium text-blue-800">
                    Assay Information
                  </h4>
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">
                      Assay Method
                    </label>
                    <select
                      value={assayMethod}
                      onChange={(e) => setAssayMethod(e.target.value)}
                      className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="x-ray">X-Ray</option>
                      <option value="water-density">Water Density</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">
                      Authorized Signatory
                    </label>
                    <input
                      type="text"
                      value={authorizedSignatory}
                      onChange={(e) => setAuthorizedSignatory(e.target.value)}
                      className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Enter authorized signatory"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Excel Upload Section */}
          <div className="mt-8 bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-2xl font-medium leading-6 text-gray-900 mb-4">
                Commodities&apos; Purity Processing
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Upload an Excel file (.xlsx, .xls, .csv) with exact column
                headers &quot;Ag&quot; and &quot;Au&quot;. The system will
                calculate averages for every 3 rows of data.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Select Excel File
                  </label>
                  <div className="mt-1 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg
                        className="mr-2 h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      Choose File
                    </button>
                    {excelFile && (
                      <span className="text-sm text-gray-600">
                        {excelFile.name}
                      </span>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={processExcelFile}
                    disabled={!excelFile || excelProcessing}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {excelProcessing ? "Processing..." : "Process Excel File"}
                  </button>

                  {processedData.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowProcessedResultsModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg
                        className="mr-2 h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      View Processed Results
                    </button>
                  )}

                  {excelFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setExcelFile(null);
                        setProcessedData([]);
                        setAssayersData([]);
                        setExcelError("");
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {excelError && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="text-sm text-red-700">{excelError}</div>
                  </div>
                )}

                {/* Assayers Data Entry Details Table */}
                {processedData.length > 0 && (
                  <div className="mt-8">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-md font-medium text-gray-900">
                        Assayers Data Entry Details
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                              SN
                            </th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                              Bar No
                            </th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                              Gross Weight
                            </th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                              Gold Fineness (%)
                            </th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                              Gold Net Weight ({form.unitOfMeasure})
                            </th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                              Silver Fineness (%)
                            </th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                              Silver Net Weight ({form.unitOfMeasure})
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {assayersData.map((row, index) => (
                            <tr
                              key={index}
                              className={
                                index % 2 === 0 ? "bg-white" : "bg-gray-50"
                              }
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                                {index + 1}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={row.barNo}
                                  onChange={(e) =>
                                    updateAssayersRow(
                                      index,
                                      "barNo",
                                      e.target.value
                                    )
                                  }
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                  placeholder="Enter bar number"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="number"
                                  step="0.0001"
                                  value={row.grossWeight}
                                  onChange={(e) =>
                                    updateAssayersRow(
                                      index,
                                      "grossWeight",
                                      e.target.value
                                    )
                                  }
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                  placeholder="0.0000"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                {row.goldFineness}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                {row.goldNetWeight}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                {row.silverFineness}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                {row.silverNetWeight}
                              </td>
                            </tr>
                          ))}
                          {/* Totals Row */}
                          {assayersData.length > 0 && (
                            <tr className="bg-gray-100 font-semibold">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                                Total
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                -
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                {calculateAssayersTotals().grossWeight}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                {calculateAssayersTotals().goldFineness}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                {calculateAssayersTotals().goldNetWeight}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                {calculateAssayersTotals().silverFineness}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                {calculateAssayersTotals().silverNetWeight}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <Link
              href="/job-cards/large-scale"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Evaluating..." : "Perform Valuation"}
            </button>
          </div>
        </form>
      </div>

      {/* Processed Results Modal */}
      {showProcessedResultsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={() => setShowProcessedResultsModal(false)}
              ></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Processed Results
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowProcessedResultsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Group #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                          AVG Ag
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                          AVG Au
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Samples
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Source Rows
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {processedData.map((row, index) => (
                        <tr
                          key={index}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {row.groupNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {row.avgAg}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {row.avgAu}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {row.sampleCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {row.rows}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowProcessedResultsModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Sample Analysis & Valuation Preview
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
                            ASSAY REPORT ANALYSIS
                          </h1>
                        </div>

                        {/* Top: show exporter and assay date above the measurements table */}

                        {/* Basic Information Display */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 my-4">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Exporter
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {selectedExporter?.name || "N/A"}
                            </dd>
                          </div>
                          <div className="">
                            <dt className="text-sm font-medium text-gray-500">
                              Received Date
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {form.receivedDate
                                ? formatDate(form.receivedDate)
                                : "N/A"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Unit of Measure
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {form.unitOfMeasure === UnitOfMeasure.KILOGRAMS
                                ? "Kilograms"
                                : "Grams"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Destination Country
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {form.destinationCountry
                                ? countryOptions.find(
                                    (option: {
                                      value: string;
                                      label: string;
                                    }) =>
                                      option.value === form.destinationCountry
                                  )?.label || form.destinationCountry
                                : "N/A"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Source of Gold
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {form.sourceOfGold || "N/A"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Number of Bars
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {form.numberOfBars || "N/A"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Type of Shipment
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {form.typeOfShipment
                                ? shipmentTypes.find(
                                    (st) => st.id === form.typeOfShipment
                                  )?.name || form.typeOfShipment
                                : "N/A"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Date of Analysis
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {form.dateOfAnalysis || "N/A"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Sample Bottle Dates
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {form.sampleBottleDates || "N/A"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Data Sheet Dates
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {form.dataSheetDates || "N/A"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Number of Samples
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {form.numberOfSamples || "N/A"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Sample Type
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {form.sampleType || "N/A"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Shipment Number
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {form.shipmentNumber || "N/A"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Assay Method
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {assayMethod === "x-ray"
                                ? "X-Ray"
                                : assayMethod === "water-density"
                                ? "Water Density"
                                : "N/A"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Authorized Signatory
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {authorizedSignatory || "N/A"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Exchange Rate
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {exchangeRate || "N/A"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Gold Price
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {goldPrice || "N/A"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Silver Price
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {silverPrice || "N/A"}
                            </dd>
                          </div>
                        </div>

                        {/* Assay Data Entry Section */}
                        {assayersData.length > 0 && (
                          <div className="mt-6">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">
                              Assay Data Entry Results
                            </h4>
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                                    SN
                                  </th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                                    Bar No
                                  </th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                                    Gross Weight
                                  </th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                                    Gold Fineness (%)
                                  </th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                                    Gold Net Weight
                                  </th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                                    Gold Net Weight (oz)
                                  </th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                                    Silver Fineness (%)
                                  </th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                                    Silver Net Weight
                                  </th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                                    Silver Net Weight (oz)
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {assayersData.map((row, index) => (
                                  <tr key={index}>
                                    <td className="px-4 py-2 text-sm text-gray-700 text-center">
                                      {index + 1}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-700 text-center">
                                      {row.barNo || "N/A"}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-700 text-center">
                                      {row.grossWeight || "N/A"}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-700 text-center">
                                      {row.goldFineness || "N/A"}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-700 text-center">
                                      {row.goldNetWeight || "N/A"}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-700 text-center">
                                      {(() => {
                                        const goldNetWeight =
                                          parseFloat(row.goldNetWeight) || 0;
                                        if (goldNetWeight === 0) return "N/A";

                                        const convertToOunces = (
                                          weight: number,
                                          unit: string
                                        ) => {
                                          const GRAMS_TO_OUNCES = 31.1035;
                                          if (
                                            unit === UnitOfMeasure.KILOGRAMS
                                          ) {
                                            return (
                                              (weight * 1000) / GRAMS_TO_OUNCES
                                            );
                                          } else {
                                            return weight / GRAMS_TO_OUNCES;
                                          }
                                        };

                                        const goldOz = convertToOunces(
                                          goldNetWeight,
                                          form.unitOfMeasure
                                        );
                                        return goldOz.toLocaleString(
                                          undefined,
                                          {
                                            minimumFractionDigits: 3,
                                            maximumFractionDigits: 3,
                                          }
                                        );
                                      })()}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-700 text-center">
                                      {row.silverFineness || "N/A"}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-700 text-center">
                                      {row.silverNetWeight || "N/A"}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-700 text-center">
                                      {(() => {
                                        const silverNetWeight =
                                          parseFloat(row.silverNetWeight) || 0;
                                        if (silverNetWeight === 0) return "N/A";

                                        const convertToOunces = (
                                          weight: number,
                                          unit: string
                                        ) => {
                                          const GRAMS_TO_OUNCES = 31.1035;
                                          if (
                                            unit === UnitOfMeasure.KILOGRAMS
                                          ) {
                                            return (
                                              (weight * 1000) / GRAMS_TO_OUNCES
                                            );
                                          } else {
                                            return weight / GRAMS_TO_OUNCES;
                                          }
                                        };

                                        const silverOz = convertToOunces(
                                          silverNetWeight,
                                          form.unitOfMeasure
                                        );
                                        return silverOz.toLocaleString(
                                          undefined,
                                          {
                                            minimumFractionDigits: 3,
                                            maximumFractionDigits: 3,
                                          }
                                        );
                                      })()}
                                    </td>
                                  </tr>
                                ))}
                                {/* Totals Row */}
                                <tr className="bg-gray-50 font-semibold">
                                  <td className="px-4 py-2 text-sm text-gray-900 text-center">
                                    Total
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-900 text-center">
                                    -
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-900 text-center">
                                    {calculateAssayersTotals().grossWeight}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-900 text-center">
                                    {calculateAssayersTotals().goldFineness}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-900 text-center">
                                    {calculateAssayersTotals().goldNetWeight}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-900 text-center">
                                    {(() => {
                                      const totals = calculateAssayersTotals();
                                      const goldNetWeight =
                                        parseFloat(totals.goldNetWeight) || 0;
                                      if (goldNetWeight === 0) return "0.000";

                                      const convertToOunces = (
                                        weight: number,
                                        unit: string
                                      ) => {
                                        const GRAMS_TO_OUNCES = 31.1035;
                                        if (unit === UnitOfMeasure.KILOGRAMS) {
                                          return (
                                            (weight * 1000) / GRAMS_TO_OUNCES
                                          );
                                        } else {
                                          return weight / GRAMS_TO_OUNCES;
                                        }
                                      };

                                      const goldOz = convertToOunces(
                                        goldNetWeight,
                                        form.unitOfMeasure
                                      );
                                      return goldOz.toLocaleString(undefined, {
                                        minimumFractionDigits: 3,
                                        maximumFractionDigits: 3,
                                      });
                                    })()}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-900 text-center">
                                    {calculateAssayersTotals().silverFineness}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-900 text-center">
                                    {calculateAssayersTotals().silverNetWeight}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-900 text-center">
                                    {(() => {
                                      const totals = calculateAssayersTotals();
                                      const silverNetWeight =
                                        parseFloat(totals.silverNetWeight) || 0;
                                      if (silverNetWeight === 0) return "0.000";

                                      const convertToOunces = (
                                        weight: number,
                                        unit: string
                                      ) => {
                                        const GRAMS_TO_OUNCES = 31.1035;
                                        if (unit === UnitOfMeasure.KILOGRAMS) {
                                          return (
                                            (weight * 1000) / GRAMS_TO_OUNCES
                                          );
                                        } else {
                                          return weight / GRAMS_TO_OUNCES;
                                        }
                                      };

                                      const silverOz = convertToOunces(
                                        silverNetWeight,
                                        form.unitOfMeasure
                                      );
                                      return silverOz.toLocaleString(
                                        undefined,
                                        {
                                          minimumFractionDigits: 3,
                                          maximumFractionDigits: 3,
                                        }
                                      );
                                    })()}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Calculated Values */}
                        {assayersData.length > 0 && (
                          <div className="mt-6">
                            <h4 className="text-sm font-medium text-gray-900 mb-4">
                              Valuation
                            </h4>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(() => {
                                  const goldPricePerOunce =
                                    parseFloat(goldPrice) || 0;
                                  const silverPricePerOunce =
                                    parseFloat(silverPrice) || 0;

                                  // Convert assayersData to measurements format (same as save operation)
                                  const measurements = assayersData.map(
                                    (row, index) => ({
                                      id: index + 1,
                                      barNumber: row.barNo,
                                      grossWeight:
                                        parseFloat(row.grossWeight) || 0,
                                      goldAssay:
                                        parseFloat(row.goldFineness) || 0,
                                      silverAssay:
                                        parseFloat(row.silverFineness) || 0,
                                      netGoldWeight:
                                        parseFloat(row.goldNetWeight) || 0,
                                      netSilverWeight:
                                        parseFloat(row.silverNetWeight) || 0,
                                    })
                                  );

                                  // Use the same calculation logic as the save operation
                                  const valuationDetails =
                                    calculateValuationDetails(
                                      measurements,
                                      form.unitOfMeasure,
                                      goldPricePerOunce,
                                      silverPricePerOunce,
                                      parseFloat(exchangeRate) || 1
                                    );

                                  const goldNetWeightOz =
                                    valuationDetails.totalNetGoldWeightOz;
                                  const silverNetWeightOz =
                                    valuationDetails.totalNetSilverWeightOz;
                                  const goldValue =
                                    valuationDetails.totalGoldValue;
                                  const silverValue =
                                    valuationDetails.totalSilverValue;
                                  const totalValue =
                                    valuationDetails.totalCombinedValue;

                                  // Get totals for display reference
                                  const totals = calculateAssayersTotals();

                                  return (
                                    <>
                                      <div>
                                        <dt className="text-sm font-medium text-gray-500">
                                          Net Weight Gold (oz)
                                          <span className="text-xs text-gray-400 ml-1">
                                            (from {totals.goldNetWeight}{" "}
                                            {form.unitOfMeasure.toLowerCase()})
                                          </span>
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900 font-semibold">
                                          {goldNetWeightOz.toLocaleString(
                                            undefined,
                                            {
                                              minimumFractionDigits: 3,
                                              maximumFractionDigits: 3,
                                            }
                                          )}
                                        </dd>
                                      </div>
                                      <div>
                                        <dt className="text-sm font-medium text-gray-500">
                                          Net Weight Silver (oz)
                                          <span className="text-xs text-gray-400 ml-1">
                                            (from {totals.silverNetWeight}{" "}
                                            {form.unitOfMeasure.toLowerCase()})
                                          </span>
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900 font-semibold">
                                          {silverNetWeightOz.toLocaleString(
                                            undefined,
                                            {
                                              minimumFractionDigits: 3,
                                              maximumFractionDigits: 3,
                                            }
                                          )}
                                        </dd>
                                      </div>
                                      <div>
                                        <dt className="text-sm font-medium text-gray-500">
                                          Gold Price per Ounce
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                          $
                                          {goldPricePerOunce.toLocaleString(
                                            undefined,
                                            {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            }
                                          )}
                                        </dd>
                                      </div>
                                      <div>
                                        <dt className="text-sm font-medium text-gray-500">
                                          Silver Price per Ounce
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                          $
                                          {silverPricePerOunce.toLocaleString(
                                            undefined,
                                            {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            }
                                          )}
                                        </dd>
                                      </div>
                                      <div>
                                        <dt className="text-sm font-medium text-gray-500">
                                          Value of Gold
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900 font-semibold">
                                          $
                                          {goldValue.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          })}
                                        </dd>
                                      </div>
                                      <div>
                                        <dt className="text-sm font-medium text-gray-500">
                                          Value of Silver
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900 font-semibold">
                                          $
                                          {silverValue.toLocaleString(
                                            undefined,
                                            {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            }
                                          )}
                                        </dd>
                                      </div>
                                      <div className="sm:col-span-2 lg:col-span-3">
                                        <dt className="text-sm font-medium text-gray-500">
                                          Total Shipment Value (Gold & Silver)
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900 font-bold">
                                          $
                                          {totalValue.toLocaleString(
                                            undefined,
                                            {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            }
                                          )}
                                        </dd>
                                      </div>
                                      {exchangeRate && (
                                        <div className="sm:col-span-2 lg:col-span-3">
                                          <dt className="text-sm font-medium text-gray-500">
                                            Total Shipment Value GHS (Exchange
                                            Rate: {exchangeRate})
                                          </dt>
                                          <dd className="mt-1 text-sm text-gray-900 font-bold">
                                            GHS{" "}
                                            {(
                                              totalValue *
                                              parseFloat(exchangeRate)
                                            ).toLocaleString(undefined, {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            })}
                                          </dd>
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
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
                  onClick={handleConfirmSave}
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Confirm & Save"}
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

export default withClientAuth(NewLargeScaleJobCardPage);
