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
    console.log("Failed to load invoice for invoice page:", e);
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
  const exporterName = jobCardData?.exporter?.name || "-";
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
      <div className="max-w-4xl mx-auto px-4">
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
          <div className="flex items-center justify-between mb-1">
            <div className="py-2">
              <img
                src="/goldbod-logo-green.png"
                alt="GoldBod Logo"
                className="h-12 w-auto"
              />
            </div>

            {/* <div className="bg-white p-4">
              <img
                src="/coat-of-arms.jpg"
                alt="Coat of Arms"
                className="h-20 w-auto"
              />
            </div> */}

            {/* <div className="bg-white p-4">
              <img src="/seal.png" alt="Seal" className="h-20 w-auto" />
            </div> */}
          </div>

          <div className="flex justify-center mb-4">
            <h1 className="text-xl font-bold tracking-wider">
              GOLD ASSAY INVOICE
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <span className="text-sm text-gray-500 mr-2">Client:</span>
              <span className="text-sm">{exporterName}</span>
            </div>

            <div>
              <span className="text-sm text-gray-500 mr-2">Date:</span>
              <span className="text-sm">
                {formatDate(invoice.issueDate || invoice.createdAt)}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500 mr-2">Job Number:</span>
              <span className="text-sm">{referenceNumber}</span>
            </div>

            <div>
              <span className="text-sm text-gray-500 mr-2">Assay Number:</span>
              <span className="text-sm">{assayNumbers}</span>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500 mr-2">Destination:</span>
              <span className="text-sm">{destinationCountry}</span>
            </div>

            <div>
              <span className="text-sm text-gray-500 mr-2">BoG Rate:</span>
              <span className="text-sm">{exchangeRate}</span>
            </div>
          </div>

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
            <div className="font-medium text-right mb-2">
              <span className="text-gray-600 text mr-12">Exclusive:</span>
              <span>{formatCurrency(totalExclusive, "GHS")}</span>
            </div>

            <div className="font-medium text-right mb-2">
              <span className="text-gray-600 mr-12">NHIL (2.5%):</span>
              <span>{formatCurrency(nhil, "GHS")}</span>
            </div>

            <div className="font-medium text-right mb-2">
              <span className="text-gray-600 mr-12">GETFund (2.5%):</span>
              <span>{formatCurrency(getfund, "GHS")}</span>
            </div>

            <div className="font-medium text-right mb-2">
              <span className="text-gray-600 mr-12">COVID (1%):</span>
              <span>{formatCurrency(covid, "GHS")}</span>
            </div>

            <div className="font-semibold text-right pt-2 mt-2 mb-2 ">
              <span className="mr-12">Sub Total:</span>
              <span>{formatCurrency(subTotal, "GHS")}</span>
            </div>

            <div className="font-medium text-right mb-2">
              <span className="text-gray-600 mr-12">VAT (15%):</span>
              <span>{formatCurrency(vat, "GHS")}</span>
            </div>

            <div className="font-semibold text-right mb-4 pb-2">
              <span className="text-gray-600 mr-12">Total:</span>
              <span>{formatCurrency(grandTotal, "GHS")}</span>
            </div>

            <div>
              <div className="text-right">
                <p className="font-bold text-gray-800">
                  <span className="mr-12">Grand Total:</span>
                  <span className="border-y border-gray-400 py-2 my-2">
                    {formatCurrency(grandTotal, "GHS")}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="my-6 flex justify-end">
            <div className="flex items-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(
                  "https://goldbod.gov.gh/"
                )}`}
                alt="QR Code - Visit GoldBod Website"
                className="w-16 h-16"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
