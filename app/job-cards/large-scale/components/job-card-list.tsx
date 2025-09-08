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

interface LargeScaleJobCard {
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
  };
}

interface LargeScaleJobCardListProps {
  filters: {
    exporterId: string;
    exporterTypeId: string;
    startDate: string;
    endDate: string;
    status: string;
  };
}

export function LargeScaleJobCardList({ filters }: LargeScaleJobCardListProps) {
  const [jobCards, setJobCards] = useState<LargeScaleJobCard[]>([]);
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

      // Add type filter for large scale
      queryParams.append("type", "large_scale");

      const response = await fetch(`/api/job-cards?${queryParams.toString()}`);

      if (response.ok) {
        const data = await response.json();
        setJobCards(data.jobCards || []);
        setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
      } else {
        console.error("Failed to fetch large scale job cards");
      }
    } catch (error) {
      console.error("Error fetching large scale job cards:", error);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchJobCards();
  }, [fetchJobCards]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
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
      const response = await fetch(`/api/job-cards/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setJobCards(jobCards.filter((card) => card.id !== id));
        setDeleteModalOpen(false);
        setJobCardToDelete(null);
      } else {
        console.error("Failed to delete job card");
      }
    } catch (error) {
      console.error("Error deleting job card:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-400" />
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
                          {jobCard.referenceNumber.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center gap-4">
                        <p className="text-sm font-medium text-gray-900">
                          {jobCard.referenceNumber}
                        </p>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                            jobCard.status
                          )}`}
                        >
                          {jobCard.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                        <span>{jobCard.exporter.name}</span>
                        <span>
                          {formatDate(new Date(jobCard.receivedDate))}
                        </span>
                      </div>
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
                    <Link
                      href={`/job-cards/large-scale/${jobCard.id}/edit`}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="Edit"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </Link>
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
                  {Math.min(currentPage * itemsPerPage, jobCards.length)}
                </span>{" "}
                of <span className="font-medium">{jobCards.length}</span>{" "}
                results
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
