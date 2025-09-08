"use client";

import { useEffect, useState } from "react";

interface LargeScaleJobCardFiltersProps {
  filters: {
    exporterId: string;
    exporterTypeId: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  setFilters: React.Dispatch<
    React.SetStateAction<{
      exporterId: string;
      exporterTypeId: string;
      startDate: string;
      endDate: string;
      status: string;
    }>
  >;
}

export function LargeScaleJobCardFilters({
  filters,
  setFilters,
}: LargeScaleJobCardFiltersProps) {
  const [exporters, setExporters] = useState<
    { id: string; name: string; exporterType: { id: string; name: string } }[]
  >([]);
  const [exporterTypes, setExporterTypes] = useState<
    { id: string; name: string }[]
  >([]);
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
        const [exporterTypesResponse, exportersResponse] = await Promise.all([
          fetch("/api/exporter-types"),
          fetch("/api/exporters"),
        ]);

        if (exporterTypesResponse.ok) {
          const exporterTypesData = await exporterTypesResponse.json();
          setExporterTypes(exporterTypesData);
        }

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

  // Fetch exporters filtered by exporter type when exporter type changes
  useEffect(() => {
    if (filters.exporterTypeId) {
      async function fetchFilteredExporters() {
        try {
          const response = await fetch(
            `/api/exporters?exporterTypeId=${filters.exporterTypeId}`
          );
          if (response.ok) {
            const data = await response.json();
            setExporters(data);
            // Clear selected exporter if it doesn't belong to this type
            const exporterExists = data.some(
              (exporter: { id: string }) => exporter.id === filters.exporterId
            );
            if (!exporterExists && filters.exporterId) {
              setFilters((prev) => ({ ...prev, exporterId: "" }));
            }
          }
        } catch (error) {
          console.error("Error fetching exporters by type:", error);
        }
      }

      fetchFilteredExporters();
    } else {
      // If no exporter type is selected, fetch all exporters
      async function fetchAllExporters() {
        try {
          const response = await fetch("/api/exporters");
          if (response.ok) {
            const data = await response.json();
            setExporters(data);
          }
        } catch (error) {
          console.error("Error fetching all exporters:", error);
        }
      }

      fetchAllExporters();
    }
  }, [filters.exporterTypeId, filters.exporterId, setFilters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      exporterId: "",
      exporterTypeId: "",
      startDate: "",
      endDate: "",
      status: "",
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Exporter Type Filter */}
        <div>
          <label
            htmlFor="exporterType"
            className="block text-sm font-medium text-gray-700"
          >
            Exporter Type
          </label>
          <select
            id="exporterType"
            value={filters.exporterTypeId}
            onChange={(e) =>
              handleFilterChange("exporterTypeId", e.target.value)
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">All Types</option>
            {exporterTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
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
            {exporters.map((exporter) => (
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
