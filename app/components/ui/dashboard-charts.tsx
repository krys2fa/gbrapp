"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
  LineChart,
  Line,
  Legend,
  LabelList,
} from "recharts";

interface ChartData {
  jobCardsByStatus: Array<{ name: string; value: number }>;
  monthlyTrend: Array<{ month: string; count: number }>;
  topExporters: Array<{ name: string; code: string; jobCards: number }>;
}

interface DashboardChartsProps {
  data: ChartData;
}

const COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#F97316", // Orange
  "#06B6D4", // Cyan
  "#84CC16", // Lime
];

export const JobCardStatusChart: React.FC<{
  data: Array<{ name: string; value: number }>;
}> = ({ data }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Job Cards by Status
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name} ${((percent || 0) * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const MonthlyTrendChart: React.FC<{
  data: Array<{ month: string; count: number }>;
}> = ({ data }) => {
  // Format the month data for better display
  const formattedData = data.map((item) => ({
    ...item,
    monthDisplay: new Date(item.month + "-01").toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    }),
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Job Cards Trend (Last 6 Months)
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient id="colorJobCards" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="monthDisplay"
              tick={{ fontSize: 12 }}
              className="text-gray-600 dark:text-gray-400"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="text-gray-600 dark:text-gray-400"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#3B82F6"
              fillOpacity={1}
              fill="url(#colorJobCards)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const TopExportersChart: React.FC<{
  data: Array<{ name: string; code: string; jobCards: number }>;
}> = ({ data }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Top Exporters by Job Cards
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis
              dataKey="code"
              type="category"
              tick={{ fontSize: 12 }}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
              }}
              formatter={(value, name, props) => [
                `${value} job cards`,
                props.payload.name,
              ]}
            />
            <Bar dataKey="jobCards" fill="#10B981" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <JobCardStatusChart data={data.jobCardsByStatus} />
      <div className="lg:col-span-2 xl:col-span-2">
        <MonthlyTrendChart data={data.monthlyTrend} />
      </div>
      <div className="lg:col-span-2 xl:col-span-1">
        <TopExportersChart data={data.topExporters} />
      </div>
    </div>
  );
};

// New chart component for Exporter Monthly Invoice Amounts
export const ExporterInvoiceChart: React.FC<{
  data: Array<{
    month: string;
    [exporterName: string]: number | string;
  }>;
}> = ({ data }) => {

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Monthly Invoice Payments by Exporter
        </h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">No data available</p>
        </div>
      </div>
    );
  }

  // Extract exporter names from the data (excluding 'month' key)
  const exporterNames = Object.keys(data[0] || {}).filter(
    (key) => key !== "month"
  );

  // Find months with non-zero values
  const monthsWithData = data.filter((monthData) => {
    return exporterNames.some((exporter) => {
      const value = Number(monthData[exporter] || 0);
      return value > 0;
    });
  });


  // Generate colors for each exporter
  const exporterColors = exporterNames.reduce((colors, name, index) => {
    colors[name] = COLORS[index % COLORS.length];
    return colors;
  }, {} as Record<string, string>);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Monthly Invoice Payments by Exporter (Payment Date - GHS)
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        💡 <strong>Note:</strong> Small values may appear as thin bars. Hover over the chart or check the summary below for exact amounts.
      </p>

      {/* Summary of payments */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Payment Summary:
        </h4>
        {monthsWithData.length > 0 ? (
          monthsWithData.map((monthData, index) => (
            <div
              key={index}
              className="mb-2 p-3 bg-gray-50 dark:bg-gray-700 rounded"
            >
              <span className="font-semibold">{monthData.month}:</span>
              {exporterNames.map((exporter) => {
                const amount = Number(monthData[exporter] || 0);
                if (amount > 0) {
                  const isSmallValue = amount < 100000; // Less than 100K
                  return (
                    <div key={exporter} className={`ml-4 text-sm`}>
                      {exporter}:{" "}
                      <span className="font-mono">
                        GHS {amount.toLocaleString()}
                      </span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          ))
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            No payments recorded yet
          </p>
        )}
      </div>

      {/* Show the chart only if we have data */}
      {monthsWithData.length > 0 && (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                className="text-gray-600 dark:text-gray-400"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-gray-600 dark:text-gray-400"
                tickFormatter={(value) => {
                  if (value >= 1000000) {
                    return `GHS ${(value / 1000000).toFixed(1)}M`;
                  } else if (value >= 1000) {
                    return `GHS ${(value / 1000).toFixed(0)}K`;
                  }
                  return `GHS ${value}`;
                }}
                domain={['dataMin', 'dataMax']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
                formatter={(value: any, name: string) => {
                  const numValue = Number(value);
                  let formattedValue = `GHS ${numValue.toLocaleString()}`;
                  if (numValue >= 1000000) {
                    formattedValue += ` (${(numValue / 1000000).toFixed(2)}M)`;
                  } else if (numValue >= 1000) {
                    formattedValue += ` (${(numValue / 1000).toFixed(1)}K)`;
                  }
                  return [formattedValue, name];
                }}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Legend />
              {exporterNames.map((exporterName, index) => (
                <Bar
                  key={exporterName}
                  dataKey={exporterName}
                  fill={exporterColors[exporterName]}
                  name={exporterName}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {/* <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              className="text-gray-600 dark:text-gray-400"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="text-gray-600 dark:text-gray-400"
              tickFormatter={(value) => `₵${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
              }}
              formatter={(value: any, name: string) => [
                `₵${Number(value).toLocaleString()}`,
                name,
              ]}
              labelFormatter={(label) => `Month: ${label}`}
            />
            <Legend />
            {exporterNames.map((exporterName, index) => (
              <Bar
                key={exporterName}
                dataKey={exporterName}
                fill={exporterColors[exporterName]}
                name={exporterName}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div> */}
    </div>
  );
};
