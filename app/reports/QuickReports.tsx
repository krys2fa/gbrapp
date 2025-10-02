"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronDownIcon,
  PrinterIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface Exporter {
  id: string;
  name: string;
}

interface ReportOption {
  id: string;
  name: string;
  requiresExporter?: boolean;
  requiresWeek?: boolean;
  requiresMonth?: boolean;
  requiresScale?: boolean;
}

interface ReportData {
  data: any[];
  title: string;
}

const reportOptions: ReportOption[] = [
  {
    id: "monthly-shipment-all-exporters",
    name: "Monthly Shipment Reports for All Exporters",
    requiresMonth: true,
    requiresScale: true,
  },
  {
    id: "monthly-shipment-gold-exporters",
    name: "Monthly Shipment Report for Gold Exporters",
    requiresMonth: true,
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
    requiresMonth: true,
  },
  {
    id: "monthly-analysis-all-exporters",
    name: "Monthly Sample Analysis Report for All Exporters per Week",
    requiresMonth: true,
  },
];

export default function QuickReports() {
  const [selectedReport, setSelectedReport] = useState<string>("");
  const [selectedExporter, setSelectedExporter] = useState<string>("");
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedScale, setSelectedScale] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exporters, setExporters] = useState<Exporter[]>([]);
  const [loadingExporters, setLoadingExporters] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [showReport, setShowReport] = useState(false);

  // Add print styles
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @media print {
        @page {
          size: A4 landscape;
          margin: 0.5in;
        }
        body * {
          visibility: hidden;
        }
        .print-view, .print-view * {
          visibility: visible;
        }
        .print-view {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: auto;
        }
        .no-print {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const scaleOptions = [
    { id: "small-scale", name: "Small Scale" },
    { id: "large-scale", name: "Large Scale" },
  ];

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
        ...(selectedReportOption?.requiresWeek && { weekStart: selectedWeek }),
        ...(selectedReportOption?.requiresMonth && {
          monthStart: selectedMonth,
        }),
        ...(selectedReportOption?.requiresScale && { scale: selectedScale }),
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

  const downloadPDF = () => {
    // Directly trigger print functionality on current page content
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Report Generation Form */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        {/* <h2 className="text-xl font-semibold mb-4">Quick Reports</h2> */}

        <div className="flex flex-wrap gap-4 items-end">
          {/* Report Type Dropdown */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Type
            </label>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="relative min-w-[450px] bg-white border border-gray-300 rounded-md px-3 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                      if (!option.requiresMonth) {
                        setSelectedMonth("");
                      }
                      if (!option.requiresScale) {
                        setSelectedScale("");
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

          {/* Month Selection (if required) */}
          {selectedReportOption?.requiresMonth && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              />
            </div>
          )}

          {/* Scale Selection (if required) */}
          {selectedReportOption?.requiresScale && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scale
              </label>
              <select
                value={selectedScale}
                onChange={(e) => setSelectedScale(e.target.value)}
                className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">Select scale...</option>
                {scaleOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
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
                (selectedReportOption?.requiresWeek && !selectedWeek) ||
                (selectedReportOption?.requiresMonth && !selectedMonth) ||
                (selectedReportOption?.requiresScale && !selectedScale)
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
          <h3 className="text-lg text-center font-semibold mb-4">
            {reportData.title}
          </h3>

          {reportData.data.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No data found for the selected criteria.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                <thead className="bg-gray-50">
                  {/* Combined header row */}
                  <tr>
                    <th className="px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider align-bottom border-r border-gray-300">
                      Exporter
                    </th>
                    <th
                      colSpan={3}
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-r border-gray-300"
                    >
                      Weight of Bullion
                    </th>
                    <th className="px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider align-bottom border-l border-gray-300">
                      Estimated Value in USD
                    </th>
                  </tr>
                  {/* Sub-header row */}
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                      {/* Empty cell under Exporter */}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-r border-gray-300">
                      Gross Weight
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                      Net Gold Weight in Oz
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                      Net Silver Weight in Oz
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-300">
                      {/* Empty cell under Estimated Value */}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.data.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {Object.entries(row).map(([key, value], cellIndex) => (
                        <td
                          key={cellIndex}
                          className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 ${
                            cellIndex > 0 ? "text-right" : ""
                          }`}
                        >
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    {Object.keys(reportData.data[0] || {}).map((key, index) => {
                      if (index === 0) {
                        // First column (Exporter) - show "TOTAL"
                        return (
                          <td
                            key={`total-${key}`}
                            className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900"
                          >
                            TOTAL
                          </td>
                        );
                      } else {
                        // Calculate totals for numeric columns
                        const total = reportData.data.reduce((sum, row) => {
                          const value = row[key as keyof typeof row];
                          if (typeof value === "string") {
                            // Remove currency symbols and commas for calculation
                            const numericValue = parseFloat(
                              value.replace(/[$,]/g, "")
                            );
                            return (
                              sum + (isNaN(numericValue) ? 0 : numericValue)
                            );
                          }
                          return sum + (typeof value === "number" ? value : 0);
                        }, 0);

                        // Format the total based on the column type
                        let formattedTotal = total.toString();
                        if (key === "grossWeight") {
                          formattedTotal = total.toFixed(4);
                        } else if (
                          key.toLowerCase().includes("weight") &&
                          key.toLowerCase().includes("oz")
                        ) {
                          formattedTotal = total.toFixed(3);
                        } else if (
                          key.toLowerCase().includes("value") ||
                          key.toLowerCase().includes("usd")
                        ) {
                          formattedTotal = new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                          }).format(total);
                        } else if (key.toLowerCase().includes("oz")) {
                          formattedTotal = total.toFixed(3);
                        }

                        return (
                          <td
                            key={`total-${key}`}
                            className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 border-r border-gray-200 ${
                              index > 0 ? "text-right" : ""
                            }`}
                          >
                            {formattedTotal}
                          </td>
                        );
                      }
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Signature Section */}
          <div className="mt-24 flex justify-start">
            <div className="text-left">
              <div className="border-b border-gray-400 w-64 mb-2"></div>

              <div className="mb-2">
                <p className="text-sm font-medium text-gray-700">
                  (Head of Technical Department)
                </p>
              </div>
              {/* <div className="text-xs text-gray-500">Signature</div> */}
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700">Date</p>
              </div>
              <div className="border-b border-gray-400 w-32 mt-1 ml-8"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
