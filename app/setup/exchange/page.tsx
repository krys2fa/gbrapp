"use client";
import React, { useState } from "react";
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

const ExchangeSetupPage = () => {
  // Form state
  const [form, setForm] = useState({ currency: "", rate: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  // Table state
  const [exchanges, setExchanges] = useState([]);
  const [exchangesLoading, setExchangesLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [currencyFilter, setCurrencyFilter] = useState("");
  const [editingExchange, setEditingExchange] = useState<any>(null);
  const [viewingExchange, setViewingExchange] = useState<any>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Fetch exchanges (stub)
  React.useEffect(() => {
    setExchangesLoading(true);
    setTimeout(() => {
      setExchanges([
        { id: "1", currency: "USD", rate: "1500", createdAt: new Date() },
        { id: "2", currency: "EUR", rate: "1600", createdAt: new Date() },
      ]);
      setExchangesLoading(false);
    }, 500);
  }, [success]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setTimeout(() => {
      setSuccess("Exchange rate added successfully!");
      setForm({ currency: "", rate: "" });
      setLoading(false);
    }, 500);
  };

  const handleEditExchange = (exchange: any) => {
    setEditingExchange(exchange);
    setForm({ currency: exchange.currency, rate: exchange.rate });
  };

  const handleUpdateExchange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setTimeout(() => {
      setSuccess("Exchange rate updated successfully!");
      setEditingExchange(null);
      setForm({ currency: "", rate: "" });
      setLoading(false);
    }, 500);
  };

  const handleDeleteExchange = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this exchange rate?"))
      return;
    setLoading(true);
    setError("");
    setSuccess("");
    setTimeout(() => {
      setSuccess("Exchange rate deleted successfully!");
      setLoading(false);
    }, 500);
  };

  const handleViewExchange = (exchange: any) => {
    setViewingExchange(exchange);
    setViewModalOpen(true);
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewingExchange(null);
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
          <h2 className="text-xl font-bold mb-6">Add Exchange Rate</h2>
          <form
            className="space-y-6"
            onSubmit={editingExchange ? handleUpdateExchange : handleSubmit}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Currency
              </label>
              <input
                type="text"
                name="currency"
                value={form.currency}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Rate
              </label>
              <input
                type="text"
                name="rate"
                value={form.rate}
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
                ? editingExchange
                  ? "Updating..."
                  : "Creating..."
                : editingExchange
                ? "Update Rate"
                : "Add Rate"}
            </button>
            {editingExchange && (
              <button
                type="button"
                className="w-full py-2 px-4 bg-gray-400 text-white rounded-md hover:bg-gray-500 focus:outline-none mt-2"
                onClick={() => {
                  setEditingExchange(null);
                  setForm({ currency: "", rate: "" });
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
          <h3 className="text-lg font-semibold mb-4">Exchange Rates</h3>
          <div className="flex items-center gap-4 mb-4">
            <input
              type="text"
              value={currencyFilter}
              onChange={(e) => {
                setCurrencyFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by currency"
              className="!w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
            />
          </div>
          {exchangesLoading ? (
            <p className="text-gray-500">Loading rates...</p>
          ) : (
            <>
              <table className="w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Currency
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Rate
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
                  {exchanges
                    .slice((page - 1) * pageSize, page * pageSize)
                    .map((exchange: any) => (
                      <tr key={exchange.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-900">
                          {exchange.currency}
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          {exchange.rate}
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          {exchange.createdAt
                            ? new Date(exchange.createdAt).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="px-4 py-2 flex gap-2">
                          <button
                            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs flex items-center"
                            onClick={() => handleViewExchange(exchange)}
                          >
                            <EyeIcon className="h-4 w-4 mr-1" /> View
                          </button>
                          <button
                            className="px-2 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-xs flex items-center"
                            onClick={() => handleEditExchange(exchange)}
                          >
                            <PencilSquareIcon className="h-4 w-4 mr-1" /> Edit
                          </button>
                          <button
                            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs flex items-center"
                            onClick={() => handleDeleteExchange(exchange.id)}
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
                  {Math.max(1, Math.ceil(exchanges.length / pageSize))}
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
                    disabled={page >= Math.ceil(exchanges.length / pageSize)}
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
      {viewModalOpen && viewingExchange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-red-400"
              onClick={closeViewModal}
              aria-label="Close"
            >
              <span className="text-xl">&times;</span>
            </button>
            <h2 className="text-lg font-bold mb-4">Exchange Rate Details</h2>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Currency:</span>{" "}
                {viewingExchange.currency}
              </div>
              <div>
                <span className="font-semibold">Rate:</span>{" "}
                {viewingExchange.rate}
              </div>
              <div>
                <span className="font-semibold">Date Added:</span>{" "}
                {viewingExchange.createdAt
                  ? new Date(viewingExchange.createdAt).toLocaleDateString()
                  : "-"}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExchangeSetupPage;
