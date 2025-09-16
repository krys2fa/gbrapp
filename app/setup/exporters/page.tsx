"use client";
import React, { useState } from "react";
import {
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import BackLink from "@/app/components/ui/BackLink";
import { Building2 } from "lucide-react";
import { Header } from "../../components/layout/header";

const ExportersPage = () => {
  // Form state
  const [form, setForm] = useState({
    name: "",
    tin: "",
    email: "",
    contactPerson: "",
    phone: "",
    address: "",
    authorizedSignatory: "",
    exporterTypeId: "",
    // Consignee Information
    consigneeAddress: "",
    consigneeTelephone: "",
    consigneeMobile: "",
    consigneeEmail: "",
    // Buyer Information
    buyerName: "",
    buyerAddress: "",
    // Exporter Details
    deliveryLocation: "",
    exporterTelephone: "",
    exporterEmail: "",
    exporterWebsite: "",
    exporterLicenseNumber: "",
    // Notified Party Information
    notifiedPartyName: "",
    notifiedPartyAddress: "",
    notifiedPartyEmail: "",
    notifiedPartyContactPerson: "",
    notifiedPartyTelephone: "",
    notifiedPartyMobile: "",
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
  const [exporterTypes, setExporterTypes] = useState<any[]>([]);
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
        // fetch exporter types as well
        try {
          const typesRes = await fetch("/api/exporter-types");
          if (typesRes.ok) {
            const types = await typesRes.json();
            setExporterTypes(Array.isArray(types) ? types : []);
          }
        } catch (e) {
          setExporterTypes([]);
        }
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

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm({ ...form, exporterTypeId: e.target.value });
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
          tin: form.tin,
          email: form.email,
          contactPerson: form.contactPerson,
          phone: form.phone,
          address: form.address,
          authorizedSignatory: form.authorizedSignatory,
          exporterTypeId: form.exporterTypeId || undefined,
          // Consignee Information
          consigneeAddress: form.consigneeAddress,
          consigneeTelephone: form.consigneeTelephone,
          consigneeMobile: form.consigneeMobile,
          consigneeEmail: form.consigneeEmail,
          // Buyer Information
          buyerName: form.buyerName,
          buyerAddress: form.buyerAddress,
          // Exporter Details
          deliveryLocation: form.deliveryLocation,
          exporterTelephone: form.exporterTelephone,
          exporterEmail: form.exporterEmail,
          exporterWebsite: form.exporterWebsite,
          exporterLicenseNumber: form.exporterLicenseNumber,
          // Notified Party Information
          notifiedPartyName: form.notifiedPartyName,
          notifiedPartyAddress: form.notifiedPartyAddress,
          notifiedPartyEmail: form.notifiedPartyEmail,
          notifiedPartyContactPerson: form.notifiedPartyContactPerson,
          notifiedPartyTelephone: form.notifiedPartyTelephone,
          notifiedPartyMobile: form.notifiedPartyMobile,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create exporter");
      }
      setSuccess("Exporter created successfully!");
      setForm({
        name: "",
        tin: "",
        email: "",
        contactPerson: "",
        phone: "",
        address: "",
        authorizedSignatory: "",
        exporterTypeId: "",
        // Consignee Information
        consigneeAddress: "",
        consigneeTelephone: "",
        consigneeMobile: "",
        consigneeEmail: "",
        // Buyer Information
        buyerName: "",
        buyerAddress: "",
        // Exporter Details
        deliveryLocation: "",
        exporterTelephone: "",
        exporterEmail: "",
        exporterWebsite: "",
        exporterLicenseNumber: "",
        // Notified Party Information
        notifiedPartyName: "",
        notifiedPartyAddress: "",
        notifiedPartyEmail: "",
        notifiedPartyContactPerson: "",
        notifiedPartyTelephone: "",
        notifiedPartyMobile: "",
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
      tin: exporter.tin || "",
      contactPerson: exporter.contactPerson || "",
      phone: exporter.phone || "",
      address: exporter.address || "",
      authorizedSignatory: exporter.authorizedSignatory || "",
      exporterTypeId: exporter.exporterType?.id || "",
      // Consignee Information
      consigneeAddress: exporter.consigneeAddress || "",
      consigneeTelephone: exporter.consigneeTelephone || "",
      consigneeMobile: exporter.consigneeMobile || "",
      consigneeEmail: exporter.consigneeEmail || "",
      // Buyer Information
      buyerName: exporter.buyerName || "",
      buyerAddress: exporter.buyerAddress || "",
      // Exporter Details
      deliveryLocation: exporter.deliveryLocation || "",
      exporterTelephone: exporter.exporterTelephone || "",
      exporterEmail: exporter.exporterEmail || "",
      exporterWebsite: exporter.exporterWebsite || "",
      exporterLicenseNumber: exporter.exporterLicenseNumber || "",
      // Notified Party Information
      notifiedPartyName: exporter.notifiedPartyName || "",
      notifiedPartyAddress: exporter.notifiedPartyAddress || "",
      notifiedPartyEmail: exporter.notifiedPartyEmail || "",
      notifiedPartyContactPerson: exporter.notifiedPartyContactPerson || "",
      notifiedPartyTelephone: exporter.notifiedPartyTelephone || "",
      notifiedPartyMobile: exporter.notifiedPartyMobile || "",
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
          tin: form.tin,
          email: form.email,
          contactPerson: form.contactPerson,
          phone: form.phone,
          address: form.address,
          authorizedSignatory: form.authorizedSignatory,
          exporterTypeId: form.exporterTypeId || undefined,
          // Consignee Information
          consigneeAddress: form.consigneeAddress,
          consigneeTelephone: form.consigneeTelephone,
          consigneeMobile: form.consigneeMobile,
          consigneeEmail: form.consigneeEmail,
          // Buyer Information
          buyerName: form.buyerName,
          buyerAddress: form.buyerAddress,
          // Exporter Details
          deliveryLocation: form.deliveryLocation,
          exporterTelephone: form.exporterTelephone,
          exporterEmail: form.exporterEmail,
          exporterWebsite: form.exporterWebsite,
          exporterLicenseNumber: form.exporterLicenseNumber,
          // Notified Party Information
          notifiedPartyName: form.notifiedPartyName,
          notifiedPartyAddress: form.notifiedPartyAddress,
          notifiedPartyEmail: form.notifiedPartyEmail,
          notifiedPartyContactPerson: form.notifiedPartyContactPerson,
          notifiedPartyTelephone: form.notifiedPartyTelephone,
          notifiedPartyMobile: form.notifiedPartyMobile,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update exporter");
      }
      setSuccess("Exporter updated successfully!");
      setEditingExporter(null);
      setForm({
        name: "",
        tin: "",
        email: "",
        contactPerson: "",
        phone: "",
        address: "",
        authorizedSignatory: "",
        exporterTypeId: "",
        // Consignee Information
        consigneeAddress: "",
        consigneeTelephone: "",
        consigneeMobile: "",
        consigneeEmail: "",
        // Buyer Information
        buyerName: "",
        buyerAddress: "",
        // Exporter Details
        deliveryLocation: "",
        exporterTelephone: "",
        exporterEmail: "",
        exporterWebsite: "",
        exporterLicenseNumber: "",
        // Notified Party Information
        notifiedPartyName: "",
        notifiedPartyAddress: "",
        notifiedPartyEmail: "",
        notifiedPartyContactPerson: "",
        notifiedPartyTelephone: "",
        notifiedPartyMobile: "",
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
      <Header
        title="Manage Exporters"
        icon={<Building2 className="h-5 w-5" />}
        subtitle="Register exporters and manage exporter details."
      />
      <div className="my-6 px-4" style={{ width: "100%" }}>
        <BackLink href="/setup" label="Back to Settings" />
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl">
          <form
            onSubmit={editingExporter ? handleUpdateExporter : handleSubmit}
          >
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                {error && (
                  <div className="rounded-md bg-red-50 p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        {/* Error icon */}
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
                          Error Creating Exporter
                        </h3>
                        <div className="mt-2 text-sm text-red-700 whitespace-pre-wrap">
                          {error}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Name
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
                      htmlFor="exporterTypeId"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Exporter Type
                    </label>
                    <select
                      id="exporterTypeId"
                      name="exporterTypeId"
                      value={form.exporterTypeId}
                      onChange={handleSelectChange}
                      className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select exporter type</option>
                      {exporterTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="tin"
                      className="block text-sm font-medium text-gray-700"
                    >
                      TIN
                    </label>
                    <input
                      type="text"
                      name="tin"
                      id="tin"
                      value={form.tin}
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
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contactPerson"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Contact Person
                    </label>
                    <input
                      type="text"
                      name="contactPerson"
                      id="contactPerson"
                      value={form.contactPerson}
                      onChange={handleChange}
                      className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
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
                      type="text"
                      name="phone"
                      id="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="address"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      id="address"
                      value={form.address}
                      onChange={handleChange}
                      className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="authorizedSignatory"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Authorized Signatory
                    </label>
                    <input
                      type="text"
                      name="authorizedSignatory"
                      id="authorizedSignatory"
                      value={form.authorizedSignatory}
                      onChange={handleChange}
                      className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter authorized signatory name"
                    />
                  </div>
                </div>

                {/* Consignee and Buyer Information Side by Side */}
                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Consignee Information Section */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">
                      Consignee Information
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="consigneeAddress"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Consignee Address
                        </label>
                        <input
                          type="text"
                          name="consigneeAddress"
                          id="consigneeAddress"
                          value={form.consigneeAddress}
                          onChange={handleChange}
                          className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter consignee address"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="consigneeTelephone"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Consignee Telephone
                        </label>
                        <input
                          type="text"
                          name="consigneeTelephone"
                          id="consigneeTelephone"
                          value={form.consigneeTelephone}
                          onChange={handleChange}
                          className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter consignee telephone"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="consigneeMobile"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Consignee Mobile
                        </label>
                        <input
                          type="text"
                          name="consigneeMobile"
                          id="consigneeMobile"
                          value={form.consigneeMobile}
                          onChange={handleChange}
                          className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter consignee mobile"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="consigneeEmail"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Consignee Email
                        </label>
                        <input
                          type="email"
                          name="consigneeEmail"
                          id="consigneeEmail"
                          value={form.consigneeEmail}
                          onChange={handleChange}
                          className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter consignee email"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Buyer Information Section */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">
                      Buyer Information
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="buyerName"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Buyer Name
                        </label>
                        <input
                          type="text"
                          name="buyerName"
                          id="buyerName"
                          value={form.buyerName}
                          onChange={handleChange}
                          className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter buyer name"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="buyerAddress"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Buyer Address
                        </label>
                        <input
                          type="text"
                          name="buyerAddress"
                          id="buyerAddress"
                          value={form.buyerAddress}
                          onChange={handleChange}
                          className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter buyer address"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Exporter Details and Notified Party Information Side by Side */}
                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Exporter Details Section */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">
                      Exporter Details
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="deliveryLocation"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Delivery Location
                        </label>
                        <input
                          type="text"
                          name="deliveryLocation"
                          id="deliveryLocation"
                          value={form.deliveryLocation}
                          onChange={handleChange}
                          className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter delivery location"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="exporterTelephone"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Exporter Telephone
                        </label>
                        <input
                          type="text"
                          name="exporterTelephone"
                          id="exporterTelephone"
                          value={form.exporterTelephone}
                          onChange={handleChange}
                          className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter exporter telephone"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="exporterEmail"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Exporter Email
                        </label>
                        <input
                          type="email"
                          name="exporterEmail"
                          id="exporterEmail"
                          value={form.exporterEmail}
                          onChange={handleChange}
                          className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter exporter email"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="exporterWebsite"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Exporter Website
                        </label>
                        <input
                          type="text"
                          name="exporterWebsite"
                          id="exporterWebsite"
                          value={form.exporterWebsite}
                          onChange={handleChange}
                          className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="https://www.example.com"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="exporterLicenseNumber"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Exporter License Number
                        </label>
                        <input
                          type="text"
                          name="exporterLicenseNumber"
                          id="exporterLicenseNumber"
                          value={form.exporterLicenseNumber}
                          onChange={handleChange}
                          className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter exporter license number"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notified Party Information Section */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">
                      Notified Party Information
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="notifiedPartyName"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Name
                        </label>
                        <input
                          type="text"
                          name="notifiedPartyName"
                          id="notifiedPartyName"
                          value={form.notifiedPartyName}
                          onChange={handleChange}
                          className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter notified party name"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="notifiedPartyAddress"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Address
                        </label>
                        <input
                          type="text"
                          name="notifiedPartyAddress"
                          id="notifiedPartyAddress"
                          value={form.notifiedPartyAddress}
                          onChange={handleChange}
                          className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter notified party address"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="notifiedPartyEmail"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Email
                        </label>
                        <input
                          type="email"
                          name="notifiedPartyEmail"
                          id="notifiedPartyEmail"
                          value={form.notifiedPartyEmail}
                          onChange={handleChange}
                          className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter notified party email"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="notifiedPartyContactPerson"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Contact Person
                        </label>
                        <input
                          type="text"
                          name="notifiedPartyContactPerson"
                          id="notifiedPartyContactPerson"
                          value={form.notifiedPartyContactPerson}
                          onChange={handleChange}
                          className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter contact person name"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="notifiedPartyTelephone"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Telephone
                        </label>
                        <input
                          type="text"
                          name="notifiedPartyTelephone"
                          id="notifiedPartyTelephone"
                          value={form.notifiedPartyTelephone}
                          onChange={handleChange}
                          className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter notified party telephone"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="notifiedPartyMobile"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Mobile
                        </label>
                        <input
                          type="text"
                          name="notifiedPartyMobile"
                          id="notifiedPartyMobile"
                          value={form.notifiedPartyMobile}
                          onChange={handleChange}
                          className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter notified party mobile"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  {editingExporter && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingExporter(null);
                        setForm({
                          name: "",
                          tin: "",
                          email: "",
                          contactPerson: "",
                          phone: "",
                          address: "",
                          authorizedSignatory: "",
                          exporterTypeId: "",
                          // Consignee Information
                          consigneeAddress: "",
                          consigneeTelephone: "",
                          consigneeMobile: "",
                          consigneeEmail: "",
                          // Buyer Information
                          buyerName: "",
                          buyerAddress: "",
                          // Exporter Details
                          deliveryLocation: "",
                          exporterTelephone: "",
                          exporterEmail: "",
                          exporterWebsite: "",
                          exporterLicenseNumber: "",
                          // Notified Party Information
                          notifiedPartyName: "",
                          notifiedPartyAddress: "",
                          notifiedPartyEmail: "",
                          notifiedPartyContactPerson: "",
                          notifiedPartyTelephone: "",
                          notifiedPartyMobile: "",
                        });
                      }}
                      className="bg-gray-500 text-white px-6 py-2 rounded-md shadow hover:bg-gray-600 transition"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-md shadow hover:bg-blue-700 transition"
                  >
                    {editingExporter ? "Update Exporter" : "Create Exporter"}
                  </button>
                </div>
              </div>
            </div>
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <span className="ml-2 text-gray-500">Loading exporters...</span>
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
                          TIN
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
                          Exporter Type
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
                              {exporter.tin}
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
                              {exporter.exporterType?.name || "-"}
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
                                <PencilSquareIcon className="h-4 w-4 mr-1" />{" "}
                                Edit
                              </button>
                              <button
                                className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs flex items-center"
                                onClick={() =>
                                  handleDeleteExporter(exporter.id)
                                }
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
                          {Math.min(page * pageSize, exporters.length)}
                        </span>{" "}
                        of{" "}
                        <span className="font-medium">{exporters.length}</span>{" "}
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
                              Math.ceil(exporters.length / pageSize)
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
                                  Math.ceil(exporters.length / pageSize)
                                )
                              )
                            )
                          }
                          disabled={
                            page ===
                            Math.max(1, Math.ceil(exporters.length / pageSize))
                          }
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                            page ===
                            Math.max(1, Math.ceil(exporters.length / pageSize))
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
