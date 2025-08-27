"use client";

import React from "react";
import { Header } from "@/app/components/layout/header";
import {
  DashboardStats,
  RecentActivity,
} from "@/app/components/ui/dashboard-stats";
import { BarChart3, PieChart, Activity, Calendar } from "lucide-react";
import { withClientAuth } from "@/app/lib/with-client-auth";
import { useAuth } from "@/app/context/auth-context";

function DashboardPage() {
  const { user } = useAuth();

  return (
    <>
      <Header title="Dashboard" />

      <main className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Welcome back, {user?.name || "User"}!
              </h2>
              <p className="text-blue-100 text-lg">
                Here's what's happening with your management system today.
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <Calendar className="h-5 w-5" />
              <span className="font-medium">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <DashboardStats />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-2 xl:col-span-3 space-y-6">
            {/* Performance Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Performance Overview
                </h3>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Last 30 days
                  </span>
                </div>
              </div>
              <div className="h-64 xl:h-80 bg-gradient-to-t from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Chart visualization will be here
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Integration with chart library needed
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4 gap-4">
                {[
                  { label: "Create User", icon: "👤", color: "bg-blue-500" },
                  {
                    label: "Generate Report",
                    icon: "📊",
                    color: "bg-green-500",
                  },
                  { label: "Send Email", icon: "✉️", color: "bg-purple-500" },
                  {
                    label: "View Analytics",
                    icon: "📈",
                    color: "bg-orange-500",
                  },
                ].map((action, index) => (
                  <button
                    key={index}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div
                      className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center text-white text-xl`}
                    >
                      {action.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <RecentActivity />

            {/* System Status */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                System Status
              </h3>
              <div className="space-y-3">
                {[
                  { service: "API Server", status: "online", color: "green" },
                  { service: "Database", status: "online", color: "green" },
                  { service: "Cache", status: "warning", color: "yellow" },
                  { service: "Storage", status: "online", color: "green" },
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
