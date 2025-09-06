"use client";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Header } from "../../components/layout/header";
import { ChevronDown, Calendar } from "lucide-react";
import BackLink from "@/app/components/ui/BackLink";
import { formatExchangeRate } from "@/app/lib/utils";
import {
  getWeekStart,
  formatWeekDisplay,
  getCurrentWeekStart,
} from "@/app/lib/week-utils";
import {
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

function capitalizeFirst(str: string) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export default function WeeklyExchangePage() {
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [exchangeId, setExchangeId] = useState("");
  const [exchangeRate, setExchangeRate] = useState("");
  const [weekStartDate, setWeekStartDate] = useState("");
  const [loading, setLoading] = useState(false);

  const [prices, setPrices] = useState<any[]>([]);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [filterItem, setFilterItem] = useState("");
  const [filterWeek, setFilterWeek] = useState("");
  const [editingPrice, setEditingPrice] = useState<any>(null);
  const [filterTrigger, setFilterTrigger] = useState(0);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingPrice, setViewingPrice] = useState<any>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingPrice, setDeletingPrice] = useState<any>(null);

  // Set default week to current week on component mount
  useEffect(() => {
    const currentWeekStart = getCurrentWeekStart();
    setWeekStartDate(currentWeekStart.toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    async function load() {
      setPricesLoading(true);
      try {
        const exRes = await fetch("/api/exchange");
        const exData = await exRes.json();
        setExchanges(exData);
        setExchangeId(exData[0]?.id || "");

        // fetch exchange-type weekly prices only
        let url = "/api/weekly-prices?type=EXCHANGE";
        if (filterItem) url += `&itemId=${filterItem}`;
        if (filterWeek) url += `&week=${filterWeek}`;

        const prRes = await fetch(url);
        const prData = await prRes.json();
        setPrices(prData);
      } catch (err) {
        console.error("Error loading data:", err);
        toast.error("Failed to load data");
      } finally {
        setPricesLoading(false);
      }
    }
    load();
  }, [filterTrigger]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        type: "EXCHANGE",
        itemId: exchangeId,
        price: parseFloat(exchangeRate),
        weekStartDate: weekStartDate
          ? new Date(weekStartDate).toISOString()
          : undefined,
      };
      let url = "/api/weekly-prices";
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
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save rate");
      }
      toast.success(
        editingPrice
          ? `Rate for ${
              exchanges.find((e) => e.id === exchangeId)?.name || "exchange"
            } updated successfully!`
          : `Rate for ${
              exchanges.find((e) => e.id === exchangeId)?.name || "exchange"
            } added successfully!`
      );
      setExchangeId(exchanges[0]?.id || "");
      setExchangeRate("");
      setEditingPrice(null);
      // Reset week to current week
      const currentWeekStart = getCurrentWeekStart();
      setWeekStartDate(currentWeekStart.toISOString().split("T")[0]);
      // Trigger reload
      setFilterTrigger((prev: number) => prev + 1);
    } catch (err: any) {
      toast.error(err.message || "Error saving rate");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (p: any) => {
    setEditingPrice(p);
    setExchangeId(p.exchange?.id || "");
    setExchangeRate(String(p.price));
    setWeekStartDate(new Date(p.weekStartDate).toISOString().split("T")[0]);
    toast("Editing rate - make your changes and save", { icon: "✏️" });
  };

  const handleDeleteClick = (p: any) => {
    setDeletingPrice(p);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPrice) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/weekly-prices/${deletingPrice.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete rate");
      toast.success(
        `Rate for ${
          deletingPrice.exchange?.name || "exchange"
        } deleted successfully!`
      );
      setDeleteModalOpen(false);
      setDeletingPrice(null);
      // Trigger reload
      setFilterTrigger((prev: number) => prev + 1);
    } catch (err: any) {
      toast.error(err.message || "Error deleting rate");
      setDeleteModalOpen(false);
      setDeletingPrice(null);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (priceObj: any) => {
    setViewingPrice(priceObj);
    setViewModalOpen(true);
    toast("Viewing rate details", { icon: "👁️" });
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewingPrice(null);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeletingPrice(null);
  };

  return (
    <>
      <Header
        title="Weekly Exchange Rates"
        icon={<Calendar className="h-5 w-5" />}
        subtitle="Add and view weekly exchange rates."
      />
      <div className="my-6 px-4" style={{ width: "100%" }}>
        <BackLink href="/setup" label="Back to Settings" />
      </div>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-8">
          <form
            onSubmit={handleSubmit}
            className="bg-white shadow sm:rounded-md sm:overflow-hidden p-6"
          >
            <h2 className="text-lg font-semibold mb-4">
              {editingPrice ? "Edit Weekly Rate" : "Add Weekly Rate"}
            </h2>
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
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Week Starting (Monday)
                </label>
                <input
                  type="date"
                  value={weekStartDate}
                  onChange={(e) => {
                    const selectedDate = new Date(e.target.value);
                    const weekStart = getWeekStart(selectedDate);
                    setWeekStartDate(weekStart.toISOString().split("T")[0]);
                  }}
                  className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {weekStartDate && (
                  <p className="mt-1 text-sm text-gray-500">
                    Week: {formatWeekDisplay(new Date(weekStartDate))}
                  </p>
                )}
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
                          {formatWeekDisplay(new Date(r.weekStartDate))}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {formatExchangeRate(r.price)}
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-10">
          <h3 className="text-lg font-semibold mb-4">Weekly Exchange Rates</h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-48">
              <select
                value={filterItem}
                onChange={(e) => {
                  setFilterItem(e.target.value);
                  setFilterTrigger((prev: number) => prev + 1);
                  if (e.target.value) {
                    toast("Filter applied", { icon: "🔍" });
                  }
                }}
                className="block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 pr-10"
              >
                <option value="">All Exchanges</option>
                {exchanges.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {capitalizeFirst(ex.name)}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative w-48">
              <input
                type="date"
                value={filterWeek}
                onChange={(e) => {
                  if (e.target.value) {
                    const selectedDate = new Date(e.target.value);
                    const weekStart = getWeekStart(selectedDate);
                    setFilterWeek(weekStart.toISOString().split("T")[0]);
                    setFilterTrigger((prev: number) => prev + 1);
                    toast("Week filter applied", { icon: "📅" });
                  } else {
                    setFilterWeek("");
                    setFilterTrigger((prev: number) => prev + 1);
                  }
                }}
                placeholder="Filter by week"
                className="block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => {
                setFilterItem("");
                setFilterWeek("");
                setFilterTrigger((prev: number) => prev + 1);
                toast("Filters cleared", { icon: "🧹" });
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Clear Filters
            </button>
          </div>

          {pricesLoading ? (
            <div className="text-center py-8">
              <ArrowPathIcon className="mx-auto h-8 w-8 animate-spin text-blue-600" />
              <p className="mt-2 text-sm text-gray-500">Loading rates...</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-collapse border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                        Exchange
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                        Week Period
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                        Rate
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                        Created
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {prices
                      .slice((page - 1) * pageSize, page * pageSize)
                      .map((rate: any) => (
                        <tr key={rate.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-900 border border-gray-200">
                            {rate.exchange?.name}{" "}
                            <span className="text-gray-500">
                              ({rate.exchange?.symbol})
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-700 border border-gray-200">
                            {formatWeekDisplay(new Date(rate.weekStartDate))}
                          </td>
                          <td className="px-4 py-2 text-gray-900 font-semibold border border-gray-200">
                            {formatExchangeRate(rate.price)}
                          </td>
                          <td className="px-4 py-2 text-gray-700 border border-gray-200">
                            {new Date(rate.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 flex gap-2 border border-gray-200">
                            <button
                              className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs flex items-center"
                              onClick={() => handleView(rate)}
                            >
                              <EyeIcon className="h-4 w-4 mr-1" /> View
                            </button>
                            <button
                              className="px-2 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-xs flex items-center"
                              onClick={() => handleEdit(rate)}
                            >
                              <PencilSquareIcon className="h-4 w-4 mr-1" /> Edit
                            </button>
                            <button
                              className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs flex items-center"
                              onClick={() => handleDeleteClick(rate)}
                            >
                              <TrashIcon className="h-4 w-4 mr-1" /> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {prices.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">
                    No weekly rates found.
                  </p>
                </div>
              )}
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
                              Math.ceil(prices.length / pageSize),
                              prev + 1
                            )
                          )
                        }
                        disabled={page >= Math.ceil(prices.length / pageSize)}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                          page >= Math.ceil(prices.length / pageSize)
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
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewModalOpen && viewingPrice && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Rate Details
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Exchange
                </label>
                <p className="text-sm text-gray-900">
                  {viewingPrice.exchange?.name} ({viewingPrice.exchange?.symbol}
                  )
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Rate
                </label>
                <p className="text-sm text-gray-900">
                  {formatExchangeRate(viewingPrice.price)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Week Period
                </label>
                <p className="text-sm text-gray-900">
                  {formatWeekDisplay(new Date(viewingPrice.weekStartDate))}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Created
                </label>
                <p className="text-sm text-gray-900">
                  {new Date(viewingPrice.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeViewModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && deletingPrice && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete Rate
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete the rate for{" "}
              <strong>{deletingPrice.exchange?.name}</strong> for the week of{" "}
              <strong>
                {formatWeekDisplay(new Date(deletingPrice.weekStartDate))}
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
