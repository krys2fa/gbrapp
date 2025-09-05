"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/app/components/layout/header";
import {
  DashboardStats,
  RecentActivity,
} from "@/app/components/ui/dashboard-stats";
import {
  TopExportersChart,
  ExporterInvoiceChart,
} from "@/app/components/ui/dashboard-charts";
import {
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  RefreshCw,
  Plus,
  Building,
  Users,
  Settings,
  DollarSign,
  Repeat,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { withClientAuth } from "@/app/lib/with-client-auth";
import { useAuth } from "@/app/context/auth-context";

interface DashboardData {
  overview: {
    totalJobCards: {
      value: number;
      change: string;
      changeType: "positive" | "negative";
    };
    totalExporters: {
      value: number;
      change: string;
      changeType: "positive" | "negative";
    };
    totalUsers: {
      value: number;
      change: string;
      changeType: "positive" | "negative";
    };
    totalRevenue: {
      value: number;
      change: string;
      changeType: "positive" | "negative";
    };
    activeJobCards: number;
    completedJobCards: number;
    pendingJobCards: number;
    thisWeekJobCards: number;
  };
  charts: {
    jobCardsByStatus: Array<{ name: string; value: number }>;
    monthlyTrend: Array<{ month: string; count: number }>;
    topExporters: Array<{ name: string; code: string; jobCards: number }>;
  };
  recentActivity: Array<{
    id: string;
    user: string;
    action: string;
    time: Date | string;
    type: string;
  }>;
  exporterInvoiceChart?: Array<{
    month: string;
    [exporterName: string]: number | string;
  }>;
  financials?: {
    currentExchangeRateGhs?: number;
    currentGoldPriceGhsPerOz?: number;
    currentSilverPriceGhsPerOz?: number;
    totalExportValueUsd?: number;
    totalExportValueGhs?: number;
    totalQuantityKg?: number;
    totalQuantityLbs?: number;
    serviceFeesInclusive?: number;
    withholdingTax?: number;
    totalVat?: number;
    totalNhil?: number;
    totalCovidLevy?: number;
    totalGetFund?: number;
  };
}

function DashboardPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/dashboard/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <>
      <Header
        title="Dashboard"
        icon={<Activity className="h-5 w-5" />}
        subtitle="Overview of system metrics and recent activity."
      />

      <main className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        {/* Welcome Section */}
        <div
          className="rounded-2xl p-6 text-white"
          style={{ background: "linear-gradient(90deg, #27572a, #2e7030)" }}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Welcome back, {user?.name || "User"}!
              </h2>
              <p className="text-yellow-100 text-lg">
                Here&apos;s what&apos;s happening today.
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                <Calendar className="h-5 w-5" />
                <span className="font-medium">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
              <button
                onClick={fetchDashboardData}
                disabled={isLoading}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
                />
                <span className="font-medium">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <p className="text-red-700 dark:text-red-400 font-medium">
                Error loading dashboard data
              </p>
            </div>
            <p className="text-red-600 dark:text-red-300 text-sm mt-1">
              {error}
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !dashboardData && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Loading dashboard data...
              </p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {(dashboardData || !isLoading) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            {/* 1. Total Revenue */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
                    <DollarSign className="h-5 w-5 text-orange-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Total Revenue (GHS)
                  </h3>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20">
                  <TrendingUp className="h-3 w-3" />
                  {dashboardData?.overview.totalRevenue.change}%
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardData?.overview.totalRevenue.value.toLocaleString() ||
                  "0"}
              </p>
            </div>

            {/* 2. Total Exporters */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
                    <Building className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Total Exporters
                  </h3>
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                    dashboardData?.overview.totalExporters.changeType ===
                    "positive"
                      ? "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20"
                      : "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20"
                  }`}
                >
                  {dashboardData?.overview.totalExporters.changeType ===
                  "positive" ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {dashboardData?.overview.totalExporters.change}%
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardData?.overview.totalExporters.value || "0"}
              </p>
            </div>

            {/* 3. Total Export (GHS) */}
            {/* {dashboardData?.financials?.totalExportValueGhs &&
              dashboardData.financials.totalExportValueGhs > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                      <span className="text-emerald-600 font-semibold">
                        GHS
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Total Export (GHS)
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {dashboardData.financials.totalExportValueGhs.toLocaleString()}
                  </p>
                </div>
              )} */}

            {/* 4. Gold Price */}
            {dashboardData?.financials?.currentGoldPriceGhsPerOz &&
              dashboardData?.financials?.currentGoldPriceGhsPerOz > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                      <span className="text-yellow-600 font-semibold">Au</span>
                    </div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Gold (GHS/oz)
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {dashboardData.financials.currentGoldPriceGhsPerOz.toFixed(
                      2
                    )}
                  </p>
                </div>
              )}

            {/* 5. Exchange Rate */}
            {dashboardData?.financials?.currentExchangeRateGhs &&
              dashboardData.financials.currentExchangeRateGhs > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                      <span className="text-indigo-600 font-semibold">FX</span>
                    </div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Exchange (GHS/USD)
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {dashboardData.financials.currentExchangeRateGhs.toFixed(4)}
                  </p>
                </div>
              )}

            {/* 6. Total Quantity KG */}
            {/* {dashboardData?.financials?.totalQuantityKg &&
              dashboardData.financials.totalQuantityKg > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl">
                      <span className="text-cyan-600 font-semibold">KG</span>
                    </div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Total Qty (kg)
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {dashboardData.financials.totalQuantityKg.toLocaleString()}{" "}
                    kg
                  </p>
                </div>
              )} */}
          </div>
        )}

        {/* Additional Stats Cards */}
        {dashboardData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {dashboardData.overview.activeJobCards > 0 && (
              <div
                title="Number of job cards currently active"
                aria-label="Number of job cards currently active"
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <Activity className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Active Job Cards
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardData.overview.activeJobCards}
                </p>
              </div>
            )}

            {dashboardData.overview.completedJobCards > 0 && (
              <div
                title="Number of job cards completed"
                aria-label="Number of job cards completed"
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Completed Job Cards
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardData.overview.completedJobCards}
                </p>
              </div>
            )}

            {dashboardData.overview.pendingJobCards > 0 && (
              <div
                title="Number of job cards pending action"
                aria-label="Number of job cards pending action"
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                    <PieChart className="h-5 w-5 text-yellow-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Pending Job Cards
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardData.overview.pendingJobCards}
                </p>
              </div>
            )}

            {/* {dashboardData.overview.thisWeekJobCards > 0 && (
              <div
                title="Job cards created or processed this week"
                aria-label="Job cards created or processed this week"
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Job Cards This Week
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardData.overview.thisWeekJobCards}
                </p>
              </div>
            )} */}
          </div>
        )}

        {/* Additional Financial Stats */}
        {/* {dashboardData?.financials && (
          <div className="space-y-6"> */}
        {/* Row 1: Gold, Silver, Export USD */}
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {dashboardData.financials?.currentSilverPriceGhsPerOz &&
                dashboardData.financials.currentSilverPriceGhsPerOz > 0 && (
                  <div
                    title="Current silver price in GHS per troy ounce"
                    aria-label="Current silver price in GHS per troy ounce"
                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-slate-50 dark:bg-slate-900/20 rounded-xl">
                        <span className="text-slate-600 font-semibold">Ag</span>
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Silver (GHS/oz)
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {dashboardData.financials.currentSilverPriceGhsPerOz.toFixed(
                        2
                      )}
                    </p>
                  </div>
                )}

              {dashboardData.financials?.totalExportValueUsd &&
                dashboardData.financials.totalExportValueUsd > 0 && (
                  <div
                    title="Total value of exports in US dollars"
                    aria-label="Total value of exports in US dollars"
                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                        <span className="text-emerald-600 font-semibold">
                          USD
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Total Export (USD)
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      $
                      {dashboardData?.financials.totalExportValueUsd.toLocaleString()}
                    </p>
                  </div>
                )}

              {dashboardData.financials?.totalQuantityLbs &&
                dashboardData.financials.totalQuantityLbs > 0 && (
                  <div
                    title="Total quantity exported in pounds"
                    aria-label="Total quantity exported in pounds"
                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl">
                        <span className="text-cyan-600 font-semibold">LB</span>
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Total Qty (lbs)
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {dashboardData.financials.totalQuantityLbs.toLocaleString()}{" "}
                      lbs
                    </p>
                  </div>
                )}
            </div> */}

        {/* Row 2: Fees and Taxes */}
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {dashboardData.financials?.serviceFeesInclusive &&
                dashboardData.financials.serviceFeesInclusive > 0 && (
                  <div
                    title="Sum of service fees (inclusive)"
                    aria-label="Sum of service fees (inclusive)"
                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
                        <span className="text-rose-600 font-semibold">
                          Fees
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Service Fees (inc)
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {dashboardData.financials.serviceFeesInclusive.toLocaleString()}
                    </p>
                  </div>
                )}

              {dashboardData.financials?.withholdingTax &&
                dashboardData.financials.withholdingTax > 0 && (
                  <div
                    title="Total withholding tax collected"
                    aria-label="Total withholding tax collected"
                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
                        <span className="text-rose-600 font-semibold">W/H</span>
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Withholding Tax
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {dashboardData.financials.withholdingTax.toLocaleString()}
                    </p>
                  </div>
                )}

              {dashboardData.financials?.totalVat &&
                dashboardData.financials.totalVat > 0 && (
                  <div
                    title="Total VAT collected"
                    aria-label="Total VAT collected"
                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                        <span className="text-amber-600 font-semibold">
                          VAT
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Total VAT
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {dashboardData?.financials.totalVat.toLocaleString()}
                    </p>
                  </div>
                )}

              {dashboardData?.financials?.totalNhil &&
                dashboardData?.financials.totalNhil > 0 && (
                  <div
                    title="Total NHIL collected"
                    aria-label="Total NHIL collected"
                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-slate-50 dark:bg-slate-900/20 rounded-xl">
                        <span className="text-slate-600 font-semibold">
                          NHIL
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Total NHIL
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {dashboardData?.financials.totalNhil.toLocaleString()}
                    </p>
                  </div>
                )}
            </div> */}

        {/* Row 3: Additional levies */}
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {dashboardData?.financials?.totalCovidLevy &&
                dashboardData?.financials.totalCovidLevy > 0 && (
                  <div
                    title="Total COVID levy collected"
                    aria-label="Total COVID levy collected"
                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-slate-50 dark:bg-slate-900/20 rounded-xl">
                        <span className="text-slate-600 font-semibold">
                          COVID
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        COVID Levy
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {dashboardData.financials.totalCovidLevy.toLocaleString()}
                    </p>
                  </div>
                )}

              {dashboardData?.financials?.totalGetFund &&
                dashboardData?.financials?.totalGetFund > 0 && (
                  <div
                    title="Total amount collected for GETFund"
                    aria-label="Total amount collected for GETFund"
                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
                        <span className="text-violet-600 font-semibold">
                          GET
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        GETFund
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {dashboardData?.financials.totalGetFund.toLocaleString()}
                    </p>
                  </div>
                )}
            </div> */}
        {/* </div>
        )} */}

          {/* Exporter Invoice Chart */}
        {dashboardData?.exporterInvoiceChart && (
          <ExporterInvoiceChart data={dashboardData.exporterInvoiceChart} />
        )}

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 w-full">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-6 gap-4">
            {[
              {
                label: "New Job Card",
                icon: <Plus className="h-6 w-6" />,
                color: "bg-yellow-600",
                href: "/job-cards/new",
              },
              {
                label: "Manage Daily Prices",
                description: "Set up daily commodity prices.",
                icon: <DollarSign className="h-6 w-6" />,
                href: "/setup/daily-prices",
                color: "bg-lime-600",
              },
              {
                label: "Manage Weekly Exchange Rates",
                description: "Set up weekly exchange rates.",
                icon: <Repeat className="h-6 w-6" />,
                href: "/setup/daily-exchange",
                color: "bg-purple-600",
              },
              {
                label: "View Exporters",
                icon: <Building className="h-6 w-6" />,
                color: "bg-blue-800",
                href: "/setup/exporters",
              },
              {
                label: "User Management",
                icon: <Users className="h-6 w-6" />,
                color: "bg-yellow-700",
                href: "/setup/users",
              },
              {
                label: "System Settings",
                icon: <Settings className="h-6 w-6" />,
                color: "bg-gray-900",
                href: "/setup",
              },
            ].map((action, index) => (
              <a
                key={index}
                href={action.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
              >
                <div
                  className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center text-white group-hover:scale-105 transition-transform`}
                >
                  {action.icon}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                  {action.label}
                </span>
              </a>
            ))}
          </div>
        </div>

      

        {/* Charts + Sidebar Trio: Recent Activity | System Status | Top Exporters (single row) */}
        {/* {dashboardData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RecentActivity data={dashboardData?.recentActivity || []} />
            <TopExportersChart
              data={dashboardData?.charts?.topExporters || []}
            />
          </div>
        )} */}
      </main>
    </>
  );
}

// Disable prerendering for this page to avoid SSR issues
export const dynamic = "force-dynamic";

// Export the component directly for now to test
export default DashboardPage;
