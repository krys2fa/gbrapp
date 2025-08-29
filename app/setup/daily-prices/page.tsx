"use client";
import React, { useState } from "react";
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

const DailyPricesPage = () => {
  // Form state
  const [form, setForm] = useState({ commodity: "", price: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  // Table state
  const [prices, setPrices] = useState([]);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [commodityFilter, setCommodityFilter] = useState("");
  const [editingPrice, setEditingPrice] = useState<any>(null);
  const [viewingPrice, setViewingPrice] = useState<any>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Fetch prices from API
  React.useEffect(() => {
    async function fetchPrices() {
      setPricesLoading(true);
      try {
        let url = "/api/prices";
        if (commodityFilter)
          url += `?search=${encodeURIComponent(commodityFilter)}`;
        const res = await fetch(url);
        const data = await res.json();
        setPrices(data);
      } catch {
        setPrices([]);
      } finally {
        setPricesLoading(false);
      }
    }
    fetchPrices();
  }, [success, commodityFilter]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commodity: form.commodity,
          value: parseFloat(form.price),
          effectiveDate: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error("Failed to add price");
      setSuccess("Price added successfully!");
      setForm({ commodity: "", price: "" });
    } catch (err: any) {
      setError(err.message || "Error adding price");
    } finally {
      setLoading(false);
    }
  };

  const handleEditPrice = (price: any) => {
    setEditingPrice(price);
    setForm({ commodity: price.commodity, price: price.price });
  };

  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrice) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/prices/${editingPrice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commodity: form.commodity,
          value: parseFloat(form.price),
        }),
      });
      if (!res.ok) throw new Error("Failed to update price");
      setSuccess("Price updated successfully!");
      setEditingPrice(null);
      setForm({ commodity: "", price: "" });
    } catch (err: any) {
      setError(err.message || "Error updating price");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePrice = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this price entry?"))
      return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/prices/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete price");
      setSuccess("Price deleted successfully!");
    } catch (err: any) {
      setError(err.message || "Error deleting price");
    } finally {
      setLoading(false);
    }
  };

  const handleViewPrice = async (price: any) => {
    try {
      const res = await fetch(`/api/prices/${price.id}`);
      if (!res.ok) throw new Error("Failed to fetch price details");
      const details = await res.json();
      setViewingPrice(details);
      setViewModalOpen(true);
    } catch {
      setViewingPrice(price);
      setViewModalOpen(true);
    }
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewingPrice(null);
  };

  return (
    <>
      <div className="mb-6" style={{ width: "100%" }}>
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
        <div className="max-w-md mx-auto">
          <h2 className="text-xl font-bold mb-6">Add Daily Price</h2>
          <form
            className="space-y-6"
            onSubmit={editingPrice ? handleUpdatePrice : handleSubmit}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Commodity
              </label>
              <input
                type="text"
                name="commodity"
                value={form.commodity}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Price
              </label>
              <input
                type="text"
                name="price"
                value={form.price}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
            >
              {loading
                ? editingPrice
                  ? "Updating..."
                  : "Creating..."
                : editingPrice
                ? "Update Price"
                : "Add Price"}
            </button>
            {editingPrice && (
              <button
                type="button"
                className="w-full py-2 px-4 bg-gray-400 text-white rounded-md hover:bg-gray-500 focus:outline-none mt-2"
                onClick={() => {
                  setEditingPrice(null);
                  setForm({ commodity: "", price: "" });
                }}
              >
                Cancel Edit
              </button>
            )}
            {success && (
              <p className="text-green-600 text-sm mt-2">{success}</p>
            )}
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </form>
        </div>
        <div className="mt-10">
          <h3 className="text-lg font-semibold mb-4">Daily Prices</h3>
          <div className="flex items-center gap-4 mb-4">
            <input
              type="text"
              value={commodityFilter}
              onChange={(e) => {
                setCommodityFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by commodity"
              className="!w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
            />
          </div>
          {pricesLoading ? (
            <p className="text-gray-500">Loading prices...</p>
          ) : (
            <>
              <table className="w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Commodity
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Price
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
                  {prices
                    .slice((page - 1) * pageSize, page * pageSize)
                    .map((price: any) => (
                      <tr key={price.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-900">
                          {price.commodity}
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          {price.price}
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          {price.createdAt
                            ? new Date(price.createdAt).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="px-4 py-2 flex gap-2">
                          <button
                            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs flex items-center"
                            onClick={() => handleViewPrice(price)}
                          >
                            <EyeIcon className="h-4 w-4 mr-1" /> View
                          </button>
                          <button
                            className="px-2 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-xs flex items-center"
                            onClick={() => handleEditPrice(price)}
                          >
                            <PencilSquareIcon className="h-4 w-4 mr-1" /> Edit
                          </button>
                          <button
                            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs flex items-center"
                            onClick={() => handleDeletePrice(price.id)}
                          >
                            <TrashIcon className="h-4 w-4 mr-1" /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-600">
                  Page {page} of{" "}
                  {Math.max(1, Math.ceil(prices.length / pageSize))}
                </span>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </button>
                  <button
                    className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
                    disabled={page >= Math.ceil(prices.length / pageSize)}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
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
            <h2 className="text-lg font-bold mb-4">Price Details</h2>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Commodity:</span>{" "}
                {viewingPrice.commodity}
              </div>
              <div>
                <span className="font-semibold">Price:</span>{" "}
                {viewingPrice.price}
              </div>
              <div>
                <span className="font-semibold">Date Added:</span>{" "}
                {viewingPrice.createdAt
                  ? new Date(viewingPrice.createdAt).toLocaleDateString()
                  : "-"}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DailyPricesPage;
