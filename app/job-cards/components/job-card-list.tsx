"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowPathIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { formatDate } from "@/app/lib/utils";

interface JobCard {
  id: string;
  referenceNumber: string;
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
    exporterTypeId: string;
    startDate: string;
    endDate: string;
    status: string;
  };
}

export function JobCardList({ filters }: JobCardListProps) {
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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

      if (filters.exporterTypeId) {
        queryParams.append("exporterTypeId", filters.exporterTypeId);
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

      // Add pagination
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

  const handleDelete = async (jobCardId: string) => {
    console.log("Delete button clicked for job card:", jobCardId);
    setJobCardToDelete(jobCardId);
    setDeleteModalOpen(true);
    console.log("Modal state set to open");
  };

  const confirmDelete = async () => {
    if (!jobCardToDelete) return;

    try {
      const response = await fetch(`/api/job-cards/${jobCardToDelete}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Refresh the job cards list
        fetchJobCards();
        setDeleteModalOpen(false);
        setJobCardToDelete(null);
      } else {
        const errorData = await response.json();
        alert(
          `Failed to delete job card: ${errorData.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error deleting job card:", error);
      alert("An error occurred while deleting the job card.");
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setJobCardToDelete(null);
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          {/* <span className="ml-2 text-gray-500">Loading job cards...</span> */}
        </div>
      ) : jobCards.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">
            No job cards found matching the filters.
          </p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-gray-200">
            {jobCards.map((jobCard) => (
              <li key={jobCard.id}>
                <div className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {jobCard.referenceNumber}
                        </p>
                        {/* If the job card has assays, treat it as Completed for the badge */}
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

                          let statusText =
                            jobCard.status.charAt(0).toUpperCase() +
                            jobCard.status.slice(1).replace("_", " ");
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
                              className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                                statusKey
                              )}`}
                            >
                              {statusText}
                            </span>
                          );
                        })()}
                      </div>
                      <div className="flex space-x-2">
                        <Link
                          href={`/job-cards/${jobCard.id}`}
                          className="inline-flex items-center p-1.5 border border-gray-300 rounded-md text-xs font-medium bg-white hover:bg-gray-50 text-gray-700"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View
                        </Link>
                        {(!jobCard._count?.assays ||
                          jobCard._count.assays === 0) && (
                          <Link
                            href={`/job-cards/${jobCard.id}/edit`}
                            className="inline-flex items-center p-1.5 border border-gray-300 rounded-md text-xs font-medium bg-white hover:bg-gray-50 text-gray-700"
                          >
                            <PencilSquareIcon className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                        )}
                        {(!jobCard._count?.assays ||
                          jobCard._count.assays === 0) && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log(
                                "Delete button clicked for:",
                                jobCard.id
                              );
                              handleDelete(jobCard.id);
                            }}
                            className="inline-flex items-center p-1.5 border border-red-300 rounded-md text-xs font-medium bg-white hover:bg-red-50 text-red-700"
                          >
                            <TrashIcon className="h-4 w-4 mr-1" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          Exporter: {jobCard.exporter.name}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          Received: {formatDate(new Date(jobCard.receivedDate))}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
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
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === 1
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border ${
                          currentPage === page
                            ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        } text-sm font-medium`}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === totalPages
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
  );

  return (
    <>
      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-red-400"
              onClick={cancelDelete}
              aria-label="Close"
            >
              <span className="text-xl">&times;</span>
            </button>
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Delete Job Card
                </h3>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete job card: {jobCardToDelete}?
                This action cannot be undone and will permanently remove the job
                card and all associated data.
              </p>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={cancelDelete}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <span className="ml-2 text-gray-500">Loading job cards...</span>
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
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {jobCard.referenceNumber.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">
                              {jobCard.referenceNumber}
                            </p>
                            {(() => {
                              const hasAssays =
                                jobCard._count?.assays &&
                                jobCard._count.assays > 0;
                              const statusText = hasAssays
                                ? "Completed"
                                : jobCard.status.charAt(0).toUpperCase() +
                                  jobCard.status.slice(1).replace("_", " ");
                              const statusKey = hasAssays
                                ? "completed"
                                : jobCard.status;
                              return (
                                <span
                                  className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                                    statusKey
                                  )}`}
                                >
                                  {statusText}
                                </span>
                              );
                            })()}
                          </div>
                          <div className="flex space-x-2">
                            <Link
                              href={`/job-cards/${jobCard.id}`}
                              className="inline-flex items-center p-1.5 border border-gray-300 rounded-md text-xs font-medium bg-white hover:bg-gray-50 text-gray-700"
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              View
                            </Link>
                            {(!jobCard._count?.assays ||
                              jobCard._count.assays === 0) && (
                              <Link
                                href={`/job-cards/${jobCard.id}/edit`}
                                className="inline-flex items-center p-1.5 border border-gray-300 rounded-md text-xs font-medium bg-white hover:bg-gray-50 text-gray-700"
                              >
                                <PencilSquareIcon className="h-4 w-4 mr-1" />
                                Edit
                              </Link>
                            )}
                            {(!jobCard._count?.assays ||
                              jobCard._count.assays === 0) && (
                              <button
                                onClick={() => handleDelete(jobCard.id)}
                                className="inline-flex items-center p-1.5 border border-red-300 rounded-md text-xs font-medium bg-white hover:bg-red-50 text-red-700"
                              >
                                <TrashIcon className="h-4 w-4 mr-1" />
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              Exporter: {jobCard.exporter.name}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <p className="text-sm text-gray-500">
                              Received:{" "}
                              {formatDate(new Date(jobCard.receivedDate))}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === 1
                      ? "text-gray-300 cursor-not-allowed bg-gray-50"
                      : "text-gray-700 bg-white hover:bg-gray-50"
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === totalPages
                      ? "text-gray-300 cursor-not-allowed bg-gray-50"
                      : "text-gray-700 bg-white hover:bg-gray-50"
                  }`}
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
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
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
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === totalPages
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
