"use client";

import { withClientAuth } from "@/app/lib/with-client-auth";
import { useAuth } from "@/app/context/auth-context";
import { useApiClient } from "@/app/lib/api-client";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
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

function EditLargeScaleJobCardPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const router = useRouter();
  const { token } = useAuth();
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [canEdit, setCanEdit] = useState(true);
  const [editRestrictionReason, setEditRestrictionReason] = useState("");

  // Logger instance for file logging
  const logger = ClientLogger.getInstance();

  // Helper function to log both to console and file
  const logInfo = async (message: string, metadata?: Record<string, any>) => {
    console.log(message, metadata || "");
    await logger.info(LogCategory.JOB_CARD, message, metadata);
  };

  const logError = async (message: string, metadata?: Record<string, any>) => {
    console.error(message, metadata || "");
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

  // Get countries list for the dropdown
  const countryOptions = useMemo(() => countryList().getData(), []);

  // Form state
  const [formData, setFormData] = useState({
    referenceNumber: "",
    humanReadableId: "",
    receivedDate: "",
    exporterId: "",
    unitOfMeasure: UnitOfMeasure.GRAMS,
    status: "pending",
    notes: "",
    destinationCountry: "",
    sourceOfGold: "",
    numberOfBoxes: 0,
    commodityId: "",
    buyerName: "",
    buyerAddress: "",
    teamLeader: "",
    totalGrossWeight: 0,
    fineness: 0,
    totalNetWeight: 0,
    valueUsd: 0,
    valueGhs: 0,
    numberOfOunces: 0,
    pricePerOunce: 0,
  });

  // Custom styles for React Select to match other form inputs
  const customSelectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      border: "1px solid #d1d5db",
      borderRadius: "0.375rem",
      padding: "0.125rem",
      fontSize: "0.875rem",
      backgroundColor: "white",
      "&:hover": {
        borderColor: "#9ca3af",
      },
      "&:focus": {
        borderColor: "#3b82f6",
        boxShadow: "0 0 0 1px #3b82f6",
      },
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      fontSize: "0.875rem",
      backgroundColor: state.isSelected ? "#3b82f6" : "white",
      "&:hover": {
        backgroundColor: state.isSelected ? "#3b82f6" : "#f3f4f6",
      },
    }),
    singleValue: (provided: any) => ({
      ...provided,
      fontSize: "0.875rem",
    }),
    placeholder: (provided: any) => ({
      ...provided,
      fontSize: "0.875rem",
      color: "#9ca3af",
    }),
  };

  // Load job card data
  useEffect(() => {
    const loadJobCard = async () => {
      if (!id) return;

      try {
        setLoading(true);
        await logInfo("Loading large scale job card for editing", {
          jobCardId: id,
        });

        const jobCard = await apiClient.get(`/api/large-scale-job-cards/${id}`);

        // Check if job card can be edited
        if (jobCard.status === "COMPLETED" || jobCard.status === "CANCELLED") {
          setCanEdit(false);
          setEditRestrictionReason(
            `This job card is ${jobCard.status.toLowerCase()} and cannot be edited.`
          );
        }

        // Populate form data
        setFormData({
          referenceNumber: jobCard.referenceNumber || "",
          humanReadableId: jobCard.humanReadableId || "",
          receivedDate: jobCard.receivedDate
            ? formatDate(jobCard.receivedDate, "YYYY-MM-DD")
            : "",
          exporterId: jobCard.exporterId || "",
          unitOfMeasure: jobCard.unitOfMeasure || UnitOfMeasure.GRAMS,
          status: jobCard.status || "pending",
          notes: jobCard.notes || "",
          destinationCountry: jobCard.destinationCountry || "",
          sourceOfGold: jobCard.sourceOfGold || "",
          numberOfBoxes: jobCard.numberOfBoxes || 0,
          commodityId: jobCard.commodityId || "",
          buyerName: jobCard.buyerName || "",
          buyerAddress: jobCard.buyerAddress || "",
          teamLeader: jobCard.teamLeader || "",
          totalGrossWeight: jobCard.totalGrossWeight || 0,
          fineness: jobCard.fineness || 0,
          totalNetWeight: jobCard.totalNetWeight || 0,
          valueUsd: jobCard.valueUsd || 0,
          valueGhs: jobCard.valueGhs || 0,
          numberOfOunces: jobCard.numberOfOunces || 0,
          pricePerOunce: jobCard.pricePerOunce || 0,
        });

        await logInfo("Successfully loaded large scale job card for editing", {
          jobCardId: id,
          referenceNumber: jobCard.referenceNumber,
        });
      } catch (error: any) {
        await logError("Failed to load large scale job card for editing", {
          jobCardId: id,
          error: error.message || String(error),
        });
        if (error.message?.includes("404")) {
          setError("Job card not found");
        } else {
          setError("Failed to load job card data");
        }
      } finally {
        setLoading(false);
      }
    };

    loadJobCard();
  }, [id, apiClient]);

  // Load reference data
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [exportersData, commoditiesData] = await Promise.all([
          apiClient.get("/api/exporters"),
          apiClient.get("/api/commodity"),
        ]);

        setExporters(exportersData);
        setCommodities(commoditiesData);
      } catch (error) {
        await logError("Failed to load reference data", {
          error: String(error),
        });
      }
    };

    loadReferenceData();
  }, [apiClient]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? 0 : Number(value)) : value,
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

      await logInfo("Updating large scale job card", {
        jobCardId: id,
        referenceNumber: formData.referenceNumber,
      });

      const updatedJobCard = await apiClient.put(
        `/api/large-scale-job-cards/${id}`,
        formData
      );

      await logInfo("Successfully updated large scale job card", {
        jobCardId: id,
        referenceNumber: updatedJobCard.referenceNumber,
      });

      toast.success("Job card updated successfully");
      router.push(`/job-cards/large-scale/${id}`);
    } catch (error: any) {
      const errorMessage = error.message || "Failed to update job card";
      await logError("Failed to update large scale job card", {
        jobCardId: id,
        error: errorMessage,
      });
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !canEdit) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <BackLink href="/job-cards/large-scale">
              Back to Large Scale Job Cards
            </BackLink>
            <div className="mt-6">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-red-800">
                  <strong>Edit Restricted:</strong> {editRestrictionReason}
                </div>
              </div>
              <div className="mt-4">
                <Link
                  href={`/job-cards/large-scale/${id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  View Job Card
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <BackLink href={`/job-cards/large-scale/${id}`}>
              Back to Job Card
            </BackLink>
            <h1 className="text-2xl font-bold text-gray-900 mt-4">
              Edit Large Scale Job Card
            </h1>
            <p className="text-gray-600 mt-1">
              Update job card information and details
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-red-800">{error}</div>
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Id
                </label>
                <input
                  type="text"
                  name="referenceNumber"
                  value={formData.referenceNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job ID
                </label>
                <input
                  type="text"
                  name="humanReadableId"
                  value={formData.humanReadableId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div> */}
            </div>

            {/* Exporter and Commodity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exporter
                </label>
                <Select
                  options={exporters.map((exporter) => ({
                    value: exporter.id,
                    label: `${exporter.name} (${exporter.exporterType.name})`,
                  }))}
                  value={
                    formData.exporterId
                      ? {
                          value: formData.exporterId,
                          label:
                            exporters.find((e) => e.id === formData.exporterId)
                              ?.name || "",
                        }
                      : null
                  }
                  onChange={(option) =>
                    handleSelectChange("exporterId", option)
                  }
                  styles={customSelectStyles}
                  placeholder="Select exporter"
                  isClearable
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commodity
                </label>
                <Select
                  options={commodities.map((commodity) => ({
                    value: commodity.id,
                    label: commodity.name,
                  }))}
                  value={
                    formData.commodityId
                      ? {
                          value: formData.commodityId,
                          label:
                            commodities.find(
                              (c) => c.id === formData.commodityId
                            )?.name || "",
                        }
                      : null
                  }
                  onChange={(option) =>
                    handleSelectChange("commodityId", option)
                  }
                  styles={customSelectStyles}
                  placeholder="Select commodity"
                  isClearable
                />
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit of Measure
                </label>
                <select
                  name="unitOfMeasure"
                  value={formData.unitOfMeasure}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={UnitOfMeasure.GRAMS}>Grams</option>
                  <option value={UnitOfMeasure.KILOGRAMS}>Kilograms</option>
                </select>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination Country
                </label>
                <Select
                  options={countryOptions}
                  value={
                    formData.destinationCountry
                      ? {
                          value: formData.destinationCountry,
                          label:
                            countryOptions.find(
                              (c) => c.value === formData.destinationCountry
                            )?.label || "",
                        }
                      : null
                  }
                  onChange={(option) =>
                    handleSelectChange("destinationCountry", option)
                  }
                  styles={customSelectStyles}
                  placeholder="Select destination country"
                  isClearable
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Weight and Value Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Gross Weight
                </label>
                <input
                  type="number"
                  name="totalGrossWeight"
                  value={formData.totalGrossWeight}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fineness
                </label>
                <input
                  type="number"
                  name="fineness"
                  value={formData.fineness}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                  max="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Net Weight
                </label>
                <input
                  type="number"
                  name="totalNetWeight"
                  value={formData.totalNetWeight}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            {/* Value Information */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value USD
                </label>
                <input
                  type="number"
                  name="valueUsd"
                  value={formData.valueUsd}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value GHS
                </label>
                <input
                  type="number"
                  name="valueGhs"
                  value={formData.valueGhs}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Ounces
                </label>
                <input
                  type="number"
                  name="numberOfOunces"
                  value={formData.numberOfOunces}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price per Ounce
                </label>
                <input
                  type="number"
                  name="pricePerOunce"
                  value={formData.pricePerOunce}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            {/* Additional Information */}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buyer Address
                </label>
                <input
                  type="text"
                  name="buyerAddress"
                  value={formData.buyerAddress}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exporter Authorised Signatory
                </label>
                <input
                  type="text"
                  name="teamLeader"
                  value={formData.teamLeader}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                href={`/job-cards/large-scale/${id}`}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving || !canEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default withClientAuth(EditLargeScaleJobCardPage, [
  "job-cards/large-scale",
]);
