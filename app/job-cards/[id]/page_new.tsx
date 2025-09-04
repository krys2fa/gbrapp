"use client";

import { withClientAuth } from "@/app/lib/with-client-auth";
import { useState, useEffect } from "react";
import Link from "next/link";
import { PencilIcon } from "@heroicons/react/24/outline";
import BackLink from "@/app/components/ui/BackLink";
import { formatDate } from "@/app/lib/utils";
import { useParams } from "next/navigation";

interface JobCardData {
  id: string;
  referenceNumber: string;
  status: string;
  receivedDate: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;

  // Buyer/Importer information
  buyerName?: string;
  buyerIdNumber?: string;
  buyerPhone?: string;

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

  // Related data
  exporter: { name: string };
  commodity?: { name: string };
  assays?: Array<Record<string, any>>;
  invoices?: Array<Record<string, any>>;
}

function JobCardDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const [jobCard, setJobCard] = useState<JobCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchJobCard = async () => {
      try {
        const response = await fetch(`/api/job-cards/${id}`);
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

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
            </div>
          </div>
        </div>
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

  // If any invoice is paid or jobCard.status is 'paid', show Paid badge.
  const hasPaidInvoice =
    Array.isArray(jobCard.invoices) &&
    jobCard.invoices.some((inv: any) => inv.status === "paid");
  const badgeStatus =
    hasPaidInvoice || jobCard.status === "paid"
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

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        {/* Back link */}
        <div>
          <BackLink href="/job-cards" label="Back to Job Cards" />
        </div>
        <Link
          href={`/job-cards/${id}/edit`}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <PencilIcon className="h-4 w-4 mr-2" />
          Edit Job Card
        </Link>
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
                <dt className="text-sm font-medium text-gray-500">
                  Reference Number
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {jobCard.referenceNumber}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Received Date
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {formatDate(new Date(jobCard.receivedDate))}
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
            </dl>
          </div>

          {/* Parties Information Section */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">
              Parties Information
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Exporter</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {jobCard.exporter.name}
                </dd>
              </div>
              {jobCard.buyerName && (
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Importer Name
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {jobCard.buyerName}
                  </dd>
                </div>
              )}
              {jobCard.buyerIdNumber && (
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Importer ID Number
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {jobCard.buyerIdNumber}
                  </dd>
                </div>
              )}
              {jobCard.buyerPhone && (
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Importer Phone
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {jobCard.buyerPhone}
                  </dd>
                </div>
              )}
              {jobCard.destinationCountry && (
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Destination Country
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {jobCard.destinationCountry}
                  </dd>
                </div>
              )}
              {jobCard.teamLeader && (
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Team Leader
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {jobCard.teamLeader}
                  </dd>
                </div>
              )}
            </dl>
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
                      {jobCard.numberOfOunces}
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
          {jobCard.notes && (
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
          )}
        </div>
      </div>

      {/* Assays Section */}
      {jobCard.assays && jobCard.assays.length > 0 && (
        <div className="mt-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Assays
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Assay results associated with this job card.
              </p>
            </div>
            <div className="border-t border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sample ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Weight (g)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fineness
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fine Gold
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {jobCard.assays?.map((assay: any, index: number) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {assay.sampleId || `Sample ${index + 1}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {assay.weight}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {assay.fineness}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {assay.fineGold}g
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Completed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoices Section */}
      {jobCard.invoices && jobCard.invoices.length > 0 && (
        <div className="mt-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Invoices
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Invoices generated for this job card.
              </p>
            </div>
            <div className="border-t border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invoice Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {jobCard.invoices?.map((invoice: any, index: number) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {invoice.invoiceNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${invoice.amount?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(new Date(invoice.createdAt))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                              invoice.status
                            )}`}
                          >
                            {invoice.status === "paid"
                              ? "Paid"
                              : invoice.status.charAt(0).toUpperCase() +
                                invoice.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No invoices message */}
      {(!jobCard.invoices || jobCard.invoices.length === 0) && (
        <div className="mt-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Invoices
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Invoices generated for this job card.
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              No invoices have been created for this job card yet.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withClientAuth(JobCardDetailPage);
