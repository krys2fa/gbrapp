"use client";
import React, { useState } from "react";
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

const ExportersPage = () => {
  // Form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    contactPerson: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  // Table state
  const [exporters, setExporters] = useState<any[]>([]);
  const [exportersLoading, setExportersLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [filterTrigger, setFilterTrigger] = useState(0);
  const [editingExporter, setEditingExporter] = useState<any>(null);
  const [viewingExporter, setViewingExporter] = useState<any>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Fetch exporters from API
  React.useEffect(() => {
    async function fetchExporters() {
      setExportersLoading(true);
      try {
        let url = "/api/exporters";
        const params = [];
        if (nameFilter) params.push(`search=${encodeURIComponent(nameFilter)}`);
        if (emailFilter)
          params.push(`email=${encodeURIComponent(emailFilter)}`);
        if (phoneFilter)
          params.push(`phone=${encodeURIComponent(phoneFilter)}`);
        if (params.length) url += `?${params.join("&")}`;
        const res = await fetch(url);
        const data = await res.json();
        setExporters(Array.isArray(data) ? data : []);
      } catch {
        setExporters([]);
      } finally {
        setExportersLoading(false);
      }
    }
    fetchExporters();
  }, [success, filterTrigger]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/exporters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          contactPerson: form.contactPerson,
          phone: form.phone,
          address: form.address,
        }),
      });
      if (!res.ok) throw new Error("Failed to create exporter");
      setSuccess("Exporter created successfully!");
      setForm({
        name: "",
        email: "",
        contactPerson: "",
        phone: "",
        address: "",
      });
    } catch (err: any) {
      setError(err.message || "Error creating exporter");
    } finally {
      setLoading(false);
    }
  };

  const handleEditExporter = (exporter: any) => {
    setEditingExporter(exporter);
    setForm({
      name: exporter.name || "",
      email: exporter.email || "",
      contactPerson: exporter.contactPerson || "",
      phone: exporter.phone || "",
      address: exporter.address || "",
    });
  };

  const handleUpdateExporter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExporter) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/exporters/${editingExporter.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          contactPerson: form.contactPerson,
          phone: form.phone,
          address: form.address,
        }),
      });
      if (!res.ok) throw new Error("Failed to update exporter");
      setSuccess("Exporter updated successfully!");
      setEditingExporter(null);
      setForm({
        name: "",
        email: "",
        contactPerson: "",
        phone: "",
        address: "",
      });
    } catch (err: any) {
      setError(err.message || "Error updating exporter");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExporter = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this exporter?"))
      return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/exporters/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete exporter");
      setSuccess("Exporter deleted successfully!");
    } catch (err: any) {
      setError(err.message || "Error deleting exporter");
    } finally {
      setLoading(false);
    }
  };

  const handleViewExporter = async (exporter: any) => {
    try {
      const res = await fetch(`/api/exporters/${exporter.id}`);
      if (!res.ok) throw new Error("Failed to fetch exporter details");
      const details = await res.json();
      setViewingExporter(details);
      setViewModalOpen(true);
    } catch {
      setViewingExporter(exporter);
      setViewModalOpen(true);
    }
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewingExporter(null);
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
          <h2 className="text-xl font-bold mb-6">Create Exporter</h2>
          <form
            className="space-y-6"
            onSubmit={editingExporter ? handleUpdateExporter : handleSubmit}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contact Person
              </label>
              <input
                type="text"
                name="contactPerson"
                value={form.contactPerson}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={form.address}
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
                ? editingExporter
                  ? "Updating..."
                  : "Creating..."
                : editingExporter
                ? "Update Exporter"
                : "Create Exporter"}
            </button>
            {editingExporter && (
              <button
                type="button"
                className="w-full py-2 px-4 bg-gray-400 text-white rounded-md hover:bg-gray-500 focus:outline-none mt-2"
                onClick={() => {
                  setEditingExporter(null);
                  setForm({
                    name: "",
                    email: "",
                    contactPerson: "",
                    phone: "",
                    address: "",
                  });
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
          <h3 className="text-lg font-semibold mb-4">All Exporters</h3>
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
              value={emailFilter}
              onChange={(e) => {
                setEmailFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by email"
              className="!w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
            />
            <input
              type="text"
              value={phoneFilter}
              onChange={(e) => {
                setPhoneFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by phone"
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
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {exportersLoading ? (
              <div className="flex justify-center items-center py-10">
                <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin" />
                <span className="ml-2 text-gray-500">Loading exporters...</span>
              </div>
            ) : (
              <>
                <table className="w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Contact Person
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Phone
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Address
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Date Added
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Last Login
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {exporters
                      .slice((page - 1) * pageSize, page * pageSize)
                      .map((exporter: any) => (
                        <tr key={exporter.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-900">
                            {exporter.name}
                          </td>
                          <td className="px-4 py-2 text-gray-700">
                            {exporter.email}
                          </td>
                          <td className="px-4 py-2 text-gray-700">
                            {exporter.contactPerson}
                          </td>
                          <td className="px-4 py-2 text-gray-700">
                            {exporter.phone}
                          </td>
                          <td className="px-4 py-2 text-gray-700">
                            {exporter.address}
                          </td>
                          <td className="px-4 py-2 text-gray-700">
                            {exporter.createdAt
                              ? new Date(
                                  exporter.createdAt
                                ).toLocaleDateString()
                              : "-"}
                          </td>
                          <td className="px-4 py-2 text-gray-700">
                            {exporter.lastLogin
                              ? new Date(exporter.lastLogin).toLocaleString()
                              : "Never"}
                          </td>
                          <td className="px-4 py-2 flex gap-2">
                            <button
                              className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs flex items-center"
                              onClick={() => handleViewExporter(exporter)}
                            >
                              <EyeIcon className="h-4 w-4 mr-1" /> View
                            </button>
                            <button
                              className="px-2 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-xs flex items-center"
                              onClick={() => handleEditExporter(exporter)}
                            >
                              <PencilSquareIcon className="h-4 w-4 mr-1" /> Edit
                            </button>
                            <button
                              className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs flex items-center"
                              onClick={() => handleDeleteExporter(exporter.id)}
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
                    {Math.max(1, Math.ceil(exporters.length / pageSize))}
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
                      disabled={page >= Math.ceil(exporters.length / pageSize)}
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
      </div>
      {viewModalOpen && viewingExporter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-red-400"
              onClick={closeViewModal}
              aria-label="Close"
            >
              <span className="text-xl">&times;</span>
            </button>
            <h2 className="text-lg font-bold mb-4">Exporter Details</h2>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Name:</span>{" "}
                {viewingExporter.name}
              </div>
              <div>
                <span className="font-semibold">Email:</span>{" "}
                {viewingExporter.email}
              </div>
              <div>
                <span className="font-semibold">Contact Person:</span>{" "}
                {viewingExporter.contactPerson}
              </div>
              <div>
                <span className="font-semibold">Phone:</span>{" "}
                {viewingExporter.phone}
              </div>
              <div>
                <span className="font-semibold">Address:</span>{" "}
                {viewingExporter.address}
              </div>
              <div>
                <span className="font-semibold">Date Added:</span>{" "}
                {viewingExporter.createdAt
                  ? new Date(viewingExporter.createdAt).toLocaleDateString()
                  : "-"}
              </div>
              <div>
                <span className="font-semibold">Last Login:</span>{" "}
                {viewingExporter.lastLogin
                  ? new Date(viewingExporter.lastLogin).toLocaleString()
                  : "Never"}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExportersPage;
