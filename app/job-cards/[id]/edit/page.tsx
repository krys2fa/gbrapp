"use client";

import { withClientAuth } from "@/app/lib/with-client-auth";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

function EditJobCardPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [exporters, setExporters] = useState<
    { id: string; name: string; exporterType: { id: string; name: string } }[]
  >([]);
  const [exporterTypes, setExporterTypes] = useState<
    { id: string; name: string }[]
  >([]);
  const [shipmentTypes, setShipmentTypes] = useState<
    { id: string; name: string }[]
  >([]);

  const [formData, setFormData] = useState({
    referenceNumber: "",
    receivedDate: "",
    exporterId: "",
    exporterTypeId: "",
    shipmentTypeId: "",
    status: "",
    notes: "",
  });

  useEffect(() => {
    // Fetch job card data and reference data
    const fetchData = async () => {
      try {
        const [jobCardRes, exporterTypesRes, exportersRes, shipmentTypesRes] =
          await Promise.all([
            fetch(`/api/job-cards/${id}`),
            fetch("/api/exporter-types"),
            fetch("/api/exporters"),
            fetch("/api/shipment-types"),
          ]);

        if (jobCardRes.ok) {
          const jobCardData = await jobCardRes.json();
          // Get the exporter type ID from the exporter data
          let exporterTypeId = "";

          if (jobCardData.exporter && jobCardData.exporter.exporterType) {
            exporterTypeId = jobCardData.exporter.exporterType.id;
          }

          setFormData({
            referenceNumber: jobCardData.referenceNumber,
            receivedDate: new Date(jobCardData.receivedDate)
              .toISOString()
              .split("T")[0],
            exporterId: jobCardData.exporterId,
            exporterTypeId: exporterTypeId,
            shipmentTypeId: jobCardData.shipmentTypeId,
            status: jobCardData.status,
            notes: jobCardData.notes || "",
          });
        } else {
          throw new Error("Failed to fetch job card");
        }

        if (exporterTypesRes.ok) {
          const exporterTypesData = await exporterTypesRes.json();
          setExporterTypes(exporterTypesData);
        }

        if (exportersRes.ok) {
          const exportersData = await exportersRes.json();
          setExporters(exportersData);
        }

        if (shipmentTypesRes.ok) {
          const shipmentTypesData = await shipmentTypesRes.json();
          setShipmentTypes(shipmentTypesData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load job card data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Filter exporters when exporter type changes
  useEffect(() => {
    if (formData.exporterTypeId) {
      const fetchFilteredExporters = async () => {
        try {
          const response = await fetch(
            `/api/exporters?exporterTypeId=${formData.exporterTypeId}`
          );
          if (response.ok) {
            const data = await response.json();
            setExporters(data);
            // Clear selected exporter if it doesn't belong to this type
            const exporterExists = data.some(
              (exporter: { id: string }) => exporter.id === formData.exporterId
            );
            if (!exporterExists && formData.exporterId) {
              setFormData((prev) => ({ ...prev, exporterId: "" }));
            }
          }
        } catch (error) {
          console.error("Error fetching exporters by type:", error);
        }
      };

      fetchFilteredExporters();
    }
  }, [formData.exporterTypeId, formData.exporterId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/job-cards/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push(`/job-cards/${id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update job card");
      }
    } catch (error) {
      console.error("Error updating job card:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href={`/job-cards/${id}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Job Card
        </Link>
      </div>

      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Edit Job Card
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Update the details of this job card.
            </p>
          </div>
        </div>

        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                {error && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Error
                        </h3>
                        <div className="text-sm text-red-700">{error}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="referenceNumber"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Reference Number *
                    </label>
                    <input
                      type="text"
                      name="referenceNumber"
                      id="referenceNumber"
                      required
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      value={formData.referenceNumber}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="receivedDate"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Received Date *
                    </label>
                    <input
                      type="date"
                      name="receivedDate"
                      id="receivedDate"
                      required
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      value={formData.receivedDate}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="exporterTypeId"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Exporter Type
                    </label>
                    <select
                      id="exporterTypeId"
                      name="exporterTypeId"
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.exporterTypeId}
                      onChange={handleChange}
                    >
                      <option value="">Select Exporter Type</option>
                      {exporterTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="exporterId"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Exporter *
                    </label>
                    <select
                      id="exporterId"
                      name="exporterId"
                      required
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.exporterId}
                      onChange={handleChange}
                    >
                      <option value="">Select an exporter</option>
                      {exporters.map((exporter) => (
                        <option key={exporter.id} value={exporter.id}>
                          {exporter.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="shipmentTypeId"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Shipment Type *
                    </label>
                    <select
                      id="shipmentTypeId"
                      name="shipmentTypeId"
                      required
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.shipmentTypeId}
                      onChange={handleChange}
                    >
                      <option value="">Select a shipment type</option>
                      {shipmentTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-6">
                    <label
                      htmlFor="status"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="col-span-6">
                    <label
                      htmlFor="notes"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md"
                      placeholder="Additional information or notes about this job card"
                      value={formData.notes}
                      onChange={handleChange}
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <Link
                  href={`/job-cards/${id}`}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    saving ? "opacity-75 cursor-not-allowed" : ""
                  }`}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default withClientAuth(EditJobCardPage);
