"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Loader2 } from "lucide-react";
import { formatDate } from "@/app/lib/utils";
import toast from "react-hot-toast";
import { useAuth } from "@/app/context/auth-context";

interface JobCard {
  id: string;
  referenceNumber: string;
  humanReadableId: string;
  receivedDate: string;
  status: string;
  exporter: {
    name: string;
    id: string;
  };
  _count?: {
    assays?: number;
    invoices?: number;
  };
  invoices?: Array<{
    id: string;
    status: string;
  }>;
}

interface JobCardListProps {
  filters: {
    exporterId: string;
    startDate: string;
    endDate: string;
    status: string;
    humanReadableId: string;
  };
}

export function JobCardList({ filters }: JobCardListProps) {
  const { hasRole } = useAuth();
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [jobCardToDelete, setJobCardToDelete] = useState<string | null>(null);

  const itemsPerPage = 10;

  const fetchJobCards = useCallback(async () => {
    try {
      setLoading(true);
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
      if (filters.status && filters.status !== "all") {
        queryParams.append("status", filters.status);
      }
      if (filters.humanReadableId) {
        queryParams.append("humanReadableId", filters.humanReadableId);
      }

      queryParams.append("page", currentPage.toString());
      queryParams.append("limit", itemsPerPage.toString());

      const response = await fetch(`/api/job-cards?${queryParams.toString()}`);

      if (response.ok) {
        const data = await response.json();
        setJobCards(data.jobCards || []);
        setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
      } else {
        console.error("Failed to fetch job cards");
      }
    } catch (error) {
      console.error("Error fetching job cards:", error);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchJobCards();
  }, [fetchJobCards]);
  console.log({ jobCards });

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "pending":
        return "bg-blue-100 text-blue-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDelete = async (jobCardId: string) => {
    setJobCardToDelete(jobCardId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!jobCardToDelete) return;

    // Show loading toast
    toast.loading("Deleting job card...", { id: "delete-job-card" });

    try {
      const response = await fetch(`/api/job-cards/${jobCardToDelete}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.dismiss("delete-job-card");
        toast.success("Job card deleted successfully!");
        // Refresh the job cards list
        fetchJobCards();
        setDeleteModalOpen(false);
        setJobCardToDelete(null);
      } else {
        const errorData = await response.json();
        toast.dismiss("delete-job-card");
        toast.error(
          `Failed to delete job card: ${errorData.error || "Unknown error"}`
        );
      }
    } catch (error) {
      toast.dismiss("delete-job-card");
      toast.error("An error occurred while deleting the job card.");
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setJobCardToDelete(null);
  };

  const jobCardsList = (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mr-2" />
          <span className="text-gray-500">Loading job cards...</span>
        </div>
      ) : jobCards.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">
            No job cards found matching the filters.
          </p>
        </div>
      ) : (
        <>
          <ul role="list" className="divide-y divide-gray-200">
            {jobCards.map((jobCard) => (
              <li key={jobCard.id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {jobCard.humanReadableId.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">
                          {jobCard.humanReadableId}
                        </p>
                        <span
                          className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                            jobCard.status
                          )}`}
                        >
                          {jobCard.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <span>{jobCard.exporter.name}</span>
                        <span className="mx-2">•</span>
                        <span>
                          Received: {formatDate(jobCard.receivedDate)}
                        </span>
                        {jobCard._count && (
                          <>
                            <span className="mx-2">•</span>
                            <span>
                              Assays: {jobCard._count.assays || 0} | Invoices:{" "}
                              {jobCard._count.invoices || 0}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/job-cards/${jobCard.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </Link>
                    {hasRole(["SUPERADMIN", "ADMIN"]) && (
                      <Link
                        href={`/job-cards/${jobCard.id}/edit`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </Link>
                    )}
                    {hasRole(["SUPERADMIN", "ADMIN"]) && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(jobCard.id);
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Delete job card and all associated assays and invoices"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          {totalPages > 1 && (
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
                      {Math.min(
                        currentPage * itemsPerPage,
                        totalPages * itemsPerPage
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">
                      {totalPages * itemsPerPage}
                    </span>{" "}
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
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
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
                      )
                    )}
                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <>
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
                  onClick={() => jobCardToDelete && confirmDelete()}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-full ml-2"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {jobCardsList}
    </>
  );
}
