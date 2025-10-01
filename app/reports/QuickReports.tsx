"use client";

import React, { useState, useEffect } from "react";
import { ChevronDownIcon, PrinterIcon } from "@heroicons/react/24/outline";

interface Exporter {
  id: string;
  name: string;
}

interface ReportOption {
  id: string;
  name: string;
  requiresExporter?: boolean;
  requiresWeek?: boolean;
}

const reportOptions: ReportOption[] = [
  {
    id: "monthly-shipment-all-exporters",
    name: "Monthly Shipment Reports for All Exporters",
  },
  {
    id: "monthly-shipment-gold-exporters",
    name: "Monthly Shipment Report for Gold Exporters",
  },
  {
    id: "weekly-shipment-exporter",
    name: "Weekly Shipment Report per Week for Selected Exporter",
    requiresExporter: true,
    requiresWeek: true,
  },
  {
    id: "monthly-analysis-exporter",
    name: "Monthly Sample Analysis Report per Week for Selected Exporter",
    requiresExporter: true,
    requiresWeek: true,
  },
  {
    id: "monthly-analysis-all-exporters",
    name: "Monthly Sample Analysis Report for All Exporters per Week",
    requiresWeek: true,
  },
];

export default function QuickReports() {
  const [selectedReport, setSelectedReport] = useState<string>("");
  const [selectedExporter, setSelectedExporter] = useState<string>("");
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exporters, setExporters] = useState<Exporter[]>([]);
  const [loadingExporters, setLoadingExporters] = useState(false);

  const selectedReportOption = reportOptions.find(
    (r) => r.id === selectedReport
  );

  useEffect(() => {
    if (selectedReportOption?.requiresExporter) {
      fetchExporters();
    }
  }, [selectedReportOption]);

  const fetchExporters = async () => {
    setLoadingExporters(true);
    try {
      const response = await fetch("/api/exporters");
      if (response.ok) {
        const data = await response.json();
        setExporters(data);
      }
    } catch (error) {
      console.error("Error fetching exporters:", error);
    } finally {
      setLoadingExporters(false);
    }
  };

  const generateReport = async () => {
    if (!selectedReport) return;

    setIsGenerating(true);
    try {
      // Create report data object
      const reportData = {
        reportType: selectedReport,
        exporterId: selectedExporter || undefined,
        weekStart: selectedWeek || undefined,
      };

      // Generate PDF using the same format as job cards
      const response = await fetch("/api/reports/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedReport}-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
      <h2 className="text-xl font-semibold mb-4">Quick Reports</h2>

      <div className="flex flex-wrap gap-4 items-end">
        {/* Report Type Dropdown */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Report Type
          </label>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="relative w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <span className="block truncate">
              {selectedReportOption?.name || "Select a report..."}
            </span>
            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            </span>
          </button>

          {isDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
              {reportOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setSelectedReport(option.id);
                    setIsDropdownOpen(false);
                    // Reset dependent fields
                    if (!option.requiresExporter) {
                      setSelectedExporter("");
                    }
                    if (!option.requiresWeek) {
                      setSelectedWeek("");
                    }
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  {option.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Exporter Selection (if required) */}
        {selectedReportOption?.requiresExporter && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exporter
            </label>
            <select
              value={selectedExporter}
              onChange={(e) => setSelectedExporter(e.target.value)}
              disabled={loadingExporters}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="">
                {loadingExporters
                  ? "Loading exporters..."
                  : "Select exporter..."}
              </option>
              {exporters.map((exporter) => (
                <option key={exporter.id} value={exporter.id}>
                  {exporter.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Week Selection (if required) */}
        {selectedReportOption?.requiresWeek && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Week Starting
            </label>
            <input
              type="date"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            />
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={generateReport}
          disabled={
            !selectedReport ||
            isGenerating ||
            (selectedReportOption?.requiresExporter && !selectedExporter) ||
            (selectedReportOption?.requiresWeek && !selectedWeek)
          }
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PrinterIcon className="w-4 h-4 mr-2" />
          {isGenerating ? "Generating..." : "Generate PDF"}
        </button>
      </div>
    </div>
  );
}
