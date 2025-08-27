"use client";

import { withClientAuth } from "@/app/lib/with-client-auth";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

function NewJobCardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exporters, setExporters] = useState<{ id: string; name: string }[]>([]);
  const [shipmentTypes, setShipmentTypes] = useState<{ id: string; name: string }[]>([]);
  
  const [formData, setFormData] = useState({
    referenceNumber: "",
    receivedDate: new Date().toISOString().split("T")[0], // Today's date as default
    exporterId: "",
    shipmentTypeId: "",
    status: "pending",
    notes: "",
  });

  useEffect(() => {
    // Fetch exporters and shipment types
    const fetchData = async () => {
      try {
        const [exportersRes, shipmentTypesRes] = await Promise.all([
          fetch("/api/exporters"),
          fetch("/api/shipment-types"),
        ]);

        if (exportersRes.ok) {
          const exportersData = await exportersRes.json();
          setExporters(exportersData);
        }

        if (shipmentTypesRes.ok) {
          const shipmentTypesData = await shipmentTypesRes.json();
          setShipmentTypes(shipmentTypesData);
        }
      } catch (error) {
        console.error("Error fetching form data:", error);
        setError("Failed to load form data. Please try again.");
      }
    };

    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/job-cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/job-cards/${data.id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create job card");
      }
    } catch (error) {
      console.error("Error creating job card:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/job-cards"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Job Cards
        </Link>
      </div>

      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Create New Job Card</h3>
            <p className="mt-1 text-sm text-gray-600">
              Fill in the details to create a new job card in the system.
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
                  href="/job-cards"
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    loading ? "opacity-75 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? "Creating..." : "Create Job Card"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default withClientAuth(NewJobCardPage);
