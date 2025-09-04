"use client";
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { ChevronDown, UserPlus } from "lucide-react";
import {
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { Header } from "../../components/layout/header";
import Link from "next/link";
import BackLink from "@/app/components/ui/BackLink";

const officerTypes = [
  { value: "CUSTOMS_OFFICER", label: "Customs Officer" },
  { value: "ASSAY_OFFICER", label: "Assay Officer" },
  { value: "TECHNICAL_DIRECTOR", label: "Technical Director" },
  { value: "NACOB_OFFICER", label: "NACOB Officer" },
  { value: "NATIONAL_SECURITY_OFFICER", label: "National Security Officer" },
];

// Utility to capitalize only the first letter
function capitalizeFirst(str: string) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

const OfficersPage = () => {
  const [nameFilter, setNameFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [form, setForm] = useState({
    name: "",
    badgeNumber: "",
    email: "",
    phone: "",
    officerType: officerTypes[0].value,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [officers, setOfficers] = useState([]);
  const [officersLoading, setOfficersLoading] = useState(true);
  const [editingOfficer, setEditingOfficer] = useState<any>(null);
  const [viewingOfficer, setViewingOfficer] = useState<any>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [filterTrigger, setFilterTrigger] = useState(0);

  React.useEffect(() => {
    async function fetchOfficers() {
      setOfficersLoading(true);
      try {
        let url = "/api/officers";
        const params = [];
        if (typeFilter) params.push(`type=${typeFilter}`);
        if (nameFilter) params.push(`search=${encodeURIComponent(nameFilter)}`);
        if (params.length) url += `?${params.join("&")}`;
        const res = await fetch(url);
        const data = await res.json();
        setOfficers(data);
      } catch {
        setOfficers([]);
      } finally {
        setOfficersLoading(false);
      }
    }
    fetchOfficers();
  }, [success, filterTrigger]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/officers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create officer");
      }
      setSuccess("Officer created successfully!");
      setForm({
        name: "",
        badgeNumber: "",
        email: "",
        phone: "",
        officerType: officerTypes[0].value,
      });
    } catch (err: any) {
      setError(err.message || "Error creating officer");
    } finally {
      setLoading(false);
    }
  };

  const handleEditOfficer = (officer: any) => {
    setEditingOfficer(officer);
    setForm({
      name: officer.name || "",
      badgeNumber: officer.badgeNumber || "",
      email: officer.email || "",
      phone: officer.phone || "",
      officerType: officer.officerType || officerTypes[0].value,
    });
  };

  const handleUpdateOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOfficer) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/officers/${editingOfficer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update officer");
      }
      setSuccess("Officer updated successfully!");
      setEditingOfficer(null);
      setForm({
        name: "",
        badgeNumber: "",
        email: "",
        phone: "",
        officerType: officerTypes[0].value,
      });
    } catch (err: any) {
      setError(err.message || "Error updating officer");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOfficer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this officer?")) return;
    try {
      const res = await fetch(`/api/officers/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete officer");
      setSuccess("Officer deleted successfully!");
      setFilterTrigger((prev) => prev + 1);
    } catch (err: any) {
      setError(err.message || "Error deleting officer");
    }
  };

  const handleViewOfficer = (officer: any) => {
    setViewingOfficer(officer);
    setViewModalOpen(true);
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewingOfficer(null);
  };

  const getOfficerTypeLabel = (type: string) => {
    const officerType = officerTypes.find((t) => t.value === type);
    return officerType ? officerType.label : type;
  };

  return (
    <>
      <Header
        title="Manage Officers"
        icon={<UserPlus className="h-5 w-5" />}
        subtitle="Register and manage customs officers, assay officers, and technical directors."
      />
      <div className="my-6 px-4" style={{ width: "100%" }}>
        <BackLink href="/setup" label="Back to Settings" />
      </div>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl">
          <form
            onSubmit={editingOfficer ? handleUpdateOfficer : handleSubmit}
            className="space-y-6"
          >
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                <div className="px-4 sm:px-0">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    {editingOfficer ? "Edit Officer" : "Create New Officer"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {editingOfficer
                      ? "Update officer information."
                      : "Add a new officer to the system."}
                  </p>
                </div>

                {error && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-red-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
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
                          Error {editingOfficer ? "Updating" : "Creating"}{" "}
                          Officer
                        </h3>
                        <div className="mt-2 text-sm text-red-700 whitespace-pre-wrap">
                          {error}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="rounded-md bg-green-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-green-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">
                          Success
                        </h3>
                        <div className="mt-2 text-sm text-green-700">
                          {success}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={form.name}
                      onChange={handleChange}
                      className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="badgeNumber"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Badge Number
                    </label>
                    <input
                      type="text"
                      name="badgeNumber"
                      id="badgeNumber"
                      value={form.badgeNumber}
                      onChange={handleChange}
                      className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={form.email}
                      onChange={handleChange}
                      className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="officerType"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Officer Type
                    </label>
                    <select
                      id="officerType"
                      name="officerType"
                      value={form.officerType}
                      onChange={handleChange}
                      className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      {officerTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  {editingOfficer && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingOfficer(null);
                        setForm({
                          name: "",
                          badgeNumber: "",
                          email: "",
                          phone: "",
                          officerType: officerTypes[0].value,
                        });
                      }}
                      className="bg-gray-500 text-white px-6 py-2 rounded-md shadow hover:bg-gray-600 transition"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md shadow hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {loading
                      ? "Saving..."
                      : editingOfficer
                      ? "Update Officer"
                      : "Create Officer"}
                  </button>
                </div>
              </div>
            </div>
          </form>

          <div className="mt-10">
            <h3 className="text-lg font-semibold mb-4">All Officers</h3>
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
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="!w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
              >
                <option value="">All Types</option>
                {officerTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setFilterTrigger((prev) => prev + 1)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <MagnifyingGlassIcon className="h-4 w-4 inline mr-2" />
                Search
              </button>
            </div>

            {officersLoading ? (
              <div className="flex items-center justify-center py-8">
                <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin" />
                <span className="ml-2 text-gray-500">Loading officers...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Badge Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {officers.map((officer: any) => (
                      <tr key={officer.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {officer.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {officer.badgeNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getOfficerTypeLabel(officer.officerType)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {officer.email && officer.phone
                            ? `${officer.email} / ${officer.phone}`
                            : officer.email || officer.phone || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            className="text-blue-600 hover:text-blue-900 mr-4"
                            onClick={() => handleViewOfficer(officer)}
                          >
                            <EyeIcon className="h-4 w-4 inline" />
                          </button>
                          <button
                            className="text-yellow-600 hover:text-yellow-900 mr-4"
                            onClick={() => handleEditOfficer(officer)}
                          >
                            <PencilSquareIcon className="h-4 w-4 inline" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleDeleteOfficer(officer.id)}
                          >
                            <TrashIcon className="h-4 w-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {officers.length === 0 && !officersLoading && (
              <div className="text-center py-8">
                <p className="text-gray-500">No officers found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Modal */}
      {viewModalOpen && viewingOfficer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Officer Details
                </h3>
                <button
                  onClick={closeViewModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {viewingOfficer.name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Badge Number
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {viewingOfficer.badgeNumber}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {getOfficerTypeLabel(viewingOfficer.officerType)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {viewingOfficer.email || "-"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {viewingOfficer.phone || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OfficersPage;
