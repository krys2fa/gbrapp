"use client";

import React, { useState } from "react";
import { Header } from "@/app/components/layout/header";
import { FileText, Download } from "lucide-react";

type ReportType =
  | "weekly-summary"
  | "weekly-comprehensive"
  | "monthly-summary"
  | "monthly-comprehensive";

const mockReportContent = (type: ReportType) => {
  const now = new Date().toLocaleString();
  switch (type) {
    case "weekly-summary":
      return `Weekly Summary Report\nGenerated: ${now}\n\n- Total Job Cards: 42\n- Completed: 30\n- Pending: 12\n- Total Export Value (USD): $120,345`;
    case "weekly-comprehensive":
      return `Weekly Comprehensive Report\nGenerated: ${now}\n\nDetailed transactions, exporter breakdowns, tax summaries, and attached charts.`;
    case "monthly-summary":
      return `Monthly Summary Report\nGenerated: ${now}\n\n- Total Job Cards: 432\n- Completed: 398\n- Pending: 34\n- Total Export Value (USD): $1,234,567`;
    case "monthly-comprehensive":
      return `Monthly Comprehensive Report\nGenerated: ${now}\n\nFull export ledger, tax reconciliations, fees, and per-exporter analytics.`;
  }
};

export default function ReportsPage() {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = (type: ReportType) => {
    setLoading(true);
    setTimeout(() => {
      setReport(mockReportContent(type));
      setLoading(false);
    }, 600);
  };

  const downloadReport = () => {
    if (!report) return;
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Header
        title="Reports"
        icon={<FileText className="h-5 w-5" />}
        subtitle="Generate weekly and monthly summary or comprehensive reports."
      />

      <main className="py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {/* <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-black rounded-lg flex items-center justify-center text-white">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Generate Reports</h2>
                <p className="text-sm text-gray-500">
                  Weekly and monthly, summary and comprehensive reports.
                </p>
              </div>
            </div> */}
            <div>
              <span className="text-sm text-gray-500">Quick generate</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => generateReport("weekly-summary")}
              className="p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              Weekly Summary
            </button>
            <button
              onClick={() => generateReport("weekly-comprehensive")}
              className="p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              Weekly Comprehensive
            </button>
            <button
              onClick={() => generateReport("monthly-summary")}
              className="p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              Monthly Summary
            </button>
            <button
              onClick={() => generateReport("monthly-comprehensive")}
              className="p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              Monthly Comprehensive
            </button>
          </div>

          <div className="mt-6">
            {loading && (
              <div className="text-sm text-gray-500">Generating...</div>
            )}
            {report && (
              <div className="mt-4 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-100">
                  {report}
                </pre>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={downloadReport}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md"
                  >
                    <Download className="h-4 w-4" /> Download
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
