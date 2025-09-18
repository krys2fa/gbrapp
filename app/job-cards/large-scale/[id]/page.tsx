"use client";

import { withClientAuth } from "@/app/lib/with-client-auth";
import { formatDate } from "@/app/lib/utils";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import BackLink from "@/app/components/ui/BackLink";
import toast from "react-hot-toast";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

interface LargeScaleJobCard {
  id: string;
  referenceNumber: string;
  receivedDate: string;
  exporter: {
    id: string;
    name: string;
    exporterType: {
      id: string;
      name: string;
    };
    // Consignee Information
    consigneeAddress?: string;
    consigneeTelephone?: string;
    consigneeMobile?: string;
    consigneeEmail?: string;
    // Exporter Details
    deliveryLocation?: string;
    exporterTelephone?: string;
    exporterEmail?: string;
    exporterWebsite?: string;
    exporterLicenseNumber?: string;
    // Notified Party Information
    notifiedPartyName?: string;
    notifiedPartyAddress?: string;
    notifiedPartyEmail?: string;
    notifiedPartyContactPerson?: string;
    notifiedPartyTelephone?: string;
    notifiedPartyMobile?: string;
  };
  unitOfMeasure: string;
  status: string;
  notes: string;
  destinationCountry: string;
  sourceOfGold: string;
  numberOfBoxes: number;
  customsOfficer?: {
    id: string;
    name: string;
    badgeNumber: string;
  };
  assayOfficer?: {
    id: string;
    name: string;
    badgeNumber: string;
  };
  technicalDirector?: {
    id: string;
    name: string;
    badgeNumber: string;
  };
  nacobOfficer?: {
    id: string;
    name: string;
    badgeNumber: string;
  };
  nationalSecurityOfficer?: {
    id: string;
    name: string;
    badgeNumber: string;
  };
  assays?: {
    id: string;
    method: string;
    pieces: number;
    signatory: string;
    comments?: string;
    shipmentType?: {
      id: string;
      name: string;
      description: string;
    };
    securitySealNo?: string;
    goldbodSealNo?: string;
    customsSealNo?: string;
    shipmentNumber?: string;
    dateOfAnalysis: string;
    dataSheetDates?: string;
    sampleBottleDates?: string;
    numberOfSamples: number;
    numberOfBars: number;
    sampleType: string;
    exchangeRate?: number;
    commodityPrice?: number;
    pricePerOz?: number;
    totalNetGoldWeight?: number;
    totalNetSilverWeight?: number;
    totalNetGoldWeightOz?: number;
    totalNetSilverWeightOz?: number;
    totalGoldValue?: number;
    totalSilverValue?: number;
    totalCombinedValue?: number;
    totalValueGhs?: number;
    measurements: {
      id: string;
      piece: number;
      barNumber?: string;
      grossWeight?: number;
      goldAssay?: number;
      netGoldWeight?: number;
      silverAssay?: number;
      netSilverWeight?: number;
    }[];
  }[];
  invoices?: {
    id: string;
    invoiceNumber: string;
    amount: number;
    currency: {
      symbol: string;
    };
    status: string;
    issueDate: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

function LargeScaleJobCardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [jobCard, setJobCard] = useState<LargeScaleJobCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const id = (params?.id as string) || "";

  useEffect(() => {
    const fetchJobCard = async () => {
      if (!params?.id) return;

      try {
        const response = await fetch(`/api/large-scale-job-cards/${params.id}`);

        if (response.ok) {
          const data = await response.json();
          setJobCard(data);
        } else if (response.status === 404) {
          setError("Large scale job card not found");
        } else {
          setError("Failed to load job card details");
        }
      } catch (error) {
        console.error("Error fetching job card:", error);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchJobCard();
  }, [params?.id]);

  const handleGenerateInvoice = async () => {
    if (!jobCard) return;

    setGeneratingInvoice(true);
    toast.loading("Generating invoice...", { id: "invoice-generation" });

    try {
      const token = localStorage.getItem("auth-token");

      if (!token) {
        toast.dismiss("invoice-generation");
        toast.error("Authentication required. Please log in again.");
        router.push("/login");
        return;
      }

      const response = await fetch(
        `/api/large-scale-job-cards/${jobCard.id}/invoices`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            jobCardId: jobCard.id,
          }),
        }
      );

      if (response.ok) {
        const newInvoice = await response.json();
        // Update the job card state to include the new invoice
        setJobCard((prev) =>
          prev
            ? {
                ...prev,
                invoices: [newInvoice],
              }
            : null
        );
        toast.dismiss("invoice-generation");
        toast.success("Invoice generated successfully!");
      } else if (response.status === 401) {
        // Token is invalid, clear it and redirect to login
        localStorage.removeItem("auth-token");
        localStorage.removeItem("auth-user");
        toast.dismiss("invoice-generation");
        toast.error("Session expired. Please log in again.");
        router.push("/login");
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job card details...</p>
        </div>
      </div>
    );
  }

  if (error || !jobCard) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BackLink
            href="/job-cards/large-scale"
            label="Back to Large Scale Job Cards"
          />
          <div className="mt-8">
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">
                {error || "Job card not found"}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackLink
          href="/job-cards/large-scale"
          label="Back to Large Scale Job Cards"
        />

        <div className="mt-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Large Scale Job Card Details
              </h1>
              {/* <p className="mt-2 text-sm text-gray-600">
                Reference: {jobCard.referenceNumber}
              </p> */}
            </div>
            <div className="flex gap-3">
              <Link
                href={`/job-cards/large-scale/${jobCard.id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Edit
              </Link>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  jobCard.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : jobCard.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {jobCard.status}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          {/* Basic Information */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Reference Number
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {jobCard.referenceNumber}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Received Date
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(jobCard.receivedDate).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Exporter
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {jobCard.exporter.name} (
                    {jobCard.exporter.exporterType.name})
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Unit of Measure
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {jobCard.unitOfMeasure}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">
                    {jobCard.status}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Source of Gold
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {jobCard.sourceOfGold}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Additional Information
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Destination Country
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {jobCard.destinationCountry || "Not specified"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Number of Boxes
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {jobCard.numberOfBoxes || "Not specified"}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          {/* Valuation Section: only show after valuation (assays) exist */}
          {jobCard && jobCard.assays && jobCard.assays.length > 0 ? (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Valuation
                </h3>
                <div className="flex items-center gap-3">
                  {jobCard?.assays && jobCard.assays.length > 0 && (
                    <>
                      <Link
                        href={`/job-cards/large-scale/${id}/assays/${jobCard.assays[0].id}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        <DocumentTextIcon className="w-4 h-4 mr-2" />
                        Assay Results
                      </Link>
                      <Link
                        href={`/job-cards/large-scale/${id}/assays/certificate`}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        <DocumentTextIcon className="w-4 h-4 mr-2" />
                        Certificate of Assay
                      </Link>
                    </>
                  )}
                </div>
              </div>
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {jobCard.assays.map((assay: any) => (
                    <li key={assay.id}>
                      <Link
                        href={`/job-cards/large-scale/${id}/assays/${assay.id}`}
                      >
                        <div className="block hover:bg-gray-50">
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-indigo-600 truncate">
                                Assay #{assay.id.slice(-8)}
                              </p>
                              <div className="ml-2 flex-shrink-0 flex">
                                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Gold:{" "}
                                  {assay.totalNetGoldWeightOz?.toFixed(3) ||
                                    "N/A"}{" "}
                                  oz | Silver:{" "}
                                  {assay.totalNetSilverWeightOz?.toFixed(3) ||
                                    "N/A"}{" "}
                                  oz
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 sm:flex sm:justify-between">
                              <div className="sm:flex">
                                <p className="flex items-center text-sm text-gray-500">
                                  Analysis Date:{" "}
                                  {formatDate(new Date(assay.dateOfAnalysis))}
                                </p>
                              </div>
                              <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                <p>
                                  Total Value: $
                                  {assay.totalCombinedValue?.toLocaleString() ||
                                    "N/A"}
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
                  href={`/job-cards/large-scale/${id}/assays/new`}
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
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Invoices
                </h3>
                {jobCard.invoices && jobCard.invoices.length > 0 ? (
                  <Link
                    href={`/job-cards/large-scale/${id}/invoices/${jobCard.invoices[0].id}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
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
                        <Link
                          href={`/job-cards/large-scale/${id}/invoices/${invoice.id}`}
                        >
                          <div className="block hover:bg-gray-50">
                            <div className="px-4 py-4 sm:px-6">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-indigo-600 truncate">
                                  Invoice #{invoice.invoiceNumber}
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
                                    Amount: GHS
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
      </div>
    </div>
  );
}

export default withClientAuth(LargeScaleJobCardDetailPage);
