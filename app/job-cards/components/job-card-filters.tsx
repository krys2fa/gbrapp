"use client";

import { useEffect, useState } from "react";

interface JobCardFiltersProps {
  filters: {
    exporterId: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  setFilters: React.Dispatch<
    React.SetStateAction<{
      exporterId: string;
      startDate: string;
      endDate: string;
      status: string;
    }>
  >;
}

export function JobCardFilters({ filters, setFilters }: JobCardFiltersProps) {
  const [exporters, setExporters] = useState<
    {
      id: string;
      name: string;
      exporterCode: string;
      exporterType: { id: string; name: string };
    }[]
  >([]);
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
      } catch (error) {
        console.error("Error fetching filter data:", error);
      }
    }

    fetchData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleReset = () => {
    setFilters({
      exporterId: "",
      startDate: "",
      endDate: "",
      status: "",
    });
  };

  return (
    <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 mt-6">
      <div className="md:grid md:grid-cols-4 md:gap-6">
        <div className="md:col-span-1">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Filter Job Cards
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Use these filters to narrow down the job cards displayed.
          </p>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-3">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label
                htmlFor="exporterId"
                className="block text-sm font-medium text-gray-700"
              >
                Exporter
              </label>
              <select
                id="exporterId"
                name="exporterId"
                value={filters.exporterId}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">All Exporters</option>
                {exporters.map((exporter) => (
                  <option key={exporter.id} value={exporter.id}>
                    {exporter.name} ({exporter.exporterCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700"
              >
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                id="startDate"
                value={filters.startDate}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700"
              >
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                id="endDate"
                value={filters.endDate}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">All Status</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status === "all" ? "" : status}>
                    {status.charAt(0).toUpperCase() +
                      status.slice(1).replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={handleReset}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
