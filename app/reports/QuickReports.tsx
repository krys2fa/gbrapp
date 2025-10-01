"use client";

import React, { useState, useEffect } from "react";
import { ChevronDownIcon, PrinterIcon, XMarkIcon } from "@heroicons/react/24/outline";

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

interface ReportData {
  data: any[];
  title: string;
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
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [showReport, setShowReport] = useState(false);

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

      // Fetch report data from the new API endpoint
      const response = await fetch("/api/reports/data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      const data = await response.json();
      setReportData(data);
      setShowReport(true);
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const clearReport = () => {
    setReportData(null);
    setShowReport(false);
  };

  const downloadPDF = async () => {
    if (!selectedReport) return;

    setIsGenerating(true);
    try {
      // Create report data object
      const reportData = {
        reportType: selectedReport,
        exporterId: selectedExporter || undefined,
        weekStart: selectedWeek || undefined,
      };

      // Generate PDF using the existing endpoint
      const response = await fetch("/api/reports/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
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
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Generation Form */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
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
                      // Clear previous report
                      clearReport();
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

          {/* Action Buttons */}
          <div className="flex gap-2">
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
              {isGenerating ? "Generating..." : "Generate Report"}
            </button>

            {showReport && (
              <>
                <button
                  onClick={downloadPDF}
                  disabled={isGenerating}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PrinterIcon className="w-4 h-4 mr-2" />
                  Download PDF
                </button>

                <button
                  onClick={clearReport}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <XMarkIcon className="w-4 h-4 mr-2" />
                  Clear
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Report Display */}
      {showReport && reportData && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">{reportData.title}</h3>

          {reportData.data.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No data found for the selected criteria.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(reportData.data[0] || {}).map((key) => (
                      <th
                        key={key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.data.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {Object.values(row).map((value: any, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        >
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
