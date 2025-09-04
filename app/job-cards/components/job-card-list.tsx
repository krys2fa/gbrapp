"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowPathIcon,
  EyeIcon,
  PencilSquareIcon,
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
  };
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
  const itemsPerPage = 10;

  useEffect(() => {
    fetchJobCards();
  }, [filters, currentPage]);

  const fetchJobCards = async () => {
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
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
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

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin" />
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
}
