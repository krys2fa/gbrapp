"use client";

import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/app/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
  icon: React.ReactNode;
  className?: string;
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
        {value}
      </p>
    </div>
  );
};

export const DashboardStats: React.FC = () => {
  const stats = [
    {
      title: "Total Users",
      value: "12,345",
      change: "+12.3%",
      changeType: "positive" as const,
      icon: <Users className="h-5 w-5 text-blue-600" />,
    },
    {
      title: "Revenue",
      value: "$45,678",
      change: "+8.2%",
      changeType: "positive" as const,
      icon: <DollarSign className="h-5 w-5 text-green-600" />,
    },
    {
      title: "Orders",
      value: "1,234",
      change: "-2.1%",
      changeType: "negative" as const,
      icon: <ShoppingCart className="h-5 w-5 text-purple-600" />,
    },
    {
      title: "Active Sessions",
      value: "567",
      change: "+5.4%",
      changeType: "positive" as const,
      icon: <Activity className="h-5 w-5 text-orange-600" />,
    },
  ];

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

export const RecentActivity: React.FC = () => {
  const activities = [
    {
      id: 1,
      user: "John Doe",
      action: "Created new project",
      time: "2 minutes ago",
      type: "create",
    },
    {
      id: 2,
      user: "Jane Smith",
      action: "Updated user profile",
      time: "5 minutes ago",
      type: "update",
    },
    {
      id: 3,
      user: "Mike Johnson",
      action: "Deleted old files",
      time: "10 minutes ago",
      type: "delete",
    },
    {
      id: 4,
      user: "Sarah Wilson",
      action: "Exported data report",
      time: "15 minutes ago",
      type: "export",
    },
  ];

  const getActivityColor = (type: string) => {
    switch (type) {
      case "create":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "update":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "delete":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "export":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Recent Activity
      </h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {activity.user.charAt(0)}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {activity.user}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
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
                {activity.type}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {activity.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
