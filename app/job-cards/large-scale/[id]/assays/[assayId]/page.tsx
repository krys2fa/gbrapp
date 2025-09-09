"use client";

import { withClientAuth } from "@/app/lib/with-client-auth";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import BackLink from "@/app/components/ui/BackLink";
import { formatDate } from "@/app/lib/utils";

interface AssayMeasurement {
  id: string;
  piece: number;
  barNumber: string;
  grossWeight: number;
  goldAssay: number;
  silverAssay: number;
  netGoldWeight: number;
  netSilverWeight: number;
}

interface Assay {
  id: string;
  method: string;
  pieces: number;
  signatory: string;
  dateOfAnalysis: string;
  totalNetGoldWeight: number;
  totalNetSilverWeight: number;
  totalNetGoldWeightOz: number;
  totalNetSilverWeightOz: number;
  totalGoldValue: number;
  totalSilverValue: number;
  totalCombinedValue: number;
  totalValueGhs: number;
  measurements: AssayMeasurement[];
  shipmentType?: {
    id: string;
    name: string;
  };
}

function AssayDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [assay, setAssay] = useState<Assay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const jobCardId = (params?.id as string) || "";
  const assayId = (params?.assayId as string) || "";

  useEffect(() => {
    const fetchAssay = async () => {
      if (!params?.id || !params?.assayId) return;

      try {
        const token = localStorage.getItem("auth-token");

        if (!token) {
          setError("Authentication required. Please log in again.");
          router.push("/login");
          return;
        }

        const response = await fetch(
          `/api/large-scale-job-cards/${params.id}/assays/${params.assayId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setAssay(data);
        } else if (response.status === 401) {
          // Token is invalid, clear it and redirect to login
          localStorage.removeItem("auth-token");
          localStorage.removeItem("auth-user");
          setError("Session expired. Please log in again.");
          router.push("/login");
        } else if (response.status === 404) {
          setError("Assay not found");
        } else {
          setError("Failed to load assay details");
        }
      } catch (error) {
        console.error("Error fetching assay:", error);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchAssay();
  }, [params?.id, params?.assayId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !assay) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BackLink
            href={`/job-cards/large-scale/${jobCardId}`}
            label="Back to Job Card"
          />
          <div className="mt-8">
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">
                {error || "Assay not found"}
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
          href={`/job-cards/large-scale/${jobCardId}`}
          label="Back to Job Card"
        />

        <div className="mt-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Assay Details
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Valuation results for assay #{assay.id.slice(-8)}
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/job-cards/large-scale/${jobCardId}/assays/${assayId}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Edit Assay
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          {/* Assay Summary */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Assay Summary
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Method</dt>
                  <dd className="mt-1 text-sm text-gray-900">{assay.method}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Date of Analysis
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(new Date(assay.dateOfAnalysis))}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Signatory
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {assay.signatory}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Total Pieces
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{assay.pieces}</dd>
                </div>
              </div>
            </div>
          </div>

          {/* Valuation Results */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Valuation Results
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <dt className="text-sm font-medium text-yellow-800">
                    Gold Weight (oz)
                  </dt>
                  <dd className="mt-1 text-2xl font-semibold text-yellow-900">
                    {assay.totalNetGoldWeightOz?.toFixed(3)}
                  </dd>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <dt className="text-sm font-medium text-gray-800">
                    Silver Weight (oz)
                  </dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {assay.totalNetSilverWeightOz?.toFixed(3)}
                  </dd>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <dt className="text-sm font-medium text-green-800">
                    Gold Value (USD)
                  </dt>
                  <dd className="mt-1 text-2xl font-semibold text-green-900">
                    ${assay.totalGoldValue?.toLocaleString()}
                  </dd>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <dt className="text-sm font-medium text-blue-800">
                    Silver Value (USD)
                  </dt>
                  <dd className="mt-1 text-2xl font-semibold text-blue-900">
                    ${assay.totalSilverValue?.toLocaleString()}
                  </dd>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg sm:col-span-2">
                  <dt className="text-sm font-medium text-indigo-800">
                    Total Value (USD)
                  </dt>
                  <dd className="mt-1 text-3xl font-bold text-indigo-900">
                    ${assay.totalCombinedValue?.toLocaleString()}
                  </dd>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg sm:col-span-2">
                  <dt className="text-sm font-medium text-purple-800">
                    Total Value (GHS)
                  </dt>
                  <dd className="mt-1 text-3xl font-bold text-purple-900">
                    ₵{assay.totalValueGhs?.toLocaleString()}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          {/* Measurements Table */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Measurements ({assay.measurements?.length || 0} pieces)
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Piece
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bar Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gross Weight
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gold Assay (%)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Net Gold Weight
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Silver Assay (%)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Net Silver Weight
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assay.measurements?.map((measurement) => (
                      <tr key={measurement.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {measurement.piece}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {measurement.barNumber || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {measurement.grossWeight?.toFixed(4)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {measurement.goldAssay?.toFixed(4)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {measurement.netGoldWeight?.toFixed(4)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {measurement.silverAssay?.toFixed(4)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {measurement.netSilverWeight?.toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withClientAuth(AssayDetailPage);
