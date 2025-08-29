"use client";
import React, { useEffect, useState } from "react";
import { Header } from "../../components/layout/header";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

function capitalizeFirst(str: string) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export default function DailyExchangePage() {
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [exchangeId, setExchangeId] = useState("");
  const [exchangeRate, setExchangeRate] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [prices, setPrices] = useState<any[]>([]);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [filterItem, setFilterItem] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [editingPrice, setEditingPrice] = useState<any>(null);
  const [filterTrigger, setFilterTrigger] = useState(0);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingPrice, setViewingPrice] = useState<any>(null);

  useEffect(() => {
    async function load() {
      setPricesLoading(true);
      try {
        const exRes = await fetch("/api/exchange");
        const exData = await exRes.json();
        setExchanges(exData);
        setExchangeId(exData[0]?.id || "");

        // fetch exchange-type prices only
        let url = "/api/daily-prices?type=EXCHANGE";
        const params: string[] = [];
        if (filterItem) params.push(`itemId=${encodeURIComponent(filterItem)}`);
        if (filterDate) params.push(`date=${encodeURIComponent(filterDate)}`);
        if (params.length) url += `&${params.join("&")}`;
        const res = await fetch(url);
        const data = await res.json();
        setPrices(data || []);
      } catch {
        setPrices([]);
      } finally {
        setPricesLoading(false);
      }
    }
    load();
  }, [success, filterTrigger]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        type: "EXCHANGE",
        itemId: exchangeId,
        price: parseFloat(exchangeRate),
      };
      let url = "/api/daily-prices";
      let method = "POST";
      if (editingPrice && editingPrice.type === "EXCHANGE") {
        url += `/${editingPrice.id}`;
        method = "PUT";
      }
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save rate");
      setSuccess(editingPrice ? "Rate updated!" : "Rate added!");
      setExchangeId(exchanges[0]?.id || "");
      setExchangeRate("");
      setEditingPrice(null);
    } catch (err: any) {
      setError(err.message || "Error saving rate");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (p: any) => {
    setEditingPrice(p);
    setExchangeId(p.exchange?.id || "");
    setExchangeRate(String(p.price));
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this rate entry?")) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/daily-prices/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete rate");
      setSuccess("Rate deleted!");
    } catch (err: any) {
      setError(err.message || "Error deleting rate");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (priceObj: any) => {
    setViewingPrice(priceObj);
    setViewModalOpen(true);
  };
  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewingPrice(null);
  };

  return (
    <>
      <Header title="Daily Exchange Rates" />
      <div className="my-6 px-4" style={{ width: "100%" }}>
        <div
          className="flex"
          style={{ justifyContent: "flex-start", width: "100%" }}
        >
          <Link
            href="/setup"
            className="inline-flex items-center text-gray-600 hover:text-blue-600"
            style={{ marginLeft: "0.5rem" }}
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Settings
          </Link>
        </div>
      </div>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-8">
          <form
            onSubmit={handleSubmit}
            className="bg-white shadow sm:rounded-md sm:overflow-hidden p-6"
          >
            <h2 className="text-lg font-semibold mb-4">Add Exchange Rate</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Exchange
                </label>
                <div className="relative">
                  <select
                    value={exchangeId}
                    onChange={(e) => setExchangeId(e.target.value)}
                    className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 pr-10"
                  >
                    {exchanges.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {capitalizeFirst(opt.name)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Rate
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-md shadow hover:bg-blue-700 transition"
                disabled={loading}
              >
                {editingPrice ? "Update Rate" : "Add Rate"}
              </button>
            </div>
            {error && <div className="text-red-600 mt-2">{error}</div>}
            {success && <div className="text-green-600 mt-2">{success}</div>}
          </form>

          {/* Right-side: recent rates (last 3) */}
          <div className="bg-white shadow sm:rounded-md sm:overflow-hidden p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Rates</h2>
            {prices.length === 0 ? (
              <p className="text-sm text-gray-500">No recent rates.</p>
            ) : (
              <ul className="space-y-3">
                {prices
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                  )
                  .slice(0, 3)
                  .map((r: any) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {r.exchange?.name}{" "}
                          <span className="text-xs text-gray-500">
                            ({r.exchange?.symbol})
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {r.createdAt
                            ? `${new Date(
                                r.createdAt
                              ).toLocaleDateString()} ${new Date(
                                r.createdAt
                              ).toLocaleTimeString()}`
                            : "-"}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {r.price}
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-10">
          <h3 className="text-lg font-semibold mb-4">Exchange Rates</h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-48">
              <select
                value={filterItem}
                onChange={(e) => {
                  setFilterItem(e.target.value);
                  setPage(1);
                }}
                className="block w-full appearance-none rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
              >
                <option value="">All Exchanges</option>
                {exchanges.map((e) => (
                  <option key={e.id} value={e.id}>
                    {capitalizeFirst(e.name)}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </span>
            </div>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setPage(1);
              }}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 w-32"
              style={{ minWidth: "auto", maxWidth: "8rem" }}
            />
            <button
              className="bg-blue-500 text-white px-4 py-1 rounded flex items-center gap-2"
              onClick={() => setFilterTrigger(filterTrigger + 1)}
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
              Search
            </button>
          </div>

          {pricesLoading ? (
            <div className="flex justify-center items-center py-10">
              <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin" />
              <span className="ml-2 text-gray-500">Loading rates...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Symbol
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Rate
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Time
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {prices
                      .slice((page - 1) * pageSize, page * pageSize)
                      .map((p: any) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-900">
                            {p.exchange?.name}
                          </td>
                          <td className="px-4 py-2 text-gray-700">
                            {p.exchange?.symbol}
                          </td>
                          <td className="px-4 py-2 text-gray-700">{p.price}</td>
                          <td className="px-4 py-2 text-gray-700">
                            {p.createdAt
                              ? new Date(p.createdAt).toLocaleDateString()
                              : "-"}
                          </td>
                          <td className="px-4 py-2 text-gray-700">
                            {p.createdAt
                              ? new Date(p.createdAt).toLocaleTimeString()
                              : "-"}
                          </td>
                          <td className="px-4 py-2 flex gap-2">
                            <button
                              className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs flex items-center"
                              onClick={() => handleView(p)}
                            >
                              <MagnifyingGlassIcon className="h-4 w-4 mr-1" />{" "}
                              View
                            </button>
                            <button
                              className="px-2 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-xs flex items-center"
                              onClick={() => handleEdit(p)}
                            >
                              <PencilSquareIcon className="h-4 w-4 mr-1" /> Edit
                            </button>
                            <button
                              className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs flex items-center"
                              onClick={() => handleDelete(p.id)}
                            >
                              <TrashIcon className="h-4 w-4 mr-1" /> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">
                        {(page - 1) * pageSize + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(page * pageSize, prices.length)}
                      </span>{" "}
                      of <span className="font-medium">{prices.length}</span>{" "}
                      results
                    </p>
                  </div>
                  <div>
                    <nav
                      className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                      aria-label="Pagination"
                    >
                      <button
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                          page === 1
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        Previous
                      </button>
                      {Array.from(
                        {
                          length: Math.max(
                            1,
                            Math.ceil(prices.length / pageSize)
                          ),
                        },
                        (_, i) => i + 1
                      ).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`relative inline-flex items-center px-4 py-2 border ${
                            page === p
                              ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          } text-sm font-medium`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        onClick={() =>
                          setPage((prev) =>
                            Math.min(
                              prev + 1,
                              Math.max(1, Math.ceil(prices.length / pageSize))
                            )
                          )
                        }
                        disabled={
                          page ===
                          Math.max(1, Math.ceil(prices.length / pageSize))
                        }
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                          page ===
                          Math.max(1, Math.ceil(prices.length / pageSize))
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div> */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">
                        {(page - 1) * pageSize + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(page * pageSize, prices.length)}
                      </span>{" "}
                      of <span className="font-medium">{prices.length}</span>{" "}
                      results
                    </p>
                  </div>
                  <div>
                    <nav
                      className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                      aria-label="Pagination"
                    >
                      <button
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                          page === 1
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        Previous
                      </button>
                      {Array.from(
                        {
                          length: Math.max(
                            1,
                            Math.ceil(prices.length / pageSize)
                          ),
                        },
                        (_, i) => i + 1
                      ).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`relative inline-flex items-center px-4 py-2 border ${
                            page === p
                              ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          } text-sm font-medium`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        onClick={() =>
                          setPage((prev) =>
                            Math.min(
                              prev + 1,
                              Math.max(1, Math.ceil(prices.length / pageSize))
                            )
                          )
                        }
                        disabled={
                          page ===
                          Math.max(1, Math.ceil(prices.length / pageSize))
                        }
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                          page ===
                          Math.max(1, Math.ceil(prices.length / pageSize))
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {viewModalOpen && viewingPrice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
              <button
                className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-red-400"
                onClick={closeViewModal}
                aria-label="Close"
              >
                <span className="text-xl">&times;</span>
              </button>
              <h2 className="text-lg font-bold mb-4">Rate Details</h2>
              <div className="space-y-2">
                <div>
                  <span className="font-semibold">Exchange:</span>{" "}
                  {viewingPrice.exchange?.name}
                </div>
                <div>
                  <span className="font-semibold">Rate:</span>{" "}
                  {viewingPrice.price}
                </div>
                <div>
                  <span className="font-semibold">Date:</span>{" "}
                  {viewingPrice.createdAt
                    ? new Date(viewingPrice.createdAt).toLocaleDateString()
                    : "-"}
                </div>
                <div>
                  <span className="font-semibold">Time:</span>{" "}
                  {viewingPrice.createdAt
                    ? new Date(viewingPrice.createdAt).toLocaleTimeString()
                    : "-"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
