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
    // Consignor section
    consignorAddress: "",
    consignorEmail: "",
    consignorContactPerson: "",
    consignorTelephone: "",
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
              (officer: any) => officer.type === "CUSTOMS"
            ),
            assayOfficers: officersData.filter(
              (officer: any) => officer.type === "ASSAY"
            ),
            technicalDirectors: officersData.filter(
              (officer: any) => officer.type === "TECHNICAL_DIRECTOR"
            ),
            nacobOfficers: officersData.filter(
              (officer: any) => officer.type === "NACOB"
            ),
            nationalSecurityOfficers: officersData.filter(
              (officer: any) => officer.type === "NATIONAL_SECURITY"
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate required fields
      if (
        !form.referenceNumber ||
        !form.exporterId ||
        !form.commodities.length ||
        form.commodities.some((commodity) => !commodity.id)
      ) {
        setError(
          "Please fill in all required fields and ensure all commodities have a selection."
        );
        setLoading(false);
        return;
      }

      const jobCardData = {
        ...form,
        type: "large_scale", // Mark as large scale job card
      };

      const response = await fetch("/api/job-cards", {
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

          {/* Exporter Details */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Exporter Details
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="deliveryLocation"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Delivery Location
                  </label>
                  <input
                    type="text"
                    name="deliveryLocation"
                    id="deliveryLocation"
                    value={form.deliveryLocation}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter delivery location"
                  />
                </div>

                <div>
                  <label
                    htmlFor="exporterTelephone"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Exporter Telephone
                  </label>
                  <input
                    type="text"
                    name="exporterTelephone"
                    id="exporterTelephone"
                    value={form.exporterTelephone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter exporter telephone"
                  />
                </div>

                <div>
                  <label
                    htmlFor="exporterEmail"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Exporter Email
                  </label>
                  <input
                    type="email"
                    name="exporterEmail"
                    id="exporterEmail"
                    value={form.exporterEmail}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter exporter email"
                  />
                </div>

                <div>
                  <label
                    htmlFor="exporterWebsite"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Exporter Website
                  </label>
                  <input
                    type="url"
                    name="exporterWebsite"
                    id="exporterWebsite"
                    value={form.exporterWebsite}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter exporter website"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="exporterLicenseNumber"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Exporter License Number
                  </label>
                  <input
                    type="text"
                    name="exporterLicenseNumber"
                    id="exporterLicenseNumber"
                    value={form.exporterLicenseNumber}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter exporter license number"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Consignee Information */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Consignee Information
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="consigneeAddress"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Consignee Address
                  </label>
                  <input
                    type="text"
                    name="consigneeAddress"
                    id="consigneeAddress"
                    value={form.consigneeAddress}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter consignee address"
                  />
                </div>

                <div>
                  <label
                    htmlFor="consigneeTelephone"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Consignee Telephone
                  </label>
                  <input
                    type="text"
                    name="consigneeTelephone"
                    id="consigneeTelephone"
                    value={form.consigneeTelephone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter consignee telephone"
                  />
                </div>

                <div>
                  <label
                    htmlFor="consigneeMobile"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Consignee Mobile
                  </label>
                  <input
                    type="text"
                    name="consigneeMobile"
                    id="consigneeMobile"
                    value={form.consigneeMobile}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter consignee mobile"
                  />
                </div>

                <div>
                  <label
                    htmlFor="consigneeEmail"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Consignee Email
                  </label>
                  <input
                    type="email"
                    name="consigneeEmail"
                    id="consigneeEmail"
                    value={form.consigneeEmail}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter consignee email"
                  />
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
                        option.value === form.destinationCountry
                    )}
                    onChange={(selectedOption) =>
                      setForm((prev) => ({
                        ...prev,
                        destinationCountry: selectedOption?.value || "",
                      }))
                    }
                    styles={customSelectStyles}
                    placeholder="Select destination country"
                    isClearable
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notified Party Information */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Notified Party Information
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="notifiedPartyName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    name="notifiedPartyName"
                    id="notifiedPartyName"
                    value={form.notifiedPartyName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter notified party name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="notifiedPartyAddress"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Address
                  </label>
                  <input
                    type="text"
                    name="notifiedPartyAddress"
                    id="notifiedPartyAddress"
                    value={form.notifiedPartyAddress}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter notified party address"
                  />
                </div>

                <div>
                  <label
                    htmlFor="notifiedPartyEmail"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    name="notifiedPartyEmail"
                    id="notifiedPartyEmail"
                    value={form.notifiedPartyEmail}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter notified party email"
                  />
                </div>

                <div>
                  <label
                    htmlFor="notifiedPartyContactPerson"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Contact Person
                  </label>
                  <input
                    type="text"
                    name="notifiedPartyContactPerson"
                    id="notifiedPartyContactPerson"
                    value={form.notifiedPartyContactPerson}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter contact person name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="notifiedPartyTelephone"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Telephone
                  </label>
                  <input
                    type="text"
                    name="notifiedPartyTelephone"
                    id="notifiedPartyTelephone"
                    value={form.notifiedPartyTelephone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter notified party telephone"
                  />
                </div>

                <div>
                  <label
                    htmlFor="notifiedPartyMobile"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Mobile
                  </label>
                  <input
                    type="text"
                    name="notifiedPartyMobile"
                    id="notifiedPartyMobile"
                    value={form.notifiedPartyMobile}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter notified party mobile"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Commodities */}

          {/* Commodities */}
          <div className="bg-white shadow sm:rounded-lg">
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
          </div>

          {/* Weight and Quality Information */}
          <div className="bg-white shadow sm:rounded-lg">
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
          </div>

          {/* Officer Assignments */}
          <div className="bg-white shadow sm:rounded-lg">
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

                {/* <div>
                  <label
                    htmlFor="status"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Status
                  </label>
                  <select
                    name="status"
                    id="status"
                    value={form.status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div> */}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white shadow sm:rounded-lg">
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
              {loading ? "Creating..." : "Create Large Scale Job Card"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default withClientAuth(NewLargeScaleJobCardPage);
