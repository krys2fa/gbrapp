"use client";

import { withClientAuth } from "@/app/lib/with-client-auth";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BackLink from "@/app/components/ui/BackLink";
import Select from "react-select";
import countryList from "react-select-country-list";
import toast from "react-hot-toast";

enum UnitOfMeasure {
  GRAMS = "g",
  KILOGRAMS = "kg",
}

function NewJobCardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exporters, setExporters] = useState<
    {
      id: string;
      name: string;
      exporterCode: string;
      exporterType: { id: string; name: string };
      authorizedSignatory: string;
    }[]
  >([]);
  // Only show exporters for small-scale contexts
  const smallExporters = exporters.filter((ex) =>
    (ex.exporterType?.name || "").toLowerCase().includes("small")
  );
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
    receivedDate: new Date().toISOString().split("T")[0], // Today's date as default
    exporterId: "",
    commodityId: "",
    unitOfMeasure: UnitOfMeasure.GRAMS,
    buyerName: "",
    buyerAddress: "",
    teamLeader: "",
    totalGrossWeight: "",
    destinationCountry: "",
    fineness: "",
    sourceOfGold: "Ghana", // Default to Ghana
    totalNetWeight: "",
    numberOfBoxes: "",
    status: "pending",
    notes: "",
    valueGhs: "",
    valueUsd: "",
    pricePerOunce: "",
    numberOfOunces: "",
    certificateNumber: "",
  });

  useEffect(() => {
    // Fetch exporters and commodities
    const fetchData = async () => {
      try {
        const [exportersRes, commoditiesRes] = await Promise.all([
          fetch("/api/exporters"),
          fetch("/api/commodity"),
        ]);

        if (exportersRes.ok) {
          const exportersData = await exportersRes.json();
          setExporters(exportersData);
        }

        if (commoditiesRes.ok) {
          const commoditiesData = await commoditiesRes.json();
          setCommodities(Array.isArray(commoditiesData) ? commoditiesData : []);
        }
      } catch (error) {
        console.error("Error fetching form data:", error);
        const errorMessage = "Failed to load form data. Please try again.";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    };

    fetchData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // If exporter is changed, also update the authorized signatory
    if (name === "exporterId") {
      const selectedExporter =
        smallExporters.find((ex) => ex.id === value) ||
        exporters.find((ex) => ex.id === value);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        teamLeader: selectedExporter?.authorizedSignatory || "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Basic client-side validation: commodity is required (DB has non-null constraint)
    if (!formData.commodityId) {
      const errorMessage =
        "Please select a commodity before creating the job card.";
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
      return;
    }

    // Prepare full submission payload from formData
    // Remove certificateNumber from job-card creation payload (now collected at assay step)
    const { certificateNumber, ...submissionData } = formData as any;

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

    try {
      const response = await fetch("/api/job-cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      const responseData = await response.json();

      if (response.ok) {
        toast.success("Job card created successfully!");
        router.push(`/job-cards/${responseData.id}`);
      } else {
        const errorMessage = responseData.error || "Failed to create job card";
        setError(errorMessage);
        toast.error(errorMessage);
        console.error("Server error details:", responseData);
        if (responseData.details) {
          const detailedError = `${responseData.error}: ${responseData.details}`;
          setError(detailedError);
          toast.error(detailedError);
        }
      }
    } catch (error) {
      console.error("Error creating job card:", error);
      const errorMessage = "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <BackLink href="/job-cards" label="Back to Job Cards" />
      </div>

      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Create New Job Card
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Fill in the details to create a new job card in the system.
            </p>
          </div>
        </div>

        <div className="mt-5 md:mt-0 md:col-span-3">
          <form onSubmit={handleSubmit}>
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                {error && (
                  <div className="rounded-md bg-red-50 p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-red-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Error Creating Job Card
                        </h3>
                        <div className="mt-2 text-sm text-red-700 whitespace-pre-wrap">
                          {error}
                        </div>
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
                        {smallExporters.map((ex) => (
                          <option key={ex.id} value={ex.id}>
                            {ex.name}
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
                        value={(formData as any).buyerAddress || ""}
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
                        className="mt-1 form-control bg-gray-50"
                        placeholder="Select an exporter to populate this field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Commodity
                      </label>
                      <select
                        name="commodityId"
                        value={(formData as any).commodityId || ""}
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

                    {/* certificateNumber moved to assay/valuation step */}

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Source of Commodity
                      </label>
                      <input
                        name="sourceOfGold"
                        value={(formData as any).sourceOfGold || ""}
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
                        value={(formData as any).numberOfOunces || ""}
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
                        value={(formData as any).pricePerOunce || ""}
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
                        value={(formData as any).valueUsd || ""}
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
                        value={(formData as any).valueGhs || ""}
                        onChange={handleChange}
                        className="mt-1 form-control"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <Link
                  href="/job-cards"
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    loading ? "opacity-75 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? "Creating..." : "Create Job Card"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default withClientAuth(NewJobCardPage);
