"use client";

import { withClientAuth } from "@/app/lib/with-client-auth";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowPathIcon, EyeIcon } from "@heroicons/react/24/outline";
import { Header } from "@/app/components/layout/header";
import { FileText, Loader2 } from "lucide-react";
import { formatDate } from "@/app/lib/utils";

function ValuationList() {
  const [jobCards, setJobCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const [referenceFilter, setReferenceFilter] = useState("");
  const [certificateFilter, setCertificateFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  useEffect(() => {
    fetchValuations();
  }, [currentPage]);

  const fetchValuations = async () => {
    setLoading(true);
    try {
      // Fetch both regular and large scale job cards with assays
      const params = new URLSearchParams();
      params.append("page", String(currentPage));
      params.append("limit", String(itemsPerPage));

      // Request only job cards that have assays (valuations) on the server side
      params.append("hasAssays", "true");
      if (referenceFilter) params.append("reference", referenceFilter);
      if (startDateFilter) params.append("startDate", startDateFilter);
      if (endDateFilter) params.append("endDate", endDateFilter);

      // Fetch regular job cards with assays
      const regularRes = await fetch(`/api/job-cards?${params.toString()}`);
      if (!regularRes.ok) throw new Error("Failed to fetch regular job cards");

      // Fetch large scale job cards with assays
      const largeScaleRes = await fetch(
        `/api/large-scale-job-cards?${params.toString()}`
      );
      if (!largeScaleRes.ok)
        throw new Error("Failed to fetch large scale job cards");

      const regularData = await regularRes.json();
      const largeScaleData = await largeScaleRes.json();

      // Filter regular job cards that have assays
      const regularValued = (regularData.jobCards || []).filter(
        (jc: any) => jc.assays && jc.assays.length > 0
      );

      // Filter large scale job cards that have assays
      const largeScaleValued = (largeScaleData.jobCards || []).filter(
        (jc: any) => jc._count?.assays > 0
      );

      // Add type indicator and combine both types
      const combinedValuations = [
        ...regularValued.map((jc: any) => ({
          ...jc,
          valuationType: "regular",
        })),
        ...largeScaleValued.map((jc: any) => ({
          ...jc,
          valuationType: "largeScale",
        })),
      ];

      // Apply certificate filter client-side (API doesn't support certificate filter)
      const certificateFiltered = certificateFilter
        ? combinedValuations.filter((jc: any) => {
            if (jc.valuationType === "regular") {
              const assay = jc.assays && jc.assays.length ? jc.assays[0] : null;
              return (
                assay?.humanReadableAssayNumber || assay?.certificateNumber
              )
                ?.toLowerCase()
                .includes(certificateFilter.toLowerCase());
            } else {
              // For large scale, check certificate numbers in assay data
              const assay = jc.assays && jc.assays.length ? jc.assays[0] : null;
              return (
                (assay?.humanReadableAssayNumber || assay?.certificateNumber)
                  ?.toLowerCase()
                  .includes(certificateFilter.toLowerCase()) ||
                assay?.securitySealNo
                  ?.toLowerCase()
                  .includes(certificateFilter.toLowerCase()) ||
                assay?.goldbodSealNo
                  ?.toLowerCase()
                  .includes(certificateFilter.toLowerCase())
              );
            }
          })
        : combinedValuations;

      setJobCards(certificateFiltered);
      // Calculate total pages based on combined results
      const totalRegular = regularData.total || 0;
      const totalLargeScale = largeScaleData.total || 0;
      const totalCombined = totalRegular + totalLargeScale;
      setTotalPages(Math.ceil(totalCombined / itemsPerPage));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mr-2" />
          <span className="text-gray-500">Loading valuations...</span>
        </div>
      ) : jobCards.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">
            No valuations found for regular or large scale job cards.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <div className="px-4 py-3 bg-white border-b">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600">Reference</label>
                  <input
                    value={referenceFilter}
                    onChange={(e) => setReferenceFilter(e.target.value)}
                    className="mt-1 border rounded px-2 py-1"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600">
                    Certificate/Seal #
                  </label>
                  <input
                    value={certificateFilter}
                    onChange={(e) => setCertificateFilter(e.target.value)}
                    className="mt-1 border rounded px-2 py-1"
                    placeholder="Search certificates or seals"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600">Start Date</label>
                  <input
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                    className="mt-1 border rounded px-2 py-1"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600">End Date</label>
                  <input
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                    className="mt-1 border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <button
                    onClick={() => {
                      setCurrentPage(1);
                      fetchValuations();
                    }}
                    className="inline-flex items-center px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exporter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobCards.map((jc) => {
                  const isLargeScale = jc.valuationType === "largeScale";
                  const assay = isLargeScale
                    ? jc.assays && jc.assays.length
                      ? jc.assays[0]
                      : null
                    : jc.assays && jc.assays.length
                    ? jc.assays[0]
                    : null;

                  return (
                    <tr key={jc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                        <Link
                          href={
                            isLargeScale
                              ? `/job-cards/large-scale/${jc.id}`
                              : `/job-cards/${jc.id}`
                          }
                          className="hover:underline"
                        >
                          {jc.referenceNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {jc.exporter?.name || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assay && assay.totalGoldValue
                          ? `GHS ${assay.totalGoldValue.toLocaleString()}`
                          : jc.valueGhs
                          ? `GHS ${jc.valueGhs.toLocaleString()}`
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            jc.status === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : jc.status === "ACTIVE"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {jc.status || "PENDING"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={
                            isLargeScale
                              ? `/job-cards/large-scale/${jc.id}`
                              : `/job-cards/${jc.id}`
                          }
                          className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination controls (same layout as job-cards) */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">
                    {jobCards.length === 0
                      ? 0
                      : (currentPage - 1) * itemsPerPage + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(
                      currentPage * itemsPerPage,
                      (currentPage - 1) * itemsPerPage + jobCards.length
                    )}
                  </span>{" "}
                  of <span className="font-medium">{jobCards.length}</span>{" "}
                  valuations
                </p>
              </div>
              <div>
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
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
                      setCurrentPage((p) => Math.min(p + 1, totalPages))
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

function ValuationsPage() {
  return (
    <>
      <Header
        title="Valuations"
        icon={<FileText className="h-5 w-5" />}
        subtitle="Comprehensive list of regular and large scale job cards with completed valuations and assay results."
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto"></div>
        </div>

        <div className="mt-6">
          <ValuationList />
        </div>
      </div>
    </>
  );
}

export default withClientAuth(ValuationsPage);
