"use client";
import React, { useEffect, useState } from "react";
import { Header } from "../../components/layout/header";
import { Truck } from "lucide-react";
import {
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import BackLink from "@/app/components/ui/BackLink";
import { useAuth } from "@/app/context/auth-context";
import { withClientAuth } from "@/app/lib/with-client-auth";

interface ShipmentType {
  id: string;
  name: string;
  description: string | null;
}

function ShipmentTypesPage() {
  const { token } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [shipmentTypes, setShipmentTypes] = useState<ShipmentType[]>([]);
  const [fetching, setFetching] = useState(true);

  // Filters / pagination / UI state
  const [nameFilter, setNameFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [editingShipmentType, setEditingShipmentType] =
    useState<ShipmentType | null>(null);
  const [viewingShipmentType, setViewingShipmentType] =
    useState<ShipmentType | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [filterTrigger, setFilterTrigger] = useState(0);

  useEffect(() => {
    async function load() {
      setFetching(true);
      try {
        let url = "/api/shipment-types";
        const params: string[] = [];
        if (nameFilter) params.push(`name=${encodeURIComponent(nameFilter)}`);
        if (params.length) url += `?${params.join("&")}`;
        const res = await fetch(url);
        const data = await res.json();
        setShipmentTypes(data || []);
      } catch {
        setShipmentTypes([]);
      } finally {
        setFetching(false);
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
      const res = await fetch("/api/shipment-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create shipment type");
      }
      setSuccess("Shipment type created successfully");
      setName("");
      setDescription("");
    } catch (err: any) {
      setError(err.message || "Error creating shipment type");
    } finally {
      setLoading(false);
    }
  };

  const handleEditShipmentType = (shipmentType: ShipmentType) => {
    setEditingShipmentType(shipmentType);
    setName(shipmentType.name || "");
    setDescription(shipmentType.description || "");
  };

  const handleUpdateShipmentType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShipmentType) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/shipment-types/${editingShipmentType.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update shipment type");
      }
      setSuccess("Shipment type updated successfully");
      setEditingShipmentType(null);
      setName("");
      setDescription("");
    } catch (err: any) {
      setError(err.message || "Error updating shipment type");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShipmentType = async (id: string) => {
    if (!confirm("Are you sure you want to delete this shipment type?")) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/shipment-types/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete shipment type");
      }
      setSuccess("Shipment type deleted successfully");
    } catch (err: any) {
      setError(err.message || "Error deleting shipment type");
    } finally {
      setLoading(false);
    }
  };

  const handleViewShipmentType = (shipmentType: ShipmentType) => {
    setViewingShipmentType(shipmentType);
    setViewModalOpen(true);
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setEditingShipmentType(null);
    setError("");
    setSuccess("");
  };

  // Filter shipment types based on name filter
  const filteredShipmentTypes = shipmentTypes.filter((st) =>
    st.name.toLowerCase().includes(nameFilter.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredShipmentTypes.length / pageSize);
  const paginatedShipmentTypes = filteredShipmentTypes.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <>
      <Header
        title="Manage Shipment Types"
        icon={<Truck className="h-5 w-5" />}
        subtitle="Add and manage shipment types for the application."
      />
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <BackLink href="/setup" label="Back to Setup" />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingShipmentType
                  ? "Edit Shipment Type"
                  : "Add New Shipment Type"}
              </h3>

              {success && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                  {success}
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              <form
                onSubmit={
                  editingShipmentType ? handleUpdateShipmentType : handleSubmit
                }
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter shipment type name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter description (optional)"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {loading
                        ? "Saving..."
                        : editingShipmentType
                        ? "Update"
                        : "Create"}
                    </button>

                    {editingShipmentType && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Table Section */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    Shipment Types
                  </h3>
                  <button
                    onClick={() => setFilterTrigger((prev) => prev + 1)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                    title="Refresh"
                  >
                    <ArrowPathIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Filters */}
                <div className="mt-4 flex space-x-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Filter by name..."
                      value={nameFilter}
                      onChange={(e) => setNameFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                {fetching ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">
                      Loading shipment types...
                    </p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedShipmentTypes.length === 0 ? (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-6 py-4 text-center text-gray-500"
                          >
                            No shipment types found
                          </td>
                        </tr>
                      ) : (
                        paginatedShipmentTypes.map((shipmentType) => (
                          <tr
                            key={shipmentType.id}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {shipmentType.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {shipmentType.description || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() =>
                                    handleViewShipmentType(shipmentType)
                                  }
                                  className="text-blue-600 hover:text-blue-900"
                                  title="View"
                                >
                                  <EyeIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleEditShipmentType(shipmentType)
                                  }
                                  className="text-indigo-600 hover:text-indigo-900"
                                  title="Edit"
                                >
                                  <PencilSquareIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteShipmentType(shipmentType.id)
                                  }
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-3 border-t border-gray-200 flex justify-between items-center">
                  <div className="text-sm text-gray-700">
                    Showing{" "}
                    {Math.min(
                      (page - 1) * pageSize + 1,
                      filteredShipmentTypes.length
                    )}{" "}
                    to {Math.min(page * pageSize, filteredShipmentTypes.length)}{" "}
                    of {filteredShipmentTypes.length} results
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* View Modal */}
        {viewModalOpen && viewingShipmentType && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Shipment Type Details
                  </h3>
                  <button
                    onClick={() => setViewModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {viewingShipmentType.name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {viewingShipmentType.description || "No description"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default withClientAuth(ShipmentTypesPage);
