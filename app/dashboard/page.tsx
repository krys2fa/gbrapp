"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/app/components/layout/header";
import {
  DashboardStats,
  RecentActivity,
} from "@/app/components/ui/dashboard-stats";
import { DashboardCharts } from "@/app/components/ui/dashboard-charts";
import { BarChart3, PieChart, Activity, Calendar, RefreshCw, Plus, Building, Users, Settings } from "lucide-react";
import { withClientAuth } from "@/app/lib/with-client-auth";
import { useAuth } from "@/app/context/auth-context";

interface DashboardData {
  overview: {
    totalJobCards: { value: number; change: string; changeType: "positive" | "negative" };
    totalExporters: { value: number; change: string; changeType: "positive" | "negative" };
    totalUsers: { value: number; change: string; changeType: "positive" | "negative" };
    totalRevenue: { value: number; change: string; changeType: "positive" | "negative" };
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
}

function DashboardPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
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
      <Header title="Dashboard" />

      <main className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-gray-900 via-yellow-600 to-gray-800 rounded-2xl p-6 text-white">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Welcome back, {user?.name || "User"}!
              </h2>
              <p className="text-yellow-100 text-lg">
                Here's what's happening today.
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
                <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
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
              <p className="text-red-700 dark:text-red-400 font-medium">Error loading dashboard data</p>
            </div>
            <p className="text-red-600 dark:text-red-300 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !dashboardData && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading dashboard data...</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {(dashboardData || !isLoading) && (
          <DashboardStats data={dashboardData?.overview} />
        )}

        {/* Additional Stats Cards */}
        {dashboardData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Job Cards</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardData.overview.activeJobCards}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Completed Job Cards</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardData.overview.completedJobCards}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                  <PieChart className="h-5 w-5 text-yellow-600" />
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Pending Job Cards</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardData.overview.pendingJobCards}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">This Week</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardData.overview.thisWeekJobCards}
              </p>
            </div>
          </div>
        )}

        {/* Charts Section */}
        {dashboardData && (
          <DashboardCharts data={dashboardData.charts} />
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Performance Overview - Placeholder for additional charts */}
          <div className="lg:col-span-2 xl:col-span-3 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  System Overview
                </h3>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Live data
                  </span>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4 gap-4">
                {[
                  { 
                    label: "New Job Card", 
                    icon: <Plus className="h-6 w-6" />, 
                    color: "bg-yellow-600", 
                    href: "/job-cards/new" 
                  },
                  { 
                    label: "View Exporters", 
                    icon: <Building className="h-6 w-6" />, 
                    color: "bg-gray-800", 
                    href: "/exporters" 
                  },
                  { 
                    label: "User Management", 
                    icon: <Users className="h-6 w-6" />, 
                    color: "bg-yellow-700", 
                    href: "/users" 
                  },
                  { 
                    label: "System Settings", 
                    icon: <Settings className="h-6 w-6" />, 
                    color: "bg-gray-900", 
                    href: "/settings" 
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
          </div>

          {/* Sidebar Content */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <RecentActivity data={dashboardData?.recentActivity} />

            {/* System Status */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                System Status
              </h3>
              <div className="space-y-3">
                {[
                  { service: "API Server", status: "online", color: "green" },
                  { service: "Database", status: "online", color: "green" },
                  { service: "Auth Service", status: dashboardData ? "online" : "warning", color: dashboardData ? "green" : "yellow" },
                  { service: "File Storage", status: "online", color: "green" },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {item.service}
                    </span>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          item.color === "green"
                            ? "bg-green-500"
                            : item.color === "yellow"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                      />
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 capitalize">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

// Protect this page - any authenticated user can access it
export default withClientAuth(DashboardPage);
