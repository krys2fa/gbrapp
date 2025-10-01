"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PrinterIcon } from "@heroicons/react/24/outline";
import { formatCurrency } from "@/app/lib/utils";

const GRAMS_PER_TROY_OUNCE = 31.1035;

function formatNumber(v?: number) {
  if (v == null) return "-";
  return v.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface ExporterAnalyticsDashboardProps {
  reportParam?: string;
}

interface AnalyticsData {
  rows: any[];
  isSummary: boolean;
  isWeekly: boolean;
  periodDays: number;
  until: string;
  sinceDate: string;
  commodityPrice: number;
}

export default function ExporterAnalyticsDashboard({
  reportParam: initialReportParam = "weekly-summary",
}: ExporterAnalyticsDashboardProps) {
  const [reportParam, setReportParam] = useState(initialReportParam);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/dashboard/exporters?report=${encodeURIComponent(reportParam)}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch analytics data");
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      console.error("Error fetching analytics data:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [reportParam]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
        <p className="text-red-700 font-medium">Error loading analytics data</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h2 className="text-2xl font-semibold mb-4">
          Exporter Performance Analytics Dashboard
        </h2>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading performance data...</p>
          </div>
        </div>
      </div>
    );
  }

  const { rows, isSummary, isWeekly, periodDays, until, sinceDate } = data;

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
      <h2 className="text-2xl font-semibold mb-4">
        Exporter Performance Analytics Dashboard
      </h2>

      <div className="text-sm text-gray-600 mb-3">
        Showing: <strong>{isWeekly ? "Weekly" : "Monthly"}</strong>{" "}
        <strong>{isSummary ? "Summary" : "Comprehensive"}</strong> —{" "}
        {new Date(sinceDate).toLocaleDateString()} to{" "}
        {new Date(until).toLocaleDateString()}
      </div>

      <div className="mb-4 flex gap-2 flex-wrap">
        <button
          onClick={() => setReportParam("weekly-summary")}
          className={`px-3 py-1 rounded-md border ${
            reportParam === "weekly-summary"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-700"
          }`}
        >
          Weekly Summary
        </button>
        <button
          onClick={() => setReportParam("weekly-comprehensive")}
          className={`px-3 py-1 rounded-md border ${
            reportParam === "weekly-comprehensive"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-700"
          }`}
        >
          Weekly Comprehensive
        </button>
        <button
          onClick={() => setReportParam("monthly-summary")}
          className={`px-3 py-1 rounded-md border ${
            reportParam === "monthly-summary"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-700"
          }`}
        >
          Monthly Summary
        </button>
        <button
          onClick={() => setReportParam("monthly-comprehensive")}
          className={`px-3 py-1 rounded-md border ${
            reportParam === "monthly-comprehensive"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-700"
          }`}
        >
          Monthly Comprehensive
        </button>
      </div>

      <div className="mb-4">
        <a
          href={`/api/reports?report=${encodeURIComponent(reportParam)}`}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
        >
          <PrinterIcon className="h-4 w-4" />
          Download CSV
        </a>
      </div>

      {/* Performance Overview Cards */}
      {(() => {
        const totalGold = rows.reduce(
          (sum, r) => sum + (r.netGoldGrams || 0),
          0
        );
        const totalSilver = rows.reduce(
          (sum, r) => sum + (r.netSilverGrams || 0),
          0
        );
        const totalValue = rows.reduce(
          (sum, r) => sum + (r.estimatedValue || 0),
          0
        );
        const avgGoldPerExporter =
          rows.length > 0 ? totalGold / rows.length : 0;
        const topExporter =
          rows.length > 0
            ? rows.reduce(
                (max, r) => (r.estimatedValue > max.estimatedValue ? r : max),
                rows[0]
              )
            : null;

        return (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="text-sm font-medium text-yellow-700">
                Total Gold Processed
              </h3>
              <p className="text-lg font-bold text-yellow-900">
                {formatNumber(totalGold)}g
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                {(totalGold / GRAMS_PER_TROY_OUNCE).toFixed(2)} oz
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700">
                Total Silver Processed
              </h3>
              <p className="text-lg font-bold text-gray-900">
                {formatNumber(totalSilver)}g
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {(totalSilver / GRAMS_PER_TROY_OUNCE).toFixed(2)} oz
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-sm font-medium text-green-700">
                Total Market Value
              </h3>
              <p className="text-lg font-bold text-green-900">
                {formatCurrency(totalValue)}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Combined precious metals
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-700">
                Avg Gold/Exporter
              </h3>
              <p className="text-lg font-bold text-blue-900">
                {formatNumber(avgGoldPerExporter)}g
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Processing efficiency
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="text-sm font-medium text-purple-700">
                Top Performer
              </h3>
              <p className="text-lg font-bold text-purple-900">
                {topExporter?.exporter || "N/A"}
              </p>
              <p className="text-xs text-purple-600 mt-1">
                {topExporter
                  ? formatCurrency(topExporter.estimatedValue)
                  : "No data"}
              </p>
            </div>
          </div>
        );
      })()}

      <div className="mb-4 flex gap-2 flex-wrap">
        <Link
          href={`?report=weekly-summary`}
          className={`px-3 py-1 rounded-md border ${
            reportParam === "weekly-summary"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-700"
          }`}
        >
          Weekly Summary
        </Link>
        <Link
          href={`?report=weekly-comprehensive`}
          className={`px-3 py-1 rounded-md border ${
            reportParam === "weekly-comprehensive"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-700"
          }`}
        >
          Weekly Comprehensive
        </Link>
        <Link
          href={`?report=monthly-summary`}
          className={`px-3 py-1 rounded-md border ${
            reportParam === "monthly-summary"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-700"
          }`}
        >
          Monthly Summary
        </Link>
        <Link
          href={`?report=monthly-comprehensive`}
          className={`px-3 py-1 rounded-md border ${
            reportParam === "monthly-comprehensive"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-700"
          }`}
        >
          Monthly Comprehensive
        </Link>
      </div>

      <div className="mb-4">
        <a
          href={`/api/reports?report=${encodeURIComponent(reportParam)}`}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-green-600 text-white"
        >
          <PrinterIcon className="h-4 w-4 mr-1" />
          Download CSV
        </a>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {!isSummary && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Exporter
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Net Gold (g)
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gold (oz)
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Net Silver (g)
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Market Value (USD)
              </th>
              {isSummary && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Market Share %
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((r, index) => {
              const goldOz = r.netGoldGrams / GRAMS_PER_TROY_OUNCE;
              const totalValue = rows.reduce(
                (sum, row) => sum + (row.estimatedValue || 0),
                0
              );
              const marketShare =
                totalValue > 0 ? (r.estimatedValue / totalValue) * 100 : 0;

              return (
                <tr key={r.id || index}>
                  {!isSummary && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {r.createdAt
                        ? new Date(r.createdAt).toLocaleDateString()
                        : "-"}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {r.exporter}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatNumber(r.netGoldGrams)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {goldOz.toFixed(3)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatNumber(r.netSilverGrams)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                    {formatCurrency(r.estimatedValue)}
                  </td>
                  {isSummary && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {marketShare.toFixed(1)}%
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
