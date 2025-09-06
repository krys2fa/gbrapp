"use client";

import { withClientAuth } from "@/app/lib/with-client-auth";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BackLink from "@/app/components/ui/BackLink";
import Select from "react-select";
import countryList from "react-select-country-list";

enum UnitOfMeasure {
  GRAMS = "g",
  KILOGRAMS = "kg",
}

function NewJobCardPage() {
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
    customsOfficerId: "",
    assayOfficerId: "",
    technicalDirectorId: "",
    nacobOfficerId: "",
    nationalSecurityOfficerId: "",
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
              (o: any) => o.officerType === "CUSTOMS_OFFICER"
            ),
            assayOfficers: officersData.filter(
              (o: any) => o.officerType === "ASSAY_OFFICER"
            ),
            technicalDirectors: officersData.filter(
              (o: any) => o.officerType === "TECHNICAL_DIRECTOR"
            ),
            nacobOfficers: officersData.filter(
              (o: any) => o.officerType === "NACOB_OFFICER"
            ),
            nationalSecurityOfficers: officersData.filter(
              (o: any) => o.officerType === "NATIONAL_SECURITY_OFFICER"
            ),
          };
          setOfficers(groupedOfficers);
        }
      } catch (error) {
        console.error("Error fetching form data:", error);
        setError("Failed to load form data. Please try again.");
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  // Handle officer selection from react-select
  const handleCustomsOfficerChange = (
    selectedOption: { value: string; label: string } | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      customsOfficerId: selectedOption ? selectedOption.value : "",
    }));
  };

  const handleAssayOfficerChange = (
    selectedOption: { value: string; label: string } | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      assayOfficerId: selectedOption ? selectedOption.value : "",
    }));
  };

  const handleTechnicalDirectorChange = (
    selectedOption: { value: string; label: string } | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      technicalDirectorId: selectedOption ? selectedOption.value : "",
    }));
  };

  const handleNacobOfficerChange = (
    selectedOption: { value: string; label: string } | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      nacobOfficerId: selectedOption ? selectedOption.value : "",
    }));
  };

  const handleNationalSecurityOfficerChange = (
    selectedOption: { value: string; label: string } | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      nationalSecurityOfficerId: selectedOption ? selectedOption.value : "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Basic client-side validation: commodity is required (DB has non-null constraint)
    if (!formData.commodityId) {
      setError("Please select a commodity before creating the job card.");
      setLoading(false);
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
      const response = await fetch("/api/job-cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      const responseData = await response.json();
      console.log("Server response:", response.status, responseData);

      if (response.ok) {
        router.push(`/job-cards/${responseData.id}`);
      } else {
        setError(responseData.error || "Failed to create job card");
        console.error("Server error details:", responseData);
        if (responseData.details) {
          setError(`${responseData.error}: ${responseData.details}`);
        }
      }
    } catch (error) {
      console.error("Error creating job card:", error);
      setError("An unexpected error occurred. Please try again.");
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
                        {exporters.map((ex) => (
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
                        Team Leader
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
                        Job Reference Number
                      </label>
                      <input
                        name="referenceNumber"
                        value={(formData as any).referenceNumber || ""}
                        onChange={handleChange}
                        className="mt-1 form-control"
                      />
                    </div>

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

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Customs Officer
                      </label>
                      <Select
                        options={officers.customsOfficers.map((officer) => ({
                          value: officer.id,
                          label: `${officer.name} (${officer.badgeNumber})`,
                        }))}
                        value={
                          formData.customsOfficerId
                            ? officers.customsOfficers
                                .map((officer) => ({
                                  value: officer.id,
                                  label: `${officer.name} (${officer.badgeNumber})`,
                                }))
                                .find(
                                  (o) => o.value === formData.customsOfficerId
                                )
                            : null
                        }
                        onChange={handleCustomsOfficerChange}
                        className="mt-1 form-control-select"
                        classNamePrefix="react-select"
                        styles={customSelectStyles}
                        isClearable
                        placeholder="Select customs officer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Assay Officer
                      </label>
                      <Select
                        options={officers.assayOfficers.map((officer) => ({
                          value: officer.id,
                          label: `${officer.name} (${officer.badgeNumber})`,
                        }))}
                        value={
                          formData.assayOfficerId
                            ? officers.assayOfficers
                                .map((officer) => ({
                                  value: officer.id,
                                  label: `${officer.name} (${officer.badgeNumber})`,
                                }))
                                .find(
                                  (o) => o.value === formData.assayOfficerId
                                )
                            : null
                        }
                        onChange={handleAssayOfficerChange}
                        className="mt-1 form-control-select"
                        classNamePrefix="react-select"
                        styles={customSelectStyles}
                        isClearable
                        placeholder="Select assay officer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Technical Director
                      </label>
                      <Select
                        options={officers.technicalDirectors.map((officer) => ({
                          value: officer.id,
                          label: `${officer.name} (${officer.badgeNumber})`,
                        }))}
                        value={
                          formData.technicalDirectorId
                            ? officers.technicalDirectors
                                .map((officer) => ({
                                  value: officer.id,
                                  label: `${officer.name} (${officer.badgeNumber})`,
                                }))
                                .find(
                                  (o) =>
                                    o.value === formData.technicalDirectorId
                                )
                            : null
                        }
                        onChange={handleTechnicalDirectorChange}
                        className="mt-1 form-control-select"
                        classNamePrefix="react-select"
                        styles={customSelectStyles}
                        isClearable
                        placeholder="Select technical director"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        NACOB Officer
                      </label>
                      <Select
                        options={officers.nacobOfficers.map((officer) => ({
                          value: officer.id,
                          label: `${officer.name} (${officer.badgeNumber})`,
                        }))}
                        value={
                          formData.nacobOfficerId
                            ? officers.nacobOfficers
                                .map((officer) => ({
                                  value: officer.id,
                                  label: `${officer.name} (${officer.badgeNumber})`,
                                }))
                                .find(
                                  (o) => o.value === formData.nacobOfficerId
                                )
                            : null
                        }
                        onChange={handleNacobOfficerChange}
                        className="mt-1 form-control-select"
                        classNamePrefix="react-select"
                        styles={customSelectStyles}
                        isClearable
                        placeholder="Select NACOB officer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        National Security Officer
                      </label>
                      <Select
                        options={officers.nationalSecurityOfficers.map(
                          (officer) => ({
                            value: officer.id,
                            label: `${officer.name} (${officer.badgeNumber})`,
                          })
                        )}
                        value={
                          formData.nationalSecurityOfficerId
                            ? officers.nationalSecurityOfficers
                                .map((officer) => ({
                                  value: officer.id,
                                  label: `${officer.name} (${officer.badgeNumber})`,
                                }))
                                .find(
                                  (o) =>
                                    o.value ===
                                    formData.nationalSecurityOfficerId
                                )
                            : null
                        }
                        onChange={handleNationalSecurityOfficerChange}
                        className="mt-1 form-control-select"
                        classNamePrefix="react-select"
                        styles={customSelectStyles}
                        isClearable
                        placeholder="Select national security officer"
                      />
                    </div>
                  </div>

                  <div className="col-span-6">
                    <label
                      htmlFor="notes"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      className="mt-1 form-control"
                      placeholder="Additional information or notes about this job card"
                      value={formData.notes}
                      onChange={handleChange}
                    ></textarea>
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
