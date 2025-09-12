"use client";

import { withClientAuth } from "@/app/lib/with-client-auth";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/app/components/layout/header";
import { Receipt, CreditCard, FileText } from "lucide-react";
import { toast } from "react-hot-toast";

// temporary dummy data until backend wiring is available
// const DUMMY = [
//   {
//     id: "JC001",
//     reference: "REF-001",
//     exporter: "Acme Corp",
//     invoice: "INV-1001",
//     receipt: "RCPT-1001",
//     paymentDate: "2025-08-01",
//   },
//   {
//     id: "JC002",
//     reference: "REF-002",
//     exporter: "Beta Ltd",
//     invoice: "INV-1002",
//     receipt: "RCPT-1002",
//     paymentDate: "2025-08-05",
//   },
//   {
//     id: "JC003",
//     reference: "REF-003",
//     exporter: "Gamma Inc",
//     invoice: "INV-1003",
//     receipt: "RCPT-1003",
//     paymentDate: "2025-08-10",
//   },
// ];

function PaymentList() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [referenceFilter, setReferenceFilter] = useState("");
  const [invoiceFilter, setInvoiceFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    // load invoices from server
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("page", String(currentPage));
        params.append("limit", String(itemsPerPage));
        if (referenceFilter) params.append("reference", referenceFilter);
        if (invoiceFilter) params.append("invoice", invoiceFilter);
        if (startDateFilter) params.append("startDate", startDateFilter);
        if (endDateFilter) params.append("endDate", endDateFilter);
        const res = await fetch(`/api/invoices?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load invoices");
        const data = await res.json();
        // transform invoices into rows grouped by job card
        // Group invoices by job card and pick assay/wht invoices if present
        const map = new Map();
        (data.invoices || []).forEach((inv: any) => {
          // Handle both regular and large scale job cards
          const jcId =
            inv.jobCardId ||
            inv.largeScaleJobCardId ||
            inv.jobCard?.id ||
            inv.largeScaleJobCard?.id ||
            "unknown";
          const jobCard = inv.jobCard || inv.largeScaleJobCard;

          if (!map.has(jcId)) {
            map.set(jcId, {
              id: jcId,
              reference: jobCard?.referenceNumber || jcId,
              exporter: jobCard?.exporter?.name || "-",
              assayInvoiceId: null,
              assayInvoiceNumber: null,
              assayInvoice: null,
              whtInvoiceId: null,
              whtInvoiceNumber: null,
              whtInvoice: null,
              paymentDate: inv.issueDate || inv.createdAt,
              isLargeScale: !!inv.largeScaleJobCardId, // Flag to identify large scale job cards
            });
          }
          const row = map.get(jcId);
          const typeName = inv.invoiceType?.name?.toLowerCase() || "";
          if (typeName.includes("assay") || typeName.includes("valuation")) {
            row.assayInvoiceId = inv.id;
            row.assayInvoiceNumber = inv.invoiceNumber || inv.id;
            row.assayInvoice = inv;
          } else if (
            typeName.includes("wht") ||
            typeName.includes("withholding")
          ) {
            row.whtInvoiceId = inv.id;
            row.whtInvoiceNumber = inv.invoiceNumber || inv.id;
            row.whtInvoice = inv;
          } else {
            // fallback: assign to assay if none set
            if (!row.assayInvoiceId) {
              row.assayInvoiceId = inv.id;
              row.assayInvoiceNumber = inv.invoiceNumber || inv.id;
              row.assayInvoice = inv;
            }
          }
          // keep latest paymentDate
          const pd = inv.issueDate || inv.createdAt;
          if (pd && new Date(pd) > new Date(row.paymentDate))
            row.paymentDate = pd;
          map.set(jcId, row);
        });

        const rows = Array.from(map.values());
        setItems(rows);
        // fetch fees for these job cards to display receipt numbers
        try {
          const regularJobCardIds = rows
            .filter((r: any) => !r.isLargeScale)
            .map((r: any) => r.id)
            .filter(Boolean)
            .join(",");
          const largeScaleJobCardIds = rows
            .filter((r: any) => r.isLargeScale)
            .map((r: any) => r.id)
            .filter(Boolean)
            .join(",");

          // Fetch fees for both types of job cards
          const feePromises = [];
          if (regularJobCardIds) {
            feePromises.push(
              fetch(`/api/fees?jobCardIds=${regularJobCardIds}`)
            );
          }
          if (largeScaleJobCardIds) {
            feePromises.push(
              fetch(`/api/fees?largeScaleJobCardIds=${largeScaleJobCardIds}`)
            );
          }

          if (feePromises.length > 0) {
            const feeResponses = await Promise.all(feePromises);
            const latestByJob: Record<string, any> = {};

            for (const feeRes of feeResponses) {
              if (feeRes.ok) {
                const feesData = await feeRes.json();
                (feesData.fees || []).forEach((f: any) => {
                  const jobCardId = f.jobCardId || f.largeScaleJobCardId;
                  if (!latestByJob[jobCardId]) latestByJob[jobCardId] = f;
                  else if (
                    new Date(f.paymentDate) >
                    new Date(latestByJob[jobCardId].paymentDate)
                  )
                    latestByJob[jobCardId] = f;
                });
              }
            }

            // merge receipt numbers into rows
            rows.forEach((r: any) => {
              const fee = latestByJob[r.id];
              if (fee) r.receipt = fee.receiptNumber || r.receipt || "";
            });
            setItems(rows);
          }
        } catch (feeErr) {
          console.debug("Failed to fetch fees for receipts", feeErr);
        }
        // fetch any existing fees for the displayed job cards to show receipt numbers
        try {
          const ids = rows
            .map((r: any) => r.id)
            .filter(Boolean)
            .join(",");
          if (ids) {
            const feeRes = await fetch(`/api/fees?jobCardIds=${ids}`);
            if (feeRes.ok) {
              const feeData = await feeRes.json();
              const fees: any[] = feeData.fees || [];
              const latestByJob: Record<string, any> = {};
              fees.forEach((f) => {
                if (!latestByJob[f.jobCardId]) latestByJob[f.jobCardId] = f;
              });
              // attach receipt into rows
              const rowsWithReceipt = rows.map((r: any) => ({
                ...r,
                receipt:
                  latestByJob[r.id]?.receiptNumber || r.receipt || undefined,
              }));
              setItems(rowsWithReceipt);
            }
          }
        } catch (e) {
          // ignore
        }
        const total = data.total || 0;
        setTotalCount(total);
        setTotalPages(Math.max(1, Math.ceil(total / itemsPerPage)));
      } catch (e) {
        console.error(e);
        // setItems(DUMMY);
      } finally {
        setLoading(false);
      }
    })();
  }, [
    currentPage,
    referenceFilter,
    invoiceFilter,
    startDateFilter,
    endDateFilter,
    refreshKey,
  ]);

  const doSearch = () => {
    // trigger server-side search by resetting to page 1
    setCurrentPage(1);
    // effect will pick up filters and fetch
  };

  // Modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payType, setPayType] = useState<"assay" | "wht" | null>(null);
  const [payJobCardId, setPayJobCardId] = useState<string | null>(null);
  const [payInvoiceTotal, setPayInvoiceTotal] = useState<number | null>(null);
  const [payIsLargeScale, setPayIsLargeScale] = useState(false);

  function openPayModal(jobCardId: string, type: "assay" | "wht") {
    setPayJobCardId(jobCardId);
    setPayType(type);
    // find invoice total for this job card and type from items
    const row = items.find((it: any) => it.id === jobCardId);
    console.log(
      "Opening pay modal for jobCardId:",
      jobCardId,
      "row:",
      row,
      "isLargeScale:",
      row?.isLargeScale
    );
    let total = 0;
    if (row) {
      // prefer assayInvoice amount
      if (type === "assay" && row.assayInvoiceId && row.assayInvoice)
        total = Number(row.assayInvoice.amount || 0);
      if (type === "wht" && row.whtInvoiceId && row.whtInvoice)
        total = Number(row.whtInvoice.amount || 0);
    }
    setPayInvoiceTotal(total || null);
    setPayIsLargeScale(row?.isLargeScale || false);
    setShowPayModal(true);
  }

  async function submitPayment(payload: any) {
    console.log("Submitting payment with payload:", payload);
    try {
      const res = await fetch(`/api/fees`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to record payment");
      const data = await res.json();
      // close modal and refresh list
      setShowPayModal(false);
      setRefreshKey((k) => k + 1);
      toast.success("Payment recorded");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to save payment");
    }
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
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
              <label className="text-xs text-gray-600">Invoice #</label>
              <input
                value={invoiceFilter}
                onChange={(e) => setInvoiceFilter(e.target.value)}
                className="mt-1 border rounded px-2 py-1"
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
                onClick={doSearch}
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
                Invoice
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Receipt
              </th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                  <Link
                    href={
                      d.assayInvoiceId
                        ? d.isLargeScale
                          ? `/job-cards/large-scale/${d.id}/invoices/${d.assayInvoiceId}`
                          : `/job-cards/${d.id}/invoices/${d.assayInvoiceId}`
                        : d.whtInvoiceId
                        ? d.isLargeScale
                          ? `/job-cards/large-scale/${d.id}/invoices/${d.whtInvoiceId}`
                          : `/job-cards/${d.id}/invoices/${d.whtInvoiceId}`
                        : d.isLargeScale
                        ? `/job-cards/large-scale/${d.id}`
                        : `/job-cards/${d.id}`
                    }
                    className="hover:underline"
                  >
                    {d.reference}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {d.exporter || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex flex-col">
                    <span>Assay: {d.assayInvoiceNumber || "-"}</span>
                    <span>WHT: {d.whtInvoiceNumber || "-"}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {d.receipt || "-"}
                </td>
                {/* payment date column removed per request */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex gap-2 justify-end">
                    <Link
                      href={
                        d.assayInvoiceId
                          ? d.isLargeScale
                            ? `/job-cards/large-scale/${d.id}/invoices/${d.assayInvoiceId}`
                            : `/job-cards/${d.id}/invoices/${d.assayInvoiceId}`
                          : d.isLargeScale
                          ? `/job-cards/large-scale/${d.id}`
                          : `/job-cards/${d.id}`
                      }
                      className={`inline-flex items-center px-3 py-1 text-xs rounded ${
                        d.assayInvoiceId
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      <FileText className="h-4 w-4 mr-1" /> Assay Invoice
                    </Link>
                    {/* <Link
                      href={
                        d.whtInvoiceId
                          ? `/job-cards/${d.id}/invoices/${d.whtInvoiceId}`
                          : `/job-cards/${d.id}`
                      }
                      className={`inline-flex items-center px-3 py-1 text-xs rounded ${
                        d.whtInvoiceId
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      <FileText className="h-4 w-4 mr-1" /> WHT Invoice
                    </Link> */}
                    <button
                      onClick={() => openPayModal(d.id, "assay")}
                      className="inline-flex items-center px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                    >
                      <CreditCard className="h-4 w-4 mr-1" /> Pay Assay
                    </button>
                    {/* <button
                      onClick={() => openPayModal(d.id, "wht")}
                      className="inline-flex items-center px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
                    >
                      <Receipt className="h-4 w-4 mr-1" /> Pay WHT
                    </button> */}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pay modal(s) */}

      {/* Pagination controls (same layout as valuations) */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-medium">
                {totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, totalCount)}
              </span>{" "}
              of <span className="font-medium">{totalCount}</span> results
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
      {showPayModal && payJobCardId && payType && (
        <PayModal
          jobCardId={payJobCardId}
          type={payType}
          invoiceTotal={payInvoiceTotal}
          isLargeScale={payIsLargeScale}
          onClose={() => setShowPayModal(false)}
          onSubmit={submitPayment}
        />
      )}
    </div>
  );
}

function PayModal({
  jobCardId,
  type,
  invoiceTotal,
  isLargeScale,
  onClose,
  onSubmit,
}: {
  jobCardId: string;
  type: "assay" | "wht";
  invoiceTotal?: number | null;
  isLargeScale?: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [currencyId, setCurrencyId] = useState<string | undefined>(undefined);
  const [receiptNumber, setReceiptNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentType, setPaymentType] = useState<string>("cash");

  const handleSubmit = async () => {
    const payload = {
      ...(isLargeScale ? { largeScaleJobCardId: jobCardId } : { jobCardId }),
      feeType: type === "assay" ? "ASSAY_FEE" : "WHT_FEE",
      amount: Number(amount),
      currencyId,
      paymentDate: new Date().toISOString(),
      receiptNumber,
      notes,
      paymentType,
    };
    console.log("PayModal payload:", payload, "isLargeScale:", isLargeScale);
    await onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded shadow p-6 w-full max-w-md">
        <h3 className="text-lg font-medium mb-4">
          Pay {type === "assay" ? "Assay" : "WHT"} Fee
        </h3>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600">Receipt Number</label>
          <input
            value={receiptNumber}
            onChange={(e) => setReceiptNumber(e.target.value)}
            className="border rounded px-2 py-1"
          />

          <label className="text-sm text-gray-600">
            {type === "assay" ? "Invoice Total" : "WHT Total"}
          </label>
          <input
            type="text"
            readOnly
            value={invoiceTotal != null ? invoiceTotal.toLocaleString() : "-"}
            className="border rounded px-2 py-1 bg-gray-50"
          />

          <label className="text-sm text-gray-600">Enter Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border rounded px-2 py-1"
          />

          <label className="text-sm text-gray-600">Balance</label>
          <input
            type="text"
            readOnly
            value={(() => {
              const inv = invoiceTotal || 0;
              const paid = Number(amount) || 0;
              return (inv - paid).toLocaleString();
            })()}
            className="border rounded px-2 py-1 bg-gray-50"
          />

          <label className="text-sm text-gray-600">Payment Type</label>
          <select
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="cash">Cash</option>
            <option value="momo">MoMo</option>
            <option value="credit_card">Credit Card</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cheque">Cheque</option>
          </select>

          <label className="text-sm text-gray-600">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 border rounded">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-3 py-1 bg-indigo-600 text-white rounded"
          >
            Submit Payment
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentReceiptingPage() {
  return (
    <>
      <Header
        title="Payment & Receipting"
        icon={<CreditCard className="h-5 w-5" />}
        subtitle="Record payments and manage invoices."
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto"></div>
        </div>

        <div className="mt-6">
          <PaymentList />
        </div>
      </div>
    </>
  );
}

export default withClientAuth(PaymentReceiptingPage);
