"use client";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Header } from "../../components/layout/header";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import BackLink from "@/app/components/ui/BackLink";
import { formatExchangeRate } from "@/app/lib/utils";
import { getWeekStart, formatWeekDisplay } from "@/app/lib/week-utils";

export default function PendingApprovalsPage() {
  const [pendingRates, setPendingRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadPendingRates();
  }, []);

  const loadPendingRates = async () => {
    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch("/api/weekly-prices/pending", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPendingRates(data);
      } else if (response.status === 403) {
        toast.error(
          "Access denied. Only super admins can view pending approvals."
        );
      } else {
        throw new Error("Failed to load pending rates");
      }
    } catch (error) {
      console.error("Error loading pending rates:", error);
      toast.error("Failed to load pending approvals");
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (
    rateId: string,
    action: "approve" | "reject",
    reason?: string
  ) => {
    setProcessingId(rateId);
    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(`/api/weekly-prices/${rateId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, ...(reason && { reason }) }),
      });

      if (response.ok) {
        const updatedRate = await response.json();
        toast.success(
          action === "approve"
            ? "Exchange rate approved successfully!"
            : "Exchange rate rejected successfully!"
        );

        // Remove from pending list
        setPendingRates((prev) => prev.filter((rate) => rate.id !== rateId));
      } else {
        throw new Error("Failed to process approval");
      }
    } catch (error) {
      console.error("Error processing approval:", error);
      toast.error("Failed to process approval");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "REJECTED":
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  if (loading) {
    return (
      <>
        <Header
          title="Pending Approvals"
          icon={<ClockIcon className="h-5 w-5" />}
          subtitle="Review and approve exchange rates"
        />
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="Pending Approvals"
        icon={<ClockIcon className="h-5 w-5" />}
        subtitle="Review and approve exchange rates"
      />
      <div className="my-6 px-4">
        <BackLink href="/setup" label="Back to Settings" />
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Exchange Rate Approvals
            </h3>

            {pendingRates.length === 0 ? (
              <div className="text-center py-8">
                <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No pending approvals
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  All exchange rates have been processed.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRates.map((rate) => (
                  <div
                    key={rate.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(rate.status)}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {rate.exchange?.name} ({rate.exchange?.symbol})
                          </h4>
                          <p className="text-sm text-gray-500">
                            Week of{" "}
                            {formatWeekDisplay(new Date(rate.weekStartDate))}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          {formatExchangeRate(rate.price)}
                        </div>
                        <div
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            rate.status
                          )}`}
                        >
                          {rate.status}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Submitted by: {rate.submittedByUser?.name || "Unknown"}{" "}
                        on {new Date(rate.createdAt).toLocaleDateString()}
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproval(rate.id, "approve")}
                          disabled={processingId === rate.id}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        >
                          {processingId === rate.id
                            ? "Processing..."
                            : "Approve"}
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt(
                              "Please provide a reason for rejection:"
                            );
                            if (reason && reason.trim()) {
                              handleApproval(rate.id, "reject", reason.trim());
                            }
                          }}
                          disabled={processingId === rate.id}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          {processingId === rate.id
                            ? "Processing..."
                            : "Reject"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
