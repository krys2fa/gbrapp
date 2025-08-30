"use client";

import React, { useEffect, useState } from "react";

type Row = {
  id: string;
  jobCardId?: string;
  exporter: string;
  createdAt: string;
  netGoldGrams: number;
  netSilverGrams: number;
  estimatedValue: number;
  feesTotal?: number;
};

export default function CustomReportClient() {
  const [exporters, setExporters] = useState<Array<{ id: string; name: string }>>([]);
  const [filters, setFilters] = useState<any>({ exporterId: "", startDate: "", endDate: "", minNetGold: "", maxNetGold: "", includeFees: false });
  // Expanded column list. Some of these (marked with *) require additional backend fields/aggregation
  const availableColumns = [
    { key: "createdAt", label: "Date" },
    { key: "referenceNumber", label: "JobCard Ref" },
    { key: "receivedDate", label: "Received Date" },
    { key: "shipmentType", label: "Shipment Type" },
    { key: "destinationCountry", label: "Destination Country" },
    { key: "status", label: "Status" },

    { key: "exporter", label: "Exporter" },
    { key: "exporterCode", label: "Exporter Code" },
    { key: "exporterPhone", label: "Exporter Phone" },
    { key: "exporterEmail", label: "Exporter Email" },

    { key: "jobCardId", label: "JobCard ID" },
    { key: "totalGrossWeight", label: "Gross Weight (g)" },
    { key: "netGoldGrams", label: "Net Gold (g)" },
    { key: "netSilverGrams", label: "Net Silver (g)" },
    { key: "totalNetWeightOz", label: "Net Weight (oz)" },
    { key: "goldOunces", label: "Gold (oz)" },
    { key: "valuePerGram", label: "Value per g (USD)" },
    { key: "pieceCount", label: "Pieces" },
    { key: "avgFineness", label: "Avg Fineness (%)" },

    { key: "certificateNumber", label: "Assay Certificate #" },
    { key: "assayDate", label: "Assay Date" },
    { key: "assayOfficer", label: "Assay Officer" },

    { key: "exporterPricePerOz", label: "Exporter $/oz" },
    { key: "exporterValueUsd", label: "Exporter Declared Value (USD)" },
    { key: "dailyCommodityPrice", label: "Daily Commodity Price" },

    // Finance / fees (some require aggregation or includeFees=true)
    { key: "feesTotal", label: "Fees Total" },
    { key: "whtTotal", label: "WHT Total*" },

    // Seals / logistics (requires additional relations)
    { key: "sealCount", label: "Seal Count*" },
    { key: "graDeclarationNumber", label: "GRA Declaration #" },

    // Admin
    { key: "teamLeader", label: "Team Leader" },
    { key: "technicalDirector", label: "Technical Director" },
    { key: "daysSinceReceived", label: "Age (days)" },
  ];
  const [selectedColumns, setSelectedColumns] = useState<string[]>(["createdAt", "referenceNumber", "exporter", "netGoldGrams", "goldOunces", "estimatedValue", "feesTotal"]);
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/exporters")
      .then((r) => r.json())
      .then((data) => setExporters(data.exporters || []))
      .catch(() => setExporters([]));
  }, []);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, selectedColumns]);

  function buildQuery(params: any) {
    const q = new URLSearchParams();
    q.set("page", String(params.page || page));
    q.set("limit", String(params.limit || limit));
  if (params.columns && Array.isArray(params.columns)) q.set("columns", params.columns.join(","));
    if (params.exporterId) q.set("exporterId", params.exporterId);
    if (params.startDate) q.set("startDate", params.startDate);
    if (params.endDate) q.set("endDate", params.endDate);
    if (params.minNetGold) q.set("minNetGold", String(params.minNetGold));
    if (params.maxNetGold) q.set("maxNetGold", String(params.maxNetGold));
  if (params.includeFees) q.set("includeFees", "1");
    return q.toString();
  }

  function fetchData(overrides: any = {}) {
    setLoading(true);
  const params = { ...filters, page, limit, columns: selectedColumns, ...overrides };
    const q = buildQuery(params);
    fetch(`/api/reports/custom?${q}`)
      .then((r) => r.json())
      .then((data) => {
        setRows(data.rows || []);
        setTotal(data.total || 0);
      })
      .catch(() => {
        setRows([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchData({ page: 1 });
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 mt-6">
      <h3 className="text-lg font-semibold mb-4">Custom Reports</h3>

      <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <select value={filters.exporterId} onChange={(e) => setFilters({ ...filters, exporterId: e.target.value })} className="p-2 border rounded">
          <option value="">All Exporters</option>
          {exporters.map((ex) => (
            <option key={ex.id} value={ex.id}>{ex.name}</option>
          ))}
        </select>

        <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className="p-2 border rounded" />
        <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className="p-2 border rounded" />

        <input placeholder="Min net gold (g)" value={filters.minNetGold} onChange={(e) => setFilters({ ...filters, minNetGold: e.target.value })} className="p-2 border rounded" />
        <input placeholder="Max net gold (g)" value={filters.maxNetGold} onChange={(e) => setFilters({ ...filters, maxNetGold: e.target.value })} className="p-2 border rounded" />
        <label className="inline-flex items-center gap-2">
          <input className="w-4 h-4" type="checkbox" checked={filters.includeFees} onChange={(e) => setFilters({ ...filters, includeFees: e.target.checked })} /> <span className="ml-1">Include Fees</span>
        </label>

        <div className="sm:col-span-3 flex gap-2">
          <button type="submit" className="px-3 py-2 bg-indigo-600 text-white rounded">Apply</button>
          <button type="button" className="px-3 py-2 border rounded" onClick={() => { setFilters({ exporterId: "", startDate: "", endDate: "", minNetGold: "", maxNetGold: "", includeFees: false }); setPage(1); fetchData({ page: 1, exporterId: "", startDate: "", endDate: "", minNetGold: "", maxNetGold: "", includeFees: false }); }}>Reset</button>
          <a className="px-3 py-2 bg-green-600 text-white rounded" href={`/api/reports/custom?${buildQuery({ ...filters, page: 1, limit, includeFees: (filters.includeFees || selectedColumns.includes("feesTotal")), columns: selectedColumns })}&download=csv`}>Download CSV</a>
        </div>
      </form>

      {/* Columns selector */}
      <div className="mb-4">
        <div className="text-sm font-medium mb-2">Columns</div>
        <div className="flex flex-wrap gap-2">
          {availableColumns.map((col) => (
            <label key={col.key} className="inline-flex items-center gap-2 p-1 border rounded text-sm">
              <input
                className="w-4 h-4"
                type="checkbox"
                checked={selectedColumns.includes(col.key)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setSelectedColumns((prev) => {
                    if (checked) return [...prev, col.key];
                    return prev.filter((p) => p !== col.key);
                  });
                  // if user selects feesTotal ensure includeFees is set so server returns fees
                  if (col.key === "feesTotal" && checked) setFilters((f: any) => ({ ...f, includeFees: true }));
                }}
              />
              {col.label}
            </label>
          ))}
        </div>
      </div>

      <div className="mb-3 text-sm text-gray-600">{loading ? 'Loading...' : `Showing ${rows.length} of ${total} results`}</div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {selectedColumns.map((col) => (
                <th key={col} className={`px-4 py-2 text-left ${col.includes('Net') || col.includes('net') || col === 'estimatedValue' || col === 'feesTotal' ? 'text-right' : 'text-left'}`}>
                  {availableColumns.find((c) => c.key === col)?.label || col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((r) => (
              <tr key={r.id}>
                {selectedColumns.map((col) => {
                  const value = (() => {
                    switch (col) {
                      case 'createdAt':
                        return r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '';
                      case 'exporter':
                        return r.exporter || '-';
                      case 'jobCardId':
                        return r.jobCardId || '';
                      case 'netGoldGrams':
                        return typeof r.netGoldGrams === 'number' ? r.netGoldGrams.toFixed(2) : '';
                      case 'netSilverGrams':
                        return typeof r.netSilverGrams === 'number' ? r.netSilverGrams.toFixed(2) : '';
                      case 'estimatedValue':
                        return typeof r.estimatedValue === 'number' ? r.estimatedValue.toFixed(2) : '';
                      case 'feesTotal':
                        return typeof r.feesTotal === 'number' ? r.feesTotal.toFixed(2) : '-';
                      default:
                        return (r as any)[col] ?? '';
                    }
                  })();
                  return (
                    <td key={col} className={`px-4 py-2 text-sm ${col === 'exporter' ? 'font-medium text-indigo-600' : ''} ${col === 'netGoldGrams' || col === 'netSilverGrams' || col === 'estimatedValue' || col === 'feesTotal' ? 'text-right' : ''}`}>
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="px-2 py-1 border rounded" disabled={page <= 1} onClick={() => { setPage((p) => Math.max(1, p - 1)); fetchData({ page: Math.max(1, page - 1) }); }}>Prev</button>
          <span className="text-sm">Page {page} / {total ? Math.ceil(total / limit) : 1}</span>
          <button className="px-2 py-1 border rounded" disabled={page >= Math.ceil(total / limit)} onClick={() => { setPage((p) => p + 1); fetchData({ page: page + 1 }); }}>Next</button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm">Per page</label>
          <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); fetchData({ page: 1, limit: Number(e.target.value) }); }} className="p-1 border rounded">
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Simple bar chart for net gold by exporter */}
      <div className="mt-6">
        <h4 className="text-sm font-medium mb-2">Net Gold by Exporter (current page)</h4>
        <div className="flex items-end gap-2 h-40">
          {(() => {
            const groups = new Map<string, number>();
            for (const r of rows) groups.set(r.exporter, (groups.get(r.exporter) || 0) + r.netGoldGrams);
            const entries = Array.from(groups.entries());
            const max = Math.max(1, ...entries.map((e) => e[1]));
            return entries.map(([k, v]) => (
              <div key={k} className="flex flex-col items-center" style={{ width: 48 }}>
                <div style={{ height: `${(v / max) * 100}%`, width: 24 }} className="bg-amber-400 w-6 rounded-t"></div>
                <div className="text-xs mt-1 text-center truncate w-12">{k}</div>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}
