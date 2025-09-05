"use client";

import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Briefcase,
  Building,
} from "lucide-react";
import { cn } from "@/app/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  changeType: "positive" | "negative";
  icon: React.ReactNode;
  className?: string;
}

interface DashboardStatsProps {
  data?: {
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
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon,
  className,
}) => {
  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200",
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
            {icon}
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {title}
          </h3>
        </div>
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            changeType === "positive"
              ? "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20"
              : "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20"
          )}
        >
          {changeType === "positive" ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {change}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {typeof value === "number" && value > 999
          ? value.toLocaleString()
          : value}
      </p>
    </div>
  );
};

export const DashboardStats: React.FC<DashboardStatsProps> = ({ data }) => {
  // Default fallback stats
  const defaultStats = [
    {
      title: "Total Job Cards",
      value: "0",
      change: "+0.0%",
      changeType: "positive" as const,
      icon: <Briefcase className="h-5 w-5 text-blue-600" />,
    },
    {
      title: "Total Exporters",
      value: "0",
      change: "+0.0%",
      changeType: "positive" as const,
      icon: <Building className="h-5 w-5 text-green-600" />,
    },
    {
      title: "Total Users",
      value: "0",
      change: "+0.0%",
      changeType: "positive" as const,
      icon: <Users className="h-5 w-5 text-purple-600" />,
    },
    {
      title: "Total Revenue",
      value: "$0",
      change: "+0.0%",
      changeType: "positive" as const,
      icon: <DollarSign className="h-5 w-5 text-orange-600" />,
    },
  ];

  const stats = data
    ? [
        {
          title: "Total Revenue",
          value: `GHS ${data.totalRevenue.value.toLocaleString()}`,
          change: `${data.totalRevenue.changeType === "positive" ? "+" : ""}${
            data.totalRevenue.change
          }%`,
          changeType: data.totalRevenue.changeType,
          icon: <DollarSign className="h-5 w-5 text-orange-600" />,
        },

        {
          title: "Total Exporters",
          value: data.totalExporters.value,
          change: `${data.totalExporters.changeType === "positive" ? "+" : ""}${
            data.totalExporters.change
          }%`,
          changeType: data.totalExporters.changeType,
          icon: <Building className="h-5 w-5 text-green-600" />,
        },
        {
          title: "Total Job Cards",
          value: data.totalJobCards.value,
          change: `${data.totalJobCards.changeType === "positive" ? "+" : ""}${
            data.totalJobCards.change
          }%`,
          changeType: data.totalJobCards.changeType,
          icon: <Briefcase className="h-5 w-5 text-blue-600" />,
        },
        {
          title: "Total Users",
          value: data.totalUsers.value,
          change: `${data.totalUsers.changeType === "positive" ? "+" : ""}${
            data.totalUsers.change
          }%`,
          changeType: data.totalUsers.changeType,
          icon: <Users className="h-5 w-5 text-purple-600" />,
        },
      ]
    : defaultStats;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          change={stat.change}
          changeType={stat.changeType}
          icon={stat.icon}
        />
      ))}
    </div>
  );
};

interface RecentActivityProps {
  data?: Array<{
    id: string;
    user: string;
    action: string;
    time: Date | string;
    type: string;
  }>;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ data }) => {
  const defaultActivities = [
    {
      id: "1",
      user: "System",
      action: "No recent activity",
      time: new Date(),
      type: "info",
    },
  ];

  const activities = data && data.length > 0 ? data : defaultActivities;

  const getActivityColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "create":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "update":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "delete":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "view":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      case "approve":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "reject":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const formatTime = (time: Date | string) => {
    const date = new Date(time);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Recent Activity
      </h3>
      <div className="space-y-4">
        {activities.slice(0, 8).map((activity) => (
          <div key={activity.id} className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {activity.user.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {activity.user}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {activity.action}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span
                className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full",
                  getActivityColor(activity.type)
                )}
              >
                {activity.type.toLowerCase()}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatTime(activity.time)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
