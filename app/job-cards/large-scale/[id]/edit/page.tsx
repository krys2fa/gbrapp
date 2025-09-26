"use client";

import { withClientAuth } from "@/app/lib/with-client-auth";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import BackLink from "@/app/components/ui/BackLink";
import Select from "react-select";
import countryList from "react-select-country-list";
import toast from "react-hot-toast";

enum UnitOfMeasure {
  GRAMS = "g",
  KILOGRAMS = "kg",
}

interface LargeScaleJobCard {
  id: string;
  humanReadableId: string;
  referenceNumber: string;
  receivedDate: string;
  exporter: {
    id: string;
    name: string;
    exporterType: {
      id: string;
      name: string;
    };
    exporterCode?: string;
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
  commodityId?: string;
  commodity?: { id: string; name: string };
  buyerName?: string;
  buyerAddress?: string;
  teamLeader?: string;
  totalGrossWeight?: number;
  fineness?: number;
  totalNetWeight?: number;
  valueUsd?: number;
  valueGhs?: number;
  numberOfOunces?: number;
  pricePerOunce?: number;
  certificateNumber?: string;
  assays?: any[];
  invoices?: any[];
  createdAt: string;
  updatedAt: string;
}

function EditLargeScaleJobCardPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [canEdit, setCanEdit] = useState(true);
  const [editRestrictionReason, setEditRestrictionReason] = useState("");

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

  // Get countries list for the dropdown
  const countryOptions = useMemo(() => countryList().getData(), []);

  // Custom styles for React Select to match other form inputs
  const customSelectStyles = {
    container: (provided: Record<string, unknown>) => ({
      ...provided,
      height: "38px",
    }),
    control: (provided: Record<string, unknown>) => ({
      ...provided,
      minHeight: "38px",
      height: "38px",
      boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      borderColor: "#D1D5DB",
      "&:hover": {
        borderColor: "#9CA3AF",
      },
    }),
    valueContainer: (provided: Record<string, unknown>) => ({
      ...provided,
      height: "38px",
      padding: "0 6px",
      display: "flex",
      alignItems: "center",
    }),
    input: (provided: Record<string, unknown>) => ({
      ...provided,
      margin: "0",
      padding: "0",
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
    indicatorsContainer: (provided: Record<string, unknown>) => ({
      ...provided,
      height: "38px",
    }),
    option: (
      provided: Record<string, unknown>,
      state: { isSelected: boolean; isFocused: boolean }
    ) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#4F46E5"
        : state.isFocused
        ? "#EEF2FF"
        : "white",
      color: state.isSelected ? "white" : "#111827",
      cursor: "pointer",
      fontSize: "0.875rem",
    }),
  };

  const [formData, setFormData] = useState({
    referenceNumber: "",
    humanReadableId: "",
    receivedDate: new Date().toISOString().split("T")[0], // Today's date as default
    exporterId: "",
    unitOfMeasure: UnitOfMeasure.GRAMS,
    status: "pending",
    notes: "",
    destinationCountry: "",
    sourceOfGold: "Ghana", // Default to Ghana
    numberOfBoxes: "",
    commodityId: "",
    buyerName: "",
    buyerAddress: "",
    teamLeader: "",
    totalGrossWeight: "",
    fineness: "",
    totalNetWeight: "",
    valueUsd: "",
    valueGhs: "",
    numberOfOunces: "",
    pricePerOunce: "",
    certificateNumber: "",
  });

  useEffect(() => {
    // Fetch job card data and reference data
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("auth-token");
        if (!token) {
          const errorMsg = "No authentication token found. Please log in again.";
          console.error(errorMsg);
          toast.error(errorMsg);
          setError(errorMsg);
          setLoading(false);
          return;
        }

        const [jobCardRes, exportersRes, commoditiesRes] = await Promise.all([
          fetch(`/api/large-scale-job-cards/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/exporters", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/commodity", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        // Handle job card response
        if (jobCardRes.ok) {
          const jobCardData: LargeScaleJobCard = await jobCardRes.json();
          toast.success("Job card data loaded successfully");

          // Check if editing should be restricted
          const hasAssays = jobCardData.assays && jobCardData.assays.length > 0;
          const hasPaidInvoices =
            jobCardData.invoices &&
            jobCardData.invoices.some((inv: any) => inv.status === "paid");

          if (hasAssays || hasPaidInvoices) {
            setCanEdit(false);
            if (hasAssays && hasPaidInvoices) {
              setEditRestrictionReason(
                "This job card cannot be edited because it has assays and paid invoices."
              );
            } else if (hasAssays) {
              setEditRestrictionReason(
                "This job card cannot be edited because it has assays."
              );
            } else if (hasPaidInvoices) {
              setEditRestrictionReason(
                "This job card cannot be edited because it has paid invoices."
              );
            }
          }

          setFormData({
            referenceNumber: jobCardData.referenceNumber || "",
            humanReadableId: jobCardData.humanReadableId || "",
            receivedDate: new Date(jobCardData.receivedDate)
              .toISOString()
              .split("T")[0],
            exporterId: jobCardData.exporter?.id || "",
            unitOfMeasure:
              (jobCardData.unitOfMeasure as UnitOfMeasure) ||
              UnitOfMeasure.GRAMS,
            status: jobCardData.status || "pending",
            notes: jobCardData.notes || "",
            destinationCountry: jobCardData.destinationCountry || "",
            sourceOfGold: jobCardData.sourceOfGold || "Ghana",
            numberOfBoxes: jobCardData.numberOfBoxes?.toString() || "",
            commodityId: jobCardData.commodityId || "",
            buyerName: jobCardData.buyerName || "",
            buyerAddress: jobCardData.buyerAddress || "",
            teamLeader: jobCardData.teamLeader || "",
            totalGrossWeight: jobCardData.totalGrossWeight?.toString() || "",
            fineness: jobCardData.fineness?.toString() || "",
            totalNetWeight: jobCardData.totalNetWeight?.toString() || "",
            valueUsd: jobCardData.valueUsd?.toString() || "",
            valueGhs: jobCardData.valueGhs?.toString() || "",
            numberOfOunces: jobCardData.numberOfOunces?.toString() || "",
            pricePerOunce: jobCardData.pricePerOunce?.toString() || "",
            certificateNumber: jobCardData.certificateNumber || "",
          });
        } else {
          let errorMsg = `Failed to load job card (Status: ${jobCardRes.status})`;
          try {
            const errorData = await jobCardRes.json();
            if (errorData.error) {
              errorMsg += `: ${errorData.error}`;
            }
          } catch (parseError) {
            console.warn("Could not parse job card error response:", parseError);
          }
          console.error(`Job card API Error ${jobCardRes.status}:`, errorMsg);
          toast.error(errorMsg);
          setError(errorMsg);
        }

        // Handle exporters response
        if (exportersRes.ok) {
          const exportersData = await exportersRes.json();
          setExporters(exportersData);
        } else {
          const errorMsg = `Failed to load exporters (Status: ${exportersRes.status})`;
          console.error(`Exporters API Error ${exportersRes.status}:`, errorMsg);
          toast.error(errorMsg);
        }

        // Handle commodities response
        if (commoditiesRes.ok) {
          const commoditiesData = await commoditiesRes.json();
          setCommodities(Array.isArray(commoditiesData) ? commoditiesData : []);
        } else {
          const errorMsg = `Failed to load commodities (Status: ${commoditiesRes.status})`;
          console.error(`Commodities API Error ${commoditiesRes.status}:`, errorMsg);
          toast.error(errorMsg);
        }
      } catch (error) {
        const errorMsg = error instanceof Error
          ? `Network error loading data: ${error.message}`
          : "An unexpected error occurred while loading data";
        console.error("Fetch error:", error);
        toast.error(errorMsg);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const handleSelectChange = (name: string, option: any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: option ? option.value : "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canEdit) {
      toast.error("This job card cannot be edited");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(`/api/large-scale-job-cards/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          referenceNumber: formData.referenceNumber,
          humanReadableId: formData.humanReadableId,
          receivedDate: formData.receivedDate,
          exporterId: formData.exporterId,
          unitOfMeasure: formData.unitOfMeasure,
          status: formData.status,
          notes: formData.notes,
          destinationCountry: formData.destinationCountry,
          sourceOfGold: formData.sourceOfGold,
          numberOfBoxes: formData.numberOfBoxes
            ? Number(formData.numberOfBoxes)
            : undefined,
          commodityId: formData.commodityId || undefined,
          buyerName: formData.buyerName || undefined,
          buyerAddress: formData.buyerAddress || undefined,
          teamLeader: formData.teamLeader || undefined,
          totalGrossWeight: formData.totalGrossWeight
            ? Number(formData.totalGrossWeight)
            : undefined,
          fineness: formData.fineness ? Number(formData.fineness) : undefined,
          totalNetWeight: formData.totalNetWeight
            ? Number(formData.totalNetWeight)
            : undefined,
          valueUsd: formData.valueUsd ? Number(formData.valueUsd) : undefined,
          valueGhs: formData.valueGhs ? Number(formData.valueGhs) : undefined,
          numberOfOunces: formData.numberOfOunces
            ? Number(formData.numberOfOunces)
            : undefined,
          pricePerOunce: formData.pricePerOunce
            ? Number(formData.pricePerOunce)
            : undefined,
          certificateNumber: formData.certificateNumber || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update job card");
      }

      toast.success("Large scale job card updated successfully!");
      router.push(`/job-cards/large-scale/${id}`);
    } catch (error: any) {
      console.error("Error updating job card:", error);
      setError(error.message || "Failed to update job card");
      toast.error(error.message || "Failed to update job card");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <BackLink
        href="/job-cards/large-scale"
        label="Back to Large Scale Job Cards"
      />

      <div className="mt-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          Edit Large Scale Job Card
        </h1>

        {!canEdit && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Edit Restricted:</strong> {editRestrictionReason}
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number
                </label>
                <input
                  type="text"
                  name="referenceNumber"
                  value={formData.referenceNumber}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div> */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Id
                </label>
                <input
                  type="text"
                  name="humanReadableId"
                  value={formData.humanReadableId}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Received Date
                </label>
                <input
                  type="date"
                  name="receivedDate"
                  value={formData.receivedDate}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* certificateNumber moved to assay/valuation step */}

              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div> */}
            </div>
          </div>

          {/* Exporter and Commodity */}
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Exporter & Commodity
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exporter
                </label>
                <Select
                  value={
                    exporters.find((exp) => exp.id === formData.exporterId)
                      ? {
                          value: formData.exporterId,
                          label: exporters.find(
                            (exp) => exp.id === formData.exporterId
                          )?.name,
                        }
                      : null
                  }
                  onChange={(option) =>
                    handleSelectChange("exporterId", option)
                  }
                  options={exporters.map((exporter) => ({
                    value: exporter.id,
                    label: exporter.name,
                  }))}
                  styles={customSelectStyles}
                  isDisabled={!canEdit}
                  placeholder="Select an exporter..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commodity
                </label>
                <Select
                  value={
                    commodities.find((comm) => comm.id === formData.commodityId)
                      ? {
                          value: formData.commodityId,
                          label: commodities.find(
                            (comm) => comm.id === formData.commodityId
                          )?.name,
                        }
                      : null
                  }
                  onChange={(option) =>
                    handleSelectChange("commodityId", option)
                  }
                  options={commodities.map((commodity) => ({
                    value: commodity.id,
                    label: commodity.name,
                  }))}
                  styles={customSelectStyles}
                  isDisabled={!canEdit}
                  placeholder="Select a commodity..."
                />
              </div>
            </div>
          </div>

          {/* Logistics */}
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Logistics & Location
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination Country
                </label>
                <Select
                  value={
                    countryOptions.find(
                      (country: { value: string; label: string }) =>
                        country.value === formData.destinationCountry
                    )
                      ? {
                          value: formData.destinationCountry,
                          label: countryOptions.find(
                            (country: { value: string; label: string }) =>
                              country.value === formData.destinationCountry
                          )?.label,
                        }
                      : null
                  }
                  onChange={(option) =>
                    handleSelectChange("destinationCountry", option)
                  }
                  options={countryOptions}
                  styles={customSelectStyles}
                  isDisabled={!canEdit}
                  placeholder="Select destination country..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source of Gold
                </label>
                <input
                  type="text"
                  name="sourceOfGold"
                  value={formData.sourceOfGold}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Boxes
                </label>
                <input
                  type="number"
                  name="numberOfBoxes"
                  value={formData.numberOfBoxes}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit of Measure
                </label>
                <select
                  name="unitOfMeasure"
                  value={formData.unitOfMeasure}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value={UnitOfMeasure.GRAMS}>Grams (g)</option>
                  <option value={UnitOfMeasure.KILOGRAMS}>
                    Kilograms (kg)
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Officers */}
          {/* <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Officers</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customs Officer
                </label>
                <Select
                  value={
                    officers.customsOfficers.find(
                      (officer) => officer.id === formData.customsOfficerId
                    )
                      ? {
                          value: formData.customsOfficerId,
                          label: officers.customsOfficers.find(
                            (officer) =>
                              officer.id === formData.customsOfficerId
                          )?.name,
                        }
                      : null
                  }
                  onChange={(option) =>
                    handleSelectChange("customsOfficerId", option)
                  }
                  options={officers.customsOfficers.map((officer) => ({
                    value: officer.id,
                    label: `${officer.name} (${officer.badgeNumber})`,
                  }))}
                  styles={customSelectStyles}
                  isDisabled={!canEdit}
                  placeholder="Select customs officer..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assay Officer
                </label>
                <Select
                  value={
                    officers.assayOfficers.find(
                      (officer) => officer.id === formData.assayOfficerId
                    )
                      ? {
                          value: formData.assayOfficerId,
                          label: officers.assayOfficers.find(
                            (officer) => officer.id === formData.assayOfficerId
                          )?.name,
                        }
                      : null
                  }
                  onChange={(option) =>
                    handleSelectChange("assayOfficerId", option)
                  }
                  options={officers.assayOfficers.map((officer) => ({
                    value: officer.id,
                    label: `${officer.name} (${officer.badgeNumber})`,
                  }))}
                  styles={customSelectStyles}
                  isDisabled={!canEdit}
                  placeholder="Select assay officer..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Technical Director
                </label>
                <Select
                  value={
                    officers.technicalDirectors.find(
                      (officer) => officer.id === formData.technicalDirectorId
                    )
                      ? {
                          value: formData.technicalDirectorId,
                          label: officers.technicalDirectors.find(
                            (officer) =>
                              officer.id === formData.technicalDirectorId
                          )?.name,
                        }
                      : null
                  }
                  onChange={(option) =>
                    handleSelectChange("technicalDirectorId", option)
                  }
                  options={officers.technicalDirectors.map((officer) => ({
                    value: officer.id,
                    label: `${officer.name} (${officer.badgeNumber})`,
                  }))}
                  styles={customSelectStyles}
                  isDisabled={!canEdit}
                  placeholder="Select technical director..."
                />
              </div>
            </div>
          </div> */}

          {/* Measurements & Values */}
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Measurements & Values
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Gross Weight
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="totalGrossWeight"
                  value={formData.totalGrossWeight}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fineness
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="fineness"
                  value={formData.fineness}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Net Weight
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="totalNetWeight"
                  value={formData.totalNetWeight}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Ounces
                </label>
                <input
                  type="number"
                  step="0.001"
                  name="numberOfOunces"
                  value={formData.numberOfOunces}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price per Ounce
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="pricePerOunce"
                  value={formData.pricePerOunce}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="valueUsd"
                  value={formData.valueUsd}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value (GHS)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="valueGhs"
                  value={formData.valueGhs}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Buyer Information */}
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Buyer Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buyer Name
                </label>
                <input
                  type="text"
                  name="buyerName"
                  value={formData.buyerName}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exporter Authorized Signatory
                </label>
                <input
                  type="text"
                  name="teamLeader"
                  value={formData.teamLeader}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buyer Address
                </label>
                <textarea
                  name="buyerAddress"
                  value={formData.buyerAddress}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Additional Notes
            </h2>
            <div>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                disabled={!canEdit}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter any additional notes..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link
              href={`/job-cards/large-scale/${id}`}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || !canEdit}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default withClientAuth(EditLargeScaleJobCardPage);
