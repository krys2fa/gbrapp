"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Loader2 } from "lucide-react";
import { formatDate, formatCurrency } from "@/app/lib/utils";
import toast from "react-hot-toast";
import { useAuth } from "@/app/context/auth-context";

interface LargeScaleJobCard {
  id: string;
  referenceNumber: string;
  humanReadableId: string;
  receivedDate: string;
  status: string;
  exporter: {
    name: string;
    id: string;
    exporterType?: {
      id: string;
      name: string;
    };
  };
  commodities?: string[];
  unitOfMeasure?: string;
  assaySummary?: {
    id: string;
    method: string;
    pieces: number;
    totalNetGoldWeight: number;
    totalNetSilverWeight: number;
    totalNetGoldWeightOz: number;
    totalNetSilverWeightOz: number;
    totalGoldValue: number;
    totalSilverValue: number;
    totalCombinedValue: number;
    totalValueGhs: number;
    dateOfAnalysis: string;
    signatory: string;
    measurementCount: number;
  } | null;
  _count?: {
    assays?: number;
    invoices?: number;
  };
  invoices?: Array<{
    id: string;
    status: string;
  }>;
}

interface LargeScaleJobCardListProps {
  filters: {
    exporterId: string;
    startDate: string;
    endDate: string;
    status: string;
    humanReadableId: string;
  };
}

export function LargeScaleJobCardList({ filters }: LargeScaleJobCardListProps) {
  const { hasRole } = useAuth();
  const [jobCards, setJobCards] = useState<LargeScaleJobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [jobCardToDelete, setJobCardToDelete] = useState<string | null>(null);
  const itemsPerPage = 10;

  const fetchJobCards = useCallback(async () => {
    setLoading(true);
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams();

      if (filters.exporterId) {
        queryParams.append("exporterId", filters.exporterId);
      }

      if (filters.startDate) {
        queryParams.append("startDate", filters.startDate);
      }

      if (filters.endDate) {
        queryParams.append("endDate", filters.endDate);
      }

      if (filters.status) {
        queryParams.append("status", filters.status);
      }

      if (filters.humanReadableId) {
        queryParams.append("humanReadableId", filters.humanReadableId);
      }

      // Add pagination
      queryParams.append("page", currentPage.toString());
      queryParams.append("limit", itemsPerPage.toString());

      const token = localStorage.getItem("auth-token");
      const response = await fetch(
        `/api/large-scale-job-cards/assays/summaries?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();

        // The assays/summaries endpoint already returns data in the expected format
        const transformedJobCards = data.assaySummaries.map((summary: any) => ({
          id: summary.id,
          humanReadableId: summary.humanReadableId,
          referenceNumber: summary.referenceNumber,
          receivedDate: summary.receivedDate,
          status: summary.status,
          exporter: {
            name: summary.exporter.name,
            exporterType: {
              name: summary.exporter.exporterType,
            },
          },
          commodities: summary.commodities,
          unitOfMeasure: summary.unitOfMeasure,
          assaySummary: summary.assaySummary,
        }));

        setJobCards(transformedJobCards);
        setTotalPages(data.totalPages);
        setTotalItems(data.total);
      } else {
        let errorMsg = `Failed to fetch large scale job cards (Status: ${response.status})`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMsg += `: ${errorData.error}`;
          }
        } catch (parseError) {
          console.warn("Could not parse error response as JSON:", parseError);
        }
        console.error(`API Error ${response.status}:`, errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `Network error: ${error.message}`
          : "An unexpected error occurred while loading job cards";
      console.error("Fetch error:", error);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchJobCards();
  }, [fetchJobCards]);

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
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDelete = async (id: string) => {
    try {
      toast.loading("Deleting job card...", { id: "delete-job-card" });

      const token = localStorage.getItem("auth-token");
      if (!token) {
        toast.dismiss("delete-job-card");
        toast.error("No authentication token found. Please log in again.");
        return;
      }

      const response = await fetch(`/api/large-scale-job-cards/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setJobCards(jobCards.filter((card) => card.id !== id));
        setDeleteModalOpen(false);
        setJobCardToDelete(null);
        toast.dismiss("delete-job-card");
        toast.success("Job card deleted successfully!");
      } else {
        let errorMsg = `Failed to delete job card (Status: ${response.status})`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMsg += `: ${errorData.error}`;
          }
        } catch (parseError) {
          console.warn("Could not parse error response as JSON:", parseError);
        }
        console.error(`Delete API Error ${response.status}:`, errorMsg);
        toast.dismiss("delete-job-card");
        toast.error(errorMsg);
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `Network error: ${error.message}`
          : "An unexpected error occurred while deleting the job card";
      console.error("Delete error:", error);
      toast.dismiss("delete-job-card");
      toast.error(errorMsg);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mr-2" />
        <span className="text-gray-500">Loading large scale job cards...</span>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul role="list" className="divide-y divide-gray-200">
        {jobCards.length === 0 ? (
          <li className="px-6 py-12 text-center">
            <div className="text-gray-500">
              <p className="text-lg font-medium">
                No large scale job cards found
              </p>
              <p className="mt-1 text-sm">
                Get started by creating your first large scale job card.
              </p>
            </div>
          </li>
        ) : (
          jobCards.map((jobCard) => (
            <li key={jobCard.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {jobCard.humanReadableId.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center gap-4">
                        <p className="text-sm font-medium text-gray-900">
                          {jobCard.humanReadableId}
                        </p>
                        {(() => {
                          const hasAssays = !!(
                            jobCard._count &&
                            jobCard._count.assays &&
                            jobCard._count.assays > 0
                          );
                          const hasPaidInvoices = !!(
                            jobCard.invoices &&
                            jobCard.invoices.some(
                              (invoice) => invoice.status === "paid"
                            )
                          );

                          let statusText = jobCard.status.replace("_", " ");
                          let statusKey = jobCard.status;

                          if (hasPaidInvoices) {
                            statusText = "Paid";
                            statusKey = "paid";
                          } else if (hasAssays) {
                            statusText = "Completed";
                            statusKey = "completed";
                          }

                          return (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                                statusKey
                              )}`}
                            >
                              {statusText}
                            </span>
                          );
                        })()}
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                        <span>{jobCard.exporter.name}</span>
                        <span>
                          {formatDate(new Date(jobCard.receivedDate))}
                        </span>
                        {jobCard.commodities &&
                          jobCard.commodities.length > 0 && (
                            <span>{jobCard.commodities.join(", ")}</span>
                          )}
                      </div>
                      {jobCard.assaySummary && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-md">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            <div>
                              <span className="font-medium text-gray-700">
                                Assay Date:
                              </span>
                              <div className="text-gray-600">
                                {jobCard.assaySummary?.dateOfAnalysis
                                  ? formatDate(
                                      new Date(
                                        jobCard.assaySummary.dateOfAnalysis
                                      )
                                    )
                                  : "N/A"}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">
                                Gold (oz):
                              </span>
                              <div className="text-gray-600">
                                {jobCard.assaySummary?.totalNetGoldWeightOz !=
                                null
                                  ? jobCard.assaySummary.totalNetGoldWeightOz.toFixed(
                                      3
                                    )
                                  : "0.000"}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">
                                Silver (oz):
                              </span>
                              <div className="text-gray-600">
                                {jobCard.assaySummary?.totalNetSilverWeightOz !=
                                null
                                  ? jobCard.assaySummary.totalNetSilverWeightOz.toFixed(
                                      3
                                    )
                                  : "0.000"}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">
                                Total Value (GHS):
                              </span>
                              <div className="text-gray-600">
                                {jobCard.assaySummary?.totalValueGhs != null
                                  ? formatCurrency(
                                      jobCard.assaySummary.totalValueGhs,
                                      "GHS",
                                      false
                                    )
                                  : formatCurrency(0, "GHS", false)}
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Method: {jobCard.assaySummary?.method || "N/A"} |
                            Pieces: {jobCard.assaySummary?.pieces || "N/A"} |
                            Signatory:{" "}
                            {jobCard.assaySummary?.signatory || "N/A"}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/job-cards/large-scale/${jobCard.id}`}
                      className="text-indigo-600 hover:text-indigo-900 p-1"
                      title="View"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </Link>
                    {hasRole(["SUPERADMIN", "ADMIN"]) && (
                      <Link
                        href={`/job-cards/large-scale/${jobCard.id}/edit`}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Edit"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </Link>
                    )}
                    {hasRole(["SUPERADMIN", "ADMIN"]) && (
                      <button
                        onClick={() => {
                          setJobCardToDelete(jobCard.id);
                          setDeleteModalOpen(true);
                        }}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>

      {/* Pagination */}
      {jobCards.length > 0 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, totalItems)}
                </span>{" "}
                of <span className="font-medium">{totalItems}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>‹
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = Math.max(1, currentPage - 2) + i;
                  if (page > totalPages) return null;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>›
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                Delete Job Card
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this job card? This action
                  cannot be undone.
                </p>
              </div>
              <div className="flex items-center px-4 py-3">
                <button
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setJobCardToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-900 text-base font-medium rounded-md w-full mr-2"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    jobCardToDelete && handleDelete(jobCardToDelete)
                  }
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-full ml-2"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
