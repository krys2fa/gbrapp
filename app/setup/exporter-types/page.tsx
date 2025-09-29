"use client";

import React, { useEffect, useState } from "react";
import {
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import BackLink from "@/app/components/ui/BackLink";
import { Building2 } from "lucide-react";
import { Header } from "../../components/layout/header";

export default function ExporterTypesPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [types, setTypes] = useState<any[]>([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [editingType, setEditingType] = useState<any>(null);
  const [viewingType, setViewingType] = useState<any>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const fetchTypes = async () => {
    setTypesLoading(true);
    try {
      const res = await fetch("/api/exporter-types");
      if (!res.ok) throw new Error("Failed to fetch exporter types");
      const data = await res.json();
      setTypes(Array.isArray(data) ? data : []);
    } catch (e) {
      setTypes([]);
    } finally {
      setTypesLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, [success]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/exporter-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) throw new Error("Failed to create exporter type");
      setSuccess("Exporter type created");
      setName("");
      setDescription("");
      fetchTypes();
    } catch (err: any) {
      setError(err.message || "Error creating exporter type");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (t: any) => {
    setEditingType(t);
    setName(t.name || "");
    setDescription(t.description || "");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/exporter-types/${editingType.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) throw new Error("Failed to update exporter type");
      setSuccess("Exporter type updated");
      setEditingType(null);
      setName("");
      setDescription("");
      fetchTypes();
    } catch (err: any) {
      setError(err.message || "Error updating exporter type");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this exporter type?"))
      return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/exporter-types/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete exporter type");
      setSuccess("Exporter type deleted");
      fetchTypes();
      setPage(1);
    } catch (err: any) {
      setError(err.message || "Error deleting exporter type");
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (t: any) => {
    try {
      const res = await fetch(`/api/exporter-types/${t.id}`);
      if (!res.ok) throw new Error("Failed to fetch exporter type");
      const details = await res.json();
      setViewingType(details);
      setViewModalOpen(true);
    } catch {
      setViewingType(t);
      setViewModalOpen(true);
    }
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewingType(null);
  };

  return (
    <>
      <Header
        title="Exporter Types"
        icon={<Building2 className="h-5 w-5" />}
        subtitle="Manage exporter types"
      />
      <div className="my-6 px-4" style={{ width: "100%" }}>
        <BackLink href="/setup" label="Back to Settings" />
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mt-2">
          <form onSubmit={editingType ? handleUpdate : handleCreate}>
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                {error && (
                  <div className="rounded-md bg-red-50 p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-red-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Error
                        </h3>
                        <div className="mt-2 text-sm text-red-700 whitespace-pre-wrap">
                          {error}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {success && <div className="text-green-600">{success}</div>}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-md shadow hover:bg-blue-700 transition"
                  >
                    {editingType
                      ? "Update Exporter Type"
                      : "Create Exporter Type"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="mt-10">
          <h3 className="text-lg font-semibold mb-4">All Exporter Types</h3>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {typesLoading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <span className="ml-2 text-gray-500">Loading...</span>
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
                          Description
                        </th>

                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {types
                        .slice((page - 1) * pageSize, page * pageSize)
                        .map((t: any) => (
                          <tr key={t.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-gray-900">
                              {t.name}
                            </td>
                            <td className="px-4 py-2 text-gray-700">
                              {t.description || "-"}
                            </td>

                            <td className="px-4 py-2 flex gap-2">
                              <button
                                className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs flex items-center"
                                onClick={() => handleView(t)}
                              >
                                <EyeIcon className="h-4 w-4 mr-1" /> View
                              </button>
                              <button
                                className="px-2 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-xs flex items-center"
                                onClick={() => handleEdit(t)}
                              >
                                <PencilSquareIcon className="h-4 w-4 mr-1" />{" "}
                                Edit
                              </button>
                              <button
                                className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs flex items-center"
                                onClick={() => handleDelete(t.id)}
                              >
                                <TrashIcon className="h-4 w-4 mr-1" /> Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      {types.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-2 text-sm text-gray-500"
                          >
                            No exporter types yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{" "}
                        <span className="font-medium">
                          {types.length === 0 ? 0 : (page - 1) * pageSize + 1}
                        </span>{" "}
                        to{" "}
                        <span className="font-medium">
                          {Math.min(page * pageSize, types.length)}
                        </span>{" "}
                        of <span className="font-medium">{types.length}</span>{" "}
                        results
                      </p>
                    </div>
                    <div>
                      <nav
                        className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                        aria-label="Pagination"
                      >
                        <button
                          onClick={() =>
                            setPage((prev) => Math.max(prev - 1, 1))
                          }
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
                              Math.ceil(types.length / pageSize)
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
                                Math.max(1, Math.ceil(types.length / pageSize))
                              )
                            )
                          }
                          disabled={
                            page ===
                            Math.max(1, Math.ceil(types.length / pageSize))
                          }
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                            page ===
                            Math.max(1, Math.ceil(types.length / pageSize))
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
        </div>
      </div>

      {viewModalOpen && viewingType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-red-400"
              onClick={closeViewModal}
              aria-label="Close"
            >
              <span className="text-xl">&times;</span>
            </button>
            <h2 className="text-lg font-bold mb-4">Exporter Type Details</h2>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Name:</span> {viewingType.name}
              </div>
              <div>
                <span className="font-semibold">Description:</span>{" "}
                {viewingType.description || "-"}
              </div>
              <div>
                <span className="font-semibold">Date Added:</span>{" "}
                {viewingType.createdAt
                  ? new Date(viewingType.createdAt).toLocaleDateString()
                  : "-"}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
