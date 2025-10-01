"use client";

import { withClientAuth } from "@/app/lib/with-client-auth";
import { formatDate } from "@/app/lib/utils";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentTextIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import BackLink from "@/app/components/ui/BackLink";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/app/context/auth-context";

interface JobCardData {
  id: string;
  referenceNumber: string;
  humanReadableId: string;
  status: string;
  receivedDate: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;

  // Buyer/Importer information
  buyerName?: string;
  buyerIdNumber?: string;
  buyerPhone?: string;
  buyerAddress?: string;

  // Location and logistics
  destinationCountry?: string;
  teamLeader?: string;
  sourceOfGold?: string;
  numberOfBoxes?: number;

  // Measurements and values
  unitOfMeasure?: string;
  totalGrossWeight?: number;
  totalNetWeight?: number;
  fineness?: number;
  numberOfOunces?: number;
  pricePerOunce?: number;
  valueUsd?: number;
  valueGhs?: string | number;
  certificateNumber?: string;

  // Related data
  exporter: {
    name: string;
    buyerName?: string;
    buyerIdNumber?: string;
    buyerPhone?: string;
    buyerAddress?: string;
  };
  commodity?: { name: string };
  assays?: Array<Record<string, any>>;
  invoices?: Array<Record<string, any>>;
}

function JobCardDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const { token } = useAuth();
  const [jobCard, setJobCard] = useState<JobCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  useEffect(() => {
    const fetchJobCard = async () => {
      try {
        const response = await fetch(`/api/job-cards/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch job card");
        }
        const data = await response.json();
        setJobCard(data);
      } catch (error) {
        console.error("Error fetching job card:", error);
        setError("Could not load job card details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchJobCard();
  }, [id]);

  const handleDelete = async () => {
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    // Check if token is available
    if (!token) {
      toast.error("Authentication required. Please log in again.");
      return;
    }

    console.log("Token available:", token ? "Yes" : "No");
    console.log("Token preview:", token?.substring(0, 20) + "...");

    // Show loading toast
    toast.loading("Deleting job card...", { id: "delete-job-card" });

    try {
      // Try to get token from cookie as well
      const cookieToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("auth-token="))
        ?.split("=")[1];

      console.log("Cookie token available:", cookieToken ? "Yes" : "No");
      console.log(
        "Cookie token preview:",
        cookieToken?.substring(0, 20) + "..."
      );

      const authToken = cookieToken || token;

      const response = await fetch(`/api/job-cards/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        credentials: "include",
      });

      console.log("Delete response status:", response.status);
      console.log(
        "Delete response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (response.ok) {
        toast.dismiss("delete-job-card");
        toast.success("Job card deleted successfully!");
        setDeleteModalOpen(false);
        // Redirect to job cards list
        window.location.href = "/job-cards";
      } else {
        const errorData = await response.json();
        console.log("Delete error data:", errorData);
        toast.dismiss("delete-job-card");
        toast.error(
          `Failed to delete job card: ${errorData.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error deleting job card:", error);
      toast.dismiss("delete-job-card");
      toast.error("An error occurred while deleting the job card.");
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
  };

  const handleGenerateInvoice = async () => {
    if (!jobCard) return;

    setGeneratingInvoice(true);
    toast.loading("Generating invoice...", { id: "invoice-generation" });

    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          jobCardId: jobCard.id,
        }),
      });

      if (response.ok) {
        // Refresh the job card data to show the new invoice
        const updatedResponse = await fetch(`/api/job-cards/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (updatedResponse.ok) {
          const updatedData = await updatedResponse.json();
          setJobCard(updatedData);
        }
        toast.dismiss("invoice-generation");
        toast.success("Invoice generated successfully!");
      } else {
        const errorData = await response.json();
        toast.dismiss("invoice-generation");
        toast.error(
          `Failed to generate invoice: ${errorData.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast.dismiss("invoice-generation");
      toast.error("An error occurred while generating the invoice.");
    } finally {
      setGeneratingInvoice(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !jobCard) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error || "Failed to load job card details"}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <BackLink href="/job-cards" label="Back to Job Cards" />
        </div>
      </div>
    );
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Check if editing should be restricted
  const hasAssays = jobCard.assays && jobCard.assays.length > 0;
  const hasPaidInvoices =
    Array.isArray(jobCard.invoices) &&
    jobCard.invoices.some((inv: any) => inv.status === "paid");
  const canEdit = !hasAssays && !hasPaidInvoices;
  const canDelete = !hasAssays; // Can delete if no assays exist

  const badgeStatus =
    hasPaidInvoices || jobCard.status === "paid"
      ? "paid"
      : jobCard.assays && jobCard.assays.length > 0
      ? "completed"
      : jobCard.status;
  const badgeText = (() => {
    if (badgeStatus === "paid") return "Paid";
    if (badgeStatus === "completed") return "Completed";
    return (
      badgeStatus.charAt(0).toUpperCase() +
      badgeStatus.slice(1).replace("_", " ")
    );
  })();

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading job card...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
          <p className="text-red-700 dark:text-red-400 font-medium">
            Error loading job card
          </p>
          <p className="text-red-600 dark:text-red-300 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!jobCard) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-4">
          <p className="text-yellow-700 dark:text-yellow-400 font-medium">
            Job card not found
          </p>
          <p className="text-yellow-600 dark:text-yellow-300 text-sm mt-1">
            The requested job card could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        {/* Back link */}
        <div>
          <BackLink href="/job-cards" label="Back to Job Cards" />
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-3">
          {canEdit && (
            <Link
              href={`/job-cards/${id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Job Card
            </Link>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete Job Card
            </button>
          )}
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Job Card Details
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Complete information about the job card.
            </p>
          </div>
          <span
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
              badgeStatus
            )}`}
          >
            {badgeText}
          </span>
        </div>
        <div className="border-t border-gray-200">
          {/* Basic Information Section */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6">
            <h3 className="text-sm font-medium text-gray-900">
              Basic Information
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Job ID</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-semibold">
                  {jobCard!.humanReadableId}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Received Date
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {formatDate(new Date(jobCard!.receivedDate))}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                      badgeStatus
                    )}`}
                  >
                    {badgeText}
                  </span>
                </dd>
              </div>
              {jobCard!.certificateNumber && (
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Certificate Number
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {jobCard!.certificateNumber}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Parties Information Section */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">
              Parties Information
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Exporter
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {jobCard.exporter.name}
                  </dd>
                </div>
                {jobCard.exporter?.buyerName && (
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Importer Name
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {jobCard.exporter.buyerName}
                    </dd>
                  </div>
                )}
                {jobCard!.buyerIdNumber && (
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Importer ID Number
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {jobCard!.buyerIdNumber}
                    </dd>
                  </div>
                )}
                {jobCard!.buyerAddress && (
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Importer Address
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {jobCard!.buyerAddress}
                    </dd>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {jobCard!.buyerPhone && (
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Importer Phone
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {jobCard!.buyerPhone}
                    </dd>
                  </div>
                )}
                {jobCard!.destinationCountry && (
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Destination Country
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {jobCard!.destinationCountry}
                    </dd>
                  </div>
                )}
                {jobCard.teamLeader && (
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Exporter Authorized Signatory
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {jobCard.teamLeader}
                    </dd>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Commodity Information Section */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">
              Commodity Information
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              {jobCard.commodity && (
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Commodity
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {jobCard.commodity.name}
                  </dd>
                </div>
              )}
              {jobCard.sourceOfGold && (
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Source of Commodity
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {jobCard.sourceOfGold}
                  </dd>
                </div>
              )}
              {jobCard.numberOfBoxes !== null &&
                jobCard.numberOfBoxes !== undefined && (
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Number of Boxes
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {jobCard.numberOfBoxes}
                    </dd>
                  </div>
                )}
            </dl>
          </div>

          {/* Measurements & Quality Section */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">
              Measurements & Quality
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              {jobCard.unitOfMeasure && (
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Unit of Measure
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {jobCard.unitOfMeasure === "g"
                      ? "Grams"
                      : jobCard.unitOfMeasure === "kg"
                      ? "Kilograms"
                      : jobCard.unitOfMeasure}
                  </dd>
                </div>
              )}
              {jobCard.totalGrossWeight !== null &&
                jobCard.totalGrossWeight !== undefined && (
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Total Gross Weight
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {jobCard.totalGrossWeight?.toLocaleString()}{" "}
                      {jobCard.unitOfMeasure || "g"}
                    </dd>
                  </div>
                )}
              {jobCard.fineness !== null && jobCard.fineness !== undefined && (
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    % Fineness
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {jobCard.fineness}%
                  </dd>
                </div>
              )}
              {jobCard.totalNetWeight !== null &&
                jobCard.totalNetWeight !== undefined && (
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Total Net Weight
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {jobCard.totalNetWeight?.toLocaleString()}{" "}
                      {jobCard.unitOfMeasure || "g"}
                    </dd>
                  </div>
                )}
            </dl>
          </div>

          {/* Valuation Section */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Valuation</h3>
          </div>
          <div className="px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              {jobCard.numberOfOunces !== null &&
                jobCard.numberOfOunces !== undefined && (
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Number of Ounces
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {Number(jobCard.numberOfOunces).toFixed(3)}
                    </dd>
                  </div>
                )}
              {jobCard.pricePerOunce !== null &&
                jobCard.pricePerOunce !== undefined && (
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Price per Ounce (USD)
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      ${jobCard.pricePerOunce?.toLocaleString()}
                    </dd>
                  </div>
                )}
              {jobCard.valueUsd !== null && jobCard.valueUsd !== undefined && (
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Exporter Value (USD)
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    ${jobCard.valueUsd?.toLocaleString()}
                  </dd>
                </div>
              )}
              {jobCard.valueGhs && (
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Exporter Value (GHS)
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    GHS{" "}
                    {typeof jobCard.valueGhs === "string"
                      ? jobCard.valueGhs
                      : jobCard.valueGhs?.toLocaleString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Additional Information Section */}
          {/* {jobCard.notes && (
            <>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">
                  Additional Information
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-0">
                <dl className="sm:divide-y sm:divide-gray-200">
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Notes</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {jobCard.notes}
                    </dd>
                  </div>
                </dl>
              </div>
            </>
          )} */}
        </div>
      </div>

      {/* Assays Section */}
      {jobCard.assays && jobCard.assays.length > 0 ? (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Valuation
            </h3>
            <div className="flex items-center gap-3">
              <Link
                href={`/job-cards/${id}/assays/assay-results`}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <DocumentTextIcon className="w-4 h-4 mr-2" />
                Assay Results
              </Link>
              <Link
                href={`/job-cards/${id}/assays/${jobCard.assays[0].id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                {/* <EyeIcon className="w-4 h-4 mr-2" /> */}
                <ChartBarIcon className="w-4 h-4 mr-2" />
                {/* View Valuation */}
                Assay Report Analysis
              </Link>
              <Link
                href={`/job-cards/${id}/assays/certificate`}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <DocumentTextIcon className="w-4 h-4 mr-2" />
                Certificate of Assay
              </Link>
              {/* <Link
                href={`/job-cards/${id}/assays/assay-report-analysis`}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <ChartBarIcon className="w-4 h-4 mr-2" />
                Assay Report Analysis
              </Link> */}
            </div>
          </div>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {jobCard.assays.map((assay: any) => (
                <li key={assay.id}>
                  <Link href={`/job-cards/${id}/assays/certificate`}>
                    <div className="block hover:bg-gray-50">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            Certificate #{assay.certificateNumber}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Gold: {assay.goldContent}% | Silver:{" "}
                              {assay.silverContent}%
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              Assay Date:{" "}
                              {formatDate(new Date(assay.assayDate))}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Valuation
            </h3>
            <Link
              href={`/job-cards/${id}/assays/new`}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Perform Valuation
            </Link>
          </div>
          <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center text-gray-500">
            Valuation has not been performed for this job card yet.
          </div>
        </div>
      )}

      {/* Invoices Section: only show after valuation (assays) exist */}
      {jobCard && jobCard.assays && jobCard.assays.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Invoices
            </h3>
            {jobCard.invoices && jobCard.invoices.length > 0 ? (
              <Link
                href={`/job-cards/${id}/invoices/${jobCard.invoices[0].id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <EyeIcon className="w-4 h-4 mr-2" />
                View Invoice
              </Link>
            ) : (
              <button
                onClick={handleGenerateInvoice}
                disabled={generatingInvoice}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingInvoice ? "Generating..." : "Generate Invoice"}
              </button>
            )}
          </div>

          {jobCard.invoices && jobCard.invoices.length > 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {jobCard.invoices.map((invoice: any) => (
                  <li key={invoice.id}>
                    <Link href={`/job-cards/${id}/invoices/${invoice.id}`}>
                      <div className="block hover:bg-gray-50">
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-indigo-600 truncate">
                              Invoice
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <p
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  invoice.status === "paid"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {invoice.status.charAt(0).toUpperCase() +
                                  invoice.status.slice(1)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
                                Amount: GHS{" "}
                                {invoice.amount?.toLocaleString() || "0"}
                              </p>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <p>
                                Issue Date:{" "}
                                {invoice.issueDate
                                  ? formatDate(new Date(invoice.issueDate))
                                  : "Not set"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center text-gray-500">
              No invoices have been created for this job card yet.
            </div>
          )}
        </div>
      )}
    </div>
  );

  // return (
  //   <div className="px-4 sm:px-6 lg:px-8 py-8">
  //     {/* Delete Confirmation Modal */}
  //     {deleteModalOpen && (
  //       <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
  //         <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
  //           <button
  //             className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-red-400"
  //             onClick={cancelDelete}
  //             aria-label="Close"
  //           >
  //             <span className="text-xl">&times;</span>
  //           </button>
  //           <div className="flex items-center mb-4">
  //             <div className="flex-shrink-0">
  //               <TrashIcon className="h-6 w-6 text-red-600" />
  //             </div>
  //             <div className="ml-3">
  //               <h3 className="text-lg font-medium text-gray-900">
  //                 Delete Job Card
  //               </h3>
  //             </div>
  //           </div>
  //           <div className="mt-2">
  //             <p className="text-sm text-gray-500">
  //               Are you sure you want to delete this job card? This action
  //               cannot be undone and will permanently remove the job card and
  //               all associated data.
  //             </p>
  //           </div>
  //           <div className="mt-6 flex justify-end space-x-3">
  //             <button
  //               type="button"
  //               className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
  //               onClick={cancelDelete}
  //             >
  //               Cancel
  //             </button>
  //             <button
  //               type="button"
  //               className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
  //               onClick={confirmDelete}
  //             >
  //               Delete
  //             </button>
  //           </div>
  //         </div>
  //       </div>
  //     )}

  //     {loading ? (
  //       <div className="flex justify-center items-center py-10">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
  //         <span className="ml-2 text-gray-500">Loading job card...</span>
  //       </div>
  //     ) : error ? (
  //       <div className="bg-red-50 border border-red-200 rounded-md p-4">
  //         <div className="flex">
  //           <div className="flex-shrink-0">
  //             <XCircleIcon className="h-5 w-5 text-red-400" />
  //           </div>
  //           <div className="ml-3">
  //             <h3 className="text-sm font-medium text-red-800">Error</h3>
  //             <div className="mt-2 text-sm text-red-700">
  //               <p>{error}</p>
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     ) : jobCard ? (
  //       <>
  //         <div className="mb-6 flex items-center justify-between">
  //           {/* Back link */}
  //           <div>
  //             <BackLink href="/job-cards" label="Back to Job Cards" />
  //           </div>
  //           {canEdit && (
  //             <Link
  //               href={`/job-cards/${id}/edit`}
  //               className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
  //             >
  //               <PencilIcon className="h-4 w-4 mr-2" />
  //               Edit Job Card
  //             </Link>
  //           )}
  //           {canDelete && (
  //             <button
  //               onClick={handleDelete}
  //               className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
  //             >
  //               <TrashIcon className="h-4 w-4 mr-2" />
  //               Delete Job Card
  //             </button>
  //           )}
  //         </div>

  //         <div className="bg-white shadow overflow-hidden sm:rounded-lg">
  //           <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
  //             <div>
  //               <h3 className="text-lg leading-6 font-medium text-gray-900">
  //                 Job Card Details
  //               </h3>
  //               <p className="mt-1 max-w-2xl text-sm text-gray-500">
  //                 Complete information about the job card.
  //               </p>
  //             </div>
  //             <span
  //               className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
  //                 badgeStatus
  //               )}`}
  //             >
  //               {badgeText}
  //             </span>
  //           </div>
  //           <div className="border-t border-gray-200">
  //             <dl>
  //               <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
  //                 <dt className="text-sm font-medium text-gray-500">
  //                   Reference Number
  //                 </dt>
  //                 <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
  //                   {jobCard!.referenceNumber}
  //                 </dd>
  //               </div>
  //               <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
  //                 <dt className="text-sm font-medium text-gray-500">
  //                   Received Date
  //                 </dt>
  //                 <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
  //                   {formatDate(new Date(jobCard!.receivedDate))}
  //                 </dd>
  //               </div>
  //               <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
  //                 <dt className="text-sm font-medium text-gray-500">
  //                   Exporter
  //                 </dt>
  //                 <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
  //                   {jobCard?.exporter?.name || "Not specified"}
  //                 </dd>
  //               </div>
  //               <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
  //                 <dt className="text-sm font-medium text-gray-500">
  //                   Commodity
  //                 </dt>
  //                 <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
  //                   {jobCard?.commodity?.name || "Not specified"}
  //                 </dd>
  //               </div>
  //               <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
  //                 <dt className="text-sm font-medium text-gray-500">
  //                   Buyer Name
  //                 </dt>
  //                 <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
  //                   {jobCard?.exporter?.buyerName || "Not specified"}
  //                 </dd>
  //               </div>
  //               <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
  //                 <dt className="text-sm font-medium text-gray-500">
  //                   Buyer ID Number
  //                 </dt>
  //                 <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
  //                   {jobCard!.buyerIdNumber || "Not specified"}
  //                 </dd>
  //               </div>
  //               <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
  //                 <dt className="text-sm font-medium text-gray-500">
  //                   Buyer Phone
  //                 </dt>
  //                 <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
  //                   {jobCard?.buyerPhone || "Not specified"}
  //                 </dd>
  //               </div>
  //               <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
  //                 <dt className="text-sm font-medium text-gray-500">
  //                   Destination Country
  //                 </dt>
  //                 <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
  //                   {jobCard?.destinationCountry || "Not specified"}
  //                 </dd>
  //               </div>
  //               <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
  //                 <dt className="text-sm font-medium text-gray-500">
  //                   Exporter Authorized Signatory
  //                 </dt>
  //                 <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
  //                   {jobCard?.teamLeader || "Not specified"}
  //                 </dd>
  //               </div>
  //               <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
  //                 <dt className="text-sm font-medium text-gray-500">
  //                   Source of Gold
  //                 </dt>
  //                 <dd class
  //                 </dd>
  //               </div>
  //               <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
  //                 <dt className="text-sm font-medium text-gray-500">
  //                   Number of Boxes
  //                 </dt>
  //                 <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
  //                   {jobCard?.numberOfBoxes || "Not specified"}
  //                 </dd>
  //               </div>
  //               <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
  //                 <dt className="text-sm font-medium text-gray-500">
  //                   Unit of Measure
  //                 </dt>
  //                 <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
  //                   {jobCard?.unitOfMeasure || "Not specified"}
  //                 </dd>
  //               </div>
  //               <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
  //                 <dt className="text-sm font-medium text-gray-500">
  //                   Total Gross Weight
  //                 </dt>
  //                 <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
  //                   {jobCard?.totalGrossWeight
  //                     ? `${jobCard?.totalGrossWeight} ${
  //                         jobCard?.unitOfMeasure || ""
  //                       }`
  //                     : "Not specified"}
  //                 </dd>
  //               </div>
  //               <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
  //                 <dt className="text-sm font-medium text-gray-500">
  //                   Total Net Weight
  //                 </dt>
  //                 <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
  //                   {jobCard?.totalNetWeight
  //                     ? `${jobCard?.totalNetWeight} ${
  //                         jobCard?.unitOfMeasure || ""
  //                       }`
  //                     : "Not specified"}
  //                 </dd>
  //               </div>
  //               <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
  //                 <dt className="text-sm font-medium text-gray-500">
  //                   Fineness
  //                 </dt>
  //                 <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
  //                   {jobCard?.fineness
  //                     ? `${jobCard?.fineness}%`
  //                     : "Not specified"}
  //                 </dd>
  //               </div>
  //               <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
  //                 <dt className="text-sm font-medium text-gray-500">
  //                   Number of Ounces
  //                 </dt>
  //                 <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
  //                   {jobCard?.numberOfOunces || "Not specified"}
  //                 </dd>
  //               </div>
  //               <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
  //                 <dt className="text-sm font-medium text-gray-500">
  //                   Price per Ounce
  //                 </dt>
  //                 <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
  //                   {jobCard?.pricePerOunce
  //                     ? `$${jobCard?.pricePerOunce}`
  //                     : "Not specified"}
  //                 </dd>
  //               </div>
  //               <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
  //                 <dt className="text-sm font-medium text-gray-500">
  //                   Value (USD)
  //                 </dt>
  //                 <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
  //                   {jobCard?.valueUsd
  //                     ? `$${jobCard?.valueUsd}`
  //                     : "Not specified"}
  //                 </dd>
  //               </div>
  //               <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
  //                 <dt className="text-sm font-medium text-gray-500">
  //                   Value (GHS)
  //                 </dt>
  //                 <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
  //                   {jobCard?.valueGhs
  //                     ? `GHS ${jobCard?.valueGhs}`
  //                     : "Not specified"}
  //                 </dd>
  //               </div>
  //               <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
  //                 <dt className="text-sm font-medium text-gray-500">Notes</dt>
  //                 <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
  //                   {jobCard?.notes || "No notes"}
  //                 </dd>
  //               </div>
  //             </dl>
  //           </div>
  //         </div>

  //         {/* Assays Section */}
  //         <div className="mt-8">
  //           <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
  //             Assays
  //           </h3>
  //           {jobCard!.assays && jobCard!.assays!.length > 0 ? (
  //             <div className="bg-white shadow overflow-hidden sm:rounded-md">
  //               <ul role="list" className="divide-y divide-gray-200">
  //                 {jobCard!.assays!.map((assay: any, index: number) => (
  //                   <li key={index}>
  //                     <div className="px-4 py-4 sm:px-6">
  //                       <div className="flex items-center justify-between">
  //                         <div className="flex items-center">
  //                           <div className="flex-shrink-0">
  //                             <div className="h-10 w-10 rounded-full bg-blue-300 flex items-center justify-center">
  //                               <span className="text-sm font-medium text-blue-700">
  //                                 A{index + 1}
  //                               </span>
  //                             </div>
  //                           </div>
  //                           <div className="ml-4">
  //                             <div className="flex items-center">
  //                               <p className="text-sm font-medium text-gray-900">
  //                                 Assay #{index + 1}
  //                               </p>
  //                             </div>
  //                             <div className="flex space-x-4 text-sm text-gray-500">
  //                               <p>Gold: {assay.goldContent}%</p>
  //                               <p>Silver: {assay.silverContent || "N/A"}%</p>
  //                               <p>Date: {formatDate(assay.assayDate)}</p>
  //                             </div>
  //                           </div>
  //                         </div>
  //                       </div>
  //                     </div>
  //                   </li>
  //                 ))}
  //               </ul>
  //             </div>
  //           ) : (
  //             <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center text-gray-500">
  //               No assays have been performed for this job card yet.
  //             </div>
  //           )}
  //         </div>

  //         {/* Invoices Section */}
  //         <div className="mt-8">
  //           <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
  //             Invoices
  //           </h3>
  //           {jobCard!.invoices && jobCard!.invoices!.length > 0 ? (
  //             <div className="bg-white shadow overflow-hidden sm:rounded-md">
  //               <ul role="list" className="divide-y divide-gray-200">
  //                 {jobCard!.invoices!.map((invoice: any, index: number) => (
  //                   <li key={index}>
  //                     <div className="px-4 py-4 sm:px-6">
  //                       <div className="flex items-center justify-between">
  //                         <div className="flex items-center">
  //                           <div className="flex-shrink-0">
  //                             <div className="h-10 w-10 rounded-full bg-green-300 flex items-center justify-center">
  //                               <span className="text-sm font-medium text-green-700">
  //                                 I{index + 1}
  //                               </span>
  //                             </div>
  //                           </div>
  //                           <div className="ml-4">
  //                             <div className="flex items-center">
  //                               <p className="text-sm font-medium text-gray-900">
  //                                 {invoice.invoiceNumber}
  //                               </p>
  //                               <span
  //                                 className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
  //                                   invoice.status === "paid"
  //                                     ? "bg-green-100 text-green-800"
  //                                     : "bg-yellow-100 text-yellow-800"
  //                                 }`}
  //                               >
  //                                 {invoice.status}
  //                               </span>
  //                             </div>
  //                             <div className="flex space-x-4 text-sm text-gray-500">
  //                               <p>Amount: ${invoice.amount}</p>
  //                               <p>
  //                                 Issue Date: {formatDate(invoice.issueDate)}
  //                               </p>
  //                               <p>Due Date: {formatDate(invoice.dueDate)}</p>
  //                             </div>
  //                           </div>
  //                         </div>
  //                       </div>
  //                     </div>
  //                   </li>
  //                 ))}
  //               </ul>
  //             </div>
  //           ) : (
  //             <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center text-gray-500">
  //               No invoices have been created for this job card yet.
  //             </div>
  //           )}
  //         </div>
  //       </>
  //     ) : null}

  //     {/* Debug Modal State */}
  //     <div className="fixed top-4 right-4 bg-yellow-200 p-2 text-xs z-[10000]">
  //       Modal Open: {deleteModalOpen ? "TRUE" : "FALSE"}
  //       <br />
  //       Can Delete: {canDelete ? "TRUE" : "FALSE"}
  //       <br />
  //       Has Assays: {hasAssays ? "TRUE" : "FALSE"}
  //     </div>

  //     {/* Delete Confirmation Modal */}
  //     {deleteModalOpen && (
  //       <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
  //         <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
  //           <button
  //             className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-red-400"
  //             onClick={cancelDelete}
  //             aria-label="Close"
  //           >
  //             <span className="text-xl">&times;</span>
  //           </button>
  //           <div className="flex items-center mb-4">
  //             <div className="flex-shrink-0">
  //               <TrashIcon className="h-6 w-6 text-red-600" />
  //             </div>
  //             <div className="ml-3">
  //               <h3 className="text-lg font-medium text-gray-900">
  //                 Delete Job Card
  //               </h3>
  //             </div>
  //           </div>
  //           <div className="mt-2">
  //             <p className="text-sm text-gray-500">
  //               Are you sure you want to delete job card{" "}
  //               {jobCard?.referenceNumber}? This action cannot be undone and
  //               will permanently remove the job card and all associated data.
  //             </p>
  //           </div>
  //           <div className="mt-6 flex justify-end space-x-3">
  //             <button
  //               type="button"
  //               className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
  //               onClick={cancelDelete}
  //             >
  //               Cancel
  //             </button>
  //             <button
  //               type="button"
  //               className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
  //               onClick={confirmDelete}
  //             >
  //               Delete
  //             </button>
  //           </div>
  //         </div>
  //       </div>
  //     )}
  //   </div>
  // );
}

export default withClientAuth(JobCardDetailPage);
