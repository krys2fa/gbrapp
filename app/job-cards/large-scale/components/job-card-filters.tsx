"use client";

import { useEffect, useState } from "react";

interface LargeScaleJobCardFiltersProps {
  filters: {
    exporterId: string;
    startDate: string;
    endDate: string;
    status: string;
    miningSite: string;
    humanReadableId: string;
  };
  setFilters: React.Dispatch<
    React.SetStateAction<{
      exporterId: string;
      startDate: string;
      endDate: string;
      status: string;
      miningSite: string;
      humanReadableId: string;
    }>
  >;
}

export function LargeScaleJobCardFilters({
  filters,
  setFilters,
}: LargeScaleJobCardFiltersProps) {
  const [exporters, setExporters] = useState<
    {
      id: string;
      name: string;
      exporterCode: string;
      exporterType: { id: string; name: string };
    }[]
  >([]);
  // only include exporters relevant to large-scale filters
  const largeExporters = exporters.filter(
    (ex) =>
      (ex.exporterType?.name || "").toLowerCase().includes("mining") ||
      (ex.exporterType?.name || "").toLowerCase().includes("large")
  );
  const [miningSites, setMiningSites] = useState<string[]>([]);
  const statusOptions = [
    "all",
    "pending",
    "in_progress",
    "completed",
    "rejected",
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        const exportersResponse = await fetch("/api/exporters");

        if (exportersResponse.ok) {
          const exportersData = await exportersResponse.json();
          setExporters(exportersData);
        }

        // Fetch unique mining sites from existing large scale job cards
        const miningSitesResponse = await fetch(
          "/api/job-cards/mining-sites?type=large_scale"
        );
        if (miningSitesResponse.ok) {
          const miningSitesData = await miningSitesResponse.json();
          setMiningSites(miningSitesData);
        }
      } catch (error) {
        console.error("Error fetching filter data:", error);
      }
    }

    fetchData();
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      exporterId: "",
      startDate: "",
      endDate: "",
      status: "",
      miningSite: "",
      humanReadableId: "",
    });
  };

  return (
    <div className="bg-white px-4 py-5 shadow sm:rounded-lg sm:p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Filter Large Scale Job Cards
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Narrow down the list of large scale job cards using the filters below.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Job Card ID Filter */}
        <div>
          <label
            htmlFor="humanReadableId"
            className="block text-sm font-medium text-gray-700"
          >
            Job Card ID
          </label>
          <input
            type="text"
            id="humanReadableId"
            value={filters.humanReadableId}
            onChange={(e) =>
              handleFilterChange("humanReadableId", e.target.value)
            }
            placeholder="LS-2025-0001"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        {/* Exporter Filter */}
        <div>
          <label
            htmlFor="exporter"
            className="block text-sm font-medium text-gray-700"
          >
            Exporter
          </label>
          <select
            id="exporter"
            value={filters.exporterId}
            onChange={(e) => handleFilterChange("exporterId", e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">All Exporters</option>
            {largeExporters.map((exporter) => (
              <option key={exporter.id} value={exporter.id}>
                {exporter.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700"
          >
            Status
          </label>
          <select
            id="status"
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === "all" ? "All Statuses" : status.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date Filter */}
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700"
          >
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            value={filters.startDate}
            onChange={(e) => handleFilterChange("startDate", e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        {/* End Date Filter */}
        <div>
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-gray-700"
          >
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            value={filters.endDate}
            onChange={(e) => handleFilterChange("endDate", e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        {/* Clear Filters Button */}
        <div className="flex items-end">
          <button
            onClick={clearFilters}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
}
