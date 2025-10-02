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
      /* Hide print-only elements on screen */
      .print-only {
        display: none !important;
      }

      @media print {
        @page {
          size: A4 landscape;
          margin: 5mm 10mm 10mm 10mm;
        }

        /* Hide elements with no-print class */
        .no-print {
          display: none !important;
        }

        /* Show print-only elements in print */
        .print-only {
          display: flex !important;
        }

        /* Make content use full page space when navigation is hidden */
        body {
          margin: 0 !important;
          padding: 0 !important;
        }

        /* Specific targeting for layout elements only - preserve content spacing */
        html, body, #__next {
          margin-top: 0 !important;
          padding-top: 0 !important;
        }

        /* Reset margins/padding for layout containers only */
        [class*="lg:flex-1"] {
          margin: 0 !important;
          padding: 0 !important;
        }

        /* Remove spacing from layout containers */
        [class*="pt-16"], [class*="pt-0"], [class*="min-h-screen"] {
          padding-top: 0 !important;
          margin-top: 0 !important;
          min-height: auto !important;
        }

        /* Preserve normal spacing within report content */
        .print-content * {
          margin-top: initial !important;
          padding-top: initial !important;
        }

        /* Maintain specific spacing for report elements */
        .print-content h3 {
          margin-bottom: 1rem !important;
        }

        .print-content table {
          margin-top: 0 !important;
        }

        /* Show all content exactly as it appears on screen */
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        /* Add header with logo, title, and QR code for print */
        .print-content::before {
          content: "${reportData?.title || "Report"}";
          display: block;
          text-align: center;
          font-size: 1.25rem;
          font-weight: bold;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          position: relative;
          min-height: 60px;
          padding-top: 10px;
        }

        /* Add logo background */
        .print-content::before {
          background-image: url("${
            window.location.origin
          }/goldbod-logo-black.png");
          background-size: 80px 40px;
          background-repeat: no-repeat;
          background-position: left center;
          padding-left: 90px;
        }

        /* Add QR code background */
        .print-content::before {
          background-image:
            url("${window.location.origin}/goldbod-logo-black.png"),
            url("https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://goldbod.gov.gh/");
          background-size: 80px 40px, 60px 60px;
          background-repeat: no-repeat;
          background-position: left center, right center;
          padding-left: 90px;
          padding-right: 70px;
        }

        /* Hide the original title in print */
        .print-content h3:first-child {
          display: none !important;
        }

        /* Ensure table starts at the top */
        .print-content table {
          margin-top: 0 !important;
        }

        /* Add borders and padding to table in print view */
        .print-content table {
          border: 1px solid #000 !important;
          border-collapse: collapse !important;
          margin-top: 20px !important;
        }

        .print-content table th,
        .print-content table td {
          border: 1px solid #000 !important;
          padding: 8px !important;
        }

        /* Style table headers to match web appearance */
        .print-content table th {
          background-color: #f9fafb !important;
          color: #6b7280 !important;
          font-weight: 500 !important;
          font-size: 0.75rem !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
        }

        /* Remove bottom border from Exporter header */
        .print-content table th:first-child {
          border-bottom: none !important;
        }

        /* Remove bottom border from Weight of Bullion header */
        .print-content table th:nth-child(2) {
          border-bottom: none !important;
        }

        /* Remove bottom border from Estimated Value in USD header */
        .print-content table th:last-child {
          border-bottom: none !important;
        }

        /* Remove all borders from sub-header row */
        .print-content table thead tr:nth-child(2) th {
          border: none !important;
        }

        /* Add borders back to specific sub-header cells */
        .print-content table thead tr:nth-child(2) th:nth-child(2),
        .print-content table thead tr:nth-child(2) th:nth-child(3),
        .print-content table thead tr:nth-child(2) th:nth-child(4) {
          border: 1px solid #000 !important;
        }

        /* Remove border from content container in print view */
        .print-content {
          border: none !important;
          box-shadow: none !important;
        }

        /* Add more space above the signature section */
        .print-content .mt-24 {
          margin-top: 120px !important;
        }

        /* Style the seal image for print */
        .print-content .seal-container {
          position: relative !important;
        }

        .print-content .seal-container img {
          width: 80px !important;
          height: 80px !important;
          opacity: 1 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, [reportData]);

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
    // Simply trigger the browser's print functionality
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Report Generation Form */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 no-print">
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
        <div className="bg-white rounded-2xl p-6 border border-gray-200 print-content">
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
          <div className="mt-24 flex justify-between items-start print-only">
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

            {/* Seal Image */}
            <div className="seal-container">
              <img
                src="/seal.png"
                alt="Official Seal"
                className="w-24 h-24 object-contain opacity-80"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
