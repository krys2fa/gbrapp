"use client";

import { withClientAuth } from "@/app/lib/with-client-auth";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BackLink from "@/app/components/ui/BackLink";
import Select from "react-select";
import countryList from "react-select-country-list";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

enum UnitOfMeasure {
  GRAMS = "g",
  KILOGRAMS = "kg",
}

function NewLargeScaleJobCardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exporters, setExporters] = useState<
    { id: string; name: string; exporterType: { id: string; name: string } }[]
  >([]);
  const [commodities, setCommodities] = useState<
    { id: string; name: string }[]
  >([]);
  const [officers, setOfficers] = useState<{
    customsOfficers: { id: string; name: string; badgeNumber: string }[];
    assayOfficers: { id: string; name: string; badgeNumber: string }[];
    technicalDirectors: { id: string; name: string; badgeNumber: string }[];
    nacobOfficers: { id: string; name: string; badgeNumber: string }[];
    nationalSecurityOfficers: {
      id: string;
      name: string;
      badgeNumber: string;
    }[];
  }>({
    customsOfficers: [],
    assayOfficers: [],
    technicalDirectors: [],
    nacobOfficers: [],
    nationalSecurityOfficers: [],
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
    referenceNumber: "",
    receivedDate: new Date().toISOString().split("T")[0], // Today's date as default
    exporterId: "",
    unitOfMeasure: UnitOfMeasure.GRAMS,
    miningLicenseNumber: "",
    environmentalPermitNumber: "",
    siteManager: "",
    destinationCountry: "",
    sourceOfGold: "Ghana", // Default to Ghana
    numberOfBoxes: "",
    status: "pending",
    notes: "",
    customsOfficerId: "",
    assayOfficerId: "",
    technicalDirectorId: "",
    nacobOfficerId: "",
    nationalSecurityOfficerId: "",
    // Consignee section (replacing buyer)
    consigneeAddress: "",
    consigneeTelephone: "",
    consigneeMobile: "",
    consigneeEmail: "",
    // Exporter details section
    deliveryLocation: "",
    exporterTelephone: "",
    exporterEmail: "",
    exporterWebsite: "",
    exporterLicenseNumber: "",
    // Notified party section
    notifiedPartyName: "",
    notifiedPartyAddress: "",
    notifiedPartyEmail: "",
    notifiedPartyContactPerson: "",
    notifiedPartyTelephone: "",
    notifiedPartyMobile: "",
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
    // Fetch exporters, commodities, and officers
    const fetchData = async () => {
      try {
        const [exportersRes, commoditiesRes, officersRes] = await Promise.all([
          fetch("/api/exporters"),
          fetch("/api/commodity"),
          fetch("/api/officers"),
        ]);

        if (exportersRes.ok) {
          const exportersData = await exportersRes.json();
          setExporters(exportersData);
        }

        if (commoditiesRes.ok) {
          const commoditiesData = await commoditiesRes.json();
          setCommodities(Array.isArray(commoditiesData) ? commoditiesData : []);
        }

        if (officersRes.ok) {
          const officersData = await officersRes.json();
          // Group officers by type
          const groupedOfficers = {
            customsOfficers: officersData.filter(
              (officer: any) => officer.officerType === "CUSTOMS_OFFICER"
            ),
            assayOfficers: officersData.filter(
              (officer: any) => officer.officerType === "ASSAY_OFFICER"
            ),
            technicalDirectors: officersData.filter(
              (officer: any) => officer.officerType === "TECHNICAL_DIRECTOR"
            ),
            nacobOfficers: officersData.filter(
              (officer: any) => officer.officerType === "NACOB_OFFICER"
            ),
            nationalSecurityOfficers: officersData.filter(
              (officer: any) =>
                officer.officerType === "NATIONAL_SECURITY_OFFICER"
            ),
          };
          setOfficers(groupedOfficers);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load form data. Please try again.");
      }
    };
    fetchData();
  }, []);

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
            ).toFixed(2);
          }

          if (field === "grossWeight" || field === "silverFineness") {
            const grossWeight = parseFloat(updatedRow.grossWeight) || 0;
            const silverFineness = parseFloat(updatedRow.silverFineness) || 0;
            updatedRow.silverNetWeight = (
              (silverFineness / 100) *
              grossWeight
            ).toFixed(2);
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

    return {
      grossWeight: totals.grossWeight.toFixed(2),
      goldNetWeight: totals.goldNetWeight.toFixed(2),
      silverNetWeight: totals.silverNetWeight.toFixed(2),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate required fields
      if (!form.referenceNumber || !form.receivedDate || !form.exporterId) {
        setError(
          "Please fill in all required fields: Reference Number, Received Date, and Exporter."
        );
        setLoading(false);
        return;
      }

      // Validate that at least one commodity is selected with valid data
      const validCommodities = form.commodities.filter(
        (commodity) => commodity.id && commodity.id.trim() !== ""
      );

      if (validCommodities.length === 0) {
        setError("Please select at least one commodity for the job card.");
        setLoading(false);
        return;
      }

      const jobCardData = {
        referenceNumber: form.referenceNumber,
        receivedDate: form.receivedDate,
        exporterId: form.exporterId,
        unitOfMeasure: form.unitOfMeasure,
        notes: form.notes,
        destinationCountry: form.destinationCountry,
        sourceOfGold: form.sourceOfGold,
        numberOfBoxes: form.numberOfBoxes
          ? parseInt(form.numberOfBoxes)
          : undefined,
        customsOfficerId: form.customsOfficerId || undefined,
        assayOfficerId: form.assayOfficerId || undefined,
        technicalDirectorId: form.technicalDirectorId || undefined,
        nacobOfficerId: form.nacobOfficerId || undefined,
        nationalSecurityOfficerId: form.nationalSecurityOfficerId || undefined,
        deliveryLocation: form.deliveryLocation,
        commodities: form.commodities
          .filter((commodity) => commodity.id) // Only include commodities with IDs
          .map((commodity) => ({
            commodityId: commodity.id,
            grossWeight: commodity.grossWeight
              ? parseFloat(commodity.grossWeight)
              : undefined,
            netWeight: commodity.netWeight
              ? parseFloat(commodity.netWeight)
              : undefined,
            fineness: commodity.fineness
              ? parseFloat(commodity.fineness)
              : undefined,
            valueGhs: commodity.valueGhs
              ? parseFloat(commodity.valueGhs)
              : undefined,
            valueUsd: commodity.valueUsd
              ? parseFloat(commodity.valueUsd)
              : undefined,
            pricePerOunce: commodity.pricePerOunce
              ? parseFloat(commodity.pricePerOunce)
              : undefined,
            numberOfOunces: commodity.numberOfOunces
              ? parseFloat(commodity.numberOfOunces)
              : undefined,
          })),
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
        toast.success("Large scale job card created successfully!");
        router.push(`/job-cards/large-scale/${newJobCard.id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create job card.");
      }
    } catch (error) {
      console.error("Error creating job card:", error);
      setError("An unexpected error occurred. Please try again.");
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

  const handleCommodityChange = (
    index: number,
    field: string,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      commodities: prev.commodities.map((commodity, i) =>
        i === index ? { ...commodity, [field]: value } : commodity
      ),
    }));
  };

  const addCommodity = () => {
    setForm((prev) => ({
      ...prev,
      commodities: [
        ...prev.commodities,
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
    }));
  };

  const removeCommodity = (index: number) => {
    if (form.commodities.length > 1) {
      setForm((prev) => ({
        ...prev,
        commodities: prev.commodities.filter((_, i) => i !== index),
      }));
    }
  };

  const handleCommoditySelect = (index: number, commodityId: string) => {
    const selectedCommodity = commodities.find((c) => c.id === commodityId);
    setForm((prev) => ({
      ...prev,
      commodities: prev.commodities.map((commodity, i) =>
        i === index
          ? {
              ...commodity,
              id: commodityId,
              name: selectedCommodity?.name || "",
            }
          : commodity
      ),
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
          <h1 className="text-3xl font-bold text-gray-900">
            New Large Scale Job Card
          </h1>
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
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
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
                </div>

                <div>
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
                </div>

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
                    {exporters.map((exporter) => (
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
              </div>
            </div>
          </div>

          {/* Excel Upload Section */}
          <div className="mt-8 bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Commodities&apos; Purity Processing
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Upload an Excel file (.xlsx, .xls, .csv) with exact column
                headers "Ag" and "Au". The system will calculate averages for
                every 3 rows of data.
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              SN
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Bar No
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Gross Weight
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Gold Fineness (%)
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Gold Net Weight
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Silver Fineness (%)
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Silver Net Weight
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
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
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
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {row.goldFineness}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {row.goldNetWeight}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {row.silverFineness}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {row.silverNetWeight}
                              </td>
                            </tr>
                          ))}
                          {/* Totals Row */}
                          {assayersData.length > 0 && (
                            <tr className="bg-gray-100 font-semibold">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                Total
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                -
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {calculateAssayersTotals().grossWeight}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                -
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {calculateAssayersTotals().goldNetWeight}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                -
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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

          {/* Commodities */}

          {/* Commodities */}
          {/* <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Commodities *
              </h3>
              {form.commodities.map((commodity, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-medium text-gray-900">
                      Commodity {index + 1}
                    </h4>
                    {form.commodities.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCommodity(index)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Commodity *
                      </label>
                      <select
                        value={commodity.id}
                        onChange={(e) =>
                          handleCommoditySelect(index, e.target.value)
                        }
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      >
                        <option value="">Select Commodity</option>
                        {commodities.map((comm) => (
                          <option key={comm.id} value={comm.id}>
                            {comm.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Gross Weight ({form.unitOfMeasure})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={commodity.grossWeight}
                        onChange={(e) =>
                          handleCommodityChange(
                            index,
                            "grossWeight",
                            e.target.value
                          )
                        }
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Net Weight ({form.unitOfMeasure})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={commodity.netWeight}
                        onChange={(e) =>
                          handleCommodityChange(
                            index,
                            "netWeight",
                            e.target.value
                          )
                        }
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Fineness (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={commodity.fineness}
                        onChange={(e) =>
                          handleCommodityChange(
                            index,
                            "fineness",
                            e.target.value
                          )
                        }
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Value (GHS)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={commodity.valueGhs}
                        onChange={(e) =>
                          handleCommodityChange(
                            index,
                            "valueGhs",
                            e.target.value
                          )
                        }
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Value (USD)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={commodity.valueUsd}
                        onChange={(e) =>
                          handleCommodityChange(
                            index,
                            "valueUsd",
                            e.target.value
                          )
                        }
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Price per Ounce
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={commodity.pricePerOunce}
                        onChange={(e) =>
                          handleCommodityChange(
                            index,
                            "pricePerOunce",
                            e.target.value
                          )
                        }
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Number of Ounces
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={commodity.numberOfOunces}
                        onChange={(e) =>
                          handleCommodityChange(
                            index,
                            "numberOfOunces",
                            e.target.value
                          )
                        }
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addCommodity}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add Another Commodity
              </button>
            </div>
          </div> */}

          {/* Weight and Quality Information */}
          {/* <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Weight and Quality Information
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="totalGrossWeight"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Total Gross Weight ({form.unitOfMeasure})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="totalGrossWeight"
                    value={form.commodities.reduce(
                      (sum, com) => sum + (parseFloat(com.grossWeight) || 0),
                      0
                    )}
                    readOnly
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="totalNetWeight"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Total Net Weight ({form.unitOfMeasure})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="totalNetWeight"
                    value={form.commodities.reduce(
                      (sum, com) => sum + (parseFloat(com.netWeight) || 0),
                      0
                    )}
                    readOnly
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="numberOfBoxes"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Number of Boxes
                  </label>
                  <input
                    type="number"
                    name="numberOfBoxes"
                    id="numberOfBoxes"
                    value={form.numberOfBoxes}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter number of boxes"
                  />
                </div>
              </div>
            </div>
          </div> */}

          {/* Officer Assignments */}
          {/* <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Officer Assignments
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="customsOfficerId"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Customs Officer
                  </label>
                  <select
                    name="customsOfficerId"
                    id="customsOfficerId"
                    value={form.customsOfficerId}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Select customs officer</option>
                    {officers.customsOfficers.map((officer) => (
                      <option key={officer.id} value={officer.id}>
                        {officer.name} ({officer.badgeNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="assayOfficerId"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Assay Officer
                  </label>
                  <select
                    name="assayOfficerId"
                    id="assayOfficerId"
                    value={form.assayOfficerId}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Select assay officer</option>
                    {officers.assayOfficers.map((officer) => (
                      <option key={officer.id} value={officer.id}>
                        {officer.name} ({officer.badgeNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="technicalDirectorId"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Technical Director
                  </label>
                  <select
                    name="technicalDirectorId"
                    id="technicalDirectorId"
                    value={form.technicalDirectorId}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Select technical director</option>
                    {officers.technicalDirectors.map((officer) => (
                      <option key={officer.id} value={officer.id}>
                        {officer.name} ({officer.badgeNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="nacobOfficerId"
                    className="block text-sm font-medium text-gray-700"
                  >
                    NACOB Officer
                  </label>
                  <select
                    name="nacobOfficerId"
                    id="nacobOfficerId"
                    value={form.nacobOfficerId}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Select NACOB officer</option>
                    {officers.nacobOfficers.map((officer) => (
                      <option key={officer.id} value={officer.id}>
                        {officer.name} ({officer.badgeNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="nationalSecurityOfficerId"
                    className="block text-sm font-medium text-gray-700"
                  >
                    National Security Officer
                  </label>
                  <select
                    name="nationalSecurityOfficerId"
                    id="nationalSecurityOfficerId"
                    value={form.nationalSecurityOfficerId}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Select national security officer</option>
                    {officers.nationalSecurityOfficers.map((officer) => (
                      <option key={officer.id} value={officer.id}>
                        {officer.name} ({officer.badgeNumber})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div> */}

          {/* Notes */}
          {/* <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Additional Notes
              </h3>
              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700"
                >
                  Notes
                </label>
                <textarea
                  name="notes"
                  id="notes"
                  rows={4}
                  value={form.notes}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Enter any additional notes or comments"
                />
              </div>
            </div>
          </div> */}

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
              {loading ? "Creating..." : "Create Large Scale Job Card"}
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
    </div>
  );
}

export default withClientAuth(NewLargeScaleJobCardPage);
