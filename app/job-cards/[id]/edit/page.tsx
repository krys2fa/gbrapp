"use client";

import { withClientAuth } from "@/app/lib/with-client-auth";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import BackLink from "@/app/components/ui/BackLink";
import Select from "react-select";
import countryList from "react-select-country-list";

enum UnitOfMeasure {
  GRAMS = "g",
  KILOGRAMS = "kg",
}

function EditJobCardPage() {
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
  const [officers, setOfficers] = useState<{
    customsOfficers: { id: string; name: string; badgeNumber: string }[];
    assayOfficers: { id: string; name: string; badgeNumber: string }[];
    technicalDirectors: { id: string; name: string; badgeNumber: string }[];
  }>({
    customsOfficers: [],
    assayOfficers: [],
    technicalDirectors: [],
  });

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
    receivedDate: new Date().toISOString().split("T")[0], // Today's date as default
    exporterId: "",
    commodityId: "",
    unitOfMeasure: UnitOfMeasure.GRAMS,
    buyerName: "",
    teamLeader: "",
    totalGrossWeight: "",
    destinationCountry: "",
    fineness: "",
    sourceOfGold: "Ghana", // Default to Ghana
    totalNetWeight: "",
    numberOfBoxes: "",
    status: "pending",
    valueGhs: "",
    valueUsd: "",
    pricePerOunce: "",
    numberOfOunces: "",
    buyerAddress: "",
    certificateNumber: "",
  });

  useEffect(() => {
    // Fetch job card data and reference data
    const fetchData = async () => {
      try {
        const [jobCardRes, exportersRes, commoditiesRes] = await Promise.all([
          fetch(`/api/job-cards/${id}`),
          fetch("/api/exporters"),
          fetch("/api/commodity"),
        ]);

        if (jobCardRes.ok) {
          const jobCardData = await jobCardRes.json();

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
            receivedDate: new Date(jobCardData.receivedDate)
              .toISOString()
              .split("T")[0],
            exporterId: jobCardData.exporterId || "",
            commodityId: jobCardData.commodityId || "",
            unitOfMeasure: jobCardData.unitOfMeasure || UnitOfMeasure.GRAMS,
            buyerName: jobCardData.buyerName || "",
            teamLeader: jobCardData.teamLeader || "",
            totalGrossWeight: jobCardData.totalGrossWeight?.toString() || "",
            destinationCountry: jobCardData.destinationCountry || "",
            fineness: jobCardData.fineness?.toString() || "",
            sourceOfGold: jobCardData.sourceOfGold || "Ghana",
            totalNetWeight: jobCardData.totalNetWeight?.toString() || "",
            numberOfBoxes: jobCardData.numberOfBoxes?.toString() || "",
            status: jobCardData.status || "pending",
            valueGhs: jobCardData.valueGhs?.toString() || "",
            valueUsd: jobCardData.valueUsd?.toString() || "",
            pricePerOunce: jobCardData.pricePerOunce?.toString() || "",
            numberOfOunces: jobCardData.numberOfOunces?.toString() || "",
            buyerAddress: jobCardData.buyerAddress || "",
            certificateNumber: jobCardData.certificateNumber || "",
          });
        } else {
          throw new Error("Failed to fetch job card");
        }

        if (exportersRes.ok) {
          const exportersData = await exportersRes.json();
          setExporters(exportersData);
        }

        if (commoditiesRes.ok) {
          const commoditiesData = await commoditiesRes.json();
          setCommodities(Array.isArray(commoditiesData) ? commoditiesData : []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load job card data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Handle country selection from react-select
  const handleCountryChange = (
    selectedOption: { value: string; label: string } | null
  ) => {
    // Save the full country name (label) instead of the short code (value)
    setFormData((prev) => ({
      ...prev,
      destinationCountry: selectedOption ? selectedOption.label : "",
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    // Basic client-side validation: commodity is required (DB has non-null constraint)
    if (!formData.commodityId) {
      setError("Please select a commodity before updating the job card.");
      setSaving(false);
      return;
    }

    // Prepare full submission payload from formData
    const submissionData: any = { ...formData };

    // Convert numeric-like fields to actual numbers when provided
    const numericFields = [
      "numberOfPersons",
      "numberOfBoxes",
      "totalGrossWeight",
      "totalNetWeight",
      "numberOfOunces",
      "pricePerOunce",
      "valueUsd",
      "fineness",
    ];

    numericFields.forEach((k) => {
      const v = (submissionData as any)[k];
      if (v !== undefined && v !== null && v !== "") {
        const n = Number(v);
        (submissionData as any)[k] = Number.isNaN(n) ? v : n;
      } else {
        delete (submissionData as any)[k];
      }
    });

    // Remove empty strings for optional text fields
    Object.keys(submissionData).forEach((k) => {
      if (submissionData[k] === "") delete submissionData[k];
    });

    console.log("Submitting data:", submissionData);

    try {
      const response = await fetch(`/api/job-cards/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      const responseData = await response.json();
      console.log("Server response:", response.status, responseData);

      if (response.ok) {
        router.push(`/job-cards/${id}`);
      } else {
        setError(responseData.error || "Failed to update job card");
        console.error("Server error details:", responseData);
        if (responseData.details) {
          setError(`${responseData.error}: ${responseData.details}`);
        }
      }
    } catch (error) {
      console.error("Error updating job card:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <BackLink href={`/job-cards/${id}`} label="Back to Job Card" />
      </div>

      <div className="max-w-3xl w-full">
        <div className="bg-white shadow sm:rounded-lg p-4 mb-6">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Edit Job Card
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Update the details of this job card.
            </p>
          </div>
        </div>

        <div className="w-full">
          {!canEdit ? (
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                <div className="rounded-md bg-yellow-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-yellow-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Editing Restricted
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>{editRestrictionReason}</p>
                        <p className="mt-2">
                          Please contact an administrator if you need to make
                          changes to this job card.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="shadow sm:rounded-md sm:overflow-hidden">
                <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                  {error && (
                    <div className="rounded-md bg-red-50 p-4">
                      <div className="flex">
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">
                            Error
                          </h3>
                          <div className="text-sm text-red-700">{error}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reworked layout: two-column form sections */}
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6 md:col-span-3 space-y-6">
                      {/* Left column fields */}

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Exporter
                        </label>
                        <select
                          name="exporterId"
                          value={formData.exporterId}
                          onChange={handleChange}
                          className="mt-1 form-control"
                        >
                          <option value="">Select exporter</option>
                          {exporters.map((ex) => (
                            <option key={ex.id} value={ex.id}>
                              {ex.name} ({ex.exporterCode})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Importer Name
                        </label>
                        <input
                          name="buyerName"
                          value={formData.buyerName}
                          onChange={handleChange}
                          className="mt-1 form-control"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Importer Address
                        </label>
                        <input
                          name="buyerAddress"
                          value={formData.buyerAddress}
                          onChange={handleChange}
                          className="mt-1 form-control"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Destination Country
                        </label>
                        <Select
                          inputId="destinationCountry"
                          name="destinationCountry"
                          options={countryOptions}
                          value={
                            formData.destinationCountry
                              ? countryOptions.find(
                                  (o: any) =>
                                    o.label === formData.destinationCountry
                                )
                              : null
                          }
                          onChange={handleCountryChange}
                          className="mt-1 form-control-select"
                          classNamePrefix="react-select"
                          styles={customSelectStyles}
                          isClearable
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Exporter Authorized Signatory
                        </label>
                        <input
                          name="teamLeader"
                          value={formData.teamLeader}
                          onChange={handleChange}
                          className="mt-1 form-control"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Commodity
                        </label>
                        <select
                          name="commodityId"
                          value={formData.commodityId}
                          onChange={handleChange}
                          className="mt-1 form-control"
                        >
                          <option value="">Select commodity</option>
                          {commodities.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Certificate Number
                        </label>
                        <input
                          name="certificateNumber"
                          value={formData.certificateNumber}
                          onChange={handleChange}
                          className="mt-1 form-control"
                          placeholder="Enter certificate number"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Source of Commodity
                        </label>
                        <input
                          name="sourceOfGold"
                          value={formData.sourceOfGold}
                          onChange={handleChange}
                          className="mt-1 form-control"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Number of Boxes
                        </label>
                        <input
                          type="number"
                          name="numberOfBoxes"
                          value={formData.numberOfBoxes}
                          onChange={handleChange}
                          className="mt-1 form-control"
                        />
                      </div>
                    </div>

                    <div className="col-span-6 md:col-span-3 space-y-6">
                      {/* Right column fields */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Received Date
                        </label>
                        <input
                          type="date"
                          name="receivedDate"
                          value={formData.receivedDate}
                          onChange={handleChange}
                          className="mt-1 form-control"
                        />
                      </div>

                      {/* <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Job Id
                        </label>
                        <input
                          name="referenceNumber"
                          value={formData.referenceNumber}
                          onChange={handleChange}
                          className="mt-1 form-control"
                          readOnly
                          title="Reference number is automatically generated and cannot be changed"
                        />
                      </div> */}

                      {/* <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Importer Name
                        </label>
                        <input
                          name="buyerName"
                          value={formData.buyerName}
                          onChange={handleChange}
                          className="mt-1 form-control"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Importer Address
                        </label>
                        <input
                          name="buyerAddress"
                          value={formData.buyerAddress}
                          onChange={handleChange}
                          className="mt-1 form-control"
                        />
                      </div> */}

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Unit of Measure
                        </label>
                        <select
                          name="unitOfMeasure"
                          value={formData.unitOfMeasure}
                          onChange={handleChange}
                          className="mt-1 form-control"
                        >
                          <option value={UnitOfMeasure.GRAMS}>Grams</option>
                          <option value={UnitOfMeasure.KILOGRAMS}>
                            Kilograms
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Total Gross Weight
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="totalGrossWeight"
                          value={formData.totalGrossWeight}
                          onChange={handleChange}
                          className="mt-1 form-control"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          % Fineness
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="fineness"
                          value={formData.fineness}
                          onChange={handleChange}
                          className="mt-1 form-control"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Total Net Weight
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="totalNetWeight"
                          value={formData.totalNetWeight}
                          onChange={handleChange}
                          className="mt-1 form-control"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Number of Ounces
                        </label>
                        <input
                          name="numberOfOunces"
                          value={formData.numberOfOunces}
                          onChange={handleChange}
                          className="mt-1 form-control"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Price per Ounce (USD)
                        </label>
                        <input
                          name="pricePerOunce"
                          value={formData.pricePerOunce}
                          onChange={handleChange}
                          className="mt-1 form-control"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Exporter Value (USD)
                        </label>
                        <input
                          name="valueUsd"
                          value={formData.valueUsd}
                          onChange={handleChange}
                          className="mt-1 form-control"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Exporter Value (GHS)
                        </label>
                        <input
                          name="valueGhs"
                          value={formData.valueGhs}
                          onChange={handleChange}
                          className="mt-1 form-control"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                  <Link
                    href={`/job-cards/${id}`}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={saving}
                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                      saving ? "opacity-75 cursor-not-allowed" : ""
                    }`}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default withClientAuth(EditJobCardPage);
