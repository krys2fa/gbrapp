"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type CountryRow = {
  countryCode: string;
  countryName?: string;
  largeCount: number;
  smallCount: number;
  total: number;
};

export default function DestinationCountriesChart() {
  const [data, setData] = useState<CountryRow[]>([]);
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [top, setTop] = useState<number>(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        if (top) params.set("top", String(top));

        const res = await fetch(
          `/api/analytics/destinations?${params.toString()}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "unknown error");
        if (mounted) setData(json.countries || []);
      } catch (err: any) {
        if (mounted) setError(String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();
    return () => {
      mounted = false;
    };
  }, [from, to, top]);

  return (
    <div className="bg-white rounded shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium">
          Destination countries by job-card scale
        </h3>
        <div className="flex gap-2 items-center">
          <label className="text-sm">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border rounded p-1"
          />
          <label className="text-sm">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border rounded p-1"
          />
          <label className="text-sm">Top</label>
          <input
            type="number"
            min={1}
            max={100}
            value={top}
            onChange={(e) => setTop(Number(e.target.value) || 20)}
            className="w-16 border rounded p-1"
          />
        </div>
      </div>

      {loading && (
        <div className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading destination data...
          </p>
        </div>
      )}
      {error && <div className="py-4 text-red-600">Error: {error}</div>}

      {!loading && !error && (
        <div style={{ width: "100%", height: 420 }}>
          <ResponsiveContainer>
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
              barCategoryGap="30%"
              barGap={6}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="countryCode"
                angle={-45}
                textAnchor="end"
                interval={0}
                height={80}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="largeCount"
                name="Large-scale"
                fill="#1f78b4"
                barSize={10}
              />
              <Bar
                dataKey="smallCount"
                name="Small-scale"
                fill="#33a02c"
                barSize={10}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-3 text-sm text-gray-600">
        Showing top {data.length} countries. Click a bar to drill down.
      </div>
    </div>
  );
}
