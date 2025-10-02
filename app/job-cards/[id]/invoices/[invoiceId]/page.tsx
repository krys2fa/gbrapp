import React from "react";
import HistoryBackLink from "@/app/components/ui/HistoryBackLink";
import { prisma } from "@/app/lib/prisma";
import InvoiceActions from "@/app/job-cards/[id]/invoices/InvoiceActions"; // client component

function formatCurrency(value: number | null | undefined, code = "GHS") {
  const v = Number(value || 0);
  return (
    `${code} ` +
    v.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function formatDate(d?: Date | string | null) {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function InvoicePage(props: any) {
  // `params` may be a promise in Next.js server components; await before using
  const { id: jobCardId, invoiceId } = (await props.params) as {
    id: string;
    invoiceId: string;
  };

  // Load the invoice and only the related fields needed for rendering (defensive)
  let invoice: any = null;
  try {
    invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        invoiceNumber: true,
        jobCardId: true,
        assayUsdValue: true,
        assayGhsValue: true,
        amount: true,
        rate: true,
        issueDate: true,
        createdAt: true,
        notes: true,
        // Include calculated fields
        grandTotal: true,
        subTotal: true,
        covid: true,
        getfund: true,
        nhil: true,
        rateCharge: true,
        totalInclusive: true,
        totalExclusive: true,
        vat: true,
        exchangeRate: true,
        currency: { select: { id: true, code: true, symbol: true } },
        invoiceType: { select: { id: true, name: true, description: true } },
        assays: {
          select: {
            id: true,
            certificateNumber: true,
            assayDate: true,
            comments: true,
            totalUsdValue: true,
            totalGhsValue: true,
            measurements: true,
          },
        },
        jobCard: {
          select: {
            id: true,
            referenceNumber: true,
            destinationCountry: true,
            exporter: { select: { id: true, name: true } },
          },
        },
        largeScaleJobCard: {
          select: {
            id: true,
            referenceNumber: true,
            destinationCountry: true,
            exporter: { select: { id: true, name: true } },
          },
        },
      },
    });
  } catch (e) {
    // Log error server-side but don't expose to client
    return (
      <div className="max-w-4xl mx-auto py-2 px-4">
        <p>Failed to load invoice data. Please try again later.</p>
        <HistoryBackLink label="Back" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-4xl mx-auto py-2 px-4">
        <p>Invoice not found.</p>
        <HistoryBackLink label="Back" />
      </div>
    );
  }

  // Use stored values from database
  const assayUsdValue = invoice.assayUsdValue || 0;
  const assayGhsValue = invoice.assayGhsValue || 0;
  const exchangeRate = invoice.exchangeRate || 0;

  // Use calculated values from database
  const grandTotal = invoice.grandTotal || 0;
  const subTotal = invoice.subTotal || 0;
  const covid = invoice.covid || 0;
  const getfund = invoice.getfund || 0;
  const nhil = invoice.nhil || 0;
  const rate = invoice.rate || 0;
  const totalInclusive = invoice.totalInclusive || 0;
  const totalExclusive = invoice.totalExclusive || 0;
  const vat = invoice.vat || 0;

  // Assay number(s): join certificate numbers of linked assays if present
  const assayNumbers =
    (invoice.assays || [])
      .map((a: any) =>
        a.certificateNumber
          ? `ASSY${a.certificateNumber.replace(/cert/gi, "")}`
          : null
      )
      .filter(Boolean)
      .join(", ") || "-";

  // Determine which job card type this invoice belongs to
  const jobCardData = invoice.jobCard || invoice.largeScaleJobCard;
  const exporterName =
    jobCardData?.exporter?.name && jobCardData?.exporter?.exporterCode
      ? `${jobCardData.exporter.name}`
      : jobCardData?.exporter?.name || "-";
  const destinationCountry = jobCardData?.destinationCountry || "-";
  const referenceNumber =
    jobCardData?.referenceNumber ||
    invoice.jobCardId ||
    invoice.largeScaleJobCardId ||
    jobCardId;

  // derive signatory info from first linked assay if available
  const firstAssay: any =
    invoice.assays && invoice.assays.length > 0 ? invoice.assays[0] : null;
  const signatoryName =
    firstAssay?.signatory || firstAssay?.comments?.signatory || null;
  const signatoryPosition =
    firstAssay?.comments?.signatoryPosition ||
    firstAssay?.comments?.designation ||
    null;

  return (
    <>
      <div className="my-4 ml-4">
        <HistoryBackLink label="Back" />
      </div>
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="flex items-center justify-end mb-6">
          {/* Client actions: back + download */}
          <InvoiceActions
            jobCardId={jobCardId}
            signatoryName={signatoryName}
            signatoryPosition={signatoryPosition}
          />
        </div>

        <div
          className="bg-white shadow rounded-lg p-6 watermark-container"
          id="invoice-content"
        >
          <div className="flex items-center justify-between mb-1 py-2">
            <div className="p-2">
              <img
                src="/goldbod-logo-black.png"
                alt="GoldBod Logo"
                className="h-12 w-auto"
              />
            </div>

            <div className="flex justify-center">
              <div className="title-section uppercase mx-auto text-center">
                <p className="font-bold text-2xl">ASSAY INVOICE</p>
                <p className="text-sm">SMALL SCALE OPERATIONS</p>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="mt-6 flex justify-end">
              <div className="flex items-center">
                {(() => {
                  // Calculate total weight from all assay measurements
                  const totalWeight = (invoice?.assays || []).reduce(
                    (assayAcc: number, assay: any) => {
                      return (
                        assayAcc +
                        (assay.measurements || []).reduce(
                          (acc: number, m: any) =>
                            acc + (Number(m.grossWeight) || 0),
                          0
                        )
                      );
                    },
                    0
                  );

                  // Create QR code data with job card information
                  const qrData = {
                    destination: invoice?.jobCard?.destinationCountry || "N/A",
                    weight:
                      totalWeight > 0 ? `${totalWeight.toFixed(4)} g` : "N/A",
                    dateOfAnalysis: invoice?.assays?.[0]?.assayDate
                      ? new Date(invoice.assays[0].assayDate)
                          .toISOString()
                          .split("T")[0]
                      : "N/A",
                    exporter: invoice?.jobCard?.exporter?.name || "N/A",
                    countryOfOrigin: "N/A", // Not available in invoice data
                    jobCardId: invoice?.jobCard?.referenceNumber || "N/A",
                    invoiceNumber: invoice?.invoiceNumber || "N/A",
                  };

                  return (
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(
                        JSON.stringify(qrData)
                      )}`}
                      alt="QR Code - Job Card Information"
                      className="w-16 h-16"
                    />
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="flex justify-end mb-6">
            <p className="text-sm font-medium text-gray-500">Date:</p>
            <p className="text-sm font-semibold text-gray-900 ml-2">
              {formatDate(invoice.issueDate || invoice.createdAt)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* <div className="flex text-right justify-end pr-0 mr-0">
              <p className="text-sm text-gray-500">Assay Number:</p>
              <p className="text-sm ml-1">{assayNumbers}</p>
            </div> */}
            <div className="flex">
              <p className="text-sm font-medium text-gray-500">Exporter:</p>
              <p className="text-sm font-semibold text-gray-900 ml-2">
                {exporterName}
              </p>
            </div>

            <div className="flex text-right pr-0 mr-0 justify-end">
              <p className="text-sm font-medium text-gray-500">Job Card ID:</p>
              <p className="text-sm font-semibold text-gray-900 ml-1">
                {referenceNumber}
              </p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="flex">
              <p className="text-sm font-medium text-gray-500">
                Exchange Rate:
              </p>
              <p className="text-sm font-semibold text-gray-900 ml-2">
                {exchangeRate}
              </p>
            </div>

            <div className="flex text-right pr-0 mr-0 justify-end">
              <p className="text-sm font-medium text-gray-500">Destination:</p>
              <p className="text-sm font-semibold text-gray-900 ml-1">
                {destinationCountry}
              </p>
            </div>
          </div>

          {/* <div className="flex">
            <p className="text-sm text-gray-500">Exchange Rate</p>
            <p className="text-sm ml-2">{exchangeRate}</p>
          </div> */}

          <table className="w-full mt-2 mb-6 table-auto border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 items-center text-sm font-medium text-gray-700 border border-gray-300">
                  Description
                </th>
                <th className="py-3 px-4 items-center text-sm font-medium text-gray-700 border border-gray-300">
                  Assay value ($)
                </th>
                <th className="py-3 px-4 items-center text-sm font-medium text-gray-700 border border-gray-300">
                  Assay value (GHS)
                </th>
                <th className="py-3 px-4 items-center text-sm font-medium text-gray-700 border border-gray-300">
                  Rate (%)
                </th>
                <th className="py-3 px-4 items-center text-sm font-medium text-gray-700 border border-gray-300">
                  Total (Inclusive)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 px-4 font-medium items-center border border-gray-300">
                  Assay Service Fee
                </td>
                <td className="py-2 px-4 font-medium text-right border border-gray-300">
                  {assayUsdValue.toLocaleString()}
                </td>
                <td className="py-2 px-4 font-medium text-right border border-gray-300">
                  {assayGhsValue.toLocaleString()}
                </td>
                <td className="py-2 px-4 font-medium text-right border border-gray-300">
                  {rate.toLocaleString()}
                </td>
                <td className="py-2 px-4 font-medium text-right border border-gray-300">
                  {totalInclusive.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mb-4">
            {/* <h3 className="text-sm font-medium mb-2 text-center">
              Total - Exclusive (GHS)
            </h3> */}
            <div className="grid grid-cols-2 gap-2 text-sm mb-2">
              <div className="text-gray-600 text">Total - Exclusive</div>
              <div className="font-medium text-right">
                {formatCurrency(totalExclusive, "GHS")}
              </div>
            </div>
            <h3 className="text-sm font-medium mb-2 text-center">
              Levies & Taxes
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-600">NHIL (2.5%)</div>
              <div className="font-medium text-right">
                {formatCurrency(nhil, "GHS")}
              </div>
              <div className="text-gray-600">GETFund (2.5%)</div>
              <div className="font-medium text-right">
                {formatCurrency(getfund, "GHS")}
              </div>
              <div className="text-gray-600">COVID (1%)</div>
              <div className="font-medium text-right">
                {formatCurrency(covid, "GHS")}
              </div>

              <div className="text-gray-700 font-medium border-t border-gray-300 pt-2 mt-2">
                Subtotal
              </div>
              <div className="font-semibold text-right border-t border-gray-300 pt-2 mt-2">
                {formatCurrency(subTotal, "GHS")}
              </div>
              <div className="text-gray-600">VAT (15%)</div>
              <div className="font-medium text-right">
                {formatCurrency(vat, "GHS")}
              </div>
              <div className="text-gray-700 font-medium border-t border-gray-300 pt-2 mt-2">
                Total
              </div>
              <div className="font-semibold text-right border-t border-gray-300 pt-2 mt-2">
                {formatCurrency(grandTotal, "GHS")}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t text-left">
            <p className="text-lg font-bold flex justify-between">
              <span>Grand Total:</span> {formatCurrency(grandTotal, "GHS")}
            </p>
          </div>

          <div className="bg-white py-4 flex justify-end">
            <img src="/seal.png" alt="Seal" className="h-20 w-auto" />
          </div>
        </div>
      </div>
    </>
  );
}
