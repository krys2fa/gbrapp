"use client";
import React, { useEffect, useState } from "react";
import { Header } from "../../components/layout/header";
import { Gem } from "lucide-react";
import {
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import BackLink from "@/app/components/ui/BackLink";
import { toast } from "react-hot-toast";

function capitalizeFirst(str: string) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export default function CommoditiesPage() {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [loading, setLoading] = useState(false);
  const [commodities, setCommodities] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  // Filters / pagination / UI state similar to users page
  const [nameFilter, setNameFilter] = useState("");
  const [symbolFilter, setSymbolFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [editingCommodity, setEditingCommodity] = useState<any>(null);
  const [viewingCommodity, setViewingCommodity] = useState<any>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [filterTrigger, setFilterTrigger] = useState(0);

  useEffect(() => {
    async function load() {
      setFetching(true);
      try {
        let url = "/api/commodity";
        const params: string[] = [];
        if (nameFilter) params.push(`name=${encodeURIComponent(nameFilter)}`);
        if (symbolFilter)
          params.push(`symbol=${encodeURIComponent(symbolFilter)}`);
        if (params.length) url += `?${params.join("&")}`;
        const res = await fetch(url);
        const data = await res.json();
        setCommodities(data || []);
      } catch {
        setCommodities([]);
        toast.error("Failed to load commodities");
      } finally {
        setFetching(false);
      }
    }
    load();
  }, [filterTrigger, nameFilter, symbolFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Creating commodity...");
    try {
      const res = await fetch("/api/commodity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, symbol }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create commodity");
      }
      toast.success("Commodity created successfully!", { id: toastId });
      setName("");
      setSymbol("");
      setFilterTrigger((prev) => prev + 1); // Refresh the list
    } catch (err: any) {
      toast.error(err.message || "Error creating commodity", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleEditCommodity = (c: any) => {
    setEditingCommodity(c);
    setName(c.name || "");
    setSymbol(c.symbol || "");
  };

  const handleUpdateCommodity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCommodity) return;
    setLoading(true);
    const toastId = toast.loading("Updating commodity...");
    try {
      const res = await fetch(`/api/commodity/${editingCommodity.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, symbol }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update commodity");
      }
      toast.success("Commodity updated successfully!", { id: toastId });
      setEditingCommodity(null);
      setName("");
      setSymbol("");
      setFilterTrigger((prev) => prev + 1); // Refresh the list
    } catch (err: any) {
      toast.error(err.message || "Error updating commodity", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCommodity = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this commodity?"))
      return;
    setLoading(true);
    const toastId = toast.loading("Deleting commodity...");
    try {
      const res = await fetch(`/api/commodity/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete commodity");
      }
      toast.success("Commodity deleted successfully!", { id: toastId });
      setFilterTrigger((prev) => prev + 1); // Refresh the list
    } catch (err: any) {
      toast.error(err.message || "Error deleting commodity", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleViewCommodity = async (c: any) => {
    try {
      const res = await fetch(`/api/commodity/${c.id}`);
      if (!res.ok) throw new Error("Failed to fetch commodity details");
      const data = await res.json();
      setViewingCommodity(data);
      setViewModalOpen(true);
    } catch (error) {
      toast.error("Failed to fetch commodity details");
      setViewingCommodity(c);
      setViewModalOpen(true);
    }
  };

  return (
    <>
      <Header
        title="Manage Commodities"
        icon={<Gem className="h-5 w-5" />}
        subtitle="Create, edit and filter commodities."
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6" style={{ width: "100%" }}>
          <BackLink href="/setup" label="Back to Settings" />
        </div>

        <div className="max-w-xl">
          <form
            onSubmit={editingCommodity ? handleUpdateCommodity : handleSubmit}
          >
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Commodity Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Symbol
                    </label>
                    <input
                      type="text"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
                      required
                      className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  {editingCommodity && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCommodity(null);
                        setName("");
                        setSymbol("");
                      }}
                      className="bg-gray-500 text-white px-6 py-2 rounded-md shadow hover:bg-gray-600 transition"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-md shadow hover:bg-blue-700 transition disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading
                      ? "Processing..."
                      : editingCommodity
                      ? "Update Commodity"
                      : "Create Commodity"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className="mt-10">
          <h3 className="text-lg font-semibold mb-4">All Commodities</h3>
          <div className="flex items-center gap-4 mb-4">
            <input
              type="text"
              value={nameFilter}
              onChange={(e) => {
                setNameFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by name"
              className="!w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
            />
            <input
              type="text"
              value={symbolFilter}
              onChange={(e) => {
                setSymbolFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by symbol"
              className="!w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
            />
            <button
              className="bg-blue-500 text-white px-4 py-1 rounded flex items-center gap-2"
              onClick={() => setFilterTrigger(filterTrigger + 1)}
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
              Search
            </button>
          </div>

          {fetching ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              {/* <span className="ml-2 text-gray-500">Loading commodities...</span> */}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 bg-white rounded shadow">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Symbol
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Date Added
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {commodities
                      .slice((page - 1) * pageSize, page * pageSize)
                      .map((c: any) => (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-900">
                            {capitalizeFirst(c.name)}
                          </td>
                          <td className="px-4 py-2 text-gray-700">
                            {c.symbol}
                          </td>
                          <td className="px-4 py-2 text-gray-700">
                            {c.createdAt
                              ? new Date(c.createdAt).toLocaleDateString()
                              : "-"}
                          </td>
                          <td className="px-4 py-2 flex gap-2">
                            <button
                              className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs flex items-center"
                              onClick={() => handleViewCommodity(c)}
                            >
                              <EyeIcon className="h-4 w-4 mr-1" /> View
                            </button>
                            <button
                              className="px-2 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-xs flex items-center"
                              onClick={() => handleEditCommodity(c)}
                            >
                              <PencilSquareIcon className="h-4 w-4 mr-1" /> Edit
                            </button>
                            <button
                              className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs flex items-center"
                              onClick={() => handleDeleteCommodity(c.id)}
                            >
                              <TrashIcon className="h-4 w-4 mr-1" /> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

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
                        {Math.min(page * pageSize, commodities.length)}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium">{commodities.length}</span>{" "}
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
                            Math.ceil(commodities.length / pageSize)
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
                              Math.max(
                                1,
                                Math.ceil(commodities.length / pageSize)
                              )
                            )
                          )
                        }
                        disabled={
                          page ===
                          Math.max(1, Math.ceil(commodities.length / pageSize))
                        }
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                          page ===
                          Math.max(1, Math.ceil(commodities.length / pageSize))
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

        {viewModalOpen && viewingCommodity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
              <button
                className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-red-400"
                onClick={() => {
                  setViewModalOpen(false);
                  setViewingCommodity(null);
                }}
                aria-label="Close"
              >
                <span className="text-xl">&times;</span>
              </button>
              <h2 className="text-lg font-bold mb-4">Commodity Details</h2>
              <div className="space-y-2">
                <div>
                  <span className="font-semibold">Name:</span>{" "}
                  {viewingCommodity.name}
                </div>
                <div>
                  <span className="font-semibold">Symbol:</span>{" "}
                  {viewingCommodity.symbol}
                </div>
                <div>
                  <span className="font-semibold">Date Added:</span>{" "}
                  {viewingCommodity.createdAt
                    ? new Date(viewingCommodity.createdAt).toLocaleDateString()
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
