"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PrinterIcon } from "@heroicons/react/24/outline";

const GRAMS_PER_TROY_OUNCE = 31.1035;

function formatNumber(num: number): string {
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCurrency(
  amount: number,
  currency: string = "USD",
  includeSymbol: boolean = true
): string {
  const symbol = currency === "USD" ? "$" : currency === "GHS" ? "₵" : currency;
  const formatted = amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return includeSymbol ? `${symbol}${formatted}` : formatted;
}

interface FeesData {
  fees: any[];
  jobCards: any[];
  largeScaleJobCards: any[];
  exporterStats: any[];
  totalRevenue: number;
  totalJobCards: number;
  avgRevenuePerJobCard: number;
  transactionDetails?: any[];
}

export default function RevenueAnalyticsDashboard() {
  const [feesReportParam, setFeesReportParam] = useState("daily-summary");
  const [feesData, setFeesData] = useState<FeesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeesData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/dashboard/fees?feesReport=${feesReportParam}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch fees data");
      }

      const data = await response.json();
      setFeesData(data);
    } catch (err) {
      console.error("Error fetching fees data:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeesData();
  }, [feesReportParam]);

  const feesIsDaily = feesReportParam.startsWith("daily");
  const feesIsSummary = feesReportParam.includes("summary");
  const feesPeriodDays = feesIsDaily
    ? 1
    : feesReportParam.startsWith("weekly")
    ? 7
    : 30;
  const feesUntil = new Date();
  const feesSinceDate = new Date(
    Date.now() - feesPeriodDays * 24 * 60 * 60 * 1000
  );

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
        <p className="text-red-700 font-medium">Error loading revenue data</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <h2 className="text-2xl font-semibold mb-4">
        Revenue Analytics Dashboard
      </h2>

      {/* Fees controls */}
      <div className="text-sm text-gray-600 mb-3">
        Showing:{" "}
        <strong>
          {feesIsDaily ? "Daily" : feesPeriodDays === 7 ? "Weekly" : "Monthly"}
        </strong>{" "}
        <strong>{feesIsSummary ? "Summary" : "Comprehensive"}</strong> —{" "}
        {feesSinceDate.toLocaleDateString()} to {feesUntil.toLocaleDateString()}
      </div>

      <div className="mb-4 flex gap-2 flex-wrap">
        <button
          onClick={() => setFeesReportParam("daily-summary")}
          className={`px-3 py-1 rounded-md border ${
            feesReportParam === "daily-summary"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-700"
          }`}
        >
          Daily Summary
        </button>
        <button
          onClick={() => setFeesReportParam("daily-comprehensive")}
          className={`px-3 py-1 rounded-md border ${
            feesReportParam === "daily-comprehensive"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-700"
          }`}
        >
          Daily Comprehensive
        </button>
        <button
          onClick={() => setFeesReportParam("weekly-summary")}
          className={`px-3 py-1 rounded-md border ${
            feesReportParam === "weekly-summary"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-700"
          }`}
        >
          Weekly Summary
        </button>
        <button
          onClick={() => setFeesReportParam("weekly-comprehensive")}
          className={`px-3 py-1 rounded-md border ${
            feesReportParam === "weekly-comprehensive"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-700"
          }`}
        >
          Weekly Comprehensive
        </button>
        <button
          onClick={() => setFeesReportParam("monthly-summary")}
          className={`px-3 py-1 rounded-md border ${
            feesReportParam === "monthly-summary"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-700"
          }`}
        >
          Monthly Summary
        </button>
        <button
          onClick={() => setFeesReportParam("monthly-comprehensive")}
          className={`px-3 py-1 rounded-md border ${
            feesReportParam === "monthly-comprehensive"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-700"
          }`}
        >
          Monthly Comprehensive
        </button>
      </div>

      <div className="mb-4">
        <a
          href={`/api/reports?report=revenue-analytics&feesReport=${encodeURIComponent(
            feesReportParam
          )}`}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
        >
          <PrinterIcon className="h-4 w-4" />
          Download CSV
        </a>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading revenue data...</p>
          </div>
        </div>
      ) : feesData ? (
        feesIsSummary ? (
          <div className="space-y-6">
            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-sm font-medium text-blue-700">
                  Total Revenue
                </h3>
                <p className="text-lg font-bold text-blue-900">
                  {formatCurrency(feesData.totalRevenue)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {feesPeriodDays === 1
                    ? "Today"
                    : `Last ${feesPeriodDays} days`}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-sm font-medium text-green-700">
                  Job Cards Processed
                </h3>
                <p className="text-lg font-bold text-green-900">
                  {feesData.totalJobCards.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Regular + Large Scale
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="text-sm font-medium text-purple-700">
                  Avg Revenue/Job Card
                </h3>
                <p className="text-lg font-bold text-purple-900">
                  {formatCurrency(feesData.avgRevenuePerJobCard)}
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  Revenue efficiency
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h3 className="text-sm font-medium text-orange-700">
                  Active Exporters
                </h3>
                <p className="text-lg font-bold text-orange-900">
                  {feesData.exporterStats.length}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  Generating revenue
                </p>
              </div>
            </div>

            {/* Exporter Performance Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exporter
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Revenue
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Cards
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Value/Card
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Market Share %
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Activity
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {feesData.exporterStats.map((stat: any, index: number) => {
                    const marketShare =
                      feesData.totalRevenue > 0
                        ? (stat.revenue / feesData.totalRevenue) * 100
                        : 0;
                    return (
                      <tr
                        key={`${stat.exporter}-${index}`}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className={`w-3 h-3 rounded-full mr-3 ${
                                index === 0
                                  ? "bg-yellow-400"
                                  : index === 1
                                  ? "bg-gray-400"
                                  : index === 2
                                  ? "bg-orange-400"
                                  : "bg-blue-400"
                              }`}
                            ></div>
                            <span className="text-sm font-medium text-indigo-600">
                              {stat.exporter}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                          {formatCurrency(stat.revenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {stat.jobCardCount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {formatCurrency(stat.avgJobCardValue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              marketShare >= 25
                                ? "bg-green-100 text-green-800"
                                : marketShare >= 15
                                ? "bg-yellow-100 text-yellow-800"
                                : marketShare >= 5
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {marketShare.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {stat.lastActivity.toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Comprehensive: detailed transaction list */
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exporter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job Card Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receipt #
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {feesData.transactionDetails?.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tx.date ? new Date(tx.date).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                      {tx.exporter}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tx.jobCardType === "Regular"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {tx.jobCardType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                      {formatCurrency(tx.amount)} {tx.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tx.status === "paid"
                            ? "bg-green-100 text-green-800"
                            : tx.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tx.receiptNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {tx.paymentDate
                        ? new Date(tx.paymentDate).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">No revenue data available</p>
        </div>
      )}
    </div>
  );
}
