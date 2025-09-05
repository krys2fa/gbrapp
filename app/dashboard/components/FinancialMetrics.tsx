"use client";

import React from "react";

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

export default function FinancialMetrics({ data }: { data: DashboardData }) {
  return (
    <>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {/** FX and precious metals **/}
        <div
          title="Current exchange rate (GHS per USD)"
          aria-label="Current exchange rate (GHS per USD)"
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
              <span className="text-indigo-600 font-semibold">FX</span>
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Exchange (GHS/USD)
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.financials?.currentExchangeRateGhs?.toFixed(2)}
          </p>
        </div>

        <div
          title="Current gold price in GHS per troy ounce"
          aria-label="Current gold price in GHS per troy ounce"
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
              <span className="text-yellow-600 font-semibold">Au</span>
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Gold (GHS/oz)
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.financials?.currentGoldPriceGhsPerOz?.toLocaleString()}
          </p>
        </div>

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
            {data.financials?.currentSilverPriceGhsPerOz?.toFixed(2)}
          </p>
        </div>

        <div
          title="Total value of exports in US dollars"
          aria-label="Total value of exports in US dollars"
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
              <span className="text-emerald-600 font-semibold">USD</span>
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Total Export (USD)
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ${data.financials?.totalExportValueUsd?.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div
          title="Total value of exports in Ghana Cedi"
          aria-label="Total value of exports in Ghana Cedi"
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
              <span className="text-emerald-600 font-semibold">GHS</span>
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Total Export (GHS)
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.financials?.totalExportValueGhs?.toLocaleString()}
          </p>
        </div>

        <div
          title="Total quantity exported in kilograms"
          aria-label="Total quantity exported in kilograms"
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl">
              <span className="text-cyan-600 font-semibold">KG</span>
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Total Qty (kg)
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.financials?.totalQuantityKg?.toLocaleString()} kg
          </p>
        </div>

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
            {data.financials?.totalQuantityLbs?.toLocaleString()} lbs
          </p>
        </div>

        <div
          title="Sum of service fees (inclusive)"
          aria-label="Sum of service fees (inclusive)"
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
              <span className="text-rose-600 font-semibold">Fees</span>
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Service Fees (inc)
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.financials?.serviceFeesInclusive?.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
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
            {data.financials?.withholdingTax?.toLocaleString()}
          </p>
        </div>

        <div
          title="Total VAT collected"
          aria-label="Total VAT collected"
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
              <span className="text-amber-600 font-semibold">VAT</span>
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Total VAT
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.financials?.totalVat?.toLocaleString()}
          </p>
        </div>

        <div
          title="Total NHIL collected"
          aria-label="Total NHIL collected"
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-50 dark:bg-slate-900/20 rounded-xl">
              <span className="text-slate-600 font-semibold">NHIL</span>
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Total NHIL
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.financials?.totalNhil?.toLocaleString()}
          </p>
        </div>

        <div
          title="Total COVID levy collected"
          aria-label="Total COVID levy collected"
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-50 dark:bg-slate-900/20 rounded-xl">
              <span className="text-slate-600 font-semibold">COVID</span>
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              COVID Levy
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.financials?.totalCovidLevy?.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div
          title="Total amount collected for GETFund"
          aria-label="Total amount collected for GETFund"
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
              <span className="text-violet-600 font-semibold">GET</span>
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              GETFund
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.financials?.totalGetFund?.toLocaleString()}
          </p>
        </div>
      </div>
    </>
  );
}
